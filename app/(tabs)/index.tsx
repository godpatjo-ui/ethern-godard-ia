import React, { useEffect, useState, useMemo } from "react";
import { StyleSheet, Text, View, Pressable } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Link } from "expo-router";
import { usePreferredTheme } from "../../lib/theme";

export default function Home() {
  const { effectiveScheme } = usePreferredTheme();

  const colors = useMemo(
    () =>
      effectiveScheme === "dark"
        ? { bg: "#000", text: "#fff", sub: "#c7c7c7", info: "#e6e6e6", primary: "#3498db", success: "#2ecc71", link: "#4aa3ff" }
        : { bg: "#fff", text: "#111", sub: "#555", info: "#333", primary: "#3498db", success: "#2ecc71", link: "#1e90ff" },
    [effectiveScheme]
  );

  const [enabled, setEnabled] = useState(false);
  const [count, setCount] = useState(0);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [e, c] = await Promise.all([
          AsyncStorage.getItem("enabled"),
          AsyncStorage.getItem("count"),
        ]);
        if (e !== null) setEnabled(e === "true");
        if (c !== null) setCount(Number(c) || 0);
      } catch {}
      setHydrated(true);
    })();
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    AsyncStorage.setItem("enabled", String(enabled)).catch(() => {});
  }, [enabled, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    AsyncStorage.setItem("count", String(count)).catch(() => {});
  }, [count, hydrated]);

  const onPress = () => {
    setEnabled((v) => !v);
    setCount((c) => c + 1);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <Text style={[styles.title, { color: colors.text }]}>Hello Expo 🚀</Text>
      <Text style={[styles.subtitle, { color: colors.sub }]}>Ton appli est bien en train de tourner 🎉</Text>

      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.button,
          { backgroundColor: enabled ? colors.success : colors.primary },
          pressed && styles.buttonPressed,
        ]}
        accessibilityRole="button"
        accessibilityState={{ pressed: enabled }}
        accessibilityLabel={enabled ? "Désactiver" : "Activer"}
      >
        <Text style={styles.buttonText}>{enabled ? "Désactiver" : "Activer"}</Text>
      </Pressable>

      <Text style={[styles.info, { color: colors.info }]}>
        État : <Text style={{ fontWeight: "bold" }}>{enabled ? "ON" : "OFF"}</Text> • Appuis : {count}
      </Text>

      <Link href="/settings" style={[styles.link, { color: colors.link }]}>Aller aux réglages →</Link>
      <Link href="/draws" style={[styles.link, { color: colors.link }]}>Aller aux tirages (API) →</Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  title: { fontSize: 28, fontWeight: "bold", marginBottom: 8 },
  subtitle: { fontSize: 16, marginBottom: 20, textAlign: "center" },
  button: { paddingVertical: 12, paddingHorizontal: 22, borderRadius: 12, marginTop: 8 },
  buttonPressed: { opacity: 0.85 },
  buttonText: { color: "#fff", fontWeight: "600", fontSize: 16 },
  info: { marginTop: 14, fontSize: 16 },
  link: { marginTop: 12, fontSize: 16, textDecorationLine: "underline" },
});
