export const JOURNEY_PRACTICES = ["salah", "quran", "fasting", "dhikr"] as const;

export type JourneyPractice = (typeof JOURNEY_PRACTICES)[number];

export const JOURNEY_PRAYERS = ["fajr", "dhuhr", "asr", "maghrib", "isha"] as const;

export type JourneyPrayerKey = (typeof JOURNEY_PRAYERS)[number];

export type JourneyReminderPermissionStatus =
  | "unknown"
  | "granted"
  | "denied"
  | "unsupported";

export type JourneyPracticePlan = Record<JourneyPractice, boolean>;

export type JourneyReminderSettings = {
  wantsPrayerReminders: boolean;
  permissionStatus: JourneyReminderPermissionStatus;
  remindersActive: boolean;
  leadMinutes: number;
  followUpDelayMinutes: number;
  lastScheduledAt: string | null;
};

export type JourneyRoutine = {
  practices: JourneyPracticePlan;
  reminders: JourneyReminderSettings;
};

export type JourneyDayStatus = {
  dateKey: string;
  completions: JourneyPracticePlan;
};

export type JourneyState = {
  version: 3;
  routine: JourneyRoutine;
  history: Record<string, JourneyDayStatus>;
  notificationIds: string[];
  remindersDirty: boolean;
  lastShareAt: string | null;
};

export const JOURNEY_REMINDER_LEAD_MINUTES = 15;
export const JOURNEY_FOLLOW_UP_DELAY_MINUTES = 45;

export function createEmptyPracticePlan(): JourneyPracticePlan {
  return {
    salah: false,
    quran: false,
    fasting: false,
    dhikr: false,
  };
}

export function createJourneyPracticeRecord<T>(initialValue: T): Record<JourneyPractice, T> {
  return {
    salah: initialValue,
    quran: initialValue,
    fasting: initialValue,
    dhikr: initialValue,
  };
}

export function createDefaultJourneyRoutine(): JourneyRoutine {
  return {
    practices: createEmptyPracticePlan(),
    reminders: {
      wantsPrayerReminders: false,
      permissionStatus: "unknown",
      remindersActive: false,
      leadMinutes: JOURNEY_REMINDER_LEAD_MINUTES,
      followUpDelayMinutes: JOURNEY_FOLLOW_UP_DELAY_MINUTES,
      lastScheduledAt: null,
    },
  };
}

export function createEmptyJourneyDay(dateKey: string): JourneyDayStatus {
  return {
    dateKey,
    completions: createEmptyPracticePlan(),
  };
}

export function createDefaultJourneyState(): JourneyState {
  return {
    version: 3,
    routine: createDefaultJourneyRoutine(),
    history: {},
    notificationIds: [],
    remindersDirty: false,
    lastShareAt: null,
  };
}

export function isRoutineConfigured(routine: JourneyRoutine): boolean {
  return JOURNEY_PRACTICES.some((practice) => routine.practices[practice]);
}

export function getJourneyPrayerLabel(prayer: JourneyPrayerKey): string {
  return prayer.charAt(0).toUpperCase() + prayer.slice(1);
}

export function getJourneyPracticeLabel(practice: JourneyPractice): string {
  switch (practice) {
    case "salah":
      return "Salah";
    case "quran":
      return "Quran";
    case "fasting":
      return "Fasting";
    case "dhikr":
      return "Dhikr";
  }
}

export function getJourneyPracticeDescription(practice: JourneyPractice): string {
  switch (practice) {
    case "salah":
      return "Track your full daily salah practice as one return.";
    case "quran":
      return "Keep a steady relationship with your daily Quran reading.";
    case "fasting":
      return "Mark the days you complete a fast.";
    case "dhikr":
      return "Build consistency with your daily dhikr practice.";
  }
}
