export type Grid = {
  id: string;
  game: "Loto" | "EuroMillions" | "Custom";
  numbers: number[];
  stars?: number[];
  createdAt: number;
  played?: boolean;
  favorite?: boolean;
};

export type GameConfig = {
  game: Grid["game"];
  numbersCount: number;
  numbersMax: number;
  starsCount?: number;
  starsMax?: number;
};
