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
import { useFocusEffect, useRouter } from "expo-router";
import { Image } from "expo-image";
import Ionicons from "@expo/vector-icons/Ionicons";
import Svg, { Circle } from "react-native-svg";

import { EventName, track } from "@/src/lib/analytics/track";
import { useLocation } from "@/src/lib/location";
import { shareToolsArtifact, type ToolsShareCapture, type ToolsShareResult } from "@/src/lib/share/share-tools-artifact";
import {
  createManualToolsShareArtifact,
  getToolsShareAnalyticsPayload,
  type ToolsShareArtifact,
} from "@/src/lib/share/tools-share";
import { ToolsSharePreviewSheet } from "@/src/lib/share/tools-share-preview-sheet";
import {
  TASBIH_LOOP_LENGTH,
  createEmptyTasbihHistoryState,
  getTasbihHistorySnapshot,
  loadTasbihHistoryState,
  type TasbihHistoryState,
} from "@/src/store/tasbih-history";
import { fontFamily, radii, spacing, useTheme } from "@/src/theme";
import { darkColors } from "@/src/theme/tokens";

const TASBIH_COVER = require("@/public/images/_source/tools-tasbih-focus-v01.webp");
const QIBLAH_COVER = require("@/public/images/_source/tools-qiblah-backdrop-v01.webp");
const NUMBER_FORMATTER = new Intl.NumberFormat("en-US");
const COMPACT_NUMBER_FORMATTER = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
});

type FeatureCardProps = {
  label: string;
  title: string;
  description: string;
  primaryLabel: string;
  primaryValue: string;
  secondaryLabel: string;
  secondaryValue: string;
  cta: string;
  imageSource: number;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
};

type PracticeDayCardProps = {
  label: string;
  count: number;
  accentColor: string;
  backgroundColor: string;
  borderColor: string;
  titleColor: string;
  textColor: string;
  secondaryTextColor: string;
  ringTrackColor: string;
};

type ProgressRingProps = {
  progress: number;
  accentColor: string;
  trackColor: string;
  textColor: string;
  value: string;
  size?: number;
};

function getLoopProgress(count: number): number {
  if (count <= 0) return 0;
  return ((count - 1) % TASBIH_LOOP_LENGTH) + 1;
}

function ProgressRing({ progress, accentColor, trackColor, textColor, value, size = 66 }: ProgressRingProps) {
  const strokeWidth = 4.5;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedProgress = Math.max(0, Math.min(progress, 1));
  const strokeDashoffset = circumference * (1 - clampedProgress);

  return (
    <View style={[styles.ringShell, { width: size, height: size }]}>
      <Svg height={size} width={size} viewBox={`0 0 ${size} ${size}`}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          fill="none"
          r={radius}
          stroke={trackColor}
          strokeWidth={strokeWidth}
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          fill="none"
          r={radius}
          stroke={accentColor}
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          strokeWidth={strokeWidth}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View pointerEvents="none" style={styles.ringCenter}>
        <Text style={[styles.ringValue, { color: textColor, fontSize: size <= 58 ? 14 : 16 }]}>{value}</Text>
      </View>
    </View>
  );
}

