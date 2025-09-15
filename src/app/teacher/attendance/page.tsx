
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
  getDoc,
} from "firebase/firestore";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useSearchParams } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CheckCircle, Clock, XCircle, CalendarIcon, Loader2, Save } from "lucide-react";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";


type AttendanceStatus = "present" | "absent" | "late" | "unmarked";

export type Student = {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  rollNumber: string;
  avatarUrl: string;
  status: AttendanceStatus;
  notes?: string;
};

type TeacherClass = {
  id: string;
  name: string;
};

const getAttendanceBadge = (status: AttendanceStatus) => {
    switch (status) {
        case 'present': return <Badge variant="default" className="bg-green-600 hover:bg-green-700 w-full"><CheckCircle className="mr-2 h-4 w-4"/>Present</Badge>;
        case 'absent': return <Badge variant="destructive" className="w-full"><XCircle className="mr-2 h-4 w-4"/>Absent</Badge>;
        case 'late': return <Badge variant="secondary" className="w-full bg-yellow-500 hover:bg-yellow-600 text-white"><Clock className="mr-2 h-4 w-4"/>Late</Badge>;
        default: return <Badge variant="outline" className="w-full">Unmarked</Badge>;
    }
}

// DatePicker Component
function DatePicker({
  date,
  setDate,
}: {
  date: Date | null;
  setDate: (date: Date | null) => void;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-[280px] justify-start text-left font-normal",
            !date && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, "PPP") : <span>Pick a date</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <Calendar
          mode="single"
          selected={date || undefined}
          onSelect={(d) => setDate(d || null)}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}

// AttendanceBulkActions Component
function AttendanceBulkActions({
  markAll,
  clearAll,
}: {
  markAll: () => void;
  clearAll: () => void;
}) {
  return (
    <div className="flex space-x-2">
      <Button onClick={markAll}>Mark All Present</Button>
      <Button variant="secondary" onClick={clearAll}>
        Clear All
      </Button>
    </div>
  );
}

