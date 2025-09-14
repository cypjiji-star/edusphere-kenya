
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
import { GradeEntryForm } from './grade-entry-form';
import { useSearchParams } from 'next/navigation';

export default function NewGradeEntryPage() {
  const searchParams = useSearchParams();
  const schoolId = searchParams.get('schoolId');
  return (
    <div className="p-4 sm:p-6 lg:p-8">
       <div className="mb-6">
        <Button asChild variant="outline" size="sm">
            <Link href={`/teacher/grades?schoolId=${schoolId}`}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Gradebook
            </Link>
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-2xl">Enter New Grades</CardTitle>
          <CardDescription>Fill out the form to add a new assessment and enter grades for your class.</CardDescription>
        </CardHeader>
        <CardContent>
          <GradeEntryForm />
        </CardContent>
      </Card>
    </div>
  );
}
