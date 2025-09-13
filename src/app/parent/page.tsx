
'use client';

import * as React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { ArrowRight, BookMarked, Calendar, Check, CircleDollarSign, ClipboardCheck, FileText, Megaphone, Percent, User, Users } from 'lucide-react';
import Link from 'next/link';

const childrenData = [
    {
        id: 'child-1',
        name: 'John Doe',
        class: 'Form 4',
        avatarUrl: 'https://picsum.photos/seed/f4-student4/100',
        school: 'EduSphere High School',
        overallGrade: '88',
        attendance: 96,
        feeStatus: {
            total: 105000,
            paid: 80000,
            balance: 25000,
            status: 'Partial' as const,
        },
        recentGrades: [
            { subject: 'Chemistry', grade: 'A-', date: '2024-07-22' },
            { subject: 'Mathematics', grade: 'B', date: '2024-07-20' },
        ],
    },
     {
        id: 'child-2',
        name: 'Jane Doe',
        class: 'Form 1',
        avatarUrl: 'https://picsum.photos/seed/f1-student10/100',
        school: 'EduSphere High School',
        overallGrade: '92',
        attendance: 99,
        feeStatus: {
            total: 105000,
            paid: 105000,
            balance: 0,
            status: 'Paid' as const,
        },
        recentGrades: [
            { subject: 'English', grade: 'A', date: '2024-07-21' },
            { subject: 'History', grade: 'B+', date: '2024-07-19' },
        ],
    },
];

const announcements = [
    {
        id: 'ann-1',
        title: 'PTA Meeting Reminder',
        content: 'This is a reminder about the Parent-Teacher Association meeting this Saturday at 10 AM in the main hall.',
        date: '2 days ago',
        read: false,
    },
    {
        id: 'ann-2',
        title: 'School Closure for Public Holiday',
        content: 'The school will be closed this coming Friday for the public holiday. Classes will resume on Monday.',
        date: '4 days ago',
        read: true,
    }
];

type EventType = 'Meeting' | 'Exam' | 'Holiday' | 'Event';

type UpcomingEvent = {
  date: string;
  day: string;
  title: string;
  type: EventType;
};

const upcomingEvents: UpcomingEvent[] = [
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

const eventTypeColors: Record<EventType, string> = {
    Meeting: 'bg-purple-500',
    Exam: 'bg-red-600',
    Holiday: 'bg-green-600',
    Event: 'bg-blue-500',
};

const getFeeStatusBadge = (status: 'Paid' | 'Partial' | 'Overdue') => {
    switch(status) {
        case 'Paid': return <Badge className="bg-green-600 hover:bg-green-700">Paid</Badge>;
        case 'Partial': return <Badge className="bg-blue-500 hover:bg-blue-600">Partial Payment</Badge>;
        case 'Overdue': return <Badge variant="destructive">Overdue</Badge>;
    }
}

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', minimumFractionDigits: 0 }).format(amount);
};

const getAttendanceColor = (attendance: number) => {
    if (attendance >= 90) return 'text-green-600';
    if (attendance >= 70) return 'text-orange-500';
    return 'text-red-600';
}

function AnnouncementsWidget() {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Megaphone className="h-5 w-5 text-primary"/>
                    Recent Announcements
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {announcements.map((ann, index) => (
                     <div key={ann.id}>
                        <div className="flex items-start gap-3">
                            {!ann.read && <div className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-primary" />}
                            <div className="flex-1 space-y-1">
                                <p className="font-semibold text-sm">{ann.title}</p>
                                <p className="text-sm text-muted-foreground truncate">{ann.content}</p>
                            </div>
                            <p className="text-xs text-muted-foreground whitespace-nowrap">{ann.date}</p>
                        </div>
                        {index < announcements.length - 1 && <Separator className="mt-4" />}
                    </div>
                ))}
            </CardContent>
            <CardFooter>
                 <Button asChild variant="outline" size="sm" className="w-full">
                    <Link href="/parent/announcements">
                        View All Announcements
                        <ArrowRight className="ml-2 h-4 w-4"/>
                    </Link>
                </Button>
            </CardFooter>
        </Card>
    );
}

