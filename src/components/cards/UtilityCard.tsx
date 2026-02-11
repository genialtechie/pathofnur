import { type ComponentProps } from "react";
import {
  Image,
  type ImageSourcePropType,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { fontFamily } from "@/src/theme";
import { colors, radii, shadows, spacing } from "@/src/theme/tokens";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface UtilityCardProps {
  /** Background art source (optional — falls back to solid surface) */
  imageSource?: ImageSourcePropType;
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
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.container,
        { aspectRatio },
        pressed && onPress ? styles.pressed : undefined,
        style,
      ]}
    >
      {imageSource ? (
        <Image
          source={imageSource}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
        />
      ) : null}

      {/* Centered content */}
      <View style={styles.content}>
        <Ionicons
          name={icon}
          size={36}
          color={colors.brand.metallicGold}
        />
        <Text style={styles.title}>{title}</Text>
        {subtitle ? (
          <Text style={styles.subtitle} numberOfLines={2}>
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
    backgroundColor: colors.surface.card,
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
    color: colors.text.primary,
    fontFamily: fontFamily.appSemiBold,
    fontSize: 16,
    textAlign: "center",
  },
  subtitle: {
    color: colors.text.secondary,
    fontFamily: fontFamily.appRegular,
    fontSize: 13,
    textAlign: "center",
    lineHeight: 18,
  },
});
