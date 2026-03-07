import { type ReactNode } from "react";
import { StyleSheet, View, type ViewStyle } from "react-native";
import { Image } from "expo-image";

interface OnboardingImageBackgroundProps {
  source: number;
  children: ReactNode;
  overlayOpacity?: number;
  style?: ViewStyle;
}

export function OnboardingImageBackground({
  source,
  children,
  overlayOpacity = 0.5,
  style,
}: OnboardingImageBackgroundProps) {
  return (
    <View style={[styles.container, style]}>
      <Image
        source={source}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        cachePolicy="memory-disk"
        transition={120}
      />
      <View
        pointerEvents="none"
        style={[
          styles.overlay,
          { backgroundColor: `rgba(7,11,20,${overlayOpacity})` },
        ]}
      />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#070b14",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
});
