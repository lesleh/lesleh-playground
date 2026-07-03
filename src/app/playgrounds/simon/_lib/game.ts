// Pure, DOM-free logic for Echo (a Simon memory game). The interactive flow,
// timers and audio live in the component; this module just owns the sequence.

export const PAD_COUNT = 4;

export type Pad = 0 | 1 | 2 | 3;

export type Rng = () => number;

// A single random pad index.
export function nextStep(rng: Rng = Math.random): Pad {
  return Math.floor(rng() * PAD_COUNT) as Pad;
}

// Return a new sequence with one extra random step appended (never mutates).
export function extend(sequence: Pad[], rng: Rng = Math.random): Pad[] {
  return [...sequence, nextStep(rng)];
}

// Does `pad` match the expected step at `index` of the sequence?
export function isInputCorrect(sequence: Pad[], index: number, pad: Pad): boolean {
  return sequence[index] === pad;
}
