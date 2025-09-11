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

const quickStats = [
    {
        title: "Total Students",
        stat: "124",
        icon: <Users className="h-6 w-6 text-muted-foreground" />,
    },
    {
        title: "Attendance Rate",
        stat: "92%",
        icon: <Percent className="h-6 w-6 text-muted-foreground" />,
    },
    {
        title: "Overdue Assignments",
        stat: "5",
        icon: <BookMarked className="h-6 w-6 text-muted-foreground" />,
    },
];

const announcements = [
    {
        title: "Mid-term Break Announcement",
        date: "2024-07-15",
        category: "School-wide",
        variant: "default" as const,
        content: "Please be advised that the school will be closed for mid-term break from July 22nd to July 26th. Classes will resume on July 29th.",
    },
    {
        title: "Form 4 - Guest Speaker Session",
        date: "2024-07-13",
        category: "Class Update",
        variant: "outline" as const,
        content: "Reminder: Dr. Onyango will be giving a talk on renewable energy to all Form 4 science classes tomorrow during Period 3.",
    },
    {
        title: "Science Fair Preparation Meeting",
        date: "2024-07-12",
        category: "Event",
        variant: "secondary" as const,
        content: "A mandatory meeting for all science teachers will be held on Monday, July 15th at 3:00 PM in the staff room to discuss Science Fair preparations.",
    },
    {
        title: "New Library Books Available",
        date: "2024-07-11",
        category: "Resources",
        variant: "secondary" as const,
        content: "The library has received a new shipment of fiction and non-fiction books. Encourage your students to visit.",
    }
];

const coreModules = [
  {
    title: 'Manage Students',
    description: 'View student profiles, track progress, and manage class lists.',
    icon: <Users className="h-8 w-8 text-primary" />,
    href: '/teacher/students',
    cta: 'View Students',
  },
  {
    title: 'Track Attendance',
    description: 'Mark and review daily and per-subject student attendance.',
    icon: <ClipboardCheck className="h-8 w-8 text-primary" />,
    href: '/teacher/attendance',
    cta: 'Take Attendance',
  },
  {
    title: 'Create & Grade Assignments',
    description: 'Design, distribute, and grade assignments for your classes.',
    icon: <BookMarked className="h-8 w-8 text-primary" />,
    href: '/teacher/assignments',
    cta: 'Manage Assignments',
  },
  {
    title: 'Enter Grades',
    description: 'Input student marks and generate termly progress reports.',
    icon: <FileText className="h-8 w-8 text-primary" />,
    href: '/teacher/grades',
    cta: 'View Grades',
  },
];

export default function TeacherDashboard() {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="font-headline text-3xl font-bold">Welcome, Ms. Wanjiku!</h1>
        <p className="text-muted-foreground">Here's your summary for today, July 18th, 2024.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {quickStats.map((stat) => (
            <Card key={stat.title}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                    {stat.icon}
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stat.stat}</div>
                </CardContent>
            </Card>
        ))}
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-5">
        <div className="lg:col-span-3">
           <Tabs defaultValue="announcements" className="w-full">
            <TabsList>
              <TabsTrigger value="announcements">
                <Bell className="mr-2" /> Announcements
              </TabsTrigger>
              <TabsTrigger value="modules">Core Modules</TabsTrigger>
            </TabsList>
            <TabsContent value="announcements">
               <Card className="mt-6">
                <CardHeader>
                    <CardTitle className="font-headline text-lg">Recent Notices</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    {announcements.map((item, index) => (
                        <div key={index} className="flex flex-col gap-2">
                           <div className="flex items-center gap-4">
                             <h4 className="font-semibold">{item.title}</h4>
                             <Badge variant={item.variant}>{item.category}</Badge>
                           </div>
                           <p className="text-sm text-muted-foreground">{item.content}</p>
                           <p className="text-xs text-muted-foreground">{new Date(item.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                           {index < announcements.length -1 && <Separator className="mt-4"/>}
                        </div>
                    ))}
                </CardContent>
               </Card>
            </TabsContent>
            <TabsContent value="modules">
                <div className="grid gap-6 mt-6 sm:grid-cols-2">
                    {coreModules.map((card) => (
                        <Card key={card.title} className="flex flex-col">
                            <CardHeader className="flex flex-row items-start gap-4 space-y-0 pb-4">
                            <div className="flex-shrink-0">{card.icon}</div>
                            <div className="flex-1">
                                <CardTitle className="font-headline text-base">{card.title}</CardTitle>
                                <CardDescription className="text-sm">{card.description}</CardDescription>
                            </div>
                            </CardHeader>
                            <CardContent className="flex-grow flex items-end">
                            <Button asChild className="w-full">
                                <Link href={card.href}>
                                {card.cta}
                                <ArrowRight className="ml-2 h-4 w-4" />
                                </Link>
                            </Button>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </TabsContent>
          </Tabs>
        </div>
        <div className="lg:col-span-2 space-y-8">
            <PendingTasksWidget />
            <TimetableWidget />
        </div>
      </div>
    </div>
  );
}
