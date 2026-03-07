import type { ReactNode } from "react";
import { Pressable, StyleSheet, Switch, Text, View } from "react-native";

import { fontFamily, radii, spacing, useTheme } from "@/src/theme";

type JourneyPanelProps = {
  title?: string;
  subtitle?: string;
  badge?: string;
  children: ReactNode;
};

type JourneyActionButtonProps = {
  label: string;
  onPress: () => void;
  emphasis?: "primary" | "secondary";
  disabled?: boolean;
};

type JourneyTagProps = {
  label: string;
  tone?: "neutral" | "gold" | "forest" | "blue";
};

type JourneyHistoryStripProps = {
  items: Array<{
    dateKey: string;
    label: string;
    isComplete: boolean;
  }>;
  accent: string;
};

type JourneySettingRowProps = {
  title: string;
  description: string;
  value: boolean;
  disabled?: boolean;
  onValueChange: (nextValue: boolean) => void;
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
      {title || subtitle || badge ? (
        <View style={styles.header}>
          <View style={styles.headerCopy}>
            {title ? (
              <Text style={[styles.title, { color: colors.text.primary }]} selectable>
                {title}
              </Text>
            ) : null}
            {subtitle ? (
              <Text style={[styles.subtitle, { color: colors.text.secondary }]} selectable>
                {subtitle}
              </Text>
            ) : null}
          </View>
          {badge ? (
            <Text style={[styles.badge, { color: colors.text.tertiary }]} selectable>
              {badge}
            </Text>
          ) : null}
        </View>
      ) : null}

      {children}
    </View>
  );
}

export function JourneyActionButton({
  label,
  onPress,
  emphasis = "primary",
  disabled = false,
}: JourneyActionButtonProps) {
  const { colors } = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={[
        styles.actionButton,
        emphasis === "primary"
          ? {
              backgroundColor: colors.brand.metallicGold,
              borderColor: colors.brand.metallicGold,
            }
          : {
              backgroundColor: colors.surface.background,
              borderColor: colors.surface.borderInteractive,
            },
        disabled ? styles.disabled : null,
      ]}
    >
      <Text
        style={[
          styles.actionButtonLabel,
          {
            color:
              emphasis === "primary" ? colors.text.onAccent : colors.text.primary,
          },
        ]}
        selectable
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function JourneyTag({ label, tone = "neutral" }: JourneyTagProps) {
  const { colors } = useTheme();

  const palette = {
    neutral: {
      backgroundColor: colors.surface.background,
      borderColor: colors.surface.border,
      color: colors.text.secondary,
    },
    gold: {
      backgroundColor: "rgba(197, 160, 33, 0.14)",
      borderColor: "rgba(197, 160, 33, 0.28)",
      color: colors.brand.metallicGold,
    },
    forest: {
      backgroundColor: "rgba(53, 94, 59, 0.18)",
      borderColor: "rgba(53, 94, 59, 0.3)",
      color: "#B8D9BF",
    },
    blue: {
      backgroundColor: "rgba(44, 82, 146, 0.2)",
      borderColor: "rgba(44, 82, 146, 0.3)",
      color: "#CFE0FF",
    },
  } as const;

  return (
    <View style={[styles.tag, palette[tone]]}>
      <Text style={[styles.tagLabel, { color: palette[tone].color }]} selectable>
        {label}
      </Text>
    </View>
  );
}

export function JourneyHistoryStrip({
  items,
  accent,
}: JourneyHistoryStripProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.historyStrip}>
      {items.map((item) => (
        <View key={item.dateKey} style={styles.historyItem}>
          <View
            style={[
              styles.historyDot,
              {
                backgroundColor: item.isComplete ? accent : colors.surface.background,
                borderColor: item.isComplete ? accent : colors.surface.border,
                opacity: item.isComplete ? 1 : 0.5,
              },
            ]}
          />
          <Text style={[styles.historyLabel, { color: colors.text.tertiary }]} selectable>
            {item.label}
          </Text>
        </View>
      ))}
    </View>
  );
}

export function JourneySettingRow({
  title,
  description,
  value,
  disabled = false,
  onValueChange,
}: JourneySettingRowProps) {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.settingRow,
        {
          backgroundColor: colors.surface.background,
          borderColor: colors.surface.border,
          opacity: disabled ? 0.6 : 1,
        },
      ]}
    >
      <View style={styles.settingCopy}>
        <Text style={[styles.settingTitle, { color: colors.text.primary }]} selectable>
          {title}
        </Text>
        <Text style={[styles.settingDescription, { color: colors.text.secondary }]} selectable>
          {description}
        </Text>
      </View>

      <Switch
        disabled={disabled}
        onValueChange={onValueChange}
        trackColor={{
          false: colors.surface.borderInteractive,
          true: colors.brand.metallicGold,
        }}
        thumbColor={value ? colors.text.onAccent : colors.text.light}
        value={value}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    gap: spacing.lg,
    borderRadius: radii.xl,
    borderWidth: 1,
    padding: spacing.lg,
    boxShadow: "0 20px 40px rgba(0, 0, 0, 0.18)",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  headerCopy: {
    flex: 1,
    gap: spacing.xs,
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
  },
  badge: {
    fontFamily: fontFamily.appSemiBold,
    fontSize: 12,
    letterSpacing: 0.4,
  },
  actionButton: {
    minHeight: 50,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
    borderRadius: radii.pill,
    borderWidth: 1,
  },
  actionButtonLabel: {
    fontFamily: fontFamily.appBold,
    fontSize: 15,
    lineHeight: 18,
  },
  disabled: {
    opacity: 0.55,
  },
  tag: {
    borderRadius: radii.pill,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  tagLabel: {
    fontFamily: fontFamily.appSemiBold,
    fontSize: 13,
    lineHeight: 18,
  },
  historyStrip: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.xs,
  },
  historyItem: {
    alignItems: "center",
    gap: spacing.xs,
  },
  historyDot: {
    width: 18,
    height: 18,
    borderRadius: radii.pill,
    borderWidth: 1,
  },
  historyLabel: {
    fontFamily: fontFamily.appSemiBold,
    fontSize: 11,
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  settingCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  settingTitle: {
    fontFamily: fontFamily.appSemiBold,
    fontSize: 16,
    lineHeight: 20,
  },
  settingDescription: {
    fontFamily: fontFamily.appRegular,
    fontSize: 14,
    lineHeight: 20,
  },
});
