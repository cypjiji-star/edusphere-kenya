
'use client';

import * as React from 'react';
import { Bar, BarChart, CartesianGrid, XAxis, LabelList, Pie, PieChart, Cell, YAxis } from 'recharts';
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
  ChartLegendContent
} from '@/components/ui/chart';
import type { Student } from './page';

const gradeRanges = [
    { range: 'A (80-100)', min: 80, max: 100, count: 0 },
    { range: 'B (65-79)', min: 65, max: 79, count: 0 },
    { range: 'C (50-64)', min: 50, max: 64, count: 0 },
    { range: 'D (35-49)', min: 35, max: 49, count: 0 },
    { range: 'E (0-34)', min: 0, max: 34, count: 0 },
];

const ATTENDANCE_COLORS = {
    present: 'hsl(142.1 76.2% 42.2%)',
    late: 'hsl(38 92% 50%)',
    absent: 'hsl(0 84.2% 60.2%)',
};


const performanceChartConfig = {
  students: {
    label: 'Students',
    color: 'hsl(var(--primary))',
  },
};

const attendanceChartConfig = {
  present: {
    label: 'Present',
    color: ATTENDANCE_COLORS.present,
  },
  late: {
    label: 'Late',
    color: ATTENDANCE_COLORS.late,
  },
  absent: {
    label: 'Absent',
    color: ATTENDANCE_COLORS.absent,
  },
} satisfies React.ComponentProps<typeof ChartContainer>["config"];

export function ClassAnalytics({ students }: { students: Student[] }) {
    
    const performanceData = React.useMemo(() => {
        const data = [...gradeRanges.map(r => ({ ...r, count: 0 }))];
        students.forEach(student => {
            const grade = parseInt(student.overallGrade.replace('%', ''), 10);
            const range = data.find(r => grade >= r.min && grade <= r.max);
            if (range) {
                range.count++;
            }
        });
        return data.map(d => ({ name: d.range.split(' ')[0], students: d.count }));
    }, [students]);

    const attendanceData = React.useMemo(() => {
        const counts: Record<Student['attendance'], number> = { present: 0, late: 0, absent: 0 };
        students.forEach(student => {
            counts[student.attendance]++;
        });
        return Object.entries(counts).map(([name, value]) => ({
            name: name as Student['attendance'],
            value,
            fill: attendanceChartConfig[name as Student['attendance']].color,
        })).filter(d => d.value > 0);
    }, [students]);

    const totalStudents = students.length;

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2 mb-6">
      <Card>
        <CardHeader>
          <CardTitle>Performance Snapshot</CardTitle>
          <CardDescription>Distribution of overall grades in the class.</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={performanceChartConfig} className="min-h-[200px] w-full">
            <BarChart
              accessibilityLayer
              data={performanceData}
              layout="horizontal"
              margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
            >
              <CartesianGrid vertical={false} />
              <YAxis dataKey="name" type="category" tickLine={false} tickMargin={10} axisLine={false} width={20} />
              <XAxis dataKey="students" type="number" hide />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent hideLabel />}
              />
              <Bar dataKey="students" fill="var(--color-students)" radius={5} barSize={20}>
                 <LabelList
                  position="right"
                  offset={8}
                  className="fill-foreground font-bold"
                  fontSize={12}
                />
              </Bar>
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Today's Attendance</CardTitle>
          <CardDescription>Live overview of student attendance.</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 pb-0">
          <ChartContainer
            config={attendanceChartConfig}
            className="mx-auto aspect-square h-full max-h-[250px]"
          >
            <PieChart>
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent hideLabel />}
              />
              <Pie
                data={attendanceData}
                dataKey="value"
                nameKey="name"
                innerRadius={60}
                strokeWidth={5}
              >
                 <LabelList
                    dataKey="value"
                    className="fill-background font-bold"
                    stroke="none"
                    fontSize={16}
                 />
                 {attendanceData.map((entry) => (
                    <Cell key={`cell-${entry.name}`} fill={entry.fill} />
                 ))}
              </Pie>
              <ChartLegend
                content={<ChartLegendContent nameKey="name" />}
                className="-translate-y-2 flex-wrap gap-2 [&>*]:basis-1/4 [&>*]:justify-center"
              />
            </PieChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}
