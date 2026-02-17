import React, { useRef, useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  StyleProp,
  ViewStyle,
} from "react-native";
import { useTheme, fontFamily, spacing, radii } from "@/src/theme";

interface DayTimelineViewProps {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  style?: StyleProp<ViewStyle>;
  orientation?: "vertical" | "horizontal";
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

export function DayTimelineView({
  selectedDate,
  onSelectDate,
  style,
  orientation = "vertical",
}: DayTimelineViewProps) {
  const scrollViewRef = useRef<ScrollView>(null);
  const { colors } = useTheme();

  // Auto-scroll to selected date on mount or change
  useEffect(() => {
    if (!scrollViewRef.current) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffDays = Math.floor(
      (selectedDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );
    const index = diffDays + 7;
    
    if (orientation === "vertical") {
      const itemHeight = 44;
      const scrollTo = Math.max(0, index * itemHeight - 200);
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({ y: scrollTo, animated: true });
      }, 100);
    } else {
      const itemWidth = 60; // Approximate width
      const scrollTo = Math.max(0, index * itemWidth - 150);
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({ x: scrollTo, animated: true });
      }, 100);
    }
  }, [selectedDate, orientation]);

  // Generate 15 days
  const days: Date[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = -7; i <= 7; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    days.push(date);
  }

  const isVertical = orientation === "vertical";

  return (
    <View 
      style={[
        styles.container, 
        isVertical ? styles.containerVertical : styles.containerHorizontal,
        { backgroundColor: colors.surface.background, borderColor: colors.surface.border },
        style
      ]}
    >
      <ScrollView
        ref={scrollViewRef}
        horizontal={!isVertical}
        showsVerticalScrollIndicator={isVertical}
        showsHorizontalScrollIndicator={!isVertical}
        contentContainerStyle={isVertical ? styles.scrollContentVertical : styles.scrollContentHorizontal}
      >
        {days.map((date) => {
          const isSelected = isSameDay(date, selectedDate);
          const isToday = isSameDay(date, today);

          return (
            <Pressable
              key={date.toISOString()}
              style={[
                styles.dateItem,
                isVertical ? styles.dateItemVertical : styles.dateItemHorizontal
              ]}
              onPress={() => onSelectDate(date)}
            >
              <Text
                style={[
                  styles.dateText,
                  { color: colors.text.primary },
                  isSelected && { color: colors.brand.metallicGold, fontFamily: fontFamily.appBold },
                  !isSelected && { color: colors.text.tertiary },
                ]}
              >
                {formatDate(date)}
              </Text>
              {isToday && !isSelected && (
                <View style={[styles.todayIndicator, { backgroundColor: colors.brand.metallicGold }]} />
              )}
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    // Shared container styles
  },
  containerVertical: {
    width: 85,
    borderLeftWidth: 1,
  },
  containerHorizontal: {
    width: "100%",
    height: 60,
    borderBottomWidth: 1,
  },
  scrollContentVertical: {
    paddingVertical: spacing.lg,
  },
  scrollContentHorizontal: {
    paddingHorizontal: spacing.lg,
    alignItems: "center",
  },
  dateItem: {
    alignItems: "center",
    justifyContent: "center",
  },
  dateItemVertical: {
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.xs,
    height: 44,
  },
  dateItemHorizontal: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    height: "100%",
  },
  dateText: {
    fontFamily: fontFamily.appSemiBold,
    fontSize: 13,
  },
  todayIndicator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 2,
  },
});
