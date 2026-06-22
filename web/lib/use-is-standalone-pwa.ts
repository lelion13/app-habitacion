import { useEffect, useState } from "react";
import {
  isStandalonePwa,
  markPwaInstalled,
} from "@/lib/room-bind";

interface StandaloneState {
  ready: boolean;
  standalone: boolean;
}

async function detectInstalledPwa(): Promise<boolean> {
  if (isStandalonePwa()) return true;

  const getInstalledRelatedApps = (
    navigator as Navigator & {
      getInstalledRelatedApps?: () => Promise<unknown[]>;
    }
  ).getInstalledRelatedApps;

  if (!getInstalledRelatedApps) return false;

  try {
    const relatedApps = await getInstalledRelatedApps();
    if (relatedApps.length === 0) return false;

    // Installed but opened in browser tab — still offer install banner.
    return !window.matchMedia("(display-mode: browser)").matches;
  } catch {
    return false;
  }
}

export function useIsStandalonePwa(): StandaloneState {
  const [state, setState] = useState<StandaloneState>({
    ready: false,
    standalone: false,
  });

  useEffect(() => {
    let cancelled = false;

    const sync = () => {
      void detectInstalledPwa().then((standalone) => {
        if (cancelled) return;
        if (standalone) markPwaInstalled();
        setState({ ready: true, standalone });
      });
    };

    sync();

    const displayModes = [
      "fullscreen",
      "standalone",
      "minimal-ui",
      "window-controls-overlay",
    ] as const;

    const mediaQueries = displayModes.map((mode) =>
      window.matchMedia(`(display-mode: ${mode})`),
    );

    for (const mediaQuery of mediaQueries) {
      mediaQuery.addEventListener("change", sync);
    }

    const onInstalled = () => {
      markPwaInstalled();
      setState({ ready: true, standalone: true });
    };

    window.addEventListener("appinstalled", onInstalled);

    return () => {
      cancelled = true;
      for (const mediaQuery of mediaQueries) {
        mediaQuery.removeEventListener("change", sync);
      }
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  return state;
}
