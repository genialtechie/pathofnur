export const JOURNEY_PRAYERS = ["fajr", "dhuhr", "asr", "maghrib", "isha"] as const;

export type JourneyPrayerKey = (typeof JOURNEY_PRAYERS)[number];

export const JOURNEY_HABITS = ["prayer", "fasting", "reading"] as const;

export type JourneyHabit = (typeof JOURNEY_HABITS)[number];

export type JourneyReminderPermissionStatus =
  | "unknown"
  | "granted"
  | "denied"
  | "unsupported";

export type JourneyRoutine = {
  selectedPrayers: JourneyPrayerKey[];
  readingEnabled: boolean;
  fastingEnabled: boolean;
  reminderLeadMinutes: number;
  followUpDelayMinutes: number;
  reminderPermissionStatus: JourneyReminderPermissionStatus;
  remindersActive: boolean;
  lastScheduledAt: string | null;
};

export type JourneyDayStatus = {
  dateKey: string;
  prayers: Record<JourneyPrayerKey, boolean>;
  readingCompleted: boolean;
  fastingCompleted: boolean;
};

export type JourneyState = {
  version: 2;
  routine: JourneyRoutine;
  history: Record<string, JourneyDayStatus>;
  notificationIds: string[];
  remindersDirty: boolean;
  lastShareAt: string | null;
};

export const REMINDER_LEAD_OPTIONS = [10, 15, 20] as const;

export const FOLLOW_UP_DELAY_OPTIONS = [30, 45, 60] as const;

export function createEmptyJourneyDay(dateKey: string): JourneyDayStatus {
  return {
    dateKey,
    prayers: {
      fajr: false,
      dhuhr: false,
      asr: false,
      maghrib: false,
      isha: false,
    },
    readingCompleted: false,
    fastingCompleted: false,
  };
}

export function createDefaultJourneyRoutine(): JourneyRoutine {
  return {
    selectedPrayers: [],
    readingEnabled: false,
    fastingEnabled: false,
    reminderLeadMinutes: 15,
    followUpDelayMinutes: 45,
    reminderPermissionStatus: "unknown",
    remindersActive: false,
    lastScheduledAt: null,
  };
}

export function createDefaultJourneyState(): JourneyState {
  return {
    version: 2,
    routine: createDefaultJourneyRoutine(),
    history: {},
    notificationIds: [],
    remindersDirty: false,
    lastShareAt: null,
  };
}

export function isRoutineConfigured(routine: JourneyRoutine): boolean {
  return (
    routine.selectedPrayers.length > 0 ||
    routine.readingEnabled ||
    routine.fastingEnabled
  );
}

export function getJourneyPrayerLabel(prayer: JourneyPrayerKey): string {
  return prayer.charAt(0).toUpperCase() + prayer.slice(1);
}
