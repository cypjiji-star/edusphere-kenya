
'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { firestore } from '@/lib/firebase';
import { doc, updateDoc, setDoc, query, where, getDocs, collection } from 'firebase/firestore';
import type { GradingFormValues } from './grading-dialog';

export async function saveGradeAction(
  schoolId: string,
  studentId: string, 
  assignmentId: string,
  data: GradingFormValues
) {
  if (!schoolId) {
    return { success: false, message: 'School ID is missing.' };
  }

  try {
    const q = query(
      collection(firestore, 'schools', schoolId, 'assignments', assignmentId, 'submissions'),
      where('studentRef', '==', doc(firestore, 'schools', schoolId, 'students', studentId))
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

    revalidatePath(`/teacher/assignments/${assignmentId}?schoolId=${schoolId}`);
    return { success: true, message: 'Grade saved successfully!' };

  } catch (error) {
    console.error("Error saving grade:", error);
    return { success: false, message: 'Failed to save grade to the database.' };
  }
}
