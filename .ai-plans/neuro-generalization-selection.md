# Neuroevolution: breed for generalization (lexicographic selection)

Status: hardened via grilling. Implementation to be pushed directly to main.

## Problem

Vary-track doesn't produce generalists. One track per generation means the
population is bred for single-track performance: a crash-prone brain DNFs, the
track changes, the crash is forgotten. 6000 generations still DNF on unseen
tracks. The per-generation DNF penalty is already large (finishers out-score
crashers ~10x); the gap is structural, not penalty size.

## Fix (two changes, vary-track only)

### 1. Fresh random tracks per generation, not a fixed set

Score each brain on **K fresh random tracks every generation** (K = 4). Never
the same tracks twice, so it's un-memorizable, it can't overfit them. The
held-out battery stays **untouched**: measurement / crowning / verification
only, never bred against. (Grilling: breeding against the battery would turn the
validation set into a training set, overfitting the battery and destroying the
only generalization metric.)

### 2. Lexicographic fitness: finish dominates, speed breaks the tie

The happy medium between min (safe-but-slow, flat gradient) and mean (masks
crashes). Fitness = sum over the K tracks of a per-track score:

- Finished: `BASE + (TIME_BUDGET - finishTicks)` — a big BASE plus a speed
  bonus (faster = higher).
- DNF: `gatesReached` — distance covered; always **less than any finish**.

Pick `BASE > K * maxSpeedBonus + maxProgress` so one more finish always
outranks any speed/progress gain elsewhere. Then the scalar behaves
lexicographically:

- **More finishes always beats fewer** -> never-crash pressure, crashes can't be
  masked by speed elsewhere.
- **Among equal finishes, faster wins** -> not safe-slow.
- **DNF-distance gives an early gradient** -> climbs from "crashes everywhere"
  toward "finishes everything."

So it improves both, in order: first learn to finish (each completion is a big
score jump), then, once finishing all K, the only way up is to go faster.

## K

K = 4 fresh tracks per brain per generation. Enough that "lucky on one" can't
survive; cheap enough to stay watchable given the spatial grid + Max speed.
Bumpable.

## Design / implementation

- Under vary-track, `endGeneration` scores each car's net on K fresh random
  tracks (headless), computes the lexicographic sum, breeds by it.
- Live canvas shows one representative track; selection is headless over the K.
- Crowned generalist + verification use the untouched held-out battery.
- Fixed-track (specialist) mode unchanged.

## Cost

~Kx sim per generation (50 x 4 headless runs). Affordable with grid + Max.
Generations heavier.

## Verify

Harness: train with lexicographic multi-track selection vs the current
single-track selection; measure held-out battery finish rate AND times. Expect
fewer DNFs and competitive times (it optimises both).

## Remaining tuning (not blockers)

- BASE magnitude (must dominate; pick per the formula above).
- Speed term: sum of per-track bonuses (fast everywhere) vs weighting the worst
  track heavier.
- K (4 default) vs how watchable generations stay.
- Convergence/diversity under the harder objective (immigrants already exist).
