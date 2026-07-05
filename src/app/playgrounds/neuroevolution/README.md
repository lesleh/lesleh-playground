# Neuroevolution

A population of cars, each steered by its own small neural network, learns to drive a procedural track by a genetic algorithm. There is no backpropagation and no training data: cars are scored on how they drive, the fittest are bred (uniform crossover plus Gaussian mutation), and each generation improves. The goal is a clean three-lap run, as fast as possible.

## How it works

- Each car senses the walls with seven whisker rays plus its own speed, and outputs steering and throttle. That is its entire brain: a fixed [8, 12, 8, 2] MLP.
- The car is deliberately overpowered for the narrow, many-cornered tracks, so the turn radius grows with speed and braking bites harder than the throttle. Driving well means braking for corners and carrying speed through them, a skill that takes many generations to refine.
- Progress persists to `localStorage`, so a refresh resumes where it left off.

## Two champions

The playground tracks two separate best brains, because "fastest here" and "best everywhere" are different things:

- **Track champion** is the fastest brain on the current track. A specialist. It tends to beat the estimated track optimum by cutting a tight, track-specific racing line, and it often crashes when dropped on a track it has never seen.
- **Generalist** is the brain with the best score across a fixed held-out battery of twenty tracks the population never trains on (a validation set). Brains are ranked lexicographically: finishing the most tracks wins first, then fastest average time breaks the tie. It drives a robust line that works anywhere while still pushing for pace. Turn on **Vary track** to grow one.

The **Spotlight** selector chooses which champion the solo / export / breed controls act on.

## Bundled generalist

`_brains/generalist.json` is a pre-trained generalist (generation 355). Dropped cold onto fresh, never-seen tracks it finishes **50 of 50** (mean 15.9s, worst 19.3s), averaging within ~2% of the estimated optimum lap time. It is both robust and quick: it clears tracks it has never seen without crashing, close to the fastest line a specialist would take.

To try it: open the playground, click **Import** in the Garage row, and choose this file (download the raw file from the repo first). It loads straight into a solo race so you can watch it handle new tracks.
