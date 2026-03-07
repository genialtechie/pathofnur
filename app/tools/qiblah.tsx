import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Pressable,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import * as Haptics from "expo-haptics";
import { Magnetometer, type MagnetometerMeasurement } from "expo-sensors";
import Svg, { Circle, Defs, LinearGradient, Path, Rect, Stop } from "react-native-svg";

import { EventName, track, trackScreenView } from "@/src/lib/analytics/track";
import { useLocation } from "@/src/lib/location";
import { useQiblah } from "@/src/lib/prayer";
import { fontFamily, radii, spacing, useTheme } from "@/src/theme";

const ALIGNMENT_THRESHOLD = 8;
const MAGNETOMETER_INTERVAL_MS = 120;
const IS_WEB = process.env.EXPO_OS === "web";

type SensorStatus = "loading" | "ready" | "permission-required" | "denied" | "unavailable" | "error";

type WebCompassEvent = DeviceOrientationEvent & {
  webkitCompassHeading?: number | null;
};

type WebDeviceOrientationEvent = typeof DeviceOrientationEvent & {
  requestPermission?: () => Promise<"granted" | "denied">;
};

function normalizeDegrees(value: number): number {
  return ((value % 360) + 360) % 360;
}

function normalizeSignedDegrees(value: number): number {
  const normalized = normalizeDegrees(value);
  return normalized > 180 ? normalized - 360 : normalized;
}

function measurementToHeading({ x, y }: MagnetometerMeasurement): number {
  const angle = (Math.atan2(y, x) * 180) / Math.PI;
  return normalizeDegrees(90 - angle);
}

function webCompassEventToHeading(event: WebCompassEvent): number | null {
  if (typeof event.webkitCompassHeading === "number" && Number.isFinite(event.webkitCompassHeading)) {
    return normalizeDegrees(event.webkitCompassHeading);
  }

  if (typeof event.alpha === "number" && Number.isFinite(event.alpha)) {
    return normalizeDegrees(360 - event.alpha);
  }

  return null;
}

function LockedKaabaMark() {
  return (
    <View style={lockedMarkStyles.shell}>
      <View style={lockedMarkStyles.aura} />
      <View style={lockedMarkStyles.inner}>
        <Svg width={62} height={62} viewBox="0 0 62 62" fill="none">
          <Defs>
            <LinearGradient id="reward-ring" x1="11" y1="10" x2="51" y2="52" gradientUnits="userSpaceOnUse">
              <Stop stopColor="#F3DE88" />
              <Stop offset="0.55" stopColor="#D4AF37" />
              <Stop offset="1" stopColor="#8C6917" />
            </LinearGradient>
            <LinearGradient id="reward-band" x1="17" y1="19" x2="45" y2="23" gradientUnits="userSpaceOnUse">
              <Stop stopColor="#F2D56B" />
              <Stop offset="1" stopColor="#C5A021" />
            </LinearGradient>
            <LinearGradient id="reward-door" x1="27" y1="27" x2="34" y2="40" gradientUnits="userSpaceOnUse">
              <Stop stopColor="#F7E29A" />
              <Stop offset="1" stopColor="#D2AB34" />
            </LinearGradient>
          </Defs>
          <Circle cx="31" cy="31" r="25.5" fill="rgba(197, 160, 33, 0.12)" stroke="url(#reward-ring)" strokeWidth="1.4" />
          <Circle cx="31" cy="31" r="20.5" fill="#09101C" />
          <Path
            d="M44.2 15.4L45.9 18.9L49.8 19.4L46.9 22.1L47.6 25.9L44.2 24.1L40.9 25.9L41.5 22.1L38.6 19.4L42.5 18.9L44.2 15.4Z"
            fill="#F1D368"
            opacity="0.95"
          />
          <Rect x="19" y="20" width="24" height="4.2" rx="1.5" fill="url(#reward-band)" />
          <Rect x="19" y="24" width="24" height="18" rx="3.6" fill="#0D1626" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
          <Path d="M19 29.5H43" stroke="url(#reward-band)" strokeWidth="1.5" opacity="0.92" />
          <Rect x="27.2" y="30.5" width="7.6" height="9.6" rx="1.6" fill="url(#reward-door)" />
        </Svg>
      </View>
    </View>
  );
}

const lockedMarkStyles = StyleSheet.create({
  shell: {
    width: 78,
    height: 78,
    alignItems: "center",
    justifyContent: "center",
  },
  aura: {
    position: "absolute",
    width: 78,
    height: 78,
    borderRadius: 999,
    backgroundColor: "rgba(197, 160, 33, 0.14)",
  },
  inner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(11, 18, 32, 0.94)",
    borderWidth: 1,
    borderColor: "rgba(197, 160, 33, 0.28)",
  },
});

