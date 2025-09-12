
'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, ArrowRight, PlusCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

type EventType = 'Meeting' | 'Exam' | 'Holiday' | 'Event';

type UpcomingEvent = {
  date: string;
  day: string;
  title: string;
  type: EventType;
};

const upcomingEvents: UpcomingEvent[] = [
  {
    date: '25',
    day: 'Jul',
    title: 'PTA General Meeting',
    type: 'Meeting',
  },
  {
    date: '02',
    day: 'Aug',
    title: 'Mid-Term Examinations Begin',
    type: 'Exam',
  },
    {
    date: '10',
    day: 'Aug',
    title: 'Moi Day',
    type: 'Holiday',
  },
  {
    date: '15',
    day: 'Aug',
    title: 'Annual Sports Day',
    type: 'Event',
  },
];

const eventTypeColors: Record<EventType, string> = {
    Meeting: 'bg-purple-500',
    Exam: 'bg-red-600',
    Holiday: 'bg-green-600',
    Event: 'bg-blue-500',
};


export function CalendarWidget() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
            <CardTitle className="font-headline text-lg flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Upcoming Events
            </CardTitle>
            <Button variant="ghost" size="sm" disabled>
                <PlusCircle className="mr-2 h-4 w-4"/>
                Quick Add
            </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {upcomingEvents.map((event, index) => (
            <div key={index}>
              <div className="flex items-center gap-4">
                <div className="flex flex-col items-center justify-center w-14 text-center bg-muted/50 rounded-md p-2">
                    <span className="text-sm font-bold uppercase text-primary">{event.day}</span>
                    <span className="text-xl font-bold">{event.date}</span>
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-sm">{event.title}</p>
                  <Badge className={`mt-1 text-white ${eventTypeColors[event.type]}`}>{event.type}</Badge>
                </div>
              </div>
               {index < upcomingEvents.length - 1 && <Separator className="mt-4" />}
            </div>
          ))}
          {upcomingEvents.length === 0 && (
            <div className="text-center text-muted-foreground py-8">
              <p>No upcoming events scheduled.</p>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <Button asChild variant="outline" size="sm" className="w-full" disabled>
            <Link href="/admin/calendar">
                View Full Calendar
                <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
