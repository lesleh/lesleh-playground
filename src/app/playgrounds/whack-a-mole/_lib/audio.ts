// A tiny Web Audio synth so hits and misses have some punch without shipping
// any sound files. Everything is guarded: if the API is missing or blocked we
// just fall silent rather than throwing mid-game.

type WindowWithWebkit = Window &
  typeof globalThis & { webkitAudioContext?: typeof AudioContext };

export interface Sounds {
  unlock: () => void;
  hit: (mult: number) => void;
  miss: () => void;
}

export function createSounds(): Sounds {
  let ctx: AudioContext | null = null;

  const ensure = (): AudioContext | null => {
    try {
      if (!ctx) {
        const Ctor =
          window.AudioContext || (window as WindowWithWebkit).webkitAudioContext;
        if (!Ctor) return null;
        ctx = new Ctor();
      }
      if (ctx.state === "suspended") void ctx.resume();
      return ctx;
    } catch {
      return null;
    }
  };

  // A short pitched blip with a fast exponential decay.
  const blip = (
    freq: number,
    duration: number,
    type: OscillatorType,
    peak: number,
  ) => {
    const c = ensure();
    if (!c) return;
    const now = c.currentTime;
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    // A quick downward chirp gives the "thock" its shape.
    osc.frequency.exponentialRampToValueAtTime(freq * 0.6, now + duration);
    gain.gain.setValueAtTime(peak, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    osc.connect(gain).connect(c.destination);
    osc.start(now);
    osc.stop(now + duration);
  };

  return {
    // Called from the start gesture so the context is unlocked up front.
    unlock: () => {
      ensure();
    },
    hit: (mult: number) => {
      // Higher multipliers ring a little brighter.
      blip(320 + mult * 70, 0.09, "square", 0.14);
    },
    miss: () => {
      blip(150, 0.16, "sine", 0.08);
    },
  };
}
