import { Tabs } from "expo-router";
import { FloatingTabBar } from "@/src/components/navigation/FloatingTabBar";

import { useTheme } from "@/src/theme";

export default function TabsLayout() {
  const { colors } = useTheme();

  return (
    <Tabs
      tabBar={(props) => <FloatingTabBar {...props} />}
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
