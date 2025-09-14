

'use client';

import { useState, useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format, parse, isValid } from 'date-fns';
import { generateContentAction } from './actions';

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
import { Loader2, PlusCircle, Sparkles, Wand2, CalendarIcon, Paperclip, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { firestore } from '@/lib/firebase';
import { doc, getDoc, addDoc, updateDoc, setDoc, serverTimestamp, collection, Timestamp, onSnapshot, query, where } from 'firebase/firestore';


export const lessonPlanSchema = z.object({
  topic: z.string().min(3, 'Topic is required.'),
  subject: z.string().min(3, 'Subject is required.'),
  grade: z.string().min(1, 'Grade level is required.'),
  date: z.date({ required_error: 'A date for the lesson is required.' }),
  objectives: z.string().min(20, 'Objectives must be at least 20 characters.'),
  materials: z.string().optional(),
  activities: z.string().min(20, 'Activities must be at least 20 characters.'),
  assessment: z.string().min(10, 'Assessment must be at least 10 characters.'),
});

export type LessonPlanFormValues = z.infer<typeof lessonPlanSchema>;

type AiField = 'objectives' | 'activities' | 'assessment';

interface LessonPlanFormProps {
    lessonPlanId?: string;
    prefilledDate?: string;
    schoolId: string;
}

export function LessonPlanForm({ lessonPlanId, prefilledDate, schoolId }: LessonPlanFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [aiLoadingField, setAiLoadingField] = useState<AiField | null>(null);
  const { toast } = useToast();
  const [isEditMode, setIsEditMode] = useState(!!lessonPlanId);
  
  const [subjects, setSubjects] = useState<string[]>([]);
  const [grades, setGrades] = useState<string[]>([]);

  const form = useForm<LessonPlanFormValues>({
    resolver: zodResolver(lessonPlanSchema),
    defaultValues: {
      topic: '',
      subject: '',
      grade: '',
      objectives: '',
      materials: '',
      activities: '',
      assessment: '',
      date: prefilledDate && isValid(parse(prefilledDate, 'yyyy-MM-dd', new Date())) ? parse(prefilledDate, 'yyyy-MM-dd', new Date()) : new Date(),
    },
  });

  useEffect(() => {
    if (!schoolId) return;
    const teacherId = 'teacher-wanjiku'; // This should be dynamic
    const q = query(collection(firestore, `schools/${schoolId}/classes`), where('teacherId', '==', teacherId));
    const unsubscribe = onSnapshot(q, (snapshot) => {
        const uniqueSubjects = new Set<string>();
        const uniqueGrades = new Set<string>();
        snapshot.docs.forEach(doc => {
            const subjectName = doc.data().name.split(' - ')[1]; // Assumes format "Form 4 - Chemistry"
            if (subjectName) uniqueSubjects.add(subjectName);
            uniqueGrades.add(doc.data().name.split(' ')[0]);
        });
        setSubjects(Array.from(uniqueSubjects));
        setGrades(Array.from(uniqueGrades));
    });
    return () => unsubscribe();
  }, [schoolId]);

   useEffect(() => {
    if (lessonPlanId && schoolId) {
      const docRef = doc(firestore, `schools/${schoolId}/lesson-plans`, lessonPlanId);
      const unsubscribe = onSnapshot(docRef, (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          form.reset({
            ...data,
            date: data.date.toDate(),
          });
          setIsEditMode(true);
        }
      });
      return () => unsubscribe();
    }
  }, [lessonPlanId, form, schoolId]);
  
  const formState = useWatch({ control: form.control });

  async function onSubmit(values: LessonPlanFormValues) {
    setIsLoading(true);

    try {
        if (isEditMode && lessonPlanId) {
            // Update existing lesson plan
            const docRef = doc(firestore, `schools/${schoolId}/lesson-plans`, lessonPlanId);
            await updateDoc(docRef, {
                ...values,
                teacherId: 'teacher-wanjiku' // Placeholder
            });
            toast({
                title: `Lesson Plan Updated!`,
                description: `"${values.topic}" has been successfully updated.`,
            });
        } else {
            // Create new lesson plan
            await addDoc(collection(firestore, `schools/${schoolId}/lesson-plans`), {
                ...values,
                teacherId: 'teacher-wanjiku', // Placeholder
                status: 'Draft',
                createdAt: serverTimestamp(),
            });
            toast({
                title: `Lesson Plan Saved!`,
                description: `"${values.topic}" has been successfully saved.`,
            });
            form.reset({
                ...form.getValues(),
                topic: '',
                objectives: '',
                activities: '',
                assessment: '',
                materials: ''
            });
        }
    } catch (e) {
        console.error("Error saving lesson plan:", e);
        toast({ variant: 'destructive', title: 'Save failed!' });
    }
    
    setIsLoading(false);
  }
  
  const handleGenerateContent = async (field: AiField) => {
    setAiLoadingField(field);

    const result = await generateContentAction({
        topic: formState.topic,
        subject: formState.subject,
        grade: formState.grade,
        fieldToGenerate: field,
        existingContent: {
            objectives: formState.objectives,
            activities: formState.activities,
            assessment: formState.assessment,
        }
    });

    setAiLoadingField(null);
    if (result.success && result.data) {
        form.setValue(field, result.data.generatedContent);
         toast({
            title: `${field.charAt(0).toUpperCase() + field.slice(1)} Generated!`,
            description: `AI has generated content for the ${field} section.`,
        });
    } else {
         toast({
            variant: 'destructive',
            title: 'AI Generation Failed',
            description: result.error || 'Could not generate content for this field.',
        });
    }
  };

  const renderAiButton = (field: AiField, label: string) => (
    <div className="flex items-center justify-between mb-2">
        <FormLabel>{label}</FormLabel>
        <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleGenerateContent(field)}
            disabled={!formState.topic || !formState.subject || !formState.grade || !!aiLoadingField}
        >
            {aiLoadingField === field ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
                <Sparkles className="mr-2 h-4 w-4 text-accent" />
            )}
            Generate with AI
        </Button>
    </div>
  )

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid grid-cols-1 gap-x-8 gap-y-10 md:grid-cols-3">
            <div className="md:col-span-1 space-y-6">
                <h3 className="font-headline text-lg">Basic Information</h3>
                <FormField
                    control={form.control}
                    name="topic"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Lesson Topic</FormLabel>
                        <FormControl>
                            <Input placeholder="e.g., Photosynthesis" {...field} />
                        </FormControl>
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
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a subject" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {subjects.map((subject) => (
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
                  name="grade"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Grade / Form</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a grade" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {grades.map((grade) => (
                            <SelectItem key={grade} value={grade}>{grade}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Lesson Date</FormLabel>
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
                <FormField
                    control={form.control}
                    name="materials"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Materials & Resources</FormLabel>
                        <FormControl>
                            <Textarea
                                placeholder="List all required materials, e.g., Textbooks, chalk, charts, lab equipment..."
                                className="min-h-[100px]"
                                {...field}
                            />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
            <div className="md:col-span-2 space-y-6">
                 <h3 className="font-headline text-lg flex items-center gap-2">
                    <Wand2 className="h-5 w-5 text-primary"/>
                    AI-Assisted Content
                </h3>
                <FormField
                    control={form.control}
                    name="objectives"
                    render={({ field }) => (
                        <FormItem>
                        {renderAiButton('objectives', 'Learning Objectives')}
                        <FormControl>
                            <Textarea
                            placeholder="e.g., By the end of the lesson, students will be able to define photosynthesis and write its chemical equation..."
                            className="min-h-[120px]"
                            {...field}
                            />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="activities"
                    render={({ field }) => (
                        <FormItem>
                         {renderAiButton('activities', 'Lesson Activities')}
                        <FormControl>
                            <Textarea
                            placeholder="Describe the sequence of activities, e.g., 1. Introduction (5 mins), 2. Group Discussion (15 mins), 3. Practical Demo (15 mins)..."
                            className="min-h-[150px]"
                            {...field}
                            />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="assessment"
                    render={({ field }) => (
                        <FormItem>
                         {renderAiButton('assessment', 'Assessment & Evaluation')}
                        <FormControl>
                            <Textarea
                            placeholder="How will you check for understanding? e.g., Q&A session, short quiz, homework assignment..."
                            className="min-h-[120px]"
                            {...field}
                            />
                        </FormControl>
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
                                <p className="mb-2 text-sm text-muted-foreground">Attach files, links, etc.</p>
                                <p className="text-xs text-muted-foreground">(Feature coming soon)</p>
                            </div>
                            <Input id="dropzone-file" type="file" className="hidden" disabled />
                        </Label>
                    </div>
                </div>
            </div>
        </div>
        
        <Separator className="my-8"/>

        <div className="flex justify-end">
            <Button type="submit" disabled={isLoading || !!aiLoadingField} className="w-full md:w-auto">
                {isLoading ? (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                </>
                ) : isEditMode ? (
                <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                </>
                ) : (
                <>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Save Lesson Plan
                </>
                )}
            </Button>
        </div>
      </form>
    </Form>
  );
}

    