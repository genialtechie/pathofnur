import { useCallback, useEffect, useRef, useState } from "react";
import {
  Pressable,
  Share,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";

import { fontFamily, spacing, useTheme } from "@/src/theme";

const DAILY_HADITH = {
  label: "Today's Hadith",
  quote:
    "The most beloved deeds to Allah are those that are most consistent, even if they are small.",
  source: "Sahih al-Bukhari 6464",
} as const;

export function HomeHadithCard() {
  const { colors } = useTheme();
  const [shareState, setShareState] = useState<"idle" | "copied" | "unavailable">("idle");
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (resetTimerRef.current) {
        clearTimeout(resetTimerRef.current);
      }
    };
  }, []);

  const handleShare = useCallback(async () => {
    const message = `"${DAILY_HADITH.quote}"\n\n${DAILY_HADITH.source}\n\nShared from Path of Nur`;

    try {
      if (
        process.env.EXPO_OS === "web" &&
        typeof navigator !== "undefined" &&
        typeof navigator.share !== "function"
      ) {
        if (navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(message);
          setShareState("copied");
          if (resetTimerRef.current) {
            clearTimeout(resetTimerRef.current);
          }
          resetTimerRef.current = setTimeout(() => {
            setShareState("idle");
            resetTimerRef.current = null;
          }, 2_000);
          return;
        }

        setShareState("unavailable");
        return;
      }

      await Share.share({
        message,
      });
      setShareState("idle");
    } catch (error) {
      console.error("Failed to share hadith:", error);
      setShareState("unavailable");
    }
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.labelRow}>
          <View
            style={[
              styles.labelDot,
              { backgroundColor: colors.brand.metallicGold },
            ]}
          />
          <Text style={[styles.label, { color: colors.text.tertiary }]}>
            {DAILY_HADITH.label}
          </Text>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Share today's hadith"
          onPress={handleShare}
          style={styles.shareButton}
        >
          <Ionicons
            name="share-social-outline"
            size={14}
            color={colors.text.secondary}
          />
          <Text style={[styles.shareLabel, { color: colors.text.secondary }]}>
            {shareState === "copied"
              ? "Copied"
              : shareState === "unavailable"
                ? "Unavailable"
                : "Share"}
          </Text>
        </Pressable>
      </View>

      <Text style={[styles.quote, { color: colors.text.primary }]} selectable>
        "{DAILY_HADITH.quote}"
      </Text>

      <Text style={[styles.source, { color: colors.text.muted }]} selectable>
        {DAILY_HADITH.source}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: spacing.xl,
    marginHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    gap: spacing.md,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: spacing.md,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  labelDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
  },
  label: {
    fontFamily: fontFamily.appSemiBold,
    fontSize: 12,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  shareButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    minHeight: 24,
  },
  shareLabel: {
    fontFamily: fontFamily.appSemiBold,
    fontSize: 13,
  },
  quote: {
    fontFamily: fontFamily.scriptureRegular,
    fontSize: 24,
    lineHeight: 36,
  },
  source: {
    fontFamily: fontFamily.appSemiBold,
    fontSize: 13,
    letterSpacing: 0.3,
  },
});
