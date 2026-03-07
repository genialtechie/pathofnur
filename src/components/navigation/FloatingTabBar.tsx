import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { Platform, Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { TabBarIcon } from "@/src/components/navigation/TabBarIcon";
import { useTheme } from "@/src/theme";

const ICON_BY_ROUTE = {
  home: "home",
  library: "library",
  tools: "tools",
  journey: "journey",
} as const;

export function FloatingTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { colors, radii, shadows, spacing } = useTheme();

  const containerBottom = Math.max(insets.bottom, spacing.xs);
  const iconColor = {
    active: colors.text.primary,
    inactive: colors.text.secondary,
  };

  return (
    <View pointerEvents="box-none" style={styles.root}>
      <View
        style={[
          styles.capsule,
          shadows.card,
          {
            bottom: containerBottom,
            backgroundColor: colors.surface.card,
            borderColor: colors.surface.borderElevated,
            borderRadius: radii.pill,
          },
        ]}
      >
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
                isFocused && { backgroundColor: colors.interactive.selectedBackground },
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
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 8,
    paddingVertical: 9,
  },
  tabButton: {
    minWidth: 68,
    height: 58,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  pressed: {
    opacity: Platform.select({ ios: 0.8, default: 0.9 }),
  },
});
