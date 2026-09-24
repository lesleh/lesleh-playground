import { Grokking } from "./_components/Grokking";
import type { Metadata } from "next";

const description =
  "Watch a neural network memorise modular addition, sit at chance on unseen sums for thousands of steps, then suddenly generalise.";

export const metadata: Metadata = {
  title: "Grokking | Playground",
  description,
  openGraph: { title: "Grokking", description },
};

export default function GrokkingPage() {
  return <Grokking />;
}
