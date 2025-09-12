
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Calendar } from 'lucide-react';


export default function TimetablePage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <Card>
        <CardHeader>
          <div>
            <CardTitle className="font-headline text-2xl flex items-center gap-2">
                <Calendar className="h-6 w-6 text-primary"/>
                My Timetable
            </CardTitle>
            <CardDescription>A full overview of your weekly teaching schedule.</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
            <div className="flex h-[400px] w-full items-center justify-center rounded-lg border-2 border-dashed border-muted">
                <p className="text-muted-foreground">Full timetable view coming soon.</p>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
