/**
 * Path of Nur — Design System Tokens
 *
 * Single source of truth for colors, spacing, radii, and shadows.
 * Values sourced from blueprint.md and existing layout conventions.
 *
 * Usage: import { colors, spacing, radii } from "@/src/theme";
 */

// ---------------------------------------------------------------------------
// Colors
// ---------------------------------------------------------------------------

/** Brand palette from blueprint.md §2 */
export const brand = {
  deepForestGreen: "#355E3B",
  metallicGold: "#C5A021",
  midnightBlue: "#2C5292",
  richBlack: "#121212",
  paperWhite: "#FAFAFA",
} as const;

/** Semantic surface colors derived from existing layouts */
export const surface = {
  /** Primary app background */
  background: "#070b14",
  /** Elevated card / panel background */
  card: "#0b1220",
  /** Tab bar background */
  tabBar: "#0b1220",
  /** Subtle border between panes */
  border: "#111a2a",
  /** Elevated border for interactive cards */
  borderElevated: "#1a2639",
  /** Subtle interactive border */
  borderInteractive: "#223146",
} as const;

/** Text colors */
export const text = {
  /** Primary heading / body text on dark */
  primary: "#f3f5f7",
  /** Secondary labels and descriptions */
  secondary: "#b4c0d1",
  /** Tertiary kickers, captions */
  tertiary: "#93a1b5",
  /** Muted / disabled text */
  muted: "#607089",
  /** Text on gold CTA buttons */
  onAccent: "#070b14",
  /** Light dismiss / secondary buttons */
  light: "#d6deea",
} as const;

/** Interactive state colors */
export const interactive = {
  /** Active tab / highlight accent */
  active: brand.metallicGold,
  /** Inactive tab / icon tint */
  inactive: "#607089",
  /** Selected state border */
  selectedBorder: brand.metallicGold,
  /** Selected state background */
  selectedBackground: "#101a2b",
} as const;

/** Bundled color export */
export const colors = {
  brand,
  surface,
  text,
  interactive,
} as const;

// ---------------------------------------------------------------------------
// Spacing (4-px grid)
// ---------------------------------------------------------------------------

export const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  "2xl": 28,
  "3xl": 32,
  "4xl": 40,
  "5xl": 48,
} as const;

// ---------------------------------------------------------------------------
// Border radii
// ---------------------------------------------------------------------------

export const radii = {
  sm: 8,
  md: 14,
  lg: 18,
  xl: 24,
  pill: 999,
} as const;

// ---------------------------------------------------------------------------
// Shadows (dark-mode optimized)
// ---------------------------------------------------------------------------

export const shadows = {
  card: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  cardSubtle: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
} as const;

// ---------------------------------------------------------------------------
// Card aspect ratios (numeric width / height)
// ---------------------------------------------------------------------------

export const aspectRatios = {
  /** Portrait hero / collection card (4:5) */
  portrait: 4 / 5,
  /** Landscape hero card (16:9) */
  landscape: 16 / 9,
  /** Square utility card */
  square: 1,
} as const;
