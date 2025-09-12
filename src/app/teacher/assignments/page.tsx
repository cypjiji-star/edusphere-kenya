import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, BookMarked } from 'lucide-react';
import Link from 'next/link';

export default function AssignmentsPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <Card>
        <CardHeader className="md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="font-headline text-2xl">Manage Assignments</CardTitle>
            <CardDescription>Create, view, and grade student assignments.</CardDescription>
          </div>
          <Button asChild className="mt-4 md:mt-0">
            <Link href="/teacher/assignments/new">
              <PlusCircle className="mr-2" />
              Create Assignment
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          <div className="flex min-h-[400px] items-center justify-center rounded-lg border-2 border-dashed border-muted">
            <div className="text-center">
              <BookMarked className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-sm font-medium text-muted-foreground">No assignments yet</h3>
              <p className="mt-1 text-sm text-muted-foreground">Click "Create Assignment" to get started.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
