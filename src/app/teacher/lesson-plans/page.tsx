
'use client';

import * as React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, BookOpen, ArrowRight, Search, FileDown, Filter, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LessonPlanCalendar } from './lesson-plan-calendar';
import { cn } from '@/lib/utils';
import { useAtom } from 'jotai';
import { lessonPlansAtom } from './data';
import type { LessonPlan, LessonPlanStatus } from './data';


const subjects = ['All Subjects', 'Biology', 'Chemistry', 'English', 'History', 'Mathematics', 'Physics'];
const grades = ['All Grades', 'Grade 6', 'Form 1', 'Form 2', 'Form 3', 'Form 4'];

const statusColors: Record<LessonPlanStatus, string> = {
    'Published': 'bg-blue-500',
    'Draft': 'bg-gray-500',
    'Completed': 'bg-green-600',
    'In Progress': 'bg-yellow-500',
    'Skipped': 'bg-red-500',
}


export default function LessonPlansPage() {
  const [allLessonPlans] = useAtom(lessonPlansAtom);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [filteredSubject, setFilteredSubject] = React.useState('All Subjects');
  const [filteredGrade, setFilteredGrade] = React.useState('All Grades');

  const lessonPlans = allLessonPlans.filter(plan => 
    (plan.topic.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (filteredSubject === 'All Subjects' || plan.subject === filteredSubject) &&
    (filteredGrade === 'All Grades' || plan.gradeLevel === filteredGrade)
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8">
        <div className="flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between mb-6">
            <div className="text-left">
                <h1 className="font-headline text-3xl font-bold flex items-center gap-2">
                    <BookOpen className="h-8 w-8 text-primary"/>
                    Lesson Plans
                </h1>
                <p className="text-muted-foreground">Create, manage, and share your lesson plans.</p>
            </div>
            <Button asChild className="w-full md:w-auto">
                <Link href="/teacher/lesson-plans/new">
                <PlusCircle className="mr-2" />
                Create New Lesson Plan
                </Link>
            </Button>
        </div>

      <Tabs defaultValue="calendar-view">
        <div className="flex items-center justify-between">
            <TabsList>
                <TabsTrigger value="list-view">List View</TabsTrigger>
                <TabsTrigger value="calendar-view">Calendar View</TabsTrigger>
            </TabsList>
        </div>
        <TabsContent value="list-view">
            <Card className="mt-4">
                <CardHeader>
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div className="relative w-full md:max-w-sm">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="search"
                                placeholder="Search lesson plans..."
                                className="w-full bg-background pl-8"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex w-full flex-col gap-2 md:w-auto md:flex-row md:items-center">
                            <Select value={filteredSubject} onValueChange={setFilteredSubject}>
                                <SelectTrigger className="w-full md:w-[180px]">
                                    <SelectValue placeholder="Filter by subject" />
                                </SelectTrigger>
                                <SelectContent>
                                    {subjects.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                </SelectContent>
                            </Select>
                            <Select value={filteredGrade} onValueChange={setFilteredGrade}>
                                <SelectTrigger className="w-full md:w-[180px]">
                                    <SelectValue placeholder="Filter by grade" />
                                </SelectTrigger>
                                <SelectContent>
                                    {grades.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                                </SelectContent>
                            </Select>
                            <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="w-full md:w-auto">
                                Export
                                <ChevronDown className="ml-2 h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                                <DropdownMenuItem disabled>
                                <FileDown className="mr-2" />
                                Export All (PDF)
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {lessonPlans.length > 0 ? (
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {lessonPlans.map((plan) => (
                            <Card key={plan.id}>
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <CardTitle className="font-headline text-xl pt-2">{plan.topic}</CardTitle>
                                    <Badge className={cn("text-white", statusColors[plan.status])}>
                                        {plan.status}
                                    </Badge>
                                </div>
                                <CardDescription>{plan.subject} - {plan.gradeLevel}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground">
                                    Last Updated: {new Date(plan.lastUpdated).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' })}
                                </p>
                            </CardContent>
                            <CardFooter>
                                <Button asChild variant="outline" className="w-full">
                                    <Link href={`/teacher/lesson-plans/new?id=${plan.id}`}>
                                        View / Edit
                                        <ArrowRight className="ml-2 h-4 w-4" />
                                    </Link>
                                </Button>
                            </CardFooter>
                            </Card>
                        ))}
                        </div>
                    ) : (
                        <div className="flex min-h-[400px] items-center justify-center rounded-lg border-2 border-dashed border-muted">
                            <div className="text-center">
                            <BookOpen className="mx-auto h-12 w-12 text-muted-foreground" />
                            <h3 className="mt-4 text-xl font-semibold">No Lesson Plans Found</h3>
                            <p className="mt-2 text-sm text-muted-foreground">No plans match your current filters. Why not create one?</p>
                            <Button asChild className="mt-6">
                                <Link href="/teacher/lesson-plans/new">
                                <PlusCircle className="mr-2" />
                                Create a New Lesson Plan
                                </Link>
                            </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </TabsContent>
        <TabsContent value="calendar-view">
             <Card className="mt-4">
                <CardHeader>
                    <CardTitle>Lesson Plan Calendar</CardTitle>
                    <CardDescription>A monthly overview of your scheduled lesson plans.</CardDescription>
                </CardHeader>
                <CardContent>
                    <LessonPlanCalendar lessonPlans={allLessonPlans} />
                </CardContent>
             </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
