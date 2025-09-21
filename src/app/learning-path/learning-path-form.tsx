
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { learningPathSchema, generatePathAction } from './actions';

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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type LearningPathFormValues = z.infer<typeof learningPathSchema>;

const gradeLevels = [
  'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8',
  'Form 1', 'Form 2', 'Form 3', 'Form 4',
  'University/College',
];

export function LearningPathForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [learningPath, setLearningPath] = useState<string | null>(null);
  const { toast } = useToast();

  const form = useForm<LearningPathFormValues>({
    resolver: zodResolver(learningPathSchema),
    defaultValues: {
      studentName: '',
      subject: '',
      gradeLevel: '',
      learningStandard: '',
      currentUnderstanding: '',
    },
  });

  async function onSubmit(values: LearningPathFormValues) {
    setIsLoading(true);
    setLearningPath(null);

    const result = await generatePathAction(values);

    setIsLoading(false);

    if (result.success && result.data) {
      setLearningPath(result.data.learningPath);
      toast({
        title: 'Success!',
        description: 'Your personalized learning path has been generated.',
      });
    } else {
      toast({
        variant: 'destructive',
        title: 'Uh oh! Something went wrong.',
        description: result.error || 'There was a problem with your request.',
      });
    }
  }

  return (
    <div className="grid gap-12 lg:grid-cols-2 lg:gap-8">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline text-2xl">Student Details</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="studentName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Student Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Jomo Kenyatta" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="subject"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subject</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Mathematics" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="gradeLevel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Grade Level</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a grade" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {gradeLevels.map((level) => (
                            <SelectItem key={level} value={level}>{level}</SelectItem>
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
                name="learningStandard"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Learning Standard / Goal</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Understand and apply the Pythagorean theorem" {...field} />
                    </FormControl>
                    <FormDescription>
                      What specific skill or standard should the student achieve?
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="currentUnderstanding"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Current Understanding</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe what the student already knows and where they struggle..."
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                     <FormDescription>
                      Be as detailed as possible for the best results.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                   <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate Path
                  </>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
      
      <div className="space-y-4">
        <Card className="min-h-[500px] lg:sticky lg:top-24 shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline text-2xl">Generated Learning Path</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading && (
              <div className="flex flex-col items-center justify-center gap-4 text-center text-muted-foreground pt-16">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="font-semibold">Our AI is crafting the perfect plan...</p>
                <p className="text-sm">This may take a moment.</p>
              </div>
            )}
            {!isLoading && !learningPath && (
              <div className="flex flex-col items-center justify-center gap-4 text-center text-muted-foreground pt-16">
                 <Sparkles className="h-12 w-12 text-primary/50" />
                <p className="font-semibold">Your generated path will appear here.</p>
                <p className="text-sm">Fill out the form to get started.</p>
              </div>
            )}
            {learningPath && (
              <div className="space-y-4 text-sm text-foreground/90 whitespace-pre-wrap">
                {learningPath}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
