import { useCallback, useMemo } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import * as Haptics from "expo-haptics";
import { Stack, useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { EventName } from "@/src/lib/analytics/track";
import { useLocation } from "@/src/lib/location";
import { fontFamily, radii, spacing, useTheme } from "@/src/theme";

import {
  trackJourneyRoutineSaved,
  trackJourneyScreenView,
} from "./journey-analytics";
import { JourneyActionButton, JourneyPanel, JourneySettingRow, JourneyTag } from "./journey-primitives";
import { getJourneyPracticeTone } from "./journey-practice-meta";
import {
  JOURNEY_PRACTICES,
  getJourneyPracticeDescription,
  getJourneyPracticeLabel,
  isRoutineConfigured,
  type JourneyPractice,
  type JourneyRoutine,
} from "./journey-types";
import { useJourneyProgress } from "./useJourneyProgress";
import { useJourneyReminderActions } from "./useJourneyReminderActions";

function getNextRoutineWithPractice(
  routine: JourneyRoutine,
  practice: JourneyPractice,
  enabled: boolean
) {
  const nextRoutine: JourneyRoutine = {
    ...routine,
    practices: {
      ...routine.practices,
      [practice]: enabled,
    },
  };

  if (practice === "salah" && !enabled) {
    nextRoutine.reminders = {
      ...nextRoutine.reminders,
      wantsPrayerReminders: false,
      remindersActive: false,
      lastScheduledAt: null,
    };
  }

  return nextRoutine;
}

export function JourneyRoutineScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { location, status: locationStatus } = useLocation();
  const coords = location?.coords;
  const {
    activePractices,
    isLoading,
    routine,
    setPracticeEnabled,
    setReminderPermissionStatus,
    setReminderSchedule,
    setWantsPrayerReminders,
  } = useJourneyProgress();

  const { handleDisableReminders, isScheduling, syncReminders } =
    useJourneyReminderActions({
      coords,
      routine,
      setReminderPermissionStatus,
      setReminderSchedule,
    });

  useFocusEffect(
    useCallback(() => {
      void trackJourneyScreenView("journey-routine");
    }, [])
  );

  const reminderSummary = useMemo(() => {
    if (!routine.practices.salah) {
      return "Enable Daily Salah if you want prayer reminders.";
    }

    if (routine.reminders.remindersActive) {
      return "Prayer reminders are active before each prayer with a gentle follow-up check-in.";
    }

    if (routine.reminders.permissionStatus === "denied") {
      return "Notification permission is blocked right now. Turn it back on from system settings or try again later.";
    }

    if (locationStatus !== "granted") {
      return "Location is still needed before Path of Nur can schedule prayer times accurately.";
    }

    if (routine.reminders.wantsPrayerReminders) {
      return "Reminders are ready to sync.";
    }

    return "Prayer reminders are optional and should be configured from here, not from the Journey tab.";
  }, [
    locationStatus,
    routine.practices.salah,
    routine.reminders.permissionStatus,
    routine.reminders.remindersActive,
    routine.reminders.wantsPrayerReminders,
  ]);

  const trackRoutineUpdate = useCallback(
    (nextRoutine: JourneyRoutine) => {
      const hadRoutine = isRoutineConfigured(routine);
      const hasRoutineNow = isRoutineConfigured(nextRoutine);

      if (!hasRoutineNow) {
        return;
      }

      void trackJourneyRoutineSaved(
        nextRoutine,
        hadRoutine ? EventName.JOURNEY_ROUTINE_UPDATED : EventName.JOURNEY_ROUTINE_CREATED
      );
    },
    [routine]
  );

  const handlePracticeToggle = useCallback(
    async (practice: JourneyPractice, enabled: boolean) => {
      void Haptics.selectionAsync();
      const nextRoutine = getNextRoutineWithPractice(routine, practice, enabled);
      setPracticeEnabled(practice, enabled);
      trackRoutineUpdate(nextRoutine);

      if (practice === "salah" && !enabled && routine.reminders.wantsPrayerReminders) {
        await handleDisableReminders();
      }
    },
    [
      handleDisableReminders,
      routine,
      setPracticeEnabled,
      trackRoutineUpdate,
    ]
  );

  const handleReminderToggle = useCallback(
    async (enabled: boolean) => {
      void Haptics.selectionAsync();
      const nextRoutine: JourneyRoutine = {
        ...routine,
        reminders: {
          ...routine.reminders,
          wantsPrayerReminders: enabled,
          remindersActive: enabled ? routine.reminders.remindersActive : false,
          lastScheduledAt: enabled ? routine.reminders.lastScheduledAt : null,
        },
      };

      setWantsPrayerReminders(enabled);
      trackRoutineUpdate(nextRoutine);

      if (!enabled) {
        await handleDisableReminders();
        return;
      }

      await syncReminders(true, true, nextRoutine);
    },
    [
      handleDisableReminders,
      routine,
      setWantsPrayerReminders,
      syncReminders,
      trackRoutineUpdate,
    ]
  );

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={[
        styles.container,
        {
          backgroundColor: colors.surface.background,
          paddingTop: insets.top + spacing.lg,
          paddingBottom: insets.bottom + 80,
        },
      ]}
    >
      <Stack.Screen
        options={{
          headerShown: true,
          title: "Routine",
          headerBackTitle: "Journey",
          headerShadowVisible: false,
          headerStyle: {
            backgroundColor: colors.surface.background,
          },
          headerTintColor: colors.text.primary,
          headerTitleStyle: {
            color: colors.text.primary,
            fontFamily: fontFamily.appBold,
          },
        }}
      />

      <View style={styles.intro}>
        <Text style={[styles.title, { color: colors.text.primary }]} selectable>
          Shape the practice you want to keep returning to.
        </Text>
        <Text style={[styles.subtitle, { color: colors.text.secondary }]} selectable>
          This is your settings-style routine editor. The Journey tab stays focused on momentum, not setup.
        </Text>
      </View>

      <JourneyPanel
        title="Active practices"
        subtitle="Choose the daily practices you want Path of Nur to support."
      >
        {JOURNEY_PRACTICES.map((practice) => (
          <JourneySettingRow
            key={practice}
            title={getJourneyPracticeLabel(practice)}
            description={getJourneyPracticeDescription(practice)}
            value={routine.practices[practice]}
            onValueChange={(nextValue) => void handlePracticeToggle(practice, nextValue)}
          />
        ))}

        {activePractices.length > 0 ? (
          <View style={styles.tagRow}>
            {activePractices.map((practice) => (
              <JourneyTag
                key={practice}
                label={getJourneyPracticeLabel(practice)}
                tone={getJourneyPracticeTone(practice)}
              />
            ))}
          </View>
        ) : null}
      </JourneyPanel>

      <JourneyPanel
        title="Prayer reminders"
        subtitle="Configured here after onboarding so the main Journey experience stays clean."
        badge={routine.reminders.remindersActive ? "Active" : "Off"}
      >
        <JourneySettingRow
          title="Prayer reminders"
          description="Before each prayer, with a gentle follow-up asking if you prayed."
          value={routine.reminders.wantsPrayerReminders}
          disabled={!routine.practices.salah}
          onValueChange={(nextValue) => void handleReminderToggle(nextValue)}
        />

        <View
          style={[
            styles.notice,
            {
              backgroundColor: colors.surface.background,
              borderColor: colors.surface.border,
            },
          ]}
        >
          <Text style={[styles.noticeCopy, { color: colors.text.secondary }]} selectable>
            {reminderSummary}
          </Text>
        </View>

        {routine.reminders.wantsPrayerReminders && !routine.reminders.remindersActive ? (
          <JourneyActionButton
            label={isScheduling ? "Syncing reminders..." : "Sync reminders now"}
            emphasis="secondary"
            disabled={isScheduling || isLoading}
            onPress={() => void syncReminders(true)}
          />
        ) : null}
      </JourneyPanel>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  intro: {
    gap: spacing.sm,
    paddingTop: spacing.md,
  },
  title: {
    fontFamily: fontFamily.appBold,
    fontSize: 32,
    lineHeight: 38,
    maxWidth: 320,
  },
  subtitle: {
    fontFamily: fontFamily.appRegular,
    fontSize: 16,
    lineHeight: 23,
    maxWidth: 320,
  },
  tagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  notice: {
    borderRadius: radii.lg,
    borderWidth: 1,
    padding: spacing.md,
  },
  noticeCopy: {
    fontFamily: fontFamily.appRegular,
    fontSize: 14,
    lineHeight: 20,
  },
});
