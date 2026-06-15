import type { Metadata } from "next";
import { Lottery } from "./_components/Lottery";

export const metadata: Metadata = {
  title: "Lottery Simulator | Playground",
  description:
    "Play the UK Lotto at £2 a ticket. Pick 6 from 59, run a million draws, and watch the house always win.",
  openGraph: {
    title: "Lottery Simulator",
    description:
      "Play the UK Lotto at £2 a ticket. Pick 6 from 59, run a million draws, and watch the house always win.",
  },
};

export default function LotteryPage() {
  return <Lottery />;
}
