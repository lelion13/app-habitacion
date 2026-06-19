import { isAudioUnlocked, unlockBellAudio } from "./bell";

const AUDIO_SESSION_KEY = "app_habitacion_audio_unlocked";

export function markAudioUnlocked(): void {
  try {
    sessionStorage.setItem(AUDIO_SESSION_KEY, "1");
  } catch {
    /* sessionStorage unavailable */
  }
}

export function wasAudioUnlockedThisSession(): boolean {
  try {
    return sessionStorage.getItem(AUDIO_SESSION_KEY) === "1";
  } catch {
    return false;
  }
}

export async function enableAlertAudio(
  setReady: (ready: boolean) => void,
): Promise<boolean> {
  try {
    await unlockBellAudio();
    const ok = isAudioUnlocked();
    if (ok) {
      markAudioUnlocked();
      setReady(true);
    }
    return ok;
  } catch {
    return false;
  }
}
