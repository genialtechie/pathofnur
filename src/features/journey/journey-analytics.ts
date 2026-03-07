import {
  EventName,
  track,
  trackScreenView,
} from "@/src/lib/analytics/track";

import type {
  JourneyHabit,
  JourneyPrayerKey,
  JourneyReminderPermissionStatus,
  JourneyRoutine,
} from "./journey-types";

const JOURNEY_SCREEN = "journey";

export function trackJourneyScreenView() {
  return trackScreenView(JOURNEY_SCREEN);
}

export function trackJourneyHabitToggled(
  habit: JourneyHabit,
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
    JOURNEY_SCREEN
  );
}

export function trackJourneyRoutineSaved(
  routine: JourneyRoutine,
  eventName: typeof EventName.JOURNEY_ROUTINE_CREATED | typeof EventName.JOURNEY_ROUTINE_UPDATED
) {
  return track(
    eventName,
    {
      selected_prayer_count: routine.selectedPrayers.length,
      includes_reading: routine.readingEnabled,
      includes_fasting: routine.fastingEnabled,
      reminder_lead_minutes: routine.reminderLeadMinutes,
      follow_up_delay_minutes: routine.followUpDelayMinutes,
    },
    JOURNEY_SCREEN
  );
}

export function trackJourneyReminderPermissionRequested() {
  return track(
    EventName.JOURNEY_REMINDER_PERMISSION_REQUESTED,
    {},
    JOURNEY_SCREEN
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
    JOURNEY_SCREEN
  );
}

export function trackJourneyReminderScheduled(
  reminderCount: number,
  selectedPrayerCount: number,
  windowDays: number
) {
  return track(
    EventName.JOURNEY_REMINDER_SCHEDULED,
    {
      reminder_count: reminderCount,
      selected_prayer_count: selectedPrayerCount,
      window_days: windowDays,
    },
    JOURNEY_SCREEN
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
    JOURNEY_SCREEN
  );
}

export function trackJourneyShareCardCreated(shareType: string) {
  return track(
    EventName.JOURNEY_SHARE_CARD_CREATED,
    {
      share_type: shareType,
    },
    JOURNEY_SCREEN
  );
}

export function trackJourneyStreakMilestone(
  streakDays: number,
  habit: JourneyHabit
) {
  return track(
    EventName.JOURNEY_STREAK_MILESTONE,
    {
      streak_days: streakDays,
      milestone_type: String(streakDays) as "3" | "7" | "14" | "30",
      habit,
    },
    JOURNEY_SCREEN
  );
}
