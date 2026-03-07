import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Pressable,
  SafeAreaView,
  Share,
  StatusBar,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Ionicons from "@expo/vector-icons/Ionicons";

import { EventName, track, trackScreenView } from "@/src/lib/analytics/track";
import { fontFamily, radii, spacing } from "@/src/theme";
import { darkColors } from "@/src/theme/tokens";

const TASBIH_STATE_KEY = "@pathofnur/tasbih_state_v2";
const LEGACY_TASBIH_KEY = "tasbih_count";
const LOOP_LENGTH = 33;

const DHIKR_OPTIONS = [
  { id: "subhanallah", label: "SubhanAllah", shareLabel: "SubhanAllah" },
  { id: "alhamdulillah", label: "Alhamdulillah", shareLabel: "Alhamdulillah" },
  { id: "allahuakbar", label: "Allahu Akbar", shareLabel: "Allahu Akbar" },
] as const;

type DhikrId = (typeof DHIKR_OPTIONS)[number]["id"];

type TasbihState = {
  count: number;
  selectedDhikr: DhikrId;
};

const DEFAULT_STATE: TasbihState = {
  count: 0,
  selectedDhikr: "subhanallah",
};

async function loadTasbihState(): Promise<TasbihState> {
  try {
    const stored = await AsyncStorage.getItem(TASBIH_STATE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as Partial<TasbihState>;
      const count = typeof parsed.count === "number" && Number.isFinite(parsed.count) ? parsed.count : 0;
      const selectedDhikr = DHIKR_OPTIONS.some((option) => option.id === parsed.selectedDhikr)
        ? (parsed.selectedDhikr as DhikrId)
        : DEFAULT_STATE.selectedDhikr;
      return { count, selectedDhikr };
    }

    const legacyCount = await AsyncStorage.getItem(LEGACY_TASBIH_KEY);
    const parsedLegacy = legacyCount ? Number.parseInt(legacyCount, 10) : 0;
    return {
      count: Number.isFinite(parsedLegacy) ? parsedLegacy : 0,
      selectedDhikr: DEFAULT_STATE.selectedDhikr,
    };
  } catch {
    return DEFAULT_STATE;
  }
}

async function persistTasbihState(state: TasbihState): Promise<void> {
  await AsyncStorage.multiSet([
    [TASBIH_STATE_KEY, JSON.stringify(state)],
    [LEGACY_TASBIH_KEY, String(state.count)],
  ]);
}

