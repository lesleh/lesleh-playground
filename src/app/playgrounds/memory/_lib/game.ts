// Pure game logic for the Recall memory game. Kept framework-free so the
// reducer and deck builder can be unit tested without React.

import { SHAPE_KEYS, type ShapeKey } from "./icons";

export type Difficulty = "easy" | "medium" | "hard";

export interface DifficultyConfig {
  label: string;
  pairs: number;
  // Tailwind grid-template-columns count at the widest breakpoint.
  columns: number;
}

export const DIFFICULTIES: Record<Difficulty, DifficultyConfig> = {
  easy: { label: "Easy", pairs: 6, columns: 4 },
  medium: { label: "Medium", pairs: 10, columns: 5 },
  hard: { label: "Hard", pairs: 15, columns: 6 },
};

// Seconds the whole board is revealed before it hides and play begins.
export const PREVIEW_SECONDS = 5;

export interface Card {
  id: number;
  shape: ShapeKey;
  isFlipped: boolean;
  isMatched: boolean;
}

export interface GameState {
  difficulty: Difficulty;
  cards: Card[];
  firstPick: number | null;
  secondPick: number | null;
  moves: number;
  matched: number;
  // "preview": whole board is revealed for memorising, no picks allowed yet.
  status: "preview" | "playing" | "won";
  // Locked while a mismatched pair is showing (or during preview), so further
  // clicks are ignored.
  locked: boolean;
}

export type GameAction =
  | { type: "NEW_GAME"; difficulty: Difficulty; cards: Card[] }
  | { type: "START_PLAY" }
  | { type: "FLIP"; id: number }
  | { type: "CLEAR_MISMATCH" };

// Fisher-Yates shuffle. Accepts an injectable RNG so tests stay deterministic.
export function shuffle<T>(input: T[], rng: () => number = Math.random): T[] {
  const arr = [...input];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Build a shuffled deck of `pairs` matched pairs, drawing distinct shapes.
export function buildDeck(
  difficulty: Difficulty,
  rng: () => number = Math.random,
): Card[] {
  const { pairs } = DIFFICULTIES[difficulty];
  const shapes = shuffle(SHAPE_KEYS, rng).slice(0, pairs);
  const deck = shapes.flatMap((shape) => [shape, shape]);
  return shuffle(deck, rng).map((shape, id) => ({
    id,
    shape,
    isFlipped: false,
    isMatched: false,
  }));
}

export function createInitialState(
  difficulty: Difficulty,
  rng: () => number = Math.random,
): GameState {
  return {
    difficulty,
    cards: buildDeck(difficulty, rng),
    firstPick: null,
    secondPick: null,
    moves: 0,
    matched: 0,
    status: "preview",
    locked: true,
  };
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "NEW_GAME":
      return {
        difficulty: action.difficulty,
        cards: action.cards,
        firstPick: null,
        secondPick: null,
        moves: 0,
        matched: 0,
        status: "preview",
        locked: true,
      };

    case "START_PLAY":
      if (state.status !== "preview") return state;
      return { ...state, status: "playing", locked: false };

    case "FLIP": {
      if (state.locked || state.status !== "playing") return state;

      const card = state.cards.find((c) => c.id === action.id);
      if (!card || card.isMatched || card.isFlipped) return state;

      const cards = state.cards.map((c) =>
        c.id === action.id ? { ...c, isFlipped: true } : c,
      );

      // First card of the turn.
      if (state.firstPick === null) {
        return { ...state, cards, firstPick: action.id };
      }

      // Second card: score the turn.
      const first = state.cards.find((c) => c.id === state.firstPick);
      const isMatch = first?.shape === card.shape;
      const moves = state.moves + 1;

      if (isMatch) {
        const matchedCards = cards.map((c) =>
          c.id === state.firstPick || c.id === action.id
            ? { ...c, isMatched: true }
            : c,
        );
        const matched = state.matched + 1;
        const won = matched === cards.length / 2;
        return {
          ...state,
          cards: matchedCards,
          firstPick: null,
          secondPick: null,
          moves,
          matched,
          status: won ? "won" : "playing",
          locked: false,
        };
      }

      // Mismatch: hold both face-up and lock until CLEAR_MISMATCH.
      return {
        ...state,
        cards,
        secondPick: action.id,
        moves,
        locked: true,
      };
    }

    case "CLEAR_MISMATCH": {
      const cards = state.cards.map((c) =>
        c.id === state.firstPick || c.id === state.secondPick
          ? { ...c, isFlipped: false }
          : c,
      );
      return {
        ...state,
        cards,
        firstPick: null,
        secondPick: null,
        locked: false,
      };
    }

    default:
      return state;
  }
}
