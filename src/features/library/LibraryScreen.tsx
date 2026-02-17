import { useCallback, useRef, useState } from "react";
import {
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "expo-router";
import {
  Gesture,
  GestureDetector,
  ScrollView,
} from "react-native-gesture-handler";
import Ionicons from "@expo/vector-icons/Ionicons";

import { useDailyRecommendation } from "@/src/lib/quran";
import { useLayeredAudio, type AmbientType } from "@/src/lib/audio";
import { DayTimeline } from "./DayTimeline";
import { useTheme, fontFamily, radii, spacing } from "@/src/theme";
import { trackScreenView, track, EventName } from "@/src/lib/analytics/track";

const AMBIENT_OPTIONS: { type: AmbientType; label: string; icon: string }[] = [
  { type: "silence", label: "Off", icon: "volume-mute-outline" },
  { type: "rain", label: "Rain", icon: "rain-outline" },
  { type: "medina_wind", label: "Wind", icon: "leaf-outline" },
];

export function LibraryScreen() {
  const [showTranslation, setShowTranslation] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isTimelineVisible, setIsTimelineVisible] = useState(false);
  
  const { surah, translation, audioUrl, isLoading, error, surahNumber } = 
    useDailyRecommendation(selectedDate);
  const { state, toggleQuran, setAmbient } = useLayeredAudio();
  const { colors } = useTheme();

  const scrollViewRef = useRef(null);



  const openGesture = Gesture.Pan()
    // Activate only on left swipe (translationX < -20)
    // Positive max value (1000) prevents activation on right swipe
    .activeOffsetX([-20, 1000])
    .failOffsetY([-20, 20])
    .simultaneousWithExternalGesture(scrollViewRef)
    .onStart(() => {
      setIsTimelineVisible(true);
    });

  useFocusEffect(
    useCallback(() => {
      void trackScreenView("library");
    }, [])
  );

  const handlePlay = useCallback(async () => {
    if (!audioUrl) return;
    
    try {
      await toggleQuran(`quran-${surahNumber}`, audioUrl);
    } catch (err) {
      console.error("Playback error:", err);
    }
    
    void track(EventName.LIBRARY_TRACK_PLAYED, {
      track_id: `quran-${surahNumber}`,
      track_name: surah?.englishName || "Quran",
      collection_name: "daily_recommendation",
      has_ambient: state.ambient.activeType !== "silence",
      ambient_type: state.ambient.activeType !== "silence" ? state.ambient.activeType : undefined,
    }, "library");
  }, [audioUrl, surahNumber, surah, toggleQuran, state.ambient.activeType]);

  const handleAmbientToggle = useCallback(async (type: AmbientType) => {
    await setAmbient(type);
    void track(EventName.LIBRARY_AMBIENT_TOGGLED, {
      ambient_type: type,
      is_enabled: type !== "silence",
    }, "library");
  }, [setAmbient]);

  const handleDateSelect = useCallback((date: Date) => {
    setSelectedDate(date);
  }, []);

  const isPlaying = state.quran.isPlaying && state.quran.activeTrackId === `quran-${surahNumber}`;

  const formattedDate = selectedDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  const isToday = selectedDate.toDateString() === new Date().toDateString();
  const title = isToday ? "Today's Recommendation" : formattedDate;



  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.surface.background }]}>
      <StatusBar barStyle={colors.surface.background === "#ffffff" ? "dark-content" : "light-content"} />

      {/* Main Content with swipe-to-open */}
      {/* Main Content with swipe-to-open */}
      <View style={styles.content}>
        {/* @ts-ignore - touchAction is web-only prop */}
        <GestureDetector gesture={openGesture} touchAction="pan-y">
          <ScrollView
            ref={scrollViewRef}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerTop}>
                <View style={styles.titleRow}>
                  <View>
                    <Text style={[styles.kicker, { color: colors.text.tertiary }]}>Library</Text>
                    <Text style={[styles.title, { color: colors.text.primary }]}>{title}</Text>
                  </View>
                </View>
              </View>
              
              {surah && (
                <View style={styles.surahInfo}>
                  <View style={styles.surahTitleRow}>
                    <Text style={[styles.surahName, { color: colors.brand.metallicGold }]}>{surah.englishName}</Text>
                    <Pressable
                      style={[styles.playButtonMini, isPlaying && styles.playButtonMiniActive]}
                      onPress={handlePlay}
                      disabled={!audioUrl}
                    >
                      <Ionicons
                        name={isPlaying ? "pause" : "play"}
                        size={16}
                        color={colors.text.primary}
                      />
                    </Pressable>
                  </View>
                  <Text style={[styles.surahMeta, { color: colors.text.tertiary }]}>
                    Surah {surah.number} · {surah.revelationType}
                  </Text>
                </View>
              )}

              {/* Controls */}
              <View style={styles.controlsRow}>
                <Pressable
                  style={[styles.togglePill, { borderColor: colors.surface.borderInteractive, backgroundColor: colors.surface.card }, showTranslation && { borderColor: colors.brand.metallicGold, backgroundColor: colors.interactive.selectedBackground }]}
                  onPress={() => setShowTranslation(!showTranslation)}
                >
                  <Ionicons
                    name="language"
                    size={14}
                    color={showTranslation ? colors.brand.metallicGold : colors.text.secondary}
                  />
                  <Text style={[styles.toggleLabel, { color: showTranslation ? colors.brand.metallicGold : colors.text.secondary }]}>
                    Translate
                  </Text>
                </Pressable>

                <View style={styles.ambientChips}>
                  {AMBIENT_OPTIONS.map((option) => {
                    const isActive = state.ambient.activeType === option.type;
                    return (
                      <Pressable
                        key={option.type}
                        style={[styles.ambientChip, { borderColor: colors.surface.borderInteractive }, isActive && { borderColor: colors.brand.metallicGold, backgroundColor: colors.interactive.selectedBackground }]}
                        onPress={() => handleAmbientToggle(option.type)}
                      >
                        <Ionicons
                          name={option.icon as any}
                          size={12}
                          color={isActive ? colors.brand.metallicGold : colors.text.tertiary}
                        />
                        <Text style={[styles.ambientChipText, { color: isActive ? colors.brand.metallicGold : colors.text.tertiary }]}>
                          {option.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            </View>

            {/* Content */}
            {error ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>Unable to load surah</Text>
                <Text style={styles.errorDetail}>{error}</Text>
              </View>
            ) : isLoading ? (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Loading surah...</Text>
              </View>
            ) : (
              <View style={styles.versesContainer}>
                {surah?.verses.map((verse) => {
                  const englishVerse = translation?.verses.find((v) => v.number === verse.number);
                  return (
                    <View key={verse.number} style={styles.verseBlock}>
                      <View style={styles.verseRow}>
                        <View style={styles.verseNumber}>
                          <Text style={[styles.verseNumberText, { color: colors.text.tertiary }]}>{verse.number}</Text>
                        </View>
                        <View style={styles.arabicContainer}>
                          <Text style={[styles.arabicText, { color: colors.text.primary }]}>{verse.text}</Text>
                        </View>
                      </View>
                      {showTranslation && englishVerse && (
                        <View style={styles.translationContainer}>
                          <Text style={[styles.translationText, { color: colors.text.secondary }]}>{englishVerse.text}</Text>
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            )}

            <View style={styles.bottomSpacer} />
          </ScrollView>
        </GestureDetector>
      </View>

      {/* Day Timeline */}
      <DayTimeline
        selectedDate={selectedDate}
        onSelectDate={handleDateSelect}
        isVisible={isTimelineVisible}
        onClose={() => setIsTimelineVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  header: {
    marginBottom: spacing.lg,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  titleRow: {
    flex: 1,
  },
  surahTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  kicker: {
    fontFamily: fontFamily.appSemiBold,
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: spacing.xxs,
  },
  title: {
    fontFamily: fontFamily.appBold,
    fontSize: 24,
    lineHeight: 28,
  },
  playButtonMini: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  playButtonMiniActive: {
    // handled inline
  },
  playButtonMiniText: {
    fontSize: 18,
  },
  surahInfo: {
    marginTop: spacing.sm,
  },
  surahName: {
    fontFamily: fontFamily.appSemiBold,
    fontSize: 18,
  },
  surahMeta: {
    fontFamily: fontFamily.appRegular,
    fontSize: 13,
    marginTop: 2,
  },
  controlsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginTop: spacing.md,
    flexWrap: "wrap",
  },
  togglePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs + 1,
    borderRadius: radii.pill,
    borderWidth: 1,
  },
  togglePillActive: {
    // handled inline
  },
  toggleLabel: {
    fontFamily: fontFamily.appRegular,
    fontSize: 12,
  },
  toggleLabelActive: {
    // handled inline
  },
  ambientChips: {
    flexDirection: "row",
    gap: spacing.xs,
  },
  ambientChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.pill,
    borderWidth: 1,
  },
  ambientChipActive: {
    // handled inline
  },
  ambientChipText: {
    fontFamily: fontFamily.appRegular,
    fontSize: 11,
  },
  ambientChipTextActive: {
    // inline
  },
  versesContainer: {
    gap: spacing.md,
  },
  verseBlock: {
    gap: spacing.xs,
  },
  verseRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
  },
  verseNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  verseNumberText: {
    fontFamily: fontFamily.appRegular,
    fontSize: 10,
  },
  arabicContainer: {
    flex: 1,
  },
  arabicText: {
    fontFamily: fontFamily.arabicRegular,
    fontSize: 22,
    lineHeight: 34,
    textAlign: "right",
  },
  translationContainer: {
    marginLeft: 24 + spacing.sm,
    paddingTop: spacing.xs,
  },
  translationText: {
    fontFamily: fontFamily.scriptureRegular,
    fontSize: 14,
    lineHeight: 22,
  },
  loadingContainer: {
    paddingVertical: spacing["5xl"],
    alignItems: "center",
  },
  loadingText: {
    fontFamily: fontFamily.appRegular,
    fontSize: 14,
  },
  errorContainer: {
    paddingVertical: spacing["5xl"],
    alignItems: "center",
  },
  errorText: {
    color: "#ef9a9a",
    fontFamily: fontFamily.appSemiBold,
    fontSize: 14,
  },
  errorDetail: {
    fontFamily: fontFamily.appRegular,
    fontSize: 12,
    marginTop: spacing.xs,
  },
  bottomSpacer: {
    height: spacing.xl,
  },
});
