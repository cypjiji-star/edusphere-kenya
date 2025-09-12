
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
import type { Assignment } from './page';

const chartConfig = {
  submissions: {
    label: 'Submissions',
    color: 'hsl(var(--primary))',
  },
};

export function AssignmentAnalytics({ assignments }: { assignments: Assignment[] }) {
  const chartData = React.useMemo(() => {
    return assignments.map(assignment => ({
      name: assignment.title.substring(0, 20) + (assignment.title.length > 20 ? '...' : ''), // Keep labels short
      submissions: (assignment.submissions / assignment.totalStudents) * 100,
      total: assignment.totalStudents,
      submittedCount: assignment.submissions
    }));
  }, [assignments]);

  if (assignments.length === 0) {
    return null;
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Assignment Progress</CardTitle>
        <CardDescription>Submission rates for current assignments.</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
          <BarChart
            accessibilityLayer
            data={chartData}
            layout="vertical"
            margin={{ left: 120, right: 40 }}
          >
            <CartesianGrid horizontal={false} />
            <YAxis
              dataKey="name"
              type="category"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              className="text-xs"
            />
            <XAxis type="number" dataKey="submissions" hide />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  formatter={(value, name, props) => (
                    <div className="flex flex-col">
                       <span>{props.payload.submittedCount} / {props.payload.total} Submitted</span>
                       <span>{`${Math.round(Number(value))}%`}</span>
                    </div>
                  )}
                />
              }
            />
            <Bar dataKey="submissions" fill="var(--color-submissions)" radius={4}>
              <LabelList
                position="right"
                offset={10}
                className="fill-foreground text-xs"
                formatter={(value: number) => `${Math.round(value)}%`}
              />
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
