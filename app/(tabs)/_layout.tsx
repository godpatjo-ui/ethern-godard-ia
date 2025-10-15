import React, { useMemo } from "react";
import { Tabs } from "expo-router";
import { usePreferredTheme } from "../../lib/theme";
import { Ionicons } from "@expo/vector-icons";

export default function TabsLayout() {
  const { effectiveScheme } = usePreferredTheme();
  const colors = useMemo(
    () => effectiveScheme === "dark"
      ? { bg:"#0b0b0b", border:"#222", active:"#4aa3ff", inactive:"#9aa0a6", text:"#fff" }
      : { bg:"#fff",   border:"#ddd", active:"#1e90ff", inactive:"#6b7280", text:"#111" },
    [effectiveScheme]
  );

  return (
    <Tabs
      screenOptions={{
        headerTitleAlign: "center",
        tabBarActiveTintColor: colors.active,
        tabBarInactiveTintColor: colors.inactive,
        tabBarStyle: { backgroundColor: colors.bg, borderTopColor: colors.border },
        headerStyle: { backgroundColor: colors.bg },
        headerTintColor: colors.text,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Accueil",
          tabBarIcon: ({ color, size }) => <Ionicons name="home" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="draws"
        options={{
          title: "Tirages",
          tabBarIcon: ({ color, size }) => <Ionicons name="dice" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Réglages",
          tabBarIcon: ({ color, size }) => <Ionicons name="settings" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="ai"
        options={{
          title: "IA",
          tabBarIcon: ({ color, size }) => <Ionicons name="sparkles" color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
