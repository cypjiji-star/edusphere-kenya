
'use client';

import * as React from 'react';
import { format } from 'date-fns';
import { DateRange } from 'react-day-picker';
import { Bar, BarChart, CartesianGrid, XAxis, ResponsiveContainer } from 'recharts';
import { firestore } from '@/lib/firebase';
import { collection, query, onSnapshot, where, Timestamp, getDocs, doc, getDoc, orderBy, addDoc, serverTimestamp, limit } from 'firebase/firestore';
import { useSearchParams } from 'next/navigation';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

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
} from '@/components/ui/dropdown-menu';
import { Calendar } from '@/components/ui/calendar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import {
  ClipboardCheck,
  CalendarIcon,
  Search,
  Filter,
  FileDown,
  ChevronDown,
  Percent,
  UserCheck,
  UserX,
  TrendingUp,
  AlertTriangle,
  Send,
  Loader2,
  User as UserIcon,
  Mail,
  ArrowRight,
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';


// Define both lowercase and title case status types
type AttendanceStatus = 'Present' | 'Absent' | 'Late';
type AttendanceStatusLower = 'present' | 'absent' | 'late';

type AttendanceRecord = {
  id: string;
  studentId: string;
  studentName: string;
  studentAvatar: string;
  class: string;
  teacher: string;
  teacherId?: string;
  date: Timestamp;
  status: AttendanceStatus;
};

type Student = {
    id: string;
    name: string;
    admissionNumber: string;
    avatarUrl: string;
};

type CommunicationLog = {
    id: string;
    studentName: string;
    parentName: string;
    parentContact: string;
    reason: string;
    sentAt: Timestamp;
};


const statuses: (AttendanceStatus | 'All Statuses')[] = ['All Statuses', 'Present', 'Absent', 'Late'];

// Function to convert lowercase status to title case
const normalizeStatus = (status: string): AttendanceStatus => {
  switch (status.toLowerCase()) {
    case 'present': return 'Present';
    case 'absent': return 'Absent';
    case 'late': return 'Late';
    default: return 'Present'; // Default fallback
  }
};

const getStatusBadge = (status: AttendanceStatus) => {
    switch (status) {
        case 'Present': return <Badge variant="default" className="bg-primary hover:bg-primary/90">Present</Badge>;
        case 'Absent': return <Badge variant="destructive">Absent</Badge>;
        case 'Late': return <Badge variant="secondary" className="bg-yellow-500 text-white hover:bg-yellow-600">Late</Badge>;
        default: return <Badge variant="outline">Unknown</Badge>;
    }
}

const chartConfig = {
    rate: { label: 'Attendance Rate', color: 'hsl(var(--primary))' },
} satisfies React.ComponentProps<typeof ChartContainer>['config'];

