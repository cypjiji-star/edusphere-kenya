
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Calendar, PlusCircle } from 'lucide-react';
import { TimetableBuilder } from './timetable-builder';
import { Button } from '@/components/ui/button';

export default function TimetablePage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6 flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="font-headline text-3xl font-bold flex items-center gap-2">
              <Calendar className="h-8 w-8 text-primary"/>
              Timetable Management
          </h1>
          <p className="text-muted-foreground">Create and manage school-wide class and teacher timetables.</p>
        </div>
        <Button disabled>
            <PlusCircle className="mr-2"/>
            Create New Timetable
        </Button>
      </div>

      <TimetableBuilder />
    </div>
  );
}
