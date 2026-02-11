import { useCallback, useMemo, useState } from "react";
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useFocusEffect } from "expo-router";

import { CollectionCard } from "@/src/components/cards";
import { EventName, track, trackScreenView } from "@/src/lib/analytics/track";
import { useExpoAudioPlayer } from "@/src/lib/audio";
import { colors, fontFamily, radii, spacing } from "@/src/theme";

import { LIBRARY_COLLECTIONS, type LibraryCollection, type LibraryTrack } from "./library-data";

export function LibraryScreen() {
  const [selectedCollectionId, setSelectedCollectionId] = useState<string>(
    LIBRARY_COLLECTIONS[0]?.id ?? ""
  );
  const { playbackState, togglePlayback } = useExpoAudioPlayer();

  const selectedCollection = useMemo(
    () =>
      LIBRARY_COLLECTIONS.find((collection) => collection.id === selectedCollectionId) ??
      LIBRARY_COLLECTIONS[0],
    [selectedCollectionId]
  );

  const activeTrack = useMemo(
    () =>
      LIBRARY_COLLECTIONS.flatMap((collection) => collection.tracks).find(
        (trackItem) => trackItem.id === playbackState.activeTrackId
      ) ?? null,
    [playbackState.activeTrackId]
  );

  useFocusEffect(
    useCallback(() => {
      void trackScreenView("library");
    }, [])
  );

  const handleSelectCollection = useCallback((collection: LibraryCollection) => {
    setSelectedCollectionId(collection.id);
    void track(
      EventName.LIBRARY_COLLECTION_OPENED,
      { collection_name: collection.title },
      "library"
    );
  }, []);

  const handleTrackPress = useCallback(
    async (collection: LibraryCollection, trackItem: LibraryTrack) => {
      const result = await togglePlayback(trackItem.id, trackItem.audioUrl);
      if (result !== "playing") return;

      await track(
        EventName.LIBRARY_TRACK_PLAYED,
        {
          track_id: trackItem.id,
          track_name: trackItem.title,
          collection_name: collection.title,
          has_ambient: false,
        },
        "library"
      );
    },
    [togglePlayback]
  );

  if (!selectedCollection) {
    return null;
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.header}>
          <Text style={styles.kicker}>Library</Text>
          <Text style={styles.title}>Recitation Collections</Text>
          <Text style={styles.subtitle}>
            Choose a collection and press play to begin a focused session.
          </Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.collectionsRow}
        >
          {LIBRARY_COLLECTIONS.map((collection) => (
            <CollectionCard
              key={collection.id}
              imageSource={collection.imageSource}
              title={collection.title}
              onPress={() => handleSelectCollection(collection)}
              style={
                collection.id === selectedCollection.id
                  ? styles.collectionCardSelected
                  : styles.collectionCard
              }
            />
          ))}
        </ScrollView>

        <View style={styles.trackPanel}>
          <Text style={styles.collectionTitle}>{selectedCollection.title}</Text>
          <Text style={styles.collectionSubtitle}>{selectedCollection.subtitle}</Text>

          {selectedCollection.tracks.map((trackItem) => {
            const isCurrentTrack = playbackState.activeTrackId === trackItem.id;
            const actionLabel =
              isCurrentTrack && playbackState.isPlaying ? "Pause" : "Play";

            return (
              <Pressable
                key={trackItem.id}
                style={[
                  styles.trackRow,
                  isCurrentTrack && styles.trackRowActive,
                ]}
                accessibilityRole="button"
                onPress={() => {
                  void handleTrackPress(selectedCollection, trackItem);
                }}
              >
                <View style={styles.trackMeta}>
                  <Text style={styles.trackTitle}>{trackItem.title}</Text>
                  <Text style={styles.trackCaption}>
                    {trackItem.reciter} · {trackItem.durationLabel}
                  </Text>
                </View>

                <View style={styles.trackActionPill}>
                  <Text style={styles.trackActionLabel}>{actionLabel}</Text>
                </View>
              </Pressable>
            );
          })}

          {activeTrack ? (
            <Text style={styles.nowPlaying}>
              {playbackState.isPlaying ? "Now playing:" : "Paused:"} {activeTrack.title}
            </Text>
          ) : (
            <Text style={styles.nowPlaying}>Select a track to start listening.</Text>
          )}

          {playbackState.error ? (
            <Text style={styles.errorText}>{playbackState.error}</Text>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface.background,
  },
  scrollContent: {
    paddingTop: spacing.xl,
    paddingBottom: spacing["5xl"],
  },
  header: {
    paddingHorizontal: spacing.xl,
    gap: spacing.xs,
    marginBottom: spacing.lg,
  },
  kicker: {
    color: colors.text.tertiary,
    fontFamily: fontFamily.appSemiBold,
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  title: {
    color: colors.text.primary,
    fontFamily: fontFamily.appBold,
    fontSize: 30,
    lineHeight: 36,
  },
  subtitle: {
    color: colors.text.secondary,
    fontFamily: fontFamily.appRegular,
    fontSize: 16,
    lineHeight: 22,
  },
  collectionsRow: {
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
    paddingBottom: spacing.xl,
  },
  collectionCard: {
    width: 172,
  },
  collectionCardSelected: {
    width: 172,
    borderWidth: 1,
    borderColor: colors.interactive.selectedBorder,
  },
  trackPanel: {
    marginHorizontal: spacing.xl,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.surface.borderElevated,
    backgroundColor: colors.surface.card,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    gap: spacing.sm,
  },
  collectionTitle: {
    color: colors.text.primary,
    fontFamily: fontFamily.appSemiBold,
    fontSize: 22,
    lineHeight: 28,
  },
  collectionSubtitle: {
    color: colors.text.secondary,
    fontFamily: fontFamily.appRegular,
    fontSize: 15,
    lineHeight: 21,
    marginBottom: spacing.sm,
  },
  trackRow: {
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.surface.borderInteractive,
    backgroundColor: colors.surface.background,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  trackRowActive: {
    borderColor: colors.interactive.selectedBorder,
    backgroundColor: colors.interactive.selectedBackground,
  },
  trackMeta: {
    flex: 1,
    gap: spacing.xxs,
  },
  trackTitle: {
    color: colors.text.primary,
    fontFamily: fontFamily.appSemiBold,
    fontSize: 16,
    lineHeight: 22,
  },
  trackCaption: {
    color: colors.text.tertiary,
    fontFamily: fontFamily.appRegular,
    fontSize: 13,
  },
  trackActionPill: {
    minWidth: 70,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.interactive.selectedBorder,
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  trackActionLabel: {
    color: colors.interactive.selectedBorder,
    fontFamily: fontFamily.appSemiBold,
    fontSize: 13,
  },
  nowPlaying: {
    color: colors.text.secondary,
    fontFamily: fontFamily.appRegular,
    fontSize: 14,
    marginTop: spacing.sm,
  },
  errorText: {
    color: "#ef9a9a",
    fontFamily: fontFamily.appRegular,
    fontSize: 14,
    marginTop: spacing.xxs,
  },
});
