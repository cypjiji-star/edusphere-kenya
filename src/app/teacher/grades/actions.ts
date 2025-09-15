

'use server';

import { z } from 'zod';
import { gradeEntrySchema, GradeEntryFormValues } from './new/grade-entry-form';
import { firestore } from '@/lib/firebase';
import { collection, addDoc, doc, writeBatch, serverTimestamp, getDocs, query, where, getDoc } from 'firebase/firestore';
import { revalidatePath } from 'next/cache';


// In a real app, this would save to a database.
export async function saveGradesAction(schoolId: string, teacherId: string, teacherName: string, data: GradeEntryFormValues) {
  if (!schoolId) {
    return { success: false, message: 'School ID is missing.' };
  }
  try {
    gradeEntrySchema.parse(data);

    // 1. Get Assessment & Class details
    const assessmentRef = doc(firestore, 'schools', schoolId, 'assesments', data.assessmentId);
    const assessmentSnap = await getDoc(assessmentRef);
    if (!assessmentSnap.exists()) {
        throw new Error("Assessment not found!");
    }
    const assessmentData = assessmentSnap.data();

    const classRef = doc(firestore, 'schools', schoolId, 'classes', data.classId);
    const classSnap = await getDoc(classRef);
    const className = classSnap.exists() ? `${classSnap.data().name} ${classSnap.data().stream || ''}`.trim() : 'Unknown Class';


    // 2. Create a 'submission' document
    const submissionRef = await addDoc(collection(firestore, 'schools', schoolId, 'submissions'), {
      examId: data.assessmentId,
      subject: assessmentData.title, // Or a more specific subject field if available
      teacher: teacherName,
      teacherId: teacherId,
      class: className,
      status: 'Submitted',
      lastUpdated: serverTimestamp(),
    });

    // 3. Create grade records for each student in a subcollection under the student
    const batch = writeBatch(firestore);
    
    for (const studentGrade of data.grades) {
        if (studentGrade.grade) { // Only save if a grade was entered
            const gradeRef = doc(collection(firestore, 'schools', schoolId, 'students', studentGrade.studentId, 'grades'));
            batch.set(gradeRef, {
                assessmentId: data.assessmentId,
                assessmentTitle: assessmentData.title,
                grade: studentGrade.grade,
                date: assessmentData.dueDate, // Use the assessment's due date
            });
        }
    }

    await batch.commit();
  
    revalidatePath(`/teacher/grades?schoolId=${schoolId}`);

    return { success: true, message: 'Grades saved successfully!' };

  } catch (error: any) {
      if (error instanceof z.ZodError) {
          return { success: false, message: 'Validation failed: ' + error.errors.map(e => e.message).join(', ') };
      }
      console.error("Error saving grades:", error);
      // Pass the specific error message back to the client
      return { success: false, message: `An unexpected error occurred: ${error.message}` };
  }
}


