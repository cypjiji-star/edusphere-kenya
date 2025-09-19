
'use client';

import { useState, useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { createAssignmentAction } from './actions';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon, Loader2, PlusCircle, Paperclip } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import { useSearchParams } from 'next/navigation';
import { firestore } from '@/lib/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { useAuth } from '@/context/auth-context';

export const assignmentSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters.'),
  classId: z.string({ required_error: 'Please select a class.' }),
  dueDate: z.date({ required_error: 'A due date is required.' }),
  instructions: z.string().min(20, 'Instructions must be at least 20 characters.'),
});

export type AssignmentFormValues = z.infer<typeof assignmentSchema>;

type TeacherClass = {
  id: string;
  name: string;
};

export function AssignmentForm() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const schoolId = searchParams.get('schoolId');
  const [teacherClasses, setTeacherClasses] = useState<TeacherClass[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    if (!schoolId || !user) return;
    const teacherId = user.uid;
    const q = query(collection(firestore, `schools/${schoolId}/classes`), where('teacherId', '==', teacherId));
    const unsubscribe = onSnapshot(q, (snapshot) => {
        const classesData = snapshot.docs.map(doc => ({ id: doc.id, name: `${doc.data().name} ${doc.data().stream || ''}`.trim() }));
        setTeacherClasses(classesData);
    });
    return () => unsubscribe();
  }, [schoolId, user]);

  const form = useForm<AssignmentFormValues>({
    resolver: zodResolver(assignmentSchema),
    defaultValues: {
      title: '',
      instructions: '',
    },
  });

  async function onSubmit(values: AssignmentFormValues) {
    if (!schoolId || !user) {
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Authentication or School ID is missing. Cannot create assignment.',
        });
        return;
    }
    const teacherId = user.uid;

    setIsLoading(true);

    const selectedClass = teacherClasses.find(c => c.id === values.classId);

    const result = await createAssignmentAction(schoolId, teacherId, values, selectedClass?.name || '');
    
    setIsLoading(false);
    
    if (result.success) {
        toast({
            title: 'Assignment Created!',
            description: `"${values.title}" has been posted for ${teacherClasses.find(c => c.id === values.classId)?.name}.`,
        });
        form.reset();
    } else {
        toast({
            variant: 'destructive',
            title: 'Failed to Create Assignment',
            description: result.message,
        });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <div className="md:col-span-2 space-y-8">
                <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Assignment Title</FormLabel>
                    <FormControl>
                        <Input placeholder="e.g., The River and The Source: Character Analysis" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="instructions"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Instructions</FormLabel>
                    <FormControl>
                        <Textarea
                        placeholder="Provide detailed instructions for the assignment..."
                        className="min-h-[200px]"
                        {...field}
                        />
                    </FormControl>
                     <FormDescription>
                      You can use markdown for formatting.
                    </FormDescription>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </div>
            <div className="md:col-span-1 space-y-8">
                <FormField
                  control={form.control}
                  name="classId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Class</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a class" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {teacherClasses.map((cls) => (
                            <SelectItem key={cls.id} value={cls.id}>{cls.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="dueDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Due Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            disabled={(date) =>
                              date < new Date() || date < new Date("1900-01-01")
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <div className="space-y-2">
                    <Label>File Attachments</Label>
                    <div className="flex items-center justify-center w-full">
                        <Label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted/50 hover:bg-muted">
                            <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center">
                                <Paperclip className="w-8 h-8 mb-2 text-muted-foreground" />
                                <p className="mb-2 text-sm text-muted-foreground">Attach files</p>
                                <p className="text-xs text-muted-foreground">(PDF, Word, etc.)</p>
                            </div>
                            <Input id="dropzone-file" type="file" className="hidden" disabled />
                        </Label>
                    </div>
                     <FormDescription>
                      This feature is coming soon.
                    </FormDescription>
                </div>
            </div>
        </div>
        
        <div className="flex justify-end">
            <Button type="submit" disabled={isLoading} className="w-full md:w-auto">
                {isLoading ? (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Posting...
                </>
                ) : (
                <>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Post Assignment
                </>
                )}
            </Button>
        </div>
      </form>
    </Form>
  );
}
