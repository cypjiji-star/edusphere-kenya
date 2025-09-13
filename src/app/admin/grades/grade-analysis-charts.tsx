
'use client';

import * as React from 'react';
import { BarChart, Bar, CartesianGrid, XAxis, LabelList, ResponsiveContainer } from 'recharts';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { TrendingDown, TrendingUp, ArrowRight, BookCopy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
  } from '@/components/ui/select';

const distributionData = [
  { name: 'A', students: 120 },
  { name: 'A-', students: 98 },
  { name: 'B+', students: 150 },
  { name: 'B', students: 180 },
  { name: 'B-', students: 110 },
  { name: 'C+', students: 80 },
  { name: 'C/C-', students: 50 },
  { name: 'D/E', students: 25 },
];

const distributionChartConfig = {
  students: {
    label: 'Students',
    color: 'hsl(var(--primary))',
  },
};

const subjectPerformanceData = [
    { subject: 'Agriculture', avg: 85, trend: 'up' },
    { subject: 'Biology', avg: 78, trend: 'up' },
    { subject: 'Business', avg: 72, trend: 'down' },
    { subject: 'Chemistry', avg: 81, trend: 'up' },
    { subject: 'English', avg: 75, trend: 'stable' },
    { subject: 'Geography', avg: 68, trend: 'down' },
    { subject: 'History', avg: 70, trend: 'stable' },
    { subject: 'Mathematics', avg: 65, trend: 'down' },
    { subject: 'Physics', avg: 79, trend: 'up' },
];

const subjectChartConfig = {
  avg: {
    label: 'Avg. Score',
    color: 'hsl(var(--chart-2))',
  },
};


export function GradeAnalysisCharts() {
  return (
     <div className="grid gap-6">
        <Card>
            <CardHeader>
                 <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <CardTitle>School-Wide Performance Analysis</CardTitle>
                        <CardDescription>Overall grade distribution for Term 1 Final Exams.</CardDescription>
                    </div>
                     <div className="flex w-full md:w-auto items-center gap-2">
                         <Select defaultValue="term1-2024">
                            <SelectTrigger className="w-full md:w-auto">
                                <SelectValue placeholder="Select term" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="term1-2024">Term 1, 2024</SelectItem>
                                <SelectItem value="term2-2024">Term 2, 2024</SelectItem>
                            </SelectContent>
                         </Select>
                         <Button variant="outline">Compare</Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <ChartContainer config={distributionChartConfig} className="h-[250px] w-full">
                <BarChart
                    accessibilityLayer
                    data={distributionData}
                    margin={{ top: 20 }}
                >
                    <CartesianGrid vertical={false} />
                    <XAxis
                    dataKey="name"
                    tickLine={false}
                    tickMargin={10}
                    axisLine={false}
                    />
                    <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent indicator="dot" />}
                    />
                    <Bar dataKey="students" fill="var(--color-students)" radius={8}>
                        <LabelList
                            position="top"
                            offset={12}
                            className="fill-foreground"
                            fontSize={12}
                        />
                    </Bar>
                </BarChart>
                </ChartContainer>
            </CardContent>
        </Card>
        <div className="grid gap-6 md:grid-cols-3">
             <Link href="/admin/grades" className="md:col-span-2">
                <Card className="h-full hover:bg-muted/50 transition-colors">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><BookCopy className="h-5 w-5 text-primary"/>Subject Performance</CardTitle>
                        <CardDescription>Average scores by subject and trend from previous exam.</CardDescription>
                    </CardHeader>
                    <CardContent className="w-full overflow-auto">
                        <div className="grid grid-cols-3 gap-y-4 gap-x-8 text-sm min-w-[400px]">
                            {subjectPerformanceData.map(item => (
                                <div key={item.subject} className="flex items-center justify-between border-b pb-2">
                                    <span className="font-medium">{item.subject}</span>
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold">{item.avg}%</span>
                                        {item.trend === 'up' && <TrendingUp className="h-4 w-4 text-green-500" />}
                                        {item.trend === 'down' && <TrendingDown className="h-4 w-4 text-red-500" />}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
             </Link>
             <div className="space-y-6">
                <Link href="/admin/grades">
                    <Card className="hover:bg-muted/50 transition-colors">
                        <CardHeader>
                            <CardTitle>Top Performing Class</CardTitle>
                            <CardDescription>Form 4 (Avg. 82%)</CardDescription>
                        </CardHeader>
                    </Card>
                </Link>
                 <Link href="/admin/grades">
                    <Card className="hover:bg-muted/50 transition-colors">
                        <CardHeader>
                            <CardTitle>Lowest Performing Class</CardTitle>
                            <CardDescription>Form 1 (Avg. 68%)</CardDescription>
                        </CardHeader>
                    </Card>
                 </Link>
                 <Button asChild variant="outline" className="w-full">
                    <Link href="/admin/grades">
                        Generate Full Report
                        <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                </Button>
            </div>
        </div>
    </div>
  );
}
