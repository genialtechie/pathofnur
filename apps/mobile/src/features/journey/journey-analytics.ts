import {
  EventName,
  track,
  trackScreenView,
} from "@/src/lib/analytics/track";

import type {
  JourneyPrayerKey,
  JourneyPractice,
  JourneyReminderPermissionStatus,
  JourneyRoutine,
} from "./journey-types";

export function trackJourneyScreenView(screenName: string = "journey") {
  return trackScreenView(screenName);
}

export function trackJourneyHabitToggled(
  habit: JourneyPractice,
  isComplete: boolean,
  dayKey: string
) {
  return track(
    EventName.JOURNEY_HABIT_TOGGLED,
    {
      habit,
      is_complete: isComplete,
      day_key: dayKey,
    },
    "journey-streaks"
  );
}

export function trackJourneyRoutineSaved(
  routine: JourneyRoutine,
  eventName: typeof EventName.JOURNEY_ROUTINE_CREATED | typeof EventName.JOURNEY_ROUTINE_UPDATED
) {
  const activePracticeCount = Object.values(routine.practices).filter(Boolean).length;

  return track(
    eventName,
    {
      active_practice_count: activePracticeCount,
      includes_salah: routine.practices.salah,
      includes_quran: routine.practices.quran,
      includes_fasting: routine.practices.fasting,
      includes_dhikr: routine.practices.dhikr,
      prayer_reminders_enabled: routine.reminders.wantsPrayerReminders,
    },
    "journey-routine"
  );
}

export function trackJourneyReminderPermissionRequested() {
  return track(
    EventName.JOURNEY_REMINDER_PERMISSION_REQUESTED,
    {},
    "journey-routine"
  );
}

export function trackJourneyReminderPermissionGranted(
  status: JourneyReminderPermissionStatus
) {
  return track(
    EventName.JOURNEY_REMINDER_PERMISSION_GRANTED,
    {
      permission_status: status,
    },
    "journey-routine"
  );
}

export function trackJourneyReminderScheduled(
  reminderCount: number,
  windowDays: number,
  prayerRemindersEnabled: boolean
) {
  return track(
    EventName.JOURNEY_REMINDER_SCHEDULED,
    {
      reminder_count: reminderCount,
      window_days: windowDays,
      prayer_reminders_enabled: prayerRemindersEnabled,
    },
    "journey-routine"
  );
}

export function trackJourneyPrayerCheckinCompleted(
  prayerName: JourneyPrayerKey,
  isComplete: boolean,
  dayKey: string
) {
  return track(
    EventName.JOURNEY_PRAYER_CHECKIN_COMPLETED,
    {
      prayer_name: prayerName,
      is_complete: isComplete,
      day_key: dayKey,
    },
    "journey-streaks"
  );
}

export function trackJourneyShareCardCreated(shareType: string) {
  return track(
    EventName.JOURNEY_SHARE_CARD_CREATED,
    {
      share_type: shareType,
    },
    "journey"
  );
}

export function trackJourneyStreakMilestone(
  streakDays: number,
  habit: JourneyPractice
) {
  return track(
    EventName.JOURNEY_STREAK_MILESTONE,
    {
      streak_days: streakDays,
      milestone_type: String(streakDays) as "3" | "7" | "14" | "30",
      habit,
    },
    "journey-streaks"
  );
}
