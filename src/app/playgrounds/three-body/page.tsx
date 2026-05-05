import type { Metadata } from "next";
import { ThreeBody } from "./_components/ThreeBody";

export const metadata: Metadata = {
  title: "Three Body Problem | Playground",
  description:
    "Three gravitating stars. Tweak masses and starting velocities to summon stable dances or chaos.",
  openGraph: {
    title: "Three Body Problem",
    description:
      "Three gravitating stars. Tweak masses and starting velocities to summon stable dances or chaos.",
  },
};

export default function ThreeBodyPage() {
  return (
    <div className="h-full">
      <ThreeBody />
    </div>
  );
}
