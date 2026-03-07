/**
 * Hero Carousel Component
 *
 * Swipeable hero cards with analytics tracking
 */

import { useState, useCallback, useEffect, useRef } from "react";
import {
  StyleSheet,
  View,
  ScrollView,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from "react-native";
import { Asset } from "expo-asset";

import { HeroCard } from "@/src/components/cards/HeroCard";
import { track, EventName } from "@/src/lib/analytics/track";
import { radii, spacing, useTheme } from "@/src/theme";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_WIDTH = SCREEN_WIDTH - spacing["4xl"] * 2; // 80px padding total
const CARD_MARGIN = spacing.md;

interface HeroItem {
  id: string;
  imageSource: any;
  title: string;
  subtitle: string;
  collectionId?: string;
  action?: string;
}

interface HeroCarouselProps {
  items: HeroItem[];
  onHeroPress?: (item: HeroItem, index: number) => void;
}

export function HeroCarousel({ items, onHeroPress }: HeroCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const hasTrackedView = useRef<Set<number>>(new Set());
  const hasPreloadedImage = useRef<Set<number>>(new Set());
  const { colors } = useTheme();

  // Track hero view on mount and when index changes
  const trackHeroView = useCallback(
    async (index: number) => {
      if (hasTrackedView.current.has(index)) return;
      hasTrackedView.current.add(index);

      const item = items[index];
      if (!item) return;

      await track(
        EventName.HOME_HERO_OPENED,
        {
          hero_type: item.id,
          hero_index: index,
        },
        "home"
      );
    },
    [items]
  );

  // Handle hero card press
  const handlePress = useCallback(
    async (item: HeroItem, index: number) => {
      // Track interaction
      await track(
        EventName.HOME_HERO_OPENED,
        {
          hero_type: item.id,
          hero_index: index,
          action: "pressed",
        },
        "home"
      );

      onHeroPress?.(item, index);
    },
    [onHeroPress]
  );

  const preloadImagesAroundIndex = useCallback(
    (index: number) => {
      const modules = items
        .slice(index, index + 2)
        .map((item) => item?.imageSource)
        .filter(
          (source): source is number =>
            typeof source === "number" && !hasPreloadedImage.current.has(source)
        );

      if (modules.length === 0) {
        return;
      }

      modules.forEach((source) => {
        hasPreloadedImage.current.add(source);
      });

      void Asset.loadAsync(modules);
    },
    [items]
  );

  useEffect(() => {
    void trackHeroView(0);
    preloadImagesAroundIndex(0);
  }, [preloadImagesAroundIndex, trackHeroView]);

  useEffect(() => {
    preloadImagesAroundIndex(activeIndex);
  }, [activeIndex, preloadImagesAroundIndex]);

  const handleMomentumScrollEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const contentOffset = event.nativeEvent.contentOffset.x;
      const index = Math.round(contentOffset / (CARD_WIDTH + CARD_MARGIN));

      if (index === activeIndex || index < 0 || index >= items.length) {
        return;
      }

      setActiveIndex(index);
      void trackHeroView(index);
      void track(
        EventName.HOME_HERO_SWIPED,
        {
          hero_index: index,
          previous_index: activeIndex,
        },
        "home"
      );
    },
    [activeIndex, items.length, trackHeroView]
  );

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        contentContainerStyle={styles.scrollContent}
        decelerationRate="fast"
        snapToInterval={CARD_WIDTH + CARD_MARGIN}
        snapToAlignment="center"
      >
        {items.map((item, index) => (
          <View
            key={item.id}
            style={[
              styles.cardContainer,
              { width: CARD_WIDTH },
              index < items.length - 1 && { marginRight: CARD_MARGIN },
            ]}
          >
            {Math.abs(index - activeIndex) <= 1 ? (
              <HeroCard
                imageSource={item.imageSource}
                title={item.title}
                subtitle={item.subtitle}
                onPress={() => handlePress(item, index)}
                ratio="portrait"
              />
            ) : (
              <View
                style={[
                  styles.placeholderCard,
                  { backgroundColor: colors.surface.card },
                ]}
              />
            )}
          </View>
        ))}
      </ScrollView>

      {/* Pagination dots */}
      <View style={styles.pagination}>
        {items.map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              { backgroundColor: index === activeIndex ? colors.interactive.active : colors.interactive.inactive },
              index === activeIndex && styles.activeDot,
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: spacing.xl,
  },
  scrollContent: {
    paddingHorizontal: spacing["4xl"],
  },
  cardContainer: {
    // Width is set dynamically
  },
  placeholderCard: {
    aspectRatio: 4 / 5,
    borderRadius: radii.xl,
  },
  pagination: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  activeDot: {
    width: 20,
    borderRadius: 3,
  },
});
