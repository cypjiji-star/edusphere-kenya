'use client';

import * as React from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import {
  saveGradesAction,
} from '../actions';

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Calendar } from '@/components/ui/calendar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CalendarIcon, Loader2, Save, Plus, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

const studentGradeSchema = z.object({
  studentId: z.string(),
  grade: z.string().min(1, { message: "Grade is required" }),
});

export const gradeEntrySchema = z.object({
  classId: z.string({ required_error: 'Please select a class.' }),
  assessmentTitle: z.string().min(3, 'Assessment title must be at least 3 characters.'),
  assessmentType: z.enum(['Exam', 'Quiz', 'Assignment', 'Project']),
  assessmentDate: z.date({ required_error: 'An assessment date is required.' }),
  grades: z.array(studentGradeSchema),
});

export type GradeEntryFormValues = z.infer<typeof gradeEntrySchema>;

// Mock Data
const studentsByClass: Record<string, { id: string; name: string; avatarUrl: string }[]> = {
  'f4-chem': Array.from({ length: 31 }, (_, i) => ({ id: `f4-chem-${i + 1}`, name: `Student ${i + 1}`, avatarUrl: `https://picsum.photos/seed/f4-student${i + 1}/100` })),
  'f3-math': Array.from({ length: 28 }, (_, i) => ({ id: `f3-math-${i + 1}`, name: `Student ${i + 32}`, avatarUrl: `https://picsum.photos/seed/f3-student${i + 1}/100` })),
  'f2-phys': Array.from({ length: 35 }, (_, i) => ({ id: `f2-phys-${i + 1}`, name: `Student ${i + 60}`, avatarUrl: `https://picsum.photos/seed/f2-student${i + 1}/100` })),
};
const teacherClasses = [
  { id: 'f4-chem', name: 'Form 4 - Chemistry' },
  { id: 'f3-math', name: 'Form 3 - Mathematics' },
  { id: 'f2-phys', name: 'Form 2 - Physics' },
];
const assessmentTypes = ['Exam', 'Quiz', 'Assignment', 'Project'] as const;

export function GradeEntryForm() {
  const [isLoading, setIsLoading] = React.useState(false);
  const [selectedClass, setSelectedClass] = React.useState<string>(teacherClasses[0].id);
  const { toast } = useToast();

  const form = useForm<GradeEntryFormValues>({
    resolver: zodResolver(gradeEntrySchema),
    defaultValues: {
      classId: selectedClass,
      assessmentTitle: '',
      assessmentType: 'Quiz',
      grades: [],
    },
  });

  const { fields, replace } = useFieldArray({
    control: form.control,
    name: 'grades',
  });

  React.useEffect(() => {
    const students = studentsByClass[selectedClass] || [];
    replace(students.map(s => ({ studentId: s.id, grade: '' })));
    form.setValue('classId', selectedClass);
  }, [selectedClass, replace, form]);

  async function onSubmit(values: GradeEntryFormValues) {
    setIsLoading(true);
    const result = await saveGradesAction(values);
    setIsLoading(false);

    if (result.success) {
      toast({
        title: 'Grades Saved!',
        description: `The grades for "${values.assessmentTitle}" have been successfully recorded.`,
      });
      // In a real app, you would likely redirect or reset the form.
    } else {
      toast({
        variant: 'destructive',
        title: 'Uh oh! Something went wrong.',
        description: result.message || 'There was a problem saving the grades.',
      });
    }
  }

  const studentsForClass = studentsByClass[selectedClass] || [];

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          <div className="space-y-6">
            <h3 className="font-headline text-lg">Assessment Details</h3>
            <FormField
              control={form.control}
              name="classId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Class</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value);
                      setSelectedClass(value);
                    }}
                    defaultValue={field.value}
                  >
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
            <FormField
              control={form.control}
              name="assessmentTitle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Assessment Title</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., End of Term 1 Exam" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
               <FormField
                control={form.control}
                name="assessmentType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {assessmentTypes.map((type) => (
                          <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                  control={form.control}
                  name="assessmentDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Date</FormLabel>
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
                            onSelect={field.onChange}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
            </div>
             <div className="space-y-4 pt-4">
                <h4 className="font-medium">Advanced Options (Coming Soon)</h4>
                 <div className="flex items-center space-x-2">
                    <Switch id="weighted-grading" disabled />
                    <Label htmlFor="weighted-grading">Enable Weighted Grading</Label>
                </div>
                 <div className="flex items-center space-x-2">
                    <Switch id="custom-rubric" disabled />
                    <Label htmlFor="custom-rubric">Use Custom Rubric</Label>
                </div>
            </div>
          </div>
          <div className="md:col-span-2">
            <h3 className="font-headline text-lg mb-6">Enter Student Grades</h3>
            <div className="w-full overflow-auto rounded-lg border max-h-[600px]">
              <Table>
                <TableHeader className="sticky top-0 bg-muted">
                  <TableRow>
                    <TableHead className="w-full md:w-[250px]">Student Name</TableHead>
                    <TableHead className="text-right">Grade/Score</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fields.map((field, index) => {
                    const student = studentsForClass[index];
                    return (
                      <TableRow key={field.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={student.avatarUrl} alt={student.name} />
                              <AvatarFallback>{student.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <span className="font-medium">{student.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <FormField
                            control={form.control}
                            name={`grades.${index}.grade`}
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Input {...field} className="max-w-[120px] ml-auto text-right" placeholder="e.g., 85% or A-"/>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
        
        <Separator />

        <div className="flex justify-end">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving Grades...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save All Grades
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
