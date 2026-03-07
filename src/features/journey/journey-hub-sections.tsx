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
      ? `${getJourneyPracticeLabel(strongestPractice)} is carrying your strongest pull right now. Keep that thread warm and let the rest follow.`
      : "A small return today becomes the rhythm you can trust tomorrow.";
  const strongestLabel = strongestPractice ? getJourneyPracticeLabel(strongestPractice) : "Today's return";
  const motionLabel = completedTodayCount === 0 ? "Fresh start" : `${completedTodayCount} of 4 moving`;

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

      <View style={styles.heroTopRow}>
        <View
          style={[
            styles.heroEyebrow,
            {
              backgroundColor: "rgba(7, 11, 20, 0.54)",
              borderColor: "rgba(255,255,255,0.08)",
            },
          ]}
        >
          <Text style={[styles.heroEyebrowLabel, { color: colors.brand.metallicGold }]} selectable>
            Today's pull
          </Text>
        </View>

        <View
          style={[
            styles.heroStatusPill,
            {
              backgroundColor: completedTodayCount > 0 ? "rgba(197, 160, 33, 0.16)" : colors.surface.background,
              borderColor: completedTodayCount > 0 ? "rgba(197, 160, 33, 0.28)" : colors.surface.border,
            },
          ]}
        >
          <Text
            style={[
              styles.heroStatusLabel,
              { color: completedTodayCount > 0 ? colors.brand.metallicGold : colors.text.secondary },
            ]}
            selectable
          >
            {motionLabel}
          </Text>
        </View>
      </View>

      <View style={styles.heroCopy}>
        <Text style={[styles.heroTitle, { color: colors.text.primary }]} selectable>
          Let today draw you back.
        </Text>
        <Text style={[styles.heroSubtitle, { color: colors.text.secondary }]} selectable>
          {subtitle}
        </Text>
      </View>

      <View style={styles.heroStage}>
        <View
          style={[
            styles.heroPrimaryTile,
            {
              backgroundColor: "rgba(7, 11, 20, 0.54)",
              borderColor: "rgba(197, 160, 33, 0.26)",
            },
          ]}
        >
          <Text style={[styles.heroPrimaryValue, { color: colors.text.primary }]} selectable>
            {String(strongestStreak).padStart(2, "0")}
          </Text>
          <Text style={[styles.heroPrimaryLabel, { color: colors.brand.metallicGold }]} selectable>
            {strongestLabel}
          </Text>
          <Text style={[styles.heroPrimaryCaption, { color: colors.text.secondary }]} selectable>
            {strongestStreak > 0 ? "strongest streak right now" : "ready to become your first streak"}
          </Text>
        </View>

        <View style={styles.heroSecondaryColumn}>
          <HeroMetric label="Salah today" value={`${todaySalahCompletedCount}/5`} />
          <HeroMetric label="Days returned" value={String(daysReturned).padStart(2, "0")} />
        </View>
      </View>

      <View
        style={[
          styles.heroNotice,
          {
            backgroundColor: "rgba(7, 11, 20, 0.52)",
            borderColor: "rgba(255,255,255,0.08)",
          },
        ]}
      >
        <Text style={[styles.heroNoticeTitle, { color: colors.text.primary }]} selectable>
          {strongestStreak > 0 ? `${strongestLabel} is leading.` : "A steady return builds fast."}
        </Text>
        <Text style={[styles.heroNoticeBody, { color: colors.text.secondary }]} selectable>
          {completedTodayCount === 0
            ? "Nothing is marked yet. Open My Streaks when you're ready and let the first checkoff set the tone."
            : `${completedTodayCount} of 4 streaks are already moving today. Keep the warmth going before the day closes.`}
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
  const gatewayStatus = completedTodayCount === 0 ? "Ready for today" : `${completedTodayCount} of 4 moved`;

  return (
    <View
      style={[
        styles.gatewayCard,
        {
          backgroundColor: colors.surface.card,
          borderColor: colors.surface.borderElevated,
        },
      ]}
    >
      <View style={[styles.gatewayGlowOne, { backgroundColor: "rgba(197, 160, 33, 0.14)" }]} />
      <View style={[styles.gatewayGlowTwo, { backgroundColor: "rgba(44, 82, 146, 0.18)" }]} />

      <View style={styles.gatewayTopRow}>
        <View
          style={[
            styles.gatewayEyebrow,
            {
              backgroundColor: "rgba(7, 11, 20, 0.52)",
              borderColor: "rgba(255,255,255,0.08)",
            },
          ]}
        >
          <Text style={[styles.gatewayEyebrowLabel, { color: colors.text.primary }]} selectable>
            My Streaks
          </Text>
        </View>

        <View
          style={[
            styles.gatewayStatusPill,
            {
              backgroundColor: completedTodayCount > 0 ? "rgba(197, 160, 33, 0.16)" : colors.surface.background,
              borderColor: completedTodayCount > 0 ? "rgba(197, 160, 33, 0.28)" : colors.surface.border,
            },
          ]}
        >
          <Text
            style={[
              styles.gatewayStatusLabel,
              { color: completedTodayCount > 0 ? colors.brand.metallicGold : colors.text.secondary },
            ]}
            selectable
          >
            {gatewayStatus}
          </Text>
        </View>
      </View>

      <View style={styles.gatewayCopy}>
        <Text style={[styles.gatewayTitle, { color: colors.text.primary }]} selectable>
          Keep the record warm.
        </Text>
        <Text style={[styles.gatewaySubtitle, { color: colors.text.secondary }]} selectable>
          Mark each Salah as it lands, then keep Quran, Fasting, and Dhikr moving beside it.
        </Text>
      </View>

      <View
        style={[
          styles.gatewaySurface,
          {
            backgroundColor: "rgba(7, 11, 20, 0.48)",
            borderColor: "rgba(255,255,255,0.08)",
          },
        ]}
      >
        <View style={styles.gatewayTagRow}>
          <JourneyTag label="🤲 Salah" tone={getJourneyPracticeTone("salah")} />
          <JourneyTag label="📖 Quran" tone={getJourneyPracticeTone("quran")} />
          <JourneyTag label="🌙 Fasting" tone={getJourneyPracticeTone("fasting")} />
          <JourneyTag label="📿 Dhikr" tone={getJourneyPracticeTone("dhikr")} />
        </View>

        <Text style={[styles.gatewayBody, { color: colors.text.secondary }]} selectable>
          {completedTodayCount === 0
            ? "A clean place to begin today's checkoff."
            : "Your daily record is already moving. Step in before the momentum cools."}
        </Text>
      </View>

      <JourneyActionButton label="Mark today's progress" onPress={onOpenStreaks} />
    </View>
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
  heroTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  heroEyebrow: {
    borderRadius: radii.pill,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  heroEyebrowLabel: {
    fontFamily: fontFamily.appSemiBold,
    fontSize: 12,
    letterSpacing: 0.3,
  },
  heroStatusPill: {
    borderRadius: radii.pill,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  heroStatusLabel: {
    fontFamily: fontFamily.appSemiBold,
    fontSize: 12,
    lineHeight: 16,
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
  heroCopy: {
    gap: spacing.xs,
  },
  heroTitle: {
    fontFamily: fontFamily.appBold,
    fontSize: 36,
    lineHeight: 42,
    maxWidth: 280,
  },
  heroSubtitle: {
    fontFamily: fontFamily.appRegular,
    fontSize: 16,
    lineHeight: 24,
    maxWidth: 320,
  },
  heroStage: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: spacing.md,
  },
  heroPrimaryTile: {
    flex: 1.18,
    justifyContent: "center",
    gap: spacing.xs,
    borderRadius: radii.xl,
    borderWidth: 1,
    padding: spacing.lg,
    minHeight: 192,
  },
  heroPrimaryValue: {
    fontFamily: fontFamily.appBold,
    fontSize: 60,
    lineHeight: 62,
    fontVariant: ["tabular-nums"],
  },
  heroPrimaryLabel: {
    fontFamily: fontFamily.appSemiBold,
    fontSize: 16,
    lineHeight: 20,
  },
  heroPrimaryCaption: {
    fontFamily: fontFamily.appRegular,
    fontSize: 13,
    lineHeight: 18,
    maxWidth: 180,
  },
  heroSecondaryColumn: {
    flex: 0.82,
    justifyContent: "space-between",
    gap: spacing.sm,
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
    minHeight: 92,
    justifyContent: "space-between",
  },
  heroMetricValue: {
    fontFamily: fontFamily.appBold,
    fontSize: 30,
    lineHeight: 34,
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
  gatewayCard: {
    gap: spacing.md,
    overflow: "hidden",
    borderRadius: radii.xl,
    borderWidth: 1,
    padding: spacing.lg,
    boxShadow: "0 24px 52px rgba(0, 0, 0, 0.22)",
  },
  gatewayGlowOne: {
    position: "absolute",
    top: -52,
    right: -12,
    width: 188,
    height: 188,
    borderRadius: radii.pill,
    opacity: 0.92,
  },
  gatewayGlowTwo: {
    position: "absolute",
    bottom: -58,
    left: -18,
    width: 164,
    height: 164,
    borderRadius: radii.pill,
    opacity: 0.86,
  },
  gatewayTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  gatewayEyebrow: {
    borderRadius: radii.pill,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  gatewayEyebrowLabel: {
    fontFamily: fontFamily.appSemiBold,
    fontSize: 12,
    lineHeight: 16,
  },
  gatewayStatusPill: {
    borderRadius: radii.pill,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  gatewayStatusLabel: {
    fontFamily: fontFamily.appSemiBold,
    fontSize: 12,
    lineHeight: 16,
  },
  gatewayCopy: {
    gap: spacing.xs,
  },
  gatewayTitle: {
    fontFamily: fontFamily.appBold,
    fontSize: 28,
    lineHeight: 34,
    maxWidth: 260,
  },
  gatewaySubtitle: {
    fontFamily: fontFamily.appRegular,
    fontSize: 15,
    lineHeight: 22,
    maxWidth: 320,
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
