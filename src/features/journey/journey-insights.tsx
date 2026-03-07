import { Pressable, StyleSheet, Text, View } from "react-native";
import type { ImageSource } from "expo-image";

import { ShareCard } from "@/src/components/cards/ShareCard";
import { fontFamily, radii, spacing, useTheme } from "@/src/theme";

import { JourneyPanel } from "./journey-primitives";

type JourneyHistoryPanelProps = {
  recentHistory: Array<{
    dateKey: string;
    label: string;
    completionRatio: number;
  }>;
};

type JourneySharePanelProps = {
  shareCardSource: ImageSource;
  todayProgressPercent: number;
  streaks: {
    prayer: number;
    fasting: number;
    reading: number;
  };
  isDark: boolean;
  onShare: () => void;
};

export function JourneyHistoryPanel({ recentHistory }: JourneyHistoryPanelProps) {
  const { colors } = useTheme();

  return (
    <JourneyPanel
      title="Recent consistency"
      subtitle="A quick look at the last seven days."
    >
      <View style={styles.historyRow}>
        {recentHistory.map((item) => (
          <View key={item.dateKey} style={styles.historyBarWrap}>
            <View
              style={[
                styles.historyBar,
                {
                  backgroundColor:
                    item.completionRatio === 0
                      ? colors.surface.background
                      : colors.brand.metallicGold,
                  opacity:
                    item.completionRatio === 0 ? 0.35 : 0.35 + item.completionRatio * 0.65,
                  height: 24 + item.completionRatio * 56,
                  borderColor: colors.surface.border,
                },
              ]}
            />
            <Text style={[styles.historyLabel, { color: colors.text.tertiary }]} selectable>
              {item.label}
            </Text>
          </View>
        ))}
      </View>
    </JourneyPanel>
  );
}

export function JourneySharePanel({
  shareCardSource,
  todayProgressPercent,
  streaks,
  isDark,
  onShare,
}: JourneySharePanelProps) {
  const { colors } = useTheme();

  return (
    <JourneyPanel
      title="Share your progress"
      subtitle="Let the card speak softly, then hand off the summary through the platform share flow."
    >
      <View style={styles.shareCardWrap}>
        <ShareCard
          imageSource={shareCardSource}
          headline={`${todayProgressPercent}% consistency`}
          body={`Prayer ${streaks.prayer}d • Fasting ${streaks.fasting}d • Reading ${streaks.reading}d`}
          footerLabel="pathofnur.com"
        />
      </View>

      <Pressable
        onPress={onShare}
        style={[
          styles.shareButton,
          {
            backgroundColor: isDark
              ? colors.surface.background
              : colors.surface.borderInteractive,
            borderColor: colors.surface.borderInteractive,
          },
        ]}
      >
        <Text style={[styles.shareButtonLabel, { color: colors.text.primary }]} selectable>
          Share progress
        </Text>
      </Pressable>
    </JourneyPanel>
  );
}

const styles = StyleSheet.create({
  historyRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: spacing.xs,
  },
  historyBarWrap: {
    flex: 1,
    alignItems: "center",
    gap: spacing.sm,
  },
  historyBar: {
    width: "100%",
    minHeight: 24,
    borderRadius: radii.pill,
    borderWidth: 1,
  },
  historyLabel: {
    fontFamily: fontFamily.appSemiBold,
    fontSize: 12,
  },
  shareCardWrap: {
    alignSelf: "center",
    width: "76%",
    maxWidth: 280,
  },
  shareButton: {
    minHeight: 52,
    borderRadius: radii.pill,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
  },
  shareButtonLabel: {
    fontFamily: fontFamily.appBold,
    fontSize: 16,
    lineHeight: 20,
  },
});
