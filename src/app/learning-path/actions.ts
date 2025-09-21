
'use server';

import {
  generatePersonalizedLearningPath,
  PersonalizedLearningPathInput,
  PersonalizedLearningPathOutput,
} from '@/ai/flows/personalized-learning-path-generator';
import { z } from 'zod';

export const learningPathSchema = z.object({
  studentName: z.string().min(2, 'Student name is required.'),
  subject: z.string().min(3, 'Subject is required.'),
  gradeLevel: z.string().min(1, 'Grade level is required.'),
  learningStandard: z.string().min(10, 'Learning standard must be at least 10 characters.'),
  currentUnderstanding: z.string().min(20, 'Please provide more detail on current understanding (at least 20 characters).'),
});


export async function generatePathAction(
  input: PersonalizedLearningPathInput
): Promise<{ success: boolean; data: PersonalizedLearningPathOutput | null; error?: string }> {
  try {
    const validatedInput = learningPathSchema.parse(input);
    const result = await generatePersonalizedLearningPath(validatedInput);
    if (!result || !result.learningPath) {
      return { success: false, data: null, error: 'Failed to generate learning path. The AI returned an empty response.' };
    }
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
       return { success: false, data: null, error: error.errors.map(e => e.message).join(', ') };
    }
    console.error('Error generating learning path:', error);
    return { success: false, data: null, error: 'An unexpected error occurred. Please try again.' };
  }
}
