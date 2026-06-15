// UK National Lottery (Lotto) rules and prize structure.
//
// Players pick 6 numbers from 1-59. Each draw produces 6 main balls plus a
// single bonus ball. You win based on how many of your picks match the 6 main
// balls; the bonus ball only matters at the 5-match tier, promoting it to the
// "5 + bonus" prize. Odds and payouts come from the reference table.

export const TICKET_PRICE = 2;
export const POOL_SIZE = 59;
export const PICK = 6;

export type Rng = () => number;

export type TierId =
  | "match2"
  | "match3"
  | "match4"
  | "match5"
  | "match5bonus"
  | "match6";

export interface Tier {
  id: TierId;
  label: string;
  /** Published odds expressed as "x to 1". */
  chance: number;
  payout: number;
}

// Ordered worst-to-best so tables read naturally.
export const TIERS: Tier[] = [
  { id: "match2", label: "2 balls", chance: 9, payout: 2 },
  { id: "match3", label: "3 balls", chance: 95, payout: 30 },
  { id: "match4", label: "4 balls", chance: 2179, payout: 140 },
  { id: "match5", label: "5 balls", chance: 144414, payout: 1750 },
  { id: "match5bonus", label: "5 balls + bonus", chance: 7509578, payout: 1000000 },
  { id: "match6", label: "6 balls", chance: 45057474, payout: 6700000 },
];

export const TIER_BY_ID: Record<TierId, Tier> = TIERS.reduce(
  (acc, tier) => {
    acc[tier.id] = tier;
    return acc;
  },
  {} as Record<TierId, Tier>
);

/** Maps a match outcome to its prize tier, or null for nothing. */
export function prizeTier(matchCount: number, bonusMatched: boolean): TierId | null {
  if (matchCount === 6) return "match6";
  if (matchCount === 5) return bonusMatched ? "match5bonus" : "match5";
  if (matchCount === 4) return "match4";
  if (matchCount === 3) return "match3";
  if (matchCount === 2) return "match2";
  return null;
}

export function payoutFor(tier: TierId | null): number {
  return tier ? TIER_BY_ID[tier].payout : 0;
}

function makePool(): number[] {
  const pool = new Array<number>(POOL_SIZE);
  for (let i = 0; i < POOL_SIZE; i++) pool[i] = i + 1;
  return pool;
}

// Partial Fisher-Yates: uniformly randomises the first PICK+1 slots of `pool`
// in place. Running it repeatedly on the same permuted array stays uniform, so
// the pool can be reused across a whole batch without reallocating.
function shuffleDraw(pool: number[], rng: Rng): void {
  for (let i = 0; i <= PICK; i++) {
    const j = i + Math.floor(rng() * (POOL_SIZE - i));
    const tmp = pool[i];
    pool[i] = pool[j];
    pool[j] = tmp;
  }
}

export interface DrawResult {
  /** The 6 main balls, sorted ascending. */
  main: number[];
  bonus: number;
  matchCount: number;
  bonusMatched: boolean;
  tier: TierId | null;
  payout: number;
}

/** Draws a single game and evaluates it against the ticket. */
export function singleDraw(ticket: number[], rng: Rng = Math.random): DrawResult {
  const pool = makePool();
  shuffleDraw(pool, rng);
  const main = pool.slice(0, PICK).sort((a, b) => a - b);
  const bonus = pool[PICK];

  const set = new Set(ticket);
  let matchCount = 0;
  for (const n of main) if (set.has(n)) matchCount++;
  const bonusMatched = set.has(bonus);

  const tier = prizeTier(matchCount, bonusMatched);
  return { main, bonus, matchCount, bonusMatched, tier, payout: payoutFor(tier) };
}

export type TierCounts = Record<TierId, number>;

export function emptyTierCounts(): TierCounts {
  return {
    match2: 0,
    match3: 0,
    match4: 0,
    match5: 0,
    match5bonus: 0,
    match6: 0,
  };
}

export interface BatchResult {
  draws: number;
  spent: number;
  won: number;
  tierCounts: TierCounts;
  /** Largest single payout seen in this batch, 0 if no wins. */
  biggestWin: number;
}

// Runs `count` draws against a fixed ticket as fast as possible: a reused pool,
// a lookup table for ticket membership, and no per-draw allocations.
export function runBatch(
  ticket: number[],
  count: number,
  rng: Rng = Math.random
): BatchResult {
  const inTicket = new Uint8Array(POOL_SIZE + 1);
  for (const n of ticket) inTicket[n] = 1;

  const pool = makePool();
  const tierCounts = emptyTierCounts();
  let won = 0;
  let biggestWin = 0;

  for (let d = 0; d < count; d++) {
    shuffleDraw(pool, rng);
    let m = 0;
    for (let i = 0; i < PICK; i++) m += inTicket[pool[i]];
    const tier = prizeTier(m, inTicket[pool[PICK]] === 1);
    if (tier) {
      tierCounts[tier]++;
      const payout = TIER_BY_ID[tier].payout;
      won += payout;
      if (payout > biggestWin) biggestWin = payout;
    }
  }

  return { draws: count, spent: count * TICKET_PRICE, won, tierCounts, biggestWin };
}

/** Picks 6 distinct numbers at random, sorted ascending. */
export function luckyDip(rng: Rng = Math.random): number[] {
  const pool = makePool();
  for (let i = 0; i < PICK; i++) {
    const j = i + Math.floor(rng() * (POOL_SIZE - i));
    const tmp = pool[i];
    pool[i] = pool[j];
    pool[j] = tmp;
  }
  return pool.slice(0, PICK).sort((a, b) => a - b);
}
