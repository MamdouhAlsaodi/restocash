// Modern Light Theme — approved 2026-06-24
// White background with vibrant accent colors (red/orange/yellow/green)

export const colors = {
  // Backgrounds (light)
  bg: "#FAFAFA",         // Main background (off-white)
  bgElevated: "#FFFFFF", // Cards/modals
  card: "#F5F5F5",       // Surface (light gray)
  cardAlt: "#EEEEEE",    // Alt surface

  // Text
  text: "#1A1A1A",       // Primary text (dark)
  textMuted: "#666666",  // Secondary text
  muted: "#999999",      // Tertiary/disabled
  white: "#1A1A1A",      // Legacy — use `text` instead

  // Borders
  border: "#E0E0E0",     // Subtle borders
  borderStrong: "#BDBDBD", // Emphasized borders

  // Action colors (vibrant)
  primary: "#43A047",      // Green — primary action (confirm, checkout, success)
  primaryDark: "#2E7D32",  // Pressed state
  primaryLight: "#E8F5E9", // Green tinted background
  onPrimary: "#FFFFFF",   // Text/icon on primary buttons (white on green)

  // Status colors
  danger: "#E53935",       // Red — delete, cancel, error
  dangerLight: "#FFEBEE",  // Red tinted background
  warning: "#FF9800",      // Orange — pending, retry
  warningLight: "#FFF3E0", // Orange tinted background
  success: "#43A047",      // Green — same as primary
  highlight: "#FFC107",    // Yellow — badge, active tab indicator
  highlightLight: "#FFF8E1", // Yellow tinted background

  // Legacy aliases (to avoid breaking other code)
  gold: "#FFC107",
  green: "#43A047",
  emerald: "#43A047",
  amber: "#FF9800",
  primaryBlue: "#1976D2",  // Optional blue for links
} as const;

export const typography = {
  title: {
    color: colors.text,
    fontWeight: "700" as const,
  },
  body: {
    color: colors.text,
    fontSize: 16,
  },
  label: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: "600" as const,
  },
  price: {
    color: colors.primary,
    fontWeight: "700" as const,
    fontSize: 18,
  },
};

// Common style tokens
export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;
