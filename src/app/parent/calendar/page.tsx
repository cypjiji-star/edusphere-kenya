
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Calendar } from 'lucide-react';
import { FullCalendar } from './full-calendar';


export default function CalendarPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
       <div className="mb-6">
        <h1 className="font-headline text-3xl font-bold flex items-center gap-2"><Calendar className="h-8 w-8 text-primary"/>School Events Calendar</h1>
        <p className="text-muted-foreground">View school-wide events, holidays, and important dates.</p>
       </div>
      <Card>
        <CardContent className="p-4">
            <FullCalendar />
        </CardContent>
      </Card>
    </div>
  );
}
