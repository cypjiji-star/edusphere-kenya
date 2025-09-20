
'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
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
import { Loader2, PlusCircle, Paperclip, CalendarIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { firestore } from '@/lib/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';


export const assignmentSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters.'),
  classId: z.string({ required_error: 'Please select a class.' }),
  dueDate: z.date({ required_error: 'A due date is required.' }),
  instructions: z.string().min(20, 'Instructions must be at least 20 characters.'),
  // attachment: z.instanceof(File).optional(),
});

export type AssignmentFormValues = z.infer<typeof assignmentSchema>;

type TeacherClass = {
  id: string;
  name: string;
};

export function AssignmentForm() {
  const [isLoading, setIsLoading] = React.useState(false);
  const [teacherClasses, setTeacherClasses] = React.useState<TeacherClass[]>([]);
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const schoolId = searchParams.get('schoolId');
  const { user } = useAuth();

  const form = useForm<AssignmentFormValues>({
    resolver: zodResolver(assignmentSchema),
    defaultValues: {
      title: '',
      classId: '',
      instructions: '',
    },
  });
  
  React.useEffect(() => {
    if (!schoolId || !user) return;
    const q = query(collection(firestore, `schools/${schoolId}/classes`), where("teacherId", "==", user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
        const classesData: TeacherClass[] = snapshot.docs.map(d => ({ id: d.id, name: `${d.data().name} ${d.data().stream || ''}`.trim() }));
        setTeacherClasses(classesData);
    });
    return () => unsubscribe();
  }, [schoolId, user]);


  async function onSubmit(values: AssignmentFormValues) {
    if (!schoolId || !user) {
        toast({ title: "Error", description: "Not authenticated or school ID is missing.", variant: "destructive" });
        return;
    };
    setIsLoading(true);

    const className = teacherClasses.find(c => c.id === values.classId)?.name || 'Unknown Class';
    const result = await createAssignmentAction(schoolId, user.uid, values, className);
    
    setIsLoading(false);

    if (result.success) {
      toast({
        title: 'Assignment Created!',
        description: result.message,
      });
      router.push(`/teacher/assignments?schoolId=${schoolId}`);
    } else {
      toast({
        title: 'Failed to create assignment',
        description: result.message,
        variant: 'destructive',
      });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Assignment Title</FormLabel>
                <FormControl>
                    <Input placeholder="e.g., Term 2 History Essay" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />

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
                    {teacherClasses.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                    </SelectContent>
                </Select>
                <FormMessage />
                </FormItem>
            )}
            />
        </div>

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
                        "w-[240px] pl-3 text-left font-normal",
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
                    onSelect={field.onChange}
                    disabled={(date) => date < new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
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
                  placeholder="Provide clear instructions for your students..."
                  className="min-h-[150px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="space-y-2">
            <FormLabel>Attachments (Optional)</FormLabel>
            <FormControl>
                 <div className="flex items-center justify-center w-full">
                    <Label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted/50 hover:bg-muted">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center">
                            <Paperclip className="w-8 h-8 mb-2 text-muted-foreground" />
                            <p className="mb-2 text-sm text-muted-foreground">Attach rubrics, readings, etc.</p>
                            <p className="text-xs text-muted-foreground">(Feature coming soon)</p>
                        </div>
                        <Input id="dropzone-file" type="file" className="hidden" disabled />
                    </Label>
                </div>
            </FormControl>
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
