import type { Metadata } from "next";
import { Boids } from "./_components/Boids";

export const metadata: Metadata = {
  title: "Boids | Playground",
  description: "700 agents follow three simple rules and emergent murmurations appear.",
  openGraph: {
    title: "Boids",
    description: "700 agents follow three simple rules and emergent murmurations appear.",
  },
};

export default function BoidsPage() {
  return (
    <div className="min-h-full">
      <Boids />
    </div>
  );
}
