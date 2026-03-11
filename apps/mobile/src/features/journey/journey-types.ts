export const JOURNEY_PRACTICES = ["salah", "quran", "fasting", "dhikr"] as const;

export type JourneyPractice = (typeof JOURNEY_PRACTICES)[number];

export const JOURNEY_PRAYERS = ["fajr", "dhuhr", "asr", "maghrib", "isha"] as const;

export type JourneyPrayerKey = (typeof JOURNEY_PRAYERS)[number];

export const JOURNEY_HABITS = ["quran", "fasting", "dhikr"] as const;

export type JourneyHabit = (typeof JOURNEY_HABITS)[number];

// Legacy reminder/routine types are kept for compatibility with untouched route helpers.
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

export type JourneyHabitStatus = Record<JourneyHabit, boolean>;

export type JourneyPrayerStatus = Record<JourneyPrayerKey, boolean>;

export type JourneyDayStatus = {
  dateKey: string;
  prayers: JourneyPrayerStatus;
  habits: JourneyHabitStatus;
};

export type JourneyState = {
  version: 4;
  history: Record<string, JourneyDayStatus>;
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

export function createEmptyJourneyPrayers(): JourneyPrayerStatus {
  return {
    fajr: false,
    dhuhr: false,
    asr: false,
    maghrib: false,
    isha: false,
  };
}

export function createEmptyJourneyHabits(): JourneyHabitStatus {
  return {
    quran: false,
    fasting: false,
    dhikr: false,
  };
}

export function createEmptyJourneyDay(dateKey: string): JourneyDayStatus {
  return {
    dateKey,
    prayers: createEmptyJourneyPrayers(),
    habits: createEmptyJourneyHabits(),
  };
}

export function createDefaultJourneyState(): JourneyState {
  return {
    version: 4,
    history: {},
    lastShareAt: null,
  };
}

export function isRoutineConfigured(routine: JourneyRoutine): boolean {
  return JOURNEY_PRACTICES.some((practice) => routine.practices[practice]);
}

export function getJourneyPrayerLabel(prayer: JourneyPrayerKey): string {
  switch (prayer) {
    case "fajr":
      return "Fajr";
    case "dhuhr":
      return "Dhuhr";
    case "asr":
      return "Asr";
    case "maghrib":
      return "Maghrib";
    case "isha":
      return "Isha";
  }
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
      return "Mark each prayer as you complete it.";
    case "quran":
      return "Keep your daily Quran return in view.";
    case "fasting":
      return "Hold onto the days you complete your fast.";
    case "dhikr":
      return "Keep your daily dhikr close and consistent.";
  }
}
