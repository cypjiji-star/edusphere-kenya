'use client';

import * as React from 'react';
import { Bar, BarChart, CartesianGrid, XAxis, LabelList, YAxis } from 'recharts';
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
import type { StudentGrades } from './page';

const gradeDistributionRanges = [
  { range: 'A (80-100)', min: 80, max: 100, count: 0 },
  { range: 'B (65-79)', min: 65, max: 79, count: 0 },
  { range: 'C (50-64)', min: 50, max: 64, count: 0 },
  { range: 'D (35-49)', min: 35, max: 49, count: 0 },
  { range: 'E (0-34)', min: 0, max: 34, count: 0 },
];

const performanceChartConfig = {
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
            distribution: gradeDistributionRanges.map(r => ({ 
              name: r.range.split(' ')[0], 
              students: 0,
              range: r.range 
            })),
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
          distribution: distribution.map(d => ({ 
            name: d.range.split(' ')[0], 
            students: d.count,
            range: d.range 
          })),
        };
    }, [students]);

    // If no students with grades, show a message
    if (students.length === 0 || summary.average === 0) {
      return (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Class Performance Summary</CardTitle>
            <CardDescription>No grade data available for this class yet.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <p>No students with grades found in this class.</p>
              <p className="text-sm mt-2">Add grades to see performance statistics.</p>
            </div>
          </CardContent>
        </Card>
      );
    }

    return (
        <Card className="mb-6">
            <CardHeader>
                <CardTitle>Class Performance Summary</CardTitle>
                <CardDescription>An overview of the overall grades for the selected class.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-6 md:grid-cols-3">
                <div className="flex flex-col justify-between space-y-4 col-span-1">
                    <Card className="text-center p-4 bg-muted/50 flex-1">
                        <p className="text-4xl font-bold text-primary">{summary.average}%</p>
                        <p className="text-sm font-medium text-muted-foreground">Class Average</p>
                    </Card>
                    <div className="flex gap-4">
                        <Card className="text-center p-4 bg-muted/50 flex-1">
                            <p className="text-2xl font-bold">{summary.highest}%</p>
                            <p className="text-xs text-muted-foreground">Highest Grade</p>
                        </Card>
                        <Card className="text-center p-4 bg-muted/50 flex-1">
                            <p className="text-2xl font-bold">{summary.lowest}%</p>
                            <p className="text-xs text-muted-foreground">Lowest Grade</p>
                        </Card>
                    </div>
                </div>
                <div className="md:col-span-2">
                    <h4 className="text-sm font-medium mb-2 text-center">Grade Distribution</h4>
                    <ChartContainer config={performanceChartConfig} className="h-[200px] w-full">
                        <BarChart
                          data={summary.distribution}
                          layout="vertical"
                          margin={{ left: 10, right: 30, top: 10, bottom: 10 }}
                        >
                          <CartesianGrid horizontal={false} />
                          <YAxis 
                            dataKey="name" 
                            type="category" 
                            tickLine={false} 
                            tickMargin={10} 
                            axisLine={false} 
                            width={20} 
                            fontSize={12}
                          />
                          <XAxis type="number" hide />
                          <ChartTooltip
                            cursor={false}
                            content={<ChartTooltipContent hideLabel />}
                          />
                          <Bar 
                            dataKey="students" 
                            fill="var(--color-students)" 
                            radius={5} 
                            barSize={25}
                          >
                            <LabelList
                              dataKey="students"
                              position="right"
                              offset={8}
                              className="fill-foreground font-semibold"
                              fontSize={12}
                            />
                          </Bar>
                        </BarChart>
                    </ChartContainer>
                    <div className="text-xs text-muted-foreground text-center mt-2">
                      Number of students in each grade range
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
