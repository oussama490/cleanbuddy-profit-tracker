/** Entrepôt palette — JS source for charts, manifest, and SVGs. CSS mirrors this in tokens.css. */

export const radiusPx = 12;
export const drawerMs = 250;

export const light = {
  background: "#EFF1EE",
  foreground: "#121916",
  card: "#FBFCFB",
  muted: "#5A675F",
  line: "#D5DCD6",
  accent: "#00A888",
  accentSoft: "#D4F3EC",
  ink: "#17211C",
  led: "#5FF5D0",
  profit: "#0A8F72",
  loss: "#D42B1A",
  warn: "#D4890B",
  warnInk: "#8A4F08",
  warnSoft: "#F6E6C4",
  onAccent: "#0A100E",
  input: "#FBFCFB",
  overlay: "rgba(10, 16, 14, 0.58)",
  chartRevenue: "#6D7F74",
} as const;

export const dark = {
  background: "#0C1210",
  foreground: "#E6EEE9",
  card: "#151C18",
  muted: "#8A9A91",
  line: "#2A3530",
  accent: "#3DCFB0",
  accentSoft: "#16352C",
  ink: "#0A100E",
  led: "#6FF5D4",
  profit: "#6FF5D4",
  loss: "#F07060",
  warn: "#E5A83A",
  warnInk: "#F0C56A",
  warnSoft: "#3A2E14",
  onAccent: "#0A100E",
  input: "#101714",
  overlay: "rgba(6, 10, 8, 0.72)",
  chartRevenue: "#8AA396",
} as const;

export const sidebar = {
  bg: light.ink,
  fg: "#E6EEE9",
  muted: "rgba(230, 238, 233, 0.48)",
  line: "rgba(230, 238, 233, 0.1)",
  hover: "rgba(230, 238, 233, 0.06)",
  active: "rgba(230, 238, 233, 0.1)",
  footer: "#121A16",
} as const;