export default function TasbihScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [count, setCount] = useState(0);
  const [selectedDhikr, setSelectedDhikr] = useState<DhikrId>(DEFAULT_STATE.selectedDhikr);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isResetArmed, setIsResetArmed] = useState(false);

  const pulseScale = useRef(new Animated.Value(1)).current;
  const rippleOpacity = useRef(new Animated.Value(0)).current;
  const rippleScale = useRef(new Animated.Value(0.82)).current;

  useEffect(() => {
    void trackScreenView("tools_tasbih");

    let isActive = true;
    void loadTasbihState().then((state) => {
      if (!isActive) return;
      setCount(state.count);
      setSelectedDhikr(state.selectedDhikr);
      setIsLoaded(true);
    });

    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    if (!isResetArmed) return;

    const timeout = setTimeout(() => {
      setIsResetArmed(false);
    }, 2200);

    return () => clearTimeout(timeout);
  }, [isResetArmed]);

  const ringSize = Math.min(width - spacing.xl * 2, 340);
  const beadSize = Math.max(8, Math.round(ringSize * 0.032));
  const beadRadius = ringSize / 2 - beadSize * 1.8;
  const loopProgress = count === 0 ? 0 : ((count - 1) % LOOP_LENGTH) + 1;
  const completedLoops = Math.floor(count / LOOP_LENGTH);
  const nextMilestone = count === 0 ? LOOP_LENGTH : LOOP_LENGTH - (count % LOOP_LENGTH || LOOP_LENGTH);
  const selectedDhikrMeta = DHIKR_OPTIONS.find((option) => option.id === selectedDhikr) ?? DHIKR_OPTIONS[0];

  const beadPositions = useMemo(
    () =>
      Array.from({ length: LOOP_LENGTH }, (_, index) => {
        const angle = (index / LOOP_LENGTH) * Math.PI * 2 - Math.PI / 2;
        return {
          index,
          left: ringSize / 2 + Math.cos(angle) * beadRadius - beadSize / 2,
          top: ringSize / 2 + Math.sin(angle) * beadRadius - beadSize / 2,
        };
      }),
    [beadRadius, beadSize, ringSize]
  );

  const animateTap = useCallback(() => {
    pulseScale.setValue(0.96);
    rippleOpacity.setValue(0.32);
    rippleScale.setValue(0.82);

    Animated.parallel([
      Animated.sequence([
        Animated.timing(pulseScale, {
          toValue: 1.06,
          duration: 130,
          useNativeDriver: true,
        }),
        Animated.spring(pulseScale, {
          toValue: 1,
          friction: 5,
          tension: 90,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(rippleOpacity, {
          toValue: 0,
          duration: 320,
          useNativeDriver: true,
        }),
        Animated.timing(rippleScale, {
          toValue: 1.18,
          duration: 320,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, [pulseScale, rippleOpacity, rippleScale]);

  const handleTap = useCallback(() => {
    const nextCount = count + 1;

    if (count === 0) {
      void track(EventName.TOOLS_TASBIH_STARTED, {}, "tools_tasbih");
    }

    setCount(nextCount);
    setIsResetArmed(false);
    animateTap();
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    void persistTasbihState({ count: nextCount, selectedDhikr });

    if (nextCount % LOOP_LENGTH === 0) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      void track(
        EventName.TOOLS_TASBIH_COMPLETED,
        {
          count: nextCount,
          dhikr_type: selectedDhikr,
        },
        "tools_tasbih"
      );
    }
  }, [animateTap, count, selectedDhikr]);

  const handleDhikrChange = useCallback(
    (nextDhikr: DhikrId) => {
      setSelectedDhikr(nextDhikr);
      if (isLoaded) {
        void persistTasbihState({ count, selectedDhikr: nextDhikr });
      }
      void Haptics.selectionAsync();
    },
    [count, isLoaded]
  );

  const handleResetPress = useCallback(() => {
    if (count === 0) return;

    if (!isResetArmed) {
      setIsResetArmed(true);
      void Haptics.selectionAsync();
      return;
    }

    setCount(0);
    setIsResetArmed(false);
    void persistTasbihState({ count: 0, selectedDhikr });
    void track(EventName.TOOLS_TASBIH_RESET, {}, "tools_tasbih");
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  }, [count, isResetArmed, selectedDhikr]);

  const handleShare = useCallback(async () => {
    if (count === 0) return;

    await Share.share({
      message: `I just completed ${count} tasbih taps in Path of Nur with ${selectedDhikrMeta.shareLabel}. ${completedLoops > 0 ? `${completedLoops} full 33-bead loops down.` : "Starting a new loop."}`,
    });
  }, [completedLoops, count, selectedDhikrMeta.shareLabel]);

  const readinessCopy = isLoaded ? `${nextMilestone} taps to the next 33-bead glow.` : "Loading your saved loop...";

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="light-content" />

      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.headerButton} hitSlop={18}>
          <Ionicons name="arrow-back" size={22} color={darkColors.text.primary} />
        </Pressable>
        <View style={styles.headerCopy}>
          <Text style={styles.headerEyebrow}>Tasbih Flow</Text>
          <Text style={styles.headerTitle}>Keep the loop alive</Text>
        </View>
        <Pressable onPress={() => void handleShare()} style={styles.headerButton} hitSlop={18} disabled={count === 0}>
          <Ionicons
            name="share-outline"
            size={22}
            color={count === 0 ? darkColors.text.tertiary : darkColors.text.primary}
          />
        </Pressable>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Total</Text>
          <Text style={styles.statValue}>{count}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Loops</Text>
          <Text style={styles.statValue}>{completedLoops}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Dhikr</Text>
          <Text style={styles.statValueSmall}>{selectedDhikrMeta.label}</Text>
        </View>
      </View>

      <Pressable style={styles.stage} onPress={handleTap}>
        <View style={[styles.ringShell, { width: ringSize, height: ringSize, borderRadius: ringSize / 2 }]}>
          {beadPositions.map((bead) => {
            const isActive = bead.index < loopProgress;
            return (
              <View
                key={bead.index}
                style={[
                  styles.bead,
                  {
                    width: beadSize,
                    height: beadSize,
                    borderRadius: beadSize / 2,
                    left: bead.left,
                    top: bead.top,
                    backgroundColor: isActive ? darkColors.brand.metallicGold : "rgba(255,255,255,0.08)",
                    opacity: isActive ? 1 : 0.6,
                  },
                ]}
              />
            );
          })}

          <Animated.View
            pointerEvents="none"
            style={[
              styles.ripple,
              {
                transform: [{ scale: rippleScale }],
                opacity: rippleOpacity,
              },
            ]}
          />

          <Animated.View style={[styles.coreOrb, { transform: [{ scale: pulseScale }] }]}>
            <Text style={styles.coreCount}>{count}</Text>
            <Text style={styles.coreLabel}>Tap anywhere to count</Text>
          </Animated.View>
        </View>
      </Pressable>

      <View style={styles.footerPanel}>
        <Text style={styles.footerLead}>{readinessCopy}</Text>
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${(loopProgress / LOOP_LENGTH) * 100}%`,
              },
            ]}
          />
        </View>

        <View style={styles.selectorRow}>
          {DHIKR_OPTIONS.map((option) => {
            const isSelected = option.id === selectedDhikr;
            return (
              <Pressable
                key={option.id}
                onPress={() => handleDhikrChange(option.id)}
                style={[styles.selectorChip, isSelected && styles.selectorChipActive]}
              >
                <Text style={[styles.selectorLabel, isSelected && styles.selectorLabelActive]}>{option.label}</Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.actionRow}>
          <Pressable style={[styles.actionButton, styles.secondaryAction]} onPress={handleResetPress} disabled={count === 0}>
            <Ionicons
              name={isResetArmed ? "alert-circle" : "refresh"}
              size={18}
              color={count === 0 ? darkColors.text.tertiary : darkColors.text.primary}
            />
            <Text style={[styles.actionLabel, count === 0 && styles.actionLabelMuted]}>
              {isResetArmed ? "Tap again to reset" : "Reset to zero"}
            </Text>
          </Pressable>

          <Pressable style={[styles.actionButton, styles.primaryAction]} onPress={() => void handleShare()} disabled={count === 0}>
            <Ionicons name="share-social" size={18} color={darkColors.text.onAccent} />
            <Text style={[styles.actionLabel, styles.primaryActionLabel]}>Share this run</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: darkColors.surface.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  headerButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  headerCopy: {
    alignItems: "center",
    gap: 2,
  },
  headerEyebrow: {
    color: darkColors.brand.metallicGold,
    fontFamily: fontFamily.appSemiBold,
    fontSize: 12,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  headerTitle: {
    color: darkColors.text.primary,
    fontFamily: fontFamily.appBold,
    fontSize: 20,
  },
  statsRow: {
    flexDirection: "row",
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
  },
  statCard: {
    flex: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.lg,
    backgroundColor: darkColors.surface.card,
    borderWidth: 1,
    borderColor: darkColors.surface.borderInteractive,
    alignItems: "center",
    gap: 2,
  },
  statLabel: {
    color: darkColors.text.tertiary,
    fontFamily: fontFamily.appRegular,
    fontSize: 12,
  },
  statValue: {
    color: darkColors.text.primary,
    fontFamily: fontFamily.appBold,
    fontSize: 28,
    fontVariant: ["tabular-nums"],
  },
  statValueSmall: {
    color: darkColors.text.primary,
    fontFamily: fontFamily.appSemiBold,
    fontSize: 14,
    textAlign: "center",
  },
  stage: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
  },
  ringShell: {
    alignItems: "center",
    justifyContent: "center",
  },
  bead: {
    position: "absolute",
  },
  ripple: {
    position: "absolute",
    width: "66%",
    height: "66%",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: darkColors.brand.metallicGold,
  },
  coreOrb: {
    width: "64%",
    aspectRatio: 1,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: darkColors.surface.card,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.09)",
    shadowColor: "#000",
    shadowOpacity: 0.28,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 18,
    gap: spacing.xs,
  },
  coreCount: {
    color: darkColors.text.primary,
    fontFamily: fontFamily.appBold,
    fontSize: 72,
    fontVariant: ["tabular-nums"],
  },
  coreLabel: {
    color: darkColors.text.tertiary,
    fontFamily: fontFamily.appRegular,
    fontSize: 14,
  },
  footerPanel: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  footerLead: {
    color: darkColors.text.secondary,
    fontFamily: fontFamily.appRegular,
    fontSize: 15,
    textAlign: "center",
  },
  progressTrack: {
    height: 10,
    borderRadius: radii.pill,
    backgroundColor: "rgba(255,255,255,0.08)",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: darkColors.brand.metallicGold,
    borderRadius: radii.pill,
  },
  selectorRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: spacing.sm,
  },
  selectorChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
    backgroundColor: darkColors.surface.card,
    borderWidth: 1,
    borderColor: darkColors.surface.border,
  },
  selectorChipActive: {
    borderColor: darkColors.brand.metallicGold,
    backgroundColor: "rgba(197,160,33,0.14)",
  },
  selectorLabel: {
    color: darkColors.text.secondary,
    fontFamily: fontFamily.appSemiBold,
    fontSize: 13,
  },
  selectorLabelActive: {
    color: darkColors.brand.metallicGold,
  },
  actionRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  actionButton: {
    flex: 1,
    minHeight: 54,
    borderRadius: radii.pill,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  secondaryAction: {
    backgroundColor: darkColors.surface.card,
    borderWidth: 1,
    borderColor: darkColors.surface.borderInteractive,
  },
  primaryAction: {
    backgroundColor: darkColors.brand.metallicGold,
  },
  actionLabel: {
    color: darkColors.text.primary,
    fontFamily: fontFamily.appSemiBold,
    fontSize: 13,
  },
  actionLabelMuted: {
    color: darkColors.text.tertiary,
  },
  primaryActionLabel: {
    color: darkColors.text.onAccent,
  },
});
