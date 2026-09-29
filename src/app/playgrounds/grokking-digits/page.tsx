import { GrokkingDigits } from "./_components/GrokkingDigits";
import type { Metadata } from "next";

const description =
  "A neural network memorises 1,000 handwritten digits, stalls, then slowly improves on ones it has never seen. Draw your own and watch how sure it is.";

export const metadata: Metadata = {
  title: "Learning Digits | Playground",
  description,
  openGraph: { title: "Learning Digits", description },
};

export default function GrokkingDigitsPage() {
  return <GrokkingDigits />;
}
