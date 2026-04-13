import { LightsOut } from "./_components/LightsOut/LightsOut";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Lights Out | Playground",
  description: "Toggle lights to clear the grid. Or let the auto-solver handle it.",
  openGraph: {
    title: "Lights Out",
    description: "Toggle lights to clear the grid. Or let the auto-solver handle it.",
  },
};


export default function LightsOutPage() {
  return <LightsOut />;
}
