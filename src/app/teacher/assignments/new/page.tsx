
'use client';

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
import { useSearchParams } from 'next/navigation';
import * as React from 'react';
import { Suspense } from 'react';


function NewAssignmentPageContent() {
  const searchParams = useSearchParams();
  const schoolId = searchParams.get('schoolId');

  return (
    <div className="p-4 sm:p-6 lg:p-8">
       <div className="mb-6">
        <Button asChild variant="outline" size="sm">
            <Link href={`/teacher/assignments?schoolId=${schoolId}`}>
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

export default function NewLessonPlanPage() {
    return (
        <Suspense>
            <NewAssignmentPageContent />
        </Suspense>
    )
}

