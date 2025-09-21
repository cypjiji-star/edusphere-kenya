
'use server';

import { firestore } from '@/lib/firebase';
import { addDoc, collection, serverTimestamp, query, where, getDocs, writeBatch } from 'firebase/firestore';
import { z } from 'zod';
import { logAuditEvent } from '@/lib/audit-log.service';

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


export async function publishGradesAction(schoolId: string, examId: string) {
    if (!schoolId || !examId) {
        return { success: false, message: 'Missing required IDs.' };
    }

    try {
        const gradesQuery = query(
            collection(firestore, `schools/${schoolId}/grades`),
            where('examId', '==', examId),
            where('status', '==', 'Pending Approval')
        );

        const gradesSnapshot = await getDocs(gradesQuery);
        if (gradesSnapshot.empty) {
            return { success: true, message: 'No pending grades found to publish for this exam.' };
        }

        const batch = writeBatch(firestore);
        gradesSnapshot.forEach(doc => {
            batch.update(doc.ref, { status: 'Approved' });
        });

        await batch.commit();

        return { success: true, message: `Successfully published ${gradesSnapshot.size} grades.` };
    } catch (error) {
        console.error("Error publishing grades:", error);
        return { success: false, message: 'An error occurred while publishing grades.' };
    }
}

    