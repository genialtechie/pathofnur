import { Pressable, StyleSheet, Text, View } from "react-native";
import type { ImageSource } from "expo-image";

import { ShareCard } from "@/src/components/cards/ShareCard";
import { fontFamily, radii, spacing, useTheme } from "@/src/theme";

import { getJourneyPracticeTone } from "./journey-practice-meta";
import { JourneyActionButton, JourneyPanel, JourneyTag } from "./journey-primitives";
import { getJourneyPracticeLabel, type JourneyPractice } from "./journey-types";

type JourneyHeroCardProps = {
  strongestPractice: JourneyPractice | null;
  strongestStreak: number;
  activePracticeCount: number;
  remindersLabel: string;
  onOpenStreaks: () => void;
};

type JourneyStreakGatewayPanelProps = {
  activePractices: JourneyPractice[];
  streaks: Record<JourneyPractice, number>;
  onOpenStreaks: () => void;
};

type JourneyRoutineSummaryPanelProps = {
  activePractices: JourneyPractice[];
  remindersLabel: string;
  onEditRoutine: () => void;
};

type JourneySharePanelProps = {
  shareCardSource: ImageSource;
  headline: string;
  body: string;
  isDark: boolean;
  onShare: () => void;
};

export function JourneyHeroCard({
  strongestPractice,
  strongestStreak,
  activePracticeCount,
  remindersLabel,
  onOpenStreaks,
}: JourneyHeroCardProps) {
  const { colors } = useTheme();

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
      <View style={styles.heroGlowOne} />
      <View style={styles.heroGlowTwo} />

      <View style={styles.heroBadge}>
        <Text style={styles.heroBadgeLabel} selectable>
          Journey
        </Text>
      </View>

      <View style={styles.heroCopy}>
        <Text style={[styles.heroTitle, { color: colors.text.primary }]} selectable>
          Build a practice that keeps returning to you.
        </Text>
        <Text style={[styles.heroSubtitle, { color: colors.text.secondary }]} selectable>
          {strongestPractice
            ? `${getJourneyPracticeLabel(strongestPractice)} is leading at ${strongestStreak} day${
                strongestStreak === 1 ? "" : "s"
              }. ${remindersLabel}.`
            : "Choose the practices you want Path of Nur to support, then keep them visible every day."}
        </Text>
      </View>

      <View style={styles.heroMetaRow}>
        <HeroMetric label="Active practices" value={String(activePracticeCount).padStart(2, "0")} />
        <HeroMetric
          label="Prayer reminders"
          value={getHeroReminderValue(remindersLabel)}
        />
      </View>

      <JourneyActionButton label="Open practice streaks" onPress={onOpenStreaks} />
    </View>
  );
}

export function JourneyStreakGatewayPanel({
  activePractices,
  streaks,
  onOpenStreaks,
}: JourneyStreakGatewayPanelProps) {
  const { colors } = useTheme();

  return (
    <JourneyPanel
      title="Practice streaks"
      subtitle="Keep every active practice visible without crowding the Journey home."
    >
      <View style={styles.gatewayRow}>
        {activePractices.length > 0 ? (
          activePractices.map((practice) => (
            <View
              key={practice}
              style={[
                styles.gatewayStat,
                {
                  backgroundColor: colors.surface.background,
                  borderColor: colors.surface.border,
                },
              ]}
            >
              <Text style={[styles.gatewayLabel, { color: colors.text.tertiary }]} selectable>
                {getJourneyPracticeLabel(practice)}
              </Text>
              <Text style={[styles.gatewayValue, { color: colors.text.primary }]} selectable>
                {streaks[practice]}
              </Text>
            </View>
          ))
        ) : (
          <Text style={[styles.emptyCopy, { color: colors.text.secondary }]} selectable>
            Your active streaks will live here once you choose a routine.
          </Text>
        )}
      </View>

      <JourneyActionButton label="View all streaks" emphasis="secondary" onPress={onOpenStreaks} />
    </JourneyPanel>
  );
}

export function JourneyRoutineSummaryPanel({
  activePractices,
  remindersLabel,
  onEditRoutine,
}: JourneyRoutineSummaryPanelProps) {
  const { colors } = useTheme();

  return (
    <JourneyPanel
      title="Your routine"
      subtitle="Configured during onboarding, editable any time from a dedicated flow."
      badge={remindersLabel}
    >
      {activePractices.length > 0 ? (
        <View style={styles.tagRow}>
          {activePractices.map((practice) => (
            <JourneyTag
              key={practice}
              label={getJourneyPracticeLabel(practice)}
              tone={getJourneyPracticeTone(practice)}
            />
          ))}
        </View>
      ) : (
        <Text style={[styles.emptyCopy, { color: colors.text.secondary }]} selectable>
          No practices are active yet. Build a routine that matches how you want to return each day.
        </Text>
      )}

      <View
        style={[
          styles.routineNotice,
          {
            backgroundColor: colors.surface.background,
            borderColor: colors.surface.border,
          },
        ]}
      >
        <Text style={[styles.routineNoticeTitle, { color: colors.text.primary }]} selectable>
          Prayer reminders
        </Text>
        <Text style={[styles.routineNoticeCopy, { color: colors.text.secondary }]} selectable>
          {remindersLabel === "Active"
            ? "Scheduled before each prayer with a gentle follow-up check-in after."
            : "Configured from onboarding and editable here whenever your routine changes."}
        </Text>
      </View>

      <JourneyActionButton label="Edit routine" emphasis="secondary" onPress={onEditRoutine} />
    </JourneyPanel>
  );
}

