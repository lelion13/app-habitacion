"use client";

import type { ReactNode } from "react";

type CallVisualState = "idle" | "calling" | "connected";

interface HabitacionCallButtonProps {
  label: string;
  icon: ReactNode;
  ringColor: string;
  visualState: CallVisualState;
  disabled: boolean;
  onClick: () => void;
}

export function HabitacionCallButton({
  label,
  icon,
  ringColor,
  visualState,
  disabled,
  onClick,
}: HabitacionCallButtonProps) {
  const base =
    "flex-1 flex flex-col items-center justify-center gap-2 rounded-xl font-black text-lg py-6 transition-all duration-150 select-none touch-manipulation";

  if (visualState !== "idle") {
    const isConnected = visualState === "connected";
    return (
      <div
        className={`${base} relative overflow-hidden`}
        style={{
          background: isConnected ? "rgba(16,185,129,0.2)" : "rgba(245,158,11,0.15)",
          border: `2px solid ${isConnected ? "#10b981" : ringColor}`,
          color: isConnected ? "#6ee7b7" : "#fcd34d",
        }}
      >
        {visualState === "calling" && (
          <span
            className="absolute inset-0 animate-ping rounded-xl opacity-20"
            style={{ background: ringColor }}
          />
        )}
        <span className="relative z-10">{icon}</span>
        <span className="relative z-10 text-base">{label}</span>
        {visualState === "calling" && (
          <span className="relative z-10 text-xs font-bold opacity-75 animate-pulse">
            Llamando...
          </span>
        )}
        {isConnected && (
          <span className="relative z-10 text-xs font-bold text-emerald-400">
            En atención
          </span>
        )}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`${base} active:scale-95 disabled:cursor-not-allowed`}
      style={{
        background: disabled ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.06)",
        border: `2px solid ${disabled ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.12)"}`,
        color: disabled ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.9)",
      }}
    >
      {icon}
      <span className="text-base">{label}</span>
    </button>
  );
}
