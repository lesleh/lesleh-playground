/**
 * Train Tetris AI using the TypeScript game engine directly.
 * Run with: npx tsx src/app/playgrounds/tetris-ai/train.ts
 */

import { writeFileSync } from "fs";
import { TetrisGame } from "./_lib/tetris";
import { MLP } from "./_lib/mlp";

const NUM_EPISODES = 5000;
const REPLAY_BUFFER_SIZE = 100_000;
const BATCH_SIZE = 512;
const GAMMA = 0.95;
const LR = 0.001;
const EPSILON_DECAY = 0.998;
const EPSILON_MIN = 0.001;
const TARGET_UPDATE_FREQ = 100;

interface Transition {
  features: number[];
  reward: number;
  nextFeatures: number[][];
  done: boolean;
}

function main() {
  const model = new MLP([6, 128, 128, 1]);
  let targetModel = MLP.deserialize(model.serialize());

  const replayBuffer: Transition[] = [];
  let epsilon = 1.0;
  let bestLines = 0;
  let bestModelJson = model.serialize();

  for (let episode = 1; episode <= NUM_EPISODES; episode++) {
    const game = new TetrisGame();
    let totalReward = 0;
    let totalLines = 0;

    while (!game.gameOver) {
      const placements = game.getValidPlacements();
      if (placements.length === 0) break;

      let chosenIdx: number;
      if (Math.random() < epsilon) {
        chosenIdx = Math.floor(Math.random() * placements.length);
      } else {
        let bestScore = -Infinity;
        chosenIdx = 0;
        for (let i = 0; i < placements.length; i++) {
          const score = model.forward(placements[i].features);
          if (score > bestScore) {
            bestScore = score;
            chosenIdx = i;
          }
        }
      }

      const chosen = placements[chosenIdx];
      const linesBefore = game.linesCleared;
      game.executePlacement(chosen);
      const linesCleared = game.linesCleared - linesBefore;
      const reward = 1 + linesCleared * linesCleared * 10;
      totalReward += reward;
      totalLines += linesCleared;

      const nextPlacements = game.gameOver ? [] : game.getValidPlacements();

      // Add to replay buffer
      if (replayBuffer.length >= REPLAY_BUFFER_SIZE) {
        replayBuffer[Math.floor(Math.random() * replayBuffer.length)] = {
          features: chosen.features,
          reward,
          nextFeatures: nextPlacements.map((p) => p.features),
          done: game.gameOver,
        };
      } else {
        replayBuffer.push({
          features: chosen.features,
          reward,
          nextFeatures: nextPlacements.map((p) => p.features),
          done: game.gameOver,
        });
      }
    }

    // Train from replay buffer
    if (replayBuffer.length >= BATCH_SIZE) {
      let totalLoss = 0;
      for (let b = 0; b < BATCH_SIZE; b++) {
        const sample = replayBuffer[Math.floor(Math.random() * replayBuffer.length)];

        let target: number;
        if (sample.done || sample.nextFeatures.length === 0) {
          target = sample.reward;
        } else {
          let bestNext = -Infinity;
          for (const nf of sample.nextFeatures) {
            const score = targetModel.forward(nf);
            if (score > bestNext) bestNext = score;
          }
          target = sample.reward + GAMMA * bestNext;
        }

        totalLoss += model.trainStep(sample.features, target, LR);
      }
    }

    // Update target network
    if (episode % TARGET_UPDATE_FREQ === 0) {
      targetModel = MLP.deserialize(model.serialize());
    }

    epsilon = Math.max(EPSILON_MIN, epsilon * EPSILON_DECAY);

    if (totalLines > bestLines) {
      bestLines = totalLines;
      bestModelJson = model.serialize();
      writeFileSync("public/tetris-model.json", bestModelJson);
    }

    if (episode % 50 === 0) {
      console.log(
        `Episode ${String(episode).padStart(5)} | ` +
          `Pieces: ${String(game.piecesPlaced).padStart(5)} | ` +
          `Lines: ${String(totalLines).padStart(5)} | ` +
          `Reward: ${String(Math.round(totalReward)).padStart(7)} | ` +
          `Best: ${bestLines} | ` +
          `Epsilon: ${epsilon.toFixed(3)}`
      );
    }

    // Save latest periodically
    if (episode % 200 === 0) {
      writeFileSync("public/tetris-model.json", model.serialize());
    }
  }

  writeFileSync("public/tetris-model.json", bestModelJson);
  console.log(`\nTraining complete. Best: ${bestLines} lines.`);
  console.log("Model saved to public/tetris-model.json");
}

main();
