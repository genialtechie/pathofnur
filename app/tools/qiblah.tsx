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

import { EventName, track, trackScreenView } from "@/src/lib/analytics/track";
import { useLocation } from "@/src/lib/location";
import { useQiblah } from "@/src/lib/prayer";
import { fontFamily, radii, spacing } from "@/src/theme";
import { darkColors } from "@/src/theme/tokens";

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

export default function QiblahScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
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
  const dialSize = Math.min(width - spacing.xl * 2, 340);
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
      <StatusBar barStyle="light-content" />

      <View style={styles.header}>
        <Pressable accessibilityRole="button" hitSlop={18} onPress={() => router.back()} style={styles.headerButton}>
          <Ionicons name="arrow-back" size={22} color={darkColors.text.primary} />
        </Pressable>
        <Text style={styles.headerTitle}>Qiblah</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.metaRow}>
        <View style={styles.metaCard}>
          <Text style={styles.metaLabel}>Location</Text>
          <Text numberOfLines={1} style={styles.metaValue}>{hasLocation ? cityLabel : "Needs location"}</Text>
        </View>
        <View style={styles.metaCard}>
          <Text style={styles.metaLabel}>Compass</Text>
          <Text style={styles.metaValue}>{sensorStatusLabel}</Text>
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
              <Text style={[styles.feedbackTitle, isLocked && styles.feedbackTitleLocked]}>{directionText}</Text>
              <Text style={styles.feedbackBody}>{feedbackBody}</Text>
            </View>
          </>
        ) : (
          <View style={styles.errorPanel}>
            <Ionicons name="location-outline" size={54} color={darkColors.text.tertiary} />
            <Text style={styles.errorTitle}>
              {locationStatus === "loading" ? "Loading location" : "Location needed for qiblah"}
            </Text>
            <Text style={styles.errorBody}>{feedbackBody}</Text>
          </View>
        )}
      </View>

      <View style={styles.bottomPanel}>
        <View style={styles.readoutCard}>
          <Text style={styles.readoutLabel}>Compass note</Text>
          <Text style={styles.readoutValue}>
            {sensorError ?? "Hold your phone flat and rotate slowly for the steadiest heading."}
          </Text>
        </View>

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
  headerTitle: {
    color: darkColors.text.primary,
    fontFamily: fontFamily.appBold,
    fontSize: 20,
  },
  headerSpacer: {
    width: 42,
    height: 42,
  },
  metaRow: {
    flexDirection: "row",
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
  },
  metaCard: {
    flex: 1,
    padding: spacing.md,
    borderRadius: radii.lg,
    backgroundColor: darkColors.surface.card,
    borderWidth: 1,
    borderColor: darkColors.surface.borderInteractive,
    gap: 2,
  },
  metaLabel: {
    color: darkColors.text.tertiary,
    fontFamily: fontFamily.appRegular,
    fontSize: 12,
  },
  metaValue: {
    color: darkColors.text.primary,
    fontFamily: fontFamily.appSemiBold,
    fontSize: 14,
  },
  stage: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
    gap: spacing.lg,
  },
  dialShell: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: darkColors.surface.card,
    borderWidth: 1,
    borderColor: darkColors.surface.borderInteractive,
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
    backgroundColor: "rgba(255,255,255,0.16)",
    marginTop: spacing.sm,
  },
  tickMajor: {
    height: 18,
    backgroundColor: "rgba(255,255,255,0.36)",
  },
  cardinalLabel: {
    position: "absolute",
    color: darkColors.text.tertiary,
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
    backgroundColor: darkColors.brand.metallicGold,
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
    backgroundColor: "rgba(255,255,255,0.24)",
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
    borderBottomColor: darkColors.text.primary,
    marginBottom: -2,
  },
  pointerHeadLocked: {
    borderBottomColor: darkColors.brand.metallicGold,
  },
  centerOrb: {
    width: "42%",
    aspectRatio: 1,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: darkColors.surface.background,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.09)",
    gap: 2,
  },
  centerValue: {
    color: darkColors.text.primary,
    fontFamily: fontFamily.appBold,
    fontSize: 34,
    fontVariant: ["tabular-nums"],
  },
  centerLabel: {
    color: darkColors.text.tertiary,
    fontFamily: fontFamily.appRegular,
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  feedbackPanel: {
    gap: spacing.xs,
    alignItems: "center",
    maxWidth: 320,
  },
  feedbackTitle: {
    color: darkColors.text.primary,
    fontFamily: fontFamily.appBold,
    fontSize: 28,
    textAlign: "center",
  },
  feedbackTitleLocked: {
    color: darkColors.brand.metallicGold,
  },
  feedbackBody: {
    color: darkColors.text.secondary,
    fontFamily: fontFamily.appRegular,
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
  },
  errorPanel: {
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
  },
  errorTitle: {
    color: darkColors.text.primary,
    fontFamily: fontFamily.appBold,
    fontSize: 24,
    textAlign: "center",
  },
  errorBody: {
    color: darkColors.text.secondary,
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
    backgroundColor: darkColors.surface.card,
    borderWidth: 1,
    borderColor: darkColors.surface.border,
    gap: 4,
  },
  readoutLabel: {
    color: darkColors.brand.metallicGold,
    fontFamily: fontFamily.appSemiBold,
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  readoutValue: {
    color: darkColors.text.secondary,
    fontFamily: fontFamily.appRegular,
    fontSize: 14,
    lineHeight: 20,
  },
  primaryButton: {
    minHeight: 52,
    borderRadius: radii.pill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: darkColors.brand.metallicGold,
    paddingHorizontal: spacing.lg,
  },
  primaryButtonLabel: {
    color: darkColors.text.onAccent,
    fontFamily: fontFamily.appSemiBold,
    fontSize: 14,
  },
  secondaryButton: {
    minHeight: 52,
    borderRadius: radii.pill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: darkColors.surface.card,
    borderWidth: 1,
    borderColor: darkColors.surface.borderInteractive,
    paddingHorizontal: spacing.lg,
  },
  secondaryButtonLabel: {
    color: darkColors.text.primary,
    fontFamily: fontFamily.appSemiBold,
    fontSize: 14,
  },
});
