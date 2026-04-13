import { NumberGuesser } from "./_components/NumberGuesser/NumberGuesser";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Number Guesser | Playground",
  description: "Classic number guessing game with hints. How few guesses does it take?",
  openGraph: {
    title: "Number Guesser",
    description: "Classic number guessing game with hints. How few guesses does it take?",
  },
};


export default function NumberGuesserPage() {
  return <NumberGuesser />;
}
