import { useCallback, useState } from "react";
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  Share,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useRouter } from "expo-router";
import { Image } from "expo-image";
import Ionicons from "@expo/vector-icons/Ionicons";

import { useLocation } from "@/src/lib/location";
import { fontFamily, radii, spacing } from "@/src/theme";
import { darkColors } from "@/src/theme/tokens";

const TASBIH_COVER = require("@/public/images/_source/tools-tasbih-focus-v01.webp");
const QIBLAH_COVER = require("@/public/images/_source/tools-qiblah-backdrop-v01.webp");
const TASBIH_STATE_KEY = "@pathofnur/tasbih_state_v2";
const LEGACY_TASBIH_KEY = "tasbih_count";
const NUMBER_FORMATTER = new Intl.NumberFormat("en-US");

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

type StoredTasbihState = {
  count?: number;
};

async function readTasbihCount(): Promise<number> {
  try {
    const next = await AsyncStorage.getItem(TASBIH_STATE_KEY);
    if (next) {
      const parsed = JSON.parse(next) as StoredTasbihState;
      if (typeof parsed.count === "number" && Number.isFinite(parsed.count)) {
        return parsed.count;
      }
    }

    const legacy = await AsyncStorage.getItem(LEGACY_TASBIH_KEY);
    if (!legacy) return 0;

    const count = Number.parseInt(legacy, 10);
    return Number.isFinite(count) ? count : 0;
  } catch {
    return 0;
  }
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
          <Text style={styles.featureStatValue}>{primaryValue}</Text>
        </View>
        <View style={styles.featureStatCard}>
          <Text style={styles.featureStatLabel}>{secondaryLabel}</Text>
          <Text style={styles.featureStatValue}>{secondaryValue}</Text>
        </View>
      </View>
    </Pressable>
  );
}

