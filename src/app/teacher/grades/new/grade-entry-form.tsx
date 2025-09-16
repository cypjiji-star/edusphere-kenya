
'use client';

import * as React from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { saveGradesAction } from '../actions';
import { gradeEntrySchema, type GradeEntryFormValues } from '../types';

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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, Save, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useSearchParams } from 'next/navigation';
import { firestore, auth } from '@/lib/firebase';
import { collection, query, where, onSnapshot, getDocs } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/context/auth-context';

type Student = {
    id: string;
    name: string;
    avatarUrl: string;
    admissionNumber: string;
}

type TeacherClass = {
  id: string;
  name: string;
};

type Assessment = {
  id: string;
  title: string;
  date: any;
  subject: string;
};

interface GradeEntryFormProps {
  preselectedTask?: {
    classId: string;
    assessmentId: string;
    subject: string;
  } | null;
}

export function GradeEntryForm({ preselectedTask }: GradeEntryFormProps) {
  const [isLoading, setIsLoading] = React.useState(false);
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const schoolId = searchParams.get('schoolId');
  const [teacherClasses, setTeacherClasses] = React.useState<TeacherClass[]>([]);
  const [teacherSubjects, setTeacherSubjects] = React.useState<string[]>([]);
  const [assessments, setAssessments] = React.useState<Assessment[]>([]);
  const [students, setStudents] = React.useState<Student[]>([]);
  const [selectedClass, setSelectedClass] = React.useState<string | undefined>(preselectedTask?.classId);
  const { user } = useAuth();

  const form = useForm<GradeEntryFormValues>({
    resolver: zodResolver(gradeEntrySchema),
    defaultValues: {
      classId: preselectedTask?.classId || '',
      subject: preselectedTask?.subject || '',
      assessmentId: preselectedTask?.assessmentId || '',
      grades: [],
    },
  });

  const { fields, replace } = useFieldArray({
    control: form.control,
    name: 'grades',
  });
  
  // Fetch teacher's classes and subjects
  React.useEffect(() => {
    if (!schoolId || !user) return;
    const teacherId = user.uid;

    const classesQuery = query(collection(firestore, `schools/${schoolId}/classes`), where('teacherId', '==', teacherId));
    const unsubClasses = onSnapshot(classesQuery, (snapshot) => {
        const classesData = snapshot.docs.map(doc => ({ id: doc.id, name: `${doc.data().name} ${doc.data().stream || ''}`.trim() }));
        setTeacherClasses(classesData);
        if (!selectedClass && !preselectedTask && classesData.length > 0) {
            setSelectedClass(classesData[0].id);
        }
    });
    
    const subjectsQuery = query(collection(firestore, `schools/${schoolId}/subjects`), where('teachers', 'array-contains', user.displayName));
    const unsubSubjects = onSnapshot(subjectsQuery, (snapshot) => {
        const subjects = snapshot.docs.map(doc => doc.data().name as string);
        setTeacherSubjects(subjects);
    });


    return () => {
      unsubClasses();
      unsubSubjects();
    };
  }, [schoolId, user, selectedClass, preselectedTask]);


  // Fetch students and assessments for the selected class
  React.useEffect(() => {
    if (!schoolId || !selectedClass) return;

    const fetchData = async () => {
        // Fetch students
        const studentsQuery = query(collection(firestore, 'schools', schoolId, 'students'), where('classId', '==', selectedClass));
        const studentsSnapshot = await getDocs(studentsQuery);
        const studentData = studentsSnapshot.docs.map(doc => ({ id: doc.id, name: doc.data().name, avatarUrl: doc.data().avatarUrl, admissionNumber: doc.data().admissionNumber }));
        setStudents(studentData);
        replace(studentData.map(s => ({ studentId: s.id, grade: '' })));
        form.setValue('classId', selectedClass);

        // Fetch assessments
        const assessmentsQuery = query(collection(firestore, 'schools', schoolId, 'assessments'), where('classId', '==', selectedClass));
        const assessmentsSnapshot = await getDocs(assessmentsQuery);
        const assessmentData = assessmentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Assessment));
        setAssessments(assessmentData);
        if (!preselectedTask) {
          form.resetField('assessmentId');
        }
    };

    fetchData();
  }, [schoolId, selectedClass, replace, form, preselectedTask]);

  async function onSubmit(values: GradeEntryFormValues) {
    if (!schoolId || !user) {
        toast({ variant: 'destructive', title: 'Error', description: 'School ID is missing or user is not authenticated.' });
        return;
    }
    setIsLoading(true);
    const result = await saveGradesAction(schoolId, user.uid, user.displayName || 'Teacher', values);
    setIsLoading(false);

    if (result.success) {
      toast({
        title: 'Grades Saved!',
        description: `The grades have been successfully recorded.`,
      });
      form.reset({
        ...values,
        grades: students.map(s => ({ studentId: s.id, grade: '' })),
      });
    } else {
      toast({
        variant: 'destructive',
        title: 'Uh oh! Something went wrong.',
        description: result.message || 'There was a problem saving the grades.',
      });
    }
  }

  const selectedAssessment = assessments.find(a => a.id === form.getValues('assessmentId'));

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          <div className="space-y-6">
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
                    value={field.value}
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
              name="subject"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subject</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={!selectedClass}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a subject" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {teacherSubjects.map((subject) => (
                        <SelectItem key={subject} value={subject}>{subject}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="assessmentId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Assessment</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={!selectedClass || assessments.length === 0}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select an assessment" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {assessments.map((a) => (
                        <SelectItem key={a.id} value={a.id}>{a.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Select an exam or assignment created by the admin.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="md:col-span-2">
            <Card>
                <CardHeader>
                    {selectedAssessment ? (
                        <>
                        <CardTitle className="flex items-center gap-2">
                           <FileText className="h-5 w-5 text-primary"/>
                           Grading: {selectedAssessment.title}
                        </CardTitle>
                        <CardDescription>
                            Enter scores for <span className="font-semibold">{teacherClasses.find(c => c.id === selectedClass)?.name}</span> - <span className="font-semibold">{form.getValues('subject')}</span>. Max Marks: 100
                        </CardDescription>
                        </>
                    ) : (
                         <CardTitle>Enter Student Grades</CardTitle>
                    )}
                </CardHeader>
                <CardContent>
                    <div className="w-full overflow-auto rounded-lg border max-h-[600px]">
                    <Table>
                        <TableHeader className="sticky top-0 bg-muted z-10">
                        <TableRow>
                            <TableHead className="w-full md:w-[250px]">Student Name</TableHead>
                            <TableHead className="hidden md:table-cell">Admission No.</TableHead>
                            <TableHead className="text-right">Grade/Score</TableHead>
                        </TableRow>
                        </TableHeader>
                        <TableBody>
                        {fields.map((field, index) => {
                            const student = students[index];
                            if (!student) return null;
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
                                 <TableCell className="hidden md:table-cell text-muted-foreground">{student.admissionNumber}</TableCell>
                                <TableCell className="text-right">
                                <FormField
                                    control={form.control}
                                    name={`grades.${index}.grade`}
                                    render={({ field }) => (
                                    <FormItem>
                                        <FormControl>
                                        <Input {...field} className="max-w-[120px] ml-auto text-right" placeholder="e.g., 85"/>
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
                </CardContent>
            </Card>
          </div>
        </div>
        
        <div className="flex justify-end pt-4">
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

