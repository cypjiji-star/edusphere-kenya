

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, BookOpen, Share2, Copy, FileDown, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { LessonPlanForm } from './lesson-plan-form';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function NewLessonPlanPage({ searchParams }: { searchParams: { id?: string }}) {
  const lessonPlanId = searchParams.id;
  const isEditMode = !!lessonPlanId;

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
        <CardHeader className="flex flex-row items-start justify-between">
          <div>
            <CardTitle className="font-headline text-2xl flex items-center gap-2">
              <BookOpen className="h-6 w-6 text-primary"/>
              {isEditMode ? 'Edit Lesson Plan' : 'Lesson Plan Builder'}
            </CardTitle>
            <CardDescription>
              {isEditMode
                ? 'Update the details for your existing lesson plan.'
                : 'Fill in the details below. Use the AI Assistant to help generate content.'}
            </CardDescription>
          </div>
           {isEditMode && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="secondary">
                    Share / Actions
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem disabled>
                    <Share2 className="mr-2" />
                    Share with a colleague
                  </DropdownMenuItem>
                  <DropdownMenuItem disabled>
                    <Copy className="mr-2" />
                    Copy to another class
                  </DropdownMenuItem>
                   <DropdownMenuItem disabled>
                    <FileDown className="mr-2" />
                    Print / Export as PDF
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
        </CardHeader>
        <CardContent>
          <LessonPlanForm lessonPlanId={lessonPlanId} />
        </CardContent>
      </Card>
    </div>
  );
}