function LowAttendanceAlerts({ records, dateRange, schoolId }: { records: AttendanceRecord[], dateRange?: DateRange, schoolId: string }) {
    const { toast } = useToast();

    const lowAttendanceAlerts = React.useMemo(() => {
        if (!records.length || !dateRange?.from) return [];

        const recordsInPeriod = records.filter(record => {
            const recordDate = record.date.toDate();
            // Refined date filtering logic
            if (dateRange?.from && !dateRange.to) { // Single day selected
                return recordDate.toDateString() === dateRange.from.toDateString();
            }
            if(dateRange?.from && dateRange?.to) {
                return recordDate >= dateRange.from && recordDate <= dateRange.to;
            }
            return false;
        });

        const classData: Record<string, { present: number, total: number, teacher: string, teacherId?: string }> = {};

        recordsInPeriod.forEach(record => {
            if (!classData[record.class]) {
                classData[record.class] = { present: 0, total: 0, teacher: record.teacher, teacherId: record.teacherId };
            }
            classData[record.class].total++;
            if (record.status === 'Present' || record.status === 'Late') {
                classData[record.class].present++;
            }
        });

        return Object.entries(classData)
            .map(([className, data]) => ({
                class: className,
                teacher: data.teacher,
                teacherId: data.teacherId,
                rate: data.total > 0 ? Math.round((data.present / data.total) * 100) : 0,
            }))
            .filter(item => item.rate < 70);

    }, [records, dateRange]);


    const handleSendReminder = async (teacherName: string, teacherIdFromRecord?: string) => {
        let teacherId = teacherIdFromRecord;

        // If teacherId is not available directly, try to find it
        if (!teacherId) {
            try {
                const teachersQuery = query(collection(firestore, `schools/${schoolId}/teachers`), where('name', '==', teacherName), limit(1));
                const teacherSnap = await getDocs(teachersQuery);
                if (!teacherSnap.empty) {
                    teacherId = teacherSnap.docs[0].id;
                }
            } catch (error) {
                 console.error("Could not fetch teacher ID by name:", error);
            }
        }
        
        if (!teacherId) {
             toast({
                title: 'Cannot Send Reminder',
                description: `Could not find a user ID for ${teacherName}.`,
                variant: 'destructive',
            });
            return;
        }

        await addDoc(collection(firestore, 'schools', schoolId, 'notifications'), {
            title: 'Low Attendance Alert',
            description: `A reminder has been sent to you regarding low attendance in one of your classes.`,
            category: 'Academics',
            createdAt: serverTimestamp(),
            read: false,
            href: `/teacher/attendance?schoolId=${schoolId}`,
            userId: teacherId, // Target the specific teacher
        });

        toast({
            title: 'Reminder Sent',
            description: `A reminder notification has been sent to ${teacherName}.`,
        });
    }

    if (!dateRange?.from) {
         return (
             <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <UserCheck className="h-6 w-6 text-primary"/>
                        Attendance Alerts
                    </CardTitle>
                    <CardDescription>Select a date range to view attendance alerts for classes.</CardDescription>
                </CardHeader>
            </Card>
        )
    }

    if (lowAttendanceAlerts.length === 0) {
        return (
             <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <UserCheck className="h-6 w-6 text-primary"/>
                        No Attendance Alerts
                    </CardTitle>
                    <CardDescription>Attendance is above 70% for all classes in the selected period.</CardDescription>
                </CardHeader>
            </Card>
        )
    }

    return (
        <Card className="border-red-500/50">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-600">
                    <AlertTriangle className="h-6 w-6"/>
                    Low Attendance Alerts
                </CardTitle>
                 <CardDescription>Classes with attendance below 70% in the selected period.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {lowAttendanceAlerts.map(alert => (
                    <div key={alert.class} className="flex items-center justify-between p-3 rounded-lg bg-red-500/10">
                        <div>
                            <p className="font-bold">{alert.class} <span className="text-red-600">({alert.rate}%)</span></p>
                            <p className="text-sm text-muted-foreground">{alert.teacher}</p>
                        </div>
                         <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="secondary" size="sm" onClick={() => handleSendReminder(alert.teacher, alert.teacherId)}>
                                        <Send className="mr-2 h-4 w-4"/>
                                        Send Reminder
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Send a reminder to the class teacher.</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>
                ))}
            </CardContent>
        </Card>
    )
}

const getCurrentTerm = (): string => {
  const today = new Date();
  const month = today.getMonth(); // 0-11
  const year = today.getFullYear();

  if (month >= 0 && month <= 3) { // Jan - Apr
    return `term1-${year}`;
  } else if (month >= 4 && month <= 7) { // May - Aug
    return `term2-${year}`;
  } else { // Sep - Dec
    return `term3-${year}`;
  }
};

const generateAcademicTerms = () => {
    const currentYear = new Date().getFullYear();
    const terms = [];
    for (let year = currentYear - 1; year <= currentYear + 1; year++) {
        terms.push({ value: `term1-${year}`, label: `Term 1, ${year}` });
        terms.push({ value: `term2-${year}`, label: `Term 2, ${year}` });
        terms.push({ value: `term3-${year}`, label: `Term 3, ${year}` });
    }
    return terms;
};


