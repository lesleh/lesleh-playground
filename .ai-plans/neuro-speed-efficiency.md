# Neuroevolution: faster without crashing

Goal: shift the speed/safety frontier. Make evolved drivers carry more speed on a track without raising crash rate.

## Root cause (from probing the committed generalist)

Bang-bang controller: steering pins to ±1.00, throttle pins to ~0.95, always. It never does what a fast driver needs: proportional steering (hold a precise line) or braking (carry optimal corner speed). It survives by "steer hard, floor it" (robust, but slow, sits above the track optimum).

Mechanistic cause: tanh saturation. Evolution drove weights large, so neurons + outputs sit near ±1, switch-like not analog. Can't modulate smoothly when saturated. So bang-bang is a side effect of large weights, not a chosen strategy. That's the lever.

## Levers (ranked by bang-for-buck)

1. **Weight-magnitude penalty in fitness (regularisation).** Subtract a small term ∝ sum of squared weights (tune coef) from fitness. Pulls neurons into their linear range → enables proportional steer + partial/negative throttle. Attacks saturation directly. One-line fitness change. The "maybe free smoothness" bet.
2. **Selection pressure for speed.** Currently "floor it" finishes, so no pressure to brake. Fix: train on tighter tracks where flooring it crashes (must slow to finish), and/or speed-weight fitness among finishers (finish = hard gate, then reward lower time). Pushes off the floor-it local optimum toward brake-and-carry-speed.
3. **Forgiving exploration.** Brake/line policies are worse before better. Best-of-three, immigrants, diversity so the transition isn't punished.

## Experiment (quick harness, same pattern as prior ones)

- Add optional `weightPenalty` to SimConfig; apply in the fitness (or as a post-generation adjustment to scored fitness).
- Evolve penalty=0 vs penalty=k across a few seeds, same generations.
- Measure per condition:
  - finish rate on N unseen tracks (the safety metric),
  - best lap time (the speed metric),
  - re-probe the champion: saturation (mean|act|), and whether steer/throttle now modulate instead of pinning.
- Success = de-saturated AND faster AND finish rate held.

## Caveat

Speed vs not-crashing is a genuine Pareto tradeoff. Lever 1 might buy smoothness for near-free; levers 2/3 trade some safety for speed. No free lunch, tune, don't assume.

## Unresolved

- Penalty coefficient k (sweep a few).
- Does de-saturation actually improve driving or just change it? (the experiment answers this)
- How to weight speed vs finishing in fitness without regressing robustness.
- Apply regularisation to all evolution, or only a separate "hot-lap" mode, so the generalist stays safe?
