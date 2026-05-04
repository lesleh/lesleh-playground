# Boids Simulation — Design Spec

**Date:** 2026-05-04
**Status:** Approved

## Overview

A Boids flocking simulation playground. 700 agents follow Craig Reynolds' three classic rules (separation, alignment, cohesion) and emergent murmurations appear. Ambient and meditative — the user watches and tunes sliders, no direct interaction with the flock.

## Architecture

### Simulation loop

- A single `<canvas>` fills the playground area
- Simulation runs on the main thread via `requestAnimationFrame`
- Each frame:
  1. Rebuild spatial grid
  2. For each boid: find neighbors via grid, compute steering forces, update velocity and position
  3. Clear canvas, draw all boids
- Slider values are held in a `ref` (not React state) so changes feed into the loop without triggering re-renders
- Boids wrap toroidally — exiting one edge re-enters the opposite side

### Spatial partitioning

- Canvas is divided into a grid of cells, each cell sized by the boid's visual range radius
- Each boid checks only the 9 surrounding cells for neighbors
- Keeps neighbor lookup O(n) even at 700 boids, enabling smooth 60fps

### File structure

Follows the existing playground pattern:

```
src/app/playgrounds/boids/
├── page.tsx
├── Preview.tsx
├── opengraph-image.tsx
├── _components/
│   ├── BoidsCanvas/
│   │   ├── index.tsx
│   │   └── BoidsCanvas.tsx     # Canvas + animation loop
│   └── Controls/
│       ├── index.tsx
│       └── Controls.tsx        # Four sliders
└── _lib/
    ├── boids.ts                # Boid update logic and steering forces
    └── spatialGrid.ts          # Spatial grid for O(n) neighbor lookup
```

## Controls

Four sliders displayed below the canvas:

| Slider | Range | Purpose |
|---|---|---|
| Separation | 0–3 | How hard boids push away from crowded neighbors |
| Alignment | 0–3 | How strongly boids match direction of neighbors |
| Cohesion | 0–3 | How strongly boids pull toward the local group center |
| Speed | 0.5–4 | Max velocity |

Defaults are tuned to produce a tight, natural-looking murmuration immediately on load. Styled dark to match the canvas — minimal labels, no chrome. Boid count is fixed at 700.

## Visuals

- **Background:** `#0d0d0d` (matches Connect Four / Rock Paper Scissors dark palette)
- **Boids:** Filled circles, ~2.5px radius, `rgba(255, 255, 255, 0.85)` — slightly transparent so dense clusters glow rather than blob
- **No trails**, no outlines, no directional arrows
- **Canvas height:** fills available viewport height minus the controls strip
- **Preview card:** seeded random positions producing a natural-looking static snapshot for the homepage grid

## What's out of scope

- Mouse/cursor interaction with the flock
- Obstacles
- Predators
- Trails
- Boid count slider
- Web Worker offloading
