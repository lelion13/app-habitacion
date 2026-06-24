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
      className="mx-4 mb-4 rounded-2xl border px-4 py-3"
      style={{
        borderColor: "rgba(56,189,248,0.3)",
        background: "rgba(56,189,248,0.08)",
      }}
    >
      <p className="text-sm font-semibold text-sky-100">
        Instale la app en esta tablet para abrirla a pantalla completa desde el
        inicio. El icono debe llamarse «{iconName}».
      </p>
      {installEvent && (
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={installing}
            onClick={() => void handleInstall()}
            className="rounded-lg bg-sky-500 px-4 py-2 text-sm font-bold text-white hover:bg-sky-400 disabled:opacity-50"
          >
            {installing ? "Instalando…" : "Instalar en esta tablet"}
          </button>
          <button
            type="button"
            onClick={() => setHidden(true)}
            className="rounded-lg border px-4 py-2 text-sm font-semibold text-sky-100 hover:bg-white/5"
            style={{ borderColor: HABITACION_BORDER }}
          >
            Ahora no
          </button>
        </div>
      )}
      <p className="mt-3 text-xs leading-relaxed" style={{ color: HABITACION_MUTED }}>
        Si no aparece el botón de instalar: abra el menú ⋮ de Chrome y elija
        «Instalar aplicación» o «Agregar a la pantalla principal». Use siempre
        el enlace con clave de esta habitación.
      </p>
    </div>
  );
}
