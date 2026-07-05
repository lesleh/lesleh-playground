# Neuroevolution: seed-addressable tracks

Goal: make tracks reproducible and shareable so a specialist can be paired with the track it's good at. A track is fully determined by an integer seed (+ the fixed 900x600 viewport), so "saving a track" becomes "saving a number."

Motivation: a specialist brain is only meaningful with its track, but tracks are currently ephemeral (generated from a shared RNG stream, never recorded, overwritten). You can save the brain but not the world it mastered.

Implementation to be pushed directly to main (no PR).

## Core change

Make track generation a pure function of a single integer seed, and record that seed.

- `buildTrack(viewport, seed: number)` builds its own `mulberry32(seed)` internally (today it takes a shared `rand`, so a track isn't cleanly one-seed-one-track).
- `Track` gains a `seed` field. Since Track is already serialized to localStorage, the seed persists for free.
- **Separate the RNG streams in `createWorld`**: today one shared rand builds the track *and* the initial population, so the track isn't reproducible from a seed alone. Give the track its own seed-derived rand and the population a different one. Then `buildTrack(vp, seed)` reproduces a track exactly.

## Surface it

- Show the current track's seed in the telemetry/header.
- A seed input: type a number → rebuild that exact track (fixed mode). Enables sharing ("try seed 4271").
- Brain export meta already has room; include the track seed so a specialist file carries its home track. On import, offer to load that track too.

## Verify

- `buildTrack(vp, s)` deep-equals `buildTrack(vp, s)` (pure); different seeds differ (already tested).
- A specialist reproduces its finish time on its seed's track.

## Caveats

- Signature change ripples through callers/tests (`buildTrack(cfg, mulberry32(x))` → `buildTrack(cfg, x)`): car/track/world/optimum/wallGrid tests. Mechanical but broad.
- Old localStorage saves store track *geometry*, not a seed, so they still load; seed just unknown (default/none) for pre-existing saves. No version bump needed.

## Unresolved

- Seed representation in the UI: raw number, or a short shareable code?
- Embed the track seed in every brain export, or only when spotlighting a specialist?
- Vary-track rotates tracks each generation; expose those seeds or ignore (the generalist is track-independent, so it doesn't need one)?
- New-track seed choice: incrementing counter vs random int.
