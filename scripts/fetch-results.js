import fs from "fs";
import fetch from "node-fetch";

/**
 * Produit public/results.json :
 * {
 *   "loto":[ {date,n1..n5,chance}, ... ],
 *   "euromillions":[ {date,n1..n5,e1,e2}, ... ],
 *   "eurodreams":[ {date,n1..n6,dream}, ... ],
 *   "updatedAt":"..."
 * }
 *
 * Les URL sources sont passées par variables d'env :
 *  - LOTO_URL : JSON d'un (ou plusieurs) derniers tirages Loto
 *  - EM_URL   : JSON d'un (ou plusieurs) derniers tirages EuroMillions
 *  - ED_URL   : JSON d'un (ou plusieurs) derniers tirages EuroDreams
 *
 * Format attendu de chaque objet source :
 *  Loto        { date:"YYYY-MM-DD", main:[5], chance:number }
 *  EuroMillions{ date:"YYYY-MM-DD", main:[5], stars:[2] }
 *  EuroDreams  { date:"YYYY-MM-DD", main:[6], dream:number }
 */

const LOTO_URL = process.env.LOTO_URL || "";
const EM_URL   = process.env.EM_URL   || "";
const ED_URL   = process.env.ED_URL   || "";

async function safeGetJson(url) {
  if (!url) return null;
  try {
    const r = await fetch(url, { headers: { "accept":"application/json" } });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return await r.json();
  } catch (e) {
    console.error("[fetch]", url, "=>", e.message);
    return null;
  }
}

const toArray = (x) => Array.isArray(x) ? x : (x ? [x] : []);
const validInt = (x) => Number.isInteger(x);

function mapLoto(entry) {
  return {
    date: entry?.date,
    n1: entry?.main?.[0], n2: entry?.main?.[1], n3: entry?.main?.[2], n4: entry?.main?.[3], n5: entry?.main?.[4],
    chance: entry?.chance
  };
}
function mapEM(entry) {
  return {
    date: entry?.date,
    n1: entry?.main?.[0], n2: entry?.main?.[1], n3: entry?.main?.[2], n4: entry?.main?.[3], n5: entry?.main?.[4],
    e1: entry?.stars?.[0], e2: entry?.stars?.[1],
  };
}
function mapED(entry) {
  return {
    date: entry?.date,
    n1: entry?.main?.[0], n2: entry?.main?.[1], n3: entry?.main?.[2], n4: entry?.main?.[3], n5: entry?.main?.[4], n6: entry?.main?.[5],
    dream: entry?.dream
  };
}

const allInts = (arr) => arr.every(validInt);

function mergeByDate(oldArr=[], newArr=[]) {
  const byDate = (a) => Object.fromEntries(a.map(x => [x.date, x]));
  const out = { ...byDate(oldArr), ...byDate(newArr) };
  return Object.values(out).filter(x=>x?.date).sort((a,b)=> a.date < b.date ? -1 : 1);
}

async function main() {
  const lotoRaw = await safeGetJson(LOTO_URL);
  const emRaw   = await safeGetJson(EM_URL);
  const edRaw   = await safeGetJson(ED_URL);

  const loto = toArray(lotoRaw).map(mapLoto)
    .filter(e => e.date && allInts([e.n1,e.n2,e.n3,e.n4,e.n5,e.chance]));
  const euromillions = toArray(emRaw).map(mapEM)
    .filter(e => e.date && allInts([e.n1,e.n2,e.n3,e.n4,e.n5,e.e1,e.e2]));
  const eurodreams = toArray(edRaw).map(mapED)
    .filter(e => e.date && allInts([e.n1,e.n2,e.n3,e.n4,e.n5,e.n6,e.dream]));

  let prev = { loto: [], euromillions: [], eurodreams: [] };
  try { prev = JSON.parse(fs.readFileSync("public/results.json","utf8")); } catch {}

  const out = {
    loto: mergeByDate(prev.loto, loto),
    euromillions: mergeByDate(prev.euromillions, euromillions),
    eurodreams: mergeByDate(prev.eurodreams, eurodreams),
    updatedAt: new Date().toISOString(),
  };

  fs.writeFileSync("public/results.json", JSON.stringify(out, null, 2));
  console.log("✅ results.json mis à jour —",
    "Loto:", out.loto.length,
    "EM:", out.euromillions.length,
    "ED:", out.eurodreams.length
  );
}
main().catch(e => { console.error(e); process.exit(1); });
