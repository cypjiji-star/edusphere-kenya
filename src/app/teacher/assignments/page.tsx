

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
import { PlusCircle, BookMarked, ArrowRight, Loader2 } from 'lucide-react';
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
import { firestore } from '@/lib/firebase';
import { collection, query, where, onSnapshot, Timestamp } from 'firebase/firestore';
import { useSearchParams } from 'next/navigation';

export type Assignment = {
  id: string;
  title: string;
  className: string;
  dueDate: Timestamp;
  submissions: number;
  totalStudents: number;
};

const teacherClasses = [
    'All Classes',
    'Form 4 - Chemistry',
    'Form 3 - Mathematics',
    'Form 2 - Physics',
];


export default function AssignmentsPage() {
  const searchParams = useSearchParams();
  const schoolId = searchParams.get('schoolId');
  const [allAssignments, setAllAssignments] = React.useState<Assignment[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [filteredClass, setFilteredClass] = React.useState('All Classes');
  const [clientReady, setClientReady] = React.useState(false);

  React.useEffect(() => {
    if (!schoolId) {
        setIsLoading(false);
        return;
    }

    setClientReady(true);
    const teacherId = 'teacher-wanjiku'; // Placeholder for logged-in teacher
    
    const q = query(collection(firestore, `schools/${schoolId}/assignments`), where('teacherId', '==', teacherId));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
        const fetchedAssignments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Assignment));
        setAllAssignments(fetchedAssignments);
        setIsLoading(false);
    }, (error) => {
        console.error("Error fetching assignments:", error);
        setIsLoading(false);
    });

    return () => unsubscribe();
  }, [schoolId]);

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
            <Link href={`/teacher/assignments/new?schoolId=${schoolId}`}>
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

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      ) : assignments.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {assignments.map((assignment) => (
            <Card key={assignment.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                    <BookMarked className="h-6 w-6 text-primary" />
                    {clientReady && (
                        <Badge variant={assignment.dueDate.toDate() < new Date() ? 'destructive' : 'secondary'}>
                            Due {assignment.dueDate.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
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
                    <Link href={`/teacher/assignments/${assignment.id}?schoolId=${schoolId}`}>
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
                    <Link href={`/teacher/assignments/new?schoolId=${schoolId}`}>
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
