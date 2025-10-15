import { useEffect, useState } from "react";
import { ScrollView, Text } from "react-native";
import { getFavorites, toggleFavorite, togglePlayed } from "../store/storage";
import GridCard from "../components/GridCard";
import type { Grid } from "../core/types";

export default function Favorites() {
  const [list, setList] = useState<Grid[]>([]);

  async function refresh() {
    const data = await getFavorites();
    setList(data);
  }

  useEffect(() => { refresh(); }, []);

  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      {list.length === 0 ? (
        <Text>Pas encore de favoris. Ajoute ⭐ depuis l’historique ou l’accueil.</Text>
      ) : (
        list.map(g => (
          <GridCard
            key={g.id}
            grid={g}
            onToggleFav={async (id) => { await toggleFavorite(id); refresh(); }}
            onTogglePlayed={async (id) => { await togglePlayed(id); refresh(); }}
          />
        ))
      )}
    </ScrollView>
  );
}
