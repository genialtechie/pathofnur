import { useCallback, useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  Pressable,
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

type FeatureCardProps = {
  eyebrow: string;
  title: string;
  description: string;
  primaryStat: string;
  secondaryStat: string;
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
  eyebrow,
  title,
  description,
  primaryStat,
  secondaryStat,
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
          <Text style={styles.badgeText}>{eyebrow}</Text>
        </View>
        <View style={styles.playPill}>
          <Text style={styles.playPillText}>{cta}</Text>
        </View>
      </View>

      <View style={styles.featureBody}>
        <Text style={styles.featureTitle}>{title}</Text>
        <Text style={styles.featureDescription}>{description}</Text>
      </View>

      <View style={styles.featureStatsRow}>
        <View style={styles.featureStatCard}>
          <Text style={styles.featureStatLabel}>Now</Text>
          <Text style={styles.featureStatValue}>{primaryStat}</Text>
        </View>
        <View style={styles.featureStatCard}>
          <Text style={styles.featureStatLabel}>Hook</Text>
          <Text style={styles.featureStatValue}>{secondaryStat}</Text>
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

  const completedLoops = Math.floor(tasbihCount / 33);
  const tasbihHook =
    tasbihCount === 0
      ? "33-tap loop"
      : tasbihCount % 33 === 0
        ? "Loop glowing"
        : `${33 - (tasbihCount % 33)} taps to glow`;
  const qiblahReadiness = location?.city ? `${location.city}` : "Set your location";

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.heroPanel}>
          <View style={styles.heroGlowLarge} />
          <View style={styles.heroGlowSmall} />
          <Text style={styles.heroKicker}>Ritual Play</Text>
          <Text style={styles.heroTitle}>Tools that should feel impossible to put down.</Text>
          <Text style={styles.heroDescription}>
            Tap, rotate, lock in, and share the moment. These are no longer utility pages. They are
            short-form spiritual games.
          </Text>

          <View style={styles.heroChipRow}>
            <View style={styles.heroChip}>
              <Text style={styles.heroChipValue}>{tasbihCount}</Text>
              <Text style={styles.heroChipLabel}>saved taps</Text>
            </View>
            <View style={styles.heroChip}>
              <Text style={styles.heroChipValue}>{completedLoops}</Text>
              <Text style={styles.heroChipLabel}>full loops</Text>
            </View>
            <View style={styles.heroChip}>
              <Text style={styles.heroChipValue}>{qiblahReadiness}</Text>
              <Text style={styles.heroChipLabel}>qiblah base</Text>
            </View>
          </View>
        </View>

        <FeatureCard
          eyebrow="Tasbih Flow"
          title="Build momentum with every tap."
          description="A living bead loop with milestones, quick-share moments, and a stronger reset flow."
          primaryStat={tasbihCount > 0 ? `Resume at ${tasbihCount}` : "Fresh start"}
          secondaryStat={tasbihHook}
          cta="Open the loop"
          imageSource={TASBIH_COVER}
          icon="sparkles"
          onPress={() => router.push("/tools/tasbih")}
        />

        <FeatureCard
          eyebrow="Qiblah Lock"
          title="Turn direction into a little challenge."
          description="A compass chase with live alignment feedback, lock-state celebration, and a share-ready readout."
          primaryStat={qiblahReadiness}
          secondaryStat="Rotate until locked"
          cta="Find the line"
          imageSource={QIBLAH_COVER}
          icon="compass"
          onPress={() => router.push("/tools/qiblah")}
        />

        <View style={styles.playbookPanel}>
          <Text style={styles.playbookTitle}>Why this tab matters now</Text>
          <View style={styles.playbookRow}>
            <View style={styles.playbookCard}>
              <Text style={styles.playbookCardTitle}>Fidget-worthy</Text>
              <Text style={styles.playbookCardBody}>Tasbih should reward idle moments with rhythm, progress, and glow.</Text>
            </View>
            <View style={styles.playbookCard}>
              <Text style={styles.playbookCardTitle}>Motion-led</Text>
              <Text style={styles.playbookCardBody}>Qiblah should make you want to keep rotating until the compass locks clean.</Text>
            </View>
            <View style={styles.playbookCard}>
              <Text style={styles.playbookCardTitle}>Share-ready</Text>
              <Text style={styles.playbookCardBody}>Both tools should produce moments that feel worth screenshotting or sending.</Text>
            </View>
          </View>
        </View>
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
  heroPanel: {
    marginHorizontal: spacing.xl,
    padding: spacing.xl,
    borderRadius: radii.xl,
    backgroundColor: darkColors.surface.card,
    borderWidth: 1,
    borderColor: darkColors.surface.borderInteractive,
    overflow: "hidden",
    gap: spacing.sm,
  },
  heroGlowLarge: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 999,
    backgroundColor: "rgba(197, 160, 33, 0.14)",
    top: -90,
    right: -40,
  },
  heroGlowSmall: {
    position: "absolute",
    width: 160,
    height: 160,
    borderRadius: 999,
    backgroundColor: "rgba(44, 82, 146, 0.20)",
    bottom: -70,
    left: -40,
  },
  heroKicker: {
    color: darkColors.brand.metallicGold,
    fontFamily: fontFamily.appSemiBold,
    fontSize: 12,
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  heroTitle: {
    color: darkColors.text.primary,
    fontFamily: fontFamily.appBold,
    fontSize: 32,
    lineHeight: 38,
    maxWidth: "90%",
  },
  heroDescription: {
    color: darkColors.text.secondary,
    fontFamily: fontFamily.appRegular,
    fontSize: 16,
    lineHeight: 23,
    maxWidth: "92%",
  },
  heroChipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  heroChip: {
    minWidth: 92,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.lg,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    gap: 2,
  },
  heroChipValue: {
    color: darkColors.text.primary,
    fontFamily: fontFamily.appSemiBold,
    fontSize: 15,
  },
  heroChipLabel: {
    color: darkColors.text.tertiary,
    fontFamily: fontFamily.appRegular,
    fontSize: 12,
  },
  featureCard: {
    height: 260,
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
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  featureOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(4, 8, 15, 0.56)",
  },
  featureGlow: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 999,
    backgroundColor: "rgba(197, 160, 33, 0.16)",
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
  playPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.pill,
    backgroundColor: "rgba(255,255,255,0.14)",
  },
  playPillText: {
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
    maxWidth: "78%",
  },
  featureDescription: {
    color: darkColors.text.light,
    fontFamily: fontFamily.appRegular,
    fontSize: 15,
    lineHeight: 21,
    maxWidth: "82%",
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
  playbookPanel: {
    marginHorizontal: spacing.xl,
    padding: spacing.lg,
    borderRadius: radii.xl,
    backgroundColor: "rgba(11, 18, 32, 0.78)",
    borderWidth: 1,
    borderColor: darkColors.surface.borderInteractive,
    gap: spacing.md,
  },
  playbookTitle: {
    color: darkColors.text.primary,
    fontFamily: fontFamily.appSemiBold,
    fontSize: 20,
  },
  playbookRow: {
    gap: spacing.sm,
  },
  playbookCard: {
    padding: spacing.md,
    borderRadius: radii.lg,
    backgroundColor: "rgba(255,255,255,0.04)",
    gap: spacing.xxs,
  },
  playbookCardTitle: {
    color: darkColors.brand.metallicGold,
    fontFamily: fontFamily.appSemiBold,
    fontSize: 14,
  },
  playbookCardBody: {
    color: darkColors.text.secondary,
    fontFamily: fontFamily.appRegular,
    fontSize: 14,
    lineHeight: 20,
  },
});
