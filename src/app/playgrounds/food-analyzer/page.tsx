import type { NextPage } from "next";
import { FoodAnalyzer } from "./_components/FoodAnalyzer";

export const metadata = {
  title: "Food Analyzer - NOVA Classification",
  description: "Analyze food products using the NOVA classification system",
};

const FoodAnalyzerPage: NextPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <FoodAnalyzer />
    </div>
  );
};

export default FoodAnalyzerPage;
