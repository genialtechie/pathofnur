import { useCallback, useRef, useState } from "react";
import {
  type ImageSourcePropType,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from "react-native";

import { HeroCard } from "@/src/components/cards/HeroCard";
import { colors, spacing } from "@/src/theme/tokens";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface HeroItem {
  id: string;
  imageSource: ImageSourcePropType;
  title: string;
  subtitle?: string;
}

interface HeroCarouselProps {
  items: HeroItem[];
  onItemPress?: (item: HeroItem) => void;
  /** Horizontal padding subtracted from screen width (default: 2 × 24) */
  horizontalPadding?: number;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function HeroCarousel({
  items,
  onItemPress,
  horizontalPadding = spacing.xl * 2,
}: HeroCarouselProps) {
  const { width: screenWidth } = useWindowDimensions();
  const cardWidth = screenWidth - horizontalPadding;
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  const handleScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offsetX = e.nativeEvent.contentOffset.x;
      const index = Math.round(offsetX / cardWidth);
      setActiveIndex(index);
    },
    [cardWidth],
  );

  if (items.length === 0) return null;

  return (
    <View style={styles.wrapper}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        snapToInterval={cardWidth + spacing.md}
        snapToAlignment="start"
        contentContainerStyle={[
          styles.scrollContent,
          { paddingHorizontal: horizontalPadding / 2 },
        ]}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {items.map((item) => (
          <HeroCard
            key={item.id}
            imageSource={item.imageSource}
            title={item.title}
            subtitle={item.subtitle}
            onPress={onItemPress ? () => onItemPress(item) : undefined}
            style={{ width: cardWidth }}
          />
        ))}
      </ScrollView>

      {/* Dot indicator */}
      {items.length > 1 ? (
        <View style={styles.dots}>
          {items.map((item, i) => (
            <View
              key={item.id}
              style={[styles.dot, i === activeIndex && styles.dotActive]}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  wrapper: {
    gap: spacing.sm,
  },
  scrollContent: {
    gap: spacing.md,
  },
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    gap: spacing.xs,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.interactive.inactive,
  },
  dotActive: {
    backgroundColor: colors.brand.metallicGold,
    width: 20,
    borderRadius: 4,
  },
});
