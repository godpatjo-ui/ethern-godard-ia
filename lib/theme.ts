import { useEffect, useMemo, useState } from "react";
import { useColorScheme } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { DarkTheme, DefaultTheme, Theme } from "@react-navigation/native";

export type ThemePreference = "system" | "light" | "dark";
const KEY = "themePreference";

export function usePreferredTheme() {
  const scheme = useColorScheme(); // ce que l'OS annonce (peut être faux chez toi)
  const [preference, setPreference] = useState<ThemePreference>("system");

  useEffect(() => {
    AsyncStorage.getItem(KEY).then((p) => {
      if (p === "system" || p === "light" || p === "dark") setPreference(p);
    });
  }, []);

  useEffect(() => {
    AsyncStorage.setItem(KEY, preference).catch(() => {});
  }, [preference]);

  const effectiveScheme = useMemo(() => {
    if (preference === "light") return "light";
    if (preference === "dark") return "dark";
    return scheme ?? "light";
  }, [preference, scheme]);

  const navTheme: Theme =
    effectiveScheme === "dark" ? DarkTheme : DefaultTheme;

  return { scheme, preference, setPreference, effectiveScheme, navTheme };
}
