import { useCallback } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import * as Haptics from "expo-haptics";
import { Stack, useFocusEffect, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { fontFamily, radii, spacing, useTheme } from "@/src/theme";

import { trackJourneyHabitToggled, trackJourneyScreenView } from "./journey-analytics";
import { getJourneyPracticeAccent, getJourneyPracticeActionCopy } from "./journey-practice-meta";
import {
  JourneyActionButton,
  JourneyHistoryStrip,
  JourneyPanel,
} from "./journey-primitives";
import { getJourneyPracticeLabel, type JourneyPractice } from "./journey-types";
import { useJourneyProgress } from "./useJourneyProgress";

export function JourneyStreaksScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors } = useTheme();
  const {
    activePractices,
    completionCounts,
    isLoading,
    longestStreaks,
    recentPracticeHistory,
    streaks,
    todayKey,
    todayStatus,
    togglePracticeCompletion,
  } = useJourneyProgress();

  useFocusEffect(
    useCallback(() => {
      void trackJourneyScreenView("journey-streaks");
    }, [])
  );

  const handleTogglePractice = useCallback(
    (practice: JourneyPractice) => {
      void Haptics.selectionAsync();
      const nextComplete = !todayStatus.completions[practice];
      togglePracticeCompletion(practice);
      void trackJourneyHabitToggled(practice, nextComplete, todayKey);
    },
    [todayKey, todayStatus.completions, togglePracticeCompletion]
  );

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={[
        styles.container,
        {
          backgroundColor: colors.surface.background,
          paddingTop: insets.top + spacing.lg,
          paddingBottom: insets.bottom + 80,
        },
      ]}
    >
      <Stack.Screen
        options={{
          headerShown: true,
          title: "Practice Streaks",
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
        <Text style={[styles.eyebrow, { color: colors.text.tertiary }]} selectable>
          Dedicated space
        </Text>
        <Text style={[styles.title, { color: colors.text.primary }]} selectable>
          Keep every practice visible.
        </Text>
        <Text style={[styles.subtitle, { color: colors.text.secondary }]} selectable>
          Each streak lives here with real visual weight, not compressed into the Journey overview.
        </Text>
      </View>

      {isLoading ? (
        <JourneyPanel>
          <Text style={[styles.emptyCopy, { color: colors.text.secondary }]} selectable>
            Loading your streaks...
          </Text>
        </JourneyPanel>
      ) : activePractices.length === 0 ? (
        <JourneyPanel
          title="No active practices yet"
          subtitle="Turn on the practices you want to keep returning to, then this page becomes your streak destination."
        >
          <JourneyActionButton label="Build routine" onPress={() => router.push("/journey/routine")} />
        </JourneyPanel>
      ) : (
        activePractices.map((practice) => {
          const accent = getJourneyPracticeAccent(practice, colors);
          const isCompleteToday = todayStatus.completions[practice];

          return (
            <View
              key={practice}
              style={[
                styles.practiceCard,
                {
                  backgroundColor: colors.surface.card,
                  borderColor: colors.surface.borderElevated,
                },
              ]}
            >
              <View style={styles.practiceHeader}>
                <View style={styles.practiceTitleGroup}>
                  <View style={[styles.practiceAccent, { backgroundColor: accent }]} />
                  <Text style={[styles.practiceLabel, { color: colors.text.primary }]} selectable>
                    {getJourneyPracticeLabel(practice)}
                  </Text>
                </View>
                <View
                  style={[
                    styles.statusPill,
                    {
                      backgroundColor: isCompleteToday ? `${accent}22` : colors.surface.background,
                      borderColor: isCompleteToday ? `${accent}55` : colors.surface.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusPillLabel,
                      { color: isCompleteToday ? accent : colors.text.secondary },
                    ]}
                    selectable
                  >
                    {isCompleteToday ? "Marked today" : "Due today"}
                  </Text>
                </View>
              </View>

              <Text style={[styles.practiceBody, { color: colors.text.secondary }]} selectable>
                {getJourneyPracticeActionCopy(practice)}
              </Text>

              <View style={styles.metricRow}>
                <MetricBox
                  label="Current"
                  value={streaks[practice]}
                  accent={accent}
                />
                <MetricBox
                  label="Best"
                  value={longestStreaks[practice]}
                  accent={accent}
                />
                <MetricBox
                  label="Completed"
                  value={completionCounts[practice]}
                  accent={accent}
                />
              </View>

              <JourneyHistoryStrip
                items={recentPracticeHistory[practice]}
                accent={accent}
              />

              <JourneyActionButton
                label={isCompleteToday ? "Undo today" : "Mark today"}
                emphasis={isCompleteToday ? "secondary" : "primary"}
                onPress={() => handleTogglePractice(practice)}
              />
            </View>
          );
        })
      )}
    </ScrollView>
  );
}

function MetricBox({
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
        styles.metricBox,
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
    paddingTop: spacing.md,
  },
  eyebrow: {
    fontFamily: fontFamily.appSemiBold,
    fontSize: 12,
    lineHeight: 16,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  title: {
    fontFamily: fontFamily.appBold,
    fontSize: 32,
    lineHeight: 38,
    maxWidth: 280,
  },
  subtitle: {
    fontFamily: fontFamily.appRegular,
    fontSize: 16,
    lineHeight: 23,
    maxWidth: 320,
  },
  practiceCard: {
    gap: spacing.lg,
    borderRadius: radii.xl,
    borderWidth: 1,
    padding: spacing.lg,
    boxShadow: "0 20px 40px rgba(0, 0, 0, 0.18)",
  },
  practiceHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  practiceTitleGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  practiceAccent: {
    width: 12,
    height: 44,
    borderRadius: radii.pill,
  },
  practiceLabel: {
    fontFamily: fontFamily.appBold,
    fontSize: 28,
    lineHeight: 34,
  },
  statusPill: {
    alignSelf: "flex-start",
    borderRadius: radii.pill,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  statusPillLabel: {
    fontFamily: fontFamily.appSemiBold,
    fontSize: 12,
    lineHeight: 16,
  },
  practiceBody: {
    fontFamily: fontFamily.appRegular,
    fontSize: 15,
    lineHeight: 22,
  },
  metricRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  metricBox: {
    flex: 1,
    borderRadius: radii.lg,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  metricLabel: {
    fontFamily: fontFamily.appSemiBold,
    fontSize: 12,
    lineHeight: 16,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  metricValue: {
    fontFamily: fontFamily.appBold,
    fontSize: 28,
    lineHeight: 32,
    marginTop: spacing.xs,
    fontVariant: ["tabular-nums"],
  },
  metricAccent: {
    width: 40,
    height: 4,
    borderRadius: radii.pill,
    marginTop: spacing.sm,
  },
  emptyCopy: {
    fontFamily: fontFamily.appRegular,
    fontSize: 15,
    lineHeight: 22,
  },
});
