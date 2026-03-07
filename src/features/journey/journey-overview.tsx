import { StyleSheet, Text, View } from "react-native";
import { Image, type ImageSource } from "expo-image";

import { fontFamily, radii, spacing, useTheme } from "@/src/theme";

import { JourneyStreakCard } from "./journey-primitives";

type JourneyOverviewProps = {
  heroSource: ImageSource;
  routineConfigured: boolean;
  routineItemsLabel: string;
  nextPrayerSummary: string;
  todayProgressPercent: number;
  prayerStreak: number;
  streaks: {
    prayer: number;
    fasting: number;
    reading: number;
  };
  selectedPrayerCount: number;
  fastingEnabled: boolean;
  readingEnabled: boolean;
  isCompact: boolean;
};

export function JourneyOverview({
  heroSource,
  routineConfigured,
  routineItemsLabel,
  nextPrayerSummary,
  todayProgressPercent,
  prayerStreak,
  streaks,
  selectedPrayerCount,
  fastingEnabled,
  readingEnabled,
  isCompact,
}: JourneyOverviewProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.wrapper}>
      <View
        style={[
          styles.hero,
          {
            backgroundColor: colors.surface.card,
            borderColor: colors.surface.borderElevated,
          },
        ]}
      >
        <Image source={heroSource} style={StyleSheet.absoluteFill} contentFit="cover" />
        <View style={styles.heroOverlay} />

        <View style={styles.heroHeader}>
          <View style={styles.heroBadge}>
            <Text style={styles.heroBadgeLabel} selectable>
              Journey
            </Text>
          </View>
          <Text style={styles.heroTitle} selectable>
            Build a routine that keeps returning to you.
          </Text>
          <Text style={styles.heroSubtitle} selectable>
            {routineConfigured
              ? `${routineItemsLabel}. ${nextPrayerSummary}`
              : "Choose the prayers and habits you want Path of Nur to protect each day."}
          </Text>
        </View>

        <View style={styles.heroFooter}>
          <View style={styles.heroMetric}>
            <Text style={styles.heroMetricValue} selectable>
              {todayProgressPercent}%
            </Text>
            <Text style={styles.heroMetricLabel} selectable>
              today
            </Text>
          </View>
          <View style={styles.heroMetric}>
            <Text style={styles.heroMetricValue} selectable>
              {prayerStreak}
            </Text>
            <Text style={styles.heroMetricLabel} selectable>
              prayer streak
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text.primary }]} selectable>
          Your streaks
        </Text>
        <View style={styles.statGrid}>
          <JourneyStreakCard
            label="Prayer"
            streak={streaks.prayer}
            accent={colors.brand.metallicGold}
            subtitle={
              selectedPrayerCount > 0
                ? `${selectedPrayerCount} prayer${selectedPrayerCount === 1 ? "" : "s"} in your routine`
                : "Choose your prayers"
            }
            compact={isCompact}
          />
          <JourneyStreakCard
            label="Fasting"
            streak={streaks.fasting}
            accent={colors.brand.deepForestGreen}
            subtitle={fastingEnabled ? "Track each day you fast" : "Enable fasting in your routine"}
            compact={isCompact}
          />
          <JourneyStreakCard
            label="Reading"
            streak={streaks.reading}
            accent={colors.brand.midnightBlue}
            subtitle={readingEnabled ? "Keep your daily reading alive" : "Enable reading in your routine"}
            compact={isCompact}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: spacing.lg,
  },
  hero: {
    minHeight: 340,
    borderRadius: radii.xl,
    overflow: "hidden",
    borderWidth: 1,
    justifyContent: "space-between",
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(7, 11, 20, 0.48)",
  },
  heroHeader: {
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
  },
  heroBadge: {
    alignSelf: "flex-start",
    borderRadius: radii.pill,
    backgroundColor: "rgba(7, 11, 20, 0.62)",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  heroBadgeLabel: {
    color: "#f3f5f7",
    fontFamily: fontFamily.appSemiBold,
    fontSize: 13,
    letterSpacing: 0.4,
  },
  heroTitle: {
    color: "#f3f5f7",
    fontFamily: fontFamily.appBold,
    fontSize: 30,
    lineHeight: 36,
    maxWidth: 280,
  },
  heroSubtitle: {
    color: "#d6deea",
    fontFamily: fontFamily.appRegular,
    fontSize: 16,
    lineHeight: 22,
    maxWidth: 320,
  },
  heroFooter: {
    flexDirection: "row",
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
  },
  heroMetric: {
    flex: 1,
    borderRadius: radii.lg,
    backgroundColor: "rgba(7, 11, 20, 0.56)",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  heroMetricValue: {
    color: "#f3f5f7",
    fontFamily: fontFamily.appBold,
    fontSize: 26,
    lineHeight: 30,
    fontVariant: ["tabular-nums"],
  },
  heroMetricLabel: {
    color: "#d6deea",
    fontFamily: fontFamily.appRegular,
    fontSize: 13,
    marginTop: spacing.xs,
  },
  section: {
    gap: spacing.md,
  },
  sectionTitle: {
    fontFamily: fontFamily.appBold,
    fontSize: 22,
    lineHeight: 28,
  },
  statGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
});