function PracticeDayCard({
  label,
  count,
  accentColor,
  backgroundColor,
  borderColor,
  titleColor,
  textColor,
  secondaryTextColor,
  ringTrackColor,
}: PracticeDayCardProps) {
  const overflowCount = count > TASBIH_LOOP_LENGTH ? count - TASBIH_LOOP_LENGTH : 0;
  const loopProgress = getLoopProgress(count);
  const ringValue = count === 0 ? "0" : NUMBER_FORMATTER.format(loopProgress);
  const footerText =
    count === 0
      ? "None yet"
      : overflowCount > 0
        ? `${NUMBER_FORMATTER.format(loopProgress)} into 33`
        : count === TASBIH_LOOP_LENGTH
          ? "33 complete"
        : `${NUMBER_FORMATTER.format(TASBIH_LOOP_LENGTH - count)} left`;

  return (
    <View style={[styles.dayCard, { backgroundColor, borderColor }]}> 
      <View style={styles.dayCardTopRow}>
        <Text style={[styles.dayCardLabel, { color: titleColor }]}>{label}</Text>
        {overflowCount > 0 ? (
          <View style={[styles.dayOverflowPill, { backgroundColor: `${accentColor}22`, borderColor: `${accentColor}33` }]}> 
            <Text
              adjustsFontSizeToFit
              minimumFontScale={0.75}
              numberOfLines={1}
              style={[styles.dayOverflowText, { color: accentColor }]}
            >
              +{COMPACT_NUMBER_FORMATTER.format(overflowCount)}
            </Text>
          </View>
        ) : null}
      </View>

      <View style={styles.dayCardPrimaryRow}>
        <Text
          adjustsFontSizeToFit
          minimumFontScale={0.62}
          numberOfLines={1}
          style={[styles.dayCardCount, { color: textColor }]}
        >
          {NUMBER_FORMATTER.format(count)}
        </Text>
      </View>

      <View style={styles.dayCardFooterRow}>
        <Text numberOfLines={1} style={[styles.dayCardFootnote, { color: secondaryTextColor }]}>
          {footerText}
        </Text>
        <ProgressRing
          accentColor={accentColor}
          progress={loopProgress / TASBIH_LOOP_LENGTH}
          trackColor={ringTrackColor}
          textColor={textColor}
          value={ringValue}
          size={58}
        />
      </View>
    </View>
  );
}

function FeatureCard({
  label,
  title,
  description,
  primaryLabel,
  primaryValue,
  secondaryLabel,
  secondaryValue,
  cta,
  imageSource,
  icon,
  onPress,
}: FeatureCardProps) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.featureCard, pressed && styles.featureCardPressed]}
    >
      <Image source={imageSource} style={StyleSheet.absoluteFillObject} contentFit="cover" transition={180} />
      <View style={styles.featureOverlay} />
      <View style={styles.featureGlow} />

      <View style={styles.featureTopRow}>
        <View style={styles.badgePill}>
          <Ionicons name={icon} size={14} color={darkColors.brand.metallicGold} />
          <Text style={styles.badgeText}>{label}</Text>
        </View>
        <View style={styles.ctaPill}>
          <Text style={styles.ctaText}>{cta}</Text>
        </View>
      </View>

      <View style={styles.featureBody}>
        <Text style={styles.featureTitle}>{title}</Text>
        <Text style={styles.featureDescription}>{description}</Text>
      </View>

      <View style={styles.featureStatsRow}>
        <View style={styles.featureStatCard}>
          <Text style={styles.featureStatLabel}>{primaryLabel}</Text>
          <Text adjustsFontSizeToFit minimumFontScale={0.75} numberOfLines={1} style={styles.featureStatValue}>
            {primaryValue}
          </Text>
        </View>
        <View style={styles.featureStatCard}>
          <Text style={styles.featureStatLabel}>{secondaryLabel}</Text>
          <Text adjustsFontSizeToFit minimumFontScale={0.75} numberOfLines={1} style={styles.featureStatValue}>
            {secondaryValue}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

