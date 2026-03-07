import { useMemo, useRef } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import ViewShot from "react-native-view-shot";
import type { CaptureOptions } from "react-native-view-shot";

import { fontFamily, radii, spacing, useTheme } from "@/src/theme";

import type { ToolsShareArtifact } from "./tools-share";
import type { ToolsShareCapture } from "./share-tools-artifact";

type ToolsSharePreviewSheetProps = {
  artifact: ToolsShareArtifact | null;
  visible: boolean;
  isSharing: boolean;
  onClose: () => void;
  onShare: (capture: ToolsShareCapture) => void;
};

const STORY = {
  background: "#F3EDDF",
  ink: "#18151D",
  muted: "#5D5A66",
  border: "rgba(24, 21, 29, 0.08)",
  gold: "#C5A021",
  goldSoft: "rgba(197, 160, 33, 0.16)",
  blueSoft: "rgba(44, 82, 146, 0.12)",
  tile: "rgba(255, 255, 255, 0.72)",
  tileBorder: "rgba(24, 21, 29, 0.08)",
} as const;

function ToolsStoryCard({ artifact }: { artifact: ToolsShareArtifact }) {
  return (
    <View collapsable={false} style={styles.storyCard}>
      <View style={styles.storyGoldGlow} />
      <View style={styles.storyBlueGlow} />

      <View style={styles.storyHeader}>
        <View style={styles.storyBadge}>
          <View style={styles.storyBadgeDot} />
          <Text style={styles.storyBadgeText}>Path of Nur</Text>
        </View>
      </View>

      <View style={styles.storyBody}>
        <Text style={styles.storyEyebrow}>{artifact.eyebrow}</Text>
        <Text style={styles.storyHeadline}>{artifact.headline}</Text>
        <Text style={styles.storySupporting}>{artifact.supportingText}</Text>
      </View>

      <View style={styles.storyStatsRow}>
        {artifact.stats.map((stat) => (
          <View key={stat.label} style={styles.storyStatCard}>
            <Text style={styles.storyStatLabel}>{stat.label}</Text>
            <Text adjustsFontSizeToFit minimumFontScale={0.7} numberOfLines={1} style={styles.storyStatValue}>
              {stat.value}
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.storyFooter}>
        <Text style={styles.storyFooterLabel}>{artifact.footerLabel}</Text>
      </View>
    </View>
  );
}

export function ToolsSharePreviewSheet({
  artifact,
  visible,
  isSharing,
  onClose,
  onShare,
}: ToolsSharePreviewSheetProps) {
  const { width } = useWindowDimensions();
  const { colors, isDark } = useTheme();
  const viewShotRef = useRef<ViewShot | null>(null);
  const cardWidth = Math.min(width - spacing.xl * 2, 292);
  const captureOptions = useMemo<CaptureOptions>(
    () => ({
      format: "png",
      quality: 1,
      result: process.env.EXPO_OS === "web" ? "data-uri" : "tmpfile",
      width: 1080,
      height: 1920,
    }),
    []
  );

  if (!visible || !artifact) {
    return null;
  }

  const handleSharePress = () => {
    void onShare(async () => {
      const uri = await viewShotRef.current?.capture?.();
      if (!uri) {
        throw new Error("Unable to export share card");
      }
      return uri;
    });
  };

  return (
    <View pointerEvents="box-none" style={styles.overlayRoot}>
      <Pressable
        accessibilityRole="button"
        onPress={onClose}
        style={[
          styles.overlayBackdrop,
          { backgroundColor: isDark ? "rgba(7, 11, 20, 0.78)" : "rgba(17, 24, 39, 0.28)" },
        ]}
      />

      <View
        style={[
          styles.sheet,
          {
            backgroundColor: colors.surface.card,
            borderColor: colors.surface.borderInteractive,
          },
        ]}
      >
        <View style={styles.sheetHeader}>
          <View style={styles.sheetHeaderCopy}>
            <Text style={[styles.sheetTitle, { color: colors.text.primary }]}>{artifact.previewTitle}</Text>
            <Text style={[styles.sheetSubtitle, { color: colors.text.secondary }]}>A clean story card travels better than plain text.</Text>
          </View>
          <Pressable accessibilityRole="button" hitSlop={16} onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={20} color={colors.text.primary} />
          </Pressable>
        </View>

        <View style={styles.cardStage}>
          <ViewShot options={captureOptions} ref={viewShotRef} style={{ width: cardWidth }}>
            <ToolsStoryCard artifact={artifact} />
          </ViewShot>
        </View>

        <View style={styles.sheetActions}>
          <Pressable
            accessibilityRole="button"
            disabled={isSharing}
            onPress={handleSharePress}
            style={({ pressed }) => [styles.primaryButton, pressed && !isSharing && styles.primaryButtonPressed]}
          >
            {isSharing ? (
              <ActivityIndicator color="#070B14" size="small" />
            ) : (
              <>
                <Text style={styles.primaryButtonText}>{artifact.actionLabel}</Text>
                <Ionicons name="arrow-forward" size={18} color="#070B14" />
              </>
            )}
          </Pressable>

          <Pressable
            accessibilityRole="button"
            disabled={isSharing}
            onPress={onClose}
            style={({ pressed }) => [
              styles.secondaryButton,
              { borderColor: colors.surface.borderInteractive },
              pressed && !isSharing && styles.secondaryButtonPressed,
            ]}
          >
            <Text style={[styles.secondaryButtonText, { color: colors.text.primary }]}>Not now</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlayRoot: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "flex-end",
  },
  overlayBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  sheet: {
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    borderWidth: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.lg,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  sheetHeaderCopy: {
    flex: 1,
    gap: spacing.xxs,
  },
  sheetTitle: {
    fontFamily: fontFamily.appBold,
    fontSize: 22,
    lineHeight: 28,
  },
  sheetSubtitle: {
    fontFamily: fontFamily.appRegular,
    fontSize: 14,
    lineHeight: 19,
  },
  closeButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  cardStage: {
    alignItems: "center",
    justifyContent: "center",
  },
  sheetActions: {
    gap: spacing.sm,
  },
  primaryButton: {
    minHeight: 54,
    borderRadius: radii.pill,
    backgroundColor: STORY.gold,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: spacing.xs,
  },
  primaryButtonPressed: {
    opacity: 0.92,
  },
  primaryButtonText: {
    color: "#070B14",
    fontFamily: fontFamily.appSemiBold,
    fontSize: 15,
  },
  secondaryButton: {
    minHeight: 52,
    borderRadius: radii.pill,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryButtonPressed: {
    opacity: 0.9,
  },
  secondaryButtonText: {
    fontFamily: fontFamily.appSemiBold,
    fontSize: 14,
  },
  storyCard: {
    aspectRatio: 9 / 16,
    borderRadius: 32,
    overflow: "hidden",
    backgroundColor: STORY.background,
    borderWidth: 1,
    borderColor: STORY.border,
    padding: 28,
    justifyContent: "space-between",
  },
  storyGoldGlow: {
    position: "absolute",
    width: 260,
    height: 260,
    borderRadius: 999,
    backgroundColor: STORY.goldSoft,
    top: -82,
    right: -48,
  },
  storyBlueGlow: {
    position: "absolute",
    width: 240,
    height: 240,
    borderRadius: 999,
    backgroundColor: STORY.blueSoft,
    bottom: -116,
    left: -84,
  },
  storyHeader: {
    alignItems: "flex-start",
  },
  storyBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.pill,
    backgroundColor: "rgba(255,255,255,0.62)",
    borderWidth: 1,
    borderColor: STORY.border,
  },
  storyBadgeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: STORY.gold,
  },
  storyBadgeText: {
    color: STORY.ink,
    fontFamily: fontFamily.appSemiBold,
    fontSize: 12,
  },
  storyBody: {
    gap: spacing.sm,
  },
  storyEyebrow: {
    color: STORY.muted,
    fontFamily: fontFamily.appSemiBold,
    fontSize: 13,
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  storyHeadline: {
    color: STORY.ink,
    fontFamily: fontFamily.appBold,
    fontSize: 40,
    lineHeight: 44,
  },
  storySupporting: {
    color: STORY.muted,
    fontFamily: fontFamily.appRegular,
    fontSize: 17,
    lineHeight: 24,
    maxWidth: "88%",
  },
  storyStatsRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  storyStatCard: {
    flex: 1,
    minHeight: 120,
    borderRadius: radii.xl,
    backgroundColor: STORY.tile,
    borderWidth: 1,
    borderColor: STORY.tileBorder,
    padding: spacing.md,
    justifyContent: "space-between",
  },
  storyStatLabel: {
    color: STORY.muted,
    fontFamily: fontFamily.appRegular,
    fontSize: 13,
  },
  storyStatValue: {
    color: STORY.ink,
    fontFamily: fontFamily.appBold,
    fontSize: 34,
    lineHeight: 38,
    fontVariant: ["tabular-nums"],
  },
  storyFooter: {
    alignItems: "flex-start",
  },
  storyFooterLabel: {
    color: STORY.muted,
    fontFamily: fontFamily.appSemiBold,
    fontSize: 13,
    letterSpacing: 0.4,
  },
});
