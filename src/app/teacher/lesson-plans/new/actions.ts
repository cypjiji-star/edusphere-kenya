
'use server';

import {
  generateLessonPlanContent,
  GenerateLessonPlanContentInput,
  GenerateLessonPlanContentOutput,
} from '@/ai/flows/lesson-plan-generator';
import { z } from 'zod';

export const lessonPlanSchema = z.object({
  topic: z.string().min(3, 'Topic is required.'),
  subject: z.string().min(3, 'Subject is required.'),
  grade: z.string().min(1, 'Grade level is required.'),
  objectives: z.string().min(20, 'Objectives must be at least 20 characters.'),
  materials: z.string().optional(),
  activities: z.string().min(20, 'Activities must be at least 20 characters.'),
  assessment: z.string().min(10, 'Assessment must be at least 10 characters.'),
});

export type LessonPlanFormValues = z.infer<typeof lessonPlanSchema>;


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