export default function AdminAttendancePage() {
  const searchParams = useSearchParams();
  const schoolId = searchParams.get('schoolId')!;
  const [date, setDate] = React.useState<DateRange | undefined>({
    from: new Date(),
    to: new Date(),
  });
  const [searchTerm, setSearchTerm] = React.useState('');
  const [classFilter, setClassFilter] = React.useState('All Classes');
  const [teacherFilter, setTeacherFilter] = React.useState('All Teachers');
  const [statusFilter, setStatusFilter] = React.useState<AttendanceStatus | 'All Statuses'>('All Statuses');
  const [selectedTerm, setSelectedTerm] = React.useState(getCurrentTerm());
  const { toast } = useToast();
  const [allRecords, setAllRecords] = React.useState<AttendanceRecord[]>([]);
  const [communicationLogs, setCommunicationLogs] = React.useState<CommunicationLog[]>([]);
  const [teachers, setTeachers] = React.useState<string[]>(['All Teachers']);
  const [classes, setClasses] = React.useState<string[]>(['All Classes']);
  const [isLoading, setIsLoading] = React.useState(true);
  const [academicTerms, setAcademicTerms] = React.useState(generateAcademicTerms());

  // New state for student analytics
  const [allStudents, setAllStudents] = React.useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = React.useState<Student | null>(null);
  const [studentSearchTerm, setStudentSearchTerm] = React.useState('');

  // Fetch all attendance records from the correct database structure
  React.useEffect(() => {
    if (!schoolId) {
      setIsLoading(false);
      return;
    }

    const getTermDates = (term: string) => {
        const [termName, yearStr] = term.split('-');
        const year = parseInt(yearStr, 10);
        switch(termName) {
            case 'term1': return { start: new Date(year, 0, 1), end: new Date(year, 3, 30) };
            case 'term2': return { start: new Date(year, 4, 1), end: new Date(year, 7, 31) };
            case 'term3': return { start: new Date(year, 8, 1), end: new Date(year, 11, 31) };
            default: return null;
        }
    };
    
    const termRange = getTermDates(selectedTerm);
    if (!termRange) {
        setIsLoading(false);
        return;
    }
    
    setIsLoading(true);
    const attendanceQuery = query(
      collection(firestore, `schools/${schoolId}/attendance`),
      where('date', '>=', termRange.start),
      where('date', '<=', termRange.end),
      orderBy('date', 'desc')
    );
    
    const unsubscribe = onSnapshot(attendanceQuery, async (snapshot) => {
      const records: AttendanceRecord[] = [];
      for (const doc of snapshot.docs) {
        const data = doc.data();
        records.push({
          id: doc.id,
          studentId: data.studentId,
          studentName: data.studentName,
          studentAvatar: data.avatarUrl || `https://picsum.photos/seed/${data.studentId}/100`,
          class: data.className,
          teacher: data.teacher,
          teacherId: data.teacherId,
          date: data.date,
          status: normalizeStatus(data.status || 'present'),
        });
      }
      setAllRecords(records);
      setIsLoading(false);
    }, (error) => {
        console.error('Error fetching attendance records:', error);
        toast({ title: 'Error', description: 'Failed to load attendance records', variant: 'destructive'});
        setIsLoading(false);
    });

    // Set up real-time listeners for teachers and classes
    const qTeachers = query(collection(firestore, 'schools', schoolId, 'teachers'));
    const unsubTeachers = onSnapshot(qTeachers, (snapshot) => {
      const teacherNames = snapshot.docs.map(doc => doc.data().name);
      setTeachers(['All Teachers', ...teacherNames]);
    });
    
    const qClasses = query(collection(firestore, 'schools', schoolId, 'classes'));
    const unsubClasses = onSnapshot(qClasses, (snapshot) => {
      const classNames = snapshot.docs.map(doc => {
        const data = doc.data();
        return `${data.name} ${data.stream || ''}`.trim();
      });
      setClasses(['All Classes', ...new Set(classNames)]);
    });

    const qStudents = query(collection(firestore, 'schools', schoolId, 'students'));
    const unsubStudents = onSnapshot(qStudents, (snapshot) => {
        setAllStudents(snapshot.docs.map(doc => ({
            id: doc.id,
            name: doc.data().name,
            admissionNumber: doc.data().admissionNumber,
            avatarUrl: doc.data().avatarUrl,
        })));
    });

    const qCommLogs = query(collection(firestore, 'schools', schoolId, 'communication_logs'), where('type', '==', 'attendance'));
    const unsubCommLogs = onSnapshot(qCommLogs, (snapshot) => {
      setCommunicationLogs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CommunicationLog)));
    });

    return () => {
      unsubscribe();
      unsubTeachers();
      unsubClasses();
      unsubStudents();
      unsubCommLogs();
    };
  }, [schoolId, toast, selectedTerm]);
  
  const dailyTrendData = React.useMemo(() => {
    if (!allRecords.length) return [];

    const dailyData: Record<string, { present: number, total: number }> = {};

    allRecords.forEach(record => {
      const day = format(record.date.toDate(), 'MMM d');
      if (!dailyData[day]) {
        dailyData[day] = { present: 0, total: 0 };
      }
      dailyData[day].total++;
      if (record.status === 'Present' || record.status === 'Late') {
        dailyData[day].present++;
      }
    });

    return Object.entries(dailyData)
      .map(([date, data]) => ({
        date,
        rate: data.total > 0 ? Math.round((data.present / data.total) * 100) : 0,
      }))
      .sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-30); // Show last 30 days of the term
      
  }, [allRecords]);
  
  const handleCompare = () => {
    toast({
        title: 'Compare Feature',
        description: 'Term comparison feature is coming soon.',
    });
  }

  const filteredRecords = React.useMemo(() => allRecords.filter(record => {
    const recordDate = record.date.toDate();
    let isDateInRange = true;

    if (date?.from) {
        const fromDate = new Date(date.from);
        fromDate.setHours(0, 0, 0, 0);

        if (date.to) {
            const toDate = new Date(date.to);
            toDate.setHours(23, 59, 59, 999);
            isDateInRange = recordDate >= fromDate && recordDate <= toDate;
        } else {
            // If only 'from' is set, filter for that single day
            const endOfDay = new Date(date.from);
            endOfDay.setHours(23, 59, 59, 999);
            isDateInRange = recordDate >= fromDate && recordDate <= endOfDay;
        }
    }

    const matchesSearch = record.studentName && record.studentName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesClass = classFilter === 'All Classes' || record.class === classFilter;
    const matchesTeacher = teacherFilter === 'All Teachers' || record.teacher === teacherFilter;
    const matchesStatus = statusFilter === 'All Statuses' || record.status === statusFilter;

    return isDateInRange && matchesSearch && matchesClass && matchesTeacher && matchesStatus;
  }), [allRecords, date, searchTerm, classFilter, teacherFilter, statusFilter]);
  
  const handleExport = (type: 'PDF' | 'CSV') => {
    const doc = new jsPDF();
    const tableData = filteredRecords.map(record => [
        record.studentName,
        record.class,
        record.teacher,
        record.date.toDate().toLocaleDateString(),
        record.status,
    ]);
    const tableHeaders = ["Student", "Class", "Teacher", "Date", "Status"];

    if (type === 'CSV') {
        const csvContent = [
            tableHeaders.join(","),
            ...tableData.map(e => e.join(","))
        ].join("\n");
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute("download", "attendance_report.csv");
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    } else {
        doc.text("Attendance Report", 14, 16);
        (doc as any).autoTable({
            startY: 22,
            head: [tableHeaders],
            body: tableData,
        });
        doc.save("attendance_report.pdf");
    }
    toast({
      title: 'Exporting Records',
      description: `Your attendance records are being exported as a ${type} file.`,
    });
  };

  const summaryStats = {
      present: filteredRecords.filter(r => r.status === 'Present').length,
      absent: filteredRecords.filter(r => r.status === 'Absent').length,
      late: filteredRecords.filter(r => r.status === 'Late').length,
  }
  const totalRecords = filteredRecords.length;
  const attendanceRate = totalRecords > 0 ? Math.round(((summaryStats.present + summaryStats.late) / totalRecords) * 100) : 0;
  
  const studentFilteredRecords = React.useMemo(() => {
    if (!selectedStudent) return [];
    return allRecords.filter(record => record.studentId === selectedStudent.id);
  }, [allRecords, selectedStudent]);

  const studentSummaryStats = React.useMemo(() => {
    return {
        present: studentFilteredRecords.filter(r => r.status === 'Present').length,
        absent: studentFilteredRecords.filter(r => r.status === 'Absent').length,
        late: studentFilteredRecords.filter(r => r.status === 'Late').length,
    }
  }, [studentFilteredRecords]);

  const studentTotalRecords = studentFilteredRecords.length;
  const studentAttendanceRate = studentTotalRecords > 0 ? Math.round(((studentSummaryStats.present + studentSummaryStats.late) / studentTotalRecords) * 100) : 0;
  
  const displayedStudents = allStudents.filter(s =>
        s.name.toLowerCase().includes(studentSearchTerm.toLowerCase()) ||
        s.admissionNumber?.includes(studentSearchTerm)
    );

  if (!schoolId) {
    return <div className="p-8">Error: School ID is missing from URL.</div>
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="mb-2">
        <h1 className="font-headline text-3xl font-bold flex items-center gap-2">
          <ClipboardCheck className="h-8 w-8 text-primary" />
          Attendance Records
        </h1>
        <p className="text-muted-foreground">View and export attendance data for the entire school.</p>
      </div>
      
       <Tabs defaultValue="overview">
        <TabsList className="mb-4 flex-wrap h-auto justify-start sm:justify-center">
            <TabsTrigger value="overview">School-wide Overview</TabsTrigger>
            <TabsTrigger value="student">Student Analytics</TabsTrigger>
            <TabsTrigger value="comms">Communication Log</TabsTrigger>
        </TabsList>
        <TabsContent value="overview">
            {isLoading ? <div className="flex h-64 items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div> : (
            <>
                <div className="grid gap-6 lg:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Attendance Summary</CardTitle>
                            <CardDescription>
                                Summary for the selected period: {date?.from && format(date.from, 'LLL dd, y')}
                                {date?.to && date.from?.getTime() !== date.to?.getTime() ? ` - ${format(date.to, 'LLL dd, y')}` : ''}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                           <div className="grid gap-6 sm:grid-cols-3">
                                <Card className="flex flex-col">
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium">Overall Attendance Rate</CardTitle>
                                        <Percent className="h-4 w-4 text-muted-foreground" />
                                    </CardHeader>
                                    <CardContent className="flex-1">
                                        <div className="text-2xl font-bold">{attendanceRate}%</div>
                                        <p className="text-xs text-muted-foreground">{summaryStats.present + summaryStats.late} of {totalRecords} students</p>
                                    </CardContent>
                                    <CardFooter>
                                        <Button size="sm" className="w-full" onClick={() => setStatusFilter('All Statuses')}>
                                            View All
                                            <ArrowRight className="ml-2 h-4 w-4"/>
                                        </Button>
                                    </CardFooter>
                                </Card>
                                <Card className="flex flex-col">
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium">Total Absences</CardTitle>
                                        <UserX className="h-4 w-4 text-muted-foreground" />
                                    </CardHeader>
                                    <CardContent className="flex-1">
                                        <div className="text-2xl font-bold">{summaryStats.absent}</div>
                                        <p className="text-xs text-muted-foreground">students marked absent</p>
                                    </CardContent>
                                    <CardFooter>
                                         <Button variant="destructive" size="sm" className="w-full" onClick={() => setStatusFilter('Absent')}>
                                            View Absences
                                            <ArrowRight className="ml-2 h-4 w-4"/>
                                        </Button>
                                    </CardFooter>
                                </Card>
                                <Card className="flex flex-col">
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium">Total Late Arrivals</CardTitle>
                                        <UserCheck className="h-4 w-4 text-muted-foreground" />
                                    </CardHeader>
                                    <CardContent className="flex-1">
                                        <div className="text-2xl font-bold">{summaryStats.late}</div>
                                        <p className="text-xs text-muted-foreground">students marked late</p>
                                    </CardContent>
                                    <CardFooter>
                                        <Button variant="secondary" size="sm" className="w-full" onClick={() => setStatusFilter('Late')}>
                                            View Late Arrivals
                                            <ArrowRight className="ml-2 h-4 w-4"/>
                                        </Button>
                                    </CardFooter>
                                </Card>
                            </div>
                        </CardContent>
                    </Card>
                    <LowAttendanceAlerts records={allRecords} dateRange={date} schoolId={schoolId} />
                </div>

                <Card className="mt-6">
                    <CardHeader>
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            <div className="flex items-center gap-2">
                                <TrendingUp className="h-6 w-6 text-primary" />
                                <div>
                                    <CardTitle>Attendance Trends</CardTitle>
                                    <CardDescription>Daily attendance rate for the selected term.</CardDescription>
                                </div>
                            </div>
                            <div className="flex w-full md:w-auto items-center gap-2">
                                <Select value={selectedTerm} onValueChange={(v) => setSelectedTerm(v)}>
                                    <SelectTrigger className="w-full md:w-auto">
                                        <SelectValue placeholder="Select term" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {academicTerms.map(term => (
                                            <SelectItem key={term.value} value={term.value}>{term.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button variant="outline" onClick={handleCompare}>Compare</Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>Term comparison feature is coming soon.</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <ChartContainer config={chartConfig} className="h-[250px] w-full">
                            <BarChart data={dailyTrendData}>
                                <CartesianGrid vertical={false} />
                                <XAxis
                                dataKey="date"
                                tickLine={false}
                                tickMargin={10}
                                axisLine={false}
                                />
                                <ChartTooltip
                                cursor={false}
                                content={<ChartTooltipContent indicator="dot" />}
                                />
                                <Bar dataKey="rate" fill="var(--color-rate)" radius={8} />
                            </BarChart>
                        </ChartContainer>
                    </CardContent>
                </Card>

                <Card className="mt-6">
                    <CardHeader>
                    <div className="flex flex-col gap-4">
                        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                            <div className="relative w-full md:max-w-sm">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    type="search"
                                    placeholder="Search by student name..."
                                    className="w-full bg-background pl-8"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <div className="flex w-full flex-col gap-2 md:w-auto md:flex-row md:items-center">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                    <Button variant="outline" className="w-full md:w-auto">
                                        <Filter className="mr-2 h-4 w-4" />
                                        Filters
                                        <ChevronDown className="ml-2 h-4 w-4" />
                                    </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="p-4 space-y-4 w-64">
                                        <div>
                                            <label className="text-sm font-medium">Class</label>
                                            <Select value={classFilter} onValueChange={setClassFilter}>
                                                <SelectTrigger><SelectValue/></SelectTrigger>
                                                <SelectContent>
                                                    {classes.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium">Teacher</label>
                                            <Select value={teacherFilter} onValueChange={setTeacherFilter}>
                                                <SelectTrigger><SelectValue/></SelectTrigger>
                                                <SelectContent>
                                                    {teachers.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium">Status</label>
                                            <Select value={statusFilter} onValueChange={(v: AttendanceStatus | 'All Statuses') => setStatusFilter(v)}>
                                                <SelectTrigger><SelectValue/></SelectTrigger>
                                                <SelectContent>
                                                    {statuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </DropdownMenuContent>
                                </DropdownMenu>

                                <Popover>
                                    <PopoverTrigger asChild>
                                    <Button
                                        id="date"
                                        variant="outline"
                                        className={cn('w-full justify-start text-left font-normal md:w-[300px]', !date && 'text-muted-foreground')}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {date?.from ? (
                                        date.to ? `${format(date.from, 'LLL dd, y')} - ${format(date.to, 'LLL dd, y')}` : format(date.from, 'LLL dd, y')
                                        ) : <span>Pick a date range</span>}
                                    </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="end">
                                    <Calendar initialFocus mode="range" defaultMonth={date?.from} selected={date} onSelect={setDate} numberOfMonths={2} />
                                    </PopoverContent>
                                </Popover>

                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="secondary" className="w-full md:w-auto">
                                            Export
                                            <ChevronDown className="ml-2 h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => handleExport('PDF')}><FileDown className="mr-2" />Export as PDF</DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleExport('CSV')}><FileDown className="mr-2" />Export as CSV</DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            {classFilter !== 'All Classes' && <Badge variant="secondary" className="cursor-pointer" onClick={() => setClassFilter('All Classes')}>Class: {classFilter} &times;</Badge>}
                            {teacherFilter !== 'All Teachers' && <Badge variant="secondary" className="cursor-pointer" onClick={() => setTeacherFilter('All Teachers')}>Teacher: {teacherFilter} &times;</Badge>}
                            {statusFilter !== 'All Statuses' && <Badge variant="secondary" className="cursor-pointer" onClick={() => setStatusFilter('All Statuses')}>Status: {statusFilter} &times;</Badge>}
                        </div>
                    </div>
                    </CardHeader>
                    <CardContent>
                    <div className="w-full overflow-auto rounded-lg border">
                        <Table>
                        <TableHeader>
                            <TableRow>
                            <TableHead>Student</TableHead>
                            <TableHead>Class</TableHead>
                            <TableHead>Teacher</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredRecords.length > 0 ? (
                            filteredRecords.map((record) => (
                                <TableRow key={record.id}>
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                    <Avatar>
                                        <AvatarImage src={record.studentAvatar} alt={record.studentName} />
                                        <AvatarFallback>{record.studentName.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <span className="font-medium">{record.studentName}</span>
                                    </div>
                                </TableCell>
                                <TableCell>{record.class}</TableCell>
                                <TableCell>{record.teacher}</TableCell>
                                <TableCell>{record.date.toDate().toLocaleDateString()}</TableCell>
                                <TableCell>{getStatusBadge(record.status)}</TableCell>
                                </TableRow>
                            ))
                            ) : (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">
                                No records found for the selected filters.
                                </TableCell>
                            </TableRow>
                            )}
                        </TableBody>
                        </Table>
                    </div>
                    </CardContent>
                    <CardFooter>
                        <div className="text-xs text-muted-foreground">
                            Showing <strong>{filteredRecords.length}</strong> of <strong>{allRecords.length}</strong> records.
                        </div>
                    </CardFooter>
                </Card>
            </>
            )}
        </TabsContent>
         <TabsContent value="student">
           <Card>
                <CardHeader>
                    <CardTitle>Detailed Student History</CardTitle>
                    <CardDescription>Search for a student by name or admission number to view their complete attendance history.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Command className="rounded-lg border shadow-md">
                        <CommandInput
                            placeholder="Search student by name or admission number..."
                            value={studentSearchTerm}
                            onValueChange={setStudentSearchTerm}
                        />
                        <CommandList>
                            <CommandEmpty>{studentSearchTerm ? "No students found." : "Start typing to search..."}</CommandEmpty>
                            {displayedStudents.map(student => (
                                <CommandItem key={student.id} onSelect={() => { setSelectedStudent(student); setStudentSearchTerm(''); }}>
                                    <UserIcon className="mr-2" />
                                    <span>{student.name}</span>
                                </CommandItem>
                            ))}
                        </CommandList>
                    </Command>

                    {selectedStudent && (
                        <div className="mt-6">
                            <Card className="border-primary">
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <Avatar className="h-16 w-16">
                                                <AvatarImage src={selectedStudent.avatarUrl} />
                                                <AvatarFallback>{selectedStudent.name.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <CardTitle className="text-2xl">{selectedStudent.name}</CardTitle>
                                                <CardDescription>Admission No: {selectedStudent.admissionNumber}</CardDescription>
                                            </div>
                                        </div>
                                        <Button variant="outline" onClick={() => setSelectedStudent(null)}>Clear Selection</Button>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center my-4">
                                        <div className="p-4 bg-muted/50 rounded-lg">
                                            <p className="text-2xl font-bold">{studentAttendanceRate}%</p>
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
                                            {studentFilteredRecords.map(record => (
                                                <TableRow key={record.id}>
                                                    <TableCell>{record.date.toDate().toLocaleDateString()}</TableCell>
                                                    <TableCell>{getStatusBadge(record.status)}</TableCell>
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
         <TabsContent value="comms">
             <Card>
                <CardHeader>
                    <CardTitle>Parent Communication Log</CardTitle>
                    <CardDescription>A log of all attendance-related notifications sent to parents.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="w-full overflow-auto rounded-lg border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date Sent</TableHead>
                                    <TableHead>Student</TableHead>
                                    <TableHead>Parent</TableHead>
                                    <TableHead>Reason</TableHead>
                                    <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                             <TableBody>
                                {communicationLogs.length > 0 ? communicationLogs.map(log => (
                                    <TableRow key={log.id}>
                                        <TableCell>{log.sentAt.toDate().toLocaleString()}</TableCell>
                                        <TableCell>{log.studentName}</TableCell>
                                        <TableCell>{log.parentName} ({log.parentContact})</TableCell>
                                        <TableCell><Badge variant="secondary">{log.reason}</Badge></TableCell>
                                        <TableCell><Badge className="bg-primary hover:bg-primary/90">Sent</Badge></TableCell>
                                    </TableRow>
                                )) : (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-24 text-center">
                                        No communication logs found.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
             </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

