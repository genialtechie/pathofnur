import { useCallback, useEffect, useMemo, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "expo-router";

import { getPreferences } from "@/src/lib/preferences/preferences-store";

import {
  JOURNEY_PRACTICES,
  createDefaultJourneyState,
  createDefaultJourneyRoutine,
  createJourneyPracticeRecord,
  createEmptyJourneyDay,
  createEmptyPracticePlan,
  isRoutineConfigured,
  type JourneyDayStatus,
  type JourneyPrayerKey,
  type JourneyPractice,
  type JourneyPracticePlan,
  type JourneyReminderPermissionStatus,
  type JourneyRoutine,
  type JourneyState,
} from "./journey-types";

const JOURNEY_STORAGE_KEY = "@pathofnur/journey/state-v3";
const LEGACY_V2_STORAGE_KEY = "@pathofnur/journey/state-v2";
const LEGACY_RAMADAN_STORAGE_KEY = "ramadan_2026_progress";
const RECENT_HISTORY_DAYS = 7;

type LegacyJourneyRoutine = {
  selectedPrayers?: JourneyPrayerKey[];
  readingEnabled?: boolean;
  fastingEnabled?: boolean;
  reminderLeadMinutes?: number;
  followUpDelayMinutes?: number;
  reminderPermissionStatus?: JourneyReminderPermissionStatus;
  remindersActive?: boolean;
  lastScheduledAt?: string | null;
};

type LegacyJourneyDayStatus = {
  dateKey?: string;
  prayers?: Partial<Record<JourneyPrayerKey, boolean>>;
  readingCompleted?: boolean;
  fastingCompleted?: boolean;
};

type LegacyJourneyState = {
  routine?: LegacyJourneyRoutine;
  history?: Record<string, LegacyJourneyDayStatus>;
  notificationIds?: string[];
  remindersDirty?: boolean;
  lastShareAt?: string | null;
};

function getDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getPreferenceGoals(value: string[]) {
  return new Set(
    value.map((goal) => {
      if (goal === "duas") {
        return "dhikr";
      }

      return goal;
    })
  );
}

function cloneDay(day: JourneyDayStatus): JourneyDayStatus {
  return {
    dateKey: day.dateKey,
    completions: { ...day.completions },
  };
}

function sanitizePracticePlan(
  value: Partial<JourneyPracticePlan> | undefined
): JourneyPracticePlan {
  const base = createEmptyPracticePlan();

  return {
    salah: typeof value?.salah === "boolean" ? value.salah : base.salah,
    quran: typeof value?.quran === "boolean" ? value.quran : base.quran,
    fasting: typeof value?.fasting === "boolean" ? value.fasting : base.fasting,
    dhikr: typeof value?.dhikr === "boolean" ? value.dhikr : base.dhikr,
  };
}

function sanitizeRoutine(value: Partial<JourneyRoutine> | undefined): JourneyRoutine {
  const base = createDefaultJourneyRoutine();

  return {
    practices: sanitizePracticePlan(value?.practices),
    reminders: {
      ...base.reminders,
      ...value?.reminders,
      wantsPrayerReminders:
        typeof value?.reminders?.wantsPrayerReminders === "boolean"
          ? value.reminders.wantsPrayerReminders
          : base.reminders.wantsPrayerReminders,
      remindersActive:
        typeof value?.reminders?.remindersActive === "boolean"
          ? value.reminders.remindersActive
          : base.reminders.remindersActive,
      lastScheduledAt:
        typeof value?.reminders?.lastScheduledAt === "string" ||
        value?.reminders?.lastScheduledAt === null
          ? value.reminders.lastScheduledAt
          : base.reminders.lastScheduledAt,
    },
  };
}

function sanitizeState(value: Partial<JourneyState> | null | undefined): JourneyState {
  const base = createDefaultJourneyState();

  const history = Object.entries(value?.history ?? {}).reduce<JourneyState["history"]>(
    (accumulator, [dateKey, day]) => {
      accumulator[dateKey] = {
        ...createEmptyJourneyDay(dateKey),
        ...day,
        completions: sanitizePracticePlan(day?.completions),
      };
      return accumulator;
    },
    {}
  );

  return {
    ...base,
    ...value,
    version: 3,
    routine: sanitizeRoutine(value?.routine),
    history,
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

function createSeededStateFromPreferences(planGoals: string[], notificationsEnabled: boolean) {
  const goals = getPreferenceGoals(planGoals);
  const state = createDefaultJourneyState();
  const salahEnabled = goals.has("salah");

  return sanitizeState({
    ...state,
    routine: {
      practices: {
        salah: salahEnabled,
        quran: goals.has("quran"),
        fasting: goals.has("fasting"),
        dhikr: goals.has("dhikr"),
      },
      reminders: {
        ...state.routine.reminders,
        wantsPrayerReminders: salahEnabled && notificationsEnabled,
        permissionStatus: notificationsEnabled ? "granted" : "unknown",
      },
    },
    remindersDirty: salahEnabled && notificationsEnabled,
  });
}

function migrateLegacyState(
  legacy: LegacyJourneyState,
  preferences: { planGoals: string[] }
): JourneyState {
  const base = createDefaultJourneyState();
  const selectedPrayers = Array.isArray(legacy.routine?.selectedPrayers)
    ? legacy.routine.selectedPrayers
    : [];
  const goals = getPreferenceGoals(preferences.planGoals);

  const history = Object.entries(legacy.history ?? {}).reduce<JourneyState["history"]>(
    (accumulator, [dateKey, value]) => {
      const completedPrayers = Object.values(value.prayers ?? {}).filter(Boolean).length;
      const isLegacyPrayerDayComplete =
        selectedPrayers.length > 0
          ? selectedPrayers.every((prayer) => value.prayers?.[prayer] === true)
          : completedPrayers === 5;

      accumulator[dateKey] = {
        dateKey,
        completions: {
          salah: isLegacyPrayerDayComplete,
          quran: value.readingCompleted === true,
          fasting: value.fastingCompleted === true,
          dhikr: false,
        },
      };

      return accumulator;
    },
    {}
  );

  return sanitizeState({
    ...base,
    routine: {
      practices: {
        salah: selectedPrayers.length > 0 || goals.has("salah"),
        quran: legacy.routine?.readingEnabled === true || goals.has("quran"),
        fasting: legacy.routine?.fastingEnabled === true || goals.has("fasting"),
        dhikr: goals.has("dhikr"),
      },
      reminders: {
        ...base.routine.reminders,
        wantsPrayerReminders:
          legacy.routine?.remindersActive === true ||
          legacy.routine?.reminderPermissionStatus === "granted",
        remindersActive: legacy.routine?.remindersActive === true,
        permissionStatus:
          legacy.routine?.reminderPermissionStatus ?? base.routine.reminders.permissionStatus,
        leadMinutes:
          typeof legacy.routine?.reminderLeadMinutes === "number"
            ? legacy.routine.reminderLeadMinutes
            : base.routine.reminders.leadMinutes,
        followUpDelayMinutes:
          typeof legacy.routine?.followUpDelayMinutes === "number"
            ? legacy.routine.followUpDelayMinutes
            : base.routine.reminders.followUpDelayMinutes,
        lastScheduledAt:
          typeof legacy.routine?.lastScheduledAt === "string" ||
          legacy.routine?.lastScheduledAt === null
            ? legacy.routine.lastScheduledAt
            : base.routine.reminders.lastScheduledAt,
      },
    },
    history,
    notificationIds: Array.isArray(legacy.notificationIds) ? legacy.notificationIds : [],
    remindersDirty: legacy.remindersDirty === true,
    lastShareAt:
      typeof legacy.lastShareAt === "string" || legacy.lastShareAt === null
        ? legacy.lastShareAt
        : null,
  });
}

async function persistState(nextState: JourneyState) {
  await AsyncStorage.setItem(JOURNEY_STORAGE_KEY, JSON.stringify(nextState));
}

async function hydrateJourneyState(): Promise<JourneyState> {
  const stored = await AsyncStorage.getItem(JOURNEY_STORAGE_KEY);
  if (stored) {
    return sanitizeState(JSON.parse(stored) as Partial<JourneyState>);
  }

  const preferences = await getPreferences();

  const legacyV2 = await AsyncStorage.getItem(LEGACY_V2_STORAGE_KEY);
  if (legacyV2) {
    const migrated = migrateLegacyState(
      JSON.parse(legacyV2) as LegacyJourneyState,
      preferences
    );
    await persistState(migrated);
    await AsyncStorage.removeItem(LEGACY_V2_STORAGE_KEY);
    return migrated;
  }

  const legacyRamadan = await AsyncStorage.getItem(LEGACY_RAMADAN_STORAGE_KEY);
  if (legacyRamadan) {
    await AsyncStorage.removeItem(LEGACY_RAMADAN_STORAGE_KEY);
  }

  const seeded = createSeededStateFromPreferences(
    preferences.planGoals,
    preferences.notificationsEnabled
  );
  await persistState(seeded);
  return seeded;
}

function getDay(state: JourneyState, dateKey: string): JourneyDayStatus {
  return state.history[dateKey] ?? createEmptyJourneyDay(dateKey);
}

function getSortedHistoryKeys(history: JourneyState["history"]) {
  return Object.keys(history).sort((left, right) => left.localeCompare(right));
}

function isPracticeComplete(practice: JourneyPractice, day: JourneyDayStatus) {
  return day.completions[practice];
}

function getPreviousDateKey(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() - 1);
  return getDateKey(date);
}

export const useJourneyProgress = () => {
  const [state, setState] = useState<JourneyState>(createDefaultJourneyState());
  const [isLoading, setIsLoading] = useState(true);

  const loadJourneyState = useCallback(async (showLoading: boolean) => {
    if (showLoading) {
      setIsLoading(true);
    }

    try {
      const loaded = await hydrateJourneyState();
      setState(loaded);
    } catch (error) {
      console.error("Failed to load journey progress:", error);
    } finally {
      if (showLoading) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    void loadJourneyState(true);
  }, [loadJourneyState]);

  useFocusEffect(
    useCallback(() => {
      void loadJourneyState(false);
    }, [loadJourneyState])
  );

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
  const activePractices = useMemo(
    () => JOURNEY_PRACTICES.filter((practice) => routine.practices[practice]),
    [routine.practices]
  );

  const streaks = useMemo(() => {
    return JOURNEY_PRACTICES.reduce<Record<JourneyPractice, number>>((accumulator, practice) => {
      let streak = 0;

      for (let offset = 0; offset < 365; offset += 1) {
        const date = new Date();
        date.setHours(0, 0, 0, 0);
        date.setDate(date.getDate() - offset);

        const day = state.history[getDateKey(date)];
        if (!day || !isPracticeComplete(practice, day)) {
          break;
        }

        streak += 1;
      }

      accumulator[practice] = streak;
      return accumulator;
    }, createJourneyPracticeRecord(0));
  }, [state.history]);

  const longestStreaks = useMemo(() => {
    const historyKeys = getSortedHistoryKeys(state.history);

    return JOURNEY_PRACTICES.reduce<Record<JourneyPractice, number>>((accumulator, practice) => {
      let longest = 0;
      let current = 0;
      let previousKey: string | null = null;

      historyKeys.forEach((dateKey) => {
        const day = state.history[dateKey];
        if (!day || !isPracticeComplete(practice, day)) {
          current = 0;
          previousKey = null;
          return;
        }

        if (previousKey && getPreviousDateKey(dateKey) === previousKey) {
          current += 1;
        } else {
          current = 1;
        }

        previousKey = dateKey;
        longest = Math.max(longest, current);
      });

      accumulator[practice] = longest;
      return accumulator;
    }, createJourneyPracticeRecord(0));
  }, [state.history]);

  const completionCounts = useMemo(() => {
    return JOURNEY_PRACTICES.reduce<Record<JourneyPractice, number>>((accumulator, practice) => {
      accumulator[practice] = Object.values(state.history).filter((day) =>
        isPracticeComplete(practice, day)
      ).length;
      return accumulator;
    }, createJourneyPracticeRecord(0));
  }, [state.history]);

  const completedTodayCount = activePractices.filter(
    (practice) => todayStatus.completions[practice]
  ).length;
  const todayProgressPercent =
    activePractices.length === 0
      ? 0
      : Math.round((completedTodayCount / activePractices.length) * 100);

  const recentPracticeHistory = useMemo(() => {
    return JOURNEY_PRACTICES.reduce<
      Record<JourneyPractice, Array<{ dateKey: string; label: string; isComplete: boolean }>>
    >((accumulator, practice) => {
      accumulator[practice] = Array.from({ length: RECENT_HISTORY_DAYS }, (_, index) => {
        const date = new Date();
        date.setHours(0, 0, 0, 0);
        date.setDate(date.getDate() - (RECENT_HISTORY_DAYS - 1 - index));

        const dateKey = getDateKey(date);
        const day = getDay(state, dateKey);

        return {
          dateKey,
          label: date
            .toLocaleDateString("en-US", { weekday: "short" })
            .slice(0, 1),
          isComplete: day.completions[practice],
        };
      });
      return accumulator;
    }, createJourneyPracticeRecord([] as Array<{
      dateKey: string;
      label: string;
      isComplete: boolean;
    }>));
  }, [state]);

  const strongestPractice = useMemo(() => {
    if (activePractices.length === 0) {
      return null;
    }

    return activePractices.reduce((leading, practice) => {
      if (!leading) {
        return practice;
      }

      if (streaks[practice] > streaks[leading]) {
        return practice;
      }

      if (streaks[practice] === streaks[leading] && completionCounts[practice] > completionCounts[leading]) {
        return practice;
      }

      return leading;
    }, activePractices[0]);
  }, [activePractices, completionCounts, streaks]);

  const setPracticeEnabled = useCallback(
    (practice: JourneyPractice, enabled: boolean) => {
      updateState((current) => {
        const nextPractices = {
          ...current.routine.practices,
          [practice]: enabled,
        };
        const isDisablingSalah = practice === "salah" && !enabled;

        return {
          ...current,
          notificationIds: isDisablingSalah ? [] : current.notificationIds,
          remindersDirty: isDisablingSalah ? false : current.remindersDirty,
          routine: {
            ...current.routine,
            practices: nextPractices,
            reminders: isDisablingSalah
              ? {
                  ...current.routine.reminders,
                  wantsPrayerReminders: false,
                  remindersActive: false,
                  lastScheduledAt: null,
                }
              : current.routine.reminders,
          },
        };
      });
    },
    [updateState]
  );

  const togglePracticeCompletion = useCallback(
    (practice: JourneyPractice) => {
      updateState((current) => {
        const day = cloneDay(getDay(current, todayKey));
        day.completions[practice] = !day.completions[practice];

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

  const setWantsPrayerReminders = useCallback(
    (enabled: boolean) => {
      updateState((current) => ({
        ...current,
        notificationIds: enabled ? current.notificationIds : [],
        remindersDirty: enabled ? true : false,
        routine: {
          ...current.routine,
          reminders: {
            ...current.routine.reminders,
            wantsPrayerReminders: enabled,
            remindersActive: enabled ? current.routine.reminders.remindersActive : false,
            lastScheduledAt: enabled ? current.routine.reminders.lastScheduledAt : null,
          },
        },
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
          reminders: {
            ...current.routine.reminders,
            permissionStatus: status,
          },
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
          reminders: {
            ...current.routine.reminders,
            remindersActive,
            lastScheduledAt,
          },
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
    activePractices,
    streaks,
    longestStreaks,
    completionCounts,
    completedTodayCount,
    todayProgressPercent,
    recentPracticeHistory,
    strongestPractice,
    activeReminderCount: state.notificationIds.length,
    remindersDirty: state.remindersDirty,
    togglePracticeCompletion,
    setPracticeEnabled,
    setWantsPrayerReminders,
    setReminderPermissionStatus,
    setReminderSchedule,
    markShareCreated,
  };
};
