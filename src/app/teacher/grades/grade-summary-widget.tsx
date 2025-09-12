'use client';

import * as React from 'react';
import { Bar, BarChart, CartesianGrid, XAxis, ResponsiveContainer, LabelList } from 'recharts';
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
import { Separator } from '@/components/ui/separator';

type StudentGrades = {
  studentId: string;
  overall: number;
};

const gradeDistributionRanges = [
  { range: 'A (80-100)', min: 80, max: 100, count: 0 },
  { range: 'B (65-79)', min: 65, max: 79, count: 0 },
  { range: 'C (50-64)', min: 50, max: 64, count: 0 },
  { range: 'D (35-49)', min: 35, max: 49, count: 0 },
  { range: 'E (0-34)', min: 0, max: 34, count: 0 },
];

const chartConfig = {
  students: {
    label: 'Students',
    color: 'hsl(var(--primary))',
  },
};

export function GradeSummaryWidget({ students }: { students: StudentGrades[] }) {
  const summary = React.useMemo(() => {
    if (!students || students.length === 0) {
      return {
        average: 0,
        highest: 0,
        lowest: 0,
        distribution: gradeDistributionRanges.map(r => ({ name: r.range, students: 0 })),
      };
    }

    const grades = students.map(s => s.overall);
    const average = grades.reduce((acc, grade) => acc + grade, 0) / grades.length;
    const highest = Math.max(...grades);
    const lowest = Math.min(...grades);

    const distribution = [...gradeDistributionRanges.map(r => ({ ...r, count: 0 }))];
    students.forEach(student => {
      const grade = student.overall;
      const range = distribution.find(r => grade >= r.min && grade <= r.max);
      if (range) {
        range.count++;
      }
    });

    return {
      average: Math.round(average),
      highest,
      lowest,
      distribution: distribution.map(d => ({ name: d.range, students: d.count })),
    };
  }, [students]);

  return (
    <Card className="mb-6 bg-muted/30">
      <CardHeader>
        <CardTitle>Class Performance Summary</CardTitle>
        <CardDescription>An overview of the overall grades for the selected class.</CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-1 gap-6 md:grid-cols-4">
        <div className="flex flex-col justify-between space-y-4 col-span-1">
            <div className="flex gap-4">
                <div className="text-center p-4 bg-background rounded-lg flex-1">
                    <p className="text-3xl font-bold text-primary">{summary.average}%</p>
                    <p className="text-sm font-medium text-muted-foreground">Class Average</p>
                </div>
            </div>
             <div className="flex gap-4">
                <div className="text-center p-2 bg-background rounded-lg flex-1">
                    <p className="text-xl font-bold">{summary.highest}%</p>
                    <p className="text-xs text-muted-foreground">Highest Grade</p>
                </div>
                <div className="text-center p-2 bg-background rounded-lg flex-1">
                    <p className="text-xl font-bold">{summary.lowest}%</p>
                    <p className="text-xs text-muted-foreground">Lowest Grade</p>
                </div>
            </div>
        </div>
        <div className="md:col-span-3">
          <ChartContainer config={chartConfig} className="h-[150px] w-full">
            <BarChart
              accessibilityLayer
              data={summary.distribution}
              layout="vertical"
              margin={{ left: 10, right: 50 }}
            >
              <CartesianGrid horizontal={false} />
              <XAxis type="number" hide />
              <XAxis dataKey="name" type="category" tickLine={false} tickMargin={10} axisLine={false} />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent hideLabel />}
              />
              <Bar dataKey="students" fill="var(--color-students)" radius={5} barSize={20}>
                 <LabelList
                  position="right"
                  offset={10}
                  className="fill-foreground font-bold"
                  fontSize={12}
                />
              </Bar>
            </BarChart>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  );
}
