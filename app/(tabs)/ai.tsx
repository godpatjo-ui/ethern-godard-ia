import React, { useState } from "react";
import { View, Text, StyleSheet, Pressable, ScrollView } from "react-native";
import { usePreferredTheme } from "../../lib/theme";
import { generateLocalGrids } from "../../lib/games"; // <- correct
import type { Grid } from "../../core/types";

export default function AIScreen() {
  const { effectiveScheme } = usePreferredTheme();
  const isDark = effectiveScheme === "dark";

  const colors = isDark
    ? { bg: "#0b0b0b", text: "#fff", sub: "#c7c7c7", card: "#111827", chip: "#1f2937", chipText: "#fff", btn: "#2563eb", btnText: "#fff", err: "#fca5a5" }
    : { bg: "#fff", text: "#111", sub: "#555", card: "#f3f4f6", chip: "#e5e7eb", chipText: "#111", btn: "#2563eb", btnText: "#fff", err: "#b91c1c" };

  const [grids, setGrids] = useState<Grid[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<string>("");

  function onGenerate() {
    try {
      const kind: any = "loto"; // tu pourras remettre gameOfTheDay plus tard
      const produced = generateLocalGrids(kind, 5) as Grid[];
      setGrids(produced);
      setSource(`Source: Local (${kind})`);
      setError(null);
    } catch (e: any) {
      console.error("❌ Erreur lors de la génération :", e);
      setError(e?.message || "Une erreur inconnue est survenue");
    }
  }

  return (
    <ScrollView style={[styles.screen, { backgroundColor: colors.bg }]}>
      <Text style={[styles.title, { color: colors.text }]}>IA</Text>
      <Text style={[styles.subtitle, { color: colors.sub }]}>
        Génère des grilles locales (placeholder). On rebranchera OpenAI ensuite.
      </Text>

      <Pressable style={[styles.button, { backgroundColor: colors.btn }]} onPress={onGenerate}>
        <Text style={[styles.buttonText, { color: colors.btnText }]}>Générer 5 grilles</Text>
      </Pressable>

      {source ? <Text style={[styles.source, { color: colors.sub }]}>{source}</Text> : null}
      {error ? <Text style={{ color: colors.err, marginTop: 8 }}>Erreur : {error}</Text> : null}

      <View style={[styles.card, { backgroundColor: colors.card }]}>
        {grids.length === 0 ? (
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
