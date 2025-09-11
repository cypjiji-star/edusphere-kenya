'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { UserX, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const absentStudents = [
  {
    name: 'Peter Kariuki',
    class: 'Form 4',
    avatarUrl: 'https://picsum.photos/seed/student1/100',
    reason: 'Sick',
  },
  {
    name: 'Asha Mohammed',
    class: 'Form 4',
    avatarUrl: 'https://picsum.photos/seed/student2/100',
    reason: 'Family Emergency',
  },
];

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
                <p className="text-xs text-muted-foreground">{student.class}</p>
              </div>
              <Badge variant="outline" className="text-yellow-600 border-yellow-500">{student.reason}</Badge>
            </div>
          ))}
          {absentStudents.length === 0 && (
            <div className="text-center text-muted-foreground py-4">
              <p className="font-semibold">Full Attendance!</p>
              <p className="text-sm">All students are present today.</p>
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
