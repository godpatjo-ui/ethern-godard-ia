import React, { useState } from "react";
import { View, Text, StyleSheet, Pressable, ScrollView, ActivityIndicator } from "react-native";
import * as SecureStore from "expo-secure-store";
import { usePreferredTheme } from "../../lib/theme";
import { generateLocalGrids, validateGrid, gameOfTheDay } from "../../lib/games";

type Grid =
  | { game:"loto"; main:number[]; chance:number }
  | { game:"euromillions"; main:number[]; stars:number[] }
  | { game:"eurodreams"; main:number[]; dream:number };

const KEY_STORAGE = "openai_api_key_secure";

export default function AIScreen() {
  const { effectiveScheme } = usePreferredTheme();
  const isDark = effectiveScheme === "dark";
  const colors = isDark
    ? { bg:"#0b0b0b", text:"#fff", sub:"#c7c7c7", card:"#111827", chip:"#1f2937", chipText:"#fff", btn:"#2563eb", btnText:"#fff", err:"#fca5a5" }
    : { bg:"#fff", text:"#111", sub:"#555", card:"#f3f4f6", chip:"#e5e7eb", chipText:"#111", btn:"#2563eb", btnText:"#fff", err:"#b91c1c" };

  const [grids, setGrids] = useState<Grid[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const kind = gameOfTheDay(); // "loto" | "euromillions" | "eurodreams"

  function normalize(kind: "loto"|"euromillions"|"eurodreams", g: any): Grid {
    const main = (g?.main ?? g?.numbers ?? g?.nums ?? []).map(Number).sort((a:number,b:number)=>a-b);
    if (kind === "loto") {
      const chance = Number(g?.chance ?? g?.bonus ?? g?.complementaire);
      return { game:"loto", main, chance };
    }
    if (kind === "euromillions") {
      const stars = (g?.stars ?? g?.etoiles ?? []).map(Number).sort((a:number,b:number)=>a-b);
      return { game:"euromillions", main, stars };
    }
    const dream = Number(g?.dream ?? g?.joker);
    return { game:"eurodreams", main, dream };
  }

  async function requestOpenAI(k: string, kind: "loto"|"euromillions"|"eurodreams"): Promise<Grid[] | null> {
    // Appel direct à l’API (fetch) pour éviter les soucis d’SDK côté mobile
    const sys = `Tu renvoies STRICTEMENT du JSON compact, rien d'autre.
Schéma:
{ "game":"${kind}",
  "grids":[
    ${kind==="loto" ? `{ "main":[5 entiers 1-49], "chance": entier 1-10 }`
      : kind==="euromillions" ? `{ "main":[5 entiers 1-50], "stars":[2 entiers 1-12] }`
      : `{ "main":[6 entiers 1-40], "dream": entier 1-5 }`
    } x5
  ]
}`;
    const user = `Génère 5 grilles valides pour ${kind}. Uniquement du JSON.`;

    const r = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "authorization": `Bearer ${k}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        input: [
          { role: "system", content: sys },
          { role: "user", content: user }
        ]
      })
    });

    if (!r.ok) {
      const txt = await r.text().catch(()=> "");
      throw new Error(`OpenAI HTTP ${r.status}: ${txt.slice(0,200)}`);
    }

    const json = await r.json();
    // Selon l’API Responses, le texte est dans output_text ou content[0].text
    const raw =
      json?.output_text ??
      json?.output?.[0]?.content?.[0]?.text ??
      json?.content?.[0]?.text ??
      "";

    let parsed: any = null;
    try {
      parsed = JSON.parse(raw);
    } catch {
      // Essai “dirty” : extraire le plus gros bloc JSON
      const m = raw.match(/\{[\s\S]*\}/);
      if (m) parsed = JSON.parse(m[0]);
    }
    if (!parsed || !Array.isArray(parsed?.grids)) {
      throw new Error("Réponse IA sans champ 'grids'.");
    }

    const mapped = parsed.grids.map((g:any) => normalize(kind, g)) as Grid[];
    if (mapped.length === 5 && mapped.every(validateGrid)) {
      return mapped;
    }
    throw new Error("Grilles IA invalides (structure ou règles).");
  }

  async function onGenerate() {
    setLoading(true);
    setError(null);
    setSource("");
    try {
      const k = (await SecureStore.getItemAsync(KEY_STORAGE))?.trim() || "";
      if (k.startsWith("sk-")) {
        try {
          const ai = await requestOpenAI(k, kind);
          if (ai) {
            setGrids(ai);
            setSource("Source: OpenAI");
            setLoading(false);
            return;
          }
        } catch (e:any) {
          console.warn("[IA] échec, fallback local:", e?.message || e);
        }
      }
      // Fallback local
      const local = generateLocalGrids(kind, 5) as Grid[];
      setGrids(local);
      setSource(`Source: Local (${kind})`);
    } catch (e:any) {
      setError(e?.message || "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView style={[styles.screen, { backgroundColor: colors.bg }]}>
      <Text style={[styles.title, { color: colors.text }]}>IA</Text>
      <Text style={[styles.subtitle, { color: colors.sub }]}>
        Appel OpenAI si la clé (sk-…) est enregistrée, sinon fallback local.
      </Text>

      <Pressable style={[styles.button, { backgroundColor: colors.btn }]} onPress={onGenerate} disabled={loading}>
        <Text style={[styles.buttonText, { color: colors.btnText }]}>{loading ? "Génération en cours…" : "Générer 5 grilles"}</Text>
      </Pressable>

      {source ? <Text style={[styles.source, { color: colors.sub }]}>{source}</Text> : null}
      {error ? <Text style={{ color: colors.err, marginTop: 8 }}>Erreur : {error}</Text> : null}

      <View style={[styles.card, { backgroundColor: colors.card }]}>
        {loading ? (
          <ActivityIndicator />
        ) : grids.length === 0 ? (
          <Text style={{ color: colors.sub }}>Aucune grille pour l’instant.</Text>
        ) : (
          grids.map((g, idx) => (
            <View key={idx} style={styles.gridBlock}>
              <Text style={{ color: colors.text, fontWeight: "700", marginBottom: 6 }}>
                Grille #{idx + 1} — {g.game?.toUpperCase?.() || "?"}
              </Text>
              <View style={styles.row}>
                {(g as any).main?.map((n: number, i: number) => (
                  <View key={`m-${idx}-${i}-${n}`} style={[styles.chip, { backgroundColor: colors.chip }]}>
                    <Text style={{ color: colors.chipText, fontWeight: "700" }}>{n}</Text>
                  </View>
                ))}
                {"chance" in (g as any) && (g as any).chance ? (
                  <View style={[styles.chip, { backgroundColor: colors.chip }]}>
                    <Text style={{ color: colors.chipText, fontWeight: "700" }}>C {(g as any).chance}</Text>
                  </View>
                ) : null}
                {"stars" in (g as any) && Array.isArray((g as any).stars) ? (
                  (g as any).stars.map((s: number, i: number) => (
                    <View key={`s-${idx}-${i}-${s}`} style={[styles.chip, { backgroundColor: colors.chip }]}>
                      <Text style={{ color: colors.chipText, fontWeight: "700" }}>☆ {s}</Text>
                    </View>
                  ))
                ) : null}
                {"dream" in (g as any) && (g as any).dream ? (
                  <View style={[styles.chip, { backgroundColor: colors.chip }]}>
                    <Text style={{ color: colors.chipText, fontWeight: "700" }}>D {(g as any).dream}</Text>
                  </View>
                ) : null}
              </View>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: 16 },
  title: { fontSize: 24, fontWeight: "800", marginBottom: 6 },
  subtitle: { fontSize: 14, marginBottom: 16 },
  button: { alignSelf: "flex-start", paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10, marginBottom: 8 },
  buttonText: { fontSize: 16, fontWeight: "700" },
  source: { fontSize: 12, marginBottom: 10 },
  card: { borderRadius: 14, padding: 12 },
  gridBlock: { marginBottom: 12 },
  row: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 999 },
});
