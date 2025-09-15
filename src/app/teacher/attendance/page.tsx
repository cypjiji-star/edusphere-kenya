"use client";

import React, { useCallback, useEffect, useState } from "react";
import { firestore } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  writeBatch,
  doc,
  Timestamp,
  getDocs,
  getDoc,
  orderBy,
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
import { useAuth } from "@/context/auth-context";

type AttendanceStatus = "present" | "absent" | "late" | "unmarked";

export type Student = {
  id: string;
  name: string;
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

export default function AttendancePage() {
  const searchParams = useSearchParams();
  const schoolId = searchParams.get('schoolId');
  const { user } = useAuth();
  const { toast } = useToast();

  const [teacherClasses, setTeacherClasses] = useState<TeacherClass[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [teacherName, setTeacherName] = useState('Teacher');

  // Fetch teacher's details (name)
  useEffect(() => {
    if (!user || !schoolId) return;
    const userDocRef = doc(firestore, `schools/${schoolId}/users`, user.uid);
    const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
      if (docSnap.exists()) {
        setTeacherName(docSnap.data().name || 'Teacher');
      }
    });
    return () => unsubscribe();
  }, [user, schoolId]);

  // Fetch classes assigned to the teacher
  useEffect(() => {
    if (!user || !schoolId) return;
    const q = query(
      collection(firestore, "schools", schoolId, "classes"),
      where("teacherId", "==", user.uid)
    );
    const unsub = onSnapshot(q, (snap) => {
      const classesData: TeacherClass[] = snap.docs.map(d => ({ id: d.id, name: `${d.data().name} ${d.data().stream || ''}`.trim() }));
      setTeacherClasses(classesData);
      if (!selectedClassId && classesData.length > 0) {
        setSelectedClassId(classesData[0].id);
      } else if (classesData.length === 0) {
        setIsLoading(false);
      }
    });
    return () => unsub();
  }, [user, schoolId, selectedClassId]);

  // Main data fetching effect with REAL-TIME LISTENERS
  useEffect(() => {
    if (!schoolId || !selectedClassId || !selectedDate) {
        setIsLoading(false);
        return;
    }

    setIsLoading(true);

    const fetchData = async () => {
      try {
        // 1. Fetch the list of students for the class
        const studentsQuery = query(
          collection(firestore, "schools", schoolId, "students"),
          where("classId", "==", selectedClassId),
          orderBy("rollNumber")
        );
        const studentsSnapshot = await getDocs(studentsQuery);
        const studentList: Student[] = studentsSnapshot.docs.map(d => {
          const data = d.data();
          return {
            id: d.id,
            name: `${data.firstName || ''} ${data.lastName || ''}`.trim(),
            rollNumber: data.rollNumber || '',
            avatarUrl: data.avatarUrl || '',
            status: "unmarked",
            notes: "",
          } as Student;
        });

        // 2. Check for existing attendance records for the selected date
        const startOfDay = new Date(selectedDate);
        startOfDay.setHours(0, 0, 0, 0);
        const attendanceDate = Timestamp.fromDate(startOfDay);
        
        const attendanceQuery = query(
          collection(firestore, "schools", schoolId, "attendance"),
          where("classId", "==", selectedClassId),
          where("date", "==", attendanceDate)
        );

        const attendanceSnapshot = await getDocs(attendanceQuery);
        const attendanceData: Record<string, {status: AttendanceStatus, notes: string}> = {};
        
        attendanceSnapshot.docs.forEach(doc => {
          const data = doc.data();
          attendanceData[data.studentId] = {
            status: data.status || "unmarked",
            notes: data.notes || ""
          };
        });

        // 3. Merge student data with attendance data
        const studentsWithAttendance = studentList.map(student => {
          if (attendanceData[student.id]) {
            return {
              ...student,
              status: attendanceData[student.id].status,
              notes: attendanceData[student.id].notes
            };
          }
          return student;
        });

        setStudents(studentsWithAttendance);
        setIsLoading(false);

        // 4. Set up real-time listener for attendance changes
        const unsubscribe = onSnapshot(attendanceQuery, (snapshot) => {
          const updatedAttendance: Record<string, {status: AttendanceStatus, notes: string}> = {};
          
          snapshot.docs.forEach(doc => {
            const data = doc.data();
            updatedAttendance[data.studentId] = {
              status: data.status || "unmarked",
              notes: data.notes || ""
            };
          });

          setStudents(prev => prev.map(student => {
            if (updatedAttendance[student.id]) {
              return {
                ...student,
                status: updatedAttendance[student.id].status,
                notes: updatedAttendance[student.id].notes
              };
            }
            return student;
          }));
        });

        return unsubscribe;

      } catch (error) {
        console.error("Error fetching data:", error);
        toast({
          title: "Error",
          description: "Failed to load attendance data",
          variant: "destructive",
        });
        setIsLoading(false);
      }
    };

    const cleanupPromise = fetchData();
    
    return () => {
      cleanupPromise.then(cleanup => cleanup && cleanup());
    };
  }, [schoolId, selectedClassId, selectedDate, toast]);

  const handleAttendanceChange = (studentId: string, status: AttendanceStatus) => {
    setStudents(prev => prev.map(s => s.id === studentId ? { ...s, status } : s));
  };

  const handleNotesChange = (studentId: string, notes: string) => {
    setStudents(prev => prev.map(s => s.id === studentId ? { ...s, notes } : s));
  };

  const handleSaveAttendance = useCallback(async () => {
    if (!selectedClassId || !schoolId || !user || students.length === 0 || !selectedDate) {
      toast({ title: 'Cannot Save', description: 'Missing required information.', variant: 'destructive'});
      return;
    }
    
    setIsSaving(true);
    const batch = writeBatch(firestore);
    const currentClass = teacherClasses.find((c) => c.id === selectedClassId);
    
    const startOfDay = new Date(selectedDate);
    startOfDay.setHours(0, 0, 0, 0);
    const attendanceDate = Timestamp.fromDate(startOfDay);

    for (const student of students) {
      if (student.status === "unmarked") continue;
      
      // Create a unique ID for the attendance record using student ID and date
      const attendanceId = `${student.id}_${format(selectedDate, 'yyyy-MM-dd')}`;
      
      // Correct path: schools/{schoolId}/attendance/{attendanceId}
      const attendanceRef = doc(firestore, `schools/${schoolId}/attendance`, attendanceId);
      
      const attendanceData = {
        studentId: student.id,
        studentName: student.name,
        classId: selectedClassId,
        className: currentClass?.name || "Unknown",
        date: attendanceDate,
        status: student.status,
        notes: student.notes || "",
        teacherId: user.uid,
        teacher: teacherName,
        schoolId: schoolId,
        timestamp: Timestamp.now(),
      };

      batch.set(attendanceRef, attendanceData);
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
    } finally {
      setIsSaving(false);
    }
  }, [schoolId, selectedClassId, selectedDate, students, teacherClasses, teacherName, toast, user]);

  const markAll = () => handleBulkUpdate('present');
  const clearAll = () => handleBulkUpdate('unmarked');

  const handleBulkUpdate = (status: AttendanceStatus) => {
    setStudents(prev => prev.map(s => ({ ...s, status })));
  };

  if (isLoading) {
    return <div className="flex h-full items-center justify-center p-8"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-4">
      <div className="flex justify-between items-center">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={"outline"}
              className={cn(
                "w-[280px] justify-start text-left font-normal",
                !selectedDate && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={selectedDate || undefined}
              onSelect={(d) => setSelectedDate(d || null)}
              initialFocus
            />
          </PopoverContent>
        </Popover>
        <div className="flex space-x-2">
            <Button onClick={markAll}>Mark All Present</Button>
            <Button variant="secondary" onClick={clearAll}>Clear All</Button>
        </div>
      </div>
      
      <div>
        <Select onValueChange={setSelectedClassId} value={selectedClassId ?? ""}>
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
                <TableHead className="w-[200px]">Student</TableHead>
                <TableHead className="w-[150px]">Status</TableHead>
                <TableHead>Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.length > 0 ? (
                students.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={student.avatarUrl} alt={student.name} />
                          <AvatarFallback>{student.name?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="font-medium">{student.name}</span>
                          {student.rollNumber && (
                            <span className="text-sm text-muted-foreground">Roll: {student.rollNumber}</span>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={student.status}
                        onValueChange={(value: AttendanceStatus) =>
                          handleAttendanceChange(student.id, value)
                        }
                      >
                        <SelectTrigger className="w-36">
                          <SelectValue>{getAttendanceBadge(student.status)}</SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="present">{getAttendanceBadge('present')}</SelectItem>
                          <SelectItem value="absent">{getAttendanceBadge('absent')}</SelectItem>
                          <SelectItem value="late">{getAttendanceBadge('late')}</SelectItem>
                          <SelectItem value="unmarked">{getAttendanceBadge('unmarked')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      {(student.status === "absent" || student.status === "late") && (
                        <Input
                          placeholder="Add note (optional)..."
                          value={student.notes || ""}
                          onChange={(e) =>
                            handleNotesChange(student.id, e.target.value)
                          }
                          className="w-full"
                        />
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={3} className="h-24 text-center">
                    {teacherClasses.length === 0 
                      ? "No classes assigned to you." 
                      : "No students found in this class."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {students.length > 0 && (
        <Button 
          onClick={handleSaveAttendance} 
          disabled={isSaving}
          className="w-full sm:w-auto"
        >
          <Save className="mr-2 h-4 w-4" />
          {isSaving ? "Saving..." : "Submit Attendance"}
        </Button>
      )}
    </div>
  );
}