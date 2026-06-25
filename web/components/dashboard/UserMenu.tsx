"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { useTelegramLink } from "@/hooks/useTelegramLink";
import { SYSTEM_ROLE_LABELS } from "@/lib/types";
import { staffBtnGhost, staffBtnPrimary, staffBtnSecondary, staffError } from "@/lib/staff-theme";

export function UserMenu() {
  const { user, token, logout } = useApp();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { status, busy, error, connect, disconnect } = useTelegramLink(token);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  if (!user) return null;

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-[#f0f4f8] hover:bg-white/10"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <span className="max-w-[10rem] truncate">{user.name}</span>
        <svg
          className={`h-4 w-4 text-[#7a9ab5] transition ${open ? "rotate-180" : ""}`}
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-72 rounded-xl border border-white/10 bg-[#132337] p-4 shadow-xl"
        >
          <div className="mb-3 border-b border-white/10 pb-3">
            <p className="font-semibold text-[#f0f4f8]">{user.name}</p>
            <p className="text-xs text-[#7a9ab5]">{user.email}</p>
            <p className="mt-1 text-xs text-[#5ee9b5]">
              {SYSTEM_ROLE_LABELS[user.systemRole]}
            </p>
          </div>

          <div className="mb-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#7a9ab5]">
              Telegram
            </p>
            <p className="mb-3 text-xs text-[#7a9ab5]">
              Avisos al celular cuando tenga escucha activa.
            </p>
            {error && <p className={`mb-2 ${staffError}`}>{error}</p>}
            {status?.linked ? (
              <div className="space-y-2">
                <span className="inline-block rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-medium text-[#5ee9b5]">
                  Vinculado
                  {status.username ? ` · @${status.username}` : ""}
                </span>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void disconnect()}
                  className={`w-full ${staffBtnGhost}`}
                >
                  Desvincular
                </button>
              </div>
            ) : (
              <button
                type="button"
                disabled={busy || !token}
                onClick={() => void connect()}
                className={`w-full ${staffBtnPrimary}`}
              >
                {busy ? "Generando enlace…" : "Conectar Telegram"}
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => {
              logout();
              router.push("/dashboard/login");
            }}
            className={`w-full ${staffBtnSecondary}`}
          >
            Cerrar sesión
          </button>
        </div>
      )}
    </div>
  );
}
