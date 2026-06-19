let sharedContext: AudioContext | null = null;

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

export async function playBell(): Promise<void> {
  const ctx = getContext();
  if (ctx.state === "suspended") {
    await ctx.resume();
  }

  const now = ctx.currentTime;
  for (let i = 0; i < 3; i++) {
    const start = now + i * 0.35;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = i % 2 === 0 ? 880 : 660;
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(0.35, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.28);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(start);
    osc.stop(start + 0.3);
  }
}
