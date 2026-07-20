"use client";

import { FormEvent, useState } from "react";
import { X } from "lucide-react";
import { validateEmail } from "@/lib/validation";
import { FAMILY_THEME, HABITACION_MUTED } from "@/lib/habitacion-theme";
import { HabitacionModal } from "./HabitacionModal";

interface HabitacionFamilyInviteModalProps {
  open: boolean;
  submitting: boolean;
  error: string | null;
  onClose: () => void;
  onSubmit: (email: string, message: string) => void;
}

export function HabitacionFamilyInviteModal({
  open,
  submitting,
  error,
  onClose,
  onSubmit,
}: HabitacionFamilyInviteModalProps) {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = email.trim();
    if (!validateEmail(trimmed)) {
      setLocalError("Ingrese un email válido.");
      return;
    }
    setLocalError(null);
    onSubmit(trimmed, message.trim());
  }

  function handleClose() {
    if (submitting) return;
    setEmail("");
    setMessage("");
    setLocalError(null);
    onClose();
  }

  const displayError = localError ?? error;

  return (
    <HabitacionModal open={open} title="Invitar familiar">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 px-1 py-1">
        <p className="text-center text-sm font-semibold" style={{ color: HABITACION_MUTED }}>
          Se enviará un enlace de videollamada por correo (válido 3 horas).
        </p>

        <div>
          <label
            htmlFor="family-email"
            className={`mb-1 block text-xs font-bold uppercase tracking-wide ${FAMILY_THEME.textClass}`}
          >
            Email
          </label>
          <input
            id="family-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={submitting}
            className="w-full rounded-xl border border-white/15 bg-black/30 px-4 py-3 text-base text-white outline-none focus:border-[#e879f9]"
            placeholder="familiar@ejemplo.com"
            required
          />
        </div>

        <div>
          <label
            htmlFor="family-message"
            className="mb-1 block text-xs font-bold uppercase tracking-wide"
            style={{ color: HABITACION_MUTED }}
          >
            Mensaje (opcional)
          </label>
          <textarea
            id="family-message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            disabled={submitting}
            rows={3}
            maxLength={500}
            className="w-full resize-none rounded-xl border border-white/15 bg-black/30 px-4 py-3 text-base text-white outline-none focus:border-[#e879f9]"
            placeholder="Ej. Estamos en la habitación 101"
          />
        </div>

        {displayError && (
          <p className="text-center text-sm font-semibold text-red-300">
            {displayError}
          </p>
        )}

        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleClose}
            disabled={submitting}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/20 py-3.5 text-base font-black text-white disabled:opacity-50"
          >
            <X size={18} strokeWidth={3} />
            Cancelar
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex flex-1 items-center justify-center rounded-xl py-3.5 text-base font-black text-white disabled:opacity-50"
            style={{ background: FAMILY_THEME.ringColor }}
          >
            {submitting ? "Enviando…" : "Enviar"}
          </button>
        </div>
      </form>
    </HabitacionModal>
  );
}
