import { Neuroevolution } from "./_components/Neuroevolution";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Neuroevolution | Playground",
  description:
    "A population of cars grow neural-net brains via a genetic algorithm, learning to drive a track live. No training data, just survival of the fittest.",
  openGraph: {
    title: "Neuroevolution",
    description:
      "A population of cars grow neural-net brains via a genetic algorithm, learning to drive a track live. No training data, just survival of the fittest.",
  },
};

export default function NeuroevolutionPage() {
  return <Neuroevolution />;
}
