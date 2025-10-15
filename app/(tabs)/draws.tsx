import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, View, Pressable } from "react-native";
import { Link } from "expo-router";
import { fetchRandomNumbers } from "../../lib/api";
import { usePreferredTheme } from "../../lib/theme";

export default function Draws() {
  const { effectiveScheme } = usePreferredTheme();
  const colors = useMemo(
    () =>
      effectiveScheme === "dark"
        ? { bg: "#000", text: "#fff", sub: "#c7c7c7", chip: "#1f2937", chipText: "#fff", link: "#4aa3ff", btn: "#2563eb", btnText:"#fff", error:"#fca5a5" }
        : { bg: "#fff", text: "#111", sub: "#555", chip: "#e5e7eb", chipText: "#111", link: "#1e90ff", btn: "#2563eb", btnText:"#fff", error:"#b91c1c" },
    [effectiveScheme]
  );

  const [numbers, setNumbers] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const nums = await fetchRandomNumbers(5, 1, 50);
      setNumbers(nums);
    } catch (e: any) {
      setError(e?.message || "Impossible de récupérer les nombres");
    } finally {
      setLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    setError(null);
    try {
      const nums = await fetchRandomNumbers(5, 1, 50);
      setNumbers(nums);
    } catch (e: any) {
      setError(e?.message || "Impossible de récupérer les nombres");
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <ScrollView style={{ backgroundColor: colors.bg }} contentContainerStyle={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}>
      <Text style={[styles.title, { color: colors.text }]}>Tirage (API) 🎲</Text>
      <Text style={[styles.subtitle, { color: colors.sub }]}>
        Nombres récupérés depuis une API publique (fallback local si réseau indisponible).
      </Text>

      {loading ? (
        <ActivityIndicator size="large" />
      ) : (
        <>
          {error ? (
            <Text style={{ color: colors.error, marginBottom: 8 }}>
              {error}
            </Text>
          ) : null}

          <View style={styles.row}>
            {numbers.map((n, i) => (
              <View key={`${n}-${i}`} style={[styles.chip, { backgroundColor: colors.chip }]}>
                <Text style={{ color: colors.chipText, fontWeight: "700" }}>{n}</Text>
              </View>
            ))}
          </View>

          <Pressable onPress={refresh} style={[styles.button, { backgroundColor: colors.btn }]}>
            <Text style={{ color: colors.btnText, fontWeight: "600" }}>Nouveau tirage</Text>
          </Pressable>
        </>
      )}

      <Link href="/" style={[styles.link, { color: colors.link }]}>← Retour à l’accueil</Link>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, alignItems: "center", gap: 12, minHeight: "100%" },
  title: { fontSize: 24, fontWeight: "bold" },
  subtitle: { fontSize: 14, textAlign: "center", marginBottom: 8 },
  row: { flexDirection: "row", flexWrap: "wrap", gap: 10, justifyContent: "center", marginVertical: 8 },
  chip: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 999, minWidth: 44, alignItems: "center" },
  button: { marginTop: 8, paddingVertical: 12, paddingHorizontal: 18, borderRadius: 12 },
  link: { marginTop: 16, fontSize: 16, textDecorationLine: "underline" },
});
