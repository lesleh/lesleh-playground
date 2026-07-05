# Neuroevolution: save a specialist's track

Goal: pair a specialist brain with the exact track it mastered, so a bundled/exported specialist is actually usable (it only drives its home track well; on anything else it crashes). Store the track's **full geometry** with the brain: 100% reproducible, immune to codegen changes and cross-engine float differences.

Why geometry, not a seed (settled by grilling): a seed is a fragile *pointer* to a track, it only resolves under byte-identical `buildTrack` code (which changes often), and `Math.sin/cos` aren't guaranteed bit-identical across JS engines, so a shared seed can drift. Generator versioning would "fix" that but is heavy and pointless once you store the data itself. Geometry is the actual track: it reproduces exactly, forever.

Implementation to be pushed directly to main (no PR).

## Scope

- **Specialist export only, opt-in.** A generalist is track-independent, so it carries no track. Only offer to bundle the track when exporting a specialist (Spotlight = Track), and make it a choice.
- Generalists: unchanged (no track).

## Design

- The brain export file optionally gains a `track` field holding the full `Track` geometry (already JSON-serializable, persistence proves it), plus a small format/version stamp for compatibility.
- ~a few KB on top of the ~7.5KB brain. Fine.
- `brainIO`: serialize brain (+ optional track); on parse, validate the track's shape (gate/wall structure, viewport) against the current sim and fail loudly if incompatible, same spirit as the existing network-shape guard.
- Import: if the file carries a track, load brain **and** track and race it solo on that exact track (not the current one). No track (generalist, or opted out) → current behaviour (solo on the current track).

## Verify

- Round-trip: export a specialist+track, re-import, loaded track deep-equals the original, and the brain reproduces its finish time on it (sim is deterministic).
- Bundled-file guard test (like the generalist one): any committed specialist file loads and its track validates against the current `Track` shape.

## Caveats / compat

- A `Track` shape change (new fields, gate semantics) invalidates old bundled tracks, hence the format stamp + import validation so it fails loudly, not silently.
- Bigger export files (still tiny). No RNG refactor, no `buildTrack` signature change, no test churn, this is the cheap option as well as the robust one.

## Dropped (was the previous plan)

- Seed-addressable tracks and the `createWorld` RNG-stream split: unnecessary once geometry is stored. If casual "share a track by a short number" is ever wanted, revisit separately and accept it's approximate.

## Unresolved

- Where the "include track?" opt-in surfaces (a toggle by Export, shown only for specialists?).
- Also stash the achieved time in meta for display on import? (cheap, nice.)
- Commit an example specialist+track in `_brains/`, or just support the format? (generalist stays regardless.)
