

"use client";

import React, { useCallback, useEffect, useState } from "react";
import { firestore, storage } from "@/lib/firebase";
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
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
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
import { CheckCircle, Clock, XCircle, CalendarIcon, Loader2, Save, ClipboardCheck, User, Plane, PlusCircle, FileText, Upload, X, Percent, UserCheck, UserX } from "lucide-react";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { useAuth } from "@/context/auth-context";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { DateRange } from "react-day-picker";
import { Textarea } from "@/components/ui/textarea";
import { Command, CommandEmpty, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Combobox } from '@/components/ui/combobox';


type AttendanceStatus = "present" | "absent" | "late" | "unmarked";

export type Student = {
  id: string;
  name: string;
  rollNumber: string;
  avatarUrl: string;
  status: AttendanceStatus;
  notes?: string;
  admissionNumber?: string;
};

type TeacherClass = {
  id: string;
  name: string;
};

type LeaveApplication = {
    id: string;
    leaveType: string;
    startDate: Timestamp;
    endDate: Timestamp;
    reason: string;
    status: 'Pending' | 'Approved' | 'Rejected';
};

const getAttendanceBadge = (status: AttendanceStatus) => {
    switch (status) {
        case 'present': return <Badge variant="default" className="bg-green-600 hover:bg-green-700 w-full"><CheckCircle className="mr-2 h-4 w-4"/>Present</Badge>;
        case 'absent': return <Badge variant="destructive" className="w-full"><XCircle className="mr-2 h-4 w-4"/>Absent</Badge>;
        case 'late': return <Badge variant="secondary" className="w-full bg-yellow-500 hover:bg-yellow-600 text-white"><Clock className="mr-2 h-4 w-4"/>Late</Badge>;
        default: return <Badge variant="outline" className="w-full">Unmarked</Badge>;
    }
}

const getLeaveStatusBadge = (status: LeaveApplication['status']) => {
    switch(status) {
        case 'Pending': return <Badge variant="secondary" className="bg-yellow-500 hover:bg-yellow-600">Pending</Badge>;
        case 'Approved': return <Badge variant="default" className="bg-green-600 hover:bg-green-700">Approved</Badge>;
        case 'Rejected': return <Badge variant="destructive">Rejected</Badge>;
    }
};

