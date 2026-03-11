import { useCallback } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import * as Haptics from "expo-haptics";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Stack, useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { fontFamily, radii, spacing, useTheme } from "@/src/theme";

import {
  trackJourneyHabitToggled,
  trackJourneyPrayerCheckinCompleted,
  trackJourneyScreenView,
} from "./journey-analytics";
import { getJourneyPracticeAccent, getJourneyPracticeActionCopy } from "./journey-practice-meta";
import {
  JourneyActionButton,
  JourneyHistoryStrip,
  JourneyPanel,
} from "./journey-primitives";
import {
  JOURNEY_HABITS,
  JOURNEY_PRAYERS,
  getJourneyPrayerLabel,
  getJourneyPracticeLabel,
  type JourneyHabit,
  type JourneyPractice,
} from "./journey-types";
import { useJourneyProgress } from "./useJourneyProgress";

export function JourneyStreaksScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const {
    completionCounts,
    isLoading,
    longestStreaks,
    recentPracticeHistory,
    streaks,
    todayKey,
    todaySalahComplete,
    todaySalahCompletedCount,
    todayStatus,
    toggleHabitCompletion,
    togglePrayerCompletion,
  } = useJourneyProgress();

  useFocusEffect(
    useCallback(() => {
      void trackJourneyScreenView("journey-streaks");
    }, [])
  );

  const handleTogglePrayer = useCallback(
    async (prayer: (typeof JOURNEY_PRAYERS)[number]) => {
      const nextComplete = !todayStatus.prayers[prayer];
      const nextPrayerCount = nextComplete
        ? todaySalahCompletedCount + 1
        : todaySalahCompletedCount - 1;
      const didCompleteDay = nextComplete && nextPrayerCount === JOURNEY_PRAYERS.length;

      togglePrayerCompletion(prayer);
      void trackJourneyPrayerCheckinCompleted(prayer, nextComplete, todayKey);

      if (didCompleteDay) {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        return;
      }

      await Haptics.impactAsync(
        nextComplete ? Haptics.ImpactFeedbackStyle.Light : Haptics.ImpactFeedbackStyle.Soft
      );
    },
    [todayKey, todaySalahCompletedCount, todayStatus.prayers, togglePrayerCompletion]
  );

  const handleToggleHabit = useCallback(
    async (habit: JourneyHabit) => {
      const nextComplete = !todayStatus.habits[habit];

      toggleHabitCompletion(habit);
      void trackJourneyHabitToggled(habit, nextComplete, todayKey);

      await Haptics.impactAsync(
        nextComplete ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Soft
      );
    },
    [todayKey, todayStatus.habits, toggleHabitCompletion]
  );

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={[
        styles.container,
        {
          backgroundColor: colors.surface.background,
          paddingTop: spacing.lg,
          paddingBottom: insets.bottom + 88,
        },
      ]}
    >
      <Stack.Screen
        options={{
          headerShown: true,
          title: "My Streaks",
          headerBackTitle: "Journey",
          headerShadowVisible: false,
          headerStyle: {
            backgroundColor: colors.surface.background,
          },
          headerTintColor: colors.text.primary,
          headerTitleStyle: {
            color: colors.text.primary,
            fontFamily: fontFamily.appBold,
          },
        }}
      />

      <View style={styles.intro}>
        <Text style={[styles.introTitle, { color: colors.text.primary }]} selectable>
          Mark what you completed today.
        </Text>
        <Text style={[styles.introBody, { color: colors.text.secondary }]} selectable>
          Keep each Salah, your Quran, your fasting, and your dhikr in one place.
        </Text>
      </View>

      {isLoading ? (
        <JourneyPanel>
          <Text style={[styles.emptyCopy, { color: colors.text.secondary }]} selectable>
            Loading your streaks...
          </Text>
        </JourneyPanel>
      ) : (
        <>
          <SalahCard
            completedCount={todaySalahCompletedCount}
            completionCount={completionCounts.salah}
            currentStreak={streaks.salah}
            isCompleteToday={todaySalahComplete}
            longestStreak={longestStreaks.salah}
            onTogglePrayer={handleTogglePrayer}
            prayerStatus={todayStatus.prayers}
            recentHistory={recentPracticeHistory.salah}
          />

          {JOURNEY_HABITS.map((habit) => (
            <HabitCard
              key={habit}
              practice={habit}
              currentStreak={streaks[habit]}
              longestStreak={longestStreaks[habit]}
              completionCount={completionCounts[habit]}
              isCompleteToday={todayStatus.habits[habit]}
              recentHistory={recentPracticeHistory[habit]}
              onToggle={() => void handleToggleHabit(habit)}
            />
          ))}
        </>
      )}
    </ScrollView>
  );
}

