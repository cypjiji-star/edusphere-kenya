
'use server';
/**
 * @fileOverview An AI-powered support chatbot flow.
 *
 * - supportChatbot - A function that takes a chat history and returns a helpful response.
 * - SupportChatbotInput - The input type for the function.
 * - SupportChatbotOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const MessageSchema = z.object({
  role: z.enum(['user', 'model']),
  content: z.string(),
});

const SupportChatbotInputSchema = z.object({
  history: z.array(MessageSchema).describe('The history of the conversation so far.'),
});
export type SupportChatbotInput = z.infer<typeof SupportChatbotInputSchema>;

const SupportChatbotOutputSchema = z.object({
  response: z.string().describe('The AI chatbot\'s helpful and context-aware response.'),
});
export type SupportChatbotOutput = z.infer<typeof SupportChatbotOutputSchema>;

export async function supportChatbot(
  input: SupportChatbotInput
): Promise<SupportChatbotOutput> {
  return supportChatbotFlow(input);
}

const prompt = ai.definePrompt({
  name: 'supportChatbotPrompt',
  input: { schema: SupportChatbotInputSchema },
  output: { schema: SupportChatbotOutputSchema },
  prompt: `You are a friendly and helpful AI assistant for a school management system called EduSphere Kenya. Your role is to be the first line of support for parents and teachers.

  Conversation History:
  {{#each history}}
  - {{role}}: {{content}}
  {{/each}}

  Based on the conversation history, provide a helpful and concise response to the user's latest message.

  If the user indicates they want to speak to a human, an administrator, or that you are not being helpful, your response should be: "Understood. I'm escalating your request to a human administrator who will get back to you shortly." and nothing else.
  `,
});

const supportChatbotFlow = ai.defineFlow(
  {
    name: 'supportChatbotFlow',
    inputSchema: SupportChatbotInputSchema,
    outputSchema: SupportChatbotOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
