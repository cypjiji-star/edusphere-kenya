
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  FileText,
  User,
  ChevronDown,
  FileDown,
  BarChart2,
  Trophy,
  ArrowUp,
  ArrowDown,
  MessageCircle,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, CartesianGrid, XAxis, YAxis } from 'recharts';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { Separator } from '@/components/ui/separator';

const childrenData = [
  { id: 'child-1', name: 'John Doe', class: 'Form 4' },
  { id: 'child-2', name: 'Jane Doe', class: 'Form 1' },
];

const gradeData = {
  'child-1': {
    summary: {
      overall: '82%',
      rank: '5th',
      classSize: 42,
      trend: 'up' as const,
      trendValue: '3%',
      highest: 'Chemistry (91%)',
      lowest: 'History (72%)',
    },
    subjects: [
      { name: 'Mathematics', cat1: 80, midTerm: 85, cat2: 78, final: 84, average: 82, grade: 'A-', comment: 'Good progress, but needs to work on algebraic expressions.' },
      { name: 'English', cat1: 88, midTerm: 90, cat2: 85, final: 87, average: 88, grade: 'A', comment: 'Excellent work in literature analysis.' },
      { name: 'Kiswahili', cat1: 75, midTerm: 78, cat2: 80, final: 82, average: 79, grade: 'A-', comment: 'Improvement in vocabulary is needed.' },
      { name: 'Chemistry', cat1: 90, midTerm: 92, cat2: 88, final: 94, average: 91, grade: 'A', comment: 'Outstanding performance in practicals.' },
      { name: 'Physics', cat1: 78, midTerm: 80, cat2: 75, final: 79, average: 78, grade: 'A-', comment: 'Good understanding of core concepts.' },
      { name: 'History', cat1: 70, midTerm: 72, cat2: 74, final: 72, average: 72, grade: 'B', comment: 'More attention to detail in essays is required.' },
    ]
  },
  'child-2': {
    summary: {
      overall: '88%',
      rank: '3rd',
      classSize: 35,
      trend: 'up' as const,
      trendValue: '5%',
      highest: 'English (94%)',
      lowest: 'Mathematics (80%)',
    },
    subjects: [
        { name: 'Mathematics', cat1: 78, midTerm: 82, cat2: 79, final: 81, average: 80, grade: 'A-', comment: 'Excellent effort.' },
        { name: 'English', cat1: 92, midTerm: 95, cat2: 93, final: 96, average: 94, grade: 'A', comment: 'Top of the class. Keep it up.' },
    ]
  }
};

const chartConfig = {
  average: { label: 'Average Score', color: 'hsl(var(--primary))' },
};

