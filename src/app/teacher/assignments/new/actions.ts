
'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { firestore } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, query, where, getDocs, writeBatch, doc } from 'firebase/firestore';

export const assignmentSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters.'),
  classId: z.string({ required_error: 'Please select a class.' }),
  dueDate: z.date({ required_error: 'A due date is required.' }),
  instructions: z.string().min(20, 'Instructions must be at least 20 characters.'),
});

export type AssignmentFormValues = z.infer<typeof assignmentSchema>;

export async function createAssignmentAction(
  schoolId: string,
  data: AssignmentFormValues,
  className: string
) {
  if (!schoolId) {
    return { success: false, message: 'School ID is missing.' };
  }

  try {
    const validatedData = assignmentSchema.parse(data);

    // 1. Get all students for the selected class
    const studentsQuery = query(collection(firestore, 'schools', schoolId, 'students'), where('classId', '==', data.classId));
    const studentsSnapshot = await getDocs(studentsQuery);
    const totalStudents = studentsSnapshot.size;

    // 2. Create a new assignment record
    const assignmentRef = await addDoc(collection(firestore, 'schools', schoolId, 'assignments'), {
      ...validatedData,
      className,
      teacherId: 'teacher-wanjiku', // Placeholder for logged-in teacher
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
    if (error instanceof z.ZodError) {
        return { success: false, message: 'Validation failed: ' + error.errors.map(e => e.message).join(', ') };
    }
    console.error("Error creating assignment:", error);
    return { success: false, message: 'Failed to create assignment in the database.' };
  }
}
