
'use client';

import { ArrowUp, BookOpen, Calendar, CircleDollarSign, ClipboardCheck, Megaphone, ShieldAlert, Shapes, UserPlus, Users, UserCheck, FileText, AlertTriangle } from 'lucide-react';
import * as React from 'react';

// From src/app/admin/page.tsx
export const overviewStats = [
    {
        title: "Total Students",
        stat: "852",
        icon: React.createElement(Users, { className: "h-6 w-6 text-muted-foreground" }),
        subtext: "1.2%",
        subtextIcon: React.createElement(ArrowUp, { className: "h-4 w-4 text-green-600" }),
        subtextDescription: "vs last term",
    },
    {
        title: "Total Teachers",
        stat: "45",
        icon: React.createElement(UserCheck, { className: "h-6 w-6 text-muted-foreground" }),
    },
    {
        title: "Active Parents",
        stat: "780",
        icon: React.createElement(Users, { className: "h-6 w-6 text-muted-foreground" }),
    },
    {
        title: "Pending Registrations",
        stat: "5",
        icon: React.createElement(UserPlus, { className: "h-6 w-6 text-muted-foreground" }),
    }
];

export const quickStats = [
    {
        title: "Today's Attendance",
        stat: "96%",
        icon: React.createElement(ClipboardCheck, { className: "h-6 w-6 text-muted-foreground" }),
    },
    {
        title: "Fees Collected (Term 2)",
        stat: "82%",
        icon: React.createElement(CircleDollarSign, { className: "h-6 w-6 text-muted-foreground" }),
    },
     {
        title: "Upcoming Events",
        stat: "3",
        icon: React.createElement(Calendar, { className: "h-6 w-6 text-muted-foreground" }),
    },
];

export const recentActivities = [
    {
        icon: React.createElement(ShieldAlert, { className: "h-5 w-5 text-red-600" }),
        title: "Urgent: Critical health incident reported for student Jane Doe.",
        time: "2m ago",
        category: "Urgent",
    },
    {
        icon: React.createElement(UserPlus, { className: "h-5 w-5 text-blue-500" }),
        title: "New student registration pending for John Doe.",
        time: "5m ago",
        category: "Registration",
    },
     {
        icon: React.createElement(FileText, { className: "h-5 w-5 text-green-500" }),
        title: "Ms. Wanjiku submitted grades for Form 4 Chemistry.",
        time: "2h ago",
        category: "Grades",
    },
     {
        icon: React.createElement(AlertTriangle, { className: "h-5 w-5 text-yellow-500" }),
        title: "Low attendance alert for Form 2 Physics (75%).",
        time: "3h ago",
        category: "Attendance",
    },
      {
        icon: React.createElement(BookOpen, { className: "h-5 w-5 text-purple-500" }),
        title: "Mr. Otieno published a new lesson plan for Form 3 English.",
        time: "1d ago",
        category: "Academics",
    },
    {
        icon: React.createElement(Megaphone, { className: "h-5 w-5 text-cyan-500" }),
        title: "School-wide announcement posted about PTA meeting.",
        time: "2d ago",
        category: "Comms",
    },
];

// From src/app/admin/admin-charts.tsx
export const feeData = [
    { status: 'Collected', value: 82, fill: 'hsl(var(--chart-1))' },
    { status: 'Outstanding', value: 18, fill: 'hsl(var(--chart-2))' },
];

export const feeChartConfig = {
    Collected: { label: 'Collected', color: 'hsl(var(--chart-1))' },
    Outstanding: { label: 'Outstanding', color: 'hsl(var(--chart-2))' },
};

export const performanceData = [
  { subject: 'Math', avgScore: 82 },
  { subject: 'Eng', avgScore: 78 },
  { subject: 'Sci', avgScore: 85 },
  { subject: 'Hist', avgScore: 75 },
  { subject: 'Geo', avgScore: 72 },
  { subject: 'Kisw', avgScore: 80 },
];

export const performanceChartConfig = {
  avgScore: {
    label: 'Avg. Score',
    color: 'hsl(var(--primary))',
  },
};

// From src/app/admin/calendar-widget.tsx
export type EventType = 'Meeting' | 'Exam' | 'Holiday' | 'Event';

export type UpcomingEvent = {
  date: string;
  day: string;
  title: string;
  type: EventType;
};

export const upcomingEvents: UpcomingEvent[] = [
  {
    date: '25',
    day: 'Jul',
    title: 'PTA General Meeting',
    type: 'Meeting',
  },
  {
    date: '02',
    day: 'Aug',
    title: 'Mid-Term Examinations Begin',
    type: 'Exam',
  },
    {
    date: '10',
    day: 'Aug',
    title: 'Moi Day',
    type: 'Holiday',
  },
  {
    date: '15',
    day: 'Aug',
    title: 'Annual Sports Day',
    type: 'Event',
  },
];

export const eventTypeColors: Record<EventType, string> = {
    Meeting: 'bg-purple-500',
    Exam: 'bg-red-600',
    Holiday: 'bg-green-600',
    Event: 'bg-blue-500',
};
