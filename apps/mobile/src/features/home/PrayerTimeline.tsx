/**
 * Prayer Timeline Component
 *
 * Collapsed pill that shows next prayer countdown
 * Opens bottom sheet with full timeline on tap
 */

import { useCallback, useState } from "react";
import { StyleSheet, Text, View, Pressable } from "react-native";

import { usePrayerTimes } from "@/src/lib/prayer/use-prayer-times";
import { useLocation } from "@/src/lib/location/location-provider";
import { PrayerTimesBottomSheet } from "@/src/components/ui/PrayerTimesBottomSheet";

import { fontFamily, useTheme, spacing, radii } from "@/src/theme";

export function PrayerTimeline() {
  const { location } = useLocation();
  const { currentPrayer, nextPrayer, countdown, isLoading, error } = usePrayerTimes(
    location?.coords.latitude,
    location?.coords.longitude
  );
  const [showBottomSheet, setShowBottomSheet] = useState(false);
  const { colors, theme } = useTheme();
  const sheetInstanceKey = `${theme ?? "light"}-${showBottomSheet ? "visible" : "hidden"}`;

  const handlePress = useCallback(() => {
    setShowBottomSheet(true);
  }, []);

  const handleClose = useCallback(() => {
    setShowBottomSheet(false);
  }, []);

  const displayText = isLoading
    ? "Loading..."
    : error
    ? "Prayer times unavailable"
    : nextPrayer
    ? `${nextPrayer} in ${countdown}`
    : "Tap to view times";

  return (
    <View style={styles.container} key={colors.surface.background}>
      <Pressable
        style={[styles.pill, { backgroundColor: "transparent", borderColor: colors.surface.borderInteractive }]}
        onPress={handlePress}
        accessibilityRole="button"
        accessibilityLabel={`Next prayer: ${displayText}`}
      >
        <View style={styles.pillContent}>
          <Text style={[styles.pillLabel, { color: colors.text.tertiary }]}>
            {currentPrayer ? `Current: ${currentPrayer}` : "Prayer Times"}
          </Text>
          <View style={styles.pillRight}>
            <Text style={[styles.pillTime, { color: colors.brand.metallicGold }]}>{displayText}</Text>
            <Text style={[styles.pillChevron, { color: colors.text.tertiary }]}>›</Text>
          </View>
        </View>
      </Pressable>

      <PrayerTimesBottomSheet
        key={sheetInstanceKey}
        visible={showBottomSheet}
        onClose={handleClose}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: spacing.xl,
    paddingHorizontal: spacing.xl,
  },
  pill: {
    borderRadius: radii.lg,
    padding: spacing.lg,
    borderWidth: 1,
  },
  pillContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  pillLabel: {
    fontFamily: fontFamily.appRegular,
    fontSize: 14,
  },
  pillRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  pillTime: {
    fontFamily: fontFamily.appSemiBold,
    fontSize: 18,
  },
  pillChevron: {
    fontFamily: fontFamily.appRegular,
    fontSize: 20,
  },
});
