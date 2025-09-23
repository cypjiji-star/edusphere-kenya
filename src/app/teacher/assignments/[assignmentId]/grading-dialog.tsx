"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Book, Bell } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { saveGradeAction } from "./actions";
import type { Submission } from "./types";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { light } from "@/lib/haptic";

export const gradingSchema = z.object({
  grade: z.string().min(1, "Grade is required."),
  feedback: z.string().optional(),
  submissionId: z.string().optional(), // To track if we're editing
});

export type GradingFormValues = z.infer<typeof gradingSchema>;

interface GradingDialogProps {
  student: Submission | null;
  assignmentId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGradeSave: (
    studentId: string,
    grade: string,
    status: "Approved" | "Pending Approval",
  ) => void;
}

export function GradingDialog({
  student,
  assignmentId,
  open,
  onOpenChange,
  onGradeSave,
}: GradingDialogProps) {
  const [isLoading, setIsLoading] = React.useState(false);
  const searchParams = useSearchParams();
  const schoolId = searchParams.get("schoolId");
  const { user } = useAuth();

  const form = useForm<GradingFormValues>({
    resolver: zodResolver(gradingSchema),
    defaultValues: {
      grade: "",
      feedback: "",
    },
  });

  React.useEffect(() => {
    if (student) {
      form.reset({
        grade: student.grade || "",
        feedback: student.feedback || "",
        submissionId: student.submissionId,
      });
    }
  }, [student, form]);

  const onSubmit = async (values: GradingFormValues) => {
    if (!student || !schoolId || !user) return;
    setIsLoading(true);

    const actor = {
      id: user.uid,
      name: user.displayName || "Teacher",
    };

    const result = await saveGradeAction(
      schoolId,
      student.studentId,
      assignmentId,
      values,
      actor,
    );

    setIsLoading(false);
    if (result.success && result.status) {
      onGradeSave(student.studentId, values.grade, result.status);
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
                Grade Assignment for: {student.studentName}
              </DialogTitle>
              <DialogDescription>
                Enter the grade and provide feedback for the student's offline
                work.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-6 py-6">
              <div className="space-y-4">
                <h4 className="font-medium">Assignment Details</h4>
                <div className="flex min-h-[150px] items-center justify-center rounded-lg border-2 border-dashed border-muted bg-muted/20">
                  <div className="text-center text-muted-foreground p-4">
                    <Book className="mx-auto h-12 w-12" />
                    <p className="mt-2 text-sm font-medium">
                      Grading physical or offline work.
                    </p>
                    <p className="text-xs"> (Enter grade and feedback below)</p>
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

              <Separator />

              <div className="space-y-4">
                <Alert>
                  <Bell className="h-4 w-4" />
                  <AlertTitle>Notifications</AlertTitle>
                  <AlertDescription>
                    You can automatically notify students and parents when a
                    grade is saved.
                  </AlertDescription>
                </Alert>
                <div className="flex items-center space-x-2 p-2 rounded-md border border-transparent hover:border-border hover:bg-muted/50">
                  <Switch id="notify-student" disabled />
                  <Label htmlFor="notify-student">
                    Notify student/parent when grade is saved
                  </Label>
                </div>
                <p className="text-xs text-muted-foreground">
                  Notification system integration is coming soon.
                </p>
              </div>
            </div>

            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </DialogClose>
              <Button
                type="submit"
                disabled={isLoading}
                onClick={() => light()}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Grade"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
