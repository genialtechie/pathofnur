import { useCallback, useEffect, useMemo, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  createDefaultJourneyState,
  createEmptyJourneyDay,
  isRoutineConfigured,
  type JourneyDayStatus,
  type JourneyHabit,
  type JourneyPrayerKey,
  type JourneyReminderPermissionStatus,
  type JourneyRoutine,
  type JourneyState,
} from "./journey-types";

const JOURNEY_STORAGE_KEY = "@pathofnur/journey/state-v2";
const LEGACY_STORAGE_KEY = "ramadan_2026_progress";
const RECENT_HISTORY_DAYS = 7;

function getDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function cloneDay(day: JourneyDayStatus): JourneyDayStatus {
  return {
    dateKey: day.dateKey,
    prayers: { ...day.prayers },
    readingCompleted: day.readingCompleted,
    fastingCompleted: day.fastingCompleted,
  };
}

function sanitizeRoutine(value: Partial<JourneyRoutine> | undefined): JourneyRoutine {
  const base = createDefaultJourneyState().routine;

  return {
    ...base,
    ...value,
    selectedPrayers: Array.isArray(value?.selectedPrayers)
      ? value.selectedPrayers.filter(
          (prayer): prayer is JourneyPrayerKey =>
            ["fajr", "dhuhr", "asr", "maghrib", "isha"].includes(prayer)
        )
      : base.selectedPrayers,
    lastScheduledAt:
      typeof value?.lastScheduledAt === "string" || value?.lastScheduledAt === null
        ? value.lastScheduledAt
        : base.lastScheduledAt,
  };
}

function sanitizeState(value: Partial<JourneyState> | null | undefined): JourneyState {
  const base = createDefaultJourneyState();

  const historyEntries = Object.entries(value?.history ?? {}).reduce<
    JourneyState["history"]
  >((accumulator, [dateKey, day]) => {
    if (!day) {
      return accumulator;
    }

    accumulator[dateKey] = {
      ...createEmptyJourneyDay(dateKey),
      ...day,
      prayers: {
        ...createEmptyJourneyDay(dateKey).prayers,
        ...(day as JourneyDayStatus).prayers,
      },
    };

    return accumulator;
  }, {});

  return {
    ...base,
    ...value,
    routine: sanitizeRoutine(value?.routine),
    history: historyEntries,
    notificationIds: Array.isArray(value?.notificationIds)
      ? value.notificationIds.filter((item): item is string => typeof item === "string")
      : [],
    remindersDirty:
      typeof value?.remindersDirty === "boolean" ? value.remindersDirty : base.remindersDirty,
    lastShareAt:
      typeof value?.lastShareAt === "string" || value?.lastShareAt === null
        ? value.lastShareAt
        : base.lastShareAt,
  };
}

function persistState(nextState: JourneyState) {
  return AsyncStorage.setItem(JOURNEY_STORAGE_KEY, JSON.stringify(nextState));
}

function getDay(state: JourneyState, dateKey: string): JourneyDayStatus {
  return state.history[dateKey] ?? createEmptyJourneyDay(dateKey);
}

function isPrayerDayComplete(day: JourneyDayStatus, routine: JourneyRoutine): boolean {
  if (routine.selectedPrayers.length === 0) {
    return false;
  }

  return routine.selectedPrayers.every((prayer) => day.prayers[prayer]);
}

function isHabitComplete(
  habit: JourneyHabit,
  day: JourneyDayStatus,
  routine: JourneyRoutine
): boolean {
  if (habit === "prayer") {
    return isPrayerDayComplete(day, routine);
  }

  if (habit === "fasting") {
    return routine.fastingEnabled && day.fastingCompleted;
  }

  return routine.readingEnabled && day.readingCompleted;
}

