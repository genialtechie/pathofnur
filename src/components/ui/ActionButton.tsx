import { Pressable, StyleSheet, Text, type ViewStyle, type TextStyle } from "react-native";

import { fontFamily } from "@/src/theme";
import { colors, radii } from "@/src/theme/tokens";

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
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        variantStyles[variant],
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
    >
      <Text style={[styles.labelBase, variantLabelStyles[variant]]}>
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

const variantStyles: Record<ButtonVariant, ViewStyle> = {
  primary: {
    backgroundColor: colors.brand.metallicGold,
  },
  secondary: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: colors.surface.borderInteractive,
  },
  tertiary: {
    backgroundColor: "transparent",
    minHeight: 40,
  },
};

const variantLabelStyles: Record<ButtonVariant, TextStyle> = {
  primary: {
    color: colors.text.onAccent,
  },
  secondary: {
    color: colors.text.light,
    fontFamily: fontFamily.appSemiBold,
  },
  tertiary: {
    color: colors.text.light,
    fontFamily: fontFamily.appSemiBold,
    fontSize: 15,
  },
};
