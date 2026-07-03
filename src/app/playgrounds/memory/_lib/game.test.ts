import {
  DIFFICULTIES,
  buildDeck,
  createInitialState,
  gameReducer,
  shuffle,
  type Card,
  type Difficulty,
  type GameState,
} from "./game";

// Deterministic RNG so decks and shuffles are reproducible in tests.
function seededRng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

// Build a small controllable state directly rather than through buildDeck,
// so we can assert on known shapes.
function stateWith(cards: Card[], difficulty: Difficulty = "easy"): GameState {
  return {
    difficulty,
    cards,
    firstPick: null,
    secondPick: null,
    moves: 0,
    matched: 0,
    status: "playing",
    locked: false,
  };
}

describe("shuffle", () => {
  it("preserves all elements", () => {
    const input = [1, 2, 3, 4, 5];
    const result = shuffle(input, seededRng(1));
    expect([...result].sort()).toEqual(input);
  });

  it("does not mutate the input", () => {
    const input = [1, 2, 3];
    shuffle(input, seededRng(1));
    expect(input).toEqual([1, 2, 3]);
  });
});

describe("buildDeck", () => {
  it.each(["easy", "medium", "hard"] as const)(
    "produces the right number of cards for %s",
    (difficulty) => {
      const deck = buildDeck(difficulty, seededRng(7));
      expect(deck).toHaveLength(DIFFICULTIES[difficulty].pairs * 2);
    },
  );

  it("contains exactly two of each shape", () => {
    const deck = buildDeck("medium", seededRng(7));
    const counts = new Map<string, number>();
    for (const card of deck) {
      counts.set(card.shape, (counts.get(card.shape) ?? 0) + 1);
    }
    expect(counts.size).toBe(DIFFICULTIES.medium.pairs);
    for (const count of counts.values()) {
      expect(count).toBe(2);
    }
  });

  it("assigns unique sequential ids and starts face down", () => {
    const deck = buildDeck("easy", seededRng(3));
    expect(deck.map((c) => c.id)).toEqual(deck.map((_, i) => i));
    expect(deck.every((c) => !c.isFlipped && !c.isMatched)).toBe(true);
  });
});

describe("gameReducer", () => {
  const twoPairs: Card[] = [
    { id: 0, shape: "star", isFlipped: false, isMatched: false },
    { id: 1, shape: "heart", isFlipped: false, isMatched: false },
    { id: 2, shape: "star", isFlipped: false, isMatched: false },
    { id: 3, shape: "heart", isFlipped: false, isMatched: false },
  ];

  it("flips the first card without scoring a move", () => {
    const next = gameReducer(stateWith(twoPairs), { type: "FLIP", id: 0 });
    expect(next.firstPick).toBe(0);
    expect(next.moves).toBe(0);
    expect(next.cards[0].isFlipped).toBe(true);
  });

  it("matches a pair and clears the picks", () => {
    let state = stateWith(twoPairs);
    state = gameReducer(state, { type: "FLIP", id: 0 });
    state = gameReducer(state, { type: "FLIP", id: 2 });
    expect(state.moves).toBe(1);
    expect(state.matched).toBe(1);
    expect(state.firstPick).toBeNull();
    expect(state.secondPick).toBeNull();
    expect(state.locked).toBe(false);
    expect(state.cards[0].isMatched).toBe(true);
    expect(state.cards[2].isMatched).toBe(true);
  });

  it("locks on a mismatch and unlocks on CLEAR_MISMATCH", () => {
    let state = stateWith(twoPairs);
    state = gameReducer(state, { type: "FLIP", id: 0 });
    state = gameReducer(state, { type: "FLIP", id: 1 });
    expect(state.locked).toBe(true);
    expect(state.moves).toBe(1);
    expect(state.matched).toBe(0);

    // Clicks are ignored while locked.
    const blocked = gameReducer(state, { type: "FLIP", id: 3 });
    expect(blocked).toBe(state);

    state = gameReducer(state, { type: "CLEAR_MISMATCH" });
    expect(state.locked).toBe(false);
    expect(state.firstPick).toBeNull();
    expect(state.cards[0].isFlipped).toBe(false);
    expect(state.cards[1].isFlipped).toBe(false);
  });

  it("ignores clicks on an already-flipped or matched card", () => {
    let state = stateWith(twoPairs);
    state = gameReducer(state, { type: "FLIP", id: 0 });
    expect(gameReducer(state, { type: "FLIP", id: 0 })).toBe(state);
  });

  it("transitions to won when the last pair is matched", () => {
    let state = stateWith(twoPairs);
    state = gameReducer(state, { type: "FLIP", id: 0 });
    state = gameReducer(state, { type: "FLIP", id: 2 });
    state = gameReducer(state, { type: "FLIP", id: 1 });
    state = gameReducer(state, { type: "FLIP", id: 3 });
    expect(state.matched).toBe(2);
    expect(state.status).toBe("won");
  });

  it("ignores flips once the game is won", () => {
    const won: GameState = { ...stateWith(twoPairs), status: "won" };
    expect(gameReducer(won, { type: "FLIP", id: 0 })).toBe(won);
  });

  it("resets everything on NEW_GAME", () => {
    let state = createInitialState("easy", seededRng(1));
    state = gameReducer(state, { type: "FLIP", id: 0 });
    const deck = buildDeck("hard", seededRng(2));
    const next = gameReducer(state, {
      type: "NEW_GAME",
      difficulty: "hard",
      cards: deck,
    });
    expect(next.difficulty).toBe("hard");
    expect(next.cards).toBe(deck);
    expect(next.moves).toBe(0);
    expect(next.firstPick).toBeNull();
    expect(next.status).toBe("playing");
  });
});
