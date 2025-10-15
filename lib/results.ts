import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "@results_cache_v1";

// ⚠️ Remplace par l'URL publique de TON results.json (GitHub Pages ou RAW GitHub)
const RESULTS_URL = "undefined";
// ou: "undefined"

export type LotoRow = { date:string; n1:number;n2:number;n3:number;n4:number;n5:number; chance:number };
export type EMRow   = { date:string; n1:number;n2:number;n3:number;n4:number;n5:number; e1:number;e2:number };
export type EDRRow  = { date:string; n1:number;n2:number;n3:number;n4:number;n5:number;n6:number; dream:number };

export type ResultsPayload = {
  loto: LotoRow[];
  euromillions: EMRow[];
  eurodreams: EDRRow[];
  updatedAt: string|null;
};

export async function fetchResults(): Promise<ResultsPayload> {
  try {
    const r = await fetch(RESULTS_URL, { headers: { "accept":"application/json" } });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const json = await r.json();
    await AsyncStorage.setItem(KEY, JSON.stringify(json));
    return json as ResultsPayload;
  } catch {
    const raw = await AsyncStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as ResultsPayload;
    return { loto:[], euromillions:[], eurodreams:[], updatedAt:null };
  }
}