export const useJourneyProgress = () => {
  const [state, setState] = useState<JourneyState>(createDefaultJourneyState());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadJourneyState = async () => {
      try {
        const stored = await AsyncStorage.getItem(JOURNEY_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored) as Partial<JourneyState>;
          if (isMounted) {
            setState(sanitizeState(parsed));
          }
          return;
        }

        const legacy = await AsyncStorage.getItem(LEGACY_STORAGE_KEY);
        if (legacy) {
          await AsyncStorage.removeItem(LEGACY_STORAGE_KEY);
        }
      } catch (error) {
        console.error("Failed to load journey progress:", error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadJourneyState();

    return () => {
      isMounted = false;
    };
  }, []);

  const updateState = useCallback((updater: (current: JourneyState) => JourneyState) => {
    setState((current) => {
      const next = sanitizeState(updater(current));
      void persistState(next).catch((error) => {
        console.error("Failed to save journey progress:", error);
      });
      return next;
    });
  }, []);

  const todayKey = getDateKey(new Date());
  const todayStatus = useMemo(() => getDay(state, todayKey), [state, todayKey]);

  const routine = state.routine;
  const hasConfiguredRoutine = isRoutineConfigured(routine);

  const streaks = useMemo(() => {
    const calculateStreak = (habit: JourneyHabit) => {
      let streak = 0;

      for (let offset = 0; offset < 365; offset += 1) {
        const date = new Date();
        date.setHours(0, 0, 0, 0);
        date.setDate(date.getDate() - offset);

        const dateKey = getDateKey(date);
        const day = state.history[dateKey];

        if (!day || !isHabitComplete(habit, day, routine)) {
          break;
        }

        streak += 1;
      }

      return streak;
    };

    return {
      prayer: calculateStreak("prayer"),
      fasting: calculateStreak("fasting"),
      reading: calculateStreak("reading"),
    };
  }, [routine, state.history]);

  const totalRoutineItems =
    routine.selectedPrayers.length +
    (routine.readingEnabled ? 1 : 0) +
    (routine.fastingEnabled ? 1 : 0);

  const completedRoutineItems =
    routine.selectedPrayers.filter((prayer) => todayStatus.prayers[prayer]).length +
    (routine.readingEnabled && todayStatus.readingCompleted ? 1 : 0) +
    (routine.fastingEnabled && todayStatus.fastingCompleted ? 1 : 0);

  const todayProgressPercent =
    totalRoutineItems === 0 ? 0 : Math.round((completedRoutineItems / totalRoutineItems) * 100);

  const recentHistory = useMemo(() => {
    return Array.from({ length: RECENT_HISTORY_DAYS }, (_, index) => {
      const date = new Date();
      date.setHours(0, 0, 0, 0);
      date.setDate(date.getDate() - (RECENT_HISTORY_DAYS - 1 - index));

      const dateKey = getDateKey(date);
      const day = getDay(state, dateKey);

      const totalItems =
        routine.selectedPrayers.length +
        (routine.readingEnabled ? 1 : 0) +
        (routine.fastingEnabled ? 1 : 0);
      const completedItems =
        routine.selectedPrayers.filter((prayer) => day.prayers[prayer]).length +
        (routine.readingEnabled && day.readingCompleted ? 1 : 0) +
        (routine.fastingEnabled && day.fastingCompleted ? 1 : 0);

      return {
        dateKey,
        label: date.toLocaleDateString("en-US", { weekday: "short" }).slice(0, 1),
        completionRatio: totalItems === 0 ? 0 : completedItems / totalItems,
      };
    });
  }, [routine, state]);

  const setRoutine = useCallback(
    (nextRoutine: JourneyRoutine) => {
      updateState((current) => {
        const shouldMarkDirty =
          current.routine.remindersActive &&
          (
            JSON.stringify(current.routine.selectedPrayers) !== JSON.stringify(nextRoutine.selectedPrayers) ||
            current.routine.reminderLeadMinutes !== nextRoutine.reminderLeadMinutes ||
            current.routine.followUpDelayMinutes !== nextRoutine.followUpDelayMinutes
          );

        return {
          ...current,
          routine: nextRoutine,
          remindersDirty: shouldMarkDirty || current.remindersDirty,
        };
      });
    },
    [updateState]
  );

  const togglePrayerCompletion = useCallback(
    (prayer: JourneyPrayerKey) => {
      updateState((current) => {
        const day = cloneDay(getDay(current, todayKey));
        day.prayers[prayer] = !day.prayers[prayer];

        return {
          ...current,
          history: {
            ...current.history,
            [todayKey]: day,
          },
        };
      });
    },
    [todayKey, updateState]
  );

  const toggleDayHabitCompletion = useCallback(
    (habit: Exclude<JourneyHabit, "prayer">) => {
      updateState((current) => {
        const day = cloneDay(getDay(current, todayKey));

        if (habit === "fasting") {
          day.fastingCompleted = !day.fastingCompleted;
        } else {
          day.readingCompleted = !day.readingCompleted;
        }

        return {
          ...current,
          history: {
            ...current.history,
            [todayKey]: day,
          },
        };
      });
    },
    [todayKey, updateState]
  );

  const setReminderLeadMinutes = useCallback(
    (minutes: number) => {
      updateState((current) => ({
        ...current,
        routine: {
          ...current.routine,
          reminderLeadMinutes: minutes,
        },
        remindersDirty:
          current.remindersDirty ||
          (current.routine.remindersActive &&
            current.routine.reminderLeadMinutes !== minutes),
      }));
    },
    [updateState]
  );

  const setFollowUpDelayMinutes = useCallback(
    (minutes: number) => {
      updateState((current) => ({
        ...current,
        routine: {
          ...current.routine,
          followUpDelayMinutes: minutes,
        },
        remindersDirty:
          current.remindersDirty ||
          (current.routine.remindersActive &&
            current.routine.followUpDelayMinutes !== minutes),
      }));
    },
    [updateState]
  );

  const setReminderPermissionStatus = useCallback(
    (status: JourneyReminderPermissionStatus) => {
      updateState((current) => ({
        ...current,
        routine: {
          ...current.routine,
          reminderPermissionStatus: status,
        },
      }));
    },
    [updateState]
  );

  const setReminderSchedule = useCallback(
    ({
      notificationIds,
      remindersActive,
      lastScheduledAt,
      remindersDirty = false,
    }: {
      notificationIds: string[];
      remindersActive: boolean;
      lastScheduledAt: string | null;
      remindersDirty?: boolean;
    }) => {
      updateState((current) => ({
        ...current,
        notificationIds,
        remindersDirty,
        routine: {
          ...current.routine,
          remindersActive,
          lastScheduledAt,
        },
      }));
    },
    [updateState]
  );

  const markShareCreated = useCallback(() => {
    updateState((current) => ({
      ...current,
      lastShareAt: new Date().toISOString(),
    }));
  }, [updateState]);

  return {
    state,
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
    activeReminderCount: state.notificationIds.length,
    remindersDirty: state.remindersDirty,
    togglePrayerCompletion,
    toggleDayHabitCompletion,
    setRoutine,
    setReminderLeadMinutes,
    setFollowUpDelayMinutes,
    setReminderPermissionStatus,
    setReminderSchedule,
    markShareCreated,
  };
};
