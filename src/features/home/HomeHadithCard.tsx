import { useCallback } from "react";
import {
  Pressable,
  Share,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";

import { fontFamily, radii, spacing, useTheme } from "@/src/theme";

const DAILY_HADITH = {
  label: "Today's Hadith",
  quote:
    "The most beloved deeds to Allah are those that are most consistent, even if they are small.",
  source: "Sahih al-Bukhari 6464",
} as const;

export function HomeHadithCard() {
  const { colors, isDark } = useTheme();

  const handleShare = useCallback(async () => {
    try {
      await Share.share({
        message: `"${DAILY_HADITH.quote}"\n\n${DAILY_HADITH.source}\n\nShared from Path of Nur`,
      });
    } catch (error) {
      console.error("Failed to share hadith:", error);
    }
  }, []);

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.surface.card,
          borderColor: colors.surface.borderInteractive,
        },
      ]}
    >
      <View
        pointerEvents="none"
        style={[
          styles.glowLarge,
          {
            backgroundColor: isDark
              ? "rgba(197, 160, 33, 0.12)"
              : "rgba(197, 160, 33, 0.08)",
          },
        ]}
      />
      <View
        pointerEvents="none"
        style={[
          styles.glowSmall,
          {
            backgroundColor: isDark
              ? "rgba(44, 82, 146, 0.18)"
              : "rgba(44, 82, 146, 0.08)",
          },
        ]}
      />

      <View style={styles.topRow}>
        <View style={styles.labelRow}>
          <View
            style={[
              styles.labelDot,
              { backgroundColor: colors.brand.metallicGold },
            ]}
          />
          <Text style={[styles.label, { color: colors.text.tertiary }]}>
            {DAILY_HADITH.label}
          </Text>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Share today's hadith"
          onPress={handleShare}
          style={[
            styles.shareButton,
            {
              backgroundColor: colors.interactive.selectedBackground,
              borderColor: colors.surface.borderInteractive,
            },
          ]}
        >
          <Ionicons
            name="share-social-outline"
            size={14}
            color={colors.brand.metallicGold}
          />
          <Text style={[styles.shareLabel, { color: colors.brand.metallicGold }]}>
            Share
          </Text>
        </Pressable>
      </View>

      <Text style={[styles.quote, { color: colors.text.primary }]} selectable>
        "{DAILY_HADITH.quote}"
      </Text>

      <Text style={[styles.source, { color: colors.text.secondary }]} selectable>
        {DAILY_HADITH.source}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: spacing.xl,
    marginHorizontal: spacing.xl,
    borderWidth: 1,
    borderRadius: radii.xl,
    overflow: "hidden",
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    gap: spacing.lg,
  },
  glowLarge: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 999,
    top: -90,
    right: -24,
  },
  glowSmall: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 999,
    bottom: -48,
    left: -18,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: spacing.md,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  labelDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
  },
  label: {
    fontFamily: fontFamily.appSemiBold,
    fontSize: 12,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  shareButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    minHeight: 32,
    borderWidth: 1,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.sm,
  },
  shareLabel: {
    fontFamily: fontFamily.appSemiBold,
    fontSize: 13,
  },
  quote: {
    fontFamily: fontFamily.scriptureRegular,
    fontSize: 22,
    lineHeight: 32,
  },
  source: {
    fontFamily: fontFamily.appSemiBold,
    fontSize: 13,
    letterSpacing: 0.3,
  },
});
