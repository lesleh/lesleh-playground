import { UnitPriceCalculator } from "./_components/UnitPriceCalculator";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Unit Price | Playground",
  description: "Compare products by unit price. Never overpay at the grocery store again.",
  openGraph: {
    title: "Unit Price",
    description: "Compare products by unit price. Never overpay at the grocery store again.",
  },
};


function UnitPricePage() {
  return (
    <div className="container mx-auto max-w-xl">
      <h1 className="text-4xl">Unit Price Calculator</h1>
      <UnitPriceCalculator />
    </div>
  );
}

export default UnitPricePage;