export default function QiblahScreen() {
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => createStyles(colors, isDark), [colors, isDark]);
  const { location, status: locationStatus, refresh } = useLocation();
  const coords = location?.coords;
  const hasLocation = Boolean(coords);
  const cityLabel = location?.city ? `${location.city}${location.country ? `, ${location.country}` : ""}` : "Your saved location";
  const { bearing: qiblahBearing } = useQiblah(coords?.latitude, coords?.longitude);

  const [heading, setHeading] = useState<number | null>(null);
  const [sensorStatus, setSensorStatus] = useState<SensorStatus>("loading");
  const [sensorError, setSensorError] = useState<string | null>(null);
  const [webCompassGranted, setWebCompassGranted] = useState(false);
  const headingRef = useRef<number | null>(null);
  const hasTrackedLock = useRef(false);

  useEffect(() => {
    void trackScreenView("tools_qiblah");
    void track(EventName.TOOLS_QIBLAH_STARTED, {}, "tools_qiblah");
  }, []);

  useEffect(() => {
    let isActive = true;
    let webTimeout: ReturnType<typeof setTimeout> | null = null;
    let removeWebListener: (() => void) | null = null;
    let nativeSubscription: { remove: () => void } | null = null;

    const setWebUnavailable = (message: string) => {
      if (!isActive) return;
      setSensorStatus("unavailable");
      setSensorError(message);
    };

    const attachWebCompass = () => {
      const handleOrientation = (nativeEvent: Event) => {
        const nextHeading = webCompassEventToHeading(nativeEvent as WebCompassEvent);
        if (nextHeading === null || !isActive) return;

        headingRef.current = nextHeading;
        setHeading(nextHeading);
        setSensorStatus("ready");
        setSensorError(null);

        if (webTimeout) {
          clearTimeout(webTimeout);
          webTimeout = null;
        }
      };

      window.addEventListener("deviceorientation", handleOrientation as EventListener);

      removeWebListener = () => {
        window.removeEventListener("deviceorientation", handleOrientation as EventListener);
      };

      webTimeout = setTimeout(() => {
        if (isActive && headingRef.current === null) {
          setWebUnavailable("No live compass data was detected. Use an iPhone or the app for a live heading.");
        }
      }, 2400);
    };

    const startCompass = async () => {
      if (IS_WEB) {
        if (typeof window === "undefined") return;

        const orientationEvent = window.DeviceOrientationEvent as WebDeviceOrientationEvent | undefined;
        if (!orientationEvent) {
          setWebUnavailable("This browser does not expose compass data.");
          return;
        }

        if (typeof orientationEvent.requestPermission === "function" && !webCompassGranted) {
          if (!isActive) return;
          setSensorStatus("permission-required");
          setSensorError("Safari needs motion access before it can read the compass.");
          return;
        }

        if (!isActive) return;
        setSensorStatus("loading");
        setSensorError("Move your phone slowly to start the compass.");
        attachWebCompass();
        return;
      }

      try {
        const available = await Magnetometer.isAvailableAsync();
        if (!available) {
          if (!isActive) return;
          setSensorStatus("unavailable");
          setSensorError("Live compass is not available on this device.");
          return;
        }

        Magnetometer.setUpdateInterval(MAGNETOMETER_INTERVAL_MS);
        nativeSubscription = Magnetometer.addListener((measurement) => {
          if (!isActive) return;
          const nextHeading = measurementToHeading(measurement);
          headingRef.current = nextHeading;
          setHeading(nextHeading);
          setSensorStatus("ready");
          setSensorError(null);
        });
      } catch (error) {
        if (!isActive) return;
        setSensorStatus("error");
        setSensorError(error instanceof Error ? error.message : "Compass failed to start.");
      }
    };

    void startCompass();

    return () => {
      isActive = false;
      nativeSubscription?.remove();
      removeWebListener?.();
      if (webTimeout) clearTimeout(webTimeout);
    };
  }, [webCompassGranted]);

  const signedOffset = useMemo(() => {
    if (heading === null || qiblahBearing === null) return null;
    return normalizeSignedDegrees(qiblahBearing - heading);
  }, [heading, qiblahBearing]);

  const alignmentDelta = signedOffset === null ? null : Math.abs(signedOffset);
  const isLocked = alignmentDelta !== null && alignmentDelta <= ALIGNMENT_THRESHOLD;
  const dialSize = Math.max(240, Math.min(width - spacing.xl * 2, height * 0.42, 340));
  const pointerRotation = signedOffset ?? qiblahBearing ?? 0;
  const centerValue =
    alignmentDelta === null ? (qiblahBearing === null ? "--" : `${Math.round(qiblahBearing)}°`) : `${Math.round(alignmentDelta)}°`;
  const centerLabel = alignmentDelta === null ? "from north" : isLocked ? "aligned" : "off target";
  const sensorStatusLabel =
    sensorStatus === "ready"
      ? "Live"
      : sensorStatus === "permission-required"
        ? "Enable"
        : sensorStatus === "denied"
          ? "Denied"
          : sensorStatus === "loading"
            ? "Starting"
            : sensorStatus === "unavailable"
              ? "Unavailable"
              : "Error";

  useEffect(() => {
    if (!isLocked || hasTrackedLock.current) return;

    hasTrackedLock.current = true;
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    void track(EventName.TOOLS_QIBLAH_COMPLETED, { accuracy_meters: undefined }, "tools_qiblah");
  }, [isLocked]);

  const directionText =
    !hasLocation || qiblahBearing === null
      ? "Location needed"
      : sensorStatus === "permission-required"
        ? "Enable compass access"
        : sensorStatus === "denied"
          ? "Compass access denied"
          : sensorStatus === "unavailable"
            ? "Live compass unavailable"
            : sensorStatus === "error"
              ? "Compass unavailable"
              : heading === null
                ? "Finding your heading"
                : isLocked
                  ? "Qiblah aligned"
                  : signedOffset !== null && signedOffset > 0
                    ? `Turn ${Math.round(Math.abs(signedOffset))}° right`
                    : `Turn ${Math.round(Math.abs(signedOffset ?? 0))}° left`;

  const feedbackBody =
    !hasLocation || qiblahBearing === null
      ? locationStatus === "loading"
        ? "Loading your saved coordinates."
        : "Give Path of Nur a location so the qiblah can be calculated from where you are."
      : sensorStatus === "permission-required"
        ? "Safari on iPhone requires motion access before it can read your heading."
        : sensorStatus === "denied"
          ? "Motion access was denied. Enable Motion & Orientation Access in Safari settings and try again."
          : sensorStatus === "unavailable"
            ? `The bearing is still calculated from ${cityLabel}, but this browser is not providing a live compass.`
            : sensorStatus === "error"
              ? sensorError ?? "Compass failed to start."
              : heading === null
                ? "Hold the phone flat and move slowly while the compass settles."
                : `Qiblah bearing ${Math.round(qiblahBearing)}°. Your heading ${Math.round(heading)}°.`;
  const lockedBody = hasLocation ? `Aligned toward the Kaaba from ${cityLabel}.` : feedbackBody;

  const handleEnableCompass = useCallback(async () => {
    if (!IS_WEB || typeof window === "undefined") return;

    const orientationEvent = window.DeviceOrientationEvent as WebDeviceOrientationEvent | undefined;
    if (!orientationEvent) {
      setSensorStatus("unavailable");
      setSensorError("This browser does not expose compass data.");
      return;
    }

    try {
      if (typeof orientationEvent.requestPermission === "function") {
        const permission = await orientationEvent.requestPermission();
        if (permission !== "granted") {
          setSensorStatus("denied");
          setSensorError("Motion access was denied. Enable it in Safari settings and try again.");
          return;
        }
      }

      setSensorStatus("loading");
      setSensorError("Move your phone slowly to start the compass.");
      setWebCompassGranted(true);
    } catch (error) {
      setSensorStatus("error");
      setSensorError(error instanceof Error ? error.message : "Compass permission failed.");
    }
  }, []);

  const ticks = useMemo(
    () =>
      Array.from({ length: 24 }, (_, index) => {
        const rotation = `${index * 15}deg`;
        const isMajor = index % 6 === 0;
        return (
          <View key={index} style={[styles.tickWrap, { transform: [{ rotate: rotation }] }]}> 
            <View style={[styles.tick, isMajor && styles.tickMajor]} />
          </View>
        );
      }),
    []
  );

  const showCompassButton = hasLocation && (sensorStatus === "permission-required" || sensorStatus === "denied");
  const showRefreshLocation = !hasLocation && locationStatus !== "loading";

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      <View style={styles.header}>
        <Pressable accessibilityRole="button" hitSlop={18} onPress={() => router.back()} style={styles.headerButton}>
          <Ionicons name="arrow-back" size={22} color={colors.text.primary} />
        </Pressable>
        <Text style={styles.headerTitle}>Qiblah</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.metaRow}>
        <View style={styles.metaItem}>
          <Ionicons name="location-outline" size={14} color={colors.text.tertiary} />
          <Text numberOfLines={1} style={styles.metaText}>
            {hasLocation ? cityLabel : "Needs location"}
          </Text>
        </View>
        <View style={styles.metaItem}>
          <Ionicons name="compass-outline" size={14} color={colors.text.tertiary} />
          <Text style={styles.metaText}>{sensorStatusLabel}</Text>
        </View>
      </View>

      <View style={styles.stage}>
        {hasLocation && qiblahBearing !== null ? (
          <>
            <View style={[styles.dialShell, { width: dialSize, height: dialSize, borderRadius: dialSize / 2 }]}>
              <View style={styles.dialGlow} />
              <View
                style={[
                  styles.dialLayer,
                  {
                    transform: [{ rotate: `${heading === null ? 0 : -heading}deg` }],
                  },
                ]}
              >
                {ticks}
                <Text style={[styles.cardinalLabel, styles.cardinalNorth]}>N</Text>
                <Text style={[styles.cardinalLabel, styles.cardinalEast]}>E</Text>
                <Text style={[styles.cardinalLabel, styles.cardinalSouth]}>S</Text>
                <Text style={[styles.cardinalLabel, styles.cardinalWest]}>W</Text>
              </View>

              <View style={styles.topMarker} />

              <View
                style={[
                  styles.pointerWrap,
                  {
                    transform: [{ rotate: `${pointerRotation}deg` }],
                  },
                ]}
              >
                <View style={[styles.pointerStem, isLocked && styles.pointerStemLocked]} />
                <View style={[styles.pointerHead, isLocked && styles.pointerHeadLocked]} />
              </View>

              <View style={styles.centerOrb}>
                <Text style={styles.centerValue}>{centerValue}</Text>
                <Text style={styles.centerLabel}>{centerLabel}</Text>
              </View>
            </View>

            <View style={styles.feedbackPanel}>
              {isLocked ? (
                <>
                  <LockedKaabaMark />
                  <Text style={styles.lockedCaption}>Qiblah aligned</Text>
                </>
              ) : (
                <Text style={styles.feedbackTitle}>{directionText}</Text>
              )}
              <Text style={styles.feedbackBody}>{isLocked ? lockedBody : feedbackBody}</Text>
            </View>
          </>
        ) : (
          <View style={styles.errorPanel}>
            <Ionicons name="location-outline" size={54} color={colors.text.tertiary} />
            <Text style={styles.errorTitle}>
              {locationStatus === "loading" ? "Loading location" : "Location needed for qiblah"}
            </Text>
            <Text style={styles.errorBody}>{feedbackBody}</Text>
          </View>
        )}
      </View>

      <View style={styles.bottomPanel}>
        <View style={styles.readoutCard}>
          <Text style={styles.readoutLabel}>Note</Text>
          <Text style={styles.readoutValue}>
            {sensorError ?? "Hold your phone flat and rotate slowly for the steadiest heading."}
          </Text>
        </View>

        {showCompassButton || showRefreshLocation ? (
          <View style={styles.actionRow}>
            {showCompassButton ? (
              <Pressable accessibilityRole="button" onPress={() => void handleEnableCompass()} style={styles.primaryButton}>
                <Text style={styles.primaryButtonLabel}>{sensorStatus === "denied" ? "Try again" : "Enable compass"}</Text>
              </Pressable>
            ) : null}

            {showRefreshLocation ? (
              <Pressable accessibilityRole="button" onPress={() => void refresh()} style={styles.secondaryButton}>
                <Text style={styles.secondaryButtonLabel}>Refresh location</Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}
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
  metaRow: {
    flexDirection: "row",
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xs,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    minWidth: 0,
    flexShrink: 1,
  },
  metaText: {
    color: colors.text.tertiary,
    fontFamily: fontFamily.appRegular,
    fontSize: 12,
    lineHeight: 16,
  },
  stage: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    gap: spacing.md,
  },
  dialShell: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface.card,
    borderWidth: 1,
    borderColor: colors.surface.borderInteractive,
    overflow: "hidden",
  },
  dialGlow: {
    position: "absolute",
    width: "72%",
    height: "72%",
    borderRadius: 999,
    backgroundColor: "rgba(197, 160, 33, 0.12)",
  },
  dialLayer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  tickWrap: {
    position: "absolute",
    width: "100%",
    height: "100%",
    alignItems: "center",
  },
  tick: {
    width: 2,
    height: 10,
    borderRadius: 2,
    backgroundColor: isDark ? "rgba(255,255,255,0.16)" : "rgba(17,24,39,0.12)",
    marginTop: spacing.sm,
  },
  tickMajor: {
    height: 18,
    backgroundColor: isDark ? "rgba(255,255,255,0.36)" : "rgba(17,24,39,0.24)",
  },
  cardinalLabel: {
    position: "absolute",
    color: colors.text.tertiary,
    fontFamily: fontFamily.appSemiBold,
    fontSize: 12,
  },
  cardinalNorth: {
    top: spacing.md,
  },
  cardinalEast: {
    right: spacing.md,
  },
  cardinalSouth: {
    bottom: spacing.md,
  },
  cardinalWest: {
    left: spacing.md,
  },
  topMarker: {
    position: "absolute",
    top: spacing.md,
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: colors.brand.metallicGold,
  },
  pointerWrap: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "flex-start",
    height: "72%",
    width: 28,
  },
  pointerStem: {
    width: 4,
    flex: 1,
    borderRadius: radii.pill,
    backgroundColor: isDark ? "rgba(255,255,255,0.24)" : "rgba(17,24,39,0.2)",
  },
  pointerStemLocked: {
    backgroundColor: "rgba(197, 160, 33, 0.65)",
  },
  pointerHead: {
    width: 0,
    height: 0,
    borderLeftWidth: 14,
    borderRightWidth: 14,
    borderBottomWidth: 34,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderBottomColor: colors.text.primary,
    marginBottom: -2,
  },
  pointerHeadLocked: {
    borderBottomColor: colors.brand.metallicGold,
  },
  centerOrb: {
    width: "42%",
    aspectRatio: 1,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface.background,
    borderWidth: 1,
    borderColor: isDark ? "rgba(255,255,255,0.09)" : "rgba(17,24,39,0.08)",
    gap: 2,
  },
  centerValue: {
    color: colors.text.primary,
    fontFamily: fontFamily.appBold,
    fontSize: 34,
    fontVariant: ["tabular-nums"],
  },
  centerLabel: {
    color: colors.text.tertiary,
    fontFamily: fontFamily.appRegular,
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  feedbackPanel: {
    gap: spacing.xs,
    alignItems: "center",
    maxWidth: 316,
    minHeight: 118,
    justifyContent: "center",
  },
  feedbackTitle: {
    color: colors.text.primary,
    fontFamily: fontFamily.appBold,
    fontSize: 24,
    textAlign: "center",
  },
  feedbackBody: {
    color: colors.text.secondary,
    fontFamily: fontFamily.appRegular,
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },
  lockedCaption: {
    color: colors.brand.metallicGold,
    fontFamily: fontFamily.appSemiBold,
    fontSize: 13,
    letterSpacing: 0.4,
    textTransform: "uppercase",
    marginTop: 2,
  },
  errorPanel: {
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
  },
  errorTitle: {
    color: colors.text.primary,
    fontFamily: fontFamily.appBold,
    fontSize: 24,
    textAlign: "center",
  },
  errorBody: {
    color: colors.text.secondary,
    fontFamily: fontFamily.appRegular,
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
    maxWidth: 300,
  },
  bottomPanel: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
    gap: spacing.sm,
  },
  readoutCard: {
    padding: spacing.md,
    borderRadius: radii.lg,
    backgroundColor: colors.surface.card,
    borderWidth: 1,
    borderColor: colors.surface.border,
    gap: 4,
  },
  readoutLabel: {
    color: colors.brand.metallicGold,
    fontFamily: fontFamily.appSemiBold,
    fontSize: 12,
  },
  readoutValue: {
    color: colors.text.secondary,
    fontFamily: fontFamily.appRegular,
    fontSize: 14,
    lineHeight: 20,
  },
  actionRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  primaryButton: {
    flex: 1,
    minHeight: 52,
    borderRadius: radii.pill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.brand.metallicGold,
    paddingHorizontal: spacing.lg,
  },
  primaryButtonLabel: {
    color: colors.text.onAccent,
    fontFamily: fontFamily.appSemiBold,
    fontSize: 14,
  },
  secondaryButton: {
    flex: 1,
    minHeight: 52,
    borderRadius: radii.pill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface.card,
    borderWidth: 1,
    borderColor: colors.surface.borderInteractive,
    paddingHorizontal: spacing.lg,
  },
  secondaryButtonLabel: {
    color: colors.text.primary,
    fontFamily: fontFamily.appSemiBold,
    fontSize: 14,
  },
});
