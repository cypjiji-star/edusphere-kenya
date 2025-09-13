
'use client';

import * as React from 'react';
import { Bar, BarChart, CartesianGrid, XAxis, Pie, PieChart, Cell } from 'recharts';
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
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart';
import { mockTimetableData, days } from '@/app/admin/timetable/timetable-data';
import { allAssignments } from '@/app/teacher/assignments/page';


const scheduleChartConfig = {
  classes: {
    label: 'Classes',
    color: 'hsl(var(--primary))',
  },
};

const assignmentChartConfig = {
    Ungraded: { label: 'Ungraded', color: 'hsl(var(--chart-2))' },
    Graded: { label: 'Graded', color: 'hsl(var(--chart-1))' },
    'Not Handed In': { label: 'Not Handed In', color: 'hsl(var(--destructive))' },
} satisfies React.ComponentProps<typeof ChartContainer>["config"];

export function DashboardCharts() {
  const scheduleData = React.useMemo(() => {
    const teacherName = 'Ms. Wanjiku';
    return days.map(day => {
      const daySchedule = mockTimetableData[day];
      if (!daySchedule) return { day: day.substring(0, 3), classes: 0 };
      
      const classCount = Object.values(daySchedule).filter(
        entry => entry.subject.teacher === teacherName
      ).length;

      return { day: day.substring(0, 3), classes: classCount };
    });
  }, []);

  const assignmentData = React.useMemo(() => {
    const graded = allAssignments.filter(a => a.submissions === a.totalStudents).length;
    const ungraded = allAssignments.length - graded;

    return [
        { status: 'Graded', value: graded, fill: 'hsl(var(--chart-1))' },
        { status: 'Ungraded', value: ungraded, fill: 'hsl(var(--chart-2))' },
    ].filter(item => item.value > 0);
  }, []);


  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Weekly Schedule</CardTitle>
          <CardDescription>Your teaching load for the week.</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={scheduleChartConfig} className="h-[150px] w-full">
            <BarChart
              accessibilityLayer
              data={scheduleData}
              margin={{
                top: 0,
                right: 0,
                left: 0,
                bottom: 0,
              }}
            >
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="day"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
              />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent hideLabel />}
              />
              <Bar dataKey="classes" fill="var(--color-classes)" radius={8} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Assignments Overview</CardTitle>
          <CardDescription>Current status of your assignments.</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 pb-0">
          <ChartContainer
            config={assignmentChartConfig}
            className="mx-auto aspect-square h-full max-h-[200px]"
          >
            <PieChart>
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent hideLabel />}
              />
              <Pie
                data={assignmentData}
                dataKey="value"
                nameKey="status"
                innerRadius={50}
                strokeWidth={5}
              >
                {assignmentData.map((entry) => (
                  <Cell key={`cell-${entry.status}`} fill={entry.fill} />
                ))}
              </Pie>
              <ChartLegend
                content={<ChartLegendContent nameKey="status" />}
                className="-translate-y-2 flex-wrap gap-2 [&>*]:basis-1/2 [&>*]:justify-center"
              />
            </PieChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}
