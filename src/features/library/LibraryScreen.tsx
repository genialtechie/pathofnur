import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  LayoutChangeEvent,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from "react-native";
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
import {
  createLibrarySessionKey,
  useLibrarySessionProgress,
} from "./useLibrarySessionProgress";
import { useTheme, fontFamily, radii, spacing } from "@/src/theme";
import { trackScreenView, track, EventName } from "@/src/lib/analytics/track";

const AMBIENT_OPTIONS: { type: AmbientType; label: string; icon: string }[] = [
  { type: "silence", label: "Ambient Off", icon: "volume-mute-outline" },
  { type: "rain", label: "Rain", icon: "rain-outline" },
  { type: "medina_wind", label: "Wind", icon: "leaf-outline" },
];

const MIN_AUDIO_RESUME_MS = 5_000;
const MIN_SCROLL_RESUME = 0.03;

type VerseLayout = {
  y: number;
  height: number;
};

function formatTime(ms: number) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function getTopVerseNumber(
  verseLayouts: Record<number, VerseLayout>,
  anchorY: number,
) {
  let resolvedVerseNumber: number | null = null;
  let resolvedTop = -Infinity;

  for (const [key, layout] of Object.entries(verseLayouts)) {
    if (layout.y <= anchorY && layout.y >= resolvedTop) {
      resolvedVerseNumber = Number(key);
      resolvedTop = layout.y;
    }
  }

  return resolvedVerseNumber;
}

