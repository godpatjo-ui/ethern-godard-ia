import fs from "fs";
import fetch from "node-fetch";

const LOTO_URL = process.env.LOTO_URL || "";
const EM_URL   = process.env.EM_URL   || "";
const ED_URL   = process.env.ED_URL   || "";

function asArray(x) {
  if (!x) return [];
  return Array.isArray(x) ? x : [x];
}

async function safeGet(url) {
  if (!url) return [];
  try {
    const r = await fetch(url, { headers: { accept: "application/json" } });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const j = await r.json();
    return asArray(j);
  } catch (e) {
    console.error("⚠️  Fetch failed:", url, String(e));
    return [];
  }
}

function normalize() {
  return {
    loto: [],
    euromillions: [],
    eurodreams: [],
    updatedAt: new Date().toISOString(),
  };
}

function mergeUnique(list, keyFn) {
  const map = new Map();
  for (const item of list) {
    const k = keyFn(item);
    if (!map.has(k)) map.set(k, item);
  }
  return Array.from(map.values()).sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
}

function mapLoto(arr) {
  return arr
    .map((o) => ({
      date: String(o.date || o.Date || "").slice(0, 10),
      n1: Number((o.main?.[0] ?? o.n1)),
      n2: Number((o.main?.[1] ?? o.n2)),
      n3: Number((o.main?.[2] ?? o.n3)),
      n4: Number((o.main?.[3] ?? o.n4)),
      n5: Number((o.main?.[4] ?? o.n5)),
      chance: Number(o.chance ?? o.bonus ?? o.complementaire ?? o.lucky ?? o.chanceNumber),
    }))
    .filter((x) => x.date && [x.n1,x.n2,x.n3,x.n4,x.n5].every(Number.isFinite) && Number.isFinite(x.chance));
}

function mapEM(arr) {
  return arr
    .map((o) => ({
      date: String(o.date || o.Date || "").slice(0, 10),
      n1: Number((o.main?.[0] ?? o.n1)),
      n2: Number((o.main?.[1] ?? o.n2)),
      n3: Number((o.main?.[2] ?? o.n3)),
      n4: Number((o.main?.[3] ?? o.n4)),
      n5: Number((o.main?.[4] ?? o.n5)),
      e1: Number((o.stars?.[0] ?? o.e1 ?? o.star1)),
      e2: Number((o.stars?.[1] ?? o.e2 ?? o.star2)),
    }))
    .filter((x) => x.date && [x.n1,x.n2,x.n3,x.n4,x.n5,x.e1,x.e2].every(Number.isFinite));
}

function mapED(arr) {
  return arr
    .map((o) => ({
      date: String(o.date || o.Date || "").slice(0, 10),
      n1: Number((o.main?.[0] ?? o.n1)),
      n2: Number((o.main?.[1] ?? o.n2)),
      n3: Number((o.main?.[2] ?? o.n3)),
      n4: Number((o.main?.[3] ?? o.n4)),
      n5: Number((o.main?.[4] ?? o.n5)),
      n6: Number((o.main?.[5] ?? o.n6)),
      dream: Number(o.dream ?? o.special ?? o.joker ?? o.dreamNumber),
    }))
    .filter((x) => x.date && [x.n1,x.n2,x.n3,x.n4,x.n5,x.n6,x.dream].every(Number.isFinite));
}

async function main() {
  // Charge l’existant si présent
  let out = normalize();
  try {
    if (fs.existsSync("public/results.json")) {
      const cur = JSON.parse(fs.readFileSync("public/results.json","utf8"));
      out = { ...normalize(), ...cur };
    }
  } catch {}

  // Récupère les 3 sources
  const [lotoRaw, emRaw, edRaw] = await Promise.all([
    safeGet(LOTO_URL),
    safeGet(EM_URL),
    safeGet(ED_URL),
  ]);

  // Map + merge (clé = date)
  const lotoNew = mapLoto(lotoRaw);
  const emNew   = mapEM(emRaw);
  const edNew   = mapED(edRaw);

  out.loto = mergeUnique([...(out.loto||[]), ...lotoNew], (x) => `loto:${x.date}`);
  out.euromillions = mergeUnique([...(out.euromillions||[]), ...emNew], (x) => `em:${x.date}`);
  out.eurodreams = mergeUnique([...(out.eurodreams||[]), ...edNew], (x) => `ed:${x.date}`);
  out.updatedAt = new Date().toISOString();

  if (!fs.existsSync("public")) fs.mkdirSync("public");
  fs.writeFileSync("public/results.json", JSON.stringify(out, null, 2));
  console.log("✅ results.json écrit :", "loto", out.loto.length, "| em", out.euromillions.length, "| ed", out.eurodreams.length);
}
main().catch((e) => { console.error(e); process.exit(1); });
