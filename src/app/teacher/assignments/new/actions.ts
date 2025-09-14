
'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { firestore } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';

export const assignmentSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters.'),
  classId: z.string({ required_error: 'Please select a class.' }),
  dueDate: z.date({ required_error: 'A due date is required.' }),
  instructions: z.string().min(20, 'Instructions must be at least 20 characters.'),
});

export type AssignmentFormValues = z.infer<typeof assignmentSchema>;

export async function createAssignmentAction(
  data: AssignmentFormValues
) {
  try {
    const studentsQuery = query(collection(firestore, 'students'), where('classId', '==', data.classId));
    const studentsSnapshot = await getDocs(studentsQuery);
    const totalStudents = studentsSnapshot.size;

    await addDoc(collection(firestore, 'assignments'), {
        ...data,
        teacherId: 'teacher-wanjiku', // Placeholder for logged-in teacher
        createdAt: serverTimestamp(),
        submissions: 0,
        totalStudents,
    });

    revalidatePath('/teacher/assignments');

    return { success: true, message: 'Assignment created successfully!' };
  } catch (error) {
    console.error("Error creating assignment:", error);
    return { success: false, message: 'Failed to create assignment in the database.' };
  }
}
