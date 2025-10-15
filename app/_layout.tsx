import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { fetchResults } from "../lib/results";
import { useEffect } from "react";
import * as SystemUI from "expo-system-ui";
import { ThemeProvider } from "@react-navigation/native";
import { usePreferredTheme } from "../lib/theme";

export default function Layout() {
  useEffect(()=>{ fetchResults().catch(()=>{}); },[]);
  const { effectiveScheme, navTheme } = usePreferredTheme();

  useEffect(() => {
    SystemUI.setBackgroundColorAsync(
      effectiveScheme === "dark" ? "#000000" : "#FFFFFF"
    );
  }, [effectiveScheme]);

  return (
    <ThemeProvider value={navTheme}>
      <StatusBar style={effectiveScheme === "dark" ? "light" : "dark"} />
      <Stack screenOptions={{ headerTitleAlign: "center" }} />
    </ThemeProvider>
  );
}
