/**
 * Theme barrel — re-exports all design tokens and typography.
 *
 * Usage:
 *   import { colors, spacing, radii, fontFamily } from "@/src/theme";
 */

export {
  colors,
  brand,
  surface,
  text,
  interactive,
  spacing,
  radii,
  shadows,
  aspectRatios,
} from "./tokens";

export { fontFamily } from "@/src/components/navigation/typography";
