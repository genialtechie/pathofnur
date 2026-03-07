import { useCallback, useEffect, useMemo } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Stack, useFocusEffect, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useLocation } from "@/src/lib/location";
import { fontFamily, spacing, useTheme } from "@/src/theme";

import {
  JourneyHeroCard,
  JourneyRoutineSummaryPanel,
  JourneySharePanel,
  JourneyStreakGatewayPanel,
} from "./journey-hub-sections";
import { trackJourneyScreenView } from "./journey-analytics";
import { getJourneyPracticeLabel } from "./journey-types";
import { useJourneyMilestones } from "./useJourneyMilestones";
import { useJourneyProgress } from "./useJourneyProgress";
import { useJourneyReminderActions } from "./useJourneyReminderActions";
import { useJourneyShareAction } from "./useJourneyShareAction";

const SHARE_CARD_SOURCE = require("@/public/images/_source/journey-share-daily-completion-v02-card.png");

function getReminderStatusLabel({
  salahEnabled,
  wantsPrayerReminders,
  remindersActive,
  permissionStatus,
}: {
  salahEnabled: boolean;
  wantsPrayerReminders: boolean;
  remindersActive: boolean;
  permissionStatus: string;
}) {
  if (!salahEnabled || !wantsPrayerReminders) {
    return "Off";
  }

  if (remindersActive) {
    return "Active";
  }

  if (permissionStatus === "denied") {
    return "Permission needed";
  }

  if (permissionStatus === "unsupported") {
    return "iOS / Android";
  }

  return "Pending";
}

export default function JourneyScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const {
    routine,
    isLoading,
    activePractices,
    streaks,
    strongestPractice,
    remindersDirty,
    setReminderPermissionStatus,
    setReminderSchedule,
    markShareCreated,
  } = useJourneyProgress();
  const { location } = useLocation();
  const coords = location?.coords;

  const { syncReminders } = useJourneyReminderActions({
    coords,
    routine,
    setReminderPermissionStatus,
    setReminderSchedule,
  });

  useFocusEffect(
    useCallback(() => {
      void trackJourneyScreenView("journey");
    }, [])
  );

  useJourneyMilestones(streaks);

  useEffect(() => {
    if (
      isLoading ||
      !coords ||
      !routine.practices.salah ||
      !routine.reminders.wantsPrayerReminders ||
      routine.reminders.permissionStatus !== "granted" ||
      (routine.reminders.remindersActive && !remindersDirty)
    ) {
      return;
    }

    void syncReminders(false, false);
  }, [
    coords,
    isLoading,
    remindersDirty,
    routine,
    syncReminders,
  ]);

  const reminderStatusLabel = getReminderStatusLabel({
    salahEnabled: routine.practices.salah,
    wantsPrayerReminders: routine.reminders.wantsPrayerReminders,
    remindersActive: routine.reminders.remindersActive,
    permissionStatus: routine.reminders.permissionStatus,
  });

  const shareMessage = useMemo(() => {
    if (activePractices.length === 0) {
      return "Path of Nur journey update\n\nI'm building my daily spiritual practice in Path of Nur.\n\nhttps://pathofnur.com";
    }

    const lines = activePractices.map((practice) => {
      const label = getJourneyPracticeLabel(practice);
      const streak = streaks[practice];
      return `${label}: ${streak} day${streak === 1 ? "" : "s"}`;
    });

    return `Path of Nur journey update\n${lines.join("\n")}\n\nhttps://pathofnur.com`;
  }, [activePractices, streaks]);

  const handleShare = useJourneyShareAction({
    shareMessage,
    markShareCreated,
  });

  const shareHeadline = strongestPractice
    ? `${getJourneyPracticeLabel(strongestPractice)} • ${streaks[strongestPractice]} day streak`
    : "Path of Nur";
  const shareBody = activePractices.length
    ? activePractices
        .map((practice) => `${getJourneyPracticeLabel(practice)} ${streaks[practice]}d`)
        .join(" • ")
    : "Build a steady spiritual routine one return at a time.";

  if (isLoading) {
    return (
      <View style={[styles.loadingState, { backgroundColor: colors.surface.background }]}>
        <Text style={[styles.loadingCopy, { color: colors.text.secondary }]} selectable>
          Building your Journey...
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={[
        styles.container,
        {
          backgroundColor: colors.surface.background,
          paddingTop: insets.top + spacing.xl,
          paddingBottom: insets.bottom + 120,
        },
      ]}
    >
      <Stack.Screen options={{ title: "Journey", headerShown: false }} />

      <JourneyHeroCard
        strongestPractice={strongestPractice}
        strongestStreak={strongestPractice ? streaks[strongestPractice] : 0}
        activePracticeCount={activePractices.length}
        remindersLabel={reminderStatusLabel}
        onOpenStreaks={() => router.push("/journey/streaks")}
      />

      <JourneyStreakGatewayPanel
        activePractices={activePractices}
        streaks={streaks}
        onOpenStreaks={() => router.push("/journey/streaks")}
      />

      <JourneyRoutineSummaryPanel
        activePractices={activePractices}
        remindersLabel={reminderStatusLabel}
        onEditRoutine={() => router.push("/journey/routine")}
      />

      <JourneySharePanel
        shareCardSource={SHARE_CARD_SOURCE}
        headline={shareHeadline}
        body={shareBody}
        isDark={isDark}
        onShare={() => void handleShare()}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  loadingState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
  },
  loadingCopy: {
    fontFamily: fontFamily.appRegular,
    fontSize: 16,
  },
});
