
'use client';

import * as React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, BookMarked, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';

export type Assignment = {
  id: string;
  title: string;
  className: string;
  dueDate: string;
  submissions: number;
  totalStudents: number;
};


const allAssignments: Assignment[] = [
  {
    id: '1',
    title: 'Form 4 Chemistry - Acid-Base Titration Lab Report',
    className: 'Form 4 - Chemistry',
    dueDate: '2024-07-22',
    submissions: 15,
    totalStudents: 31,
  },
  {
    id: '2',
    title: 'Form 3 English - The River and The Source Character Essay',
    className: 'Form 3 - English',
    dueDate: '2024-07-20',
    submissions: 28,
    totalStudents: 28,
  },
  {
    id: '3',
    title: 'Form 2 Physics - Laws of Motion Problem Set',
    className: 'Form 2 - Physics',
    dueDate: '2024-07-25',
    submissions: 5,
    totalStudents: 35,
  },
  {
    id: '4',
    title: 'Form 4 Chemistry - Organic Compounds Quiz',
    className: 'Form 4 - Chemistry',
    dueDate: '2024-07-28',
    submissions: 25,
    totalStudents: 31,
  },
];

const teacherClasses = [
    'All Classes',
    'Form 4 - Chemistry',
    'Form 3 - English',
    'Form 2 - Physics',
];


export default function AssignmentsPage() {
  const [filteredClass, setFilteredClass] = React.useState('All Classes');
  const [clientReady, setClientReady] = React.useState(false);

  React.useEffect(() => {
    setClientReady(true);
  }, []);

  const assignments = allAssignments.filter(assignment => 
    filteredClass === 'All Classes' || assignment.className === filteredClass
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between mb-6">
          <div className="text-left">
            <h1 className="font-headline text-3xl font-bold">Assignment Tracking</h1>
            <p className="text-muted-foreground">Create, view, and grade offline student assignments.</p>
          </div>
          <Button asChild className="w-full md:w-auto">
            <Link href="/teacher/assignments/new">
              <PlusCircle className="mr-2" />
              Create Assignment
            </Link>
          </Button>
      </div>
      
      <div className="mb-6 flex items-center gap-4">
        <Label htmlFor="class-filter" className="text-sm font-medium">Filter by Class</Label>
        <Select value={filteredClass} onValueChange={setFilteredClass}>
            <SelectTrigger id="class-filter" className="w-full md:w-[240px]">
                <SelectValue placeholder="Select a class" />
            </SelectTrigger>
            <SelectContent>
                {teacherClasses.map((cls) => (
                    <SelectItem key={cls} value={cls}>
                    {cls}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
      </div>

      {assignments.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {assignments.map((assignment) => (
            <Card key={assignment.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                    <BookMarked className="h-6 w-6 text-primary" />
                    {clientReady && (
                        <Badge variant={new Date(assignment.dueDate) < new Date() ? 'destructive' : 'secondary'}>
                            Due {new Date(assignment.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })}
                        </Badge>
                    )}
                </div>
                <CardTitle className="font-headline text-xl pt-2">{assignment.title}</CardTitle>
                <CardDescription>{assignment.className}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Grading Progress</span>
                        <span>{assignment.submissions} / {assignment.totalStudents} Graded</span>
                    </div>
                    <Progress value={(assignment.submissions / assignment.totalStudents) * 100} />
                </div>
              </CardContent>
              <CardFooter>
                 <Button asChild variant="outline" className="w-full">
                    <Link href={`/teacher/assignments/${assignment.id}`}>
                        Track & Grade
                        <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
         <Card>
            <CardContent className="flex min-h-[400px] items-center justify-center rounded-lg border-2 border-dashed border-muted">
                <div className="text-center">
                <BookMarked className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-xl font-semibold">No Assignments Found</h3>
                <p className="mt-2 text-sm text-muted-foreground">No assignments match your current filter. Why not create one?</p>
                  <Button asChild className="mt-6">
                    <Link href="/teacher/assignments/new">
                      <PlusCircle className="mr-2" />
                      Create a New Assignment
                    </Link>
                  </Button>
                </div>
            </CardContent>
         </Card>
      )}
    </div>
  );
}
