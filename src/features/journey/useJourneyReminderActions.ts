import { useCallback, useEffect, useState } from "react";
import { Alert } from "react-native";

import {
  trackJourneyReminderPermissionGranted,
  trackJourneyReminderPermissionRequested,
  trackJourneyReminderScheduled,
} from "./journey-analytics";
import {
  cancelRoutineReminders,
  ensureNotificationPermissions,
  getJourneyReminderPermissionStatus,
  rescheduleRoutineReminders,
} from "./journey-notifications";
import type {
  JourneyReminderPermissionStatus,
  JourneyRoutine,
} from "./journey-types";

type Coordinates = {
  latitude: number;
  longitude: number;
};

type ReminderScheduleSetter = (value: {
  notificationIds: string[];
  remindersActive: boolean;
  lastScheduledAt: string | null;
  remindersDirty?: boolean;
}) => void;

type UseJourneyReminderActionsParams = {
  coords?: Coordinates;
  routine: JourneyRoutine;
  setReminderPermissionStatus: (
    status: JourneyReminderPermissionStatus
  ) => void;
  setReminderSchedule: ReminderScheduleSetter;
};

export function useJourneyReminderActions({
  coords,
  routine,
  setReminderPermissionStatus,
  setReminderSchedule,
}: UseJourneyReminderActionsParams) {
  const [isScheduling, setIsScheduling] = useState(false);

  useEffect(() => {
    void getJourneyReminderPermissionStatus().then((status) => {
      setReminderPermissionStatus(status);
    });
  }, [setReminderPermissionStatus]);

  const syncReminders = useCallback(
    async (
      shouldRequestPermission: boolean,
      showAlerts: boolean = true,
      routineOverride?: JourneyRoutine
    ) => {
      const effectiveRoutine = routineOverride ?? routine;

      if (!effectiveRoutine.practices.salah || !effectiveRoutine.reminders.wantsPrayerReminders) {
        if (showAlerts) {
          Alert.alert(
            "Enable salah reminders first",
            "Turn on Daily Salah and prayer reminders before syncing."
          );
        }
        return false;
      }

      if (!coords) {
        if (showAlerts) {
          Alert.alert(
            "Location needed",
            "Prayer reminders need your current or saved location so Path of Nur can calculate prayer times."
          );
        }
        return false;
      }

      setIsScheduling(true);

      try {
        let permissionStatus = effectiveRoutine.reminders.permissionStatus;

        if (!shouldRequestPermission && permissionStatus === "granted") {
          permissionStatus = await getJourneyReminderPermissionStatus();
          setReminderPermissionStatus(permissionStatus);
        }

        if (shouldRequestPermission || permissionStatus === "unknown") {
          void trackJourneyReminderPermissionRequested();
          permissionStatus = await ensureNotificationPermissions();
          setReminderPermissionStatus(permissionStatus);

          if (permissionStatus === "granted") {
            void trackJourneyReminderPermissionGranted(permissionStatus);
          }
        }

        if (permissionStatus !== "granted") {
          setReminderSchedule({
            notificationIds: [],
            remindersActive: false,
            lastScheduledAt: null,
            remindersDirty: true,
          });
          return false;
        }

        const result = await rescheduleRoutineReminders({
          routine: effectiveRoutine,
          latitude: coords.latitude,
          longitude: coords.longitude,
        });

        setReminderSchedule({
          notificationIds: result.notificationIds,
          remindersActive: true,
          lastScheduledAt: new Date().toISOString(),
          remindersDirty: false,
        });

        void trackJourneyReminderScheduled(
          result.scheduledCount,
          result.windowDays,
          effectiveRoutine.reminders.wantsPrayerReminders
        );

        return true;
      } catch (error) {
        console.error("Failed to sync journey reminders:", error);
        if (showAlerts) {
          Alert.alert(
            "Reminder sync failed",
            "The prayer reminder schedule could not be updated. Try again in a moment."
          );
        }
        return false;
      } finally {
        setIsScheduling(false);
      }
    },
    [coords, routine, setReminderPermissionStatus, setReminderSchedule]
  );

  const handleDisableReminders = useCallback(async () => {
    setIsScheduling(true);

    try {
      await cancelRoutineReminders();
      setReminderSchedule({
        notificationIds: [],
        remindersActive: false,
        lastScheduledAt: null,
        remindersDirty: false,
      });
    } catch (error) {
      console.error("Failed to disable reminders:", error);
    } finally {
      setIsScheduling(false);
    }
  }, [setReminderSchedule]);

  return {
    isScheduling,
    syncReminders,
    handleDisableReminders,
  };
}
