import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from "react-native";
import { Image, type ImageSource } from "expo-image";

import { fontFamily, radii, shadows, spacing, useTheme } from "@/src/theme";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CollectionCardProps {
  /** Cover art source */
  imageSource: ImageSource;
  /** Collection title rendered over bottom strip */
  title: string;
  onPress?: () => void;
  style?: ViewStyle;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CollectionCard({
  imageSource,
  title,
  onPress,
  style,
}: CollectionCardProps) {
  const { colors, isDark } = useTheme();
  const stripBackground = isDark ? "rgba(7, 11, 20, 0.68)" : "rgba(255, 255, 255, 0.82)";

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.container,
        { backgroundColor: colors.surface.card },
        pressed && onPress ? styles.pressed : undefined,
        style,
      ]}
    >
      <Image
        source={imageSource}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        transition={200}
      />

      {/* Bottom title strip — text-safe zone (bottom ~18%) */}
      <View style={[styles.bottomStrip, { backgroundColor: stripBackground }]}>
        <Text style={[styles.title, { color: colors.text.primary }]} numberOfLines={1}>
          {title}
        </Text>
      </View>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    aspectRatio: 4 / 5,
    borderRadius: radii.lg,
    overflow: "hidden",
    ...shadows.cardSubtle,
  },
  pressed: {
    opacity: 0.92,
  },
  bottomStrip: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  title: {
    fontFamily: fontFamily.appSemiBold,
    fontSize: 15,
  },
});
