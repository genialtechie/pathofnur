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
        name="home"
        options={{
          title: "Home"
        }}
      />
      <Tabs.Screen
        name="library"
        options={{
          title: "Library"
        }}
      />
      <Tabs.Screen
        name="tools"
        options={{
          title: "Tools"
        }}
      />
      <Tabs.Screen
        name="journey"
        options={{
          title: "Journey"
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
