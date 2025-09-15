
'use client';

import * as React from 'react';
import { format } from 'date-fns';
import { DateRange } from 'react-day-picker';
import { Bar, BarChart, CartesianGrid, XAxis, ResponsiveContainer } from 'recharts';
import { firestore } from '@/lib/firebase';
import { collectionGroup, query, onSnapshot, getDocs, collection } from 'firebase/firestore';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    CardFooter,
  } from '@/components/ui/card';
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
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { CalendarIcon, ClipboardCheck, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSearchParams } from 'next/navigation';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
  } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

type AttendanceStatus = 'present' | 'absent' | 'late';

const getStatusBadge = (status: AttendanceStatus) => {
    switch (status) {
        case 'present': return <Badge variant="default" className="bg-green-600 hover:bg-green-700">Present</Badge>;
        case 'absent': return <Badge variant="destructive">Absent</Badge>;
        case 'late': return <Badge variant="secondary" className="bg-yellow-500 text-white hover:bg-yellow-600">Late</Badge>;
    }
}

export default function AdminAttendancePage() {
  const searchParams = useSearchParams();
  const schoolId = searchParams.get('schoolId');
  const [allRecords, setAllRecords] = React.useState<any[]>([]);
  const [teachers, setTeachers] = React.useState<string[]>([]);
  const [classes, setClasses] = React.useState<string[]>([]);
  const [selectedTeacher, setSelectedTeacher] = React.useState('All Teachers');
  const [selectedClass, setSelectedClass] = React.useState('All Classes');
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>({ from: new Date(new Date().setDate(1)), to: new Date()});
  const [isLoading, setIsLoading] = React.useState(true);
  

  React.useEffect(() => {
    if (!schoolId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    
    // 1. Fetch all attendance records using a collectionGroup query on 'records'
    const recordsQuery = query(collectionGroup(firestore, 'records'));
    const unsubscribeRecords = onSnapshot(recordsQuery, async (recordsSnap) => {
        const records: any[] = [];
        const studentPromises = new Map<string, Promise<any>>();
        const allStudentData = new Map<string, any>();
        
        // Fetch all students in parallel to avoid multiple reads for the same student
        const studentsQuery = query(collection(firestore, `schools/${schoolId}/students`));
        const studentsSnapshot = await getDocs(studentsQuery);
        studentsSnapshot.forEach(doc => {
            allStudentData.set(doc.id, doc.data());
        });

        recordsSnap.forEach((doc) => {
            const data = doc.data();
            // This is a client-side filter since collectionGroup queries across all schools.
            // For production, you'd secure this with Firestore rules.
            if (data.schoolId === schoolId) {
                const studentData = allStudentData.get(data.studentId);
                if (studentData) {
                     records.push({
                        id: doc.id,
                        studentId: data.studentId,
                        studentName: studentData.name || 'Unknown Student',
                        studentAvatar: studentData.avatarUrl || `https://picsum.photos/seed/${data.studentId}/100`,
                        class: studentData.class || 'Unknown Class',
                        teacher: data.teacher,
                        date: data.date.toDate(),
                        status: data.status,
                    });
                }
            }
        });

        setAllRecords(records);
        setTeachers(['All Teachers', ...Array.from(new Set(records.map((r) => r.teacher).filter(Boolean)))]);
        setClasses(['All Classes', ...Array.from(new Set(records.map((r) => r.class)))]);
        setIsLoading(false);
    });

    return () => unsubscribeRecords();
  }, [schoolId]);

  const filteredRecords = allRecords.filter((record) => {
    const recordDate = new Date(record.date);
    const inTeacher = selectedTeacher === 'All Teachers' || record.teacher === selectedTeacher;
    const inClass = selectedClass === 'All Classes' || record.class === selectedClass;
    const inDate =
      !dateRange ||
      (recordDate >= (dateRange.from ?? new Date(0)) &&
       recordDate <= (dateRange.to ?? new Date()));
    return inTeacher && inClass && inDate;
  });

  const chartData = [
    { name: 'Present', value: filteredRecords.filter((r) => r.status === 'present').length, fill: 'hsl(var(--primary))' },
    { name: 'Absent', value: filteredRecords.filter((r) => r.status === 'absent').length, fill: 'hsl(var(--destructive))' },
    { name: 'Late', value: filteredRecords.filter((r) => r.status === 'late').length, fill: 'hsl(48, 96%, 53%)' },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
        <div className="mb-2">
            <h1 className="font-headline text-3xl font-bold flex items-center gap-2">
                <ClipboardCheck className="h-8 w-8 text-primary" />
                Attendance Dashboard
            </h1>
            <p className="text-muted-foreground">School-wide attendance overview and records.</p>
        </div>

        <Card>
            <CardHeader>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <CardTitle>Summary & Filters</CardTitle>
                        <CardDescription>Filter records by class, teacher, or date range.</CardDescription>
                    </div>
                    <div className="flex w-full flex-wrap gap-2 md:w-auto">
                        <Select value={selectedClass} onValueChange={setSelectedClass}>
                            <SelectTrigger className="w-full md:w-[180px]"><SelectValue /></SelectTrigger>
                            <SelectContent>{classes.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                        </Select>
                        <Select value={selectedTeacher} onValueChange={setSelectedTeacher}>
                            <SelectTrigger className="w-full md:w-[180px]"><SelectValue /></SelectTrigger>
                            <SelectContent>{teachers.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                        </Select>
                        <Popover>
                            <PopoverTrigger asChild>
                            <Button id="date" variant={"outline"} className={cn("w-full justify-start text-left font-normal md:w-auto lg:min-w-[250px]", !dateRange && "text-muted-foreground")}>
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {dateRange?.from ? (dateRange.to ? <>{format(dateRange.from, "LLL dd, y")} - {format(dateRange.to, "LLL dd, y")}</> : format(dateRange.from, "LLL dd, y")) : <span>Pick a date range</span>}
                            </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="end">
                            <Calendar initialFocus mode="range" defaultMonth={dateRange?.from} selected={dateRange} onSelect={setDateRange} numberOfMonths={2} />
                            </PopoverContent>
                        </Popover>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                {isLoading ? <div className="h-[250px] w-full flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin"/></div> : (
                     <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <Bar dataKey="value" />
                        </BarChart>
                    </ResponsiveContainer>
                )}
            </CardContent>
        </Card>
        
        <Card>
            <CardHeader>
                <CardTitle>Detailed Log</CardTitle>
                <CardDescription>A granular view of attendance records based on your filters.</CardDescription>
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
                            {isLoading ? (
                                <TableRow><TableCell colSpan={5} className="h-64 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto"/></TableCell></TableRow>
                            ) : filteredRecords.length > 0 ? (
                                filteredRecords.map((record) => (
                                <TableRow key={record.id}>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-9 w-9">
                                                <AvatarImage src={record.studentAvatar} alt={record.studentName} />
                                                <AvatarFallback>{record.studentName.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                            <span className="font-medium">{record.studentName}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>{record.class}</TableCell>
                                    <TableCell>{record.teacher}</TableCell>
                                    <TableCell>{format(new Date(record.date), 'dd MMM yyyy')}</TableCell>
                                    <TableCell>{getStatusBadge(record.status)}</TableCell>
                                </TableRow>
                                ))
                            ) : (
                                <TableRow><TableCell colSpan={5} className="h-24 text-center">No records found for the selected filters.</TableCell></TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
            <CardFooter>
                <div className="text-xs text-muted-foreground">
                    Showing <strong>{filteredRecords.length}</strong> of <strong>{allRecords.length}</strong> total records.
                </div>
            </CardFooter>
        </Card>
    </div>
  );
}
