import fs from "fs";
import fetch from "node-fetch";

const OWNER = "godpatjo-ui";
const REPO  = "ethern-godard-ia";
const BASE  = `https://raw.githubusercontent.com/${OWNER}/${REPO}/main/data`;

const LOTO_URL = process.env.LOTO_URL || `${BASE}/loto-latest.json`;
const EM_URL   = process.env.EM_URL   || `${BASE}/euromillions-latest.json`;
const ED_URL   = process.env.ED_URL   || `${BASE}/eurodreams-latest.json`;

function asArray(x){ if(!x) return []; return Array.isArray(x)?x:[x]; }

async function safeGet(url){
  try{
    const r = await fetch(url, { headers:{accept:"application/json"} });
    if(!r.ok) throw new Error(`HTTP ${r.status}`);
    return asArray(await r.json());
  }catch(e){
    console.error("⚠️  Fetch failed:", url, String(e));
    return [];
  }
}

function normalize(){ return { loto:[], euromillions:[], eurodreams:[], updatedAt:new Date().toISOString() }; }
function mergeUnique(list, keyFn){
  const m=new Map();
  for(const it of list){ const k=keyFn(it); if(!m.has(k)) m.set(k,it); }
  return [...m.values()].sort((a,b)=> a.date<b.date?1:-1);
}

function mapLoto(arr){
  return arr.map(o=>({
    date:String(o.date||o.Date||"").slice(0,10),
    n1:+(o.main?.[0] ?? o.n1), n2:+(o.main?.[1] ?? o.n2), n3:+(o.main?.[2] ?? o.n3),
    n4:+(o.main?.[3] ?? o.n4), n5:+(o.main?.[4] ?? o.n5),
    chance:+(o.chance ?? o.bonus ?? o.complementaire ?? o.lucky ?? o.chanceNumber)
  })).filter(x=>x.date && [x.n1,x.n2,x.n3,x.n4,x.n5,x.chance].every(Number.isFinite));
}

function mapEM(arr){
  return arr.map(o=>({
    date:String(o.date||o.Date||"").slice(0,10),
    n1:+(o.main?.[0] ?? o.n1), n2:+(o.main?.[1] ?? o.n2), n3:+(o.main?.[2] ?? o.n3),
    n4:+(o.main?.[3] ?? o.n4), n5:+(o.main?.[4] ?? o.n5),
    e1:+(o.stars?.[0] ?? o.e1 ?? o.star1), e2:+(o.stars?.[1] ?? o.e2 ?? o.star2),
  })).filter(x=>x.date && [x.n1,x.n2,x.n3,x.n4,x.n5,x.e1,x.e2].every(Number.isFinite));
}

function mapED(arr){
  return arr.map(o=>({
    date:String(o.date||o.Date||"").slice(0,10),
    n1:+(o.main?.[0] ?? o.n1), n2:+(o.main?.[1] ?? o.n2), n3:+(o.main?.[2] ?? o.n3),
    n4:+(o.main?.[3] ?? o.n4), n5:+(o.main?.[4] ?? o.n5), n6:+(o.main?.[5] ?? o.n6),
    dream:+(o.dream ?? o.special ?? o.joker ?? o.dreamNumber),
  })).filter(x=>x.date && [x.n1,x.n2,x.n3,x.n4,x.n5,x.n6,x.dream].every(Number.isFinite));
}

async function main(){
  let out=normalize();
  try{ if(fs.existsSync("public/results.json")) out={...out, ...JSON.parse(fs.readFileSync("public/results.json","utf8"))}; }catch{}
  const [lotoRaw, emRaw, edRaw] = await Promise.all([safeGet(LOTO_URL), safeGet(EM_URL), safeGet(ED_URL)]);
  out.loto = mergeUnique([...(out.loto||[]), ...mapLoto(lotoRaw)], x=>`loto:${x.date}`);
  out.euromillions = mergeUnique([...(out.euromillions||[]), ...mapEM(emRaw)], x=>`em:${x.date}`);
  out.eurodreams = mergeUnique([...(out.eurodreams||[]), ...mapED(edRaw)], x=>`ed:${x.date}`);
  out.updatedAt = new Date().toISOString();
  if(!fs.existsSync("public")) fs.mkdirSync("public");
  fs.writeFileSync("public/results.json", JSON.stringify(out,null,2));
  console.log("✅ results.json écrit :", "loto", out.loto.length, "| em", out.euromillions.length, "| ed", out.eurodreams.length);
}
main().catch(e=>{console.error(e);process.exit(1);});
