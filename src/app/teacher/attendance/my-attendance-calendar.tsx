
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

type TeacherAttendanceRecord = {
    date: Timestamp;
    status: 'Present' | 'Absent' | 'Late' | 'CheckedOut';
};

export function MyAttendanceCalendar() {
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

    const presentDays = attendance
        .filter(r => r.status === 'Present' || r.status === 'CheckedOut')
        .map(r => r.date.toDate());
    
    const lateDays = attendance
        .filter(r => r.status === 'Late')
        .map(r => r.date.toDate());

    const absentDays = attendance
        .filter(r => r.status === 'Absent')
        .map(r => r.date.toDate());

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                 <h2 className="text-xl font-semibold font-headline">
                    {format(currentMonth, 'MMMM yyyy')}
                </h2>
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
             <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2"><Badge className="bg-green-600 hover:bg-green-600"/><span>Present</span></div>
                <div className="flex items-center gap-2"><Badge className="bg-yellow-500 hover:bg-yellow-500"/><span>Late</span></div>
                <div className="flex items-center gap-2"><Badge variant="destructive"/><span>Absent</span></div>
            </div>
        </div>
    )
}
