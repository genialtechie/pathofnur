import { Tabs } from "expo-router";

import { TabBarIcon } from "@/src/components/navigation/TabBarIcon";
import { fontFamily } from "@/src/components/navigation/typography";

const INACTIVE_COLOR = "#607089";
const ACTIVE_COLOR = "#c5a021";
const TAB_BACKGROUND = "#0b1220";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: ACTIVE_COLOR,
        tabBarInactiveTintColor: INACTIVE_COLOR,
        tabBarStyle: {
          backgroundColor: TAB_BACKGROUND,
          borderTopColor: "#111a2a"
        },
        tabBarLabelStyle: {
          fontFamily: fontFamily.appSemiBold,
          fontSize: 12
        },
        sceneStyle: {
          backgroundColor: "#070b14"
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
