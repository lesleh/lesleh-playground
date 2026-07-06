import { EvolvingWalkers } from "./_components/EvolvingWalkers";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Evolving Walkers | Playground",
  description:
    "A population of jointed creatures evolve neural-net brains via a genetic algorithm, learning to walk across the ground live. No training data, just survival of the fittest.",
  openGraph: {
    title: "Evolving Walkers",
    description:
      "A population of jointed creatures evolve neural-net brains via a genetic algorithm, learning to walk across the ground live. No training data, just survival of the fittest.",
  },
};

export default function EvolvingWalkersPage() {
  return <EvolvingWalkers />;
}
