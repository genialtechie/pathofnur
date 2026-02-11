import {
  Image,
  type ImageSourcePropType,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from "react-native";

import { fontFamily } from "@/src/theme";
import { colors, radii, shadows, spacing } from "@/src/theme/tokens";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ShareCardProps {
  /** Background art source */
  imageSource: ImageSourcePropType;
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
  return (
    <View style={[styles.container, style]}>
      <Image
        source={imageSource}
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
      />

      {/* Top text-safe zone (~22%) */}
      <View style={styles.topZone}>
        <Text style={styles.headline}>{headline}</Text>
        {body ? (
          <Text style={styles.body} numberOfLines={3}>
            {body}
          </Text>
        ) : null}
      </View>

      {/* Bottom text-safe zone (~20%) */}
      {footerLabel ? (
        <View style={styles.bottomZone}>
          <Text style={styles.footer}>{footerLabel}</Text>
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
    backgroundColor: colors.surface.card,
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
    color: colors.text.primary,
    fontFamily: fontFamily.accentDisplay,
    fontSize: 28,
    lineHeight: 34,
    textAlign: "center",
  },
  body: {
    color: colors.text.secondary,
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
    color: colors.text.tertiary,
    fontFamily: fontFamily.appSemiBold,
    fontSize: 13,
    textAlign: "center",
    letterSpacing: 0.5,
  },
});
