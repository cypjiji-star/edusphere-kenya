
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import * as React from 'react';
import { mockTimetableData, periods, days } from '@/app/admin/timetable/timetable-data';
import type { Subject } from '@/app/admin/timetable/timetable-data';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

type TimetableEntry = {
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  title: string;
  location: string;
  isBreak?: boolean;
};

export function TimetableWidget() {
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [clientReady, setClientReady] = React.useState(false);
  const [todaySchedule, setTodaySchedule] = React.useState<TimetableEntry[]>([]);
  
  useEffect(() => {
    setClientReady(true);
    setCurrentTime(new Date());

    const getTodaySchedule = () => {
        const today = new Date();
        const dayOfWeek = days[today.getDay() === 0 ? 6 : today.getDay() - 1] || 'Monday'; // Default to Monday for Sunday/simplicity
        const teacherName = 'Ms. Wanjiku';

        const scheduleForToday: TimetableEntry[] = periods.map(period => {
            if (period.isBreak) {
                const [startTime, endTime] = period.time.split(' - ');
                return {
                    startTime,
                    endTime,
                    title: period.title || 'Break',
                    location: '-',
                    isBreak: true
                };
            }
            const daySchedule = mockTimetableData[dayOfWeek];
            const lesson = daySchedule ? daySchedule[period.id] : undefined;

            const [startTime, endTime] = period.time.split(' - ');

            if (lesson && lesson.subject.teacher === teacherName) {
                return {
                    startTime,
                    endTime,
                    title: lesson.subject.name,
                    location: lesson.room,
                };
            }
            // Return a placeholder for empty slots if needed, or filter them out
            // For this implementation, we will assume empty slots are just empty.
            return {
                startTime,
                endTime,
                title: 'Free Period',
                location: 'Staff Room',
            };
        });

        setTodaySchedule(scheduleForToday);
    }
    
    getTodaySchedule();

    const timer = setInterval(() => setCurrentTime(new Date()), 60000); // Update every minute
    return () => clearInterval(timer);
  }, []);

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
                    {isCurrent && !event.isBreak && (
                    <Badge variant="default" className="mt-auto">
                        Ongoing
                    </Badge>
                    )}
                </div>
                );
            })}
            </div>
            <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </CardContent>
      <CardFooter>
        <Button asChild variant="outline" size="sm" className="w-full">
            <Link href="/teacher/calendar">
                View Full Calendar
                <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
