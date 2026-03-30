import { Tabs } from "expo-router";
import { useColorScheme } from "react-native";
import { FloatingTabBar } from "@/src/components/navigation/FloatingTabBar";

import { useTheme } from "@/src/theme";

export default function TabsLayout() {
  const { colors } = useTheme();
  const colorScheme = useColorScheme();
  const themeKey = colorScheme === "dark" ? "dark" : "light";

  return (
    <Tabs
      key={themeKey}
      tabBar={(props) => <FloatingTabBar {...props} key={themeKey} />}
      screenOptions={{
        headerShown: false,
        tabBarStyle: { display: "none" },
        sceneStyle: {
          backgroundColor: colors.surface.background
        }
      }}
    >
      <Tabs.Screen
        name="journey"
        options={{
          title: "Journey"
        }}
      />
      <Tabs.Screen
        name="home"
        options={{
          title: "Home"
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings"
        }}
      />
      <Tabs.Screen
        name="library"
        options={{
          href: null
        }}
      />
      <Tabs.Screen
        name="tools"
        options={{
          href: null
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          href: null
        }}
      />
    </Tabs>
  );
}
