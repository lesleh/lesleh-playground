"use client";

import { useState, useRef, ChangeEvent } from "react";
import type { FoodAnalysis } from "../../types";

const novaGroupColors = {
  "1": "bg-green-100 border-green-500 text-green-900",
  "2": "bg-yellow-100 border-yellow-500 text-yellow-900",
  "3": "bg-orange-100 border-orange-500 text-orange-900",
  "4": "bg-red-100 border-red-500 text-red-900",
};

const novaGroupDescriptions = {
  "1": "Unprocessed or Minimally Processed Foods",
  "2": "Processed Culinary Ingredients",
  "3": "Processed Foods",
  "4": "Ultra-Processed Foods",
};

export function FoodAnalyzer() {
  const [ingredients, setIngredients] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<FoodAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inputMode, setInputMode] = useState<"text" | "image">("text");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        setImage(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = async () => {
    setLoading(true);
    setError(null);
    setAnalysis(null);

    try {
      const body =
        inputMode === "text"
          ? { ingredients }
          : { imageBase64: image?.split(",")[1] }; // Remove data:image/... prefix

      const response = await fetch("/api/analyze-food", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to analyze food");
      }

      const data = await response.json();
      setAnalysis(data.object);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setIngredients("");
    setImage(null);
    setAnalysis(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const getHealthScoreColor = (score: number) => {
    if (score >= 8) return "text-green-600";
    if (score >= 6) return "text-yellow-600";
    if (score >= 4) return "text-orange-600";
    return "text-red-600";
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-4">Food Classification Analyzer</h2>
        <p className="text-gray-600 mb-6">
          Analyze food products using the NOVA classification system. Enter
          ingredients or upload a photo of the ingredients list.
        </p>

        {/* Input Mode Toggle */}
        <div className="flex gap-4 mb-4">
          <button
            onClick={() => {
              setInputMode("text");
              setImage(null);
            }}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              inputMode === "text"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            Text Input
          </button>
          <button
            onClick={() => {
              setInputMode("image");
              setIngredients("");
            }}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              inputMode === "image"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            Image Upload
          </button>
        </div>

        {/* Input Area */}
        {inputMode === "text" ? (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ingredients List
            </label>
            <textarea
              value={ingredients}
              onChange={(e) => setIngredients(e.target.value)}
              placeholder="Enter ingredients (e.g., 'Water, Sugar, High Fructose Corn Syrup, Modified Starch, Natural Flavors, E471, Soy Lecithin')"
              className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        ) : (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload Image
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {image && (
              <div className="mt-4">
                <img
                  src={image}
                  alt="Uploaded ingredients"
                  className="max-w-full h-auto rounded-lg border border-gray-300"
                />
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={handleAnalyze}
            disabled={
              loading ||
              (inputMode === "text" ? !ingredients.trim() : !image)
            }
            className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Analyzing..." : "Analyze Food"}
          </button>
          <button
            onClick={handleReset}
            className="bg-gray-200 text-gray-700 py-3 px-6 rounded-lg font-medium hover:bg-gray-300 transition-colors"
          >
            Reset
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}
      </div>

      {/* Results */}
      {analysis && (
        <div className="bg-white rounded-lg shadow-lg p-6 space-y-4">
          <h3 className="text-xl font-bold mb-4">Analysis Results</h3>

          {/* NOVA Group Badge */}
          <div
            className={`inline-block px-4 py-2 rounded-lg border-2 font-bold ${
              novaGroupColors[analysis.novaGroup]
            }`}
          >
            <div className="text-2xl">Group {analysis.novaGroup}</div>
            <div className="text-sm">
              {novaGroupDescriptions[analysis.novaGroup]}
            </div>
          </div>

          {/* Health Score */}
          <div className="mt-4">
            <div className="text-sm font-medium text-gray-700 mb-1">
              Health Score
            </div>
            <div className="flex items-center gap-2">
              <div
                className={`text-3xl font-bold ${getHealthScoreColor(
                  analysis.healthScore
                )}`}
              >
                {analysis.healthScore}/10
              </div>
              <div className="flex-1 bg-gray-200 rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all ${
                    analysis.healthScore >= 8
                      ? "bg-green-600"
                      : analysis.healthScore >= 6
                      ? "bg-yellow-600"
                      : analysis.healthScore >= 4
                      ? "bg-orange-600"
                      : "bg-red-600"
                  }`}
                  style={{ width: `${analysis.healthScore * 10}%` }}
                />
              </div>
            </div>
          </div>

          {/* Reasoning */}
          <div className="mt-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">
              Reasoning
            </h4>
            <p className="text-gray-800 leading-relaxed">{analysis.reasoning}</p>
          </div>

          {/* Key Ingredients */}
          <div className="mt-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">
              Key Ingredients
            </h4>
            <div className="flex flex-wrap gap-2">
              {analysis.keyIngredients.map((ingredient, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm"
                >
                  {ingredient}
                </span>
              ))}
            </div>
          </div>

          {/* Recommendations */}
          {analysis.recommendations && analysis.recommendations.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">
                Recommendations
              </h4>
              <ul className="list-disc list-inside space-y-1 text-gray-800">
                {analysis.recommendations.map((rec, index) => (
                  <li key={index}>{rec}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
