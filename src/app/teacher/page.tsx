import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, BookMarked, ClipboardCheck, FileText, ArrowRight, Bell, Calendar, Percent } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { TimetableWidget } from './timetable-widget';
import { PendingTasksWidget } from './pending-tasks-widget';
import { AbsentStudentsWidget } from './absent-students-widget';
import { MessagesWidget } from './messages-widget';
import { DashboardCharts } from './dashboard-charts';

const quickStats = [
    {
        title: "Class Size (Form 4)",
        stat: "31",
        icon: <Users className="h-6 w-6 text-muted-foreground" />,
        href: "/teacher/students",
    },
    {
        title: "Today's Attendance",
        stat: "94%",
        icon: <ClipboardCheck className="h-6 w-6 text-muted-foreground" />,
        href: "/teacher/attendance",
    },
    {
        title: "Ungraded Assignments",
        stat: "5",
        icon: <BookMarked className="h-6 w-6 text-muted-foreground" />,
        href: "/teacher/assignments",
    },
    {
        title: "Avg. Last Exam Score",
        stat: "78%",
        icon: <Percent className="h-6 w-6 text-muted-foreground" />,
        href: "/teacher/grades",
    }
];

export default function TeacherDashboard() {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="font-headline text-3xl font-bold">Welcome, Ms. Wanjiku!</h1>
        <p className="text-muted-foreground">Here's your summary for today, July 18th, 2024.</p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {quickStats.map((stat) => (
            <Link href={stat.href} key={stat.title}>
              <Card className="hover:bg-muted/50 transition-colors">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                      {stat.icon}
                  </CardHeader>
                  <CardContent>
                      <div className="text-2xl font-bold">{stat.stat}</div>
                  </CardContent>
              </Card>
            </Link>
        ))}
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-8">
            <DashboardCharts />
            <MessagesWidget />
        </div>
        <div className="lg:col-span-1 space-y-8">
            <PendingTasksWidget />
            <AbsentStudentsWidget />
            <TimetableWidget />
        </div>
      </div>
    </div>
  );
}
