import { View, Text, Pressable } from "react-native";
import { Grid } from "../core/types";

function Ball({ n }: { n: number }) {
  return (
    <View style={{
      paddingVertical: 8, paddingHorizontal: 12,
      borderRadius: 20, borderWidth: 1, marginRight: 8, marginBottom: 8
    }}>
      <Text style={{ fontWeight: "600" }}>{n}</Text>
    </View>
  );
}

export default function GridCard({
  grid,
  onToggleFav,
  onTogglePlayed
}: {
  grid: Grid;
  onToggleFav?: (id: string) => void;
  onTogglePlayed?: (id: string) => void;
}) {
  return (
    <View style={{
      borderWidth: 1, borderRadius: 16, padding: 16, marginVertical: 8
    }}>
      <Text style={{ fontWeight: "700", marginBottom: 8 }}>
        {new Date(grid.createdAt).toLocaleString()} {grid.game}
      </Text>

      <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
        {grid.numbers.map(n => <Ball key={n} n={n} />)}
        {grid.stars && grid.stars.length > 0 && (
          <View style={{ flexDirection: "row", alignItems: "center", marginLeft: 8 }}>
            <Text style={{ marginRight: 8 }}>★</Text>
            {grid.stars.map(s => <Ball key={`s${s}`} n={s} />)}
          </View>
        )}
      </View>

      <View style={{ flexDirection: "row", gap: 16, marginTop: 12 }}>
        {onToggleFav && (
          <Pressable onPress={() => onToggleFav(grid.id)} style={{ padding: 8 }}>
            <Text>{grid.favorite ? "Retirer des Favoris ⭐" : "Ajouter Favoris ⭐"}</Text>
          </Pressable>
        )}
        {onTogglePlayed && (
          <Pressable onPress={() => onTogglePlayed(grid.id)} style={{ padding: 8 }}>
            <Text>{grid.played ? "Marquer Non jouée" : "Marquer Jouée ✅"}</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}
