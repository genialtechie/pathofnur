import { type ComponentProps } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from "react-native";
import { Image, type ImageSource } from "expo-image";
import { Ionicons } from "@expo/vector-icons";

import { fontFamily, radii, shadows, spacing, useTheme } from "@/src/theme";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface UtilityCardProps {
  /** Background art source (optional — falls back to solid surface) */
  imageSource?: ImageSource;
  /** Ionicons icon name */
  icon: ComponentProps<typeof Ionicons>["name"];
  title: string;
  subtitle?: string;
  onPress?: () => void;
  /** Override aspect ratio; defaults to square */
  aspectRatio?: number;
  style?: ViewStyle;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function UtilityCard({
  imageSource,
  icon,
  title,
  subtitle,
  onPress,
  aspectRatio = 1,
  style,
}: UtilityCardProps) {
  const { colors } = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.container,
        { aspectRatio, backgroundColor: colors.surface.card },
        pressed && onPress ? styles.pressed : undefined,
        style,
      ]}
    >
      {imageSource ? (
        <Image
          source={imageSource}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          transition={200}
        />
      ) : null}

      {/* Centered content */}
      <View style={styles.content}>
        <Ionicons
          name={icon}
          size={36}
          color={colors.brand.metallicGold}
        />
        <Text style={[styles.title, { color: colors.text.primary }]}>{title}</Text>
        {subtitle ? (
          <Text style={[styles.subtitle, { color: colors.text.secondary }]} numberOfLines={2}>
            {subtitle}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    borderRadius: radii.lg,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
    ...shadows.cardSubtle,
  },
  pressed: {
    opacity: 0.92,
  },
  content: {
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  title: {
    fontFamily: fontFamily.appSemiBold,
    fontSize: 16,
    textAlign: "center",
  },
  subtitle: {
    fontFamily: fontFamily.appRegular,
    fontSize: 13,
    textAlign: "center",
    lineHeight: 18,
  },
});
