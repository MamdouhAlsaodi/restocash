export const colors = {
  bg: "#1a1a2e",
  card: "#232347",
  cardAlt: "#2a2a4a",
  white: "#f5f5f5",
  muted: "#8888aa",
  border: "#333355",
  primary: "#4a6cf7",
  primaryDark: "#3a56d4",
  gold: "#d4af37",
  green: "#2ecc71",
  danger: "#e74c3c",
  amber: "#f39c12",
} as const;

export const typography = {
  title: {
    color: colors.white,
    fontWeight: "700" as const,
  },
  body: {
    color: colors.white,
    fontSize: 16,
  },
  label: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: "600" as const,
  },
  price: {
    color: colors.gold,
    fontWeight: "700" as const,
    fontSize: 16,
  },
};
