
'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { firestore } from '@/lib/firebase';
import { doc, updateDoc, setDoc, query, where, getDocs, collection, getDoc } from 'firebase/firestore';
import type { GradingFormValues } from './grading-dialog';
import { logAuditEvent } from '@/lib/audit-log.service';

export async function saveGradeAction(
  schoolId: string,
  studentId: string, 
  assignmentId: string,
  data: GradingFormValues,
  actor: { id: string, name: string }
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
    const oldGrade = submissionDoc.data().grade || 'N/A';

    await updateDoc(submissionDoc.ref, {
      ...data,
      status: 'Graded',
    });

    const studentSnap = await getDoc(doc(firestore, 'schools', schoolId, 'students', studentId));
    const assignmentSnap = await getDoc(doc(firestore, 'schools', schoolId, 'assignments', assignmentId));
    const studentData = studentSnap.data();
    const assignmentData = assignmentSnap.data();

    await logAuditEvent({
        schoolId,
        action: 'GRADE_UPDATED',
        actionType: 'Academics',
        user: { id: actor.id, name: actor.name, role: 'Teacher' },
        details: `Changed ${assignmentData?.subject || 'score'} for AdmNo: ${studentData?.admissionNumber || studentId}, ${studentData?.name || 'student'} from ${oldGrade} to ${data.grade} in "${assignmentData?.title || 'assignment'}".`,
    });

    revalidatePath(`/teacher/assignments/${assignmentId}?schoolId=${schoolId}`);
    return { success: true, message: 'Grade saved successfully!' };

  } catch (error) {
    console.error("Error saving grade:", error);
    return { success: false, message: 'Failed to save grade to the database.' };
  }
}
