'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';

export const gradingSchema = z.object({
  grade: z.string().min(1, 'Grade is required.'),
  feedback: z.string().optional(),
});

export type GradingFormValues = z.infer<typeof gradingSchema>;

// In a real app, this would save to a database.
export async function saveGradeAction(
  submissionId: string, 
  assignmentId: string,
  data: GradingFormValues
) {
  console.log('Saving grade for submission', submissionId, 'with data:', data);
  
  // Revalidate the path to show the updated grade in the table.
  // In this mock, the data isn't actually persisted, so revalidation won't show changes.
  // In a real app, this would trigger a re-fetch of the data.
  revalidatePath(`/teacher/assignments/${assignmentId}`);

  return { success: true, message: 'Grade saved successfully!' };
}
