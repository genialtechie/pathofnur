import {
  JOURNEY_HABITS,
  JOURNEY_PRAYERS,
  JOURNEY_PRACTICES,
  createJourneyPracticeRecord,
  type JourneyDayStatus,
  type JourneyHabit,
  type JourneyPractice,
  type JourneyState,
} from "./journey-types";

export const RECENT_HISTORY_DAYS = 7;

export function getDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getPreviousDateKey(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() - 1);
  return getDateKey(date);
}

export function getJourneySalahCompletedCount(day: JourneyDayStatus) {
  return JOURNEY_PRAYERS.filter((prayer) => day.prayers[prayer]).length;
}

export function isJourneyPracticeComplete(
  practice: JourneyPractice,
  day: JourneyDayStatus | undefined
) {
  if (!day) {
    return false;
  }

  if (practice === "salah") {
    return JOURNEY_PRAYERS.every((prayer) => day.prayers[prayer]);
  }

  return day.habits[practice];
}

export function hasAnyJourneyCompletion(day: JourneyDayStatus) {
  return (
    getJourneySalahCompletedCount(day) > 0 ||
    JOURNEY_HABITS.some((habit) => day.habits[habit])
  );
}

export function getSortedHistoryKeys(history: JourneyState["history"]) {
  return Object.keys(history).sort((left, right) => left.localeCompare(right));
}

export function getCurrentStreaks(history: JourneyState["history"]) {
  return JOURNEY_PRACTICES.reduce<Record<JourneyPractice, number>>((accumulator, practice) => {
    let streak = 0;

    for (let offset = 0; offset < 365; offset += 1) {
      const date = new Date();
      date.setHours(0, 0, 0, 0);
      date.setDate(date.getDate() - offset);

      const dateKey = getDateKey(date);
      if (!isJourneyPracticeComplete(practice, history[dateKey])) {
        break;
      }

      streak += 1;
    }

    accumulator[practice] = streak;
    return accumulator;
  }, createJourneyPracticeRecord(0));
}

export function getLongestStreaks(history: JourneyState["history"]) {
  const historyKeys = getSortedHistoryKeys(history);

  return JOURNEY_PRACTICES.reduce<Record<JourneyPractice, number>>((accumulator, practice) => {
    let longest = 0;
    let current = 0;
    let previousKey: string | null = null;

    historyKeys.forEach((dateKey) => {
      const day = history[dateKey];
      if (!isJourneyPracticeComplete(practice, day)) {
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
}

export function getCompletionCounts(history: JourneyState["history"]) {
  return JOURNEY_PRACTICES.reduce<Record<JourneyPractice, number>>((accumulator, practice) => {
    accumulator[practice] = Object.values(history).filter((day) =>
      isJourneyPracticeComplete(practice, day)
    ).length;
    return accumulator;
  }, createJourneyPracticeRecord(0));
}

export function getRecentPracticeHistory(history: JourneyState["history"]) {
  return JOURNEY_PRACTICES.reduce<
    Record<JourneyPractice, Array<{ dateKey: string; label: string; isComplete: boolean }>>
  >((accumulator, practice) => {
    accumulator[practice] = Array.from({ length: RECENT_HISTORY_DAYS }, (_, index) => {
      const date = new Date();
      date.setHours(0, 0, 0, 0);
      date.setDate(date.getDate() - (RECENT_HISTORY_DAYS - 1 - index));

      const dateKey = getDateKey(date);

      return {
        dateKey,
        label: date.toLocaleDateString("en-US", { weekday: "short" }).slice(0, 1),
        isComplete: isJourneyPracticeComplete(practice, history[dateKey]),
      };
    });
    return accumulator;
  }, createJourneyPracticeRecord([] as Array<{ dateKey: string; label: string; isComplete: boolean }>));
}

export function getStrongestPractice(
  streaks: Record<JourneyPractice, number>,
  completionCounts: Record<JourneyPractice, number>
) {
  const leader = JOURNEY_PRACTICES.reduce<JourneyPractice | null>((leading, practice) => {
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
  }, null);

  if (!leader) {
    return null;
  }

  return streaks[leader] === 0 && completionCounts[leader] === 0 ? null : leader;
}

export function getDaysReturned(history: JourneyState["history"]) {
  return Object.values(history).filter(hasAnyJourneyCompletion).length;
}

export function getCompletedHabitCount(day: JourneyDayStatus) {
  return JOURNEY_HABITS.filter((habit) => day.habits[habit]).length;
}

export function toggleJourneyHabit(day: JourneyDayStatus, habit: JourneyHabit) {
  return {
    ...day,
    habits: {
      ...day.habits,
      [habit]: !day.habits[habit],
    },
  };
}
