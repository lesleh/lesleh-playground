# Neuroevolution

A population of cars, each steered by its own small neural network, learns to drive a procedural track by a genetic algorithm. There is no backpropagation and no training data: cars are scored on how they drive, the fittest are bred (uniform crossover plus Gaussian mutation), and each generation improves. The goal is a clean three-lap run, as fast as possible.

## How it works

- Each car senses the walls with seven whisker rays plus its own speed, and outputs steering and throttle. That is its entire brain: a fixed [8, 12, 8, 2] MLP.
- The car is deliberately overpowered for the narrow, many-cornered tracks, so the turn radius grows with speed and braking bites harder than the throttle. Driving well means braking for corners and carrying speed through them, a skill that takes many generations to refine.
- Progress persists to `localStorage`, so a refresh resumes where it left off.

## Two champions

The playground tracks two separate best brains, because "fastest here" and "best everywhere" are different things:

- **Track champion** is the fastest brain on the current track. A specialist. It tends to beat the estimated track optimum by cutting a tight, track-specific racing line, and it often crashes when dropped on a track it has never seen.
- **Generalist** is the brain with the best worst-case time across a fixed held-out battery of five tracks the population never trains on (a validation set). It drives a safe, robust line that works anywhere, a little slower than a specialist but far less likely to crash. Turn on **Vary track** to grow one.

The **Spotlight** selector chooses which champion the solo / export / breed controls act on.

## Bundled generalist

`_brains/generalist.json` is a pre-trained generalist (generation 443). Dropped cold onto fresh, never-seen tracks it finishes **48 of 50** (mean 16.5s, worst 22.2s). It is tuned for robustness: the priority is finishing without crashing, not the fastest possible lap.

To try it: open the playground, click **Import** in the Garage row, and choose this file (download the raw file from the repo first). It loads straight into a solo race so you can watch it handle new tracks.
