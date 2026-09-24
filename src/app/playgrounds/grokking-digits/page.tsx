import { GrokkingDigits } from "./_components/GrokkingDigits";
import type { Metadata } from "next";

const description =
  "A neural network memorises 1,000 handwritten digits, stalls on unseen ones, then weight decay tips it into reading digits it has never seen.";

export const metadata: Metadata = {
  title: "Grokking Digits | Playground",
  description,
  openGraph: { title: "Grokking Digits", description },
};

export default function GrokkingDigitsPage() {
  return <GrokkingDigits />;
}
