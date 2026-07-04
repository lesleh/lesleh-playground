import { WhackAMole } from "./_components/WhackAMole";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Whack-a-Mole | Playground",
  description:
    "Bonk the moles before they duck away. They get faster and faster, then it scores you. Beat your high score.",
  openGraph: {
    title: "Whack-a-Mole",
    description:
      "Bonk the moles before they duck away. They get faster and faster, then it scores you. Beat your high score.",
  },
};

export default function WhackAMolePage() {
  return <WhackAMole />;
}
