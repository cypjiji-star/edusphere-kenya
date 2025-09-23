"use server";
/**
 * @fileOverview AI-powered lesson plan content generator.
 *
 * - generateLessonPlanContent - Generates content for a specific section of a lesson plan.
 * - GenerateLessonPlanContentInput - The input type for the function.
 * - GenerateLessonPlanContentOutput - The return type for the function.
 */

import { ai } from "@/ai/genkit";
import { z } from "genkit";

const GenerateLessonPlanContentInputSchema = z.object({
  topic: z.string().describe("The main topic of the lesson."),
  subject: z.string().describe("The subject of the lesson."),
  grade: z.string().describe("The grade level of the students."),
  fieldToGenerate: z
    .enum(["objectives", "activities", "assessment"])
    .describe(
      "The specific section of the lesson plan to generate content for.",
    ),
  existingContent: z
    .object({
      objectives: z
        .string()
        .optional()
        .describe("Any existing content for learning objectives."),
      activities: z
        .string()
        .optional()
        .describe("Any existing content for lesson activities."),
      assessment: z
        .string()
        .optional()
        .describe("Any existing content for assessment methods."),
    })
    .describe("The content that has already been written for other fields."),
});
export type GenerateLessonPlanContentInput = z.infer<
  typeof GenerateLessonPlanContentInputSchema
>;

const GenerateLessonPlanContentOutputSchema = z.object({
  generatedContent: z
    .string()
    .describe("The AI-generated content for the requested field."),
});
export type GenerateLessonPlanContentOutput = z.infer<
  typeof GenerateLessonPlanContentOutputSchema
>;

export async function generateLessonPlanContent(
  input: GenerateLessonPlanContentInput,
): Promise<GenerateLessonPlanContentOutput> {
  return lessonPlanContentFlow(input);
}

const prompt = ai.definePrompt({
  name: "lessonPlanContentPrompt",
  input: { schema: GenerateLessonPlanContentInputSchema },
  output: { schema: GenerateLessonPlanContentOutputSchema },
  prompt: `You are an expert curriculum designer for the Kenyan education system. Your task is to generate content for a specific section of a lesson plan.

  Lesson Details:
  - Topic: {{{topic}}}
  - Subject: {{{subject}}}
  - Grade: {{{grade}}}

  You are generating content for the following section: **{{{fieldToGenerate}}}**

  Here is the content that has already been written for other sections. Use it for context to ensure the generated content is consistent and relevant.
  - Learning Objectives: "{{{existingContent.objectives}}}"
  - Lesson Activities: "{{{existingContent.activities}}}"
  - Assessment Methods: "{{{existingContent.assessment}}}"

  Based on the lesson details and existing content, generate a detailed and practical list for the "{{{fieldToGenerate}}}" section. The content should be appropriate for the specified grade level and subject within the Kenyan context. Do not include the section title in your output.
  `,
});

const lessonPlanContentFlow = ai.defineFlow(
  {
    name: "lessonPlanContentFlow",
    inputSchema: GenerateLessonPlanContentInputSchema,
    outputSchema: GenerateLessonPlanContentOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  },
);
