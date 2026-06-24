import type { StaffRole } from "@/lib/types";

export const HABITACION_BG = "#0d1b2a";
export const HABITACION_FG = "#f0f4f8";
export const HABITACION_MUTED = "#7a9ab5";
export const HABITACION_BORDER = "rgba(255,255,255,0.08)";
export const HABITACION_DIVIDER = "rgba(255,255,255,0.15)";

export interface RoleTheme {
  textClass: string;
  ringColor: string;
  bgStyle: string;
  borderStyle: string;
  activeBgStyle: string;
  icon: string;
}

export const ROLE_THEME: Record<StaffRole, RoleTheme> = {
  nurse: {
    textClass: "text-[#5ee9b5]",
    ringColor: "#00bc7d",
    bgStyle: "rgba(0,188,125,0.1)",
    activeBgStyle: "rgba(0,188,125,0.2)",
    borderStyle: "rgba(0,188,125,0.3)",
    icon: "✚",
  },
  quality: {
    textClass: "text-[#ffd230]",
    ringColor: "#fe9a00",
    bgStyle: "rgba(254,154,0,0.1)",
    activeBgStyle: "rgba(254,154,0,0.2)",
    borderStyle: "rgba(254,154,0,0.3)",
    icon: "◎",
  },
  doctor: {
    textClass: "text-[#74d4ff]",
    ringColor: "#00a6f4",
    bgStyle: "rgba(0,166,244,0.1)",
    activeBgStyle: "rgba(0,166,244,0.2)",
    borderStyle: "rgba(0,166,244,0.3)",
    icon: "⚕",
  },
};
