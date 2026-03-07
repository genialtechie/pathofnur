import { ScrollView, StyleSheet, Text } from "react-native";
import { Stack } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { fontFamily, spacing, useTheme } from "@/src/theme";

import { JourneyPanel } from "./journey-primitives";

export function JourneyRoutineScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={[
        styles.container,
        {
          backgroundColor: colors.surface.background,
          paddingTop: spacing.lg,
          paddingBottom: insets.bottom + 80,
        },
      ]}
    >
      <Stack.Screen
        options={{
          title: "Settings Soon",
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

      <JourneyPanel
        title="Settings are on the way"
        subtitle="Your streaks are ready now. Deeper setup will move into Settings in a later pass."
      >
        <Text style={[styles.body, { color: colors.text.secondary }]} selectable>
          For now, use Journey and My Streaks to mark what you completed and keep your progress close.
        </Text>
      </JourneyPanel>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  body: {
    fontFamily: fontFamily.appRegular,
    fontSize: 15,
    lineHeight: 22,
  },
});
