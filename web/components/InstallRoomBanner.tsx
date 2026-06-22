"use client";

import { useEffect, useState } from "react";
import { isStandalonePwa } from "@/lib/room-bind";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

interface InstallRoomBannerProps {
  roomReady: boolean;
}

export function InstallRoomBanner({ roomReady }: InstallRoomBannerProps) {
  const [installEvent, setInstallEvent] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [hidden, setHidden] = useState(false);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    if (!roomReady || isStandalonePwa()) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setInstallEvent(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, [roomReady]);

  if (!roomReady || isStandalonePwa() || hidden || !installEvent) {
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

  return (
    <div className="mb-4 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3">
      <p className="text-sm font-medium text-sky-950">
        Instale la app en esta tablet para abrirla desde el ícono del inicio.
      </p>
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
    </div>
  );
}
