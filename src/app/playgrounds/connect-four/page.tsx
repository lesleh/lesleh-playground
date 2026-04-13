import type { Metadata } from "next";
import { ConnectFour } from "./_components/ConnectFour";

export const metadata: Metadata = {
  title: "Connect 4 | Playground",
  description: "Play Connect 4 against an AlphaZero-style AI trained via self-play.",
  openGraph: {
    title: "Connect 4",
    description: "Play Connect 4 against an AlphaZero-style AI trained via self-play.",
  },
};

export default function ConnectFourPage() {
  return (
    <div className="min-h-full bg-slate-900">
      <ConnectFour />
    </div>
  );
}
