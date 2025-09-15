'use server';
/**
 * @fileOverview An AI flow to generate an emoji icon from a description.
 *
 * - generateTeamIcon - A function that takes a description and returns a relevant emoji.
 * - GenerateTeamIconInput - The input type for the function.
 * - GenerateTeamIconOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateTeamIconInputSchema = z.object({
  description: z.string().describe('A description of a sports team or school club.'),
});
export type GenerateTeamIconInput = z.infer<typeof GenerateTeamIconInputSchema>;

const GenerateTeamIconOutputSchema = z.object({
  icon: z.string().describe('A single emoji that best represents the team description.'),
});
export type GenerateTeamIconOutput = z.infer<typeof GenerateTeamIconOutputSchema>;

export async function generateTeamIcon(
  input: GenerateTeamIconInput
): Promise<GenerateTeamIconOutput> {
  return generateTeamIconFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateTeamIconPrompt',
  input: {schema: GenerateTeamIconInputSchema},
  output: {schema: GenerateTeamIconOutputSchema},
  prompt: `Based on the following description of a school team or club, generate a single, appropriate emoji to serve as its icon.

Description: {{{description}}}

Return only the single emoji.`,
});

const generateTeamIconFlow = ai.defineFlow(
  {
    name: 'generateTeamIconFlow',
    inputSchema: GenerateTeamIconInputSchema,
    outputSchema: GenerateTeamIconOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
