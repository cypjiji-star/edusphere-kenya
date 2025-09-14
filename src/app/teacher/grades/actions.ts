
'use server';

import { z } from 'zod';
import { gradeEntrySchema, GradeEntryFormValues } from './new/grade-entry-form';
import { firestore } from '@/lib/firebase';
import { collection, addDoc, doc, writeBatch, serverTimestamp, getDocs, query, where } from 'firebase/firestore';
import { revalidatePath } from 'next/cache';


// In a real app, this would save to a database.
export async function saveGradesAction(schoolId: string, data: GradeEntryFormValues) {
  if (!schoolId) {
    return { success: false, message: 'School ID is missing.' };
  }
  try {
    gradeEntrySchema.parse(data);

    // 1. Create a new assessment record in the 'assessments' collection
    const assessmentRef = await addDoc(collection(firestore, 'schools', schoolId, 'assessments'), {
      title: data.assessmentTitle,
      type: data.assessmentType,
      date: data.assessmentDate,
      classId: data.classId,
      teacherId: 'teacher-wanjiku', // Placeholder for logged-in teacher
      createdAt: serverTimestamp(),
    });

    // 2. Create grade records for each student in a subcollection
    const batch = writeBatch(firestore);
    const studentsQuery = query(collection(firestore, 'schools', schoolId, 'students'), where('classId', '==', data.classId));
    const studentsSnapshot = await getDocs(studentsQuery);
    
    studentsSnapshot.forEach(studentDoc => {
        const studentGrade = data.grades.find(g => g.studentId === studentDoc.id);
        if (studentGrade) {
            const gradeRef = doc(collection(firestore, 'schools', schoolId, 'students', studentDoc.id, 'grades'));
            batch.set(gradeRef, {
                assessmentId: assessmentRef.id,
                assessmentTitle: data.assessmentTitle,
                grade: studentGrade.grade,
                date: data.assessmentDate,
            });
        }
    });

    await batch.commit();
  
    revalidatePath(`/teacher/grades?schoolId=${schoolId}`);

    return { success: true, message: 'Grades saved successfully!' };

  } catch (error) {
      if (error instanceof z.ZodError) {
          return { success: false, message: 'Validation failed: ' + error.errors.map(e => e.message).join(', ') };
      }
      console.error("Error saving grades:", error);
      return { success: false, message: 'An unexpected error occurred while saving grades.' };
  }
}

    