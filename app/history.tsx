import { useEffect, useState } from "react";
import { ScrollView, Pressable, Text, Alert } from "react-native";
import { loadHistory, toggleFavorite, togglePlayed, clearHistory } from "../store/storage";
import GridCard from "../components/GridCard";
import type { Grid } from "../core/types";

export default function History() {
  const [list, setList] = useState<Grid[]>([]);

  async function refresh() {
    const data = await loadHistory();
    setList(data);
  }

  useEffect(() => { refresh(); }, []);

  async function onFav(id: string) {
    await toggleFavorite(id);
    refresh();
  }

  async function onPlayed(id: string) {
    await togglePlayed(id);
    refresh();
  }

  async function wipe() {
    Alert.alert("Confirmer", "Effacer tout l’historique ?", [
      { text: "Annuler" },
      { text: "Effacer", style: "destructive", onPress: async () => { await clearHistory(); refresh(); } }
    ]);
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      <Pressable onPress={wipe} style={{ padding: 12, borderWidth: 1, borderRadius: 8, marginBottom: 8 }}>
        <Text>Effacer l’historique</Text>
      </Pressable>

      {list.length === 0 ? (
        <Text>Aucune grille encore. Retour à l’accueil pour générer.</Text>
      ) : (
        list.map(g => (
          <GridCard key={g.id} grid={g} onToggleFav={onFav} onTogglePlayed={onPlayed} />
        ))
      )}
    </ScrollView>
  );
}
