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
    async (shouldRequestPermission: boolean) => {
      if (routine.selectedPrayers.length === 0) {
        Alert.alert("Choose prayers first", "Select at least one prayer before turning reminders on.");
        return;
      }

      if (!coords) {
        Alert.alert(
          "Location needed",
          "Prayer reminders need your current or saved location so Path of Nur can calculate prayer times."
        );
        return;
      }

      setIsScheduling(true);

      try {
        let permissionStatus = routine.reminderPermissionStatus;

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
            remindersDirty: false,
          });
          return;
        }

        const result = await rescheduleRoutineReminders({
          routine: {
            ...routine,
            remindersActive: true,
          },
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
          routine.selectedPrayers.length,
          result.windowDays
        );
      } catch (error) {
        console.error("Failed to sync journey reminders:", error);
        Alert.alert(
          "Reminder sync failed",
          "The prayer reminder schedule could not be updated. Try again in a moment."
        );
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
