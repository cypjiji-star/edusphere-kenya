
'use server';

import {
  generateLessonPlanContent,
  GenerateLessonPlanContentInput,
  GenerateLessonPlanContentOutput,
} from '@/ai/flows/lesson-plan-generator';
import { z } from 'zod';

export async function generateContentAction(
  input: GenerateLessonPlanContentInput
): Promise<{ success: boolean; data: GenerateLessonPlanContentOutput | null; error?: string }> {
  try {
    const result = await generateLessonPlanContent(input);
    if (!result || !result.generatedContent) {
      return { success: false, data: null, error: 'AI failed to generate content.' };
    }
    return { success: true, data: result };
  } catch (error) {
    console.error('Error generating lesson plan content:', error);
    return { success: false, data: null, error: 'An unexpected error occurred.' };
  }
}