export default function ToolsScreen() {
  const router = useRouter();
  const { location } = useLocation();
  const [tasbihCount, setTasbihCount] = useState(0);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      void readTasbihCount().then((count) => {
        if (isActive) {
          setTasbihCount(count);
        }
      });

      return () => {
        isActive = false;
      };
    }, [])
  );

  const hasSavedDhikr = tasbihCount > 0;
  const completedRounds = Math.floor(tasbihCount / 33);
  const currentRoundProgress = tasbihCount % 33;
  const remainingToRound = currentRoundProgress === 0 ? 33 : 33 - currentRoundProgress;
  const formattedCount = NUMBER_FORMATTER.format(tasbihCount);
  const qiblahLocation = location?.city ?? "Location needed";
  const practicePrompt =
    tasbihCount === 0
      ? "Begin with one round of 33."
      : currentRoundProgress === 0
        ? "A full round is complete. Continue when you are ready."
        : `${remainingToRound} more to complete this round.`;
  const shareMessage =
    tasbihCount === 0
      ? "I am using Path of Nur for tasbih and qiblah."
      : completedRounds > 0
        ? `I have saved ${formattedCount} dhikr on Path of Nur, including ${completedRounds} completed rounds of tasbih.`
        : `I have saved ${formattedCount} dhikr on Path of Nur.`;

  const handleShareProgress = useCallback(async () => {
    try {
      await Share.share({
        title: "Path of Nur",
        message: shareMessage,
      });
    } catch {
      // Ignore share-sheet failures.
    }
  }, [shareMessage]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.pageTitle}>Tools</Text>
        </View>

        <View style={styles.practiceCard}>
          <View style={styles.practiceGlowLarge} />
          <View style={styles.practiceGlowSmall} />

          <View style={styles.practiceTopRow}>
            <View style={styles.practiceBadge}>
              <Ionicons name="sparkles" size={14} color={darkColors.brand.metallicGold} />
              <Text style={styles.practiceBadgeText}>Your Practice</Text>
            </View>
            <Pressable
              accessibilityRole="button"
              disabled={!hasSavedDhikr}
              onPress={() => {
                void handleShareProgress();
              }}
              style={({ pressed }) => [
                styles.shareButton,
                !hasSavedDhikr && styles.shareButtonDisabled,
                pressed && hasSavedDhikr && styles.shareButtonPressed,
              ]}
            >
              <Ionicons
                name="share-social-outline"
                size={16}
                color={hasSavedDhikr ? darkColors.text.primary : darkColors.text.tertiary}
              />
              <Text style={[styles.shareButtonText, !hasSavedDhikr && styles.shareButtonTextDisabled]}>
                Share
              </Text>
            </Pressable>
          </View>

          <View style={styles.practiceBody}>
            <View style={styles.practiceLead}>
              <Text style={styles.practiceCount}>{formattedCount}</Text>
              <Text style={styles.practiceCountLabel}>saved dhikr</Text>
              <Text style={styles.practicePrompt}>{practicePrompt}</Text>
            </View>

            <View style={styles.practiceStatsColumn}>
              <View style={styles.practiceStatCard}>
                <Text style={styles.practiceStatValue}>{NUMBER_FORMATTER.format(completedRounds)}</Text>
                <Text style={styles.practiceStatLabel}>completed rounds</Text>
              </View>
              <View style={styles.practiceStatCard}>
                <Text numberOfLines={1} style={styles.practiceStatLocation}>
                  {qiblahLocation}
                </Text>
                <Text style={styles.practiceStatLabel}>qiblah location</Text>
              </View>
            </View>
          </View>

          <Pressable
            accessibilityRole="button"
            onPress={() => router.push("/tools/tasbih")}
            style={({ pressed }) => [styles.primaryAction, pressed && styles.primaryActionPressed]}
          >
            <Text style={styles.primaryActionText}>{hasSavedDhikr ? "Return to Tasbih" : "Open Tasbih"}</Text>
            <Ionicons name="arrow-forward" size={18} color={darkColors.text.onAccent} />
          </Pressable>
        </View>

        <FeatureCard
          label="Tasbih"
          title="Keep count in rhythm."
          description="Resume where you left off and complete another round."
          primaryLabel="Saved"
          primaryValue={hasSavedDhikr ? formattedCount : "0"}
          secondaryLabel="Next round"
          secondaryValue={
            tasbihCount === 0
              ? "33 to begin"
              : currentRoundProgress === 0
                ? "Round complete"
                : `${remainingToRound} remaining`
          }
          cta="Open"
          imageSource={TASBIH_COVER}
          icon="sparkles"
          onPress={() => router.push("/tools/tasbih")}
        />

        <FeatureCard
          label="Qiblah"
          title="Find the qiblah with clarity."
          description="Open the compass and align from your current location."
          primaryLabel="Location"
          primaryValue={qiblahLocation}
          secondaryLabel="Compass"
          secondaryValue={location?.coords ? "Ready" : "Needs location"}
          cta="Open"
          imageSource={QIBLAH_COVER}
          icon="compass"
          onPress={() => router.push("/tools/qiblah")}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: darkColors.surface.background,
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
  shareButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  shareButtonDisabled: {
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  shareButtonPressed: {
    opacity: 0.9,
  },
  shareButtonText: {
    color: darkColors.text.primary,
    fontFamily: fontFamily.appSemiBold,
    fontSize: 13,
  },
  shareButtonTextDisabled: {
    color: darkColors.text.tertiary,
  },
  practiceBody: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: spacing.md,
  },
  practiceLead: {
    flex: 1.2,
    gap: spacing.xxs,
  },
  practiceCount: {
    color: darkColors.text.primary,
    fontFamily: fontFamily.appBold,
    fontSize: 54,
    lineHeight: 58,
    fontVariant: ["tabular-nums"],
  },
  practiceCountLabel: {
    color: darkColors.brand.metallicGold,
    fontFamily: fontFamily.appSemiBold,
    fontSize: 14,
    letterSpacing: 0.2,
  },
  practicePrompt: {
    color: darkColors.text.secondary,
    fontFamily: fontFamily.appRegular,
    fontSize: 15,
    lineHeight: 22,
    marginTop: spacing.xs,
    maxWidth: "92%",
  },
  practiceStatsColumn: {
    flex: 1,
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  practiceStatCard: {
    flex: 1,
    minHeight: 88,
    padding: spacing.md,
    borderRadius: radii.lg,
    backgroundColor: "rgba(7, 11, 20, 0.72)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  practiceStatValue: {
    color: darkColors.text.primary,
    fontFamily: fontFamily.appSemiBold,
    fontSize: 26,
    lineHeight: 30,
    fontVariant: ["tabular-nums"],
  },
  practiceStatLocation: {
    color: darkColors.text.primary,
    fontFamily: fontFamily.appSemiBold,
    fontSize: 18,
    lineHeight: 22,
  },
  practiceStatLabel: {
    color: darkColors.text.tertiary,
    fontFamily: fontFamily.appRegular,
    fontSize: 12,
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
    height: 240,
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
