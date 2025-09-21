
'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { firestore } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, query, where, getDocs, writeBatch, doc } from 'firebase/firestore';
import { format } from 'date-fns';

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
    
    // 3. Create submission placeholders for each student (This is what was missing)
    const batch = writeBatch(firestore);
    studentsSnapshot.forEach((studentDoc) => {
        const submissionRef = doc(collection(firestore, `schools/${schoolId}/assignments/${assignmentRef.id}/submissions`));
        batch.set(submissionRef, {
            studentRef: doc(firestore, 'schools', schoolId, 'students', studentDoc.id),
            status: 'Not Handed In',
            grade: null,
            feedback: null,
            submittedDate: null,
        });
    });
    await batch.commit();


    // 4. Create notifications for students/parents in the class
    await addDoc(collection(firestore, `schools/${schoolId}/notifications`), {
        title: 'New Assignment Posted',
        description: `A new assignment "${data.title}" has been posted for ${className}. Due on ${format(data.dueDate, 'PPP')}.`,
        createdAt: serverTimestamp(),
        category: 'Academics',
        href: `/teacher/assignments/${assignmentRef.id}?schoolId=${schoolId}`,
        audience: 'all', // Or more specific if needed
    });

    revalidatePath(`/teacher/assignments?schoolId=${schoolId}`);

    return { success: true, message: 'Assignment created successfully!' };
  } catch (error) {
    console.error("Error creating assignment:", error);
    return { success: false, message: 'Failed to create assignment in the database.' };
  }
}
