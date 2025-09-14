
'use client';

import * as React from 'react';
import { Bar, BarChart, CartesianGrid, XAxis, Pie, PieChart, Cell, Loader2 } from 'recharts';
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
import { firestore } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

type TimetableData = Record<string, Record<string, { subject: { teacher: string } }>>;

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

const scheduleChartConfig = {
  classes: {
    label: 'Classes',
    color: 'hsl(var(--primary))',
  },
};

const assignmentChartConfig = {
    Ungraded: { label: 'Ungraded', color: 'hsl(var(--chart-2))' },
    Graded: { label: 'Graded', color: 'hsl(var(--chart-1))' },
} satisfies React.ComponentProps<typeof ChartContainer>["config"];

export function DashboardCharts() {
    const [scheduleData, setScheduleData] = React.useState<any[]>([]);
    const [assignmentData, setAssignmentData] = React.useState<any[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);

    React.useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            const teacherId = 'teacher-wanjiku'; // Dynamic teacher ID

            // Fetch Schedule Data
            try {
                const timetablesSnapshot = await getDocs(collection(firestore, 'timetables'));
                const dailyCounts = days.map(day => {
                    let classCount = 0;
                    timetablesSnapshot.forEach(doc => {
                        const timetable = doc.data() as TimetableData;
                        const daySchedule = timetable[day];
                        if (daySchedule) {
                            classCount += Object.values(daySchedule).filter(
                                lesson => lesson.subject.teacher === 'Ms. Wanjiku' // Hardcoded for now
                            ).length;
                        }
                    });
                    return { day: day.substring(0, 3), classes: classCount };
                });
                setScheduleData(dailyCounts);

                // Fetch Assignment Data
                const assignmentsSnapshot = await getDocs(query(collection(firestore, 'assignments'), where('teacherId', '==', teacherId)));
                let graded = 0;
                let ungraded = 0;
                assignmentsSnapshot.forEach(doc => {
                    const assignment = doc.data();
                    if (assignment.submissions === assignment.totalStudents) {
                        graded++;
                    } else {
                        ungraded++;
                    }
                });

                setAssignmentData([
                    { status: 'Graded', value: graded, fill: 'hsl(var(--chart-1))' },
                    { status: 'Ungraded', value: ungraded, fill: 'hsl(var(--chart-2))' },
                ].filter(item => item.value > 0));

            } catch (error) {
                console.error("Error fetching chart data:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

    if (isLoading) {
        return (
            <div className="grid gap-6 md:grid-cols-2">
                <Card><CardHeader><CardTitle>Weekly Schedule</CardTitle></CardHeader><CardContent className="flex items-center justify-center h-[150px]"><Loader2 className="h-8 w-8 animate-spin text-primary"/></CardContent></Card>
                <Card><CardHeader><CardTitle>Assignments Overview</CardTitle></CardHeader><CardContent className="flex items-center justify-center h-[200px]"><Loader2 className="h-8 w-8 animate-spin text-primary"/></CardContent></Card>
            </div>
        )
    }

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
