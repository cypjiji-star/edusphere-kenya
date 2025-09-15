
"use client";

import React from "react";
import { firestore, auth } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  writeBatch,
  doc,
  Timestamp,
  getDocs,
} from "firebase/firestore";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { AttendanceTable } from "./attendance-table";
import { AttendanceBulkActions } from "./attendance-bulk-actions";
import { DatePicker } from "./date-picker";
import { useSearchParams } from "next/navigation";

export default function AttendancePage() {
  const searchParams = useSearchParams();
  const schoolId = searchParams.get('schoolId');
  const [students, setStudents] = React.useState<any[]>([]);
  const [teacherClasses, setTeacherClasses] = React.useState<any[]>([]);
  const [selectedClass, setSelectedClass] = React.useState<string | null>(null);
  const [selectedDate, setSelectedDate] = React.useState<Date | null>(new Date());
  const [isEditable, setIsEditable] = React.useState(true);
  const [user, setUser] = React.useState(auth.currentUser);

  React.useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(setUser);
    return () => unsubscribe();
  }, []);

  // Load classes for this teacher
  React.useEffect(() => {
    if (!user || !schoolId) return;
    const q = query(
      collection(firestore, "schools", schoolId, "classes"),
      where("teacherId", "==", user.uid)
    );
    const unsub = onSnapshot(q, (snap) => {
      const cls: any[] = [];
      snap.forEach((d) => cls.push({ id: d.id, ...d.data() }));
      setTeacherClasses(cls);
      if (!selectedClass && cls.length > 0) setSelectedClass(cls[0].id);
    });
    return () => unsub();
  }, [user, schoolId, selectedClass]);

  // Load students for selected class and their attendance status for the selected date
  React.useEffect(() => {
    if (!schoolId || !selectedClass || !selectedDate) return;

    const baseDate = selectedDate || new Date();
    baseDate.setHours(0, 0, 0, 0);
    const attendanceDate = Timestamp.fromDate(baseDate);

    const studentsQuery = query(
      collection(firestore, "schools", schoolId, "students"),
      where("classId", "==", selectedClass)
    );

    const unsub = onSnapshot(studentsQuery, async (snap) => {
      const studentList = snap.docs.map(d => ({
        id: d.id,
        name: `${d.data().firstName} ${d.data().lastName}`,
        ...d.data(),
        status: "unmarked",
        notes: "",
      }));

      // Fetch attendance for these students for the selected date
      const attendanceQuery = query(
          collection(firestore, 'schools', schoolId, 'attendance'),
          where('classId', '==', selectedClass),
          where('date', '==', attendanceDate)
      );

      const attendanceSnapshot = await getDocs(attendanceQuery);
      const attendanceMap = new Map();
      attendanceSnapshot.forEach(doc => {
          const data = doc.data();
          attendanceMap.set(data.studentId, { status: data.status, notes: data.notes });
      });

      const studentsWithAttendance = studentList.map(student => ({
          ...student,
          status: attendanceMap.get(student.id)?.status || 'unmarked',
          notes: attendanceMap.get(student.id)?.notes || '',
      }));

      setStudents(studentsWithAttendance);
    });

    return () => unsub();
  }, [schoolId, selectedClass, selectedDate]);

  // Mark All / Clear All
  const markAll = React.useCallback(() => {
    setStudents((prev) => prev.map((s) => ({ ...s, status: "present" })));
  }, []);

  const clearAll = React.useCallback(() => {
    setStudents((prev) => prev.map((s) => ({ ...s, status: "unmarked" })));
  }, []);

  // Save Attendance
  const handleSaveAttendance = React.useCallback(async () => {
    if (!isEditable || !selectedClass || !schoolId || !user || students.length === 0) {
      console.warn("Cannot save: missing data", { schoolId, selectedClass, user });
      return;
    }
    
    console.log('Saving attendance with schoolId:', schoolId);

    const baseDate = selectedDate || new Date();
    baseDate.setHours(0, 0, 0, 0);

    const batch = writeBatch(firestore);
    const attendanceDate = Timestamp.fromDate(baseDate);
    const currentClass = teacherClasses.find((c) => c.id === selectedClass);
    
    console.log("Attendance batch:", {
      studentId: students[0]?.id,
      sampleDoc: {
        studentId: students[0]?.id,
        studentName: students[0]?.name,
        class: teacherClasses.find((c) => c.id === selectedClass)?.name || 'Unknown',
        classId: selectedClass,
        schoolId: schoolId,
        date: Timestamp.fromDate(new Date()),
        status: students[0]?.status,
        notes: students[0]?.notes || '',
        teacher: user?.displayName || 'Unknown Teacher',
        teacherId: user?.uid,
      }
    });

    for (const student of students) {
      if (student.status === "unmarked") continue;

      const docId = `${student.id}_${format(baseDate, "yyyy-MM-dd")}`;
      const attendanceRef = doc(firestore, "schools", schoolId, "attendance", docId);
      
      batch.set(attendanceRef, {
        studentId: student.id,
        studentName: student.name,
        studentAvatar: student.avatarUrl || "",
        class: currentClass?.name || "Unknown",
        classId: selectedClass,
        schoolId: schoolId, // Ensure schoolId is saved in the document
        date: attendanceDate,
        status: student.status,
        notes: student.notes || "",
        teacher: user.displayName || "Unknown Teacher",
        teacherId: user.uid,
      });
    }

    try {
      await batch.commit();
      toast({
        title: "✓ Saved",
        description: `Attendance for ${currentClass?.name} on ${format(baseDate, "PPP")} has been saved.`,
      });
    } catch (err) {
      console.error("Error saving attendance:", err);
      toast({
        title: "Save Failed",
        description: "Could not save attendance. Please try again.",
        variant: "destructive",
      });
    }
  }, [isEditable, selectedClass, schoolId, user, students, selectedDate, teacherClasses]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-4">
      <div className="flex justify-between items-center">
        <DatePicker date={selectedDate} setDate={setSelectedDate} />
        <AttendanceBulkActions markAll={markAll} clearAll={clearAll} />
      </div>

      <AttendanceTable
        students={students}
        setStudents={setStudents}
        selectedClass={selectedClass}
        setSelectedClass={setSelectedClass}
        teacherClasses={teacherClasses}
        isEditable={isEditable}
      />

      <Button onClick={handleSaveAttendance} disabled={!isEditable}>
        Submit Attendance
      </Button>
    </div>
  );
}
