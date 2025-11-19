import { google } from "@ai-sdk/google";
import { generateObject } from "ai";
import { FoodAnalysisSchema } from "../../playgrounds/food-analyzer/types";

export const maxDuration = 60; // Extends timeout to 60 seconds

export async function POST(req: Request) {
  try {
    const { ingredients, imageBase64 } = await req.json();

    if (!ingredients && !imageBase64) {
      return Response.json(
        { error: "Either ingredients or image must be provided" },
        { status: 400 },
      );
    }

    const systemPrompt = `
      You are an expert Food Scientist specializing in the NOVA classification system.
      Analyze the provided ingredients list and classify the food into one of these groups:

      Group 1: Unprocessed/Minimally Processed (Fruit, Veg, Meat, Eggs, Milk, Plain Pasta/Rice).
      Group 2: Processed Culinary Ingredients (Butter, Oil, Sugar, Salt, Honey).
      Group 3: Processed Foods (Group 1 + Group 2). Canned beans, salted nuts, fresh bread, cheese, smoked fish.
      Group 4: Ultra-Processed Foods (UPF). Contains formulations of ingredients, industrial additives, emulsifiers, sweeteners, preservatives, or protein isolates.

      Common Group 4 Markers: High Fructose Corn Syrup, Invert Sugar, Modified Starch, E471/E472, Dextrose, Soy Lecithin, Flavorings, Nitrate, Sorbate, Propionate.

      Return the result strictly as JSON with the NOVA group classification, reasoning, key ingredients, health score (1-10), and optional recommendations.
    `;

    let result;

    if (imageBase64) {
      // For image analysis
      result = await generateObject({
        model: google("gemini-2.0-flash-exp"),
        schema: FoodAnalysisSchema,
        system: systemPrompt,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Analyze the ingredients shown in this image and classify the food product according to the NOVA classification system.`,
              },
              {
                type: "image",
                image: imageBase64,
              },
            ],
          },
        ],
      });
    } else {
      // For text-based ingredients
      result = await generateObject({
        model: google("gemini-2.0-flash-exp"),
        schema: FoodAnalysisSchema,
        system: systemPrompt,
        prompt: `Analyze these ingredients: "${ingredients}"`,
      });
    }

    return result.toJsonResponse();
  } catch (error) {
    console.error("Error analyzing food:", error);
    return Response.json(
      { error: "Failed to analyze food", details: String(error) },
      { status: 500 },
    );
  }
}
