/**
 * Hero Carousel Component
 *
 * Swipeable hero cards with analytics tracking
 */

import { useState, useCallback, useRef } from "react";
import {
  StyleSheet,
  View,
  ScrollView,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from "react-native";

import { HeroCard } from "@/src/components/cards/HeroCard";
import { track, EventName } from "@/src/lib/analytics/track";
import { spacing, useTheme } from "@/src/theme";

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
  const scrollViewRef = useRef<ScrollView>(null);
  const hasTrackedView = useRef<Set<number>>(new Set());
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

  // Handle scroll to update active index
  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const contentOffset = event.nativeEvent.contentOffset.x;
      const index = Math.round(contentOffset / (CARD_WIDTH + CARD_MARGIN * 2));

      if (index !== activeIndex && index >= 0 && index < items.length) {
        setActiveIndex(index);
        trackHeroView(index);

        // Track swipe event
        track(
          EventName.HOME_HERO_SWIPED,
          {
            hero_index: index,
            previous_index: activeIndex,
          },
          "home"
        );
      }
    },
    [activeIndex, items.length, trackHeroView]
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

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        contentContainerStyle={styles.scrollContent}
        decelerationRate="fast"
        snapToInterval={CARD_WIDTH + CARD_MARGIN * 2}
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
            <HeroCard
              imageSource={item.imageSource}
              title={item.title}
              subtitle={item.subtitle}
              onPress={() => handlePress(item, index)}
              ratio="portrait"
            />
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
