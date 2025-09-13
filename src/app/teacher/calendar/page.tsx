
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { FullCalendar } from './full-calendar';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Bell } from 'lucide-react';


export default function CalendarPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
       <div className="mb-6">
          <CardTitle className="font-headline text-2xl">Events Calendar</CardTitle>
          <CardDescription>View school events, class schedules, and important dates.</CardDescription>
       </div>

        <Alert className="mb-6">
            <Bell className="h-4 w-4" />
            <AlertTitle>Exam Reminder</AlertTitle>
            <AlertDescription>
                The Form 4 Chemistry Practical exam is scheduled for today at 1:00 PM.
            </AlertDescription>
        </Alert>

      <Card>
        <CardContent className="p-4">
            <FullCalendar />
        </CardContent>
      </Card>
    </div>
  );
}
