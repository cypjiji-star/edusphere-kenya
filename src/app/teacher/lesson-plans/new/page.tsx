
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
import { LessonPlanForm } from './lesson-plan-form';

export default function NewLessonPlanPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
       <div className="mb-6">
        <Button asChild variant="outline" size="sm">
            <Link href="/teacher/lesson-plans">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to All Lesson Plans
            </Link>
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-2xl flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-primary"/>
            Lesson Plan Builder
          </CardTitle>
          <CardDescription>Fill in the details below. Use the AI Assistant to help generate content.</CardDescription>
        </CardHeader>
        <CardContent>
          <LessonPlanForm />
        </CardContent>
      </Card>
    </div>
  );
}
