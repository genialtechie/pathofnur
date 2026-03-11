/**
 * Theme barrel — re-exports all design tokens and typography.
 *
 * Usage:
 *   import { colors, spacing, radii, fontFamily } from "@/src/theme";
 */

export {
  colors,
  spacing,
  radii,
  shadows,
  aspectRatios,
  brand,
} from "./tokens";

export { fontFamily } from "@/src/components/navigation/typography";

import { useColorScheme } from "react-native";
import { darkColors, lightColors, spacing, radii, shadows, aspectRatios, brand } from "./tokens";

export function useTheme() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const colors = isDark ? darkColors : lightColors;
  
  return {
    colors,
    spacing,
    radii,
    shadows,
    aspectRatios,
    isDark,
    theme: colorScheme, // exposing for debugging
  };
}
