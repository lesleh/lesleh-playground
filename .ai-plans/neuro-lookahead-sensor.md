# Neuroevolution: look-ahead sensor

## Status: PARKED (grilled and rejected as written, 2026-07-05)

A `/grill-me` session killed this. It's a solution in search of a validated
problem: it proposes a new sensor, a genome change, and obsoleting the bundled
generalist, all before establishing the failure it's meant to fix. Also muddled
"faster" vs "not crashing" (different mechanisms), and never resolved the
oracle-vs-marking fork (exact fed curvature is privileged info; a real
"marking" would be a coarse, range-limited, *sensed* bend-warning).

Real step zero (do this before any sensor plan): diagnose the failures. Replay
the generalist on the ~2/50 tracks it crashes and watch *how* it dies:

- entered a corner too fast and couldn't steer around it → braking (which
  look-ahead could enable) might help;
- corner physically un-makeable at any speed (radius tighter than the car can
  turn even slowed) → look-ahead is useless, this plan is moot;
- a cheaper fix elsewhere (sensor blind spot, physics tuning).

Only if diagnosis shows "too-fast entry, needs to brake for a corner it can't
yet see" does a look-ahead sensor earn the right to exist. The design below is
kept for reference only.

---

Goal: give the car a sense of the track's upcoming shape so it can plan (brake early for a corner it isn't next to yet). Directly targets the "floors it, never brakes" behaviour found by probing.

## Key constraint

Feed *local upcoming shape*, not absolute position. "The road bends left over the next stretch" generalises; "I'm at corner 7" would just re-enable track memorisation. This is what keeps look-ahead compatible with the generalist goal.

## Design

- New input(s): signed curvature / bend of the centreline ahead of the car, relative to its heading, sampled at 1-2 look-ahead distances (near + far). Normalise to [-1, 1]. Start with 1-2 scalars.
- Progress source: the car already tracks `nextGate` / `gatesPassed`, giving its position along the centreline. Look ahead N gates from there and measure the net heading change (bend). Works on any track (gates exist on all), incl. unseen solo/exam tracks.
- Concatenate the look-ahead value(s) onto the existing inputs (7 sensors + speed).

## Implementation sketch

- `track.ts` (or `car.ts`): helper `lookAhead(track, nextGate, carAngle)` → bend(s) ahead, computed from centreline direction deltas over the next K gates.
- `car.ts`: append look-ahead scalars to `inputs`; `BRAIN_SHAPE` inputs grows 8 → 8 + L.
- Optional: render a small marker/arc ahead on the track to visualise it.

## Verification (quick harness, same pattern)

- Re-probe a champion: does throttle now drop *before* corners as upcoming curvature rises? (the current one doesn't).
- A/B lap time and finish rate vs the no-look-ahead champion on the same seeds.
- Success = brakes ahead of corners, faster, finish rate held.

## Caveats

- Bigger genome (more inputs) → slower evolution.
- **Shape change invalidates saved brains** — including the bundled `_brains/generalist.json` ([8,12,8,2]). It would no longer load; a new generalist must be re-evolved and re-bundled, and the persistence VERSION bumped. Plan the re-bundle as part of the work.
- Keep it local-shape only (see Key constraint), or it defeats the generalist.

## Unresolved

- How many look-ahead inputs (1 vs 2-3) and at what distances/gate counts.
- Curvature representation: heading-delta over K gates vs lateral offset of a point ahead.
- Re-bundle a fresh generalist after the shape change (old one becomes obsolete).
- Always-on vs a toggle (always-on is cleaner but breaks old saves).
