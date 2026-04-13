import { RockPaperScissors } from "./_components/RockPaperScissors";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Rock Paper Scissors | Playground",
  description: "Play the timeless game against the computer. Best of three!",
  openGraph: {
    title: "Rock Paper Scissors",
    description: "Play the timeless game against the computer. Best of three!",
  },
};


export default function RockPaperScissorsPage() {
  return <RockPaperScissors />;
}
