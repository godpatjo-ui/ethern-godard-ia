import React, { useMemo } from "react";
import { StyleSheet, Text, View, Pressable, useColorScheme } from "react-native";
import { Link } from "expo-router";
import { usePreferredTheme } from "../../lib/theme";

export default function Settings() {
  const { preference, setPreference, effectiveScheme } = usePreferredTheme();
  const scheme = useColorScheme();

  const colors = useMemo(
    () =>
      effectiveScheme === "dark"
        ? { bg: "#000", text: "#fff", sub: "#c7c7c7", link: "#4aa3ff", chip:"#1f2937", chipOn:"#2563eb" }
        : { bg: "#fff", text: "#111", sub: "#555", link: "#1e90ff", chip:"#e5e7eb", chipOn:"#2563eb" },
    [effectiveScheme]
  );

  const Chip = ({ label, active, onPress }: { label: string; active?: boolean; onPress: () => void }) => (
    <Pressable onPress={onPress} style={[styles.chip, { backgroundColor: active ? colors.chipOn : colors.chip }]}>
      <Text style={{ color: active ? "#fff" : (effectiveScheme === "dark" ? "#e5e7eb" : "#111"), fontWeight: "600" }}>
        {label}
      </Text>
    </Pressable>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <Text style={[styles.title, { color: colors.text }]}>Réglages</Text>
      <Text style={[styles.subtitle, { color: colors.sub }]}>Choix du thème</Text>

      <View style={styles.row}>
        <Chip label="Système"  active={preference === "system"} onPress={() => setPreference("system")} />
        <Chip label="Clair"    active={preference === "light"}  onPress={() => setPreference("light")} />
        <Chip label="Sombre"   active={preference === "dark"}   onPress={() => setPreference("dark")} />
      </View>

      <Text style={{ color: colors.sub, marginTop: 8 }}>
        Système détecté : <Text style={{ fontWeight: "bold", color: colors.text }}>{scheme ?? "inconnu"}</Text> • Appli en : <Text style={{ fontWeight: "bold", color: colors.text }}>{effectiveScheme}</Text>
      </Text>

      <Link href="/" style={[styles.link, { color: colors.link }]}>← Retour à l’accueil</Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 8 },
  subtitle: { fontSize: 16, marginBottom: 16, textAlign: "center" },
  link: { marginTop: 24, fontSize: 16, textDecorationLine: "underline" },
  row: { flexDirection: "row", gap: 12, marginBottom: 16 },
  chip: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 999 },
});