// AttendanceTable Component
function AttendanceTable({
  students,
  setStudents,
  selectedClass,
  setSelectedClass,
  teacherClasses,
  isEditable,
}: {
  students: Student[];
  setStudents: React.Dispatch<React.SetStateAction<Student[]>>;
  selectedClass: string | null;
  setSelectedClass: (id: string | null) => void;
  teacherClasses: TeacherClass[];
  isEditable: boolean;
}) {
    
  const handleAttendanceChange = (studentId: string, status: AttendanceStatus) => {
    setStudents(prev => prev.map(s => s.id === studentId ? { ...s, status } : s));
  };

  const handleNotesChange = (studentId: string, notes: string) => {
    setStudents(prev => prev.map(s => s.id === studentId ? { ...s, notes } : s));
  };
    
  return (
    <div>
      <Select onValueChange={setSelectedClass} value={selectedClass ?? ""}>
        <SelectTrigger className="w-[180px] mb-4">
          <SelectValue placeholder="Select a class" />
        </SelectTrigger>
        <SelectContent>
          {teacherClasses.map((c) => (
            <SelectItem key={c.id} value={c.id}>
              {c.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="w-full overflow-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Notes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {students.map((student) => (
              <TableRow key={student.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                        <AvatarImage src={student.avatarUrl} alt={student.name} />
                        <AvatarFallback>{student.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{student.name}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Select
                    value={student.status}
                    onValueChange={(value: AttendanceStatus) =>
                      handleAttendanceChange(student.id, value)
                    }
                    disabled={!isEditable}
                  >
                    <SelectTrigger className="w-36">
                        <SelectValue asChild>
                            <div>{getAttendanceBadge(student.status as AttendanceStatus)}</div>
                        </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="present">{getAttendanceBadge('present')}</SelectItem>
                        <SelectItem value="absent">{getAttendanceBadge('absent')}</SelectItem>
                        <SelectItem value="late">{getAttendanceBadge('late')}</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  {(student.status === "absent" || student.status === "late") && (
                    <Input
                      placeholder="Add note..."
                      value={student.notes || ""}
                      onChange={(e) =>
                        handleNotesChange(student.id, e.target.value)
                      }
                      disabled={!isEditable}
                      className="w-full"
                    />
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}


// --- Main Page Component ---
export default function AttendancePage() {
  const searchParams = useSearchParams();
  const schoolId = searchParams.get('schoolId');
  const [students, setStudents] = React.useState<Student[]>([]);
  const [teacherClasses, setTeacherClasses] = React.useState<TeacherClass[]>([]);
  const [selectedClass, setSelectedClass] = React.useState<string | null>(null);
  const [selectedDate, setSelectedDate] = React.useState<Date | null>(new Date());
  const [isLoading, setIsLoading] = React.useState(true);
  const [user, setUser] = React.useState(auth.currentUser);
  const { toast } = useToast();

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
      const cls: TeacherClass[] = [];
      snap.forEach((d) => cls.push({ id: d.id, name: `${d.data().name} ${d.data().stream || ''}`.trim() }));
      setTeacherClasses(cls);
      if (!selectedClass && cls.length > 0) setSelectedClass(cls[0].id);
    });
    return () => unsub();
  }, [user, schoolId, selectedClass]);

  // Load students for selected class and their attendance status for the selected date
  React.useEffect(() => {
    if (!schoolId || !selectedClass || !selectedDate) return;
    
    setIsLoading(true);

    const studentsQuery = query(
      collection(firestore, "schools", schoolId, "students"),
      where("classId", "==", selectedClass)
    );

    const unsub = onSnapshot(studentsQuery, async (snap) => {
      const studentList = snap.docs.map(d => {
          const data = d.data();
          return {
            id: d.id,
            name: `${data.firstName} ${data.lastName}`,
            avatarUrl: data.avatarUrl,
            ...data,
            status: "unmarked",
            notes: "",
          } as Student;
      });

      // Fetch attendance for all students in one go
      const attendancePromises = studentList.map(student => {
        const attendanceDocId = format(selectedDate, "yyyy-MM-dd");
        const attendanceRef = doc(firestore, 'schools', schoolId, 'students', student.id, 'attendance', attendanceDocId);
        return getDoc(attendanceRef);
      });
      
      const attendanceSnapshots = await Promise.all(attendancePromises);

      const studentsWithAttendance = studentList.map((student, index) => {
        const attendanceDoc = attendanceSnapshots[index];
        if (attendanceDoc.exists()) {
          const data = attendanceDoc.data();
          return {
            ...student,
            status: data.status,
            notes: data.notes || '',
          };
        }
        return student;
      });

      setStudents(studentsWithAttendance);
      setIsLoading(false);
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
    if (!selectedClass || !schoolId || !user || students.length === 0 || !selectedDate) {
      console.warn("Cannot save: missing data", { schoolId, selectedClass, user, selectedDate });
      return;
    }

    const batch = writeBatch(firestore);
    const attendanceDocId = format(selectedDate, "yyyy-MM-dd");
    const currentClass = teacherClasses.find((c) => c.id === selectedClass);
    
    for (const student of students) {
      if (student.status === "unmarked") continue;
      const attendanceRef = doc(firestore, "schools", schoolId, "students", student.id, "attendance", attendanceDocId);
      
      batch.set(attendanceRef, {
        date: Timestamp.fromDate(selectedDate),
        status: student.status,
        notes: student.notes || "",
        teacher: user.displayName || "Unknown Teacher",
        teacherId: user.uid,
        classId: selectedClass,
        className: currentClass?.name || "Unknown",
        schoolId: schoolId,
        studentName: student.name,
        studentAvatar: student.avatarUrl
      });
    }

    try {
      await batch.commit();
      toast({
        title: "✓ Saved",
        description: `Attendance for ${currentClass?.name} on ${format(selectedDate, "PPP")} has been saved.`,
      });
    } catch (err) {
      console.error("Error saving attendance:", err);
      toast({
        title: "Save Failed",
        description: "Could not save attendance. Please try again.",
        variant: "destructive",
      });
    }
  }, [selectedClass, schoolId, user, students, selectedDate, teacherClasses, toast]);
  
  if (isLoading) {
    return <div className="flex h-full items-center justify-center p-8"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>
  }

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
        isEditable={true}
      />

      <Button onClick={handleSaveAttendance}>
        <Save className="mr-2 h-4 w-4" />
        Submit Attendance
      </Button>
    </div>
  );
}
