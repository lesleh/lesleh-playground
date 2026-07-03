import type { Metadata } from "next";
import { Simon } from "./_components/Simon";

const description =
  "A Simon memory game. Watch the pattern of colours and tones, then tap it back. It grows every round.";

export const metadata: Metadata = {
  title: "Echo | Playground",
  description,
  openGraph: {
    title: "Echo",
    description,
  },
};

export default function SimonPage() {
  return <Simon />;
}
