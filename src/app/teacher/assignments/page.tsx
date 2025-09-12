
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

const assignments = [
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
    submissions: 0,
    totalStudents: 35,
  },
];


export default function AssignmentsPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="md:flex md:items-center md:justify-between mb-6">
          <div>
            <h1 className="font-headline text-3xl font-bold">Manage Assignments</h1>
            <p className="text-muted-foreground">Create, view, and grade student assignments.</p>
          </div>
          <Button asChild className="mt-4 md:mt-0">
            <Link href="/teacher/assignments/new">
              <PlusCircle className="mr-2" />
              Create Assignment
            </Link>
          </Button>
      </div>

      {assignments.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {assignments.map((assignment) => (
            <Card key={assignment.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                    <BookMarked className="h-6 w-6 text-primary" />
                    <Badge variant={assignment.submissions === assignment.totalStudents ? 'default' : 'secondary'}>
                        Due {new Date(assignment.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </Badge>
                </div>
                <CardTitle className="font-headline text-xl pt-2">{assignment.title}</CardTitle>
                <CardDescription>{assignment.className}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Submissions</span>
                        <span>{assignment.submissions} / {assignment.totalStudents}</span>
                    </div>
                    <Progress value={(assignment.submissions / assignment.totalStudents) * 100} />
                </div>
              </CardContent>
              <CardFooter>
                 <Button asChild variant="outline" className="w-full">
                    <Link href={`/teacher/assignments/${assignment.id}`}>
                        View Submissions
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
                <h3 className="mt-2 text-sm font-medium text-muted-foreground">No assignments yet</h3>
                <p className="mt-1 text-sm text-muted-foreground">Click "Create Assignment" to get started.</p>
                </div>
            </CardContent>
         </Card>
      )}
    </div>
  );
}
