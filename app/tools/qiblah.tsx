import { useCallback, useEffect, useState } from "react";
import {
  Pressable,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import * as Location from "expo-location";
import { Ionicons } from "@expo/vector-icons";

import { EventName, track, trackScreenView } from "@/src/lib/analytics/track";
import { useLocation } from "@/src/lib/location";
import { colors, fontFamily, radii, spacing } from "@/src/theme";

// Kaaba coordinates
const KAABA_LAT = 21.4225;
const KAABA_LNG = 39.8262;

export default function QiblahScreen() {
  const router = useRouter();
  const { location, status: locationStatus } = useLocation();
  const coords = location?.coords;
  
  const [heading, setHeading] = useState<number | null>(null);
  const [qiblahBearing, setQiblahBearing] = useState(0);

  useEffect(() => {
    void trackScreenView("tools_qiblah");
    track(EventName.TOOLS_QIBLAH_STARTED, {}, "tools_qiblah");
  }, []);

  // Subscribe to Location Heading (True North)
  useEffect(() => {
    let subscription: Location.LocationSubscription | null = null;

    const startWatching = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") return;

        subscription = await Location.watchHeadingAsync((obj) => {
          const { trueHeading, magHeading } = obj;
          // Use trueHeading if available (> -1), otherwise fallback to magnetic
          const north = trueHeading >= 0 ? trueHeading : magHeading;
          setHeading(north);
        });
      } catch (error) {
        console.warn("Failed to watch heading:", error);
      }
    };

    startWatching();

    return () => {
      // Clean up subscription
      if (subscription) {
        subscription.remove();
      }
    };
  }, []);

  // Calculate Qiblah bearing
  useEffect(() => {
    if (coords) {
      const lat1 = (coords.latitude * Math.PI) / 180;
      const lon1 = (coords.longitude * Math.PI) / 180;
      const lat2 = (KAABA_LAT * Math.PI) / 180;
      const lon2 = (KAABA_LNG * Math.PI) / 180;

      const y = Math.sin(lon2 - lon1) * Math.cos(lat2);
      const x =
        Math.cos(lat1) * Math.sin(lat2) -
        Math.sin(lat1) * Math.cos(lat2) * Math.cos(lon2 - lon1);
      let bearing = Math.atan2(y, x);
      bearing = (bearing * 180) / Math.PI;
      setQiblahBearing((bearing + 360) % 360);
    }
  }, [coords]);

  const currentHeading = heading ?? 0;
  const rotation = qiblahBearing - currentHeading;

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={styles.backButton}
          hitSlop={20}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </Pressable>
        <Text style={styles.title}>Qiblah</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        {locationStatus === "granted" && coords ? (
          <>
            <View style={styles.compassContainer}>
              {/* This image/view rotates */}
              <View
                style={[
                  styles.arrowContainer,
                  { transform: [{ rotate: `${rotation}deg` }] },
                ]}
              > 
                <Ionicons name="arrow-up-circle" size={200} color={colors.brand.metallicGold} />
              </View>
              
              <Text style={styles.bearingText}>
                {Math.round(qiblahBearing)}°
              </Text>
              <Text style={styles.cityText}>from your location</Text>
              
              {heading === null && (
                 <Text style={styles.calibratingText}>Calibrating...</Text>
              )}
            </View>

            <View style={styles.infoPanel}>
              <Text style={styles.infoText}>
                Keep your device flat. Rotate until the arrow points up.
              </Text>
            </View>
          </>
        ) : (
          <View style={styles.errorContainer}>
            <Ionicons name="location-outline" size={64} color={colors.text.tertiary} />
            <Text style={styles.errorTitle}>Location Required</Text>
            <Text style={styles.errorText}>
              We need your location to calculate the Qiblah direction.
            </Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  backButton: {
    padding: spacing.xs,
  },
  title: {
    color: colors.text.primary,
    fontFamily: fontFamily.appSemiBold,
    fontSize: 18,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
  },
  compassContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing["4xl"],
  },
  arrowContainer: {
    marginBottom: spacing.xl,
  },
  bearingText: {
    color: colors.text.primary,
    fontFamily: fontFamily.appBold,
    fontSize: 48,
  },
  cityText: {
    color: colors.text.secondary,
    fontFamily: fontFamily.appRegular,
    fontSize: 16,
  },
  calibratingText: {
    color: colors.text.tertiary,
    fontFamily: fontFamily.appRegular,
    fontSize: 14,
    marginTop: spacing.md,
  },
  infoPanel: {
    position: "absolute",
    bottom: spacing["4xl"],
    paddingHorizontal: spacing.xl,
  },
  infoText: {
    color: colors.text.tertiary,
    fontFamily: fontFamily.appRegular,
    fontSize: 14,
    textAlign: "center",
  },
  errorContainer: {
    alignItems: "center",
    gap: spacing.md,
  },
  errorTitle: {
    color: colors.text.primary,
    fontFamily: fontFamily.appSemiBold,
    fontSize: 20,
  },
  errorText: {
    color: colors.text.secondary,
    fontFamily: fontFamily.appRegular,
    fontSize: 16,
    textAlign: "center",
  },
});
