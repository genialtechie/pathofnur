import {
  Image,
  type ImageSourcePropType,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from "react-native";

import { fontFamily } from "@/src/theme";
import { colors, radii, shadows, spacing } from "@/src/theme/tokens";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CollectionCardProps {
  /** Cover art source */
  imageSource: ImageSourcePropType;
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
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.container,
        pressed && onPress ? styles.pressed : undefined,
        style,
      ]}
    >
      <Image
        source={imageSource}
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
      />

      {/* Bottom title strip — text-safe zone (bottom ~18%) */}
      <View style={styles.bottomStrip}>
        <Text style={styles.title} numberOfLines={1}>
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
    backgroundColor: colors.surface.card,
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
    backgroundColor: "rgba(7, 11, 20, 0.65)",
  },
  title: {
    color: colors.text.primary,
    fontFamily: fontFamily.appSemiBold,
    fontSize: 15,
  },
});
