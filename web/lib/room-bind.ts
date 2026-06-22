export const ROOM_KEY_STORAGE = "app_habitacion_room_key";

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

export function isStandalonePwa(): boolean {
  if (typeof window === "undefined") return false;
  if (window.matchMedia("(display-mode: standalone)").matches) return true;
  const nav = window.navigator as Navigator & { standalone?: boolean };
  return nav.standalone === true;
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
