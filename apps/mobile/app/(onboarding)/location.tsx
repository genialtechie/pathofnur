import { useEffect, useRef, useState } from "react";
import { useRouter } from "expo-router";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";

import {
  TOTAL_ONBOARDING_STEPS,
  trackOnboardingStepCompleted,
  trackOnboardingStepViewed
} from "@/src/features/donate/onboarding-analytics";
import { OnboardingFrame } from "@/src/features/donate/onboarding-frame";
import { OnboardingImageBackground } from "@/src/features/donate/onboarding-image-background";
import { onboardingImages } from "@/src/features/donate/onboarding-images";
import { updatePreferences } from "@/src/lib/preferences/preferences-store";
import { fontFamily } from "@/src/components/navigation/typography";

const STEP = 11;

const CITIES = [
  { city: "New York", country: "US", lat: 40.71, lng: -74.01, tz: "America/New_York" },
  { city: "London", country: "UK", lat: 51.51, lng: -0.13, tz: "Europe/London" },
  { city: "Toronto", country: "CA", lat: 43.65, lng: -79.38, tz: "America/Toronto" },
  { city: "Dubai", country: "AE", lat: 25.20, lng: 55.27, tz: "Asia/Dubai" },
  { city: "Cairo", country: "EG", lat: 30.04, lng: 31.24, tz: "Africa/Cairo" },
  { city: "Istanbul", country: "TR", lat: 41.01, lng: 28.98, tz: "Europe/Istanbul" },
  { city: "Riyadh", country: "SA", lat: 24.77, lng: 46.74, tz: "Asia/Riyadh" },
  { city: "Jeddah", country: "SA", lat: 21.49, lng: 39.19, tz: "Asia/Riyadh" },
  { city: "Kuala Lumpur", country: "MY", lat: 3.14, lng: 101.69, tz: "Asia/Kuala_Lumpur" },
  { city: "Jakarta", country: "ID", lat: -6.21, lng: 106.85, tz: "Asia/Jakarta" },
  { city: "Lahore", country: "PK", lat: 31.55, lng: 74.35, tz: "Asia/Karachi" },
  { city: "Karachi", country: "PK", lat: 24.86, lng: 67.01, tz: "Asia/Karachi" },
  { city: "Dhaka", country: "BD", lat: 23.81, lng: 90.41, tz: "Asia/Dhaka" },
  { city: "Paris", country: "FR", lat: 48.86, lng: 2.35, tz: "Europe/Paris" },
  { city: "Berlin", country: "DE", lat: 52.52, lng: 13.41, tz: "Europe/Berlin" },
  { city: "Chicago", country: "US", lat: 41.88, lng: -87.63, tz: "America/Chicago" },
  { city: "Los Angeles", country: "US", lat: 34.05, lng: -118.24, tz: "America/Los_Angeles" },
  { city: "Houston", country: "US", lat: 29.76, lng: -95.37, tz: "America/Chicago" },
  { city: "Doha", country: "QA", lat: 25.29, lng: 51.53, tz: "Asia/Qatar" },
  { city: "Muscat", country: "OM", lat: 23.59, lng: 58.55, tz: "Asia/Muscat" },
  { city: "Casablanca", country: "MA", lat: 33.57, lng: -7.59, tz: "Africa/Casablanca" },
  { city: "Medina", country: "SA", lat: 24.47, lng: 39.61, tz: "Asia/Riyadh" },
  { city: "Mecca", country: "SA", lat: 21.39, lng: 39.86, tz: "Asia/Riyadh" },
  { city: "Amman", country: "JO", lat: 31.96, lng: 35.95, tz: "Asia/Amman" },
  { city: "Baghdad", country: "IQ", lat: 33.31, lng: 44.37, tz: "Asia/Baghdad" },
  { city: "Ankara", country: "TR", lat: 39.93, lng: 32.86, tz: "Europe/Istanbul" },
  { city: "Mumbai", country: "IN", lat: 19.08, lng: 72.88, tz: "Asia/Kolkata" },
  { city: "Delhi", country: "IN", lat: 28.61, lng: 77.23, tz: "Asia/Kolkata" },
  { city: "Sydney", country: "AU", lat: -33.87, lng: 151.21, tz: "Australia/Sydney" },
  { city: "Melbourne", country: "AU", lat: -37.81, lng: 144.96, tz: "Australia/Melbourne" }
] as const;

