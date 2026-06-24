"use client";

import { useEffect, useState } from "react";
import { useIsStandalonePwa } from "@/lib/use-is-standalone-pwa";
import { HABITACION_BORDER, HABITACION_MUTED } from "@/lib/habitacion-theme";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

interface InstallRoomBannerProps {
  roomReady: boolean;
  roomLabel?: string;
}

export function InstallRoomBanner({
  roomReady,
  roomLabel,
}: InstallRoomBannerProps) {
  const { ready: standaloneReady, standalone } = useIsStandalonePwa();
  const [installEvent, setInstallEvent] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [hidden, setHidden] = useState(false);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    if (!roomReady || !standaloneReady || standalone) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setInstallEvent(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, [roomReady, standaloneReady, standalone]);

  if (!roomReady || !standaloneReady || standalone || hidden) {
    return null;
  }

  async function handleInstall() {
    if (!installEvent) return;
    setInstalling(true);
    try {
      await installEvent.prompt();
      await installEvent.userChoice;
      setHidden(true);
    } finally {
      setInstalling(false);
      setInstallEvent(null);
    }
  }

  const iconName = roomLabel ?? "esta habitación";

  return (
    <div
      className="mx-3 mb-1 shrink-0 rounded-xl border px-3 py-2"
      style={{
        borderColor: "rgba(56,189,248,0.3)",
        background: "rgba(56,189,248,0.08)",
      }}
    >
      <p className="text-xs font-semibold leading-snug text-sky-100 sm:text-sm">
        Instale la app en esta tablet (icono «{iconName}») para pantalla completa.
      </p>
      {installEvent && (
        <div className="mt-2 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={installing}
            onClick={() => void handleInstall()}
            className="rounded-lg bg-sky-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-sky-400 disabled:opacity-50 sm:text-sm"
          >
            {installing ? "Instalando…" : "Instalar"}
          </button>
          <button
            type="button"
            onClick={() => setHidden(true)}
            className="rounded-lg border px-3 py-1.5 text-xs font-semibold text-sky-100 hover:bg-white/5 sm:text-sm"
            style={{ borderColor: HABITACION_BORDER }}
          >
            Ahora no
          </button>
        </div>
      )}
      {!installEvent && (
        <p className="mt-1 text-[0.65rem] leading-snug sm:text-xs" style={{ color: HABITACION_MUTED }}>
          Menú ⋮ → Instalar aplicación
        </p>
      )}
    </div>
  );
}
