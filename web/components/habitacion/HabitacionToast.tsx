"use client";

import { useEffect } from "react";
import { HABITACION_BORDER } from "@/lib/habitacion-theme";

export type HabitacionToastVariant = "error" | "success" | "info";

interface HabitacionToastProps {
  message: string | null;
  variant?: HabitacionToastVariant;
  onDismiss?: () => void;
  autoHideMs?: number;
}

const VARIANT_STYLES: Record<
  HabitacionToastVariant,
  { border: string; background: string; color: string }
> = {
  error: {
    border: "rgba(239,68,68,0.3)",
    background: "rgba(239,68,68,0.12)",
    color: "#fca5a5",
  },
  success: {
    border: "rgba(16,185,129,0.3)",
    background: "rgba(16,185,129,0.12)",
    color: "#6ee7b7",
  },
  info: {
    border: "rgba(56,189,248,0.3)",
    background: "rgba(56,189,248,0.1)",
    color: "#bae6fd",
  },
};

export function HabitacionToast({
  message,
  variant = "info",
  onDismiss,
  autoHideMs = 5000,
}: HabitacionToastProps) {
  useEffect(() => {
    if (!message || !onDismiss || autoHideMs <= 0) return;
    const id = window.setTimeout(onDismiss, autoHideMs);
    return () => window.clearTimeout(id);
  }, [message, onDismiss, autoHideMs]);

  if (!message) return null;

  const styles = VARIANT_STYLES[variant];

  return (
    <div
      className="habitacion-toast pointer-events-none"
      role="status"
      aria-live="polite"
    >
      <p
        className="pointer-events-auto mx-auto max-w-lg truncate rounded-xl border px-4 py-2.5 text-center text-sm font-semibold shadow-lg"
        style={{
          borderColor: styles.border,
          background: styles.background,
          color: styles.color,
          backdropFilter: "blur(8px)",
        }}
      >
        {message}
      </p>
    </div>
  );
}
