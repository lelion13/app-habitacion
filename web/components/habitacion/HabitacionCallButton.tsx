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
  fullWidth?: boolean;
}

export function HabitacionCallButton({
  label,
  icon,
  ringColor,
  visualState,
  disabled,
  onClick,
  fullWidth = false,
}: HabitacionCallButtonProps) {
  const widthClass = fullWidth ? "w-full max-w-md" : "";
  const base =
    `habitacion-call-btn ${widthClass} flex flex-col items-center justify-center gap-1 rounded-xl font-black transition-colors duration-150 select-none touch-manipulation`;

  if (visualState !== "idle") {
    const isConnected = visualState === "connected";
    return (
      <div
        className={`${base} relative overflow-hidden`}
        style={{
          background: isConnected ? "rgba(0,188,125,0.2)" : "rgba(254,154,0,0.15)",
          border: `2px solid ${isConnected ? "#00bc7d" : ringColor}`,
          color: isConnected ? "#5ee9b5" : "#ffd230",
        }}
        aria-current="true"
      >
        {visualState === "calling" && (
          <span
            className="absolute inset-0 animate-ping rounded-xl opacity-20"
            style={{ background: ringColor }}
          />
        )}
        <span className="relative z-10">{icon}</span>
        <span className="relative z-10 text-base">{label}</span>
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
