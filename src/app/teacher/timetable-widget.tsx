
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, ArrowRight, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import * as React from 'react';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { firestore } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { useSearchParams } from 'next/navigation';


type TimetableEntry = {
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  title: string;
  location: string;
  isBreak?: boolean;
};

type TimetableData = Record<string, Record<string, { subject: { name: string, teacher: string }, room: string }>>;
type PeriodData = { id: number, time: string, isBreak?: boolean, title?: string };


export function TimetableWidget() {
  const searchParams = useSearchParams();
  const schoolId = searchParams.get('schoolId');
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [clientReady, setClientReady] = React.useState(false);
  const [todaySchedule, setTodaySchedule] = React.useState<TimetableEntry[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  
  useEffect(() => {
    setClientReady(true);
    setCurrentTime(new Date());

    const getTodaySchedule = async () => {
        if (!schoolId) {
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        const today = new Date();
        const dayOfWeek = today.toLocaleString('en-US', { weekday: 'long' }); // e.g., 'Monday'
        const teacherName = 'Ms. Wanjiku'; // This should be dynamic based on logged-in user

        try {
            // Fetch periods
            const periodsRef = doc(firestore, `schools/${schoolId}/timetableSettings`, 'periods');
            const periodsSnap = await getDoc(periodsRef);
            const periods: PeriodData[] = periodsSnap.exists() ? periodsSnap.data().periods : [];

            // Fetch timetable for all classes to find the teacher's lessons
            const timetablesSnapshot = await getDocs(collection(firestore, `schools/${schoolId}/timetables`));

            const scheduleForToday: TimetableEntry[] = periods.map(period => {
                const [startTime, endTime] = period.time.split(' - ');
                if (period.isBreak) {
                    return { startTime, endTime, title: period.title || 'Break', location: '-', isBreak: true };
                }
                
                let lessonForPeriod: TimetableEntry | null = null;
                
                timetablesSnapshot.forEach(doc => {
                    const timetable = doc.data() as TimetableData;
                    const daySchedule = timetable[dayOfWeek];
                    if (daySchedule) {
                        const lesson = daySchedule[period.time];
                        if (lesson && lesson.subject.teacher === teacherName) {
                             lessonForPeriod = { startTime, endTime, title: lesson.subject.name, location: lesson.room };
                        }
                    }
                });

                return lessonForPeriod || { startTime, endTime, title: 'Free Period', location: 'Staff Room' };
            });

            setTodaySchedule(scheduleForToday);
        } catch (error) {
            console.error("Error fetching timetable:", error);
        } finally {
            setIsLoading(false);
        }
    }
    
    getTodaySchedule();

    const timer = setInterval(() => setCurrentTime(new Date()), 60000); // Update every minute
    return () => clearInterval(timer);
  }, [schoolId]);

  const isCurrentClass = (entry: TimetableEntry) => {
    if (!currentTime || entry.isBreak) return false;
    
    const now = currentTime;
    const [startHour, startMinute] = entry.startTime.split(':').map(Number);
    const [endHour, endMinute] = entry.endTime.split(':').map(Number);
    
    const startTime = new Date(now);
    startTime.setHours(startHour, startMinute, 0, 0);

    const endTime = new Date(now);
    endTime.setHours(endHour, endMinute, 0, 0);

    return now >= startTime && now < endTime;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline text-lg flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          Today's Timetable
        </CardTitle>
      </CardHeader>
      <CardContent>
         {isLoading ? (
            <div className="flex items-center justify-center h-32">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        ) : (
            <ScrollArea className="w-full">
                <div className="flex space-x-4 pb-4">
                {todaySchedule.map((event, index) => {
                    const isCurrent = clientReady && isCurrentClass(event);
                    return (
                    <div
                        key={index}
                        className={cn(
                        'flex flex-col items-center justify-center p-3 rounded-lg transition-all w-32 shrink-0 h-32',
                        isCurrent && !event.isBreak ? 'bg-primary/10 ring-2 ring-primary/50' : 'bg-muted/50',
                        event.isBreak && 'bg-muted/20'
                        )}
                    >
                        <div className="text-xs font-bold text-primary">
                        {event.startTime}
                        </div>
                        <div className="flex-1 flex flex-col items-center justify-center text-center">
                        <p className="font-semibold text-sm leading-tight">{event.title}</p>
                        {!event.isBreak && <p className="text-xs text-muted-foreground">{event.location}</p>}
                        </div>
                    </div>
                    );
                })}
                </div>
                <ScrollBar orientation="horizontal" />
            </ScrollArea>
        )}
      </CardContent>
      <CardFooter>
        <Button asChild variant="outline" size="sm" className="w-full">
            <Link href={`/teacher/calendar?schoolId=${schoolId}`}>
                View Full Calendar
                <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
