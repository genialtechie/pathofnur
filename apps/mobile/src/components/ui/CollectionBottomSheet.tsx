import { useCallback, useMemo } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Modal,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useLayeredAudio, type AmbientType } from "@/src/lib/audio";
import { type LibraryCollection, type LibraryTrack, LIBRARY_COLLECTIONS } from "@/src/features/library/library-data";
import { fontFamily, radii, spacing, useTheme } from "@/src/theme";

const AMBIENT_OPTIONS: { type: AmbientType; label: string }[] = [
  { type: "silence", label: "Off" },
  { type: "rain", label: "Rain" },
  { type: "medina_wind", label: "Wind" },
];

interface CollectionBottomSheetProps {
  visible: boolean;
  collectionId: string | null;
  onClose: () => void;
}

export function CollectionBottomSheet({
  visible,
  collectionId,
  onClose,
}: CollectionBottomSheetProps) {
  const { state, toggleQuran, setAmbient } = useLayeredAudio();
  const { colors } = useTheme();

  const collection = useMemo(
    () => LIBRARY_COLLECTIONS.find((c) => c.id === collectionId) ?? null,
    [collectionId]
  );

  const activeTrack = useMemo(
    () =>
      LIBRARY_COLLECTIONS.flatMap((c) => c.tracks).find(
        (track) => track.id === state.quran.activeTrackId
      ) ?? null,
    [state.quran.activeTrackId]
  );

  const handleTrackPress = useCallback(
    async (trackItem: LibraryTrack) => {
      const result = await toggleQuran(trackItem.id, trackItem.audioUrl);
      if (result !== "playing") return;
    },
    [toggleQuran]
  );

  const handleAmbientToggle = useCallback(
    async (type: AmbientType) => {
      await setAmbient(type);
    },
    [setAmbient]
  );

  if (!collection) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <KeyboardAvoidingView
              behavior={Platform.OS === "ios" ? "padding" : undefined}
              style={styles.sheetContainer}
            >
              <SafeAreaView style={[styles.sheet, { backgroundColor: colors.surface.background }]}>
                {/* Handle bar */}
                <View style={[styles.handleBar, { backgroundColor: colors.surface.borderInteractive }]} />

                {/* Header */}
                <View style={[styles.header, { borderBottomColor: colors.surface.borderElevated }]}>
                  <Text style={[styles.collectionTitle, { color: colors.text.primary }]}>{collection.title}</Text>
                  <Text style={[styles.collectionSubtitle, { color: colors.text.secondary }]}>{collection.subtitle}</Text>
                </View>

                {/* Track list */}
                <ScrollView
                  style={styles.trackList}
                  showsVerticalScrollIndicator={false}
                >
                  {collection.tracks.map((trackItem) => {
                    const isCurrentTrack = state.quran.activeTrackId === trackItem.id;
                    const actionLabel =
                      isCurrentTrack && state.quran.isPlaying ? "Pause" : "Play";

                      return (
                        <Pressable
                          key={trackItem.id}
                          style={[
                            styles.trackRow,
                            { 
                              backgroundColor: colors.surface.card,
                              borderColor: colors.surface.borderInteractive
                            },
                            isCurrentTrack && {
                              backgroundColor: colors.interactive.selectedBackground,
                              borderColor: colors.interactive.selectedBorder
                            },
                          ]}
                        accessibilityRole="button"
                        onPress={() => handleTrackPress(trackItem)}
                      >
                        <View style={styles.trackMeta}>
                          <Text style={[styles.trackTitle, { color: colors.text.primary }]}>{trackItem.title}</Text>
                          <Text style={[styles.trackCaption, { color: colors.text.tertiary }]}>
                            {trackItem.reciter} · {trackItem.durationLabel}
                          </Text>
                        </View>
                        <View style={[styles.trackActionPill, { borderColor: colors.interactive.selectedBorder }]}>
                          <Text style={[styles.trackActionLabel, { color: colors.interactive.selectedBorder }]}>{actionLabel}</Text>
                        </View>
                      </Pressable>
                    );
                  })}

                  {/* Ambient selector */}
                  <View style={styles.ambientSection}>
                    <Text style={[styles.ambientLabel, { color: colors.text.secondary }]}>Ambient Sound</Text>
                    <View style={styles.ambientRow}>
                      {AMBIENT_OPTIONS.map((option) => {
                        const isActive = state.ambient.activeType === option.type;
                        return (
                          <Pressable
                            key={option.type}
                            style={[
                              styles.ambientChip,
                              { borderColor: colors.surface.borderInteractive },
                              isActive && {
                                backgroundColor: colors.interactive.selectedBackground,
                                borderColor: colors.brand.metallicGold
                              },
                            ]}
                            accessibilityRole="button"
                            onPress={() => handleAmbientToggle(option.type)}
                          >
                            <Text
                              style={[
                                styles.ambientChipLabel,
                                { color: colors.text.tertiary },
                                isActive && { color: colors.brand.metallicGold },
                              ]}
                            >
                              {option.label}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>

                  {activeTrack ? (
                    <Text style={[styles.nowPlaying, { color: colors.text.secondary }]}>
                      {state.quran.isPlaying ? "Now playing:" : "Paused:"}{" "}
                      {activeTrack.title}
                    </Text>
                  ) : (
                    <Text style={[styles.nowPlaying, { color: colors.text.secondary }]}>
                      Select a track to start listening.
                    </Text>
                  )}

                  {state.quran.error ? (
                    <Text style={[styles.errorText, { color: colors.text.error }]}>{state.quran.error}</Text>
                  ) : null}

                  <View style={styles.bottomSpacer} />
                </ScrollView>
              </SafeAreaView>
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
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: spacing.md,
  },
  header: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
  },
  collectionTitle: {
    fontFamily: fontFamily.appBold,
    fontSize: 28,
    lineHeight: 34,
  },
  collectionSubtitle: {
    fontFamily: fontFamily.appRegular,
    fontSize: 16,
    lineHeight: 22,
    marginTop: spacing.xs,
  },
  trackList: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  trackRow: {
    borderRadius: radii.lg,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  trackRowActive: {
    // handled inline
  },
  trackMeta: {
    flex: 1,
    gap: spacing.xxs,
  },
  trackTitle: {
    fontFamily: fontFamily.appSemiBold,
    fontSize: 16,
    lineHeight: 22,
  },
  trackCaption: {
    fontFamily: fontFamily.appRegular,
    fontSize: 13,
  },
  trackActionPill: {
    minWidth: 70,
    borderRadius: radii.pill,
    borderWidth: 1,
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  trackActionLabel: {
    fontFamily: fontFamily.appSemiBold,
    fontSize: 13,
  },
  ambientSection: {
    marginTop: spacing.md,
    gap: spacing.xs,
  },
  ambientLabel: {
    fontFamily: fontFamily.appSemiBold,
    fontSize: 14,
  },
  ambientRow: {
    flexDirection: "row",
    gap: spacing.xs,
  },
  ambientChip: {
    borderRadius: radii.pill,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  ambientChipActive: {
    // inline
  },
  ambientChipLabel: {
    fontFamily: fontFamily.appSemiBold,
    fontSize: 13,
  },
  ambientChipLabelActive: {
    // inline
  },
  nowPlaying: {
    fontFamily: fontFamily.appRegular,
    fontSize: 14,
    marginTop: spacing.md,
    textAlign: "center",
  },
  errorText: {
    fontFamily: fontFamily.appRegular,
    fontSize: 14,
    marginTop: spacing.xxs,
    textAlign: "center",
  },
  bottomSpacer: {
    height: spacing.xl,
  },
});
