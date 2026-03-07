import { StyleSheet, Text, View } from "react-native";
import type { ImageSource } from "expo-image";

import { ShareCard } from "@/src/components/cards/ShareCard";
import { fontFamily, radii, spacing, useTheme } from "@/src/theme";

import { getJourneyPracticeTone } from "./journey-practice-meta";
import { JourneyActionButton, JourneyPanel, JourneyTag } from "./journey-primitives";
import { getJourneyPracticeLabel, type JourneyPractice } from "./journey-types";

type JourneyHeroCardProps = {
  strongestPractice: JourneyPractice | null;
  strongestStreak: number;
  daysReturned: number;
  todaySalahCompletedCount: number;
  completedTodayCount: number;
  onOpenStreaks: () => void;
};

type JourneyStreakGatewayPanelProps = {
  completedTodayCount: number;
  onOpenStreaks: () => void;
};

type JourneySharePanelProps = {
  shareCardSource: ImageSource;
  headline: string;
  body: string;
  onShare: () => void;
};

export function JourneyHeroCard({
  strongestPractice,
  strongestStreak,
  daysReturned,
  todaySalahCompletedCount,
  completedTodayCount,
  onOpenStreaks,
}: JourneyHeroCardProps) {
  const { colors } = useTheme();

  const subtitle =
    strongestPractice && strongestStreak > 0
      ? `${getJourneyPracticeLabel(strongestPractice)} is leading at ${strongestStreak} day${
          strongestStreak === 1 ? "" : "s"
        }.`
      : "A small return today becomes the streak you carry tomorrow.";

  return (
    <View
      style={[
        styles.hero,
        {
          backgroundColor: colors.surface.card,
          borderColor: colors.surface.borderElevated,
        },
      ]}
    >
      <View style={[styles.heroGlowOne, { backgroundColor: "rgba(197, 160, 33, 0.18)" }]} />
      <View style={[styles.heroGlowTwo, { backgroundColor: "rgba(44, 82, 146, 0.16)" }]} />

      <View style={styles.heroBadge}>
        <Text style={[styles.heroBadgeLabel, { color: colors.text.primary }]} selectable>
          Journey
        </Text>
      </View>

      <View style={styles.heroCopy}>
        <Text style={[styles.heroTitle, { color: colors.text.primary }]} selectable>
          Keep showing up.
        </Text>
        <Text style={[styles.heroSubtitle, { color: colors.text.secondary }]} selectable>
          {subtitle}
        </Text>
      </View>

      <View style={styles.heroMetricRow}>
        <HeroMetric
          label={strongestPractice ? getJourneyPracticeLabel(strongestPractice) : "Strongest"}
          value={String(strongestStreak).padStart(2, "0")}
        />
        <HeroMetric label="Salah today" value={`${todaySalahCompletedCount}/5`} />
        <HeroMetric label="Days returned" value={String(daysReturned).padStart(2, "0")} />
      </View>

      <View
        style={[
          styles.heroNotice,
          {
            backgroundColor: colors.surface.background,
            borderColor: colors.surface.border,
          },
        ]}
      >
        <Text style={[styles.heroNoticeTitle, { color: colors.text.primary }]} selectable>
          In motion
        </Text>
        <Text style={[styles.heroNoticeBody, { color: colors.text.secondary }]} selectable>
          {completedTodayCount === 0
            ? "Nothing marked yet. Open My Streaks when you're ready."
            : `${completedTodayCount} of 4 streaks already moved today.`}
        </Text>
      </View>

      <JourneyActionButton label="Open My Streaks" onPress={onOpenStreaks} />
    </View>
  );
}