export default function ToolsScreen() {
  const router = useRouter();
  const { location } = useLocation();
  const { colors, isDark } = useTheme();
  const [historyState, setHistoryState] = useState<TasbihHistoryState>(() => createEmptyTasbihHistoryState());
  const [activeShareArtifact, setActiveShareArtifact] = useState<ToolsShareArtifact | null>(null);
  const [isSharePreviewVisible, setIsSharePreviewVisible] = useState(false);
  const [isSharePending, setIsSharePending] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      void loadTasbihHistoryState().then((nextState) => {
        if (isActive) {
          setHistoryState(nextState);
        }
      });

      return () => {
        isActive = false;
      };
    }, [])
  );

  const tasbihSnapshot = useMemo(() => getTasbihHistorySnapshot(historyState), [historyState]);
  const activeCount = tasbihSnapshot.activeCount;
  const lifetimeCount = tasbihSnapshot.lifetimeCount;
  const todayCount = tasbihSnapshot.todayCount;
  const yesterdayCount = tasbihSnapshot.yesterdayCount;
  const lifetimeLoops = tasbihSnapshot.lifetimeCompletedLoops;

  const formattedActiveCount = NUMBER_FORMATTER.format(activeCount);
  const formattedLifetimeCount = NUMBER_FORMATTER.format(lifetimeCount);
  const formattedLifetimeLoops = NUMBER_FORMATTER.format(lifetimeLoops);
  const formattedTodayCount = NUMBER_FORMATTER.format(todayCount);
  const qiblahLocation = location?.city ?? "Location needed";
  const hasHistory = lifetimeCount > 0;
  const hasActiveCount = activeCount > 0;
  const manualShareArtifact = useMemo(() => createManualToolsShareArtifact(tasbihSnapshot), [tasbihSnapshot]);

  const practiceBadgeBackground = isDark ? "rgba(7, 11, 20, 0.62)" : "rgba(255, 255, 255, 0.82)";
  const practiceBadgeBorder = isDark ? "rgba(255,255,255,0.08)" : "rgba(17,24,39,0.08)";
  const shareButtonBackground = isDark ? "rgba(255,255,255,0.1)" : "rgba(17,24,39,0.05)";
  const shareButtonDisabledBackground = isDark ? "rgba(255,255,255,0.05)" : "rgba(17,24,39,0.03)";
  const practicePanelColor = colors.surface.card;
  const practicePanelBorder = colors.surface.borderInteractive;
  const loopsCapsuleBackground = isDark ? "rgba(7, 11, 20, 0.62)" : "rgba(255,255,255,0.86)";
  const loopsCapsuleBorder = isDark ? "rgba(255,255,255,0.08)" : "rgba(17,24,39,0.08)";
  const yesterdayAccentColor = isDark ? "#D99283" : "#CC7A6D";
  const yesterdayCardBackground = isDark ? "rgba(60, 28, 28, 0.42)" : "rgba(249, 239, 236, 0.98)";
  const yesterdayCardBorder = isDark ? "rgba(217, 146, 131, 0.18)" : "rgba(204, 122, 109, 0.18)";
  const todayAccentColor = colors.brand.metallicGold;
  const todayCardBackground = isDark ? "rgba(7, 11, 20, 0.76)" : "rgba(255, 255, 255, 0.98)";
  const todayCardBorder = isDark ? "rgba(197, 160, 33, 0.22)" : "rgba(197, 160, 33, 0.18)";
  const dayCardTextColor = colors.text.primary;
  const dayCardSecondaryColor = colors.text.secondary;
  const dayRingTrackColor = isDark ? "rgba(255,255,255,0.09)" : "rgba(17,24,39,0.08)";

  const dismissSharePreview = useCallback(() => {
    if (!activeShareArtifact) {
      setIsSharePreviewVisible(false);
      return;
    }

    void track(
      EventName.TOOLS_SHARE_DISMISSED,
      getToolsShareAnalyticsPayload(activeShareArtifact),
      "tools"
    );
    setIsSharePreviewVisible(false);
    setActiveShareArtifact(null);
  }, [activeShareArtifact]);

  const openSharePreview = useCallback(() => {
    if (!hasHistory) return;

    setActiveShareArtifact(manualShareArtifact);
    setIsSharePreviewVisible(true);
    void track(
      EventName.TOOLS_SHARE_PREVIEW_VIEWED,
      getToolsShareAnalyticsPayload(manualShareArtifact),
      "tools"
    );
  }, [hasHistory, manualShareArtifact]);

  const handleShareRequest = useCallback(
    async (capture: ToolsShareCapture) => {
      if (!activeShareArtifact || isSharePending) return;

      const analyticsPayload = getToolsShareAnalyticsPayload(activeShareArtifact);
      setIsSharePending(true);
      void track(EventName.TOOLS_SHARE_STARTED, analyticsPayload, "tools");

      try {
        const shareResult: ToolsShareResult = await shareToolsArtifact(activeShareArtifact, capture);
        if (shareResult === "dismissed") {
          return;
        }

        void track(EventName.TOOLS_SHARE_COMPLETED, analyticsPayload, "tools");
        setIsSharePreviewVisible(false);
        setActiveShareArtifact(null);
      } catch (error) {
        console.error("Tools share failed:", error);
      } finally {
        setIsSharePending(false);
      }
    },
    [activeShareArtifact, isSharePending]
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.surface.background }]}> 
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={[styles.pageTitle, { color: colors.text.primary }]}>Tools</Text>
        </View>

        <View style={[styles.practiceCard, { backgroundColor: practicePanelColor, borderColor: practicePanelBorder }]}> 
          <View style={styles.practiceGlowLarge} />
          <View style={styles.practiceGlowSmall} />

          <View style={styles.practiceTopRow}>
            <View style={[styles.practiceBadge, { backgroundColor: practiceBadgeBackground, borderColor: practiceBadgeBorder }]}> 
              <Ionicons name="sparkles" size={14} color={colors.brand.metallicGold} />
              <Text style={[styles.practiceBadgeText, { color: colors.text.light }]}>Practice</Text>
            </View>

            <Pressable
              accessibilityRole="button"
              disabled={!hasHistory}
              onPress={openSharePreview}
              style={({ pressed }) => [
                styles.shareIconButton,
                { backgroundColor: hasHistory ? shareButtonBackground : shareButtonDisabledBackground },
                pressed && hasHistory && styles.shareButtonPressed,
              ]}
            >
              <Ionicons
                name="share-social-outline"
                size={16}
                color={hasHistory ? colors.text.primary : colors.text.tertiary}
              />
            </Pressable>
          </View>

          <View style={styles.practiceHeroRow}>
            <View style={styles.practiceLead}>
              <Text
                adjustsFontSizeToFit
                minimumFontScale={0.42}
                numberOfLines={1}
                style={[styles.practiceCount, { color: colors.text.primary }]}
              >
                {formattedLifetimeCount}
              </Text>
              <Text style={[styles.practiceCountLabel, { color: colors.brand.metallicGold }]}>all-time tasbih</Text>
            </View>

            <View
              style={[
                styles.loopsCapsule,
                { backgroundColor: loopsCapsuleBackground, borderColor: loopsCapsuleBorder },
              ]}
            >
              <Text
                adjustsFontSizeToFit
                minimumFontScale={0.7}
                numberOfLines={1}
                style={[styles.loopsCapsuleValue, { color: colors.text.primary }]}
              >
                {formattedLifetimeLoops}
              </Text>
              <Text numberOfLines={1} style={[styles.loopsCapsuleLabel, { color: colors.text.tertiary }]}>
                loops
              </Text>
            </View>
          </View>

          <View style={styles.practiceComparisonRow}>
            <PracticeDayCard
              accentColor={yesterdayAccentColor}
              backgroundColor={yesterdayCardBackground}
              borderColor={yesterdayCardBorder}
              count={yesterdayCount}
              label="Yesterday"
              ringTrackColor={dayRingTrackColor}
              secondaryTextColor={dayCardSecondaryColor}
              textColor={dayCardTextColor}
              titleColor={yesterdayAccentColor}
            />
            <PracticeDayCard
              accentColor={todayAccentColor}
              backgroundColor={todayCardBackground}
              borderColor={todayCardBorder}
              count={todayCount}
              label="Today"
              ringTrackColor={dayRingTrackColor}
              secondaryTextColor={dayCardSecondaryColor}
              textColor={dayCardTextColor}
              titleColor={colors.text.primary}
            />
          </View>

          <Pressable
            accessibilityRole="button"
            onPress={() => router.push("/tools/tasbih")}
            style={({ pressed }) => [styles.primaryAction, pressed && styles.primaryActionPressed]}
          >
            <Text style={styles.primaryActionText}>{hasActiveCount ? "Return to Tasbih" : "Open Tasbih"}</Text>
            <Ionicons name="arrow-forward" size={18} color={darkColors.text.onAccent} />
          </Pressable>
        </View>

        <FeatureCard
          label="Tasbih"
          title="Return to your tasbih."
          description="Open the orb and continue from your saved counter."
          primaryLabel="Live"
          primaryValue={activeCount > 0 ? formattedActiveCount : "0"}
          secondaryLabel="Today"
          secondaryValue={todayCount > 0 ? formattedTodayCount : hasHistory ? "0" : "Start now"}
          cta="Open"
          imageSource={TASBIH_COVER}
          icon="sparkles"
          onPress={() => router.push("/tools/tasbih")}
        />

        <FeatureCard
          label="Qiblah"
          title="Turn toward the qiblah."
          description="Open the compass and align from your current location."
          primaryLabel="Location"
          primaryValue={qiblahLocation}
          secondaryLabel="Live"
          secondaryValue={location?.coords ? "Ready" : "Needs location"}
          cta="Open"
          imageSource={QIBLAH_COVER}
          icon="compass"
          onPress={() => router.push("/tools/qiblah")}
        />
      </ScrollView>

      <ToolsSharePreviewSheet
        artifact={activeShareArtifact}
        isSharing={isSharePending}
        onClose={dismissSharePreview}
        onShare={handleShareRequest}
        visible={isSharePreviewVisible}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: spacing.lg,
    paddingBottom: spacing["5xl"],
    gap: spacing.lg,
  },
  header: {
    marginHorizontal: spacing.xl,
    gap: spacing.xs,
  },
  pageTitle: {
    color: darkColors.text.primary,
    fontFamily: fontFamily.appBold,
    fontSize: 34,
    lineHeight: 40,
  },
  practiceCard: {
    marginHorizontal: spacing.xl,
    padding: spacing.xl,
    borderRadius: radii.xl,
    backgroundColor: darkColors.surface.card,
    borderWidth: 1,
    borderColor: darkColors.surface.borderInteractive,
    overflow: "hidden",
    gap: spacing.lg,
  },
  practiceGlowLarge: {
    position: "absolute",
    width: 240,
    height: 240,
    borderRadius: 999,
    backgroundColor: "rgba(197, 160, 33, 0.16)",
    top: -96,
    right: -36,
  },
  practiceGlowSmall: {
    position: "absolute",
    width: 160,
    height: 160,
    borderRadius: 999,
    backgroundColor: "rgba(44, 82, 146, 0.22)",
    bottom: -70,
    left: -30,
  },
  practiceTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  practiceBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.pill,
    backgroundColor: "rgba(7, 11, 20, 0.62)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  practiceBadgeText: {
    color: darkColors.text.light,
    fontFamily: fontFamily.appSemiBold,
    fontSize: 12,
  },
  shareIconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  shareButtonPressed: {
    opacity: 0.9,
  },
  practiceHeroRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  practiceLead: {
    flex: 1,
    gap: spacing.xxs,
    minWidth: 0,
  },
  practiceCount: {
    color: darkColors.text.primary,
    fontFamily: fontFamily.appBold,
    fontSize: 58,
    lineHeight: 62,
    fontVariant: ["tabular-nums"],
  },
  practiceCountLabel: {
    color: darkColors.brand.metallicGold,
    fontFamily: fontFamily.appSemiBold,
    fontSize: 14,
    letterSpacing: 0.2,
  },
  loopsCapsule: {
    minWidth: 104,
    maxWidth: 116,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.lg,
    borderWidth: 1,
    gap: 2,
  },
  loopsCapsuleValue: {
    fontFamily: fontFamily.appSemiBold,
    fontSize: 22,
    lineHeight: 26,
    fontVariant: ["tabular-nums"],
  },
  loopsCapsuleLabel: {
    fontFamily: fontFamily.appRegular,
    fontSize: 11,
    lineHeight: 14,
  },
  practiceComparisonRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  dayCard: {
    flex: 1,
    minHeight: 164,
    padding: spacing.sm,
    borderRadius: radii.xl,
    borderWidth: 1,
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  dayCardTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  dayCardLabel: {
    fontFamily: fontFamily.appSemiBold,
    fontSize: 14,
  },
  dayOverflowPill: {
    maxWidth: 72,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radii.pill,
    borderWidth: 1,
  },
  dayOverflowText: {
    fontFamily: fontFamily.appSemiBold,
    fontSize: 12,
    lineHeight: 14,
    fontVariant: ["tabular-nums"],
  },
  dayCardPrimaryRow: {
    minHeight: 48,
    justifyContent: "center",
  },
  dayCardFooterRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  dayCardCount: {
    fontFamily: fontFamily.appBold,
    fontSize: 42,
    lineHeight: 46,
    fontVariant: ["tabular-nums"],
  },
  dayCardFootnote: {
    flex: 1,
    paddingRight: spacing.xs,
    fontFamily: fontFamily.appRegular,
    fontSize: 12,
    lineHeight: 16,
  },
  ringShell: {
    alignItems: "center",
    justifyContent: "center",
  },
  ringCenter: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  ringValue: {
    fontFamily: fontFamily.appSemiBold,
    fontSize: 16,
    lineHeight: 20,
    fontVariant: ["tabular-nums"],
  },
  primaryAction: {
    minHeight: 52,
    borderRadius: radii.pill,
    backgroundColor: darkColors.brand.metallicGold,
    paddingHorizontal: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  primaryActionPressed: {
    opacity: 0.92,
  },
  primaryActionText: {
    color: darkColors.text.onAccent,
    fontFamily: fontFamily.appSemiBold,
    fontSize: 15,
  },
  featureCard: {
    minHeight: 272,
    marginHorizontal: spacing.xl,
    borderRadius: radii.xl,
    overflow: "hidden",
    justifyContent: "space-between",
    padding: spacing.lg,
    backgroundColor: darkColors.surface.card,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  featureCardPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.99 }],
  },
  featureOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(4, 8, 15, 0.58)",
  },
  featureGlow: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 999,
    backgroundColor: "rgba(197, 160, 33, 0.14)",
    right: -30,
    bottom: -40,
  },
  featureTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  badgePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.pill,
    backgroundColor: "rgba(7, 11, 20, 0.7)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  badgeText: {
    color: darkColors.text.light,
    fontFamily: fontFamily.appSemiBold,
    fontSize: 12,
  },
  ctaPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.pill,
    backgroundColor: "rgba(255,255,255,0.14)",
  },
  ctaText: {
    color: darkColors.text.primary,
    fontFamily: fontFamily.appSemiBold,
    fontSize: 12,
  },
  featureBody: {
    gap: spacing.xs,
  },
  featureTitle: {
    color: darkColors.text.primary,
    fontFamily: fontFamily.appBold,
    fontSize: 30,
    lineHeight: 36,
    maxWidth: "82%",
  },
  featureDescription: {
    color: darkColors.text.light,
    fontFamily: fontFamily.appRegular,
    fontSize: 15,
    lineHeight: 21,
    maxWidth: "84%",
  },
  featureStatsRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  featureStatCard: {
    flex: 1,
    minWidth: 0,
    padding: spacing.md,
    borderRadius: radii.lg,
    backgroundColor: "rgba(7, 11, 20, 0.72)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    gap: 4,
  },
  featureStatLabel: {
    color: darkColors.text.tertiary,
    fontFamily: fontFamily.appRegular,
    fontSize: 12,
  },
  featureStatValue: {
    color: darkColors.text.primary,
    fontFamily: fontFamily.appSemiBold,
    fontSize: 15,
  },
});
