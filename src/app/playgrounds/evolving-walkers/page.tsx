import { EvolvingWalkers } from "./_components/EvolvingWalkers";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Evolving Walkers | Playground",
  description:
    "A population of rigid-body robots evolve neural-net controllers live in the browser, learning to track a reference stride until they walk - and then run.",
  openGraph: {
    title: "Evolving Walkers",
    description:
      "A population of rigid-body robots evolve neural-net controllers live in the browser, learning to track a reference stride until they walk - and then run.",
  },
};

export default function EvolvingWalkersPage() {
  return <EvolvingWalkers />;
}
