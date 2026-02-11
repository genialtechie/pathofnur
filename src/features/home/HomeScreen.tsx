/**
 * Home Screen
 *
 * The main sanctuary dashboard with hero carousel and prayer timeline
 */

import { useCallback } from "react";
import {
  StyleSheet,
  ScrollView,
  View,
  Text,
  SafeAreaView,
  StatusBar,
} from "react-native";
import { Image } from "expo-image";

import { HeroCarousel } from "./HeroCarousel";
import { PrayerTimeline } from "./PrayerTimeline";
import { trackScreenView } from "@/src/lib/analytics/track";
import { colors, spacing } from "@/src/theme/tokens";
import { fontFamily } from "@/src/theme";
import { useFocusEffect } from "expo-router";

// Hero items configuration
const HERO_ITEMS = [
  {
    id: "daily-path",
    imageSource: require("@/public/images/_source/home-hero-daily-path-v01.webp"),
    title: "Your Daily Path",
    subtitle: "Begin today's journey of reflection and peace",
    action: "start_daily",
  },
  {
    id: "night-reflection",
    imageSource: require("@/public/images/_source/home-hero-night-reflection-v01.webp"),
    title: "Night Reflection",
    subtitle: "Wind down with calming recitations",
    action: "open_night",
  },
  {
    id: "prayer-invitation",
    imageSource: require("@/public/images/_source/home-hero-prayer-invitation-v01.webp"),
    title: "Prayer Invitation",
    subtitle: "An invitation to pause and connect",
    action: "open_prayer",
  },
];

export function HomeScreen() {
  // Track screen view when focused
  useFocusEffect(
    useCallback(() => {
      trackScreenView("home");
    }, [])
  );

  // Handle hero card press
  const handleHeroPress = useCallback((item: typeof HERO_ITEMS[0]) => {
    // Navigate based on action type
    console.log("Hero pressed:", item.action);
    // TODO: Implement navigation based on action
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.greeting}>As-salamu alaykum</Text>
          <Text style={styles.date}>Monday, February 10</Text>
        </View>

        {/* Hero Carousel */}
        <HeroCarousel
          items={HERO_ITEMS}
          onHeroPress={handleHeroPress}
        />

        {/* Prayer Timeline */}
        <PrayerTimeline />

        {/* Spacer for bottom nav */}
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface.background,
  },
  scrollContent: {
    paddingTop: spacing.xl,
  },
  header: {
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.lg,
  },
  greeting: {
    fontFamily: fontFamily.appRegular,
    fontSize: 16,
    color: colors.text.tertiary,
  },
  date: {
    fontFamily: fontFamily.appSemiBold,
    fontSize: 24,
    color: colors.text.primary,
    marginTop: spacing.xs,
  },
  bottomSpacer: {
    height: 120, // Space for bottom navigation
  },
});
