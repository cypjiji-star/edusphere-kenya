'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

type TimetableEntry = {
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  title: string;
  location: string;
};

const schedule: TimetableEntry[] = [
  { startTime: '09:00', endTime: '10:00', title: 'Form 4 - Chemistry', location: 'Science Lab' },
  { startTime: '10:00', endTime: '11:00', title: 'Form 3 - Mathematics', location: 'Room 12A' },
  { startTime: '11:00', endTime: '12:00', title: 'Staff Meeting', location: 'Staff Room' },
  { startTime: '12:00', endTime: '13:00', title: 'Break', location: '-' },
  { startTime: '13:00', endTime: '14:00', title: 'Form 2 - Physics Practical', location: 'Science Lab' },
  { startTime: '14:00', endTime: '15:00', title: 'Form 4 - English', location: 'Room 10B' },
];

export function TimetableWidget() {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000); // Update every minute
    return () => clearInterval(timer);
  }, []);

  const isCurrentClass = (entry: TimetableEntry) => {
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
        <div className="space-y-4">
          {schedule.map((event, index) => {
            const isCurrent = isCurrentClass(event);
            return (
              <div
                key={index}
                className={cn(
                  'flex items-start gap-4 p-3 rounded-lg transition-all',
                  isCurrent && 'bg-primary/10 ring-2 ring-primary/50'
                )}
              >
                <div className="text-sm font-bold text-primary w-24">
                  {event.startTime} - {event.endTime}
                </div>
                <div className="flex-1 space-y-1">
                  <p className="font-semibold text-sm">{event.title}</p>
                  <p className="text-xs text-muted-foreground">{event.location}</p>
                </div>
                {isCurrent && (
                  <Badge variant="default" className="h-6">
                    Ongoing
                  </Badge>
                )}
              </div>
            );
          })}
        </div>
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
