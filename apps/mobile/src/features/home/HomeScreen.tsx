/**
 * Home Screen
 *
 * The main sanctuary dashboard with hero carousel and prayer timeline
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  StyleSheet,
  ScrollView,
  View,
  Text,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Asset } from "expo-asset";

import { HeroCarousel } from "./HeroCarousel";
import { HomeHadithCard } from "./HomeHadithCard";
import { PrayerTimeline } from "./PrayerTimeline";
import { CollectionBottomSheet } from "@/src/components/ui/CollectionBottomSheet";
import { trackScreenView } from "@/src/lib/analytics/track";
import { useIslamicDate } from "@/src/lib/prayer/use-islamic-date";
import { useLocation } from "@/src/lib/location/location-provider";
import {
  useTheme,
  fontFamily,
  spacing,
} from "@/src/theme";
import { useFocusEffect } from "expo-router";

// Hero items configuration
const HERO_ITEMS = [
  {
    id: "daily-path",
    imageSource: require("@/public/images/_delivery/home-hero-daily-path-v01-card.webp"),
    title: "Your Daily Path",
    subtitle: "Begin today's journey of reflection and peace",
    collectionId: "gratitude",
  },
  {
    id: "night-reflection",
    imageSource: require("@/public/images/_delivery/home-hero-night-reflection-v01-card.webp"),
    title: "Night Reflection",
    subtitle: "Wind down with calming recitations",
    collectionId: "sleep",
  },
  {
    id: "prayer-invitation",
    imageSource: require("@/public/images/_delivery/library-cover-anxiety-contour-v01-card.webp"),
    title: "Prayer Invitation",
    subtitle: "An invitation to pause and connect",
    collectionId: "anxiety",
  },
];

const HOME_HERO_IMAGE_MODULES = HERO_ITEMS
  .map((item) => item.imageSource)
  .filter((source): source is number => typeof source === "number");

function getDelayUntilNextDay(date = new Date()) {
  const nextDay = new Date(date);
  nextDay.setHours(24, 0, 0, 0);
  return Math.max(1_000, nextDay.getTime() - date.getTime());
}

export function HomeScreen() {
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null);
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const { colors, isDark } = useTheme();
  const { location } = useLocation();
  const { date: islamicDate } = useIslamicDate(
    location?.coords.latitude,
    location?.coords.longitude,
  );

  const gregorianDate = useMemo(
    () =>
      currentDate.toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
      }),
    [currentDate],
  );

  const hijriDateLabel = islamicDate
    ? `${islamicDate.hijriDay} ${islamicDate.hijriMonth} ${islamicDate.hijriYear} AH`
    : null;

  useEffect(() => {
    void Asset.loadAsync(HOME_HERO_IMAGE_MODULES);
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setCurrentDate(new Date());
    }, getDelayUntilNextDay(currentDate));

    return () => {
      clearTimeout(timeoutId);
    };
  }, [currentDate]);

  // Track screen view when focused
  useFocusEffect(
    useCallback(() => {
      setCurrentDate(new Date());
      trackScreenView("home");
    }, [])
  );

  // Handle hero card press - open bottom sheet
  const handleHeroPress = useCallback((item: { collectionId?: string }) => {
    if (item.collectionId) {
      setSelectedCollectionId(item.collectionId);
    }
  }, []);

  // Close bottom sheet
  const handleCloseSheet = useCallback(() => {
    setSelectedCollectionId(null);
  }, []);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.surface.background }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.greeting, { color: colors.text.primary }]}>
            As-salamu alaykum
          </Text>
          <Text style={[styles.date, { color: colors.text.tertiary }]}>
            <Text style={[styles.dateLabel, { color: colors.brand.metallicGold }]}>
              Today
            </Text>
            {`  ${gregorianDate}`}
            {hijriDateLabel ? (
              <Text style={[styles.dateSecondary, { color: colors.text.muted }]}>
                {`  •  ${hijriDateLabel}`}
              </Text>
            ) : null}
          </Text>
        </View>

        {/* Hero Carousel */}
        <HeroCarousel
          items={HERO_ITEMS}
          onHeroPress={handleHeroPress}
        />

        {/* Features Grid */}


        {/* Prayer Timeline */}
        <PrayerTimeline />

        <HomeHadithCard />

        {/* Spacer for bottom nav */}
        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Collection Bottom Sheet */}
      <CollectionBottomSheet
        visible={selectedCollectionId !== null}
        collectionId={selectedCollectionId}
        onClose={handleCloseSheet}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: spacing.xl,
  },
  header: {
    paddingHorizontal: spacing.xl,
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  greeting: {
    fontFamily: fontFamily.appBold,
    fontSize: 32,
    lineHeight: 38,
  },
  date: {
    fontFamily: fontFamily.appRegular,
    fontSize: 14,
    lineHeight: 20,
  },
  dateLabel: {
    fontFamily: fontFamily.appSemiBold,
    fontSize: 14,
  },
  dateSecondary: {
    fontFamily: fontFamily.appRegular,
    fontSize: 13,
  },

  bottomSpacer: {
    height: 120, // Space for bottom navigation
  },
});