function SalahCard({
  completedCount,
  completionCount,
  currentStreak,
  isCompleteToday,
  longestStreak,
  onTogglePrayer,
  prayerStatus,
  recentHistory,
}: {
  completedCount: number;
  completionCount: number;
  currentStreak: number;
  isCompleteToday: boolean;
  longestStreak: number;
  onTogglePrayer: (prayer: (typeof JOURNEY_PRAYERS)[number]) => void;
  prayerStatus: Record<(typeof JOURNEY_PRAYERS)[number], boolean>;
  recentHistory: Array<{ dateKey: string; label: string; isComplete: boolean }>;
}) {
  const { colors } = useTheme();
  const accent = getJourneyPracticeAccent("salah", colors);
  const remainingCount = JOURNEY_PRAYERS.length - completedCount;

  return (
    <View
      style={[
        styles.salahCard,
        {
          backgroundColor: colors.surface.card,
          borderColor: colors.surface.borderElevated,
        },
      ]}
    >
      <View style={[styles.salahGlow, { backgroundColor: "rgba(197, 160, 33, 0.15)" }]} />

      <View style={styles.salahHeader}>
        <View style={styles.salahTitleGroup}>
          <Text style={[styles.salahTitle, { color: colors.text.primary }]} selectable>
            Salah
          </Text>
          <Text style={[styles.salahSubtitle, { color: colors.text.secondary }]} selectable>
            Mark each prayer as it is done.
          </Text>
        </View>

        <View
          style={[
            styles.salahStatusPill,
            {
              backgroundColor: isCompleteToday ? `${accent}20` : colors.surface.background,
              borderColor: isCompleteToday ? `${accent}55` : colors.surface.border,
            },
          ]}
        >
          <Text
            style={[
              styles.salahStatusLabel,
              { color: isCompleteToday ? accent : colors.text.secondary },
            ]}
            selectable
          >
            {isCompleteToday ? "Complete today" : `${completedCount}/5 marked`}
          </Text>
        </View>
      </View>

      <View style={styles.salahStage}>
        <View
          style={[
            styles.salahCountOrb,
            {
              backgroundColor: colors.surface.background,
              borderColor: `${accent}55`,
            },
          ]}
        >
          <Text style={[styles.salahCountValue, { color: colors.text.primary }]} selectable>
            {String(currentStreak).padStart(2, "0")}
          </Text>
          <Text style={[styles.salahCountLabel, { color: colors.text.secondary }]} selectable>
            Salah streak
          </Text>
        </View>

        <View style={styles.salahMetaColumn}>
          <MetricTile label="Best" value={longestStreak} accent={accent} />
          <MetricTile label="Days kept" value={completionCount} accent={accent} />
        </View>
      </View>

      <View style={styles.prayerGrid}>
        {JOURNEY_PRAYERS.map((prayer) => {
          const isComplete = prayerStatus[prayer];

          return (
            <Pressable
              key={prayer}
              accessibilityRole="button"
              onPress={() => onTogglePrayer(prayer)}
              style={[
                styles.prayerButton,
                {
                  backgroundColor: isComplete ? `${accent}18` : colors.surface.background,
                  borderColor: isComplete ? `${accent}66` : colors.surface.border,
                },
              ]}
            >
              <View
                style={[
                  styles.prayerIcon,
                  {
                    backgroundColor: isComplete ? accent : colors.surface.card,
                    borderColor: isComplete ? accent : colors.surface.border,
                  },
                ]}
              >
                <Ionicons
                  name={isComplete ? "checkmark" : "ellipse-outline"}
                  size={16}
                  color={isComplete ? colors.text.onAccent : colors.text.tertiary}
                />
              </View>

              <Text style={[styles.prayerLabel, { color: colors.text.primary }]} selectable>
                {getJourneyPrayerLabel(prayer)}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <JourneyHistoryStrip items={recentHistory} accent={accent} />

      <Text style={[styles.salahFooter, { color: colors.text.secondary }]} selectable>
        {isCompleteToday
          ? "All five prayers are marked for today."
          : remainingCount === 1
            ? "One prayer left to complete today's Salah."
            : `${remainingCount} prayers left to complete today's Salah.`}
      </Text>
    </View>
  );
}

function HabitCard({
  practice,
  currentStreak,
  longestStreak,
  completionCount,
  isCompleteToday,
  recentHistory,
  onToggle,
}: {
  practice: Exclude<JourneyPractice, "salah">;
  currentStreak: number;
  longestStreak: number;
  completionCount: number;
  isCompleteToday: boolean;
  recentHistory: Array<{ dateKey: string; label: string; isComplete: boolean }>;
  onToggle: () => void;
}) {
  const { colors } = useTheme();
  const accent = getJourneyPracticeAccent(practice, colors);

  return (
    <JourneyPanel
      title={getJourneyPracticeLabel(practice)}
      subtitle={getJourneyPracticeActionCopy(practice)}
      badge={isCompleteToday ? "Marked today" : "Ready"}
    >
      <View style={styles.habitMetricsRow}>
        <View
          style={[
            styles.habitStreakTile,
            {
              backgroundColor: colors.surface.background,
              borderColor: colors.surface.border,
            },
          ]}
        >
          <Text style={[styles.habitStreakValue, { color: colors.text.primary }]} selectable>
            {String(currentStreak).padStart(2, "0")}
          </Text>
          <Text style={[styles.habitStreakLabel, { color: colors.text.secondary }]} selectable>
            Current streak
          </Text>
        </View>

        <View style={styles.habitMetaTiles}>
          <MetricTile label="Best" value={longestStreak} accent={accent} />
          <MetricTile label="Days kept" value={completionCount} accent={accent} />
        </View>
      </View>

      <JourneyHistoryStrip items={recentHistory} accent={accent} />

      <JourneyActionButton
        label={isCompleteToday ? "Undo today" : `Mark ${getJourneyPracticeLabel(practice)}`}
        emphasis={isCompleteToday ? "secondary" : "primary"}
        onPress={onToggle}
      />
    </JourneyPanel>
  );
}

function MetricTile({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent: string;
}) {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.metricTile,
        {
          backgroundColor: colors.surface.background,
          borderColor: colors.surface.border,
        },
      ]}
    >
      <Text style={[styles.metricLabel, { color: colors.text.tertiary }]} selectable>
        {label}
      </Text>
      <Text style={[styles.metricValue, { color: colors.text.primary }]} selectable>
        {String(value).padStart(2, "0")}
      </Text>
      <View style={[styles.metricAccent, { backgroundColor: accent }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  intro: {
    gap: spacing.xs,
    paddingTop: spacing.sm,
  },
  introTitle: {
    fontFamily: fontFamily.appBold,
    fontSize: 32,
    lineHeight: 38,
    maxWidth: 280,
  },
  introBody: {
    fontFamily: fontFamily.appRegular,
    fontSize: 16,
    lineHeight: 23,
    maxWidth: 320,
  },
  emptyCopy: {
    fontFamily: fontFamily.appRegular,
    fontSize: 15,
    lineHeight: 22,
  },
  salahCard: {
    gap: spacing.lg,
    overflow: "hidden",
    borderRadius: radii.xl,
    borderWidth: 1,
    padding: spacing.lg,
    boxShadow: "0 24px 48px rgba(0, 0, 0, 0.22)",
  },
  salahGlow: {
    position: "absolute",
    top: -44,
    right: -32,
    width: 180,
    height: 180,
    borderRadius: radii.pill,
  },
  salahHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  salahTitleGroup: {
    flex: 1,
    gap: spacing.xs,
  },
  salahTitle: {
    fontFamily: fontFamily.appBold,
    fontSize: 30,
    lineHeight: 34,
  },
  salahSubtitle: {
    fontFamily: fontFamily.appRegular,
    fontSize: 15,
    lineHeight: 22,
    maxWidth: 240,
  },
  salahStatusPill: {
    alignSelf: "flex-start",
    borderRadius: radii.pill,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  salahStatusLabel: {
    fontFamily: fontFamily.appSemiBold,
    fontSize: 12,
    lineHeight: 16,
  },
  salahStage: {
    flexDirection: "row",
    gap: spacing.md,
  },
  salahCountOrb: {
    flex: 1,
    minHeight: 164,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    borderRadius: radii.xl,
    borderWidth: 1,
    paddingHorizontal: spacing.lg,
  },
  salahCountValue: {
    fontFamily: fontFamily.appBold,
    fontSize: 48,
    lineHeight: 52,
    fontVariant: ["tabular-nums"],
  },
  salahCountLabel: {
    fontFamily: fontFamily.appSemiBold,
    fontSize: 13,
    lineHeight: 18,
  },
  salahMetaColumn: {
    flex: 1,
    gap: spacing.md,
  },
  prayerGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  prayerButton: {
    width: "48%",
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    borderRadius: radii.lg,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  prayerIcon: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radii.pill,
    borderWidth: 1,
  },
  prayerLabel: {
    fontFamily: fontFamily.appSemiBold,
    fontSize: 15,
    lineHeight: 20,
  },
  salahFooter: {
    fontFamily: fontFamily.appRegular,
    fontSize: 14,
    lineHeight: 20,
  },
  habitMetricsRow: {
    flexDirection: "row",
    gap: spacing.md,
  },
  habitStreakTile: {
    flex: 1,
    minHeight: 132,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    borderRadius: radii.lg,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
  },
  habitStreakValue: {
    fontFamily: fontFamily.appBold,
    fontSize: 40,
    lineHeight: 44,
    fontVariant: ["tabular-nums"],
  },
  habitStreakLabel: {
    fontFamily: fontFamily.appSemiBold,
    fontSize: 13,
    lineHeight: 18,
  },
  habitMetaTiles: {
    flex: 1,
    gap: spacing.md,
  },
  metricTile: {
    flex: 1,
    gap: spacing.xs,
    borderRadius: radii.lg,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  metricLabel: {
    fontFamily: fontFamily.appSemiBold,
    fontSize: 12,
    lineHeight: 16,
  },
  metricValue: {
    fontFamily: fontFamily.appBold,
    fontSize: 24,
    lineHeight: 28,
    fontVariant: ["tabular-nums"],
  },
  metricAccent: {
    width: 36,
    height: 4,
    borderRadius: radii.pill,
  },
});
