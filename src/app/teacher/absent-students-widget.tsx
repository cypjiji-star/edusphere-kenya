
'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { UserX, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { teacherClasses } from '@/app/teacher/students/page';
import * as React from 'react';

const absentStudents = teacherClasses
    .flatMap(c => c.students.map(s => ({ ...s, className: c.name })))
    .filter(s => s.attendance === 'absent' || s.attendance === 'late');

export function AbsentStudentsWidget() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline text-lg flex items-center gap-2">
          <UserX className="h-5 w-5 text-primary" />
          Absent Today
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {absentStudents.map((student, index) => (
            <div key={index} className="flex items-center gap-4">
              <Avatar>
                <AvatarImage src={student.avatarUrl} alt={student.name} />
                <AvatarFallback>{student.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="font-semibold text-sm">{student.name}</p>
                <p className="text-xs text-muted-foreground">{student.className}</p>
              </div>
              <Badge variant={student.attendance === 'absent' ? 'destructive' : 'secondary'} className="capitalize">
                {student.attendance}
              </Badge>
            </div>
          ))}
          {absentStudents.length === 0 && (
            <div className="text-center text-muted-foreground py-4">
              <p className="font-semibold">Full Attendance!</p>
              <p className="text-sm">All students are marked as present today.</p>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <Button asChild variant="outline" size="sm" className="w-full">
            <Link href="/teacher/attendance">
                View Full Attendance Sheet
                <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
