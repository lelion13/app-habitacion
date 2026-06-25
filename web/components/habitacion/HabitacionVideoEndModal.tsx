"use client";

import { Video, X } from "lucide-react";
import { HABITACION_MUTED } from "@/lib/habitacion-theme";
import { HabitacionModal } from "./HabitacionModal";

interface HabitacionVideoEndModalProps {
  open: boolean;
  statusLabel: string;
  ending: boolean;
  onEnd: () => void;
  onClose: () => void;
}

export function HabitacionVideoEndModal({
  open,
  statusLabel,
  ending,
  onEnd,
  onClose,
}: HabitacionVideoEndModalProps) {
  return (
    <HabitacionModal open={open} title="Videollamada en curso">
      <div className="flex flex-col items-center gap-4 px-2 py-1 text-center">
        <div
          className="flex h-16 w-16 items-center justify-center rounded-full"
          style={{ background: "rgba(0,166,244,0.2)", color: "#74d4ff" }}
        >
          <Video size={32} strokeWidth={2.5} />
        </div>

        <div>
          <p className="text-xl font-black text-white">Videollamada activa</p>
          <p className="mt-1 text-base font-semibold" style={{ color: HABITACION_MUTED }}>
            {statusLabel}
          </p>
        </div>

        <button
          type="button"
          onClick={onEnd}
          disabled={ending}
          className="flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-base font-black text-white transition-all active:scale-[0.98] disabled:opacity-50"
          style={{ background: "#ef4444" }}
        >
          <X size={20} strokeWidth={3} />
          {ending ? "Finalizando…" : "Confirmar finalización"}
        </button>

        <button
          type="button"
          onClick={onClose}
          disabled={ending}
          className="w-full rounded-xl border py-3 text-sm font-bold text-white/90 transition-all hover:bg-white/5 disabled:opacity-50"
          style={{ borderColor: "rgba(255,255,255,0.12)" }}
        >
          Continuar videollamada
        </button>
      </div>
    </HabitacionModal>
  );
}
