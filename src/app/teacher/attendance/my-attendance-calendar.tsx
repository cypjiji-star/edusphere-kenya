
'use client';

import * as React from 'react';
import { add, sub, format, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek, isSameDay, isToday } from 'date-fns';
import { onSnapshot, collection, query, where, Timestamp } from 'firebase/firestore';
import { firestore, auth } from '@/lib/firebase';
import { useAuth } from '@/context/auth-context';
import { useSearchParams } from 'next/navigation';
import { Calendar as CalendarPicker, CalendarProps } from '@/components/ui/calendar';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

type TeacherAttendanceRecord = {
    date: Timestamp;
    status: 'Present' | 'Absent' | 'Late' | 'CheckedOut';
    checkInTime?: Timestamp;
    checkOutTime?: Timestamp;
};

export function MyAttendanceHistory() {
    const { user } = useAuth();
    const searchParams = useSearchParams();
    const schoolId = searchParams.get('schoolId');
    const [attendance, setAttendance] = React.useState<TeacherAttendanceRecord[]>([]);
    const [currentMonth, setCurrentMonth] = React.useState(new Date());

    React.useEffect(() => {
        if (!user || !schoolId) return;

        const start = startOfMonth(currentMonth);
        const end = endOfMonth(currentMonth);

        const q = query(
            collection(firestore, `schools/${schoolId}/teacher_attendance`),
            where('teacherId', '==', user.uid),
            where('date', '>=', start),
            where('date', '<=', end)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const records = snapshot.docs.map(doc => doc.data() as TeacherAttendanceRecord);
            setAttendance(records);
        });

        return () => unsubscribe();

    }, [user, schoolId, currentMonth]);
    
    // --- Data for Calendar View ---
    const presentDays = attendance
        .filter(r => r.status === 'Present' || r.status === 'CheckedOut')
        .map(r => r.date.toDate());
    
    const lateDays = attendance
        .filter(r => r.status === 'Late')
        .map(r => r.date.toDate());

    const absentDays = attendance
        .filter(r => r.status === 'Absent')
        .map(r => r.date.toDate());
        
    // --- Data for List View ---
    const summaryStats = React.useMemo(() => {
        return {
            present: presentDays.length,
            late: lateDays.length,
            absent: absentDays.length,
        };
    }, [presentDays, lateDays, absentDays]);
    
    const getStatusForDay = (record?: TeacherAttendanceRecord) => {
        if (!record) return <Badge variant="outline">Unmarked</Badge>;
        switch (record.status) {
            case 'Present':
            case 'CheckedOut':
                return <Badge className="bg-green-600 hover:bg-green-600">Present</Badge>;
            case 'Late':
                return <Badge className="bg-yellow-500 hover:bg-yellow-500">Late</Badge>;
            case 'Absent':
                return <Badge variant="destructive">Absent</Badge>;
            default:
                return <Badge variant="outline">{record.status}</Badge>;
        }
    };


    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                   <User className="h-5 w-5 text-primary"/>
                   My Attendance History
                </CardTitle>
                <CardDescription>A record of your attendance for the selected month.</CardDescription>
                <div className="flex items-center justify-between pt-4">
                    <h3 className="text-xl font-semibold font-headline">
                        {format(currentMonth, 'MMMM yyyy')}
                    </h3>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="icon" onClick={() => setCurrentMonth(sub(currentMonth, { months: 1 }))}>
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setCurrentMonth(new Date())}>Today</Button>
                        <Button variant="outline" size="icon" onClick={() => setCurrentMonth(add(currentMonth, { months: 1 }))}>
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <Tabs defaultValue="list-view">
                    <TabsList>
                        <TabsTrigger value="list-view">List View</TabsTrigger>
                        <TabsTrigger value="calendar-view">Calendar View</TabsTrigger>
                    </TabsList>

                    <TabsContent value="list-view" className="mt-4">
                         <div className="grid grid-cols-3 gap-4 mb-6 text-center">
                            <Card className="bg-muted/50"><CardHeader className="p-4"><CardTitle>{summaryStats.present}</CardTitle><CardDescription>Days Present</CardDescription></CardHeader></Card>
                            <Card className="bg-muted/50"><CardHeader className="p-4"><CardTitle>{summaryStats.late}</CardTitle><CardDescription>Times Late</CardDescription></CardHeader></Card>
                            <Card className="bg-muted/50"><CardHeader className="p-4"><CardTitle>{summaryStats.absent}</CardTitle><CardDescription>Days Absent</CardDescription></CardHeader></Card>
                        </div>
                        <div className="w-full overflow-auto rounded-lg border">
                            <Table>
                                <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Day</TableHead><TableHead>Check-In (AM)</TableHead><TableHead>Check-Out (PM)</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                                <TableBody>
                                    {attendance.sort((a, b) => b.date.seconds - a.date.seconds).map(record => (
                                        <TableRow key={record.date.seconds}>
                                            <TableCell>{format(record.date.toDate(), 'PPP')}</TableCell>
                                            <TableCell>{format(record.date.toDate(), 'eeee')}</TableCell>
                                            <TableCell>{record.checkInTime ? format(record.checkInTime.toDate(), 'h:mm a') : '—'}</TableCell>
                                            <TableCell>{record.checkOutTime ? format(record.checkOutTime.toDate(), 'h:mm a') : '—'}</TableCell>
                                            <TableCell>{getStatusForDay(record)}</TableCell>
                                        </TableRow>
                                    ))}
                                    {attendance.length === 0 && <TableRow><TableCell colSpan={5} className="h-24 text-center">No records for this month.</TableCell></TableRow>}
                                </TableBody>
                            </Table>
                        </div>
                    </TabsContent>
                    
                    <TabsContent value="calendar-view" className="mt-4">
                        <CalendarPicker
                            mode="single"
                            month={currentMonth}
                            onMonthChange={setCurrentMonth}
                            className="rounded-md border w-full p-0"
                            modifiers={{
                                present: presentDays,
                                late: lateDays,
                                absent: absentDays,
                            }}
                            modifiersClassNames={{
                                present: 'bg-green-100 text-green-800 rounded-full',
                                late: 'bg-yellow-100 text-yellow-800 rounded-full',
                                absent: 'bg-red-100 text-red-800 rounded-full',
                            }}
                        />
                         <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mt-4">
                            <div className="flex items-center gap-2"><Badge className="bg-green-600 hover:bg-green-600"/><span>Present</span></div>
                            <div className="flex items-center gap-2"><Badge className="bg-yellow-500 hover:bg-yellow-500"/><span>Late</span></div>
                            <div className="flex items-center gap-2"><Badge variant="destructive"/><span>Absent</span></div>
                        </div>
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    )
}
