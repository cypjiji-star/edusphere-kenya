'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, FileText } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { gradingSchema, GradingFormValues, saveGradeAction } from './actions';
import type { Submission } from './types';

interface GradingDialogProps {
  student: Submission | null;
  assignmentId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGradeSave: (studentId: string, grade: string) => void;
}

export function GradingDialog({
  student,
  assignmentId,
  open,
  onOpenChange,
  onGradeSave,
}: GradingDialogProps) {
  const [isLoading, setIsLoading] = React.useState(false);
  
  const form = useForm<GradingFormValues>({
    resolver: zodResolver(gradingSchema),
    defaultValues: {
      grade: '',
      feedback: '',
    },
  });

  React.useEffect(() => {
    if (student) {
      form.reset({
        grade: student.grade || '',
        feedback: student.feedback || '',
      });
    }
  }, [student, form]);

  const onSubmit = async (values: GradingFormValues) => {
    if (!student) return;
    setIsLoading(true);

    const result = await saveGradeAction(student.studentId, assignmentId, values);

    setIsLoading(false);
    if (result.success) {
      onGradeSave(student.studentId, values.grade);
      onOpenChange(false);
    }
  };

  if (!student) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <DialogHeader>
              <DialogTitle className="font-headline text-xl">
                Grade Submission: {student.studentName}
              </DialogTitle>
              <DialogDescription>
                Review the submission and provide feedback.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-6 py-6">
              <div className="space-y-4">
                <h4 className="font-medium">Submitted Work</h4>
                <div className="flex min-h-[200px] items-center justify-center rounded-lg border-2 border-dashed border-muted bg-muted/20">
                    <div className="text-center text-muted-foreground p-4">
                        <FileText className="mx-auto h-12 w-12" />
                        <p className="mt-2 text-sm font-medium">Student submission will be displayed here.</p>
                        <p className="text-xs"> (e.g., PDF viewer, image, or document content)</p>
                    </div>
                </div>
              </div>
              
              <Separator />

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="grade"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Grade</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., A+, 85%, etc." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="feedback"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Feedback / Comments</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Provide constructive feedback for the student..."
                        className="min-h-[120px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
                <DialogClose asChild>
                    <Button type="button" variant="outline">
                        Cancel
                    </Button>
                </DialogClose>
                <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Grade'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
