import {
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from "react-native";
import { Image, type ImageSource } from "expo-image";

import { fontFamily, radii, shadows, spacing, useTheme } from "@/src/theme";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ShareCardProps {
  /** Background art source */
  imageSource: ImageSource;
  /** Top-zone headline (e.g. "Day 7 Complete") */
  headline: string;
  /** Mid-zone body text */
  body?: string;
  /** Bottom-zone footer label (e.g. "pathofnur.com") */
  footerLabel?: string;
  style?: ViewStyle;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ShareCard({
  imageSource,
  headline,
  body,
  footerLabel,
  style,
}: ShareCardProps) {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.surface.card }, style]}>
      <Image
        source={imageSource}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        transition={200}
      />

      {/* Top text-safe zone (~22%) */}
      <View style={styles.topZone}>
        <Text style={[styles.headline, { color: colors.text.primary }]}>{headline}</Text>
        {body ? (
          <Text style={[styles.body, { color: colors.text.secondary }]} numberOfLines={3}>
            {body}
          </Text>
        ) : null}
      </View>

      {/* Bottom text-safe zone (~20%) */}
      {footerLabel ? (
        <View style={styles.bottomZone}>
          <Text style={[styles.footer, { color: colors.text.tertiary }]}>{footerLabel}</Text>
        </View>
      ) : null}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    aspectRatio: 9 / 16,
    borderRadius: radii.xl,
    overflow: "hidden",
    ...shadows.card,
  },
  topZone: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingTop: spacing["4xl"],
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.md,
    gap: spacing.xs,
  },
  headline: {
    fontFamily: fontFamily.accentDisplay,
    fontSize: 28,
    lineHeight: 34,
    textAlign: "center",
  },
  body: {
    fontFamily: fontFamily.appRegular,
    fontSize: 16,
    lineHeight: 22,
    textAlign: "center",
  },
  bottomZone: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: spacing["3xl"],
    paddingHorizontal: spacing.xl,
  },
  footer: {
    fontFamily: fontFamily.appSemiBold,
    fontSize: 13,
    textAlign: "center",
    letterSpacing: 0.5,
  },
});
