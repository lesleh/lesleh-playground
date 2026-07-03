import type { Metadata } from "next";
import { ChickenCrossing } from "./_components/ChickenCrossing";

const description =
  "Guide the chicken across the road, dodge the bikes and beat the clock. Each level gets faster.";

export const metadata: Metadata = {
  title: "Fowl Play | Playground",
  description,
  openGraph: {
    title: "Fowl Play",
    description,
  },
};

export default function ChickenCrossingPage() {
  return <ChickenCrossing />;
}