function CalendarWidget() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline text-lg flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          Upcoming Events
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {upcomingEvents.map((event, index) => (
            <div key={index}>
              <div className="flex items-center gap-4">
                <div className="flex flex-col items-center justify-center w-14 text-center bg-muted/50 rounded-md p-2">
                    <span className="text-sm font-bold uppercase text-primary">{event.day}</span>
                    <span className="text-xl font-bold">{event.date}</span>
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-sm">{event.title}</p>
                  <Badge className={`mt-1 text-white ${eventTypeColors[event.type]}`}>{event.type}</Badge>
                </div>
              </div>
               {index < upcomingEvents.length - 1 && <Separator className="mt-4" />}
            </div>
          ))}
          {upcomingEvents.length === 0 && (
            <div className="text-center text-muted-foreground py-8">
              <p>No upcoming events scheduled.</p>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <Button asChild variant="outline" size="sm" className="w-full">
            <Link href="/parent/calendar">
                View Full Calendar
                <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}


export default function ParentDashboard() {
  const [selectedChild, setSelectedChild] = React.useState(childrenData[0]);

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="font-headline text-3xl font-bold">Parent Dashboard</h1>
        <p className="text-muted-foreground">Welcome! Here's a summary of your child's progress.</p>
      </div>

       <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
            <Card>
                <CardHeader>
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <ClipboardCheck className="h-4 w-4 text-muted-foreground"/>
                        Attendance
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className={`text-2xl font-bold ${getAttendanceColor(selectedChild.attendance)}`}>{selectedChild.attendance}%</div>
                    <p className="text-xs text-muted-foreground">Current term average</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                         <Percent className="h-4 w-4 text-muted-foreground"/>
                        Overall Grade
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{selectedChild.overallGrade}%</div>
                    <p className="text-xs text-muted-foreground">Term 2 Average</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <CircleDollarSign className="h-4 w-4 text-muted-foreground"/>
                        Fee Balance
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-destructive">{formatCurrency(selectedChild.feeStatus.balance)}</div>
                    <p className="text-xs text-muted-foreground">Due: Aug 15, 2024</p>
                </CardContent>
                <CardFooter>
                    <Button asChild size="sm" className="w-full">
                      <Link href="/parent/fees">Pay Now</Link>
                    </Button>
                </CardFooter>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground"/>
                        Next Event
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-lg font-bold">PTA Meeting</div>
                    <p className="text-xs text-muted-foreground">July 25, 2024</p>
                </CardContent>
            </Card>
      </div>

       <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-1 space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-primary" />
                        My Children
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {childrenData.map(child => (
                        <button
                            key={child.id}
                            className={`w-full text-left p-4 rounded-lg border transition-all ${selectedChild.id === child.id ? 'ring-2 ring-primary bg-primary/5' : 'hover:bg-muted/50'}`}
                            onClick={() => setSelectedChild(child)}
                        >
                            <div className="flex items-center gap-4">
                                <Avatar className="h-12 w-12">
                                    <AvatarImage src={child.avatarUrl} alt={child.name} />
                                    <AvatarFallback>{child.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="font-semibold">{child.name}</p>
                                    <p className="text-sm text-muted-foreground">{child.class} - {child.school}</p>
                                </div>
                                {selectedChild.id === child.id && <Check className="ml-auto h-5 w-5 text-primary" />}
                            </div>
                        </button>
                    ))}
                </CardContent>
            </Card>
             <AnnouncementsWidget />
        </div>

        <div className="lg:col-span-2 space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        <span>Academic Snapshot</span>
                         <Button asChild variant="secondary" size="sm">
                            <Link href="/parent/grades">
                                View Full Report
                                <ArrowRight className="ml-2 h-4 w-4"/>
                            </Link>
                         </Button>
                    </CardTitle>
                    <CardDescription>An overview of {selectedChild.name}'s academic performance.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div>
                        <h4 className="font-semibold mb-4 flex items-center gap-2">
                            <FileText className="h-5 w-5 text-primary/80"/>
                            Recent Grades
                        </h4>
                        <div className="space-y-3">
                            {selectedChild.recentGrades.map((grade, index) => (
                                <div key={index} className="flex justify-between items-center text-sm p-3 rounded-md bg-muted/50">
                                    <div className="font-medium">{grade.subject}</div>
                                    <Badge variant="outline">{grade.grade}</Badge>
                                </div>
                            ))}
                        </div>
                    </div>
                </CardContent>
            </Card>
             <CalendarWidget />
        </div>
       </div>
    </div>
  );
}
