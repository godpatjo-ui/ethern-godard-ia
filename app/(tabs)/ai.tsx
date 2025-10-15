import React, { useEffect, useMemo, useState } from "react";
import { StyleSheet, Text, View, Pressable, ActivityIndicator, ScrollView, Switch } from "react-native";
import * as SecureStore from "expo-secure-store";
import OpenAI from "openai";
import { usePreferredTheme } from "../../lib/theme";
import { gameOfTheDay, generateLocalGrids, validateGrid as validateLegacy } from "../../lib/games";

type Kind = "loto"|"euromillions"|"eurodreams";
type Grid =
  | { game:"loto"; main:number[]; chance:number }
  | { game:"euromillions"; main:number[]; stars:number[] }
  | { game:"eurodreams"; main:number[]; dream:number };

const KEY_STORAGE = "openai_api_key_secure";

// ---------- Analyse ----------
function analyze(g: Grid) {
  const main = g.main.slice().sort((a,b)=>a-b);
  const sum = main.reduce((s,n)=>s+n,0);
  const even = main.filter(n=>n%2===0).length;
  const spread = main[main.length-1]-main[0];
  const maxByGame = g.game==="loto"?49:g.game==="euromillions"?50:40;
  const low = main.filter(n=>n<=Math.floor(maxByGame/2)).length;
  const bonus = g.game==="loto"?`Chance: ${g.chance}`:g.game==="euromillions"?`Étoiles: ${(g as any).stars.join(", ")}`:`Dream: ${(g as any).dream}`;
  return `Somme ${sum} • ${even} pairs / ${main.length-even} impairs • Étendue ${spread} • Bas/Haut ${low}/${main.length-low} • ${bonus}`;
}

// ---------- Normalisation IA ----------
const pick = (...xs:any[]) => xs.find(v => v!==undefined && v!==null);
const normalizeGrid = (kind: Kind, g:any): Grid => {
  const main = (pick(g?.main, g?.numbers, g?.numeros, g?.values, g?.nums) || []).map(Number).sort((a:number,b:number)=>a-b);
  if (kind==="loto") {
    const chance = Number(pick(g?.chance, g?.bonus, g?.complementaire, g?.lucky, g?.chanceNumber));
    return { game:"loto", main, chance };
  }
  if (kind==="euromillions") {
    const stars = (pick(g?.stars, g?.etoiles, g?.starsNumbers) || []).map(Number).sort((a:number,b:number)=>a-b);
    return { game:"euromillions", main, stars };
  }
  const dream = Number(pick(g?.dream, g?.joker, g?.special, g?.dreamNumber));
  return { game:"eurodreams", main, dream };
};

// ---------- Validation avec raison (plus verbeuse que validateLegacy) ----------
function validateWithReason(kind: Kind, g: Grid): { ok: boolean; reason?: string } {
  const uniq = (arr:number[]) => Array.from(new Set(arr));
  if (kind==="loto") {
    const { main, chance } = g as any;
    if (!Array.isArray(main) || main.length!==5) return { ok:false, reason:"Loto: il faut 5 numéros" };
    if (uniq(main).length!==5) return { ok:false, reason:"Loto: numéros dupliqués" };
    if (main.some(n=>n<1||n>49)) return { ok:false, reason:"Loto: numéros hors 1..49" };
    if (!(Number.isInteger(chance) && chance>=1 && chance<=10)) return { ok:false, reason:"Loto: chance hors 1..10" };
    return { ok:true };
  }
  if (kind==="euromillions") {
    const { main, stars } = g as any;
    if (!Array.isArray(main) || main.length!==5) return { ok:false, reason:"EuroMillions: il faut 5 numéros" };
    if (uniq(main).length!==5) return { ok:false, reason:"EuroMillions: numéros dupliqués" };
    if (main.some(n=>n<1||n>50)) return { ok:false, reason:"EuroMillions: numéros hors 1..50" };
    if (!Array.isArray(stars) || stars.length!==2) return { ok:false, reason:"EuroMillions: il faut 2 étoiles" };
    if (uniq(stars).length!==2) return { ok:false, reason:"EuroMillions: étoiles dupliquées" };
    if (stars.some((s:number)=>s<1||s>12)) return { ok:false, reason:"EuroMillions: étoiles hors 1..12" };
    return { ok:true };
  }
  // eurodreams
  const { main, dream } = g as any;
  if (!Array.isArray(main) || main.length!==6) return { ok:false, reason:"EuroDreams: il faut 6 numéros" };
  if (uniq(main).length!==6) return { ok:false, reason:"EuroDreams: numéros dupliqués" };
  if (main.some(n=>n<1||n>40)) return { ok:false, reason:"EuroDreams: numéros hors 1..40" };
  if (!(Number.isInteger(dream) && dream>=1 && dream<=5)) return { ok:false, reason:"EuroDreams: dream hors 1..5" };
  return { ok:true };
}

