import AsyncStorage from "@react-native-async-storage/async-storage";
import { Grid } from "../core/types";

const KEY_HISTORY = "grids.history.v1";

export async function loadHistory(): Promise<Grid[]> {
  const raw = await AsyncStorage.getItem(KEY_HISTORY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as Grid[];
    return parsed.sort((a, b) => b.createdAt - a.createdAt);
  } catch {
    return [];
  }
}

export async function saveToHistory(grid: Grid): Promise<void> {
  const list = await loadHistory();
  const updated = [grid, ...list];
  await AsyncStorage.setItem(KEY_HISTORY, JSON.stringify(updated));
}

export async function togglePlayed(id: string): Promise<void> {
  const list = await loadHistory();
  const updated = list.map(g => (g.id === id ? { ...g, played: !g.played } : g));
  await AsyncStorage.setItem(KEY_HISTORY, JSON.stringify(updated));
}

export async function toggleFavorite(id: string): Promise<void> {
  const list = await loadHistory();
  const updated = list.map(g => (g.id === id ? { ...g, favorite: !g.favorite } : g));
  await AsyncStorage.setItem(KEY_HISTORY, JSON.stringify(updated));
}

export async function getFavorites(): Promise<Grid[]> {
  const list = await loadHistory();
  return list.filter(g => g.favorite).sort((a, b) => b.createdAt - a.createdAt);
}

export async function clearHistory(): Promise<void> {
  await AsyncStorage.setItem(KEY_HISTORY, JSON.stringify([]));
}
