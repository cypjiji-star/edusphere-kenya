
'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, ArrowRight, PlusCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { upcomingEvents, eventTypeColors, EventType } from './dashboard-data';


export function CalendarWidget() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
            <CardTitle className="font-headline text-lg flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Upcoming Events
            </CardTitle>
            <Button variant="ghost" size="sm">
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
        <Button asChild variant="outline" size="sm" className="w-full">
            <Link href="/admin/calendar">
                View Full Calendar
                <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