export function LibraryScreen() {
  const [showTranslation, setShowTranslation] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isTimelineVisible, setIsTimelineVisible] = useState(false);
  const [readingProgress, setReadingProgress] = useState(0);
  const [verseLayoutVersion, setVerseLayoutVersion] = useState(0);
  const [scrubberWidth, setScrubberWidth] = useState(0);

  const { surah, translation, audioUrl, isLoading, error, surahNumber } =
    useDailyRecommendation(selectedDate);
  const {
    state,
    toggleQuran,
    seekQuran,
    setAmbient,
  } = useLayeredAudio();
  const { colors, isDark } = useTheme();

  const scrollViewRef = useRef<ScrollView | null>(null);
  const verseLayoutsRef = useRef<Record<number, VerseLayout>>({});
  const restoredSessionKeyRef = useRef<string | null>(null);
  const lastSavedProgressRef = useRef(0);
  const lastSavedVerseRef = useRef<number | null>(null);
  const lastSavedAudioPositionRef = useRef(0);

  const sessionKey = useMemo(
    () => createLibrarySessionKey(selectedDate, surahNumber),
    [selectedDate, surahNumber],
  );
  const sessionProgress = useLibrarySessionProgress(sessionKey);

  const trackId = `quran-${surahNumber}`;
  const isCurrentTrack = state.quran.activeTrackId === trackId;
  const isPlaying = isCurrentTrack && state.quran.isPlaying;
  const hasAudioResume = sessionProgress.progress.audioPositionMs >= MIN_AUDIO_RESUME_MS;
  const hasReadingResume = sessionProgress.progress.scrollProgress >= MIN_SCROLL_RESUME;
  const activeAmbient =
    AMBIENT_OPTIONS.find((option) => option.type === state.ambient.activeType) ??
    AMBIENT_OPTIONS[0];

  const formattedDate = selectedDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
  const isToday = selectedDate.toDateString() === new Date().toDateString();
  const title = isToday ? "Today's Recommendation" : formattedDate;
  const resumeLabel = hasReadingResume
    ? `Resume verse ${sessionProgress.progress.topVerseNumber ?? 1}`
    : hasAudioResume
      ? `Resume ${formatTime(sessionProgress.progress.audioPositionMs)}`
      : "Begin gently";

  const openGesture = Gesture.Pan()
    .activeOffsetX([-20, 1000])
    .failOffsetY([-20, 20])
    .simultaneousWithExternalGesture(scrollViewRef)
    .onStart(() => {
      setIsTimelineVisible(true);
    });

  useFocusEffect(
    useCallback(() => {
      void trackScreenView("library");
    }, []),
  );

  useEffect(() => {
    verseLayoutsRef.current = {};
    restoredSessionKeyRef.current = null;
    setVerseLayoutVersion(0);
  }, [sessionKey]);

  useEffect(() => {
    if (!sessionProgress.isLoaded) return;

    setReadingProgress(sessionProgress.progress.scrollProgress);
    lastSavedProgressRef.current = sessionProgress.progress.scrollProgress;
    lastSavedVerseRef.current = sessionProgress.progress.topVerseNumber;
    lastSavedAudioPositionRef.current = sessionProgress.progress.audioPositionMs;
  }, [
    sessionKey,
    sessionProgress.isLoaded,
    sessionProgress.progress.audioPositionMs,
    sessionProgress.progress.scrollProgress,
    sessionProgress.progress.topVerseNumber,
  ]);

  useEffect(() => {
    if (!surah || !sessionProgress.isLoaded) return;
    if (restoredSessionKeyRef.current === sessionKey) return;

    if (!hasReadingResume) {
      restoredSessionKeyRef.current = sessionKey;
      return;
    }

    const targetVerseNumber = sessionProgress.progress.topVerseNumber;
    if (!targetVerseNumber) return;

    const targetLayout = verseLayoutsRef.current[targetVerseNumber];
    if (!targetLayout || !scrollViewRef.current) return;

    scrollViewRef.current.scrollTo({
      y: Math.max(0, targetLayout.y - spacing.sm),
      animated: false,
    });
    setReadingProgress(sessionProgress.progress.scrollProgress);
    restoredSessionKeyRef.current = sessionKey;
  }, [
    hasReadingResume,
    sessionKey,
    sessionProgress.isLoaded,
    sessionProgress.progress.scrollProgress,
    sessionProgress.progress.topVerseNumber,
    surah,
    verseLayoutVersion,
  ]);

  useEffect(() => {
    if (!isCurrentTrack) return;

    const nextPositionMs = state.quran.positionMs;
    if (Math.abs(nextPositionMs - lastSavedAudioPositionRef.current) < 1_500) {
      return;
    }

    lastSavedAudioPositionRef.current = nextPositionMs;
    sessionProgress.queueSave({
      audioPositionMs: nextPositionMs,
    });
  }, [isCurrentTrack, sessionProgress, state.quran.positionMs]);

  const handleDateSelect = useCallback((date: Date) => {
    setSelectedDate(date);
  }, []);

  const handlePlay = useCallback(async () => {
    if (!audioUrl) return;

    try {
      const result = await toggleQuran(trackId, audioUrl);
      if (
        result === "playing" &&
        !isCurrentTrack &&
        sessionProgress.progress.audioPositionMs >= MIN_AUDIO_RESUME_MS
      ) {
        await seekQuran(sessionProgress.progress.audioPositionMs);
      }
    } catch (playbackError) {
      console.error("Playback error:", playbackError);
    }

    void track(
      EventName.LIBRARY_TRACK_PLAYED,
      {
        track_id: trackId,
        track_name: surah?.englishName || "Quran",
        collection_name: "daily_recommendation",
        has_ambient: state.ambient.activeType !== "silence",
        ambient_type:
          state.ambient.activeType !== "silence"
            ? state.ambient.activeType
            : undefined,
      },
      "library",
    );
  }, [
    audioUrl,
    isCurrentTrack,
    seekQuran,
    sessionProgress.progress.audioPositionMs,
    state.ambient.activeType,
    surah,
    toggleQuran,
    trackId,
  ]);

  const handleAmbientCycle = useCallback(async () => {
    const activeIndex = AMBIENT_OPTIONS.findIndex(
      (option) => option.type === state.ambient.activeType,
    );
    const nextAmbient =
      AMBIENT_OPTIONS[(activeIndex + 1) % AMBIENT_OPTIONS.length] ??
      AMBIENT_OPTIONS[0];

    await setAmbient(nextAmbient.type);
    void track(
      EventName.LIBRARY_AMBIENT_TOGGLED,
      {
        ambient_type: nextAmbient.type,
        is_enabled: nextAmbient.type !== "silence",
      },
      "library",
    );
  }, [setAmbient, state.ambient.activeType]);

  const handleSeekPress = useCallback(
    async (locationX: number) => {
      if (!scrubberWidth || !state.quran.durationMs) return;

      const ratio = Math.max(0, Math.min(1, locationX / scrubberWidth));
      await seekQuran(state.quran.durationMs * ratio);
    },
    [scrubberWidth, seekQuran, state.quran.durationMs],
  );

  const handleVerseLayout = useCallback(
    (verseNumber: number, event: LayoutChangeEvent) => {
      const { y, height } = event.nativeEvent.layout;
      const existingLayout = verseLayoutsRef.current[verseNumber];

      if (
        existingLayout &&
        existingLayout.y === y &&
        existingLayout.height === height
      ) {
        return;
      }

      verseLayoutsRef.current[verseNumber] = { y, height };
      setVerseLayoutVersion((current) => current + 1);
    },
    [],
  );

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
      const totalScrollable = Math.max(
        1,
        contentSize.height - layoutMeasurement.height,
      );
      const nextProgress = Math.max(
        0,
        Math.min(1, contentOffset.y / totalScrollable),
      );

      setReadingProgress(nextProgress);

      const anchorVerseNumber = getTopVerseNumber(
        verseLayoutsRef.current,
        contentOffset.y + spacing.lg,
      );

      const progressChanged =
        Math.abs(nextProgress - lastSavedProgressRef.current) >= 0.03;
      const verseChanged = anchorVerseNumber !== lastSavedVerseRef.current;

      if (!progressChanged && !verseChanged) {
        return;
      }

      lastSavedProgressRef.current = nextProgress;
      lastSavedVerseRef.current = anchorVerseNumber;
      sessionProgress.queueSave({
        scrollProgress: nextProgress,
        topVerseNumber: anchorVerseNumber,
      });
    },
    [sessionProgress],
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.surface.background }]}
    >
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      <View style={styles.content}>
        <View style={styles.chrome}>
          <View style={styles.header}>
            <View style={styles.headerTop}>
              <View style={styles.titleBlock}>
                <Text style={[styles.kicker, { color: colors.text.tertiary }]}>
                  Library
                </Text>
                <Text
                  style={[styles.title, { color: colors.text.primary }]}
                  numberOfLines={1}
                >
                  {title}
                </Text>
              </View>

              <Pressable
                style={[
                  styles.timelineButton,
                  {
                    borderColor: colors.surface.borderInteractive,
                    backgroundColor: colors.surface.card,
                  },
                ]}
                onPress={() => setIsTimelineVisible(true)}
                accessibilityLabel="Open timeline"
              >
                <Ionicons
                  name="calendar-outline"
                  size={14}
                  color={colors.text.secondary}
                />
              </Pressable>
            </View>

            {surah ? (
              <View style={styles.surahMetaBlock}>
                <View style={styles.surahTitleRow}>
                  <Text
                    style={[styles.surahName, { color: colors.brand.metallicGold }]}
                    numberOfLines={1}
                  >
                    {surah.englishName}
                  </Text>

                  <Pressable
                    style={[
                      styles.translationToggle,
                      {
                        borderColor: showTranslation
                          ? colors.brand.metallicGold
                          : colors.surface.borderInteractive,
                        backgroundColor: showTranslation
                          ? colors.interactive.selectedBackground
                          : colors.surface.card,
                      },
                    ]}
                    onPress={() => setShowTranslation((current) => !current)}
                  >
                    <Ionicons
                      name="language"
                      size={13}
                      color={
                        showTranslation
                          ? colors.brand.metallicGold
                          : colors.text.secondary
                      }
                    />
                    <Text
                      style={[
                        styles.translationToggleText,
                        {
                          color: showTranslation
                            ? colors.brand.metallicGold
                            : colors.text.secondary,
                        },
                      ]}
                    >
                      Translate
                    </Text>
                  </Pressable>
                </View>
                <Text style={[styles.surahMeta, { color: colors.text.tertiary }]}>
                  Surah {surah.number} · {surah.revelationType}
                </Text>
              </View>
            ) : null}

          </View>

          <View
            style={[
              styles.sessionCard,
              {
                backgroundColor: colors.surface.card,
                borderColor: colors.surface.borderElevated,
              },
            ]}
          >
            <View style={styles.sessionTopRow}>
              <View style={styles.sessionTextBlock}>
                <Text style={[styles.sessionTitle, { color: colors.text.primary }]}>
                  {surah?.englishName ?? "Daily Quran"}
                </Text>
              </View>

              <Text
                style={[styles.sessionCaptionInline, { color: colors.text.tertiary }]}
                numberOfLines={1}
              >
                {resumeLabel}
              </Text>
            </View>

            <View style={styles.sessionControlsRow}>
              <Pressable
                style={[
                  styles.playButton,
                  {
                    backgroundColor: isPlaying
                      ? colors.brand.metallicGold
                      : colors.interactive.selectedBackground,
                  },
                ]}
                onPress={handlePlay}
                disabled={!audioUrl || isLoading}
              >
                <Ionicons
                  name={isPlaying ? "pause" : "play"}
                  size={18}
                  color={isPlaying ? colors.text.onAccent : colors.text.primary}
                />
              </Pressable>

              <View style={styles.scrubberColumn}>
                <Pressable
                  style={styles.scrubberHitArea}
                  onLayout={(event) => {
                    setScrubberWidth(event.nativeEvent.layout.width);
                  }}
                  onPress={(event) => {
                    void handleSeekPress(event.nativeEvent.locationX);
                  }}
                >
                  <View
                    style={[
                      styles.scrubberTrack,
                      { backgroundColor: colors.surface.borderInteractive },
                    ]}
                  >
                    <View
                      style={[
                        styles.scrubberFill,
                        {
                          width: `${Math.max(0, state.quran.progress * 100)}%`,
                          backgroundColor: colors.brand.metallicGold,
                        },
                      ]}
                    />
                  </View>
                </Pressable>

                <View style={styles.timeRow}>
                  <Text style={[styles.timeText, { color: colors.text.tertiary }]}>
                    {formatTime(state.quran.positionMs)}
                  </Text>
                  <Text style={[styles.timeText, { color: colors.text.tertiary }]}>
                    -{formatTime(Math.max(0, state.quran.durationMs - state.quran.positionMs))}
                  </Text>
                </View>
              </View>

              <Pressable
                style={[
                  styles.ambientButton,
                  {
                    borderColor: colors.surface.borderInteractive,
                    backgroundColor: colors.surface.background,
                  },
                ]}
                onPress={handleAmbientCycle}
              >
                <Ionicons
                  name={activeAmbient.icon as never}
                  size={12}
                  color={
                    activeAmbient.type === "silence"
                      ? colors.text.tertiary
                      : colors.brand.metallicGold
                  }
                />
              </Pressable>
            </View>
          </View>

          <View
            style={[
              styles.readingProgressTrack,
              { backgroundColor: colors.surface.borderInteractive },
            ]}
          >
            <View
              style={[
                styles.readingProgressFill,
                {
                  width: `${Math.max(0, readingProgress * 100)}%`,
                  backgroundColor: colors.brand.metallicGold,
                },
              ]}
            />
          </View>
        </View>

        <View style={styles.reader}>
          <GestureDetector gesture={openGesture} touchAction="pan-y">
            <ScrollView
              ref={scrollViewRef}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
              onScroll={handleScroll}
              scrollEventThrottle={48}
            >
              {error ? (
                <View style={styles.errorContainer}>
                  <Text style={[styles.errorText, { color: colors.text.error }]}>
                    Unable to load surah
                  </Text>
                  <Text
                    style={[styles.errorDetail, { color: colors.text.secondary }]}
                  >
                    {error}
                  </Text>
                </View>
              ) : isLoading ? (
                <View style={styles.loadingContainer}>
                  <Text
                    style={[styles.loadingText, { color: colors.text.tertiary }]}
                  >
                    Loading surah...
                  </Text>
                </View>
              ) : (
                <View style={styles.versesContainer}>
                  {surah?.verses.map((verse) => {
                    const englishVerse = translation?.verses.find(
                      (item) => item.number === verse.number,
                    );

                    return (
                      <View
                        key={verse.number}
                        style={styles.verseBlock}
                        onLayout={(event) => {
                          handleVerseLayout(verse.number, event);
                        }}
                      >
                        <View style={styles.verseRow}>
                          <View style={styles.verseNumber}>
                            <Text
                              style={[
                                styles.verseNumberText,
                                { color: colors.text.tertiary },
                              ]}
                            >
                              {verse.number}
                            </Text>
                          </View>

                          <View style={styles.arabicContainer}>
                            <Text
                              style={[
                                styles.arabicText,
                                { color: colors.text.primary },
                              ]}
                            >
                              {verse.text}
                            </Text>
                          </View>
                        </View>

                        {showTranslation && englishVerse ? (
                          <View style={styles.translationContainer}>
                            <Text
                              style={[
                                styles.translationText,
                                { color: colors.text.secondary },
                              ]}
                            >
                              {englishVerse.text}
                            </Text>
                          </View>
                        ) : null}
                      </View>
                    );
                  })}
                </View>
              )}

              <View style={styles.bottomSpacer} />
            </ScrollView>
          </GestureDetector>
        </View>
      </View>

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
  chrome: {
    paddingTop: spacing.md,
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  header: {
    gap: spacing.xs,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  titleBlock: {
    flex: 1,
    minWidth: 0,
  },
  kicker: {
    fontFamily: fontFamily.appSemiBold,
    fontSize: 11,
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: spacing.xxs,
  },
  title: {
    fontFamily: fontFamily.appBold,
    fontSize: 22,
    lineHeight: 26,
    flex: 1,
  },
  timelineButton: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radii.pill,
    borderWidth: 1,
    width: 32,
    height: 32,
  },
  surahMetaBlock: {
    gap: 1,
  },
  surahTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  surahName: {
    fontFamily: fontFamily.appSemiBold,
    fontSize: 16,
    lineHeight: 20,
    flex: 1,
  },
  surahMeta: {
    fontFamily: fontFamily.appRegular,
    fontSize: 12,
  },
  translationToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: radii.pill,
    borderWidth: 1,
    paddingHorizontal: spacing.xs + 2,
    paddingVertical: 5,
  },
  translationToggleText: {
    fontFamily: fontFamily.appRegular,
    fontSize: 10,
  },
  sessionCard: {
    borderRadius: radii.lg,
    borderWidth: 1,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.sm,
    gap: spacing.xs,
  },
  sessionTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: spacing.sm,
  },
  sessionTextBlock: {
    flex: 1,
  },
  sessionTitle: {
    fontFamily: fontFamily.appSemiBold,
    fontSize: 14,
  },
  sessionCaptionInline: {
    fontFamily: fontFamily.appRegular,
    fontSize: 11,
    flexShrink: 1,
    textAlign: "right",
  },
  ambientButton: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radii.pill,
    borderWidth: 1,
    width: 32,
    height: 32,
  },
  sessionControlsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  playButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  scrubberColumn: {
    flex: 1,
    gap: 4,
  },
  scrubberHitArea: {
    paddingVertical: 4,
  },
  scrubberTrack: {
    height: 3,
    borderRadius: radii.pill,
    overflow: "hidden",
  },
  scrubberFill: {
    height: "100%",
    borderRadius: radii.pill,
  },
  timeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  timeText: {
    fontFamily: fontFamily.appRegular,
    fontSize: 10,
  },
  readingProgressTrack: {
    height: 2,
    borderRadius: radii.pill,
    overflow: "hidden",
  },
  readingProgressFill: {
    height: "100%",
    borderRadius: radii.pill,
  },
  reader: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
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
