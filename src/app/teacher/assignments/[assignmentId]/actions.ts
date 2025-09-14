
'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { firestore } from '@/lib/firebase';
import { doc, updateDoc, setDoc } from 'firebase/firestore';

export const gradingSchema = z.object({
  grade: z.string().min(1, 'Grade is required.'),
  feedback: z.string().optional(),
});


export type GradingFormValues = z.infer<typeof gradingSchema>;


export async function saveGradeAction(
  submissionId: string, 
  assignmentId: string,
  data: GradingFormValues
) {
  try {
    const submissionRef = doc(firestore, 'assignments', assignmentId, 'submissions', submissionId);
    await updateDoc(submissionRef, {
      ...data,
      status: 'Graded',
    });

    revalidatePath(`/teacher/assignments/${assignmentId}`);
    return { success: true, message: 'Grade saved successfully!' };

  } catch (error) {
    console.error("Error saving grade:", error);
    return { success: false, message: 'Failed to save grade to the database.' };
  }
}
