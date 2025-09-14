
'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { firestore } from '@/lib/firebase';
import { doc, updateDoc, setDoc, query, where, getDocs, collection } from 'firebase/firestore';

export const gradingSchema = z.object({
  grade: z.string().min(1, 'Grade is required.'),
  feedback: z.string().optional(),
});


export type GradingFormValues = z.infer<typeof gradingSchema>;


export async function saveGradeAction(
  studentId: string, 
  assignmentId: string,
  data: GradingFormValues
) {
  try {
    const q = query(
      collection(firestore, 'assignments', assignmentId, 'submissions'),
      where('studentRef', '==', doc(firestore, 'students', studentId))
    );
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      throw new Error('Submission not found for this student.');
    }
    
    const submissionDoc = querySnapshot.docs[0];

    await updateDoc(submissionDoc.ref, {
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
