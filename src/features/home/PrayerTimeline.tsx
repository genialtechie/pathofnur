/**
 * Prayer Timeline Component
 *
 * Displays prayer times throughout the day (placeholder implementation)
 */

import { StyleSheet, Text, View } from "react-native";
import { colors, spacing, radii } from "@/src/theme/tokens";
import { fontFamily } from "@/src/theme";

// Prayer names in order
const PRAYERS = [
  { name: "Fajr", arabic: "الفجر", time: "5:30 AM" },
  { name: "Sunrise", arabic: "الشروق", time: "6:45 AM" },
  { name: "Dhuhr", arabic: "الظهر", time: "12:30 PM" },
  { name: "Asr", arabic: "العصر", time: "3:45 PM" },
  { name: "Maghrib", arabic: "المغرب", time: "6:15 PM" },
  { name: "Isha", arabic: "العشاء", time: "7:45 PM" },
];

export function PrayerTimeline() {
  // For MVP, we'll highlight Dhuhr as the current prayer
  const currentPrayerIndex = 2;

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Prayer Times</Text>

      <View style={styles.timeline}>
        {PRAYERS.map((prayer, index) => {
          const isCurrent = index === currentPrayerIndex;
          const isPast = index < currentPrayerIndex;

          return (
            <View
              key={prayer.name}
              style={[
                styles.prayerItem,
                isCurrent && styles.currentPrayer,
              ]}
            >
              {/* Time indicator line */}
              <View style={styles.timeIndicator}>
                <View
                  style={[
                    styles.dot,
                    isCurrent && styles.currentDot,
                    isPast && styles.pastDot,
                  ]}
                />
                {index < PRAYERS.length - 1 && (
                  <View
                    style={[
                      styles.line,
                      isPast && styles.pastLine,
                    ]}
                  />
                )}
              </View>

              {/* Prayer info */}
              <View style={styles.prayerInfo}>
                <View style={styles.nameRow}>
                  <Text
                    style={[
                      styles.prayerName,
                      isCurrent && styles.currentText,
                    ]}
                  >
                    {prayer.name}
                  </Text>
                  <Text style={styles.arabicName}>{prayer.arabic}</Text>
                </View>
                <Text
                  style={[
                    styles.prayerTime,
                    isCurrent && styles.currentTime,
                  ]}
                >
                  {prayer.time}
                </Text>
              </View>
            </View>
          );
        })}
      </View>

      {/* Next prayer indicator */}
      <View style={styles.nextPrayerContainer}>
        <Text style={styles.nextPrayerLabel}>Next Prayer</Text>
        <Text style={styles.nextPrayerName}>Asr in 3h 15m</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: spacing.xl,
    paddingHorizontal: spacing.xl,
  },
  sectionTitle: {
    fontFamily: fontFamily.appSemiBold,
    fontSize: 20,
    color: colors.text.primary,
    marginBottom: spacing.lg,
  },
  timeline: {
    backgroundColor: colors.surface.card,
    borderRadius: radii.lg,
    padding: spacing.lg,
  },
  prayerItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: spacing.sm,
  },
  currentPrayer: {
    backgroundColor: colors.interactive.selectedBackground,
    marginHorizontal: -spacing.lg,
    paddingHorizontal: spacing.lg,
    borderLeftWidth: 3,
    borderLeftColor: colors.interactive.active,
  },
  timeIndicator: {
    alignItems: "center",
    marginRight: spacing.md,
    width: 12,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.surface.borderElevated,
    borderWidth: 2,
    borderColor: colors.surface.borderElevated,
  },
  currentDot: {
    backgroundColor: colors.interactive.active,
    borderColor: colors.interactive.active,
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  pastDot: {
    backgroundColor: colors.interactive.active,
    borderColor: colors.interactive.active,
  },
  line: {
    width: 2,
    flex: 1,
    backgroundColor: colors.surface.borderElevated,
    marginTop: 4,
    minHeight: 24,
  },
  pastLine: {
    backgroundColor: colors.interactive.active,
  },
  prayerInfo: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  prayerName: {
    fontFamily: fontFamily.appMedium,
    fontSize: 16,
    color: colors.text.secondary,
  },
  currentText: {
    fontFamily: fontFamily.appSemiBold,
    color: colors.text.primary,
  },
  arabicName: {
    fontFamily: fontFamily.arabicRegular,
    fontSize: 14,
    color: colors.text.tertiary,
  },
  prayerTime: {
    fontFamily: fontFamily.appRegular,
    fontSize: 14,
    color: colors.text.tertiary,
  },
  currentTime: {
    fontFamily: fontFamily.appMedium,
    color: colors.interactive.active,
  },
  nextPrayerContainer: {
    marginTop: spacing.lg,
    padding: spacing.lg,
    backgroundColor: colors.surface.card,
    borderRadius: radii.lg,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  nextPrayerLabel: {
    fontFamily: fontFamily.appMedium,
    fontSize: 14,
    color: colors.text.tertiary,
  },
  nextPrayerName: {
    fontFamily: fontFamily.appSemiBold,
    fontSize: 16,
    color: colors.interactive.active,
  },
});
