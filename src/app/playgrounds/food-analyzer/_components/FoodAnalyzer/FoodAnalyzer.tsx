"use client";

import { useState, useRef, ChangeEvent } from "react";
import type { FoodAnalysis } from "../../types";
import { useAnalysisHistory } from "../../_hooks/useAnalysisHistory";

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

const exampleIngredients = [
  {
    label: "Whole Grain Bread",
    ingredients:
      "Whole Wheat Flour, Water, Wheat Gluten, Oat Fiber, Yeast, Salt",
  },
  {
    label: "Soda",
    ingredients:
      "Carbonated Water, High Fructose Corn Syrup, Caramel Color, Phosphoric Acid, Natural Flavors, Caffeine",
  },
  {
    label: "Fresh Apple",
    ingredients: "Apple",
  },
  {
    label: "Instant Noodles",
    ingredients:
      "Wheat Flour, Palm Oil, Salt, Modified Tapioca Starch, Monosodium Glutamate, Disodium Inosinate, Disodium Guanylate, Tertiary Butylhydroquinone",
  },
];

export function FoodAnalyzer() {
  const [ingredients, setIngredients] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<FoodAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inputMode, setInputMode] = useState<"text" | "image">("text");
  const [showNovaInfo, setShowNovaInfo] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { history, addToHistory, removeFromHistory, clearHistory } =
    useAnalysisHistory();

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

      // Handle streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let partialData: Partial<FoodAnalysis> = {};

      if (!reader) {
        throw new Error("Response body is not readable");
      }

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("0:")) {
            try {
              const jsonStr = line.slice(2); // Remove "0:" prefix
              const parsed = JSON.parse(jsonStr);
              partialData = { ...partialData, ...parsed };
              // Update UI with partial data
              setAnalysis(partialData as FoodAnalysis);
            } catch (e) {
              // Skip invalid JSON chunks
            }
          }
        }
      }

      // Add to history with final data
      if (partialData) {
        const inputText = inputMode === "text" ? ingredients : "Image upload";
        addToHistory(inputText, partialData as FoodAnalysis);
      }
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

  const handleCopy = async () => {
    if (!analysis) return;

    const text = `Food Analysis - NOVA Group ${analysis.novaGroup}
${novaGroupDescriptions[analysis.novaGroup]}

Health Score: ${analysis.healthScore}/10

Reasoning: ${analysis.reasoning}

Key Ingredients: ${analysis.keyIngredients.join(", ")}
${
  analysis.recommendations && analysis.recommendations.length > 0
    ? `\nRecommendations:\n${analysis.recommendations
        .map((r) => `- ${r}`)
        .join("\n")}`
    : ""
}`;

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleShare = async () => {
    if (!analysis) return;

    const text = `NOVA Group ${analysis.novaGroup}: ${
      novaGroupDescriptions[analysis.novaGroup]
    } - Health Score: ${analysis.healthScore}/10`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: "Food Analysis Results",
          text: text,
        });
      } catch (err) {
        console.error("Failed to share:", err);
      }
    } else {
      // Fallback to copy
      await handleCopy();
    }
  };

  const handleExportJSON = () => {
    if (!analysis) return;

    const data = {
      timestamp: new Date().toISOString(),
      input: inputMode === "text" ? ingredients : "Image upload",
      analysis,
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `food-analysis-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportText = () => {
    if (!analysis) return;

    const text = `FOOD ANALYSIS REPORT
Generated: ${new Date().toLocaleString()}

NOVA Classification: Group ${analysis.novaGroup}
Category: ${novaGroupDescriptions[analysis.novaGroup]}

Health Score: ${analysis.healthScore}/10

REASONING:
${analysis.reasoning}

KEY INGREDIENTS:
${analysis.keyIngredients.map((ing) => `• ${ing}`).join("\n")}
${
  analysis.recommendations && analysis.recommendations.length > 0
    ? `\nRECOMMENDATIONS:\n${analysis.recommendations
        .map((r) => `• ${r}`)
        .join("\n")}`
    : ""
}`;

    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `food-analysis-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
      <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0 mb-4">
          <h2 className="text-xl sm:text-2xl font-bold">
            Food Classification Analyzer
          </h2>
          <button
            onClick={() => setShowNovaInfo(!showNovaInfo)}
            className="text-blue-600 hover:text-blue-700 flex items-center gap-1 text-sm sm:text-base"
            title="Learn about NOVA groups"
          >
            <svg
              className="w-4 h-4 sm:w-5 sm:h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            NOVA Groups
          </button>
        </div>

        {showNovaInfo && (
          <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="font-semibold text-blue-900 mb-3">
              NOVA Classification System
            </h3>
            <div className="space-y-2 text-sm text-blue-900">
              <div className="flex gap-2">
                <span className="font-semibold">Group 1:</span>
                <span>
                  Unprocessed or minimally processed foods (fruits, vegetables,
                  meat, eggs, milk, plain grains)
                </span>
              </div>
              <div className="flex gap-2">
                <span className="font-semibold">Group 2:</span>
                <span>
                  Processed culinary ingredients (butter, oil, sugar, salt,
                  honey)
                </span>
              </div>
              <div className="flex gap-2">
                <span className="font-semibold">Group 3:</span>
                <span>
                  Processed foods - Group 1 + Group 2 (canned beans, salted
                  nuts, fresh bread, cheese)
                </span>
              </div>
              <div className="flex gap-2">
                <span className="font-semibold">Group 4:</span>
                <span>
                  Ultra-processed foods with industrial additives, emulsifiers,
                  sweeteners, or preservatives
                </span>
              </div>
            </div>
          </div>
        )}

        <p className="text-gray-600 mb-6">
          Analyze food products using the NOVA classification system. Enter
          ingredients or upload a photo of the ingredients list.
        </p>

        {/* Input Mode Toggle */}
        <div className="flex gap-2 sm:gap-4 mb-4">
          <button
            onClick={() => {
              setInputMode("text");
              setImage(null);
            }}
            className={`flex-1 px-3 sm:px-4 py-2 rounded-lg font-medium text-sm sm:text-base transition-colors ${
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
            className={`flex-1 px-3 sm:px-4 py-2 rounded-lg font-medium text-sm sm:text-base transition-colors ${
              inputMode === "image"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            Image Upload
          </button>
        </div>

        {/* Example Inputs */}
        {inputMode === "text" && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Try an example:
            </label>
            <div className="flex flex-wrap gap-2">
              {exampleIngredients.map((example) => (
                <button
                  key={example.label}
                  onClick={() => setIngredients(example.ingredients)}
                  className="px-3 py-1 text-sm bg-blue-50 text-blue-700 rounded-full hover:bg-blue-100 transition-colors"
                >
                  {example.label}
                </button>
              ))}
            </div>
          </div>
        )}

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
              <div className="mt-4 relative">
                <button
                  onClick={() => {
                    setImage(null);
                    if (fileInputRef.current) {
                      fileInputRef.current.value = "";
                    }
                  }}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition-colors shadow-lg z-10"
                  title="Remove image"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
                <img
                  src={image}
                  alt="Uploaded ingredients"
                  className="max-w-full max-h-96 h-auto rounded-lg border border-gray-300 object-contain"
                />
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <button
            onClick={handleAnalyze}
            disabled={
              loading || (inputMode === "text" ? !ingredients.trim() : !image)
            }
            className="flex-1 bg-blue-600 text-white py-3 px-4 sm:px-6 rounded-lg font-medium text-sm sm:text-base hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {loading && (
              <svg
                className="animate-spin h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            )}
            {loading ? "Analyzing..." : "Analyze Food"}
          </button>
          <button
            onClick={handleReset}
            className="sm:flex-initial bg-gray-200 text-gray-700 py-3 px-4 sm:px-6 rounded-lg font-medium text-sm sm:text-base hover:bg-gray-300 transition-colors"
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

      {/* History */}
      {history.length > 0 && (
        <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="flex items-center gap-2 text-gray-700 hover:text-gray-900"
            >
              <svg
                className={`w-5 h-5 transition-transform ${
                  showHistory ? "rotate-90" : ""
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
              <h3 className="text-lg font-bold">
                Recent Analyses ({history.length})
              </h3>
            </button>
            {showHistory && (
              <button
                onClick={clearHistory}
                className="text-sm text-red-600 hover:text-red-700"
              >
                Clear All
              </button>
            )}
          </div>

          {showHistory && (
            <div className="space-y-2">
              {history.map((item) => (
                <div
                  key={item.id}
                  className="flex items-start justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                  onClick={() => {
                    setAnalysis(item.analysis);
                    setIngredients(item.input);
                    setInputMode("text");
                  }}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`px-2 py-0.5 text-xs font-bold rounded ${
                          novaGroupColors[item.analysis.novaGroup]
                        }`}
                      >
                        Group {item.analysis.novaGroup}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(item.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 truncate">
                      {item.input}
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFromHistory(item.id);
                    }}
                    className="ml-2 text-gray-400 hover:text-red-600"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Results */}
      {analysis && (
        <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg sm:text-xl font-bold">Analysis Results</h3>
            <div className="flex gap-2">
              <button
                onClick={handleCopy}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                title="Copy results"
              >
                {copied ? (
                  <svg
                    className="w-5 h-5 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                )}
              </button>
              <button
                onClick={handleShare}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                title="Share results"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                  />
                </svg>
              </button>
              <button
                onClick={handleExportJSON}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                title="Export as JSON"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </button>
              <button
                onClick={handleExportText}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                title="Export as Text"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* NOVA Group Badge */}
          <div
            className={`inline-block px-3 sm:px-4 py-2 rounded-lg border-2 font-bold ${
              novaGroupColors[analysis.novaGroup]
            }`}
          >
            <div className="text-xl sm:text-2xl">
              Group {analysis.novaGroup}
            </div>
            <div className="text-xs sm:text-sm">
              {novaGroupDescriptions[analysis.novaGroup]}
            </div>
          </div>

          {/* Health Score */}
          <div className="mt-4">
            <div className="text-sm font-medium text-gray-700 mb-1">
              Health Score
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
              <div
                className={`text-2xl sm:text-3xl font-bold ${getHealthScoreColor(
                  analysis.healthScore,
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
            <p className="text-gray-800 leading-relaxed">
              {analysis.reasoning}
            </p>
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
