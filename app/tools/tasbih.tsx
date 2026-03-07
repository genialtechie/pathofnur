import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Pressable,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import Ionicons from "@expo/vector-icons/Ionicons";

import { EventName, track, trackScreenView } from "@/src/lib/analytics/track";
import {
  TASBIH_LOOP_LENGTH,
  createEmptyTasbihHistoryState,
  createIncrementedTasbihHistoryState,
  createResetTasbihHistoryState,
  getTasbihHistorySnapshot,
  loadTasbihHistoryState,
  persistTasbihHistoryState,
  type TasbihHistoryState,
} from "@/src/store/tasbih-history";
import { fontFamily, radii, spacing, useTheme } from "@/src/theme";

const LOOP_LENGTH = TASBIH_LOOP_LENGTH;
const NUMBER_FORMATTER = new Intl.NumberFormat("en-US");

export default function TasbihScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => createStyles(colors, isDark), [colors, isDark]);
  const [historyState, setHistoryState] = useState<TasbihHistoryState>(() => createEmptyTasbihHistoryState());
  const [isLoaded, setIsLoaded] = useState(false);
  const [isResetArmed, setIsResetArmed] = useState(false);

  const pulseScale = useRef(new Animated.Value(1)).current;
  const ringScale = useRef(new Animated.Value(1)).current;
  const rippleOpacity = useRef(new Animated.Value(0)).current;
  const rippleScale = useRef(new Animated.Value(0.84)).current;
  const ambientGlow = useRef(new Animated.Value(0)).current;
  const burstGlowOpacity = useRef(new Animated.Value(0)).current;
  const burstGlowScale = useRef(new Animated.Value(0.88)).current;

  useEffect(() => {
    void trackScreenView("tools_tasbih");

    let isActive = true;
    void loadTasbihHistoryState().then((savedState) => {
      if (!isActive) return;
      setHistoryState(savedState);
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

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(ambientGlow, {
          toValue: 1,
          duration: 2200,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(ambientGlow, {
          toValue: 0,
          duration: 2200,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );

    animation.start();

    return () => {
      animation.stop();
    };
  }, [ambientGlow]);

  const ringSize = Math.min(width - spacing.xl * 2, 340);
  const beadSize = Math.max(10, Math.round(ringSize * 0.034));
  const beadRadius = ringSize / 2 - beadSize * 1.9;
  const historySnapshot = useMemo(() => getTasbihHistorySnapshot(historyState), [historyState]);
  const count = historySnapshot.activeCount;
  const loopProgress = historySnapshot.activeLoopProgress;
  const completedLoops = historySnapshot.activeCompletedLoops;
  const formattedCount = NUMBER_FORMATTER.format(count);
  const formattedLoops = NUMBER_FORMATTER.format(completedLoops);
  const tapHint = !isLoaded ? "Loading your saved total..." : count === 0 ? "Tap to begin" : "Tap to continue";
  const loopCaption =
    !isLoaded
      ? "Loading your saved tasbih."
      : completedLoops === 0
        ? "No completed loops yet"
        : completedLoops === 1
          ? "1 completed loop"
          : `${formattedLoops} completed loops`;

  const ambientGlowOpacity = ambientGlow.interpolate({
    inputRange: [0, 1],
    outputRange: [0.14, 0.28],
  });
  const ambientGlowScale = ambientGlow.interpolate({
    inputRange: [0, 1],
    outputRange: [0.94, 1.08],
  });

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

  const animateTap = useCallback(
    (didCompleteLoop: boolean) => {
      pulseScale.setValue(0.97);
      ringScale.setValue(0.988);
      rippleOpacity.setValue(didCompleteLoop ? 0.45 : 0.3);
      rippleScale.setValue(0.84);
      burstGlowOpacity.setValue(didCompleteLoop ? 0.44 : 0.22);
      burstGlowScale.setValue(0.88);

      Animated.parallel([
        Animated.sequence([
          Animated.timing(pulseScale, {
            toValue: didCompleteLoop ? 1.08 : 1.05,
            duration: 140,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.spring(pulseScale, {
            toValue: 1,
            friction: 5,
            tension: 90,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(ringScale, {
            toValue: 1.01,
            duration: 160,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.spring(ringScale, {
            toValue: 1,
            friction: 6,
            tension: 90,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(rippleOpacity, {
            toValue: 0,
            duration: didCompleteLoop ? 520 : 360,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(rippleScale, {
            toValue: didCompleteLoop ? 1.34 : 1.2,
            duration: didCompleteLoop ? 520 : 360,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(burstGlowOpacity, {
            toValue: 0,
            duration: didCompleteLoop ? 760 : 420,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(burstGlowScale, {
            toValue: didCompleteLoop ? 1.3 : 1.14,
            duration: didCompleteLoop ? 760 : 420,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
        ]),
      ]).start();
    },
    [burstGlowOpacity, burstGlowScale, pulseScale, ringScale, rippleOpacity, rippleScale]
  );

  const handleTap = useCallback(() => {
    const nextHistoryState = createIncrementedTasbihHistoryState(historyState);
    const nextCount = nextHistoryState.activeCount;
    const didCompleteLoop = nextCount % LOOP_LENGTH === 0;

    if (count === 0) {
      void track(EventName.TOOLS_TASBIH_STARTED, {}, "tools_tasbih");
    }

    setHistoryState(nextHistoryState);
    setIsResetArmed(false);
    animateTap(didCompleteLoop);
    void persistTasbihHistoryState(nextHistoryState);
    void Haptics.impactAsync(didCompleteLoop ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Light);

    if (didCompleteLoop) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      void track(
        EventName.TOOLS_TASBIH_COMPLETED,
        {
          count: nextCount,
          dhikr_type: "default",
        },
        "tools_tasbih"
      );
    }
  }, [animateTap, count, historyState]);

  const handleResetPress = useCallback(() => {
    if (count === 0) return;

    if (!isResetArmed) {
      setIsResetArmed(true);
      void Haptics.selectionAsync();
      return;
    }

    const nextHistoryState = createResetTasbihHistoryState(historyState);
    setHistoryState(nextHistoryState);
    setIsResetArmed(false);
    void persistTasbihHistoryState(nextHistoryState);
    void track(EventName.TOOLS_TASBIH_RESET, {}, "tools_tasbih");
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  }, [count, historyState, isResetArmed]);

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      <View style={styles.header}>
        <Pressable accessibilityRole="button" hitSlop={18} onPress={() => router.back()} style={styles.headerButton}>
          <Ionicons name="arrow-back" size={22} color={colors.text.primary} />
        </Pressable>
        <Text style={styles.headerTitle}>Tasbih</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.stageMeta}>
        <View style={styles.loopsPill}>
          <Text style={styles.loopsPillLabel}>Loops</Text>
          <Text style={styles.loopsPillValue}>{formattedLoops}</Text>
        </View>
      </View>

      <Pressable accessibilityRole="button" onPress={handleTap} style={styles.stage}>
        <Animated.View
          style={[
            styles.ringShell,
            {
              width: ringSize,
              height: ringSize,
              borderRadius: ringSize / 2,
              transform: [{ scale: ringScale }],
            },
          ]}
        >
          <View
            style={[
              styles.ringGuide,
              {
                width: ringSize * 0.84,
                height: ringSize * 0.84,
                borderRadius: (ringSize * 0.84) / 2,
              },
            ]}
          />

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
                    backgroundColor: isActive ? colors.brand.metallicGold : isDark ? "rgba(255,255,255,0.08)" : "rgba(17,24,39,0.08)",
                    opacity: isActive ? 1 : 0.56,
                  },
                ]}
              />
            );
          })}

          <Animated.View
            pointerEvents="none"
            style={[
              styles.ambientHalo,
              {
                opacity: ambientGlowOpacity,
                transform: [{ scale: ambientGlowScale }],
              },
            ]}
          />

          <Animated.View
            pointerEvents="none"
            style={[
              styles.burstHalo,
              {
                opacity: burstGlowOpacity,
                transform: [{ scale: burstGlowScale }],
              },
            ]}
          />

          <Animated.View
            pointerEvents="none"
            style={[
              styles.ripple,
              {
                opacity: rippleOpacity,
                transform: [{ scale: rippleScale }],
              },
            ]}
          />

          <Animated.View style={[styles.coreOrb, { transform: [{ scale: pulseScale }] }]}>
            <Text style={styles.coreEyebrow}>Total</Text>
            <Text style={styles.coreCount}>{formattedCount}</Text>
            <Text adjustsFontSizeToFit minimumFontScale={0.9} numberOfLines={2} style={styles.coreHint}>
              {tapHint}
            </Text>
          </Animated.View>
        </Animated.View>
      </Pressable>

      <View style={styles.footer}>
        <Text style={styles.loopCaption}>{loopCaption}</Text>

        <Pressable
          accessibilityRole="button"
          disabled={count === 0}
          onPress={handleResetPress}
          style={({ pressed }) => [
            styles.resetButton,
            isResetArmed && styles.resetButtonArmed,
            count === 0 && styles.resetButtonDisabled,
            pressed && count > 0 && styles.resetButtonPressed,
          ]}
        >
          <Ionicons
            name={isResetArmed ? "alert-circle" : "refresh"}
            size={18}
            color={count === 0 ? colors.text.tertiary : isResetArmed ? colors.brand.metallicGold : colors.text.primary}
          />
          <Text
            style={[
              styles.resetButtonLabel,
              count === 0 && styles.resetButtonLabelDisabled,
              isResetArmed && styles.resetButtonLabelArmed,
            ]}
          >
            {isResetArmed ? "Tap again to reset" : "Reset to zero"}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

type ThemeColors = ReturnType<typeof useTheme>["colors"];

const createStyles = (colors: ThemeColors, isDark: boolean) =>
  StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface.background,
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
    backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "rgba(17,24,39,0.04)",
  },
  headerTitle: {
    color: colors.text.primary,
    fontFamily: fontFamily.appBold,
    fontSize: 20,
  },
  headerSpacer: {
    width: 42,
    height: 42,
  },
  stageMeta: {
    alignItems: "center",
    paddingBottom: spacing.md,
  },
  loopsPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
    backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(17,24,39,0.04)",
    borderWidth: 1,
    borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(17,24,39,0.08)",
  },
  loopsPillLabel: {
    color: colors.text.tertiary,
    fontFamily: fontFamily.appRegular,
    fontSize: 12,
  },
  loopsPillValue: {
    color: colors.text.primary,
    fontFamily: fontFamily.appSemiBold,
    fontSize: 14,
    fontVariant: ["tabular-nums"],
  },
  stage: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  ringShell: {
    alignItems: "center",
    justifyContent: "center",
  },
  ringGuide: {
    position: "absolute",
    borderWidth: 1,
    borderColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(17,24,39,0.06)",
  },
  bead: {
    position: "absolute",
  },
  ambientHalo: {
    position: "absolute",
    width: "64%",
    height: "64%",
    borderRadius: 999,
    backgroundColor: "rgba(197, 160, 33, 0.34)",
  },
  burstHalo: {
    position: "absolute",
    width: "68%",
    height: "68%",
    borderRadius: 999,
    backgroundColor: "rgba(197, 160, 33, 0.26)",
  },
  ripple: {
    position: "absolute",
    width: "74%",
    height: "74%",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(197, 160, 33, 0.55)",
  },
  coreOrb: {
    width: "64%",
    aspectRatio: 1,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface.card,
    borderWidth: 1,
    borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(17,24,39,0.08)",
    gap: spacing.xs,
  },
  coreEyebrow: {
    color: colors.brand.metallicGold,
    fontFamily: fontFamily.appSemiBold,
    fontSize: 12,
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  coreCount: {
    color: colors.text.primary,
    fontFamily: fontFamily.appBold,
    fontSize: 76,
    lineHeight: 82,
    fontVariant: ["tabular-nums"],
  },
  coreHint: {
    color: colors.text.tertiary,
    fontFamily: fontFamily.appRegular,
    fontSize: 13,
    lineHeight: 17,
    maxWidth: "72%",
    paddingHorizontal: spacing.sm,
    textAlign: "center",
  },
  footer: {
    alignItems: "center",
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  loopCaption: {
    color: colors.text.secondary,
    fontFamily: fontFamily.appRegular,
    fontSize: 14,
  },
  resetButton: {
    minWidth: 180,
    minHeight: 52,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    backgroundColor: colors.surface.card,
    borderWidth: 1,
    borderColor: colors.surface.borderInteractive,
  },
  resetButtonArmed: {
    borderColor: colors.brand.metallicGold,
    backgroundColor: isDark ? "rgba(197,160,33,0.1)" : "rgba(197,160,33,0.14)",
  },
  resetButtonDisabled: {
    borderColor: colors.surface.border,
  },
  resetButtonPressed: {
    opacity: 0.92,
  },
  resetButtonLabel: {
    color: colors.text.primary,
    fontFamily: fontFamily.appSemiBold,
    fontSize: 14,
  },
  resetButtonLabelDisabled: {
    color: colors.text.tertiary,
  },
  resetButtonLabelArmed: {
    color: colors.brand.metallicGold,
  },
});
