import { z } from "zod";

export const FoodAnalysisSchema = z.object({
  novaGroup: z.enum(["1", "2", "3", "4"]).describe("NOVA classification group"),
  groupName: z
    .string()
    .describe(
      "Full name of the group (e.g., 'Unprocessed or Minimally Processed Foods')"
    ),
  reasoning: z
    .string()
    .describe("Brief explanation of why this classification was chosen"),
  keyIngredients: z
    .array(z.string())
    .describe("List of key ingredients that influenced the classification"),
  healthScore: z
    .number()
    .min(1)
    .max(10)
    .describe("Overall health score from 1-10, with 10 being healthiest"),
  recommendations: z
    .array(z.string())
    .optional()
    .describe("Optional suggestions for healthier alternatives"),
});

export type FoodAnalysis = z.infer<typeof FoodAnalysisSchema>;

export type AnalysisInput = {
  ingredients?: string;
  imageBase64?: string;
};
