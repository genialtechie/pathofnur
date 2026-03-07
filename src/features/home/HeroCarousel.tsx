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
import { colors, spacing } from "@/src/theme/tokens";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_WIDTH = SCREEN_WIDTH - spacing["4xl"] * 2;
const CARD_MARGIN = spacing.md;
const CARD_INSET = spacing.sm;

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
        "home",
      );
    },
    [items],
  );

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const contentOffset = event.nativeEvent.contentOffset.x;
      const index = Math.round(contentOffset / (CARD_WIDTH + CARD_MARGIN * 2));

      if (index !== activeIndex && index >= 0 && index < items.length) {
        setActiveIndex(index);
        void trackHeroView(index);

        void track(
          EventName.HOME_HERO_SWIPED,
          {
            hero_index: index,
            previous_index: activeIndex,
          },
          "home",
        );
      }
    },
    [activeIndex, items.length, trackHeroView],
  );

  const handlePress = useCallback(
    async (item: HeroItem, index: number) => {
      await track(
        EventName.HOME_HERO_OPENED,
        {
          hero_type: item.id,
          hero_index: index,
          action: "pressed",
        },
        "home",
      );

      onHeroPress?.(item, index);
    },
    [onHeroPress],
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
              style={styles.heroCard}
            />
          </View>
        ))}
      </ScrollView>

      <View style={styles.pagination}>
        {items.map((_, index) => (
          <View
            key={index}
            style={[styles.dot, index === activeIndex && styles.activeDot]}
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
    alignItems: "center",
  },
  heroCard: {
    width: CARD_WIDTH - CARD_INSET * 2,
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
    backgroundColor: colors.interactive.inactive,
  },
  activeDot: {
    backgroundColor: colors.interactive.active,
    width: 20,
    borderRadius: 3,
  },
});
