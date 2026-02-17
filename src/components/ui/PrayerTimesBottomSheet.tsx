import { useCallback, useMemo } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  Modal,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { usePrayerTimes } from "@/src/lib/prayer/use-prayer-times";
import { useLocation } from "@/src/lib/location/location-provider";
import { fontFamily, radii, spacing, useTheme } from "@/src/theme";

const PRAYER_ORDER = [
  { name: "Fajr", arabic: "الفجر" },
  { name: "Sunrise", arabic: "الشروق" },
  { name: "Dhuhr", arabic: "الظهر" },
  { name: "Asr", arabic: "العصر" },
  { name: "Maghrib", arabic: "المغرب" },
  { name: "Isha", arabic: "العشاء" },
];

function formatTime(timeStr: string): string {
  const clean = timeStr.replace(/\s*\(.*\)$/, "");
  const [hours, minutes] = clean.split(":").map(Number);
  const period = hours >= 12 ? "PM" : "AM";
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutes.toString().padStart(2, "0")} ${period}`;
}

interface PrayerTimesBottomSheetProps {
  visible: boolean;
  onClose: () => void;
}

export function PrayerTimesBottomSheet({
  visible,
  onClose,
}: PrayerTimesBottomSheetProps) {
  const { location } = useLocation();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  
  // Use default date (today) which is now stable inside the hook
  const { times, currentPrayer, nextPrayer, countdown, isLoading, error } =
    usePrayerTimes(
      location?.coords.latitude,
      location?.coords.longitude
    );

  const prayerTimesList = useMemo(() => {
    if (!times) return [];

    return PRAYER_ORDER.map((prayer) => ({
      ...prayer,
      time: times[prayer.name as keyof typeof times] || "",
      isCurrent: currentPrayer === prayer.name,
      isNext: nextPrayer === prayer.name,
    }));
  }, [times, currentPrayer, nextPrayer]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
      key={colors.surface.background} // Force re-render on theme change
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <KeyboardAvoidingView
              behavior={Platform.OS === "ios" ? "padding" : undefined}
              style={styles.sheetContainer}
            >
                <View style={[styles.sheet, { backgroundColor: colors.surface.background, paddingBottom: insets.bottom }]}>
                {/* Handle bar */}
                <View style={[styles.handleBar, { backgroundColor: colors.surface.borderInteractive }]} />

                {/* Header */}
                <View style={[styles.header, { borderBottomColor: colors.surface.borderElevated }]}>
                  <Text style={[styles.title, { color: colors.text.primary }]}>Prayer Times</Text>
                  <Text style={[styles.subtitle, { color: colors.text.secondary }]}>
                    {location?.city || "Loading location..."}
                  </Text>
                </View>



                {/* Content */}
                <ScrollView
                  style={styles.content}
                  showsVerticalScrollIndicator={false}
                >
                  {error ? (
                    <View style={styles.errorContainer}>
                      <Text style={[styles.errorText, { color: colors.text.error }]}>
                        Unable to load prayer times
                      </Text>
                      <Text style={[styles.errorDetail, { color: colors.text.error }]}>{error}</Text>
                    </View>
                  ) : isLoading || !times ? (
                    <View style={styles.loadingContainer}>
                      <Text style={[styles.loadingText, { color: colors.text.tertiary }]}>Loading prayer times...</Text>
                    </View>
                  ) : (
                    <>
                      {/* Current/Next Prayer Highlight */}
                      {nextPrayer && (
                        <View style={[styles.highlightCard, { backgroundColor: colors.interactive.selectedBackground, borderLeftColor: colors.brand.metallicGold }]}>
                          <Text style={[styles.highlightLabel, { color: colors.text.tertiary }]}>Next Prayer</Text>
                          <Text style={[styles.highlightName, { color: colors.brand.metallicGold }]}>
                            {nextPrayer} in {countdown}
                          </Text>
                        </View>
                      )}

                      {/* Prayer List */}
                      <View style={styles.prayerList}>
                        {prayerTimesList.map((prayer, index) => (
                          <View
                            key={prayer.name}
                            style={[
                              styles.prayerRow,
                              prayer.isCurrent && { backgroundColor: colors.interactive.selectedBackground },
                              prayer.isNext && { 
                                backgroundColor: "transparent",
                                borderWidth: 1,
                                borderColor: colors.brand.metallicGold,
                              },
                            ]}
                          >
                            <View style={styles.prayerInfo}>
                              <Text
                                style={[
                                  styles.prayerName,
                                  { color: colors.text.secondary },
                                  prayer.isCurrent && { color: colors.text.primary },
                                  prayer.isNext && { color: colors.brand.metallicGold },
                                ]}
                              >
                                {prayer.name}
                              </Text>
                              <Text style={[styles.arabicName, { color: colors.text.tertiary }]}>{prayer.arabic}</Text>
                            </View>
                            <Text
                              style={[
                                styles.prayerTime,
                                { color: colors.text.tertiary },
                                prayer.isCurrent && { color: colors.text.primary },
                                prayer.isNext && { color: colors.brand.metallicGold },
                              ]}
                            >
                              {formatTime(prayer.time)}
                            </Text>
                          </View>
                        ))}
                      </View>
                    </>
                  )}

                  <View style={styles.bottomSpacer} />
                </ScrollView>
              </View>
            </KeyboardAvoidingView>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  sheetContainer: {
    maxHeight: "80%",
  },
  sheet: {
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    paddingTop: spacing.sm,
    maxHeight: "100%",
  },
  handleBar: {
    width: 40,
    height: 4,
    borderRadius: radii.pill,
    alignSelf: "center",
    marginBottom: spacing.md,
  },
  header: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    marginBottom: spacing.md,
  },
  title: {
    fontFamily: fontFamily.appSemiBold,
    fontSize: 20,
    marginBottom: spacing.xxs,
  },
  subtitle: {
    fontFamily: fontFamily.appRegular,
    fontSize: 14,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    padding: spacing.xl,
    alignItems: "center",
  },
  loadingText: {
    fontFamily: fontFamily.appRegular,
    fontSize: 16,
  },
  errorContainer: {
    padding: spacing.xl,
    alignItems: "center",
  },
  errorText: {
    fontFamily: fontFamily.appSemiBold,
    fontSize: 16,
    marginBottom: spacing.xs,
  },
  errorDetail: {
    fontFamily: fontFamily.appRegular,
    fontSize: 14,
    textAlign: "center",
  },
  highlightCard: {
    margin: spacing.xl,
    padding: spacing.lg,
    borderRadius: radii.lg,
    borderLeftWidth: 4,
  },
  highlightLabel: {
    fontFamily: fontFamily.appRegular,
    fontSize: 14,
    marginBottom: spacing.xs,
  },
  highlightName: {
    fontFamily: fontFamily.appBold,
    fontSize: 24,
  },
  prayerList: {
    paddingHorizontal: spacing.xl,
  },
  prayerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
    marginBottom: spacing.xs,
  },
  prayerInfo: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: spacing.sm,
  },
  prayerName: {
    fontFamily: fontFamily.appSemiBold,
    fontSize: 16,
  },
  arabicName: {
    fontFamily: fontFamily.appRegular,
    fontSize: 14,
  },
  prayerTime: {
    fontFamily: fontFamily.appSemiBold,
    fontSize: 16,
  },
  bottomSpacer: {
    height: spacing.xl,
  },
});
