"use client";

import { useEffect, useState } from "react";
import { useIsStandalonePwa } from "@/lib/use-is-standalone-pwa";

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
    <div className="mb-4 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3">
      <p className="text-sm font-medium text-sky-950">
        Instale la app en esta tablet para abrirla a pantalla completa desde el
        inicio. El icono debe llamarse «{iconName}».
      </p>
      {installEvent && (
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={installing}
            onClick={() => void handleInstall()}
            className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-50"
          >
            {installing ? "Instalando…" : "Instalar en esta tablet"}
          </button>
          <button
            type="button"
            onClick={() => setHidden(true)}
            className="rounded-lg border border-sky-300 px-4 py-2 text-sm font-medium text-sky-900 hover:bg-sky-100"
          >
            Ahora no
          </button>
        </div>
      )}
      <p className="mt-3 text-xs leading-relaxed text-sky-900/80">
        Si no aparece el botón de instalar: abra el menú ⋮ de Chrome y elija
        «Instalar aplicación» o «Agregar a la pantalla principal». Use siempre
        el enlace con clave de esta habitación.
      </p>
    </div>
  );
}
