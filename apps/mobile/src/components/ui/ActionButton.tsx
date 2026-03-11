import { Pressable, StyleSheet, Text, type ViewStyle, type TextStyle } from "react-native";

import { fontFamily, radii, useTheme } from "@/src/theme";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ButtonVariant = "primary" | "secondary" | "tertiary";

interface ActionButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  style?: ViewStyle;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ActionButton({
  label,
  onPress,
  variant = "primary",
  disabled = false,
  style,
}: ActionButtonProps) {
  const { colors } = useTheme();
  const variantStyle: ViewStyle =
    variant === "primary"
      ? { backgroundColor: colors.brand.metallicGold }
      : variant === "secondary"
        ? {
            backgroundColor: "transparent",
            borderWidth: 1,
            borderColor: colors.surface.borderInteractive,
          }
        : {
            backgroundColor: "transparent",
            minHeight: 40,
          };
  const variantLabelStyle: TextStyle =
    variant === "primary"
      ? { color: colors.text.onAccent }
      : variant === "secondary"
        ? { color: colors.text.light, fontFamily: fontFamily.appSemiBold }
        : {
            color: colors.text.light,
            fontFamily: fontFamily.appSemiBold,
            fontSize: 15,
          };

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        variantStyle,
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
    >
      <Text style={[styles.labelBase, variantLabelStyle]}>
        {label}
      </Text>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  base: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radii.pill,
    minHeight: 54,
    paddingHorizontal: 24,
  },
  pressed: {
    opacity: 0.85,
  },
  disabled: {
    opacity: 0.45,
  },
  labelBase: {
    fontFamily: fontFamily.appBold,
    fontSize: 17,
  },
});
