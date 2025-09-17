'use server';

import { z } from 'zod';
import { firestore } from '@/lib/firebase';
import { collection, writeBatch, serverTimestamp, doc, getDoc, query, where, getDocs } from 'firebase/firestore';
import { revalidatePath } from 'next/cache';
import { gradeEntrySchema, type GradeEntryFormValues } from './types';
import { logAuditEvent } from '@/lib/audit-log.service';


export async function saveGradesAction(schoolId: string, teacherId: string, teacherName: string, data: GradeEntryFormValues) {
  if (!schoolId) {
    return { success: false, message: 'School ID is missing.' };
  }
  
  try {
    // Validate the input data
    gradeEntrySchema.parse(data);

    // 1. Get Assessment details
    const assessmentRef = doc(firestore, 'schools', schoolId, 'assessments', data.assessmentId);
    const assessmentSnap = await getDoc(assessmentRef);
    if (!assessmentSnap.exists()) {
        return { success: false, message: 'Assessment not found!' };
    }
    const assessmentData = assessmentSnap.data();

    // 2. Check if grades already exist for this assessment to prevent duplicates
    const existingGradesQuery = query(
      collection(firestore, 'schools', schoolId, 'grades'),
      where('assessmentId', '==', data.assessmentId),
      where('classId', '==', data.classId),
      where('subject', '==', data.subject)
    );
    
    const existingGradesSnapshot = await getDocs(existingGradesQuery);
    if (!existingGradesSnapshot.empty) {
      return { 
        success: false, 
        message: 'Grades for this assessment have already been submitted. Please request edit access if changes are needed.' 
      };
    }

    // 3. Create grade records for each student
    const batch = writeBatch(firestore);
    
    let validGradesCount = 0;
    for (const studentGrade of data.grades) {
        if (studentGrade.grade && studentGrade.grade.trim() !== '') {
            // Validate grade is a number between 0-100
            const gradeValue = Number(studentGrade.grade);
            if (isNaN(gradeValue) || gradeValue < 0 || gradeValue > 100) {
                return { 
                  success: false, 
                  message: `Invalid grade value for student ${studentGrade.studentId}: ${studentGrade.grade}. Grades must be between 0-100.` 
                };
            }
            
            validGradesCount++;
            const gradeRef = doc(collection(firestore, 'schools', schoolId, 'grades'));
            batch.set(gradeRef, {
                studentId: studentGrade.studentId,
                assessmentId: data.assessmentId,
                classId: data.classId,
                subject: data.subject,
                grade: studentGrade.grade,
                teacherId,
                teacherName,
                date: assessmentData.endDate || serverTimestamp(),
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            });
        }
    }

    if (validGradesCount === 0) {
      return { success: false, message: 'No valid grades to save.' };
    }

    await batch.commit();

    // 4. Log this bulk action as a single audit event
    await logAuditEvent({
        schoolId,
        actionType: 'Academics',
        description: `Bulk Grades Submitted`,
        user: { name: teacherName, avatarUrl: '' },
        details: `${validGradesCount} grades for "${assessmentData.title}" (${data.subject}) were submitted for class ID ${data.classId}.`,
    });
  
    revalidatePath(`/teacher/grades?schoolId=${schoolId}`);
    revalidatePath(`/teacher/grades/entry?schoolId=${schoolId}`);

    return { success: true, message: `${validGradesCount} grades saved successfully!` };

  } catch (error: any) {
      if (error instanceof z.ZodError) {
          return { success: false, message: 'Validation failed: ' + error.errors.map(e => e.message).join(', ') };
      }
      console.error("Error saving grades:", error);
      return { 
        success: false, 
        message: `An unexpected error occurred: ${error.message || 'Please try again later.'}` 
      };
  }
}