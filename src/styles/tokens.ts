/* ─── Shared design tokens ───────────────────────────
   Single source of truth for colors, fonts, and the handful of
   style objects (eyebrow / primaryBtn / ghostBtn) reused across the
   landing page, results page, and preference setup. Previously each
   of those files defined its own copy of this palette — keeping it
   in one place means a color tweak doesn't need three edits. */

export const C = {
  cream: "#faf9f5",
  creamDark: "#f2ede6",
  rust: "#d77656",
  rustDark: "#b85e3e",
  rustLight: "#f9ede7",
  green: "#166534",
  greenLight: "#f0fdf4",
  greenBorder: "#bbf7d0",
  amber: "#92400e",
  amberLight: "#fffbeb",
  amberBorder: "#fde68a",
  red: "#991b1b",
  redLight: "#fff1f2",
  redBorder: "#fecdd3",
  ink: "#1C1612",
  inkMid: "#5A4E44",
  inkFaint: "#9A8E85",
  white: "#FFFFFF",
  border: "rgba(92,70,55,0.12)",
  borderMid: "rgba(92,70,55,0.20)",
};

export const font = {
  serif: "'EB Garamond', 'Garamond', 'Georgia', serif",
  sans: "'Inter', ui-sans-serif, system-ui, sans-serif",
};

export const primaryBtn: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "0.5rem",
  padding: "0.75rem 1.6rem",
  borderRadius: "8px",
  border: "none",
  background: C.rust,
  color: C.white,
  fontFamily: font.sans,
  fontWeight: 600,
  fontSize: "0.95rem",
  cursor: "pointer",
  letterSpacing: "0.01em",
};

export const ghostBtn: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "0.5rem",
  padding: "0.75rem 1.6rem",
  borderRadius: "8px",
  border: `1px solid ${C.borderMid}`,
  background: "transparent",
  color: C.ink,
  fontFamily: font.sans,
  fontWeight: 500,
  fontSize: "0.95rem",
  cursor: "pointer",
};

export const eyebrow: React.CSSProperties = {
  fontFamily: font.sans,
  fontSize: "0.7rem",
  fontWeight: 600,
  letterSpacing: "0.12em",
  textTransform: "uppercase" as const,
  color: C.rust,
  margin: 0,
};
