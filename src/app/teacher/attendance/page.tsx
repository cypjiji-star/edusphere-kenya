

'use client';

import * as React from 'react';
import { addDays, format, eachDayOfInterval, isBefore, startOfToday, eachWeekOfInterval, startOfWeek, endOfWeek } from 'date-fns';
import { Calendar as CalendarIcon, ChevronDown, Check, History, Percent, FilePenLine, FileDown, Printer, Lock, Bell, UserCheck, UserX, Loader2 } from 'lucide-react';
import { DateRange } from 'react-day-picker';
import { firestore, auth } from '@/lib/firebase';
import { collection, query, where, onSnapshot, doc, getDocs, writeBatch, Timestamp } from 'firebase/firestore';
import { useSearchParams } from 'next/navigation';

import { cn } from '@/lib/utils';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Calendar } from '@/components/ui/calendar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';


type AttendanceStatus = 'present' | 'absent' | 'late' | 'unmarked';

type Student = {
    id: string;
    name: string;
    firstName: string;
    lastName: string;
    avatarUrl: string;
    status: AttendanceStatus;
    notes?: string;
};

type TeacherClass = {
  id: string;
  name: string;
}

export default function AttendancePage() {
  const searchParams = useSearchParams();
  const schoolId = searchParams.get('schoolId');
  const [teacherClasses, setTeacherClasses] = React.useState<TeacherClass[]>([]);
  const [selectedClass, setSelectedClass] = React.useState<string | undefined>();
  const [date, setDate] = React.useState<DateRange | undefined>({
    from: new Date(),
    to: undefined,
  });
  const [students, setStudents] = React.useState<Student[]>([]);
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = React.useState<AttendanceStatus | 'all'>('all');
  const [isLoading, setIsLoading] = React.useState(true);
  const [user, setUser] = React.useState(auth.currentUser);

  React.useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(setUser);
    return () => unsubscribe();
  }, []);
  
  const isRange = date?.from && date?.to;
  const selectedDate = date?.from && !date.to ? date.from : undefined;
  const isPastDate = selectedDate ? isBefore(selectedDate, startOfToday()) : false;
  const isEditable = !isRange && !isPastDate;

  const weeklyIntervals = React.useMemo(() => {
    if (!isRange || !date.from || !date.to) return [];
    return eachWeekOfInterval({ start: date.from, end: date.to }, { weekStartsOn: 1 });
  }, [date, isRange]);


  React.useEffect(() => {
    if (!schoolId || !user) return;
    const teacherId = user.uid;
    const q = query(collection(firestore, 'schools', schoolId, 'classes'), where('teacherId', '==', teacherId));
    const unsubscribe = onSnapshot(q, (snapshot) => {
        const classesData: TeacherClass[] = snapshot.docs.map(doc => ({ id: doc.id, name: `${doc.data().name} ${doc.data().stream || ''}`.trim() }));
        setTeacherClasses(classesData);
        if (!selectedClass && classesData.length > 0) {
            setSelectedClass(classesData[0].id);
        }
    });
    return () => unsubscribe();
  }, [schoolId, selectedClass, user]);

  React.useEffect(() => {
    if (!selectedClass || !date?.from || !schoolId || isRange) {
        if (isRange) setStudents([]);
        return;
    }
    
    setIsLoading(true);

    const studentsQuery = query(collection(firestore, 'schools', schoolId, 'students'), where('classId', '==', selectedClass));
    const unsubStudents = onSnapshot(studentsQuery, (studentsSnapshot) => {
        const classStudents = studentsSnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                name: `${data.firstName} ${data.lastName}`,
                firstName: data.firstName,
                lastName: data.lastName,
                avatarUrl: data.avatarUrl,
            } as Student
        });
        
        const targetDate = startOfToday();
        if (selectedDate) {
            targetDate.setFullYear(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
        }

        const attendanceQuery = query(
            collection(firestore, 'schools', schoolId, 'attendance'),
            where('classId', '==', selectedClass),
            where('date', '==', Timestamp.fromDate(targetDate))
        );

        const unsubAttendance = onSnapshot(attendanceQuery, (attendanceSnapshot) => {
            const attendanceMap = new Map();
            attendanceSnapshot.forEach(doc => {
                const data = doc.data();
                attendanceMap.set(data.studentId, { status: data.status, notes: data.notes });
            });

            const studentAttendance = classStudents.map(student => ({
                ...student,
                status: attendanceMap.get(student.id)?.status || 'unmarked',
                notes: attendanceMap.get(student.id)?.notes || '',
            }));
            setStudents(studentAttendance);
            setIsLoading(false);
        });
        
        return () => unsubAttendance();
    });

    return () => unsubStudents();
  }, [selectedClass, date, schoolId, isRange, selectedDate]);

  const handleSaveAttendance = React.useCallback(async () => {
    if (!isEditable || !selectedClass || !date?.from || !schoolId || !user) return;
  
    const batch = writeBatch(firestore);
    const today = new Date();
    today.setHours(0,0,0,0);
    const attendanceDate = Timestamp.fromDate(today);
  
    const currentClass = teacherClasses.find((c) => c.id === selectedClass);
  
    for (const student of students) {
      if (student.status === 'unmarked') continue;
  
      const docId = `${student.id}_${format(today, 'yyyy-MM-dd')}`;
      const attendanceRef = doc(firestore, 'schools', schoolId, 'attendance', docId);
  
      batch.set(attendanceRef, {
        studentId: student.id,
        studentName: student.name,
        studentAvatar: student.avatarUrl,
        class: currentClass?.name || 'Unknown',
        classId: selectedClass,
        schoolId: schoolId,
        date: attendanceDate,
        status: student.status,
        notes: student.notes || '',
        teacher: user.displayName || 'Unknown Teacher',
        teacherId: user.uid,
      });
    }
  
    try {
      await batch.commit();
      toast({
        title: "✓ Saved",
        description: `Attendance for ${
          teacherClasses.find((c) => c.id === selectedClass)?.name
        } on ${format(date.from, 'PPP')} has been saved.`,
      });
    } catch (e) {
      console.error("Error saving attendance: ", e);
      toast({
        title: "Save Failed",
        description: "Could not save attendance. Please try again.",
        variant: 'destructive',
      });
    }
  }, [isEditable, students, selectedClass, date, toast, teacherClasses, schoolId, user]);
  
  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    if (!isEditable) return;
    setStudents(currentStudents => 
      currentStudents.map(s => s.id === studentId ? { ...s, status } : s)
    );
  };

  const handleNotesChange = (studentId: string, notes: string) => {
     if (!isEditable) return;
    setStudents(currentStudents =>
      currentStudents.map(s => s.id === studentId ? { ...s, notes } : s)
    );
  };
  
  const markAll = (status: AttendanceStatus) => {
     if (!isEditable) return;
    setStudents(currentStudents => currentStudents.map(s => ({ ...s, status })));
    handleSaveAttendance();
  };

  const clearAll = () => {
    if (!isEditable) return;
    setStudents(currentStudents => currentStudents.map(s => ({...s, status: 'unmarked', notes: '' })));
  }

  const attendanceSummary = React.useMemo(() => {
    const totalStudents = students.length;
    if (totalStudents === 0) return { present: 0, presentCount: 0, absentCount: 0, lateCount: 0 };
    
    const presentCount = students.filter(s => s.status === 'present').length;
    const absentCount = students.filter(s => s.status === 'absent').length;
    const lateCount = students.filter(s => s.status === 'late').length;

    return {
      present: Math.round(((presentCount + lateCount) / totalStudents) * 100),
      presentCount,
      absentCount,
      lateCount
    };
  }, [students]);

  const filteredStudents = React.useMemo(() => {
    if (statusFilter === 'all') {
      return students;
    }
    return students.filter(s => s.status === statusFilter);
  }, [students, statusFilter]);
  
  if (!schoolId) {
    return <div className="p-8">Error: School ID is missing.</div>
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <Card>
        <CardHeader>
            <CardTitle className="font-headline text-2xl">Take Attendance</CardTitle>
            <CardDescription>
              Select a class and date range to view or update attendance records.
            </CardDescription>
            <div className="mt-4 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div className="flex flex-col gap-4 md:flex-row md:items-end">
                  <div className="grid w-full md:w-auto gap-1.5">
                      <Label htmlFor="class-selector">Class</Label>
                      <Select value={selectedClass} onValueChange={setSelectedClass}>
                          <SelectTrigger className="w-full md:w-[240px]" id="class-selector">
                              <SelectValue placeholder="Select a class" />
                          </SelectTrigger>
                          <SelectContent>
                              {teacherClasses.map((cls) => (
                                  <SelectItem key={cls.id} value={cls.id}>
                                  {cls.name}
                                  </SelectItem>
                              ))}
                          </SelectContent>
                      </Select>
                  </div>
                  <div className="grid w-full md:w-auto gap-1.5">
                      <Label htmlFor="date-picker">Date Range</Label>
                      <Popover>
                      <PopoverTrigger asChild>
                          <Button
                              id="date-picker"
                              variant={'outline'}
                              className={cn(
                                  'w-full justify-start text-left font-normal md:w-auto',
                                  !date && 'text-muted-foreground'
                              )}
                          >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {date?.from ? (
                            date.to ? (
                              <>
                                {format(date.from, 'LLL dd, y')} -{' '}
                                {format(date.to, 'LLL dd, y')}
                              </>
                            ) : (
                              format(date.from, 'PPP')
                            )
                          ) : (
                            <span>Pick a date</span>
                          )}
                          </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                          <Calendar
                            initialFocus
                            mode="range"
                            defaultMonth={date?.from}
                            selected={date}
                            onSelect={setDate}
                            numberOfMonths={2}
                          />
                      </PopoverContent>
                      </Popover>
                  </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="w-full sm:w-auto">
                        Bulk Actions
                        <ChevronDown className="ml-2 h-4 w-4"/>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => markAll('present')} disabled={!isEditable}>Mark All Present</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => markAll('absent')} disabled={!isEditable}>Mark All Absent</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => clearAll} disabled={!isEditable}>Clear All Selections</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="w-full sm:w-auto">
                      Export
                      <ChevronDown className="ml-2 h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem disabled>
                      <FileDown className="mr-2" />
                      Download as PDF
                    </DropdownMenuItem>
                    <DropdownMenuItem disabled>
                      <FileDown className="mr-2" />
                      Download as Excel/CSV
                    </DropdownMenuItem>
                    <DropdownMenuItem disabled>
                      <Printer className="mr-2" />
                      Print List
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
             {!isRange && (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 mt-4">
                    <button className="w-full text-left" onClick={() => setStatusFilter('all')}>
                        <Card className="hover:bg-muted/50 transition-colors h-full">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Overall Attendance</CardTitle>
                                <Percent className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{attendanceSummary.present}%</div>
                                <p className="text-xs text-muted-foreground">{attendanceSummary.presentCount + attendanceSummary.lateCount} of {students.length} students</p>
                            </CardContent>
                        </Card>
                    </button>
                    <button className="w-full text-left" onClick={() => setStatusFilter('absent')}>
                        <Card className="hover:bg-muted/50 transition-colors h-full">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Absences</CardTitle>
                                <UserX className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-destructive">{attendanceSummary.absentCount}</div>
                                <p className="text-xs text-muted-foreground">students marked absent</p>
                            </CardContent>
                        </Card>
                    </button>
                    <button className="w-full text-left" onClick={() => setStatusFilter('late')}>
                        <Card className="hover:bg-muted/50 transition-colors h-full">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Late Arrivals</CardTitle>
                                <UserCheck className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-yellow-600">{attendanceSummary.lateCount}</div>
                                <p className="text-xs text-muted-foreground">students marked late</p>
                            </CardContent>
                        </Card>
                    </button>
                     <button className="w-full text-left" onClick={() => setStatusFilter('present')}>
                        <Card className="hover:bg-muted/50 transition-colors h-full">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Present</CardTitle>
                                <UserCheck className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-green-600">{attendanceSummary.presentCount}</div>
                                <p className="text-xs text-muted-foreground">students present on time</p>
                            </CardContent>
                        </Card>
                    </button>
                </div>
            )}
        </CardHeader>
        <CardContent>
          {isRange && date?.from && date?.to ? (
             <div className="space-y-4">
                <h3 className="font-headline text-lg flex items-center gap-2"><History className="h-5 w-5 text-primary" /> Historical Records</h3>
                <Accordion type="single" collapsible className="w-full">
                {weeklyIntervals.map((weekStart, index) => {
                    const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
                    const weekLabel = `Week of ${format(weekStart, 'LLL dd')} - ${format(weekEnd, 'LLL dd, yyyy')}`;
                    const daysInWeek = eachDayOfInterval({ start: weekStart, end: weekEnd }).filter(d => d >= date.from! && d <= date.to!);

                    return (
                        <AccordionItem value={`item-${index}`} key={index}>
                            <AccordionTrigger>{weekLabel}</AccordionTrigger>
                            <AccordionContent>
                                <div className="w-full overflow-auto rounded-lg border">
                                    <Table>
                                        <TableHeader>
                                        <TableRow>
                                            <TableHead>Date</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead className="text-center">Attendance Rate</TableHead>
                                            <TableHead>Marked By</TableHead>
                                        </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                        {daysInWeek.map((d) => (
                                        <TableRow key={d.toString()}>
                                            <TableCell>
                                                <Button variant="link" className="p-0 h-auto" onClick={() => setDate({ from: d, to: undefined })}>
                                                {format(d, 'EEEE, PPP')}
                                                </Button>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2 text-sm text-green-600">
                                                    <Check className="h-4 w-4" />
                                                    <span>Record Saved</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center">98%</TableCell>
                                            <TableCell>Ms. Wanjiku</TableCell>
                                        </TableRow>
                                        ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    );
                })}
                </Accordion>
             </div>
          ) : (
            <>
            {isPastDate && (
              <Alert variant="default" className="mb-4 bg-yellow-50 border-yellow-200 text-yellow-800">
                <Lock className="h-4 w-4 text-yellow-700" />
                <AlertTitle>Records Locked</AlertTitle>
                <AlertDescription>
                  Attendance records for past dates are view-only. Editing is disabled as per administrative policy.
                </AlertDescription>
              </Alert>
            )}
            {isLoading ? (
                <div className="flex justify-center items-center h-64">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                </div>
            ) : (
            <div className="w-full overflow-auto rounded-lg border">
                <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead className="w-full md:w-[250px]">Student</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="hidden sm:table-cell">Notes</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {filteredStudents.map(student => (
                    <TableRow key={student.id} className="flex flex-col md:table-row">
                        <TableCell>
                        <div className="flex items-center gap-3">
                            <Avatar>
                            <AvatarImage src={student.avatarUrl} alt={student.name} />
                            <AvatarFallback>{student.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <span className="font-medium">{student.name}</span>
                        </div>
                        </TableCell>
                        <TableCell>
                            <div className="flex flex-row justify-around md:justify-center items-center gap-2 py-2">
                                <Button
                                    variant={student.status === 'present' ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => handleStatusChange(student.id, 'present')}
                                    disabled={!isEditable}
                                    className="flex-1 md:flex-none"
                                >
                                    Present
                                </Button>
                                <Button
                                    variant={student.status === 'absent' ? 'destructive' : 'outline'}
                                    size="sm"
                                    onClick={() => handleStatusChange(student.id, 'absent')}
                                    disabled={!isEditable}
                                    className="flex-1 md:flex-none"
                                >
                                    Absent
                                </Button>
                                <Button
                                    variant={student.status === 'late' ? 'secondary' : 'outline'}
                                    size="sm"
                                    onClick={() => handleStatusChange(student.id, 'late')}
                                    disabled={!isEditable}
                                    className="flex-1 md:flex-none"
                                >
                                    Late
                                </Button>
                            </div>
                        </TableCell>
                        <TableCell className="w-full md:w-[250px]">
                            {(student.status === 'absent' || student.status === 'late') && (
                                <Input
                                    type="text"
                                    placeholder="Add a note (e.g., Sick, family emergency)"
                                    value={student.notes}
                                    onChange={(e) => handleNotesChange(student.id, e.target.value)}
                                    onBlur={handleSaveAttendance}
                                    disabled={!isEditable}
                                    className="mt-2 md:mt-0"
                                />
                            )}
                        </TableCell>
                    </TableRow>
                    ))}
                </TableBody>
                </Table>
            </div>
            )}
            </>
          )}
        </CardContent>
        {isRange ? (
             <CardFooter>
                <Button disabled>View Detailed Report (Coming Soon)</Button>
            </CardFooter>
        ) : (
            <CardFooter className="flex-col items-start gap-4 border-t pt-6">
                <div className="flex w-full justify-end">
                    <Button onClick={handleSaveAttendance} disabled={!isEditable}>
                        <Check className="mr-2" />
                        Submit Today's Attendance
                    </Button>
                </div>
                <Separator />
                <div className="space-y-2">
                    <h4 className="font-semibold flex items-center gap-2">
                        <Bell className="h-5 w-5 text-primary" />
                        Automated Alerts & Notifications
                    </h4>
                    <p className="text-sm text-muted-foreground">Configure actions to be triggered automatically after attendance is submitted.</p>
                </div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-6">
                    <div className="flex items-center space-x-2 p-2 rounded-md border border-transparent hover:border-border hover:bg-muted/50">
                        <Switch id="notify-parents" />
                        <Label htmlFor="notify-parents">Notify parents of absent students</Label>
                    </div>
                     <div className="flex items-center space-x-2 p-2 rounded-md border border-transparent hover:border-border hover:bg-muted/50">
                        <Switch id="notify-admin" />
                        <Label htmlFor="notify-admin">Alert admin for low attendance</Label>
                    </div>
                </div>
            </CardFooter>
        )}
      </Card>
    </div>
  );
}
