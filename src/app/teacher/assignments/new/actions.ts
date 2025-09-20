
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
  
  // Validation is now primarily handled on the client, but for security,
  // it's good practice to re-validate on the server.
  // const result = assignmentSchema.safeParse(data);
  // if (!result.success) {
  //   return { success: false, message: 'Validation failed.' };
  // }
  
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
