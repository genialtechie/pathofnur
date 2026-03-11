import { useCallback, useMemo } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Stack, useFocusEffect, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { fontFamily, spacing, useTheme } from "@/src/theme";

import {
  JourneyHeroCard,
  JourneySharePanel,
  JourneyStreakGatewayPanel,
} from "./journey-hub-sections";
import { trackJourneyScreenView } from "./journey-analytics";
import { getJourneyPracticeLabel } from "./journey-types";
import { useJourneyMilestones } from "./useJourneyMilestones";
import { useJourneyProgress } from "./useJourneyProgress";
import { useJourneyShareAction } from "./useJourneyShareAction";

const SHARE_CARD_SOURCE = require("@/public/images/_source/journey-share-daily-completion-v02-card.png");

export default function JourneyScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors } = useTheme();
  const {
    completedTodayCount,
    daysReturned,
    isLoading,
    markShareCreated,
    streaks,
    strongestPractice,
    todaySalahCompletedCount,
  } = useJourneyProgress();

  useFocusEffect(
    useCallback(() => {
      void trackJourneyScreenView("journey");
    }, [])
  );

  useJourneyMilestones(streaks);

  const shareMessage = useMemo(() => {
    const summary = [
      `Salah ${streaks.salah}d`,
      `Quran ${streaks.quran}d`,
      `Fasting ${streaks.fasting}d`,
      `Dhikr ${streaks.dhikr}d`,
    ].join(" • ");

    return `My Path of Nur streaks\n${summary}\n\nhttps://pathofnur.com`;
  }, [streaks]);

  const handleShare = useJourneyShareAction({
    shareMessage,
    markShareCreated,
  });

  const shareHeadline = strongestPractice
    ? `${getJourneyPracticeLabel(strongestPractice)} • ${streaks[strongestPractice]} day streak`
    : "My Path of Nur streaks";
  const shareBody = `Salah ${streaks.salah}d • Quran ${streaks.quran}d • Fasting ${streaks.fasting}d • Dhikr ${streaks.dhikr}d`;

  if (isLoading) {
    return (
      <View style={[styles.loadingState, { backgroundColor: colors.surface.background }]}>
        <Text style={[styles.loadingCopy, { color: colors.text.secondary }]} selectable>
          Loading your journey...
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

      <View style={styles.header}>
        <Text style={[styles.pageTitle, { color: colors.text.primary }]} selectable>
          Journey
        </Text>
      </View>

      <JourneyHeroCard
        strongestPractice={strongestPractice}
        strongestStreak={strongestPractice ? streaks[strongestPractice] : 0}
        daysReturned={daysReturned}
        todaySalahCompletedCount={todaySalahCompletedCount}
        completedTodayCount={completedTodayCount}
        onOpenStreaks={() => router.push("/journey/streaks")}
      />

      <JourneyStreakGatewayPanel
        completedTodayCount={completedTodayCount}
        onOpenStreaks={() => router.push("/journey/streaks")}
      />

      <JourneySharePanel
        shareCardSource={SHARE_CARD_SOURCE}
        headline={shareHeadline}
        body={shareBody}
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
  header: {
    gap: spacing.xs,
  },
  pageTitle: {
    fontFamily: fontFamily.appBold,
    fontSize: 34,
    lineHeight: 40,
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
