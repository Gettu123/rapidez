let ctx: AudioContext | null = null;

export function unlockAudio() {
  if (typeof window === "undefined") return;
  const AC = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return;
  if (!ctx) ctx = new AC();
  if (ctx.state === "suspended") void ctx.resume();
}

export function beepOffer() {
  if (!ctx) return;
  const now = ctx.currentTime;
  const notes = [880, 660, 880];
  notes.forEach((freq, i) => {
    const osc = ctx!.createOscillator();
    const gain = ctx!.createGain();
    osc.type = "square";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.045, now + i * 0.16 + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.16 + 0.14);
    osc.connect(gain);
    gain.connect(ctx!.destination);
    osc.start(now + i * 0.16);
    osc.stop(now + i * 0.16 + 0.16);
  });
}
