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
// ---------------------------------------------------------------------------
// Color Palettes
// ---------------------------------------------------------------------------

const baseText = {
  primary: "#f3f5f7",
  secondary: "#b4c0d1",
  tertiary: "#93a1b5",
  muted: "#607089",
  onAccent: "#070b14",
  light: "#d6deea",
  error: "#ef9a9a",
};

const baseSurface = {
  background: "#070b14",
  card: "#0b1220",
  tabBar: "#0b1220",
  border: "#111a2a",
  borderElevated: "#1a2639",
  borderInteractive: "#223146",
};

const baseInteractive = {
  active: brand.metallicGold,
  inactive: "#607089",
  selectedBorder: brand.metallicGold,
  selectedBackground: "#101a2b",
};

export const darkColors = {
  brand,
  surface: baseSurface,
  text: baseText,
  interactive: baseInteractive,
} as const;

export const lightColors = {
  brand,
  surface: {
    background: "#FFFFFF",
    card: "#F4F5F7",
    tabBar: "#F4F5F7",
    border: "#E2E8F0",
    borderElevated: "#D1D5DB",
    borderInteractive: "#CBD5E1",
  },
  text: {
    primary: "#111827",
    secondary: "#4B5563",
    tertiary: "#6B7280",
    muted: "#9CA3AF",
    onAccent: "#FFFFFF",
    light: "#4B5563",
    error: "#EF4444",
  },
  interactive: {
    ...baseInteractive,
    inactive: "#9CA3AF",
    selectedBackground: "#FDFCF5", // Very light gold tint
  },
} as const;

// Backwards compatibility (default to dark)
export const colors = darkColors;


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
