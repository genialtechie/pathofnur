import { Tabs } from "expo-router";
import { TabBarIcon } from "@/src/components/navigation/TabBarIcon";
import { fontFamily } from "@/src/components/navigation/typography";

import { useTheme } from "@/src/theme";

export default function TabsLayout() {
  const { colors } = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.brand.metallicGold,
        tabBarInactiveTintColor: colors.text.tertiary,
        tabBarStyle: {
          backgroundColor: colors.surface.tabBar,
          borderTopColor: colors.surface.border,
          height: 60,
          paddingTop: 8,
          marginBottom: 0,
        },
        tabBarLabelStyle: {
          fontFamily: fontFamily.appRegular,
          fontSize: 11
        },
        sceneStyle: {
          backgroundColor: colors.surface.background
        }
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name={focused ? "home" : "home-outline"} color={color} />
          )
        }}
      />
      <Tabs.Screen
        name="library"
        options={{
          title: "Library",
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name={focused ? "book" : "book-outline"} color={color} />
          )
        }}
      />
      <Tabs.Screen
        name="tools"
        options={{
          title: "Tools",
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name={focused ? "compass" : "compass-outline"} color={color} />
          )
        }}
      />
      <Tabs.Screen
        name="journey"
        options={{
          title: "Journey",
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon
              name={focused ? "sparkles" : "sparkles-outline"}
              color={color}
            />
          )
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