function LeaveManagementTab({ schoolId, user, teacherName }: { schoolId: string, user: any, teacherName: string }) {
    const { toast } = useToast();
    const [leaveApplications, setLeaveApplications] = React.useState<LeaveApplication[]>([]);
    const [leaveType, setLeaveType] = React.useState('');
    const [dateRange, setDateRange] = React.useState<DateRange | undefined>();
    const [reason, setReason] = React.useState('');
    const [attachment, setAttachment] = React.useState<File | null>(null);
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    
    // Mock leave balances
    const leaveBalances = [
        { type: 'Annual Leave', allocated: 21, used: 5, remaining: 16 },
        { type: 'Sick Leave', allocated: 10, used: 2, remaining: 8 },
        { type: 'Compassionate Leave', allocated: 5, used: 0, remaining: 5 },
    ];

    React.useEffect(() => {
        if (!user) return;
        const q = query(collection(firestore, `schools/${schoolId}/leave-applications`), where('teacherId', '==', user.uid), orderBy('startDate', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setLeaveApplications(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as LeaveApplication)));
        });
        return () => unsubscribe();
    }, [schoolId, user]);

    const handleSubmitLeave = async () => {
        if (!leaveType || !dateRange?.from || !dateRange?.to || !reason || !user) {
            toast({ title: 'Missing Information', description: 'Please fill out all fields.', variant: 'destructive'});
            return;
        }
        setIsSubmitting(true);
        let attachmentUrl;

        try {
            if (attachment) {
                const storageRef = ref(storage, `schools/${schoolId}/leave_attachments/${Date.now()}_${attachment.name}`);
                await uploadBytes(storageRef, attachment);
                attachmentUrl = await getDownloadURL(storageRef);
            }

            await addDoc(collection(firestore, `schools/${schoolId}/leave-applications`), {
                teacherId: user.uid,
                teacherName: teacherName,
                leaveType,
                startDate: Timestamp.fromDate(dateRange.from),
                endDate: Timestamp.fromDate(dateRange.to),
                reason,
                status: 'Pending',
                submittedAt: serverTimestamp(),
                attachmentUrl: attachmentUrl || null,
            });
            toast({ title: 'Leave Application Submitted', description: 'Your request has been sent for approval.'});
            setLeaveType('');
            setDateRange(undefined);
            setReason('');
            setAttachment(null);
        } catch (e) {
            console.error(e);
            toast({ title: 'Submission Failed', variant: 'destructive'});
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 space-y-6">
                <Card>
                    <CardHeader><CardTitle>Leave Balances</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        {leaveBalances.map(balance => (
                             <div key={balance.type} className="text-sm">
                                <div className="font-semibold">{balance.type}</div>
                                <div className="flex justify-between text-muted-foreground">
                                    <span>Used: {balance.used}/{balance.allocated}</span>
                                    <span>Remaining: {balance.remaining}</span>
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                           <Plane className="h-5 w-5 text-primary"/>
                            Apply for Leave
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Leave Type</Label>
                            <Select value={leaveType} onValueChange={setLeaveType}>
                                <SelectTrigger><SelectValue placeholder="Select type..." /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Annual">Annual Leave</SelectItem>
                                    <SelectItem value="Sick">Sick Leave</SelectItem>
                                    <SelectItem value="Compassionate">Compassionate Leave</SelectItem>
                                    <SelectItem value="Unpaid">Unpaid Leave</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Date Range</Label>
                             <Popover>
                                <PopoverTrigger asChild>
                                <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !dateRange && "text-muted-foreground")}>
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {dateRange?.from ? ( dateRange.to ? `${format(dateRange.from, "LLL dd, y")} - ${format(dateRange.to, "LLL dd, y")}` : format(dateRange.from, "LLL dd, y")) : <span>Pick a date range</span>}
                                </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0"><Calendar initialFocus mode="range" defaultMonth={dateRange?.from} selected={dateRange} onSelect={setDateRange} numberOfMonths={2} /></PopoverContent>
                            </Popover>
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="leave-reason">Reason</Label>
                            <Textarea id="leave-reason" placeholder="Provide a brief reason for your leave..." value={reason} onChange={e => setReason(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label>Attach Document (Optional)</Label>
                            {attachment ? (
                                 <div className="w-full p-2 rounded-lg border bg-muted/50 flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-sm font-medium"><FileText className="h-4 w-4" /><span className="truncate">{attachment.name}</span></div>
                                    <Button variant="ghost" size="icon" onClick={() => setAttachment(null)} className="h-6 w-6"><X className="h-4 w-4 text-destructive" /></Button>
                                </div>
                            ) : (
                                <Label htmlFor="leave-attachment" className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted">
                                    <div className="text-center text-muted-foreground text-sm"><Upload className="w-6 h-6 mx-auto mb-1" />Click to upload</div>
                                    <Input id="leave-attachment" type="file" className="hidden" onChange={e => setAttachment(e.target.files?.[0] || null)} />
                                </Label>
                            )}
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button className="w-full" onClick={handleSubmitLeave} disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                            Submit Application
                        </Button>
                    </CardFooter>
                </Card>
            </div>
             <div className="lg:col-span-2">
                <Card>
                    <CardHeader><CardTitle>My Leave History</CardTitle></CardHeader>
                    <CardContent>
                         <div className="w-full overflow-auto rounded-lg border">
                            <Table>
                                <TableHeader><TableRow><TableHead>Type</TableHead><TableHead>Dates</TableHead><TableHead>Reason</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                                <TableBody>
                                    {leaveApplications.map(app => (
                                        <TableRow key={app.id}>
                                            <TableCell className="font-semibold">{app.leaveType}</TableCell>
                                            <TableCell>{format(app.startDate.toDate(), 'dd/MM/yy')} - {format(app.endDate.toDate(), 'dd/MM/yy')}</TableCell>
                                            <TableCell className="text-muted-foreground max-w-xs truncate">{app.reason}</TableCell>
                                            <TableCell>{getLeaveStatusBadge(app.status)}</TableCell>
                                        </TableRow>
                                    ))}
                                    {leaveApplications.length === 0 && <TableRow><TableCell colSpan={4} className="h-24 text-center">No leave applications found.</TableCell></TableRow>}
                                </TableBody>
                            </Table>
                         </div>
                    </CardContent>
                </Card>
             </div>
        </div>
    )
}

export default function AttendancePage() {
  const searchParams = useSearchParams();
  const schoolId = searchParams.get('schoolId');
  const { user } = useAuth();
  const { toast } = useToast();

  const [teacherClasses, setTeacherClasses] = useState<TeacherClass[]>([]);
  const [activeTab, setActiveTab] = useState<string>('student-attendance');
  const [activeClassId, setActiveClassId] = useState<string | undefined>();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [teacherName, setTeacherName] = useState('Teacher');
  
  // States for student analytics
  const [allTeacherStudents, setAllTeacherStudents] = useState<Student[]>([]);
  const [allStudentAttendance, setAllStudentAttendance] = useState<any[]>([]);
  const [selectedStudentForAnalytics, setSelectedStudentForAnalytics] = React.useState<Student | null>(null);
  const [studentSearchTerm, setStudentSearchTerm] = React.useState('');

  // Fetch teacher's details (name)
  useEffect(() => {
    if (!user || !schoolId) return;
    const teacherDocRef = doc(firestore, `schools/${schoolId}/users`, user.uid);
    const unsubscribe = onSnapshot(teacherDocRef, (docSnap) => {
      if (docSnap.exists()) {
        setTeacherName(docSnap.data().name || 'Teacher');
      }
    });
    return () => unsubscribe();
  }, [user, schoolId]);

  // Fetch classes assigned to the teacher first
  useEffect(() => {
    if (!user || !schoolId) {
        setTeacherClasses([]);
        setIsLoading(false);
        return;
    };
    setIsLoading(true);
    const q = query(
      collection(firestore, "schools", schoolId, "classes"),
      where("teacherId", "==", user.uid)
    );
    const unsub = onSnapshot(q, (snap) => {
      const classesData: TeacherClass[] = snap.docs.map(d => ({ id: d.id, name: `${d.data().name} ${d.data().stream || ''}`.trim() }));
      setTeacherClasses(classesData);
      if (!activeClassId && classesData.length > 0) {
        setActiveClassId(classesData[0].id);
      }
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching teacher classes:", error);
      setIsLoading(false);
    });
    return () => unsub();
  }, [user, schoolId, activeClassId]);
  
   // Fetch all students for all of the teacher's classes for analytics tab
  useEffect(() => {
    if (teacherClasses.length === 0 || !schoolId) return;
    
    const classIds = teacherClasses.map(c => c.id);
    if (classIds.length === 0) return;

    const studentsQuery = query(collection(firestore, `schools/${schoolId}/users`), where('role', '==', 'Student'), where('classId', 'in', classIds));
    const unsub = onSnapshot(studentsQuery, (snapshot) => {
        setAllTeacherStudents(snapshot.docs.map(doc => doc.data() as Student));
    });

    const allAttendanceQuery = query(collection(firestore, `schools/${schoolId}/attendance`), where('classId', 'in', classIds));
    const unsubAttendance = onSnapshot(allAttendanceQuery, (snapshot) => {
        setAllStudentAttendance(snapshot.docs.map(doc => doc.data()));
    });
    
    return () => {
        unsub();
        unsubAttendance();
    }
  }, [teacherClasses, schoolId]);


  // Main data fetching effect, dependent on activeClassId and selectedDate
  const fetchAttendanceData = useCallback(async () => {
    if (!schoolId || !activeClassId) {
        setStudents([]);
        return;
    }

    setIsLoading(true);

    try {
        const studentsQuery = query(
            collection(firestore, "schools", schoolId, "users"),
            where('role', '==', 'Student'),
            where("classId", "==", activeClassId),
            orderBy("name")
        );
        const studentsSnapshot = await getDocs(studentsQuery);
        const studentList: Student[] = studentsSnapshot.docs.map(d => {
            const data = d.data();
            return {
                id: d.id,
                name: data.name || "Unknown",
                rollNumber: data.admissionNumber || '',
                avatarUrl: data.avatarUrl || `https://picsum.photos/seed/${d.id}/100`,
                status: "unmarked",
                notes: "",
            } as Student;
        });

        const startOfDay = new Date(selectedDate);
        startOfDay.setHours(0, 0, 0, 0);
        const attendanceDate = Timestamp.fromDate(startOfDay);

        const attendanceQuery = query(
            collection(firestore, "schools", schoolId, "attendance"),
            where("classId", "==", activeClassId),
            where("date", "==", attendanceDate)
        );
        const attendanceSnapshot = await getDocs(attendanceQuery);
        const attendanceMap = new Map<string, { status: AttendanceStatus; notes?: string }>();
        attendanceSnapshot.forEach(doc => {
            const data = doc.data();
            attendanceMap.set(data.studentId, { status: data.status, notes: data.notes });
        });

        const mergedStudents = studentList.map(student => {
            const attendanceRecord = attendanceMap.get(student.id);
            return attendanceRecord ? { ...student, ...attendanceRecord } : student;
        });

        setStudents(mergedStudents);
    } catch (error) {
        console.error("Failed to fetch attendance data:", error);
        toast({ title: "Error", description: "Could not load student attendance.", variant: "destructive" });
    } finally {
        setIsLoading(false);
    }
  }, [schoolId, activeClassId, selectedDate, toast]);

  useEffect(() => {
    if (activeTab === 'student-attendance') {
        fetchAttendanceData();
    }
  }, [fetchAttendanceData, selectedDate, activeTab]);


  const handleAttendanceChange = (studentId: string, status: AttendanceStatus) => {
    setStudents(prev => prev.map(s => s.id === studentId ? { ...s, status } : s));
  };

  const handleNotesChange = (studentId: string, notes: string) => {
    setStudents(prev => prev.map(s => s.id === studentId ? { ...s, notes } : s));
  };

  const handleSaveAttendance = useCallback(async () => {
    if (!activeClassId || !schoolId || !user || students.length === 0 || !selectedDate) {
      toast({ title: 'Cannot Save', description: 'Missing required information.', variant: 'destructive'});
      return;
    }
    
    setIsSaving(true);
    const batch = writeBatch(firestore);
    const currentClass = teacherClasses.find((c) => c.id === activeClassId);
    
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
        studentAvatar: student.avatarUrl,
        classId: activeClassId,
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
  }, [schoolId, activeClassId, selectedDate, students, teacherClasses, teacherName, user, toast]);

  const markAll = () => handleBulkUpdate('present');
  const clearAll = () => handleBulkUpdate('unmarked');

  const handleBulkUpdate = (status: AttendanceStatus) => {
    setStudents(prev => prev.map(s => ({ ...s, status })));
  };

  const studentFilteredRecords = React.useMemo(() => {
    if (!selectedStudentForAnalytics) return [];
    return allStudentAttendance.filter(record => record.studentId === selectedStudentForAnalytics.id);
  }, [allStudentAttendance, selectedStudentForAnalytics]);

  const studentSummaryStats = React.useMemo(() => {
    const present = studentFilteredRecords.filter(r => r.status === 'present').length;
    const absent = studentFilteredRecords.filter(r => r.status === 'absent').length;
    const late = studentFilteredRecords.filter(r => r.status === 'late').length;
    const total = present + absent + late;
    return { present, absent, late, rate: total > 0 ? Math.round(((present + late) / total) * 100) : 100 };
  }, [studentFilteredRecords]);

  const displayedStudents = allTeacherStudents.filter(s =>
    s.name.toLowerCase().includes(studentSearchTerm.toLowerCase()) ||
    (s.admissionNumber && s.admissionNumber.includes(studentSearchTerm))
  );

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

        <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="student-attendance">Student Attendance</TabsTrigger>
                <TabsTrigger value="student-analytics">Student Analytics</TabsTrigger>
                <TabsTrigger value="leave-management">Leave Management</TabsTrigger>
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
                        selected={selectedDate}
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
                
                <Tabs value={activeClassId} onValueChange={setActiveClassId} className="mt-4">
                    {teacherClasses.length > 0 ? (
                        <TabsList>
                        {teacherClasses.map((c) => (
                            <TabsTrigger key={c.id} value={c.id}>
                            {c.name}
                            </TabsTrigger>
                        ))}
                        </TabsList>
                    ) : !isLoading && (
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
                                                <span className="text-sm text-muted-foreground">Adm: {student.rollNumber}</span>
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
            
             <TabsContent value="student-analytics" className="mt-4">
                 <Card>
                    <CardHeader>
                        <CardTitle>Detailed Student History</CardTitle>
                        <CardDescription>Search for a student to view their complete attendance history for the term.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Combobox
                            options={displayedStudents.map(s => ({ value: s.id, label: s.name }))}
                            value={selectedStudentForAnalytics?.id || ''}
                            onValueChange={(value) => setSelectedStudentForAnalytics(allTeacherStudents.find(s => s.id === value) || null)}
                            placeholder="Search student by name or admission number..."
                            emptyMessage="No students found."
                        />

                        {selectedStudentForAnalytics && (
                            <div className="mt-6">
                                <Card className="border-primary">
                                    <CardHeader>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <Avatar className="h-16 w-16">
                                                    <AvatarImage src={selectedStudentForAnalytics.avatarUrl} />
                                                    <AvatarFallback>{selectedStudentForAnalytics.name.charAt(0)}</AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <CardTitle className="text-2xl">{selectedStudentForAnalytics.name}</CardTitle>
                                                    <CardDescription>Admission No: {selectedStudentForAnalytics.admissionNumber}</CardDescription>
                                                </div>
                                            </div>
                                            <Button variant="outline" onClick={() => setSelectedStudentForAnalytics(null)}>Clear Selection</Button>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center my-4">
                                            <div className="p-4 bg-muted/50 rounded-lg">
                                                <p className="text-2xl font-bold">{studentSummaryStats.rate}%</p>
                                                <p className="text-xs text-muted-foreground">Overall Attendance</p>
                                            </div>
                                            <div className="p-4 bg-muted/50 rounded-lg">
                                                <p className="text-2xl font-bold">{studentSummaryStats.present}</p>
                                                <p className="text-xs text-muted-foreground">Days Present</p>
                                            </div>
                                            <div className="p-4 bg-muted/50 rounded-lg">
                                                <p className="text-2xl font-bold">{studentSummaryStats.absent}</p>
                                                <p className="text-xs text-muted-foreground">Days Absent</p>
                                            </div>
                                            <div className="p-4 bg-muted/50 rounded-lg">
                                                <p className="text-2xl font-bold">{studentSummaryStats.late}</p>
                                                <p className="text-xs text-muted-foreground">Days Late</p>
                                            </div>
                                        </div>
                                        <div className="w-full overflow-auto rounded-lg border">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow><TableHead>Date</TableHead><TableHead>Status</TableHead><TableHead>Recorded By</TableHead></TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                {studentFilteredRecords.map((record: any, index: number) => (
                                                    <TableRow key={index}>
                                                        <TableCell>{record.date.toDate().toLocaleDateString()}</TableCell>
                                                        <TableCell>{getAttendanceBadge(record.status)}</TableCell>
                                                        <TableCell>{record.teacher}</TableCell>
                                                    </TableRow>
                                                ))}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </TabsContent>

             <TabsContent value="leave-management" className="mt-4">
                <LeaveManagementTab schoolId={schoolId} user={user} teacherName={teacherName} />
            </TabsContent>
        </Tabs>
    </div>
  );
}
