export type GameKey = "loto" | "euromillions" | "eurodreams";

export type Grid =
  | { game: "loto"; main: number[]; chance: number }
  | { game: "euromillions"; main: number[]; stars: number[] }
  | { game: "eurodreams"; main: number[]; dream: number };

export const GAME_SCHEDULE: Record<string, GameKey> = {
  // Europe/Paris
  "lundi": "loto",
  "mardi": "euromillions",
  "mercredi": "loto",
  "jeudi": "eurodreams",
  "vendredi": "euromillions",
  "samedi": "loto",
  "dimanche": "eurodreams",
};

export function gameOfTheDay(d = new Date()): GameKey {
  const day = d.toLocaleDateString("fr-FR", { weekday: "long", timeZone: "Europe/Paris" }).toLowerCase();
  return GAME_SCHEDULE[day] ?? "loto";
}

function pickUnique(count: number, min: number, max: number): number[] {
  const out: number[] = [];
  while (out.length < count) {
    const n = Math.floor(Math.random() * (max - min + 1)) + min;
    if (!out.includes(n)) out.push(n);
  }
  return out.sort((a,b)=>a-b);
}

export function generateLocalGrids(kind: GameKey, howMany = 5): Grid[] {
  const grids: Grid[] = [];
  for (let i = 0; i < howMany; i++) {
    if (kind === "loto") {
      const main = pickUnique(5, 1, 49);
      const chance = pickUnique(1, 1, 10)[0];
      grids.push({ game: "loto", main, chance });
    } else if (kind === "euromillions") {
      const main = pickUnique(5, 1, 50);
      const stars = pickUnique(2, 1, 12);
      grids.push({ game: "euromillions", main, stars });
    } else {
      const main = pickUnique(6, 1, 40);
      const dream = pickUnique(1, 1, 5)[0];
      grids.push({ game: "eurodreams", main, dream });
    }
  }
  return grids;
}

export function validateGrid(g: Grid): boolean {
  const uniq = (arr:number[]) => new Set(arr).size === arr.length;
  if (g.game === "loto") return g.main.length===5 && uniq(g.main) && g.main[0]>=1 && g.main.at(-1)!<=49 && g.chance>=1 && g.chance<=10;
  if (g.game === "euromillions") return g.main.length===5 && uniq(g.main) && g.main[0]>=1 && g.main.at(-1)!<=50 &&
                                   g.stars.length===2 && uniq(g.stars) && g.stars[0]>=1 && g.stars.at(-1)!<=12;
  return g.main.length===6 && uniq(g.main) && g.main[0]>=1 && g.main.at(-1)!<=40 && g.dream>=1 && g.dream<=5;
}
