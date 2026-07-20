"use client";

import { CheckCircle, Phone, X } from "lucide-react";
import type { CallTargetRole, CallType } from "@/lib/types";
import { CALL_TYPE_LABELS, CALL_TARGET_LABELS } from "@/lib/types";
import { CALL_TARGET_THEME, HABITACION_MUTED } from "@/lib/habitacion-theme";
import { HabitacionModal } from "./HabitacionModal";

interface HabitacionCallModalProps {
  open: boolean;
  targetRole: CallTargetRole;
  callType: CallType;
  status: string;
  elapsedSeconds: number;
  cancelling: boolean;
  onCancel: () => void;
}

function formatElapsed(seconds: number) {
  const m = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export function HabitacionCallModal({
  open,
  targetRole,
  callType,
  status,
  elapsedSeconds,
  cancelling,
  onCancel,
}: HabitacionCallModalProps) {
  const theme = CALL_TARGET_THEME[targetRole];
  const isPending = status === "pending";
  const roleLabel = CALL_TARGET_LABELS[targetRole];
  const typeLabel = CALL_TYPE_LABELS[callType].toLowerCase();

  const title = isPending
    ? targetRole === "family"
      ? "Invitación enviada"
      : `Llamando a ${roleLabel}`
    : targetRole === "family"
      ? "Familiar en videollamada"
      : `${roleLabel} en atención`;

  const actionLabel = isPending
    ? cancelling
      ? "Cancelando…"
      : "Cancelar llamada"
    : cancelling
      ? "Finalizando…"
      : "Finalizar llamada";

  return (
    <HabitacionModal open={open} title={title}>
      <div className="flex flex-col items-center gap-4 px-2 py-1 text-center">
        {isPending ? (
          <div
            className="flex h-16 w-16 items-center justify-center rounded-full"
            style={{ background: "rgba(254,154,0,0.15)", color: "#ffd230" }}
          >
            <Phone size={32} className="animate-pulse" strokeWidth={2.5} />
          </div>
        ) : (
          <div
            className="flex h-16 w-16 items-center justify-center rounded-full"
            style={{ background: "rgba(0,188,125,0.2)", color: "#5ee9b5" }}
          >
            <CheckCircle size={32} strokeWidth={2.5} />
          </div>
        )}

        <div>
          <p className={`text-xl font-black ${theme.textClass}`}>
            {title}
          </p>
          <p className="mt-1 text-base font-semibold" style={{ color: HABITACION_MUTED }}>
            {isPending
              ? targetRole === "family"
                ? `Esperando que abra el enlace · ${typeLabel}`
                : `Esperando respuesta · ${typeLabel}`
              : `${typeLabel} · ${formatElapsed(elapsedSeconds)}`}
          </p>
          {isPending && (
            <p
              className="mt-2 text-2xl font-black tabular-nums text-white"
              aria-live="polite"
            >
              {formatElapsed(elapsedSeconds)}
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={onCancel}
          disabled={cancelling}
          className="flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-base font-black text-white transition-all active:scale-[0.98] disabled:opacity-50"
          style={{ background: "#ef4444" }}
        >
          <X size={20} strokeWidth={3} />
          {actionLabel}
        </button>
      </div>
    </HabitacionModal>
  );
}
