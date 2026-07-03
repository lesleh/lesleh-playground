import { Memory } from "./_components/Memory";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Recall | Playground",
  description:
    "A memory matching game. Flip cards, find the pairs, beat your best. Easy, medium and hard boards.",
  openGraph: {
    title: "Recall",
    description:
      "A memory matching game. Flip cards, find the pairs, beat your best. Easy, medium and hard boards.",
  },
};

export default function MemoryPage() {
  return <Memory />;
}
