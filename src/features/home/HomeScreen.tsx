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
  radii,
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

export function HomeScreen() {
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null);
  const { colors, isDark } = useTheme();
  const { location } = useLocation();
  const { date: islamicDate } = useIslamicDate(
    location?.coords.latitude,
    location?.coords.longitude,
  );

  const gregorianDate = useMemo(
    () =>
      new Date().toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
      }),
    [],
  );

  const hijriDateLabel = islamicDate
    ? `${islamicDate.hijriDay} ${islamicDate.hijriMonth} ${islamicDate.hijriYear} AH`
    : null;

  useEffect(() => {
    void Asset.loadAsync(HOME_HERO_IMAGE_MODULES);
  }, []);

  // Track screen view when focused
  useFocusEffect(
    useCallback(() => {
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
          <View style={styles.metaRow}>
            <View
              style={[
                styles.metaPill,
                {
                  backgroundColor: colors.surface.card,
                  borderColor: colors.surface.borderInteractive,
                },
              ]}
            >
              <Text style={[styles.metaLabel, { color: colors.text.tertiary }]}>
                Today
              </Text>
              <Text style={[styles.metaValue, { color: colors.brand.metallicGold }]}>
                {gregorianDate}
              </Text>
            </View>

            {hijriDateLabel ? (
              <View
                style={[
                  styles.metaPill,
                  {
                    backgroundColor: colors.surface.card,
                    borderColor: colors.surface.borderInteractive,
                  },
                ]}
              >
                <Text style={[styles.metaLabel, { color: colors.text.tertiary }]}>
                  Hijri
                </Text>
                <Text style={[styles.metaValue, { color: colors.text.secondary }]}>
                  {hijriDateLabel}
                </Text>
              </View>
            ) : null}
          </View>
        </View>

        <View style={styles.sectionGap}>
          <Text style={[styles.date, { color: colors.text.tertiary }]}>
            Step into your sanctuary for today.
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
    gap: spacing.md,
  },
  greeting: {
    fontFamily: fontFamily.appBold,
    fontSize: 32,
    lineHeight: 38,
  },
  date: {
    fontFamily: fontFamily.appRegular,
    fontSize: 16,
    lineHeight: 24,
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  metaPill: {
    borderWidth: 1,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: 2,
  },
  metaLabel: {
    fontFamily: fontFamily.appSemiBold,
    fontSize: 10,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  metaValue: {
    fontFamily: fontFamily.appSemiBold,
    fontSize: 14,
  },
  sectionGap: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
  },

  bottomSpacer: {
    height: 120, // Space for bottom navigation
  },
});
