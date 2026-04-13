import { TetrisAI } from "./_components/TetrisAI";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tetris AI | Playground",
  description: "Watch a neural network play Tetris. Trained with deep reinforcement learning.",
  openGraph: {
    title: "Tetris AI",
    description: "Watch a neural network play Tetris. Trained with deep reinforcement learning.",
  },
};


export default function TetrisAIPage() {
  return (
    <div className="min-h-full bg-gray-900 text-gray-200">
      <TetrisAI />
    </div>
  );
}
