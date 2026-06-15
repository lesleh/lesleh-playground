import {
  prizeTier,
  payoutFor,
  singleDraw,
  runBatch,
  luckyDip,
  PICK,
  POOL_SIZE,
  TIER_BY_ID,
  type Rng,
} from "./lottery";

// An rng that always returns 0 makes shuffleDraw a no-op, so the pool stays
// [1..59]: main = [1,2,3,4,5,6], bonus = 7. Deterministic and predictable.
const zeroRng: Rng = () => 0;

describe("prizeTier", () => {
  it("maps match counts to tiers", () => {
    expect(prizeTier(0, false)).toBeNull();
    expect(prizeTier(1, false)).toBeNull();
    expect(prizeTier(2, false)).toBe("match2");
    expect(prizeTier(3, false)).toBe("match3");
    expect(prizeTier(4, false)).toBe("match4");
    expect(prizeTier(5, false)).toBe("match5");
    expect(prizeTier(6, false)).toBe("match6");
  });

  it("promotes a 5-match to the bonus tier only when the bonus matches", () => {
    expect(prizeTier(5, true)).toBe("match5bonus");
    expect(prizeTier(5, false)).toBe("match5");
  });

  it("ignores the bonus ball for non-5 matches", () => {
    expect(prizeTier(4, true)).toBe("match4");
    expect(prizeTier(6, true)).toBe("match6");
    expect(prizeTier(1, true)).toBeNull();
  });
});

describe("payoutFor", () => {
  it("returns 0 for no prize", () => {
    expect(payoutFor(null)).toBe(0);
  });

  it("returns the tier payout", () => {
    expect(payoutFor("match2")).toBe(2);
    expect(payoutFor("match6")).toBe(6700000);
    expect(payoutFor("match5bonus")).toBe(1000000);
  });
});

describe("singleDraw", () => {
  it("produces 6 sorted distinct main balls and a distinct bonus", () => {
    const result = singleDraw([1, 2, 3, 4, 5, 6]);
    expect(result.main).toHaveLength(PICK);
    const all = new Set([...result.main, result.bonus]);
    expect(all.size).toBe(PICK + 1);
    for (const n of all) {
      expect(n).toBeGreaterThanOrEqual(1);
      expect(n).toBeLessThanOrEqual(POOL_SIZE);
    }
    expect([...result.main]).toEqual([...result.main].sort((a, b) => a - b));
  });

  it("scores a full jackpot match", () => {
    const result = singleDraw([1, 2, 3, 4, 5, 6], zeroRng);
    expect(result.main).toEqual([1, 2, 3, 4, 5, 6]);
    expect(result.bonus).toBe(7);
    expect(result.matchCount).toBe(6);
    expect(result.tier).toBe("match6");
    expect(result.payout).toBe(6700000);
  });

  it("scores a 5 + bonus when the sixth pick is the bonus ball", () => {
    const result = singleDraw([1, 2, 3, 4, 5, 7], zeroRng);
    expect(result.matchCount).toBe(5);
    expect(result.bonusMatched).toBe(true);
    expect(result.tier).toBe("match5bonus");
  });

  it("scores a plain 5 when the sixth pick misses entirely", () => {
    const result = singleDraw([1, 2, 3, 4, 5, 20], zeroRng);
    expect(result.matchCount).toBe(5);
    expect(result.bonusMatched).toBe(false);
    expect(result.tier).toBe("match5");
  });

  it("returns no prize for a single match", () => {
    const result = singleDraw([1, 30, 40, 50, 55, 59], zeroRng);
    expect(result.matchCount).toBe(1);
    expect(result.tier).toBeNull();
    expect(result.payout).toBe(0);
  });
});

describe("runBatch", () => {
  it("tallies winnings and spend across draws", () => {
    const result = runBatch([1, 2, 3, 4, 5, 6], 10, zeroRng);
    expect(result.draws).toBe(10);
    expect(result.spent).toBe(20);
    expect(result.tierCounts.match6).toBe(10);
    expect(result.won).toBe(10 * 6700000);
    expect(result.biggestWin).toBe(6700000);
  });

  it("records zero winnings when nothing matches", () => {
    const result = runBatch([10, 11, 12, 13, 14, 15], 5, zeroRng);
    expect(result.won).toBe(0);
    expect(result.biggestWin).toBe(0);
    expect(Object.values(result.tierCounts).every((c) => c === 0)).toBe(true);
  });

  it("roughly recovers the published 3-ball odds over many draws", () => {
    // Statistical smoke test: with real randomness, ~1 in 96.2 tickets should
    // hit 3 balls. Allow a generous band so the test is not flaky.
    const result = runBatch([1, 2, 3, 4, 5, 6], 200000);
    const rate = result.tierCounts.match3 / result.draws;
    const expected = 1 / (TIER_BY_ID.match3.chance + 1);
    expect(rate).toBeGreaterThan(expected * 0.6);
    expect(rate).toBeLessThan(expected * 1.6);
  });
});

describe("luckyDip", () => {
  it("returns 6 distinct sorted numbers in range", () => {
    const picks = luckyDip();
    expect(picks).toHaveLength(PICK);
    expect(new Set(picks).size).toBe(PICK);
    expect([...picks]).toEqual([...picks].sort((a, b) => a - b));
    for (const n of picks) {
      expect(n).toBeGreaterThanOrEqual(1);
      expect(n).toBeLessThanOrEqual(POOL_SIZE);
    }
  });
});
