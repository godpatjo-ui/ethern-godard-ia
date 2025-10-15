import { GameConfig, Grid } from "./types";

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function drawUnique(from: number, to: number, count: number, disallow: Set<number> = new Set()) {
  const set = new Set<number>();
  while (set.size < count) {
    const n = randInt(from, to);
    if (!disallow.has(n) && !set.has(n)) set.add(n);
  }
  return Array.from(set);
}

function splitLowHigh(max: number) {
  const half = Math.floor(max / 2);
  return { lowMax: half, highMin: half + 1 };
}

/** Stratégie équilibrée : moitié pairs/impairs, moitié bas/haut, sans doublons */
export function generateBalanced(config: GameConfig): Grid {
  const now = Date.now();
  const used = new Set<number>();
  const nums: number[] = [];

  const evenTarget = Math.floor(config.numbersCount / 2);
  const oddTarget = config.numbersCount - evenTarget;

  const { lowMax, highMin } = splitLowHigh(config.numbersMax);
  const lowTarget = Math.floor(config.numbersCount / 2);
  const highTarget = config.numbersCount - lowTarget;

  function pickZone(count: number, zone: "low" | "high", parity: "even" | "odd") {
    const from = zone === "low" ? 1 : highMin;
    const to   = zone === "low" ? lowMax : config.numbersMax;
    const pool: number[] = [];
    for (let n = from; n <= to; n++) {
      if ((parity === "even" ? n % 2 === 0 : n % 2 !== 0) && !used.has(n)) {
        pool.push(n);
      }
    }
    while (count > 0 && pool.length > 0) {
      const idx = randInt(0, pool.length - 1);
      const val = pool[idx];
      nums.push(val);
      used.add(val);
      pool.splice(idx, 1);
      count--;
    }
    return count;
  }

  let needEven = evenTarget;
  let needOdd  = oddTarget;
  let needLow  = lowTarget;
  let needHigh = highTarget;

  const rounds = config.numbersCount;
  for (let i = 0; i < rounds && nums.length < config.numbersCount; i++) {
    if (needLow > 0) {
      if (needEven > 0) needEven = pickZone(1, "low", "even");
      else if (needOdd > 0) needOdd = pickZone(1, "low", "odd");
      needLow = Math.max(0, lowTarget - nums.filter(n => n <= lowMax).length);
    }
    if (nums.length >= config.numbersCount) break;
    if (needHigh > 0) {
      if (needOdd > 0) needOdd = pickZone(1, "high", "odd");
      else if (needEven > 0) needEven = pickZone(1, "high", "even");
      needHigh = Math.max(0, highTarget - nums.filter(n => n >= highMin).length);
    }
  }

  if (nums.length < config.numbersCount) {
    const missing = config.numbersCount - nums.length;
    const extra = drawUnique(1, config.numbersMax, missing, used);
    nums.push(...extra);
  }

  nums.sort((a, b) => a - b);

  let stars: number[] | undefined;
  if (config.starsCount && config.starsMax) {
    stars = drawUnique(1, config.starsMax, config.starsCount);
    stars.sort((a, b) => a - b);
  }

  return {
    id: `${now}-${Math.random().toString(36).slice(2, 7)}`,
    game: config.game,
    numbers: nums,
    stars,
    createdAt: now,
  };
}