export default function ParentGradesPage() {
  const [selectedChild, setSelectedChild] = React.useState(childrenData[0].id);
  const data = gradeData[selectedChild as keyof typeof gradeData];
  const chartData = data.subjects.map(s => ({ name: s.name.substring(0, 3).toUpperCase(), average: s.average }));

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="mb-2">
        <h1 className="font-headline text-3xl font-bold flex items-center gap-2">
          <FileText className="h-8 w-8 text-primary" />
          Grades &amp; Exams
        </h1>
        <p className="text-muted-foreground">View academic performance and report cards.</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              <Select value={selectedChild} onValueChange={setSelectedChild}>
                <SelectTrigger className="w-full md:w-[240px]">
                  <SelectValue placeholder="Select a child" />
                </SelectTrigger>
                <SelectContent>
                  {childrenData.map((child) => (
                    <SelectItem key={child.id} value={child.id}>{child.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex w-full flex-col sm:flex-row md:w-auto items-center gap-2">
                <Select defaultValue="term2-2024">
                    <SelectTrigger className="w-full md:w-auto">
                        <SelectValue placeholder="Select Term" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="term2-2024">Term 2, 2024</SelectItem>
                        <SelectItem value="term1-2024">Term 1, 2024</SelectItem>
                    </SelectContent>
                </Select>
                <Select disabled>
                    <SelectTrigger className="w-full md:w-auto">
                        <SelectValue placeholder="All Exams" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Exams</SelectItem>
                        <SelectItem value="midterm">Mid-Term</SelectItem>
                        <SelectItem value="endterm">End-Term</SelectItem>
                    </SelectContent>
                </Select>
            </div>
          </div>
        </CardHeader>
      </Card>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
            <CardHeader className="pb-2">
                <CardDescription>Overall Average</CardDescription>
                <CardTitle className="text-4xl">{data.summary.overall}</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="text-xs text-muted-foreground flex items-center">
                    {data.summary.trend === 'up' ? <ArrowUp className="h-4 w-4 text-green-500"/> : <ArrowDown className="h-4 w-4 text-red-500"/>}
                    {data.summary.trendValue} vs last term
                </div>
            </CardContent>
        </Card>
        <Card>
            <CardHeader className="pb-2">
                <CardDescription>Class Rank</CardDescription>
                <CardTitle className="text-4xl">{data.summary.rank}</CardTitle>
            </CardHeader>
            <CardContent>
                 <div className="text-xs text-muted-foreground">out of {data.summary.classSize} students</div>
            </CardContent>
        </Card>
        <Card>
            <CardHeader className="pb-2">
                <CardDescription>Highest Score</CardDescription>
                <CardTitle className="text-2xl">{data.summary.highest}</CardTitle>
            </CardHeader>
        </Card>
        <Card>
            <CardHeader className="pb-2">
                <CardDescription>Lowest Score</CardDescription>
                <CardTitle className="text-2xl">{data.summary.lowest}</CardTitle>
            </CardHeader>
        </Card>
      </div>

       <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><BarChart2 className="h-5 w-5 text-primary"/>Performance by Subject</CardTitle>
            </CardHeader>
            <CardContent>
                 <ChartContainer config={chartConfig} className="h-[250px] w-full">
                    <BarChart data={chartData}>
                        <CartesianGrid vertical={false} />
                        <XAxis dataKey="name" tickLine={false} tickMargin={10} axisLine={false} />
                        <YAxis />
                        <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
                        <Bar dataKey="average" fill="var(--color-average)" radius={8} />
                    </BarChart>
                </ChartContainer>
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>Detailed Grade Report</CardTitle>
                <CardDescription>A breakdown of scores for each subject in the current term.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="w-full overflow-auto rounded-lg border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Subject</TableHead>
                                <TableHead className="text-center">CAT 1</TableHead>
                                <TableHead className="text-center">Mid-Term</TableHead>
                                <TableHead className="text-center">CAT 2</TableHead>
                                <TableHead className="text-center">Final Exam</TableHead>
                                <TableHead className="text-center font-bold">Average</TableHead>
                                <TableHead className="text-center font-bold">Grade</TableHead>
                                <TableHead>Teacher's Comment</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data.subjects.map(subject => (
                                <TableRow key={subject.name}>
                                    <TableCell className="font-medium">{subject.name}</TableCell>
                                    <TableCell className="text-center">{subject.cat1}</TableCell>
                                    <TableCell className="text-center">{subject.midTerm}</TableCell>
                                    <TableCell className="text-center">{subject.cat2}</TableCell>
                                    <TableCell className="text-center">{subject.final}</TableCell>
                                    <TableCell className="text-center font-bold">
                                        <Badge variant="secondary">{subject.average}</Badge>
                                    </TableCell>
                                    <TableCell className="text-center font-bold">
                                         <Badge>{subject.grade}</Badge>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground text-sm">
                                        <div className="flex items-center justify-between">
                                            <span>{subject.comment}</span>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" disabled>
                                                <MessageCircle className="h-4 w-4"/>
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
             <CardFooter>
                 <Button disabled>
                    <FileDown className="mr-2 h-4 w-4" />
                    Download Official Report Card
                </Button>
            </CardFooter>
        </Card>

    </div>
  );
}
