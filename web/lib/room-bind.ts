export const ROOM_KEY_STORAGE = "app_habitacion_room_key";
export const PWA_INSTALLED_STORAGE = "app_habitacion_pwa_installed";

export function readStoredRoomKey(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const value = localStorage.getItem(ROOM_KEY_STORAGE)?.trim();
    return value || null;
  } catch {
    return null;
  }
}

export function writeStoredRoomKey(key: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(ROOM_KEY_STORAGE, key.trim());
  } catch {
    /* storage unavailable */
  }
}

export function clearStoredRoomKey(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(ROOM_KEY_STORAGE);
  } catch {
    /* storage unavailable */
  }
}

/** URL key wins when present; otherwise use stored key. */
export function pickRoomKeyCandidate(
  urlKey: string | null | undefined,
  storedKey?: string | null,
): string {
  const fromUrl = urlKey?.trim() ?? "";
  if (fromUrl) return fromUrl;
  const stored = storedKey ?? readStoredRoomKey();
  return stored?.trim() ?? "";
}

export function markPwaInstalled(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(PWA_INSTALLED_STORAGE, "1");
  } catch {
    /* storage unavailable */
  }
}

export function isStandalonePwa(): boolean {
  if (typeof window === "undefined") return false;

  const displayModes = [
    "fullscreen",
    "standalone",
    "minimal-ui",
    "window-controls-overlay",
  ] as const;

  if (
    displayModes.some((mode) =>
      window.matchMedia(`(display-mode: ${mode})`).matches,
    )
  ) {
    return true;
  }

  const nav = window.navigator as Navigator & { standalone?: boolean };
  if (nav.standalone === true) return true;

  if (document.referrer.startsWith("android-app://")) return true;

  // Some Android installs hide browser chrome but keep display-mode: browser.
  const isAndroid = /android/i.test(navigator.userAgent);
  if (isAndroid && !window.matchMedia("(display-mode: browser)").matches) {
    return true;
  }

  return false;
}

export function habitacionPathForKey(roomKey: string): string {
  return `/habitacion?key=${encodeURIComponent(roomKey)}`;
}

export function setDynamicManifestLink(roomKey: string): void {
  if (typeof document === "undefined") return;
  const href = `/api/manifest?key=${encodeURIComponent(roomKey)}`;
  let link = document.querySelector<HTMLLinkElement>('link[rel="manifest"]');
  if (!link) {
    link = document.createElement("link");
    link.rel = "manifest";
    document.head.appendChild(link);
  }
  link.href = href;
}
