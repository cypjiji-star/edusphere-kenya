
'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, BookOpen, Check, MessageSquareWarning, Send } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

// Mock Data - In a real app, you'd fetch this by ID
const mockLessonPlan = {
  id: 'lp-3',
  topic: 'Acid-Base Titration',
  subject: 'Chemistry',
  grade: 'Form 4',
  date: '2024-07-21',
  status: 'In Progress',
  teacher: {
    name: 'Ms. Wanjiku',
    avatarUrl: 'https://picsum.photos/seed/teacher-wanjiku/100',
  },
  content: {
    objectives: [
        'Define titration and understand its purpose.',
        'Identify the key apparatus used in a titration.',
        'Perform a simple acid-base titration and record results accurately.',
        'Calculate the concentration of an unknown solution using titration data.'
    ],
    materials: 'Burette, pipette, conical flask, white tile, phenolphthalein indicator, standard solution (e.g., 0.1M HCl), unknown solution (e.g., NaOH).',
    activities: [
      { title: 'Introduction (10 mins)', description: 'Recap acids, bases, and neutralization. Introduce the concept of titration and its real-world applications.' },
      { title: 'Apparatus Demonstration (15 mins)', description: 'Show and explain the function of each piece of equipment. Demonstrate correct handling, reading scales, and avoiding parallax error.' },
      { title: 'Practical Titration (40 mins)', description: 'In pairs, students perform a titration of HCl with NaOH. Teacher circulates to assist and check technique.' },
      { title: 'Calculation & Conclusion (15 mins)', description: 'Guide students through the calculation steps on the blackboard. Students conclude the experiment in their lab books.' }
    ],
    assessment: 'Students will be assessed on their practical skills during the experiment, the accuracy of their recorded results, and the correctness of their final calculation. A follow-up homework assignment with titration problems will also be given.',
  }
};


export default function LessonPlanReviewPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const plan = mockLessonPlan; // Using mock data
  const [clientReady, setClientReady] = React.useState(false);

  React.useEffect(() => {
    setClientReady(true);
  }, []);

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <Button asChild variant="outline" size="sm">
          <Link href="/admin/lesson-plans">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Submissions
          </Link>
        </Button>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
            <Card>
                <CardHeader>
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                        <div>
                            <CardTitle className="font-headline text-2xl flex items-center gap-2">
                                <BookOpen className="h-6 w-6 text-primary"/>
                                {plan.topic}
                            </CardTitle>
                            <CardDescription>
                                {plan.subject} - {plan.grade}
                            </CardDescription>
                        </div>
                         {clientReady && (
                            <div className="text-sm">
                                <p><span className="font-semibold">Date:</span> {new Date(plan.date).toLocaleDateString()}</p>
                                <p><span className="font-semibold">Status:</span> <Badge>{plan.status}</Badge></p>
                            </div>
                         )}
                    </div>
                     <Separator className="mt-4" />
                     <div className="pt-4 flex items-center gap-3">
                        <Avatar>
                            <AvatarImage src={plan.teacher.avatarUrl} alt={plan.teacher.name} />
                            <AvatarFallback>{plan.teacher.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                            <p className="font-semibold">{plan.teacher.name}</p>
                            <p className="text-xs text-muted-foreground">Submitting Teacher</p>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-8">
                    <section>
                        <h3 className="font-semibold text-lg mb-2 border-b pb-2">Learning Objectives</h3>
                        <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                            {plan.content.objectives.map((obj, i) => <li key={i}>{obj}</li>)}
                        </ul>
                    </section>
                     <section>
                        <h3 className="font-semibold text-lg mb-2 border-b pb-2">Materials & Resources</h3>
                        <p className="text-muted-foreground">{plan.content.materials}</p>
                    </section>
                     <section>
                        <h3 className="font-semibold text-lg mb-2 border-b pb-2">Lesson Activities &amp; Procedure</h3>
                        <div className="space-y-4">
                            {plan.content.activities.map((act, i) => (
                                <div key={i} className="flex gap-4">
                                    <div className="flex flex-col items-center">
                                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">{i + 1}</div>
                                        {i < plan.content.activities.length - 1 && <div className="w-px flex-1 bg-border my-1"></div>}
                                    </div>
                                    <div>
                                        <p className="font-semibold">{act.title}</p>
                                        <p className="text-muted-foreground text-sm">{act.description}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                      <section>
                        <h3 className="font-semibold text-lg mb-2 border-b pb-2">Assessment &amp; Evaluation</h3>
                        <p className="text-muted-foreground">{plan.content.assessment}</p>
                    </section>
                </CardContent>
            </Card>
        </div>
        <div className="lg:col-span-1">
            <Card className="sticky top-20">
                <CardHeader>
                    <CardTitle>Administrative Actions</CardTitle>
                    <CardDescription>Approve this lesson plan or request changes.</CardDescription>
                </CardHeader>
                <CardContent>
                     <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="feedback-comments">Feedback / Comments (Optional)</Label>
                            <Textarea id="feedback-comments" placeholder="Provide feedback for the teacher..." className="min-h-[150px]" />
                        </div>
                    </div>
                </CardContent>
                 <CardFooter className="flex flex-col gap-2">
                    <Button className="w-full" variant="outline" disabled>
                        <MessageSquareWarning className="mr-2 h-4 w-4"/>
                        Request Changes
                    </Button>
                    <Button className="w-full" disabled>
                        <Check className="mr-2 h-4 w-4"/>
                        Approve Lesson Plan
                    </Button>
                </CardFooter>
            </Card>
        </div>
      </div>
    </div>
  );
}