export default function LocationScreen() {
  const router = useRouter();
  const startedAtRef = useRef(Date.now());
  const [showPicker, setShowPicker] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    void trackOnboardingStepViewed("location", STEP);
  }, []);

  const requestLocation = async () => {
    if (Platform.OS === "web" && "geolocation" in navigator) {
      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            timeout: 10000,
            enableHighAccuracy: false
          });
        });
        await updatePreferences({
          locationGranted: true,
          coords: { lat: pos.coords.latitude, lng: pos.coords.longitude }
        });
        void trackOnboardingStepCompleted("location", STEP, startedAtRef.current);
        router.push("/(onboarding)/ready");
        return;
      } catch {
        setShowPicker(true);
        return;
      }
    }
    setShowPicker(true);
  };

  const selectCity = async (city: (typeof CITIES)[number]) => {
    await updatePreferences({
      locationGranted: true,
      coords: { lat: city.lat, lng: city.lng },
      city: `${city.city}, ${city.country}`,
      timezone: city.tz
    });
    void trackOnboardingStepCompleted("location", STEP, startedAtRef.current);
    router.push("/(onboarding)/ready");
  };

  const filteredCities = search.trim()
    ? CITIES.filter((c) =>
        c.city.toLowerCase().includes(search.toLowerCase())
      )
    : CITIES;

  // City picker fallback — uses the standard OnboardingFrame
  if (showPicker) {
    return (
      <OnboardingFrame
        step={STEP}
        totalSteps={TOTAL_ONBOARDING_STEPS}
        title="Select your city"
        subtitle="We'll use this for prayer times and Qiblah direction."
        primaryLabel=""
        onPrimaryPress={() => {}}
        backHref="/(onboarding)/notifications"
      >
        <TextInput
          style={styles.searchInput}
          placeholder="Search cities..."
          placeholderTextColor="#5d6d84"
          value={search}
          onChangeText={setSearch}
          autoFocus
        />
        <ScrollView style={styles.cityList} nestedScrollEnabled>
          {filteredCities.map((city) => (
            <Pressable
              key={`${city.city}-${city.country}`}
              style={styles.cityRow}
              onPress={() => selectCity(city)}
            >
              <Text style={styles.cityName}>{city.city}</Text>
              <Text style={styles.cityCountry}>{city.country}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </OnboardingFrame>
    );
  }

  // Main view — full-bleed background
  return (
    <OnboardingImageBackground
      source={onboardingImages.location}
      style={styles.bg}
      overlayOpacity={0.45}
    >
      <View style={styles.content}>
        <View style={styles.spacer} />

        <Text style={styles.title} selectable>
          Accurate prayer times for your city
        </Text>
        <Text style={styles.subtitle} selectable>
          Path of Nur uses your location to calculate precise prayer times and
          Qiblah direction. Your location stays on your device.
        </Text>

        <View style={styles.footer}>
          <Pressable style={styles.primaryButton} onPress={requestLocation}>
            <Text style={styles.primaryLabel}>Share my location</Text>
          </Pressable>
          <Pressable
            style={styles.secondaryButton}
            onPress={() => setShowPicker(true)}
          >
            <Text style={styles.secondaryLabel}>Enter city manually</Text>
          </Pressable>
        </View>
      </View>
    </OnboardingImageBackground>
  );
}

const styles = StyleSheet.create({
  bg: {
    flex: 1,
    backgroundColor: "#070b14"
  },
  content: {
    flex: 1,
    justifyContent: "flex-end",
    paddingHorizontal: 28,
    paddingBottom: 40
  },
  spacer: { flex: 1 },
  title: {
    color: "#f3f5f7",
    fontFamily: fontFamily.appBold,
    fontSize: 28,
    textAlign: "center",
    lineHeight: 36,
    marginBottom: 12
  },
  subtitle: {
    color: "#dce3ed",
    fontFamily: fontFamily.appRegular,
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 32
  },
  footer: {
    gap: 12,
    alignItems: "center"
  },
  primaryButton: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
    backgroundColor: "#c5a021",
    minHeight: 54,
    paddingHorizontal: 24,
    alignSelf: "stretch"
  },
  primaryLabel: {
    color: "#070b14",
    fontFamily: fontFamily.appBold,
    fontSize: 17
  },
  secondaryButton: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 40
  },
  secondaryLabel: {
    color: "#d6deea",
    fontFamily: fontFamily.appSemiBold,
    fontSize: 15
  },
  // City picker styles
  searchInput: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#1a2639",
    backgroundColor: "#0b1220",
    color: "#f3f5f7",
    fontFamily: fontFamily.appRegular,
    fontSize: 16,
    paddingHorizontal: 16,
    paddingVertical: 12
  },
  cityList: {
    maxHeight: 320
  },
  cityRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#111a2a"
  },
  cityName: {
    color: "#eff2f7",
    fontFamily: fontFamily.appSemiBold,
    fontSize: 16
  },
  cityCountry: {
    color: "#5d6d84",
    fontFamily: fontFamily.appRegular,
    fontSize: 14
  }
});
