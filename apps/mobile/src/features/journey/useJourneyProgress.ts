import { useCallback, useEffect, useMemo, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "expo-router";

import {
  getCompletedHabitCount,
  getCompletionCounts,
  getCurrentStreaks,
  getDateKey,
  getDaysReturned,
  getJourneySalahCompletedCount,
  getLongestStreaks,
  getRecentPracticeHistory,
  getStrongestPractice,
  isJourneyPracticeComplete,
  toggleJourneyHabit,
} from "./journey-progress-utils";
import {
  JOURNEY_HABITS,
  JOURNEY_PRAYERS,
  createDefaultJourneyState,
  createEmptyJourneyDay,
  createEmptyJourneyHabits,
  createEmptyJourneyPrayers,
  type JourneyDayStatus,
  type JourneyHabit,
  type JourneyPrayerKey,
  type JourneyPractice,
  type JourneyState,
} from "./journey-types";

const JOURNEY_STORAGE_KEY = "@pathofnur/journey/state-v4";
const LEGACY_V3_STORAGE_KEY = "@pathofnur/journey/state-v3";
const LEGACY_V2_STORAGE_KEY = "@pathofnur/journey/state-v2";
const LEGACY_RAMADAN_STORAGE_KEY = "ramadan_2026_progress";

type LegacyJourneyDayStatusV3 = {
  dateKey?: string;
  completions?: Partial<Record<JourneyPractice, boolean>>;
};

type LegacyJourneyStateV3 = {
  version?: number;
  history?: Record<string, LegacyJourneyDayStatusV3>;
  lastShareAt?: string | null;
};

type LegacyJourneyRoutineV2 = {
  selectedPrayers?: JourneyPrayerKey[];
};

type LegacyJourneyDayStatusV2 = {
  dateKey?: string;
  prayers?: Partial<Record<JourneyPrayerKey, boolean>>;
  readingCompleted?: boolean;
  fastingCompleted?: boolean;
};

type LegacyJourneyStateV2 = {
  routine?: LegacyJourneyRoutineV2;
  history?: Record<string, LegacyJourneyDayStatusV2>;
  lastShareAt?: string | null;
};

function cloneDay(day: JourneyDayStatus): JourneyDayStatus {
  return {
    dateKey: day.dateKey,
    prayers: { ...day.prayers },
    habits: { ...day.habits },
  };
}

function sanitizeDay(
  dateKey: string,
  value: Partial<JourneyDayStatus> | LegacyJourneyDayStatusV3 | LegacyJourneyDayStatusV2 | undefined
): JourneyDayStatus {
  const base = createEmptyJourneyDay(dateKey);

  const prayers = JOURNEY_PRAYERS.reduce<JourneyDayStatus["prayers"]>((accumulator, prayer) => {
    accumulator[prayer] = value && "prayers" in value ? value.prayers?.[prayer] === true : false;
    return accumulator;
  }, createEmptyJourneyPrayers());

  const habits = JOURNEY_HABITS.reduce<JourneyDayStatus["habits"]>((accumulator, habit) => {
    if (value && "habits" in value) {
      accumulator[habit] = value.habits?.[habit] === true;
      return accumulator;
    }

    if (habit === "quran" && value && "readingCompleted" in value) {
      accumulator[habit] = value.readingCompleted === true;
      return accumulator;
    }

    if (habit === "fasting" && value && "fastingCompleted" in value) {
      accumulator[habit] = value.fastingCompleted === true;
      return accumulator;
    }

    if (value && "completions" in value) {
      accumulator[habit] = value.completions?.[habit] === true;
      return accumulator;
    }

    accumulator[habit] = false;
    return accumulator;
  }, createEmptyJourneyHabits());

  return {
    ...base,
    dateKey,
    prayers,
    habits,
  };
}

function sanitizeState(value: Partial<JourneyState> | null | undefined): JourneyState {
  const base = createDefaultJourneyState();
  const history = Object.entries(value?.history ?? {}).reduce<JourneyState["history"]>(
    (accumulator, [dateKey, day]) => {
      accumulator[dateKey] = sanitizeDay(dateKey, day);
      return accumulator;
    },
    {}
  );

  return {
    ...base,
    version: 4,
    history,
    lastShareAt:
      typeof value?.lastShareAt === "string" || value?.lastShareAt === null
        ? value.lastShareAt
        : null,
  };
}

function migrateLegacyV3State(legacy: LegacyJourneyStateV3): JourneyState {
  const history = Object.entries(legacy.history ?? {}).reduce<JourneyState["history"]>(
    (accumulator, [dateKey, day]) => {
      const migratedDay = createEmptyJourneyDay(dateKey);
      const salahComplete = day.completions?.salah === true;

      accumulator[dateKey] = {
        ...migratedDay,
        prayers: JOURNEY_PRAYERS.reduce((prayers, prayer) => {
          prayers[prayer] = salahComplete;
          return prayers;
        }, createEmptyJourneyPrayers()),
        habits: {
          quran: day.completions?.quran === true,
          fasting: day.completions?.fasting === true,
          dhikr: day.completions?.dhikr === true,
        },
      };
      return accumulator;
    },
    {}
  );

  return sanitizeState({
    version: 4,
    history,
    lastShareAt: legacy.lastShareAt ?? null,
  });
}

function migrateLegacyV2State(legacy: LegacyJourneyStateV2): JourneyState {
  const selectedPrayers = Array.isArray(legacy.routine?.selectedPrayers)
    ? legacy.routine.selectedPrayers
    : [];

  const history = Object.entries(legacy.history ?? {}).reduce<JourneyState["history"]>(
    (accumulator, [dateKey, day]) => {
      const prayers = JOURNEY_PRAYERS.reduce((record, prayer) => {
        record[prayer] = day.prayers?.[prayer] === true;
        return record;
      }, createEmptyJourneyPrayers());

      const selectedSalahComplete =
        selectedPrayers.length > 0 &&
        selectedPrayers.every((prayer) => day.prayers?.[prayer] === true);

      if (selectedSalahComplete && JOURNEY_PRAYERS.every((prayer) => prayers[prayer] === false)) {
        JOURNEY_PRAYERS.forEach((prayer) => {
          prayers[prayer] = true;
        });
      }

      accumulator[dateKey] = sanitizeDay(dateKey, {
        dateKey,
        prayers,
        readingCompleted: day.readingCompleted,
        fastingCompleted: day.fastingCompleted,
      });
      return accumulator;
    },
    {}
  );

  return sanitizeState({
    version: 4,
    history,
    lastShareAt: legacy.lastShareAt ?? null,
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

  const legacyV3 = await AsyncStorage.getItem(LEGACY_V3_STORAGE_KEY);
  if (legacyV3) {
    const migrated = migrateLegacyV3State(JSON.parse(legacyV3) as LegacyJourneyStateV3);
    await persistState(migrated);
    await AsyncStorage.removeItem(LEGACY_V3_STORAGE_KEY);
    return migrated;
  }

  const legacyV2 = await AsyncStorage.getItem(LEGACY_V2_STORAGE_KEY);
  if (legacyV2) {
    const migrated = migrateLegacyV2State(JSON.parse(legacyV2) as LegacyJourneyStateV2);
    await persistState(migrated);
    await AsyncStorage.removeItem(LEGACY_V2_STORAGE_KEY);
    return migrated;
  }

  const legacyRamadan = await AsyncStorage.getItem(LEGACY_RAMADAN_STORAGE_KEY);
  if (legacyRamadan) {
    await AsyncStorage.removeItem(LEGACY_RAMADAN_STORAGE_KEY);
  }

  const seeded = createDefaultJourneyState();
  await persistState(seeded);
  return seeded;
}

function getDay(state: JourneyState, dateKey: string): JourneyDayStatus {
  return state.history[dateKey] ?? createEmptyJourneyDay(dateKey);
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

  const streaks = useMemo(() => getCurrentStreaks(state.history), [state.history]);
  const longestStreaks = useMemo(() => getLongestStreaks(state.history), [state.history]);
  const completionCounts = useMemo(() => getCompletionCounts(state.history), [state.history]);
  const recentPracticeHistory = useMemo(
    () => getRecentPracticeHistory(state.history),
    [state.history]
  );
  const strongestPractice = useMemo(
    () => getStrongestPractice(streaks, completionCounts),
    [completionCounts, streaks]
  );

  const todaySalahCompletedCount = getJourneySalahCompletedCount(todayStatus);
  const todaySalahComplete = isJourneyPracticeComplete("salah", todayStatus);
  const completedTodayCount =
    (todaySalahComplete ? 1 : 0) + getCompletedHabitCount(todayStatus);
  const daysReturned = useMemo(() => getDaysReturned(state.history), [state.history]);

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

  const toggleHabitCompletion = useCallback(
    (habit: JourneyHabit) => {
      updateState((current) => {
        const day = cloneDay(getDay(current, todayKey));

        return {
          ...current,
          history: {
            ...current.history,
            [todayKey]: toggleJourneyHabit(day, habit),
          },
        };
      });
    },
    [todayKey, updateState]
  );

  const markShareCreated = useCallback(() => {
    updateState((current) => ({
      ...current,
      lastShareAt: new Date().toISOString(),
    }));
  }, [updateState]);

  return {
    state,
    todayKey,
    todayStatus,
    isLoading,
    streaks,
    longestStreaks,
    completionCounts,
    completedTodayCount,
    recentPracticeHistory,
    strongestPractice,
    daysReturned,
    todaySalahCompletedCount,
    todaySalahComplete,
    togglePrayerCompletion,
    toggleHabitCompletion,
    markShareCreated,
  };
};
