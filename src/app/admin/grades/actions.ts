
'use server';

import { firestore } from '@/lib/firebase';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { z } from 'zod';

const examSchema = z.object({
  title: z.string().min(3, 'Title is required.'),
  term: z.string().min(1, 'Academic term is required.'),
  date: z.date({ required_error: 'Exam date is required.' }),
});

export async function createExamAction(schoolId: string, formData: FormData) {
  if (!schoolId) {
    return { success: false, message: 'School ID is missing.' };
  }

  const data = {
    title: formData.get('title'),
    term: formData.get('term'),
    date: new Date(formData.get('date') as string),
  };

  const validation = examSchema.safeParse(data);

  if (!validation.success) {
    return { success: false, message: 'Invalid data.', errors: validation.error.flatten().fieldErrors };
  }

  try {
    await addDoc(collection(firestore, 'schools', schoolId, 'exams'), {
      ...validation.data,
      status: 'Open', // Default status for new exams
      createdAt: serverTimestamp(),
    });
    return { success: true, message: 'Exam created successfully.' };
  } catch (error) {
    console.error('Error creating exam:', error);
    return { success: false, message: 'An unexpected error occurred.' };
  }
}
