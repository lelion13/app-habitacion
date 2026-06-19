let sharedContext: AudioContext | null = null;

export type AlertKind = "bell" | "video";

let alertIntervalId: ReturnType<typeof setInterval> | null = null;
let currentAlertKind: AlertKind | null = null;

function getContext(): AudioContext {
  if (!sharedContext) {
    sharedContext = new AudioContext();
  }
  return sharedContext;
}

export async function unlockBellAudio(): Promise<void> {
  const ctx = getContext();
  if (ctx.state === "suspended") {
    await ctx.resume();
  }
}

export function isAudioUnlocked(): boolean {
  const ctx = sharedContext;
  return ctx != null && ctx.state === "running";
}

async function playTone(
  frequencies: number[],
  duration: number,
  gap: number,
): Promise<void> {
  const ctx = getContext();
  if (ctx.state === "suspended") {
    await ctx.resume();
  }

  const now = ctx.currentTime;
  frequencies.forEach((freq, i) => {
    const start = now + i * gap;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(0.35, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(start);
    osc.stop(start + duration + 0.05);
  });
}

export async function playBell(): Promise<void> {
  await playTone([880, 660, 880], 0.28, 0.35);
}

export async function playVideoAlert(): Promise<void> {
  await playTone([1200, 1000, 1200, 1000], 0.18, 0.22);
}

async function playForKind(kind: AlertKind): Promise<void> {
  if (kind === "video") await playVideoAlert();
  else await playBell();
}

export function stopAlertLoop(): void {
  if (alertIntervalId != null) {
    clearInterval(alertIntervalId);
    alertIntervalId = null;
  }
  currentAlertKind = null;
}

export function syncAlertLoop(
  kind: AlertKind | null,
  intervalMs = 6000,
): void {
  if (!kind) {
    stopAlertLoop();
    return;
  }
  if (currentAlertKind === kind && alertIntervalId != null) return;

  stopAlertLoop();
  currentAlertKind = kind;
  void playForKind(kind);
  alertIntervalId = setInterval(() => {
    void playForKind(kind);
  }, intervalMs);
}

export function isAlertLoopRunning(): boolean {
  return alertIntervalId != null;
}
