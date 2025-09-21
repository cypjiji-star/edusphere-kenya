'use server';

import { firestore } from '@/lib/firebase';
import { collection, doc, writeBatch, serverTimestamp, getDocs, query, where } from 'firebase/firestore';
import { logAuditEvent } from '@/lib/audit-log.service';

interface GradeData {
  [studentId: string]: {
    grade: string;
    studentName: string;
  };
}

export async function saveGradesAction(
  schoolId: string,
  classId: string,
  subject: string,
  grades: GradeData,
  actor: { id: string; name: string }
) {
  if (!schoolId || !classId || !subject || Object.keys(grades).length === 0) {
    return { success: false, message: 'Missing required data.' };
  }

  const batch = writeBatch(firestore);
  const now = serverTimestamp();

  // For auditing, we need the class name
  const classDoc = await getDoc(doc(firestore, `schools/${schoolId}/classes`, classId));
  const className = classDoc.exists() ? `${classDoc.data().name} ${classDoc.data().stream || ''}`.trim() : 'Unknown Class';
  
  let successfulSaves = 0;
  
  for (const studentId in grades) {
    const { grade, studentName } = grades[studentId];
    if (grade) { // Only save if a grade was entered
      
      const gradeData = {
        studentId,
        studentName,
        classId,
        subject,
        grade,
        date: now,
        teacherId: actor.id,
        teacherName: actor.name,
        status: 'Pending Approval', // All grades entered by teachers must be approved
      };

      // Create a unique ID for the grade entry to avoid overwriting
      const gradeRef = doc(collection(firestore, 'schools', schoolId, 'grades'));
      batch.set(gradeRef, gradeData);
      successfulSaves++;
    }
  }

  try {
    await batch.commit();

    if (successfulSaves > 0) {
      await logAuditEvent({
        schoolId,
        action: 'GRADES_ENTERED',
        actionType: 'Academics',
        user: actor,
        details: `Entered ${successfulSaves} grades for ${subject} in ${className}. Grades are pending approval.`,
      });
    }

    return { success: true, message: `${successfulSaves} grades saved successfully and are pending approval.` };
  } catch (error) {
    console.error("Error saving grades:", error);
    return { success: false, message: 'An error occurred while saving grades.' };
  }
}
