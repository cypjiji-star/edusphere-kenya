import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { AssignmentForm } from './assignment-form';

export default function NewAssignmentPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
       <div className="mb-6">
        <Button asChild variant="outline" size="sm">
            <Link href="/teacher/assignments">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Assignments
            </Link>
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-2xl">Create New Assignment</CardTitle>
          <CardDescription>Fill in the details below to create a new assignment for your class.</CardDescription>
        </CardHeader>
        <CardContent>
          <AssignmentForm />
        </CardContent>
      </Card>
    </div>
  );
}
