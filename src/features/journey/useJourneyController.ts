import { useCallback, useMemo } from "react";
import { useWindowDimensions } from "react-native";
import * as Haptics from "expo-haptics";
import { useFocusEffect } from "expo-router";

import { EventName } from "@/src/lib/analytics/track";
import { useLocation } from "@/src/lib/location";
import { usePrayerTimes } from "@/src/lib/prayer/use-prayer-times";

import {
  trackJourneyHabitToggled,
  trackJourneyPrayerCheckinCompleted,
  trackJourneyRoutineSaved,
  trackJourneyScreenView,
} from "./journey-analytics";
import {
  isRoutineConfigured,
  getJourneyPrayerLabel,
  type JourneyPrayerKey,
  type JourneyRoutine,
} from "./journey-types";
import { useJourneyProgress } from "./useJourneyProgress";
import { useJourneyMilestones } from "./useJourneyMilestones";
import { useJourneyReminderActions } from "./useJourneyReminderActions";
import { useJourneyShareAction } from "./useJourneyShareAction";
const HERO_SOURCE = require("@/public/images/_source/journey-share-day30-completepath-v02-card.png");
const SHARE_CARD_SOURCE = require("@/public/images/_source/journey-share-daily-completion-v02-card.png");

function getPrayerTimeLabel(
  prayer: JourneyPrayerKey,
  times: ReturnType<typeof usePrayerTimes>["times"]
) {
  if (!times) {
    return "Loading...";
  }

  return times[getJourneyPrayerLabel(prayer) as keyof typeof times];
}

