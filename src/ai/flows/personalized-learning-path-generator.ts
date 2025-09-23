"use server";
/**
 * @fileOverview AI-powered personalized learning path generator.
 *
 * - generatePersonalizedLearningPath - A function that generates personalized learning paths based on student understanding and defined standards.
 * - PersonalizedLearningPathInput - The input type for the generatePersonalizedLearningPath function.
 * - PersonalizedLearningPathOutput - The return type for the generatePersonalizedLearningPath function.
 */

import { ai } from "@/ai/genkit";
import { z } from "genkit";

const PersonalizedLearningPathInputSchema = z.object({
  studentName: z.string().describe("The name of the student."),
  subject: z
    .string()
    .describe("The subject for which to generate the learning path."),
  gradeLevel: z.string().describe("The grade level of the student."),
  learningStandard: z
    .string()
    .describe("The specific learning standard to achieve."),
  currentUnderstanding: z
    .string()
    .describe(
      "Description of the student's current understanding of the subject.",
    ),
});
export type PersonalizedLearningPathInput = z.infer<
  typeof PersonalizedLearningPathInputSchema
>;

const PersonalizedLearningPathOutputSchema = z.object({
  learningPath: z
    .string()
    .describe("A detailed, personalized learning path for the student."),
});
export type PersonalizedLearningPathOutput = z.infer<
  typeof PersonalizedLearningPathOutputSchema
>;

export async function generatePersonalizedLearningPath(
  input: PersonalizedLearningPathInput,
): Promise<PersonalizedLearningPathOutput> {
  return personalizedLearningPathFlow(input);
}

const prompt = ai.definePrompt({
  name: "personalizedLearningPathPrompt",
  input: { schema: PersonalizedLearningPathInputSchema },
  output: { schema: PersonalizedLearningPathOutputSchema },
  prompt: `You are an AI learning path generator. Your goal is to create personalized learning paths for students based on their current understanding and defined learning standards.

  Student Name: {{{studentName}}}
  Subject: {{{subject}}}
  Grade Level: {{{gradeLevel}}}
  Learning Standard: {{{learningStandard}}}
  Current Understanding: {{{currentUnderstanding}}}

  Generate a detailed and personalized learning path for the student to achieve the defined learning standard. Include specific resources, activities, and assessments.
  `,
});

const personalizedLearningPathFlow = ai.defineFlow(
  {
    name: "personalizedLearningPathFlow",
    inputSchema: PersonalizedLearningPathInputSchema,
    outputSchema: PersonalizedLearningPathOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  },
);
