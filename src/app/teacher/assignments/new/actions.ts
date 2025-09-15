
'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { firestore } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, query, where, getDocs, writeBatch, doc } from 'firebase/firestore';

// Moved schema to assignment-form.tsx to avoid exporting non-functions from a 'use server' file.
import type { AssignmentFormValues } from './assignment-form';

export async function createAssignmentAction(
  schoolId: string,
  teacherId: string,
  data: AssignmentFormValues,
  className: string
) {
  if (!schoolId) {
    return { success: false, message: 'School ID is missing.' };
  }

  // The Zod schema is now in the form component, but we can re-validate here on the server
  // for an extra layer of security if needed, or trust the client-side validation.
  // For simplicity, we'll trust the client validation which is already happening.

  try {
    // 1. Get all students for the selected class
    const studentsQuery = query(collection(firestore, 'schools', schoolId, 'students'), where('classId', '==', data.classId));
    const studentsSnapshot = await getDocs(studentsQuery);
    const totalStudents = studentsSnapshot.size;

    // 2. Create a new assignment record
    const assignmentRef = await addDoc(collection(firestore, 'schools', schoolId, 'assignments'), {
      ...data,
      className,
      teacherId: teacherId, 
      createdAt: serverTimestamp(),
      submissions: 0,
      totalStudents,
    });

    // 3. Create a subcollection for submissions for this assignment
    const batch = writeBatch(firestore);
    studentsSnapshot.forEach((studentDoc) => {
        const submissionRef = doc(collection(firestore, 'schools', schoolId, 'assignments', assignmentRef.id, 'submissions'));
        batch.set(submissionRef, {
            studentRef: doc(firestore, 'schools', schoolId, 'students', studentDoc.id),
            status: 'Not Handed In',
            grade: null,
            feedback: null,
            submittedDate: null,
        });
    });

    await batch.commit();

    revalidatePath(`/teacher/assignments?schoolId=${schoolId}`);

    return { success: true, message: 'Assignment created successfully!' };
  } catch (error) {
    console.error("Error creating assignment:", error);
    return { success: false, message: 'Failed to create assignment in the database.' };
  }
}
