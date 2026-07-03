// Web Audio tones for Echo. Each pad has its own pitch (classic Simon tuning:
// G3 / C4 / E4 / G4) so every colour sounds distinct. The AudioContext is
// created lazily and resumed on the first user gesture, satisfying mobile
// autoplay policies. No dependency — a handful of oscillator lines.

const PAD_FREQS = [196.0, 261.63, 329.63, 392.0]; // one unique tone per pad

let ctx: AudioContext | null = null;
let muted = false;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  return ctx;
}

// Call from a user gesture (e.g. the Start tap) to unlock/resume audio.
export function resumeAudio(): void {
  const c = getCtx();
  if (c && c.state === "suspended") void c.resume();
}

export function setMuted(value: boolean): void {
  muted = value;
}

function tone(freq: number, duration: number, type: OscillatorType, volume: number): void {
  if (muted) return;
  const c = getCtx();
  if (!c) return;
  const now = c.currentTime;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  osc.connect(gain);
  gain.connect(c.destination);
  // Short attack/release envelope so notes don't click.
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(volume, now + 0.015);
  gain.gain.setValueAtTime(volume, Math.max(now + 0.015, now + duration - 0.05));
  gain.gain.linearRampToValueAtTime(0, now + duration);
  osc.start(now);
  osc.stop(now + duration + 0.02);
}

// Fixed-length tone, used for automatic sequence playback.
export function playPad(pad: number, duration = 0.4): void {
  tone(PAD_FREQS[pad] ?? 300, duration, "sine", 0.22);
}

export function playError(): void {
  tone(90, 0.5, "sawtooth", 0.18);
}

// Sustained tones for the player's own presses: the note rings for as long as
// the pad is held. Keyed by pad so multiple held pads each get their own voice.
const held = new Map<number, { osc: OscillatorNode; gain: GainNode }>();

export function startPad(pad: number): void {
  if (muted) return;
  const c = getCtx();
  if (!c) return;
  stopPad(pad); // avoid stacking duplicate voices
  const now = c.currentTime;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = "sine";
  osc.frequency.value = PAD_FREQS[pad] ?? 300;
  osc.connect(gain);
  gain.connect(c.destination);
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.22, now + 0.015);
  osc.start(now);
  held.set(pad, { osc, gain });
}

export function stopPad(pad: number): void {
  const c = getCtx();
  const voice = held.get(pad);
  if (!c || !voice) return;
  held.delete(pad);
  const now = c.currentTime;
  // Short release so cutting the note doesn't click.
  voice.gain.gain.cancelScheduledValues(now);
  voice.gain.gain.setValueAtTime(voice.gain.gain.value, now);
  voice.gain.gain.linearRampToValueAtTime(0, now + 0.04);
  voice.osc.stop(now + 0.06);
}

export function stopAllPads(): void {
  for (const pad of Array.from(held.keys())) stopPad(pad);
}