export function JourneyStreakGatewayPanel({
  completedTodayCount,
  onOpenStreaks,
}: JourneyStreakGatewayPanelProps) {
  const { colors } = useTheme();

  return (
    <JourneyPanel
      title="My Streaks"
      subtitle="Mark each Salah as it is done, then keep Quran, Fasting, and Dhikr close beside it."
    >
      <View
        style={[
          styles.gatewaySurface,
          {
            backgroundColor: colors.surface.background,
            borderColor: colors.surface.border,
          },
        ]}
      >
        <View style={styles.gatewayTagRow}>
          <JourneyTag label="Salah" tone={getJourneyPracticeTone("salah")} />
          <JourneyTag label="Quran" tone={getJourneyPracticeTone("quran")} />
          <JourneyTag label="Fasting" tone={getJourneyPracticeTone("fasting")} />
          <JourneyTag label="Dhikr" tone={getJourneyPracticeTone("dhikr")} />
        </View>

        <Text style={[styles.gatewayBody, { color: colors.text.secondary }]} selectable>
          {completedTodayCount === 0
            ? "A clean place to mark what you completed today."
            : "Your daily record is waiting there."}
        </Text>
      </View>

      <JourneyActionButton label="Mark today's progress" emphasis="secondary" onPress={onOpenStreaks} />
    </JourneyPanel>
  );
}

export function JourneySharePanel({
  shareCardSource,
  headline,
  body,
  onShare,
}: JourneySharePanelProps) {
  return (
    <JourneyPanel
      title="Share your journey"
      subtitle="Let the people around you see what has been keeping you steady."
    >
      <View style={styles.shareWrap}>
        <ShareCard
          imageSource={shareCardSource}
          headline={headline}
          body={body}
          footerLabel="pathofnur.com"
        />
      </View>

      <JourneyActionButton label="Share your streaks" emphasis="secondary" onPress={onShare} />
    </JourneyPanel>
  );
}

function HeroMetric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.heroMetric,
        {
          backgroundColor: "rgba(7, 11, 20, 0.58)",
          borderColor: colors.surface.borderElevated,
        },
      ]}
    >
      <Text style={[styles.heroMetricValue, { color: colors.text.primary }]} selectable>
        {value}
      </Text>
      <Text style={[styles.heroMetricLabel, { color: colors.text.secondary }]} selectable>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    gap: spacing.lg,
    overflow: "hidden",
    borderRadius: radii.xl,
    borderWidth: 1,
    padding: spacing.lg,
    boxShadow: "0 28px 56px rgba(0, 0, 0, 0.24)",
  },
  heroGlowOne: {
    position: "absolute",
    top: -64,
    right: -32,
    width: 180,
    height: 180,
    borderRadius: radii.pill,
    opacity: 0.9,
  },
  heroGlowTwo: {
    position: "absolute",
    bottom: -72,
    left: -28,
    width: 164,
    height: 164,
    borderRadius: radii.pill,
    opacity: 0.85,
  },
  heroBadge: {
    alignSelf: "flex-start",
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(7, 11, 20, 0.62)",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  heroBadgeLabel: {
    fontFamily: fontFamily.appSemiBold,
    fontSize: 12,
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  heroCopy: {
    gap: spacing.xs,
  },
  heroTitle: {
    fontFamily: fontFamily.appBold,
    fontSize: 36,
    lineHeight: 42,
    maxWidth: 240,
  },
  heroSubtitle: {
    fontFamily: fontFamily.appRegular,
    fontSize: 16,
    lineHeight: 24,
    maxWidth: 300,
  },
  heroMetricRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  heroMetric: {
    minWidth: 92,
    flexGrow: 1,
    gap: spacing.xs,
    borderRadius: radii.lg,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  heroMetricValue: {
    fontFamily: fontFamily.appBold,
    fontSize: 26,
    lineHeight: 30,
    fontVariant: ["tabular-nums"],
  },
  heroMetricLabel: {
    fontFamily: fontFamily.appSemiBold,
    fontSize: 12,
    lineHeight: 16,
  },
  heroNotice: {
    gap: spacing.xs,
    borderRadius: radii.lg,
    borderWidth: 1,
    padding: spacing.md,
  },
  heroNoticeTitle: {
    fontFamily: fontFamily.appSemiBold,
    fontSize: 13,
    lineHeight: 18,
  },
  heroNoticeBody: {
    fontFamily: fontFamily.appRegular,
    fontSize: 14,
    lineHeight: 20,
  },
  gatewaySurface: {
    gap: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1,
    padding: spacing.md,
  },
  gatewayTagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  gatewayBody: {
    fontFamily: fontFamily.appRegular,
    fontSize: 15,
    lineHeight: 22,
  },
  shareWrap: {
    alignSelf: "center",
    width: "74%",
    maxWidth: 280,
  },
});
