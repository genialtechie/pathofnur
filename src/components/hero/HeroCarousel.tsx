import { useCallback, useRef, useState } from "react";
import {
  FlatList,
  StyleSheet,
  View,
  type ViewToken,
  useWindowDimensions,
} from "react-native";
import { type ImageSource } from "expo-image";

import { HeroCard } from "@/src/components/cards/HeroCard";
import { colors, spacing } from "@/src/theme/tokens";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface HeroItem {
  id: string;
  imageSource: ImageSource;
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
// Viewability config (stable ref outside component)
// ---------------------------------------------------------------------------

const VIEWABILITY_CONFIG = { itemVisiblePercentThreshold: 50 };

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
  const flatListRef = useRef<FlatList<HeroItem>>(null);

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken<HeroItem>[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index != null) {
        setActiveIndex(viewableItems[0].index);
      }
    },
    [],
  );

  const renderItem = useCallback(
    ({ item }: { item: HeroItem }) => (
      <HeroCard
        imageSource={item.imageSource}
        title={item.title}
        subtitle={item.subtitle}
        onPress={onItemPress ? () => onItemPress(item) : undefined}
        style={{ width: cardWidth }}
      />
    ),
    [cardWidth, onItemPress],
  );

  const keyExtractor = useCallback((item: HeroItem) => item.id, []);

  if (items.length === 0) return null;

  return (
    <View style={styles.wrapper}>
      <FlatList
        ref={flatListRef}
        data={items}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        snapToInterval={cardWidth + spacing.md}
        snapToAlignment="start"
        contentContainerStyle={{ paddingHorizontal: horizontalPadding / 2, gap: spacing.md }}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={VIEWABILITY_CONFIG}
      />

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