// JSON robuste (enlève ```json, extrait le premier bloc {…})
const stripFences = (s:string) => s.replace(/```json|```/gi,"").trim();
const extractFirstJson = (s:string) => { const i=s.indexOf("{"), j=s.lastIndexOf("}"); return (i>=0 && j>i) ? s.slice(i,j+1) : s; };
const safeParseJson = (raw:string) => { let t=stripFences(raw); try{ return JSON.parse(t); }catch{} t=extractFirstJson(t); return JSON.parse(t); };

export default function AI() {
  const { effectiveScheme } = usePreferredTheme();
  const colors = useMemo(()=> effectiveScheme==="dark"
    ? { bg:"#000", text:"#fff", sub:"#c7c7c7", btn:"#2563eb", btnText:"#fff", err:"#fca5a5", card:"#0f172a", chip:"#1f2937", chipText:"#fff" }
    : { bg:"#fff", text:"#111", sub:"#555", btn:"#2563eb", btnText:"#fff", err:"#b91c1c", card:"#f3f4f6", chip:"#e5e7eb", chipText:"#111" }
  ,[effectiveScheme]);

  const [apiKey, setApiKey] = useState<string>("");
  useEffect(()=>{ (async()=>{ try{ const k=await SecureStore.getItemAsync(KEY_STORAGE); if(k) setApiKey(k); }catch{} })(); },[]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string|null>(null);
  const [errorDetails, setErrorDetails] = useState<string|null>(null);
  const [grids, setGrids] = useState<Grid[]|null>(null);
  const [source, setSource] = useState("");
  const [showAnalysis, setShowAnalysis] = useState(true);

  const normErr = (e:any) => {
    const status = e?.status || e?.response?.status || e?.code || null;
    const msg = e?.message || e?.error?.message || e?.response?.data?.error?.message || "Erreur inconnue";
    const type = e?.error?.type || e?.response?.data?.error?.type || null;
    return [status ? `HTTP ${status}` : null, type, msg].filter(Boolean).join(" — ");
  };

  async function requestAI(kind: Kind) {
    const today = new Date().toLocaleDateString("fr-FR",{weekday:"long", timeZone:"Europe/Paris"});
    const system = "Tu es un générateur strict. Tu renvoies UNIQUEMENT du JSON valide UTF-8, sans texte, sans balises.";
    const schema = kind==="loto"
      ? `{"game":"loto","grids":[{"main":[5 entiers uniques 1..49],"chance":1 entier 1..10}] (x5)}`
      : kind==="euromillions"
      ? `{"game":"euromillions","grids":[{"main":[5 entiers uniques 1..50],"stars":[2 entiers uniques 1..12]}] (x5)}`
      : `{"game":"eurodreams","grids":[{"main":[6 entiers uniques 1..40],"dream":1 entier 1..5}] (x5)}`;
    const spec = `Nous sommes ${today}. Jeu du jour: ${kind}.
Règles JSON STRICT: ${schema}
Clés acceptées:
- principaux: "main" OU "numbers"
- Loto: "chance" OU "bonus" OU "complementaire"
- EuroMillions: "stars" OU "etoiles"
Aucun texte ou commentaire en dehors du JSON.`;

    const client = new OpenAI({ apiKey, dangerouslyAllowBrowser: true });
    const res = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role:"system", content: system }, { role:"user", content: spec }],
      temperature: 0.1, // plus strict
      response_format: { type: "json_object" } as any,
      max_tokens: 400, // suffisant pour 5 grilles
    });
    const raw = (res.choices[0]?.message?.content || "").trim();
    const json = safeParseJson(raw);
    return json;
  }

  async function handleGenerate() {
    setLoading(true); setError(null); setErrorDetails(null); setGrids(null); setSource("");
    const kind = gameOfTheDay(new Date()) as Kind;

    try {
      let produced: Grid[] | null = null;
      if (apiKey) {
        // Auto-retry max 2 tentatives si invalide
        for (let attempt=1; attempt<=2 && !produced; attempt++) {
          try {
            const json = await requestAI(kind);
            if (json?.game === kind && Array.isArray(json?.grids)) {
              const mapped = json.grids.map((g:any)=> normalizeGrid(kind, g));
              const reasons: string[] = [];
              const okAll = mapped.length===5 &&
                mapped.every((gr) => {
                  const v = validateWithReason(kind, gr);
                  if (!v.ok) reasons.push(v.reason || "Invalide"); 
                  return v.ok;
                });
              if (okAll) {
                produced = mapped; setSource(`Source: OpenAI (${kind})`); break;
              } else {
                // feedback pour la 2e tentative
                if (attempt===1) {
                  console.log("[AI] Tentative 1 invalide →", reasons.join(" | "));
                }
              }
            } else {
              if (attempt===1) console.log("[AI] JSON non conforme (pas de game/grids)");
            }
          } catch (pe:any) {
            if (attempt===1) { setErrorDetails(normErr(pe)); }
          }
        }
      }

      if (!produced) {
        produced = generateLocalGrids(kind, 5) as Grid[];
        if (!source) setSource(`Source: Local (${kind})`);
        if (!error) setError("Réponse IA invalide (règles/structure)");
      }
      setGrids(produced);
    } catch (e:any) {
      setError("Erreur inattendue");
      setErrorDetails(normErr(e));
    } finally {
      setLoading(false);
    }
  }

  const Chip = ({children}:{children: React.ReactNode}) => (
    <View style={[styles.chip,{ backgroundColor: effectiveScheme==="dark" ? "#1f2937" : "#e5e7eb" }]}>
      <Text style={{ color: effectiveScheme==="dark" ? "#fff" : "#111", fontWeight:"700" }}>{children}</Text>
    </View>
  );

  return (
    <ScrollView style={{ backgroundColor: colors.bg }} contentContainerStyle={styles.container}>
      <Text style={[styles.title,{color:colors.text}]}>IA — Grilles du jour 🎰</Text>
      <Text style={[styles.subtitle,{color:colors.sub}]}>Génère 5 grilles selon le jeu du jour. Clé gérée automatiquement.</Text>

      <View style={{ flexDirection:"row", alignItems:"center", gap:10, marginTop:4 }}>
        <Switch value={showAnalysis} onValueChange={setShowAnalysis} />
        <Text style={{ color: colors.sub }}>Afficher l’analyse</Text>
      </View>

      <Pressable onPress={handleGenerate} style={[styles.button,{backgroundColor:colors.btn}]} disabled={loading}>
        <Text style={{ color: colors.btnText, fontWeight:"600" }}>
          {loading ? "Génération en cours..." : "Générer 5 grilles"}
        </Text>
      </Pressable>

      {loading && <ActivityIndicator size="large" style={{ marginTop: 16 }} />}
      {error && <Text style={{ color: colors.err, marginTop: 16, textAlign: "center" }}>{error}</Text>}
      {errorDetails && <Text style={{ color: colors.sub, marginTop: 6, textAlign: "center" }}>{errorDetails}</Text>}
      {source && <Text style={{ color: colors.sub, marginTop: 10, textAlign: "center" }}>{source}</Text>}

      {Array.isArray(grids) && (
        <View style={{ width:"100%", marginTop:16, gap:10 }}>
          {grids.map((g:Grid, i:number)=> (
            <View key={i} style={[styles.card,{backgroundColor:colors.card}]}>
              <Text style={{ color: colors.text, fontWeight:"700", marginBottom:6, textTransform:"capitalize" }}>{g.game}</Text>
              <View style={styles.row}>
                {g.main.map((n:number, idx:number)=><Chip key={`m-${i}-${idx}`}>{n}</Chip>)}
                {g.game==="loto" && <Chip>Chance {(g as any).chance}</Chip>}
                {g.game==="euromillions" && (g as any).stars.map((s:number,idx:number)=><Chip key={`s-${i}-${idx}`}>★ {s}</Chip>)}
                {g.game==="eurodreams" && <Chip>Dream {(g as any).dream}</Chip>}
              </View>
              {showAnalysis && <Text style={{ color: colors.sub, marginTop: 8 }}>{analyze(g)}</Text>}
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:{ padding:24, alignItems:"center", gap:12, minHeight:"100%" },
  title:{ fontSize:22, fontWeight:"bold", textAlign:"center" },
  subtitle:{ fontSize:13, textAlign:"center" },
  button:{ marginTop:8, paddingVertical:12, paddingHorizontal:18, borderRadius:12, minWidth:220, alignItems:"center" },
  card:{ padding:12, borderRadius:12 },
  row:{ flexDirection:"row", flexWrap:"wrap", gap:8 },
  chip:{ paddingVertical:6, paddingHorizontal:10, borderRadius:999 },
});
