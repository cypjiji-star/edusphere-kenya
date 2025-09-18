
'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { firestore } from '@/lib/firebase';
import { doc, updateDoc, setDoc, query, where, getDocs, collection, getDoc, serverTimestamp, addDoc } from 'firebase/firestore';
import type { GradingFormValues } from './grading-dialog';
import { logAuditEvent } from '@/lib/audit-log.service';

export async function saveGradeAction(
  schoolId: string,
  studentId: string, 
  assignmentId: string,
  data: GradingFormValues,
  actor: { id: string, name: string }
) {
  if (!schoolId) {
    return { success: false, message: 'School ID is missing.' };
  }

  try {
    const gradeRef = data.submissionId
      ? doc(firestore, `schools/${schoolId}/grades`, data.submissionId)
      : doc(collection(firestore, `schools/${schoolId}/grades`));

    const studentSnap = await getDoc(doc(firestore, 'schools', schoolId, 'students', studentId));
    const assignmentSnap = await getDoc(doc(firestore, 'schools', schoolId, 'assignments', assignmentId));

    if (!studentSnap.exists() || !assignmentSnap.exists()) {
      throw new Error("Student or assignment not found.");
    }
    
    const studentData = studentSnap.data();
    const assignmentData = assignmentSnap.data();

    const isEditing = !!data.submissionId;
    const status = isEditing ? 'Pending Approval' : 'Approved';

    await setDoc(gradeRef, {
        grade: data.grade,
        feedback: data.feedback,
        examId: assignmentId,
        studentId: studentId,
        studentRef: doc(firestore, 'schools', schoolId, 'students', studentId),
        subject: assignmentData.subject || 'N/A',
        classId: assignmentData.classId,
        date: assignmentData.dueDate,
        teacherName: actor.name,
        status: status,
    }, { merge: true });

    const action = isEditing ? 'GRADE_UPDATED' : 'GRADE_ENTERED';
    const description = isEditing ?
        `Changed grade for ${studentData.name} to ${data.grade} in "${assignmentData.title}". Change is pending approval.` :
        `Entered grade ${data.grade} for ${studentData.name} in "${assignmentData.title}".`;
    
    await logAuditEvent({
        schoolId,
        action,
        actionType: 'Academics',
        user: { id: actor.id, name: actor.name, role: 'Teacher' },
        details: description,
    });
    
    if (isEditing) {
        await addDoc(collection(firestore, 'schools', schoolId, 'notifications'), {
            title: 'Grade Update Awaiting Approval',
            description: `${actor.name} updated a grade for ${studentData.name} in "${assignmentData.title}".`,
            createdAt: serverTimestamp(),
            category: 'Academics',
            href: `/admin/grades?schoolId=${schoolId}&tab=moderation`,
        });
    }

    revalidatePath(`/teacher/assignments/${assignmentId}?schoolId=${schoolId}`);
    return { success: true, message: 'Grade saved successfully!', status };

  } catch (error) {
    console.error("Error saving grade:", error);
    return { success: false, message: 'Failed to save grade to the database.' };
  }
}
