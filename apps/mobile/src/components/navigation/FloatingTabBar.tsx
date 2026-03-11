import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { useTheme as useNavigationTheme } from "@react-navigation/native";
import { Platform, Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { TabBarIcon } from "@/src/components/navigation/TabBarIcon";
import { spacing } from "@/src/theme";

const ICON_BY_ROUTE = {
  home: "home",
  library: "library",
  tools: "tools",
  journey: "journey",
} as const;

export function FloatingTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const navigationTheme = useNavigationTheme();
  const isDark = navigationTheme.dark;

  const containerBottom = Math.max(insets.bottom, spacing.xs);
  const capsuleStyle = {
    backgroundColor: isDark ? "rgba(6, 10, 18, 0.78)" : "rgba(255, 255, 255, 0.76)",
    borderColor: isDark ? "rgba(163, 184, 212, 0.18)" : "rgba(15, 23, 42, 0.08)",
    shadowColor: isDark ? "#000000" : "#0f172a",
  };
  const sheenStyle = {
    backgroundColor: isDark ? "rgba(255, 255, 255, 0.06)" : "rgba(255, 255, 255, 0.3)",
    borderColor: isDark ? "rgba(255, 255, 255, 0.04)" : "rgba(255, 255, 255, 0.5)",
  };
  const activePillStyle = {
    backgroundColor: isDark ? "rgba(255, 255, 255, 0.14)" : "rgba(15, 23, 42, 0.1)",
  };
  const iconColor = {
    active: navigationTheme.colors.text,
    inactive: isDark ? "rgba(226, 232, 240, 0.82)" : "rgba(15, 23, 42, 0.7)",
  };

  return (
    <View pointerEvents="box-none" style={styles.root}>
      <View
        style={[
          styles.capsule,
          {
            bottom: containerBottom,
          },
          capsuleStyle,
        ]}
      >
        <View pointerEvents="none" style={[styles.sheen, sheenStyle]} />
        {state.routes.map((route, index) => {
          if (route.name === "index") return null;

          const descriptor = descriptors[route.key];
          const options = descriptor.options;
          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: "tabLongPress",
              target: route.key,
            });
          };

          const iconName = ICON_BY_ROUTE[route.name as keyof typeof ICON_BY_ROUTE];
          if (!iconName) return null;

          return (
            <Pressable
              key={route.key}
              accessibilityRole="tab"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              testID={options.tabBarButtonTestID}
              onPress={onPress}
              onLongPress={onLongPress}
              style={({ pressed }) => [
                styles.tabButton,
                isFocused && activePillStyle,
                pressed && styles.pressed,
              ]}
            >
              <TabBarIcon
                name={iconName}
                focused={isFocused}
                color={isFocused ? iconColor.active : iconColor.inactive}
              />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
  },
  capsule: {
    position: "absolute",
    left: 16,
    right: 16,
    overflow: "hidden",
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 10,
    paddingVertical: 10,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.22,
    shadowRadius: 24,
    elevation: 16,
  },
  sheen: {
    ...StyleSheet.absoluteFillObject,
    top: 1,
    bottom: "48%",
    borderTopWidth: 1,
  },
  tabButton: {
    minWidth: 66,
    height: 54,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  pressed: {
    opacity: Platform.select({ ios: 0.8, default: 0.9 }),
  },
});