export function useJourneyController() {
  const { width } = useWindowDimensions();
  const isCompact = width < 390;
  const {
    routine,
    todayKey,
    todayStatus,
    isLoading,
    hasConfiguredRoutine,
    streaks,
    totalRoutineItems,
    completedRoutineItems,
    todayProgressPercent,
    recentHistory,
    activeReminderCount,
    remindersDirty,
    togglePrayerCompletion,
    toggleDayHabitCompletion,
    setRoutine,
    setReminderLeadMinutes,
    setFollowUpDelayMinutes,
    setReminderPermissionStatus,
    setReminderSchedule,
    markShareCreated,
  } = useJourneyProgress();
  const { location, status: locationStatus } = useLocation();
  const coords = location?.coords;
  const { times, countdown, nextPrayer } = usePrayerTimes(
    coords?.latitude,
    coords?.longitude
  );

  const routineConfigured = hasConfiguredRoutine;
  const routineItemsLabel =
    totalRoutineItems === 0
      ? "No routine yet"
      : `${completedRoutineItems}/${totalRoutineItems} complete today`;
  const nextPrayerSummary = nextPrayer
    ? `Next prayer: ${nextPrayer} in ${countdown}.`
    : "Your next prayer will appear here.";

  const reminderStatusLabel = useMemo(() => {
    if (routine.reminderPermissionStatus === "granted" && routine.remindersActive) {
      return remindersDirty ? "Reminder sync needed" : `${activeReminderCount} reminders queued`;
    }

    if (routine.reminderPermissionStatus === "denied") {
      return "Notifications are blocked";
    }

    if (routine.reminderPermissionStatus === "unsupported") {
      return "Scheduled reminders need iOS or Android";
    }

    return "Notifications are off";
  }, [
    activeReminderCount,
    remindersDirty,
    routine.reminderPermissionStatus,
    routine.remindersActive,
  ]);

  const shareMessage = useMemo(() => {
    const segments = [
      "Path of Nur journey update",
      `Prayer streak: ${streaks.prayer} day${streaks.prayer === 1 ? "" : "s"}`,
      `Fasting streak: ${streaks.fasting} day${streaks.fasting === 1 ? "" : "s"}`,
      `Reading streak: ${streaks.reading} day${streaks.reading === 1 ? "" : "s"}`,
      `Today's consistency: ${todayProgressPercent}%`,
    ];

    return `${segments.join("\n")}\n\nhttps://pathofnur.com`;
  }, [streaks, todayProgressPercent]);

  useFocusEffect(
    useCallback(() => {
      void trackJourneyScreenView();
    }, [])
  );

  useJourneyMilestones(streaks);

  const { isScheduling, syncReminders, handleDisableReminders } =
    useJourneyReminderActions({
      coords,
      routine,
      setReminderPermissionStatus,
      setReminderSchedule,
    });

  const handleShare = useJourneyShareAction({
    shareMessage,
    markShareCreated,
  });

  const applyRoutine = useCallback(
    (nextRoutine: JourneyRoutine) => {
      const wasConfigured = isRoutineConfigured(routine);
      const isConfiguredNow = isRoutineConfigured(nextRoutine);

      setRoutine(nextRoutine);

      if (isConfiguredNow) {
        void trackJourneyRoutineSaved(
          nextRoutine,
          wasConfigured ? EventName.JOURNEY_ROUTINE_UPDATED : EventName.JOURNEY_ROUTINE_CREATED
        );
      }
    },
    [routine, setRoutine]
  );

  const handlePrayerSelectionPress = useCallback(
    (prayer: JourneyPrayerKey) => {
      void Haptics.selectionAsync();

      const nextSelectedPrayers = routine.selectedPrayers.includes(prayer)
        ? routine.selectedPrayers.filter((value) => value !== prayer)
        : [...routine.selectedPrayers, prayer];

      applyRoutine({
        ...routine,
        selectedPrayers: nextSelectedPrayers,
      });
    },
    [applyRoutine, routine]
  );

  const handleToggleOptionalHabit = useCallback(
    (habit: "fasting" | "reading") => {
      void Haptics.selectionAsync();

      if (habit === "fasting") {
        applyRoutine({
          ...routine,
          fastingEnabled: !routine.fastingEnabled,
        });
        return;
      }

      applyRoutine({
        ...routine,
        readingEnabled: !routine.readingEnabled,
      });
    },
    [applyRoutine, routine]
  );

  const handleReminderLeadPress = useCallback(
    (minutes: number) => {
      void Haptics.selectionAsync();
      setReminderLeadMinutes(minutes);
      void trackJourneyRoutineSaved(
        {
          ...routine,
          reminderLeadMinutes: minutes,
        },
        EventName.JOURNEY_ROUTINE_UPDATED
      );
    },
    [routine, setReminderLeadMinutes]
  );

  const handleFollowUpDelayPress = useCallback(
    (minutes: number) => {
      void Haptics.selectionAsync();
      setFollowUpDelayMinutes(minutes);
      void trackJourneyRoutineSaved(
        {
          ...routine,
          followUpDelayMinutes: minutes,
        },
        EventName.JOURNEY_ROUTINE_UPDATED
      );
    },
    [routine, setFollowUpDelayMinutes]
  );

  const handlePrayerCompletionPress = useCallback(
    (prayer: JourneyPrayerKey) => {
      void Haptics.selectionAsync();
      const nextComplete = !todayStatus.prayers[prayer];
      togglePrayerCompletion(prayer);
      void trackJourneyPrayerCheckinCompleted(prayer, nextComplete, todayKey);
      void trackJourneyHabitToggled("prayer", nextComplete, todayKey);
    },
    [todayKey, todayStatus.prayers, togglePrayerCompletion]
  );

  const handleHabitCompletionPress = useCallback(
    (habit: "fasting" | "reading") => {
      void Haptics.selectionAsync();
      const nextComplete =
        habit === "fasting"
          ? !todayStatus.fastingCompleted
          : !todayStatus.readingCompleted;

      toggleDayHabitCompletion(habit);
      void trackJourneyHabitToggled(habit, nextComplete, todayKey);
    },
    [todayKey, todayStatus.fastingCompleted, todayStatus.readingCompleted, toggleDayHabitCompletion]
  );

  const prayerItems = useMemo(
    () =>
      routine.selectedPrayers.map((prayer) => ({
        key: prayer,
        title: getJourneyPrayerLabel(prayer),
        meta: getPrayerTimeLabel(prayer, times),
        checked: todayStatus.prayers[prayer],
        onPress: () => handlePrayerCompletionPress(prayer),
      })),
    [handlePrayerCompletionPress, routine.selectedPrayers, times, todayStatus.prayers]
  );

  const supplementalItems = useMemo(() => {
    const items = [];

    if (routine.readingEnabled) {
      items.push({
        key: "reading",
        title: "Reading",
        meta: "Mark when you finish today's recitation.",
        checked: todayStatus.readingCompleted,
        onPress: () => handleHabitCompletionPress("reading"),
      });
    }

    if (routine.fastingEnabled) {
      items.push({
        key: "fasting",
        title: "Fasting",
        meta: "Mark today once your fast is complete.",
        checked: todayStatus.fastingCompleted,
        onPress: () => handleHabitCompletionPress("fasting"),
      });
    }

    return items;
  }, [
    handleHabitCompletionPress,
    routine.fastingEnabled,
    routine.readingEnabled,
    todayStatus.fastingCompleted,
    todayStatus.readingCompleted,
  ]);

  return {
    isCompact,
    isLoading,
    overviewProps: {
      heroSource: HERO_SOURCE,
      routineConfigured,
      routineItemsLabel,
      nextPrayerSummary,
      todayProgressPercent,
      prayerStreak: streaks.prayer,
      streaks,
      selectedPrayerCount: routine.selectedPrayers.length,
      fastingEnabled: routine.fastingEnabled,
      readingEnabled: routine.readingEnabled,
      isCompact,
    },
    todayPanelProps: {
      todayKey,
      routineConfigured,
      routineItemsLabel,
      prayerItems,
      supplementalItems,
    },
    routinePanelProps: {
      selectedPrayers: routine.selectedPrayers,
      readingEnabled: routine.readingEnabled,
      fastingEnabled: routine.fastingEnabled,
      reminderLeadMinutes: routine.reminderLeadMinutes,
      followUpDelayMinutes: routine.followUpDelayMinutes,
      isCompact,
      onPrayerPress: handlePrayerSelectionPress,
      onToggleHabit: handleToggleOptionalHabit,
      onReminderLeadPress: handleReminderLeadPress,
      onFollowUpDelayPress: handleFollowUpDelayPress,
    },
    reminderPanelProps: {
      locationStatus,
      reminderStatusLabel,
      lastScheduledAt: routine.lastScheduledAt,
      remindersActive: routine.remindersActive,
      remindersDirty,
      supportsScheduling: process.env.EXPO_OS !== "web",
      isScheduling,
      onSync: () => void syncReminders(true),
      onDisable: () => void handleDisableReminders(),
    },
    historyPanelProps: {
      recentHistory,
    },
    sharePanelProps: {
      shareCardSource: SHARE_CARD_SOURCE,
      todayProgressPercent,
      streaks,
      onShare: () => void handleShare(),
    },
  };
}
