
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { FullCalendar } from './full-calendar';


export default function CalendarPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <Card>
        <CardHeader>
          <div>
            <CardTitle className="font-headline text-2xl">Events Calendar</CardTitle>
            <CardDescription>View school events, class schedules, and important dates.</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
            <FullCalendar />
        </CardContent>
      </Card>
    </div>
  );
}
