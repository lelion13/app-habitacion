import type { StaffRole } from "@/lib/types";

export const HABITACION_BG = "#0d1b2a";
export const HABITACION_FG = "#f0f4f8";
export const HABITACION_MUTED = "#7a9ab5";
export const HABITACION_BORDER = "rgba(255,255,255,0.08)";
export const HABITACION_DIVIDER = "rgba(255,255,255,0.15)";

export interface RoleTheme {
  textClass: string;
  ringColor: string;
  bgClass: string;
  activeBgClass: string;
  borderClass: string;
  icon: string;
}

export const ROLE_THEME: Record<StaffRole, RoleTheme> = {
  nurse: {
    textClass: "text-emerald-300",
    ringColor: "#10b981",
    bgClass: "bg-emerald-500/10",
    activeBgClass: "bg-emerald-500/20",
    borderClass: "border-emerald-500/30",
    icon: "✚",
  },
  quality: {
    textClass: "text-amber-300",
    ringColor: "#f59e0b",
    bgClass: "bg-amber-500/10",
    activeBgClass: "bg-amber-500/20",
    borderClass: "border-amber-500/30",
    icon: "◎",
  },
  doctor: {
    textClass: "text-sky-300",
    ringColor: "#38bdf8",
    bgClass: "bg-sky-500/10",
    activeBgClass: "bg-sky-500/20",
    borderClass: "border-sky-500/30",
    icon: "⚕",
  },
};
