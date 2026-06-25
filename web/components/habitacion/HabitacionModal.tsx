"use client";

import type { ReactNode } from "react";
import { HABITACION_BG, HABITACION_BORDER } from "@/lib/habitacion-theme";

interface HabitacionModalProps {
  open: boolean;
  title: string;
  children: ReactNode;
  "aria-labelledby"?: string;
}

export function HabitacionModal({
  open,
  title,
  children,
  "aria-labelledby": labelledBy,
}: HabitacionModalProps) {
  if (!open) return null;

  const titleId = labelledBy ?? "habitacion-modal-title";

  return (
    <div
      className="habitacion-modal-root"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <div className="habitacion-modal-backdrop" aria-hidden />
      <div
        className="habitacion-modal-panel"
        style={{ background: HABITACION_BG, borderColor: HABITACION_BORDER }}
      >
        <h2 id={titleId} className="sr-only">
          {title}
        </h2>
        {children}
      </div>
    </div>
  );
}
