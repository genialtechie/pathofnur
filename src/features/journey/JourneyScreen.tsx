import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Stack } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { fontFamily, spacing, useTheme } from "@/src/theme";

import {
  JourneyReminderPanel,
  JourneyRoutinePanel,
  JourneyTodayPanel,
} from "./journey-daily-sections";
import { JourneyHistoryPanel, JourneySharePanel } from "./journey-insights";
import { JourneyOverview } from "./journey-overview";
import { useJourneyController } from "./useJourneyController";

export default function JourneyScreen() {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const controller = useJourneyController();

  if (controller.isLoading) {
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

      <JourneyOverview {...controller.overviewProps} />

      <JourneyTodayPanel {...controller.todayPanelProps} />

      <JourneyRoutinePanel {...controller.routinePanelProps} />

      <JourneyReminderPanel {...controller.reminderPanelProps} />

      <JourneyHistoryPanel {...controller.historyPanelProps} />

      <JourneySharePanel
        {...controller.sharePanelProps}
        isDark={isDark}
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
