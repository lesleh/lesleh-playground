import { RockPaperScissors } from "./_components/RockPaperScissors";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Rock Paper Scissors | Playground",
  description:
    "Play against an adaptive AI that learns your patterns in real-time. Can you stay unpredictable?",
  openGraph: {
    title: "Rock Paper Scissors",
    description:
      "Play against an adaptive AI that learns your patterns in real-time. Can you stay unpredictable?",
  },
};


export default function RockPaperScissorsPage() {
  return <RockPaperScissors />;
}
