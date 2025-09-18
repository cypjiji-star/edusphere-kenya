
'use client';

import * as React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, BookOpen } from 'lucide-react';
import Link from 'next/link';
import { LessonPlanForm } from '../new/lesson-plan-form';
import { useSearchParams } from 'next/navigation';

export default function NewLessonPlanPage() {
  const searchParams = useSearchParams();
  const schoolId = searchParams.get('schoolId');
  const prefilledDate = searchParams.get('date') || undefined;

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <Button asChild variant="outline" size="sm">
          <Link href={`/admin/lesson-plans?schoolId=${schoolId}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to All Lesson Plans
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div>
            <CardTitle className="font-headline text-2xl flex items-center gap-2">
              <BookOpen className="h-6 w-6 text-primary" />
              Lesson Plan Builder
            </CardTitle>
            <CardDescription>
              Fill in the details below. Use the AI Assistant to help generate content.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {schoolId ? (
            <LessonPlanForm prefilledDate={prefilledDate} schoolId={schoolId} />
          ) : (
             <p className="text-red-500 text-sm">
                  Error: School ID is missing.
             </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
