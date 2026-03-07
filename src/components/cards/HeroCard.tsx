import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from "react-native";
import { Image, type ImageSource } from "expo-image";

import { fontFamily, radii, shadows, spacing, useTheme } from "@/src/theme";
import { darkColors } from "@/src/theme/tokens";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type HeroRatio = "portrait" | "landscape";

interface HeroCardProps {
  /** Local or remote image source */
  imageSource: ImageSource;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  /** Portrait 4:5 (default) or landscape 16:9 */
  ratio?: HeroRatio;
  style?: ViewStyle;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function HeroCard({
  imageSource,
  title,
  subtitle,
  onPress,
  ratio = "portrait",
  style,
}: HeroCardProps) {
  const { colors } = useTheme();
  const aspectRatio = ratio === "landscape" ? 16 / 9 : 4 / 5;

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
      <Image
        source={imageSource}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        transition={200}
      />

      {/* Top text-safe zone (top ~28%) */}
      <View style={styles.topOverlay}>
        <Text style={[styles.title, { color: darkColors.text.primary }]} numberOfLines={2}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={[styles.subtitle, { color: darkColors.text.secondary }]} numberOfLines={2}>
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
    borderRadius: radii.xl,
    overflow: "hidden",
    ...shadows.card,
  },
  pressed: {
    opacity: 0.92,
  },
  topOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingTop: spacing["3xl"],
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.md,
  },
  title: {
    fontFamily: fontFamily.appBold,
    fontSize: 28,
    lineHeight: 34,
  },
  subtitle: {
    fontFamily: fontFamily.appRegular,
    fontSize: 16,
    lineHeight: 22,
    marginTop: spacing.xs,
  },
});
