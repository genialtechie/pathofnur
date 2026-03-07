import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
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

export default function QiblahScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { location, status: locationStatus, refresh } = useLocation();
  const coords = location?.coords;
  const hasLocation = Boolean(coords);
  const cityLabel = location?.city ? `${location.city}${location.country ? `, ${location.country}` : ""}` : "Your saved location";
  const { bearing: qiblahBearing } = useQiblah(coords?.latitude, coords?.longitude);

  const [heading, setHeading] = useState<number | null>(null);
  const [sensorStatus, setSensorStatus] = useState<"loading" | "ready" | "unavailable" | "error">("loading");
  const [sensorError, setSensorError] = useState<string | null>(null);
  const hasTrackedLock = useRef(false);

  useEffect(() => {
    void trackScreenView("tools_qiblah");
    void track(EventName.TOOLS_QIBLAH_STARTED, {}, "tools_qiblah");
  }, []);

  useEffect(() => {
    let isActive = true;
    let subscription: { remove: () => void } | null = null;

    const startCompass = async () => {
      try {
        const available = await Magnetometer.isAvailableAsync();
        if (!available) {
          if (!isActive) return;
          setSensorStatus("unavailable");
          setSensorError("Compass sensor not available on this device.");
          return;
        }

        Magnetometer.setUpdateInterval(MAGNETOMETER_INTERVAL_MS);
        subscription = Magnetometer.addListener((measurement) => {
          if (!isActive) return;
          setHeading(measurementToHeading(measurement));
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
      subscription?.remove();
    };
  }, []);

  const signedOffset = useMemo(() => {
    if (heading === null || qiblahBearing === null) return null;
    return normalizeSignedDegrees(qiblahBearing - heading);
  }, [heading, qiblahBearing]);

  const alignmentDelta = signedOffset === null ? null : Math.abs(signedOffset);
  const isLocked = alignmentDelta !== null && alignmentDelta <= ALIGNMENT_THRESHOLD;
  const alignmentPercent = alignmentDelta === null ? 0 : Math.max(0, 100 - (alignmentDelta / 90) * 100);
  const dialSize = Math.min(width - spacing.xl * 2, 340);
  const sensorStatusLabel =
    sensorStatus === "ready"
      ? "Live"
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
    signedOffset === null
      ? "Finding your bearing..."
      : isLocked
        ? "Locked on Qiblah"
        : signedOffset > 0
          ? `Rotate ${Math.round(Math.abs(signedOffset))}° right`
          : `Rotate ${Math.round(Math.abs(signedOffset))}° left`;

  const handleShare = useCallback(async () => {
    if (qiblahBearing === null) return;

    await Share.share({
      message: `Path of Nur Qiblah check: ${Math.round(qiblahBearing)}° from ${cityLabel}. ${isLocked ? "Locked in." : directionText}.`,
    });
  }, [cityLabel, directionText, isLocked, qiblahBearing]);

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

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="light-content" />

      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.headerButton} hitSlop={18}>
          <Ionicons name="arrow-back" size={22} color={darkColors.text.primary} />
        </Pressable>
        <View style={styles.headerCopy}>
          <Text style={styles.headerEyebrow}>Qiblah Lock</Text>
          <Text style={styles.headerTitle}>Rotate until it clicks</Text>
        </View>
        <Pressable onPress={() => void handleShare()} style={styles.headerButton} hitSlop={18} disabled={!hasLocation}>
          <Ionicons
            name="share-outline"
            size={22}
            color={hasLocation ? darkColors.text.primary : darkColors.text.tertiary}
          />
        </Pressable>
      </View>

      <View style={styles.metaRow}>
        <View style={styles.metaCard}>
          <Text style={styles.metaLabel}>Base</Text>
          <Text style={styles.metaValue}>{hasLocation ? cityLabel : "Needs location"}</Text>
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
                    transform: [{ rotate: `${signedOffset ?? 0}deg` }],
                  },
                ]}
              >
                <View style={[styles.pointerStem, isLocked && styles.pointerStemLocked]} />
                <View style={[styles.pointerHead, isLocked && styles.pointerHeadLocked]} />
              </View>

              <View style={styles.centerOrb}>
                <Text style={styles.centerValue}>{alignmentDelta === null ? "--" : `${Math.round(alignmentDelta)}°`}</Text>
                <Text style={styles.centerLabel}>{isLocked ? "aligned" : "off target"}</Text>
              </View>
            </View>

            <View style={styles.feedbackPanel}>
              <Text style={[styles.feedbackTitle, isLocked && styles.feedbackTitleLocked]}>{directionText}</Text>
              <Text style={styles.feedbackBody}>
                {heading === null
                  ? "Hold the phone flat while the compass wakes up."
                  : `Qiblah bearing ${Math.round(qiblahBearing)}°. Heading ${Math.round(heading)}°. Alignment ${Math.round(alignmentPercent)}%.`}
              </Text>
            </View>
          </>
        ) : (
          <View style={styles.errorPanel}>
            <Ionicons name="location-outline" size={54} color={darkColors.text.tertiary} />
            <Text style={styles.errorTitle}>
              {locationStatus === "loading" ? "Loading location" : "Location needed for Qiblah"}
            </Text>
            <Text style={styles.errorBody}>
              {locationStatus === "loading"
                ? "Pulling your saved coordinates so the compass can line up the Kaaba."
                : "Give Path of Nur a location so the Qiblah line can be calculated from where you are."}
            </Text>
            <Pressable style={styles.refreshButton} onPress={() => void refresh()}>
              <Text style={styles.refreshButtonLabel}>Refresh location</Text>
            </Pressable>
          </View>
        )}
      </View>

      <View style={styles.bottomPanel}>
        <View style={styles.readoutCard}>
          <Text style={styles.readoutLabel}>Sensor note</Text>
          <Text style={styles.readoutValue}>{sensorError ?? "Keep your device flat and rotate slowly for a steadier lock."}</Text>
        </View>
        <View style={styles.readoutCard}>
          <Text style={styles.readoutLabel}>Share moment</Text>
          <Text style={styles.readoutValue}>When the line locks, send the city + bearing as a quick spiritual check-in.</Text>
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
  refreshButton: {
    marginTop: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
    backgroundColor: darkColors.brand.metallicGold,
  },
  refreshButtonLabel: {
    color: darkColors.text.onAccent,
    fontFamily: fontFamily.appSemiBold,
    fontSize: 14,
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
});
