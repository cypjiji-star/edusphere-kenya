
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
  orderBy,
  setDoc,
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
import { CheckCircle, Clock, XCircle, CalendarIcon, Loader2, Save, ClipboardCheck, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { useAuth } from "@/context/auth-context";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MyAttendanceHistory } from "./my-attendance-calendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

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
  const [activeTab, setActiveTab] = useState<string | undefined>();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
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
      if (!activeTab && classesData.length > 0) {
        setActiveTab(classesData[0].id);
      } else if (classesData.length === 0) {
        setIsLoading(false);
      }
    });
    return () => unsub();
  }, [user, schoolId, activeTab]);

  // Main data fetching effect
  useEffect(() => {
    if (!schoolId || !activeTab || !selectedDate) {
        setStudents([]);
        setIsLoading(false);
        return;
    }

    setIsLoading(true);

    const fetchAttendanceData = async () => {
        // 1. Get all students for the class
        const studentsQuery = query(
            collection(firestore, "schools", schoolId, "students"),
            where("classId", "==", activeTab),
            orderBy("name")
        );
        const studentsSnapshot = await getDocs(studentsQuery);
        const studentList: Student[] = studentsSnapshot.docs.map(d => {
            const data = d.data();
            return {
                id: d.id,
                name: data.name || "Unknown",
                rollNumber: data.rollNumber || '',
                avatarUrl: data.avatarUrl || `https://picsum.photos/seed/${d.id}/100`,
                status: "unmarked",
                notes: "",
            };
        });

        // 2. Get existing attendance records for the selected date
        const startOfDay = new Date(selectedDate);
        startOfDay.setHours(0, 0, 0, 0);
        const attendanceDate = Timestamp.fromDate(startOfDay);

        const attendanceQuery = query(
            collection(firestore, "schools", schoolId, "attendance"),
            where("classId", "==", activeTab),
            where("date", "==", attendanceDate)
        );
        const attendanceSnapshot = await getDocs(attendanceQuery);
        const attendanceMap = new Map<string, { status: AttendanceStatus; notes?: string }>();
        attendanceSnapshot.forEach(doc => {
            const data = doc.data();
            attendanceMap.set(data.studentId, { status: data.status, notes: data.notes });
        });

        // 3. Merge student list with attendance data
        const mergedStudents = studentList.map(student => {
            const attendanceRecord = attendanceMap.get(student.id);
            return attendanceRecord ? { ...student, ...attendanceRecord } : student;
        });

        setStudents(mergedStudents);
        setIsLoading(false);
    };

    fetchAttendanceData();
  }, [schoolId, activeTab, selectedDate]);

  const handleAttendanceChange = (studentId: string, status: AttendanceStatus) => {
    setStudents(prev => prev.map(s => s.id === studentId ? { ...s, status } : s));
  };

  const handleNotesChange = (studentId: string, notes: string) => {
    setStudents(prev => prev.map(s => s.id === studentId ? { ...s, notes } : s));
  };

  const handleSaveAttendance = useCallback(async () => {
    if (!activeTab || !schoolId || !user || students.length === 0 || !selectedDate) {
      toast({ title: 'Cannot Save', description: 'Missing required information.', variant: 'destructive'});
      return;
    }
    
    setIsSaving(true);
    const batch = writeBatch(firestore);
    const currentClass = teacherClasses.find((c) => c.id === activeTab);
    
    const startOfDay = new Date(selectedDate);
    startOfDay.setHours(0, 0, 0, 0);
    const attendanceDate = Timestamp.fromDate(startOfDay);

    for (const student of students) {
      if (student.status === "unmarked") continue;
      
      const attendanceId = `${student.id}_${format(selectedDate, 'yyyy-MM-dd')}`;
      const attendanceRef = doc(firestore, `schools/${schoolId}/attendance`, attendanceId);
      
      const attendanceData = {
        studentId: student.id,
        studentName: student.name,
        classId: activeTab,
        className: currentClass?.name || "Unknown",
        date: attendanceDate,
        status: student.status,
        notes: student.notes || "",
        teacherId: user.uid,
        teacher: teacherName,
        schoolId: schoolId,
        timestamp: Timestamp.now(),
      };

      batch.set(attendanceRef, attendanceData, { merge: true });
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
  }, [schoolId, activeTab, selectedDate, students, teacherClasses, teacherName, toast, user]);

  const markAll = () => handleBulkUpdate('present');
  const clearAll = () => handleBulkUpdate('unmarked');

  const handleBulkUpdate = (status: AttendanceStatus) => {
    setStudents(prev => prev.map(s => ({ ...s, status })));
  };

  if (!user || !schoolId) {
    return <div className="flex h-full items-center justify-center p-8"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-4">
        <div className="mb-2">
            <h1 className="font-headline text-3xl font-bold flex items-center gap-2">
                <ClipboardCheck className="h-8 w-8 text-primary" />
                Attendance
            </h1>
            <p className="text-muted-foreground">Manage attendance for your classes and view your own record.</p>
        </div>

        <Tabs defaultValue="student-attendance">
            <TabsList>
                <TabsTrigger value="student-attendance">Student Attendance</TabsTrigger>
                <TabsTrigger value="my-attendance">My Attendance History</TabsTrigger>
            </TabsList>

            <TabsContent value="student-attendance" className="mt-4">
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
                        onSelect={(d) => setSelectedDate(d || new Date())}
                        initialFocus
                        />
                    </PopoverContent>
                    </Popover>
                    <div className="flex space-x-2">
                        <Button onClick={markAll}>Mark All Present</Button>
                        <Button variant="secondary" onClick={clearAll}>Clear All</Button>
                    </div>
                </div>
                
                <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
                    {teacherClasses.length > 0 && (
                        <TabsList>
                        {teacherClasses.map((c) => (
                            <TabsTrigger key={c.id} value={c.id}>
                            {c.name}
                            </TabsTrigger>
                        ))}
                        </TabsList>
                    )}

                    {teacherClasses.length === 0 && !isLoading && (
                        <div className="text-center py-16 text-muted-foreground">
                            <p>You are not assigned to any classes.</p>
                        </div>
                    )}

                    {teacherClasses.map((c) => (
                        <TabsContent key={c.id} value={c.id} className="mt-4">
                            {isLoading ? (
                                <div className="flex h-64 items-center justify-center rounded-lg border">
                                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                                </div>
                            ) : (
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
                                        No students found in this class.
                                    </TableCell>
                                    </TableRow>
                                )}
                                </TableBody>
                            </Table>
                            </div>
                            )}
                        </TabsContent>
                    ))}
                </Tabs>

                {students.length > 0 && (
                    <div className="mt-4 flex justify-end">
                        <Button 
                        onClick={handleSaveAttendance} 
                        disabled={isSaving}
                        className="w-full sm:w-auto"
                        >
                        {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        {isSaving ? "Saving..." : "Submit Attendance"}
                        </Button>
                    </div>
                )}
            </TabsContent>

            <TabsContent value="my-attendance" className="mt-4">
               <MyAttendanceHistory />
            </TabsContent>
        </Tabs>
    </div>
  );
}
