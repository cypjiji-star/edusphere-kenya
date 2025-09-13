
'use client';

import { useState, useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format, parse, isValid } from 'date-fns';
import { lessonPlanSchema, generateContentAction, LessonPlanFormValues } from './actions';

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
import { useAtom } from 'jotai';
import { lessonPlansAtom } from '../data';
import type { LessonPlan } from '../data';


const teacherClasses = [
  { id: 'f4-chem', name: 'Form 4 - Chemistry', subject: 'Chemistry', grade: 'Form 4' },
  { id: 'f3-math', name: 'Form 3 - Mathematics', subject: 'Mathematics', grade: 'Form 3' },
  { id: 'f2-phys', name: 'Form 2 - Physics', subject: 'Physics', grade: 'Form 2' },
  { id: 'f1-eng', name: 'Form 1 - English', subject: 'English', grade: 'Form 1'},
  { id: 'g6-hist', name: 'Grade 6 - History', subject: 'History', grade: 'Grade 6'},
];

type AiField = 'objectives' | 'activities' | 'assessment';

interface LessonPlanFormProps {
    lessonPlanId?: string;
    prefilledDate?: string;
}

export function LessonPlanForm({ lessonPlanId, prefilledDate }: LessonPlanFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [aiLoadingField, setAiLoadingField] = useState<AiField | null>(null);
  const { toast } = useToast();
  const [isEditMode, setIsEditMode] = useState(!!lessonPlanId);
  const [allLessonPlans, setAllLessonPlans] = useAtom(lessonPlansAtom);

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
      date: prefilledDate && isValid(parse(prefilledDate, 'yyyy-MM-dd', new Date())) ? parse(prefilledDate, 'yyyy-MM-dd', new Date()) : undefined,
    },
  });

   useEffect(() => {
    if (lessonPlanId) {
      const lessonPlanToEdit = allLessonPlans.find(lp => lp.id === lessonPlanId);
      if (lessonPlanToEdit) {
        setIsEditMode(true);
        form.reset({
            topic: lessonPlanToEdit.topic,
            subject: lessonPlanToEdit.subject,
            grade: lessonPlanToEdit.gradeLevel,
            date: new Date(lessonPlanToEdit.lastUpdated),
            objectives: lessonPlanToEdit.objectives || `Define ${lessonPlanToEdit.topic} and explain its importance.`,
            activities: lessonPlanToEdit.activities || `1. Introduction to ${lessonPlanToEdit.topic}.\n2. Group discussion.`,
            assessment: lessonPlanToEdit.assessment || `Short quiz on the key concepts of ${lessonPlanToEdit.topic}.`,
            materials: lessonPlanToEdit.materials || 'Textbook, whiteboard, markers.'
        });
      }
    }
  }, [lessonPlanId, form, allLessonPlans]);
  
  const formState = useWatch({ control: form.control });

  async function onSubmit(values: LessonPlanFormValues) {
    setIsLoading(true);

    if (isEditMode && lessonPlanId) {
        // Update existing lesson plan
        setAllLessonPlans(prevPlans => prevPlans.map(p => p.id === lessonPlanId ? {
            ...p,
            topic: values.topic,
            subject: values.subject,
            gradeLevel: values.grade,
            lastUpdated: format(values.date, 'yyyy-MM-dd'),
            objectives: values.objectives,
            activities: values.activities,
            assessment: values.assessment,
            materials: values.materials,
        } : p));
        toast({
            title: `Lesson Plan Updated!`,
            description: `"${values.topic}" has been successfully updated.`,
        });
    } else {
        // Create new lesson plan
        const newPlan: LessonPlan = {
            id: `lp-${Date.now()}`,
            topic: values.topic,
            subject: values.subject,
            gradeLevel: values.grade,
            lastUpdated: format(values.date, 'yyyy-MM-dd'),
            status: 'Draft',
            objectives: values.objectives,
            activities: values.activities,
            assessment: values.assessment,
            materials: values.materials,
        };
        setAllLessonPlans(prevPlans => [newPlan, ...prevPlans]);
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
                          {[...new Set(teacherClasses.map(c => c.subject))].map((subject) => (
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
                          {[...new Set(teacherClasses.map(c => c.grade))].map((grade) => (
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
