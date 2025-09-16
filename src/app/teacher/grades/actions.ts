

'use server';

import { z } from 'zod';
import { firestore } from '@/lib/firebase';
import { collection, writeBatch, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import { revalidatePath } from 'next/cache';
import { gradeEntrySchema, type GradeEntryFormValues } from './types';
import { logAuditEvent } from '@/lib/audit-log.service';


// In a real app, this would save to a database.
export async function saveGradesAction(schoolId: string, teacherId: string, teacherName: string, data: GradeEntryFormValues) {
  if (!schoolId) {
    return { success: false, message: 'School ID is missing.' };
  }
  try {
    gradeEntrySchema.parse(data);

    // 1. Get Assessment details
    const assessmentRef = doc(firestore, 'schools', schoolId, 'assessments', data.assessmentId);
    const assessmentSnap = await getDoc(assessmentRef);
    if (!assessmentSnap.exists()) {
        throw new Error("Assessment not found!");
    }
    const assessmentData = assessmentSnap.data();

    // 2. Create grade records for each student in the top-level grades collection
    const batch = writeBatch(firestore);
    
    let validGradesCount = 0;
    for (const studentGrade of data.grades) {
        if (studentGrade.grade) { // Only save if a grade was entered
            validGradesCount++;
            const gradeRef = doc(collection(firestore, 'schools', schoolId, 'grades'));
            batch.set(gradeRef, {
                studentId: studentGrade.studentId,
                assessmentId: data.assessmentId,
                classId: data.classId,
                subject: data.subject, // Include the subject
                grade: studentGrade.grade,
                teacherId,
                teacherName,
                date: assessmentData.endDate, // Use the assessment's end date
                createdAt: serverTimestamp(),
            });
        }
    }

    await batch.commit();

    // 3. Log this bulk action as a single audit event
    await logAuditEvent({
        schoolId,
        actionType: 'Academics',
        description: `Bulk Grades Submitted`,
        user: { name: teacherName, avatarUrl: '' },
        details: `${validGradesCount} grades for "${assessmentData.title}" (${data.subject}) were submitted for class ID ${data.classId}.`,
    });
  
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