export function JourneySharePanel({
  shareCardSource,
  headline,
  body,
  isDark,
  onShare,
}: JourneySharePanelProps) {
  const { colors } = useTheme();

  return (
    <JourneyPanel
      title="Share progress"
      subtitle="Celebrate the momentum, then let the platform share flow carry the moment."
    >
      <View style={styles.shareWrap}>
        <ShareCard
          imageSource={shareCardSource}
          headline={headline}
          body={body}
          footerLabel="pathofnur.com"
        />
      </View>

      <Pressable
        accessibilityRole="button"
        onPress={onShare}
        style={[
          styles.shareButton,
          {
            backgroundColor: isDark
              ? colors.surface.background
              : colors.surface.borderInteractive,
            borderColor: colors.surface.borderInteractive,
          },
        ]}
      >
        <Text style={[styles.shareButtonLabel, { color: colors.text.primary }]} selectable>
          Share progress
        </Text>
      </Pressable>
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
          backgroundColor: "rgba(7, 11, 20, 0.55)",
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

function getHeroReminderValue(remindersLabel: string) {
  if (remindersLabel === "Active") {
    return "On";
  }

  if (remindersLabel === "Off") {
    return "Off";
  }

  if (remindersLabel === "Permission needed") {
    return "Fix";
  }

  if (remindersLabel === "iOS / Android") {
    return "App";
  }

  return "Soon";
}

const styles = StyleSheet.create({
  hero: {
    overflow: "hidden",
    gap: spacing.lg,
    borderRadius: radii.xl,
    borderWidth: 1,
    padding: spacing.xl,
    boxShadow: "0 24px 48px rgba(0, 0, 0, 0.18)",
  },
  heroGlowOne: {
    position: "absolute",
    width: 240,
    height: 240,
    borderRadius: 240,
    top: -84,
    right: -68,
    backgroundColor: "rgba(197, 160, 33, 0.16)",
  },
  heroGlowTwo: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 180,
    bottom: -72,
    left: -32,
    backgroundColor: "rgba(44, 82, 146, 0.2)",
  },
  heroBadge: {
    alignSelf: "flex-start",
    borderRadius: radii.pill,
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  heroBadgeLabel: {
    color: "#F3F5F7",
    fontFamily: fontFamily.appSemiBold,
    fontSize: 12,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  heroCopy: {
    gap: spacing.sm,
    maxWidth: 300,
  },
  heroTitle: {
    fontFamily: fontFamily.appBold,
    fontSize: 30,
    lineHeight: 36,
  },
  heroSubtitle: {
    fontFamily: fontFamily.appRegular,
    fontSize: 16,
    lineHeight: 23,
  },
  heroMetaRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  heroMetric: {
    flex: 1,
    borderRadius: radii.lg,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  heroMetricValue: {
    fontFamily: fontFamily.appBold,
    fontSize: 22,
    lineHeight: 28,
    fontVariant: ["tabular-nums"],
  },
  heroMetricLabel: {
    fontFamily: fontFamily.appRegular,
    fontSize: 13,
    lineHeight: 18,
    marginTop: spacing.xs,
  },
  gatewayRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  gatewayStat: {
    minWidth: "47%",
    flexGrow: 1,
    borderRadius: radii.lg,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  gatewayLabel: {
    fontFamily: fontFamily.appSemiBold,
    fontSize: 13,
    lineHeight: 18,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  gatewayValue: {
    fontFamily: fontFamily.appBold,
    fontSize: 30,
    lineHeight: 36,
    marginTop: spacing.xs,
    fontVariant: ["tabular-nums"],
  },
  tagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  emptyCopy: {
    fontFamily: fontFamily.appRegular,
    fontSize: 15,
    lineHeight: 22,
  },
  routineNotice: {
    gap: spacing.xs,
    borderRadius: radii.lg,
    borderWidth: 1,
    padding: spacing.md,
  },
  routineNoticeTitle: {
    fontFamily: fontFamily.appSemiBold,
    fontSize: 15,
    lineHeight: 18,
  },
  routineNoticeCopy: {
    fontFamily: fontFamily.appRegular,
    fontSize: 14,
    lineHeight: 20,
  },
  shareWrap: {
    alignSelf: "center",
    width: "74%",
    maxWidth: 280,
  },
  shareButton: {
    minHeight: 52,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radii.pill,
    borderWidth: 1,
    paddingHorizontal: spacing.lg,
  },
  shareButtonLabel: {
    fontFamily: fontFamily.appBold,
    fontSize: 16,
    lineHeight: 20,
  },
});
