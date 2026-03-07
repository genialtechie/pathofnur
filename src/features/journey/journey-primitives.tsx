import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { fontFamily, radii, spacing, useTheme } from "@/src/theme";

type JourneyPanelProps = {
  title: string;
  subtitle: string;
  badge?: string;
  children: ReactNode;
};

type JourneyChipProps = {
  label: string;
  selected: boolean;
  onPress: () => void;
  compact?: boolean;
};

type JourneyStreakCardProps = {
  label: string;
  streak: number;
  accent: string;
  subtitle: string;
  compact: boolean;
};

export function JourneyPanel({
  title,
  subtitle,
  badge,
  children,
}: JourneyPanelProps) {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.panel,
        {
          backgroundColor: colors.surface.card,
          borderColor: colors.surface.borderElevated,
        },
      ]}
    >
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <Text style={[styles.title, { color: colors.text.primary }]} selectable>
            {title}
          </Text>
          <Text style={[styles.subtitle, { color: colors.text.secondary }]} selectable>
            {subtitle}
          </Text>
        </View>
        {badge ? (
          <Text style={[styles.badge, { color: colors.text.tertiary }]} selectable>
            {badge}
          </Text>
        ) : null}
      </View>

      {children}
    </View>
  );
}

export function JourneyChip({
  label,
  selected,
  onPress,
  compact = false,
}: JourneyChipProps) {
  const { colors } = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={[
        styles.chip,
        {
          backgroundColor: selected
            ? colors.interactive.selectedBackground
            : colors.surface.background,
          borderColor: selected
            ? colors.interactive.selectedBorder
            : colors.surface.border,
          minWidth: compact ? "48%" : undefined,
        },
      ]}
    >
      <Text
        style={[
          styles.chipLabel,
          { color: selected ? colors.text.primary : colors.text.secondary },
        ]}
        selectable
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function JourneyStreakCard({
  label,
  streak,
  accent,
  subtitle,
  compact,
}: JourneyStreakCardProps) {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.statCard,
        {
          backgroundColor: colors.surface.card,
          borderColor: colors.surface.borderElevated,
          minWidth: compact ? "100%" : "31%",
        },
      ]}
    >
      <Text style={[styles.statLabel, { color: colors.text.tertiary }]} selectable>
        {label}
      </Text>
      <Text style={[styles.statValue, { color: colors.text.primary }]} selectable>
        {streak}
      </Text>
      <View style={[styles.statAccent, { backgroundColor: accent }]} />
      <Text style={[styles.statSubtitle, { color: colors.text.secondary }]} selectable>
        {subtitle}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    gap: spacing.lg,
    borderRadius: radii.xl,
    borderWidth: 1,
    padding: spacing.lg,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  headerCopy: {
    flexShrink: 1,
  },
  title: {
    fontFamily: fontFamily.appBold,
    fontSize: 22,
    lineHeight: 28,
  },
  subtitle: {
    fontFamily: fontFamily.appRegular,
    fontSize: 14,
    lineHeight: 20,
    marginTop: spacing.xs,
    maxWidth: 260,
  },
  badge: {
    fontFamily: fontFamily.appSemiBold,
    fontSize: 12,
    letterSpacing: 0.4,
  },
  chip: {
    borderRadius: radii.pill,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  chipLabel: {
    fontFamily: fontFamily.appSemiBold,
    fontSize: 14,
    lineHeight: 18,
  },
  statCard: {
    flexGrow: 1,
    borderRadius: radii.lg,
    borderWidth: 1,
    padding: spacing.md,
  },
  statLabel: {
    fontFamily: fontFamily.appSemiBold,
    fontSize: 13,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  statValue: {
    fontFamily: fontFamily.appBold,
    fontSize: 34,
    lineHeight: 40,
    marginTop: spacing.sm,
    fontVariant: ["tabular-nums"],
  },
  statAccent: {
    height: 4,
    width: 42,
    borderRadius: radii.pill,
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },
  statSubtitle: {
    fontFamily: fontFamily.appRegular,
    fontSize: 14,
    lineHeight: 20,
  },
});
