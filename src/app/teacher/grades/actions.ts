"use server";

import { firestore } from "@/lib/firebase";
import {
  addDoc,
  collection,
  serverTimestamp,
  query,
  where,
  getDocs,
  writeBatch,
  doc,
  getDoc,
} from "firebase/firestore";
import { z } from "zod";
import { logAuditEvent } from "@/lib/audit-log.service";

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
  examId: string,
  grades: GradeData,
  actor: { id: string; name: string },
) {
  if (
    !schoolId ||
    !classId ||
    !subject ||
    !examId ||
    Object.keys(grades).length === 0
  ) {
    return { success: false, message: "Missing required data." };
  }

  const batch = writeBatch(firestore);

  const classDoc = await getDoc(
    doc(firestore, `schools/${schoolId}/classes`, classId),
  );
  const className = classDoc.exists()
    ? `${classDoc.data().name} ${classDoc.data().stream || ""}`.trim()
    : "Unknown Class";

  let successfulSaves = 0;

  for (const studentId in grades) {
    const { grade, studentName } = grades[studentId];
    if (grade) {
      const gradeData = {
        studentId,
        studentName,
        classId,
        subject,
        grade,
        examId, // Store the ID of the exam
        date: serverTimestamp(), // Use current date for grade entry
        teacherId: actor.id,
        teacherName: actor.name,
        status: "Pending Approval",
      };

      const gradeRef = doc(
        collection(firestore, "schools", schoolId, "grades"),
      );
      batch.set(gradeRef, gradeData);
      successfulSaves++;
    }
  }

  try {
    await batch.commit();

    if (successfulSaves > 0) {
      await logAuditEvent({
        schoolId,
        action: "GRADES_ENTERED",
        actionType: "Academics",
        user: actor,
        details: `Entered ${successfulSaves} grades for ${subject} in ${className}. Grades are pending approval.`,
      });

      // Notify admin that grades need moderation
      await addDoc(
        collection(firestore, "schools", schoolId, "notifications"),
        {
          title: "Grades Awaiting Approval",
          description: `${actor.name} submitted ${successfulSaves} grades for ${subject} in ${className}.`,
          createdAt: serverTimestamp(),
          category: "Academics",
          href: `/admin/grades?schoolId=${schoolId}`,
          audience: "admin",
        },
      );
    }

    return {
      success: true,
      message: `${successfulSaves} grades saved successfully and are pending approval.`,
    };
  } catch (error) {
    console.error("Error saving grades:", error);
    return {
      success: false,
      message: "An error occurred while saving grades.",
    };
  }
}
