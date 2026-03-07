import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";

import { fetchPrayerTimes } from "@/src/lib/prayer/aladhan-client";

import {
  JOURNEY_PRAYERS,
  getJourneyPrayerLabel,
  type JourneyPrayerKey,
  type JourneyReminderPermissionStatus,
  type JourneyRoutine,
} from "./journey-types";

const JOURNEY_REMINDER_IDS_KEY = "@pathofnur/journey/reminder-ids";
const JOURNEY_CHANNEL_ID = "journey-prayer-reminders";
const LOOKAHEAD_DAYS = 7;

type ScheduleRoutineReminderParams = {
  routine: JourneyRoutine;
  latitude: number;
  longitude: number;
};

function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parsePrayerDate(date: Date, timeValue: string): Date {
  const [hours, minutes] = timeValue.replace(/\s*\(.*\)$/, "").split(":").map(Number);
  const prayerDate = new Date(date);
  prayerDate.setHours(hours, minutes, 0, 0);
  return prayerDate;
}

function hasGrantedPermission(status: Notifications.NotificationPermissionsStatus): boolean {
  return status.granted || status.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;
}

function mapPermissionStatus(
  status: Notifications.NotificationPermissionsStatus
): JourneyReminderPermissionStatus {
  if (hasGrantedPermission(status)) {
    return "granted";
  }

  if (status.canAskAgain === false || status.status === Notifications.PermissionStatus.DENIED) {
    return "denied";
  }

  return "unknown";
}

async function readStoredNotificationIds(): Promise<string[]> {
  const stored = await AsyncStorage.getItem(JOURNEY_REMINDER_IDS_KEY);
  if (!stored) {
    return [];
  }

  try {
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed.filter((value): value is string => typeof value === "string") : [];
  } catch {
    return [];
  }
}

async function writeStoredNotificationIds(ids: string[]) {
  await AsyncStorage.setItem(JOURNEY_REMINDER_IDS_KEY, JSON.stringify(ids));
}

async function ensureNotificationChannel() {
  if (process.env.EXPO_OS !== "android") {
    return;
  }

  await Notifications.setNotificationChannelAsync(JOURNEY_CHANNEL_ID, {
    name: "Journey prayer reminders",
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 100, 250],
    lightColor: "#C5A021",
    sound: null,
  });
}

export async function getJourneyReminderPermissionStatus(): Promise<JourneyReminderPermissionStatus> {
  if (process.env.EXPO_OS === "web") {
    return "unsupported";
  }

  try {
    const permissions = await Notifications.getPermissionsAsync();
    return mapPermissionStatus(permissions);
  } catch {
    return "unsupported";
  }
}

export async function ensureNotificationPermissions(): Promise<JourneyReminderPermissionStatus> {
  if (process.env.EXPO_OS === "web") {
    return "unsupported";
  }

  const current = await Notifications.getPermissionsAsync();
  if (hasGrantedPermission(current)) {
    return "granted";
  }

  const requested = await Notifications.requestPermissionsAsync();
  return mapPermissionStatus(requested);
}

export async function cancelRoutineReminders() {
  if (process.env.EXPO_OS === "web") {
    await writeStoredNotificationIds([]);
    return;
  }

  const ids = await readStoredNotificationIds();
  await Promise.all(
    ids.map(async (identifier) => {
      try {
        await Notifications.cancelScheduledNotificationAsync(identifier);
      } catch {
        // Ignore stale identifiers.
      }
    })
  );
  await writeStoredNotificationIds([]);
}

async function scheduleReminder(
  prayer: JourneyPrayerKey,
  deliveryDate: Date,
  body: string,
  notificationType: "prayer_reminder" | "prayer_checkin",
  dateKey: string
) {
  return Notifications.scheduleNotificationAsync({
    content: {
      title: getJourneyPrayerLabel(prayer),
      body,
      sound: false,
      data: {
        href: "/(tabs)/journey",
        focus: "today",
        prayerName: prayer,
        notificationType,
        dateKey,
      },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: deliveryDate,
      channelId: JOURNEY_CHANNEL_ID,
    },
  });
}

export async function scheduleRoutineReminders({
  routine,
  latitude,
  longitude,
}: ScheduleRoutineReminderParams): Promise<{
  notificationIds: string[];
  scheduledCount: number;
  windowDays: number;
}> {
  if (process.env.EXPO_OS === "web" || routine.selectedPrayers.length === 0) {
    await writeStoredNotificationIds([]);
    return {
      notificationIds: [],
      scheduledCount: 0,
      windowDays: LOOKAHEAD_DAYS,
    };
  }

  await cancelRoutineReminders();
  await ensureNotificationChannel();

  const notificationIds: string[] = [];
  const now = Date.now();

  for (let dayOffset = 0; dayOffset < LOOKAHEAD_DAYS; dayOffset += 1) {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() + dayOffset);

    try {
      const { times } = await fetchPrayerTimes({
        latitude,
        longitude,
        date,
      });

      const dateKey = toDateKey(date);

      for (const prayer of routine.selectedPrayers) {
        if (!JOURNEY_PRAYERS.includes(prayer)) {
          continue;
        }

        const prayerKey = getJourneyPrayerLabel(prayer) as keyof typeof times;
        const prayerDate = parsePrayerDate(date, times[prayerKey]);

        const reminderDate = new Date(
          prayerDate.getTime() - routine.reminderLeadMinutes * 60 * 1000
        );
        const followUpDate = new Date(
          prayerDate.getTime() + routine.followUpDelayMinutes * 60 * 1000
        );

        if (reminderDate.getTime() > now) {
          const identifier = await scheduleReminder(
            prayer,
            reminderDate,
            `A gentle invitation for ${getJourneyPrayerLabel(prayer)} is coming soon.`,
            "prayer_reminder",
            dateKey
          );
          notificationIds.push(identifier);
        }

        if (followUpDate.getTime() > now) {
          const identifier = await scheduleReminder(
            prayer,
            followUpDate,
            `Did you pray ${getJourneyPrayerLabel(prayer)}? Mark it in Path of Nur.`,
            "prayer_checkin",
            dateKey
          );
          notificationIds.push(identifier);
        }
      }
    } catch (error) {
      console.error("Failed to schedule prayer reminders for date:", date, error);
    }
  }

  await writeStoredNotificationIds(notificationIds);

  return {
    notificationIds,
    scheduledCount: notificationIds.length,
    windowDays: LOOKAHEAD_DAYS,
  };
}

export async function rescheduleRoutineReminders(
  params: ScheduleRoutineReminderParams
) {
  return scheduleRoutineReminders(params);
}
