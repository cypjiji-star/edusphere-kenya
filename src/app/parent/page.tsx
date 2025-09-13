
'use client';

import * as React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
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
        overallGrade: 'B+',
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
        overallGrade: 'A-',
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
                    <Link href="#">
                        View All Announcements
                        <ArrowRight className="ml-2 h-4 w-4"/>
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
             <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-primary"/>
                        Upcoming Events
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center text-muted-foreground py-8">
                        <p>No upcoming school events.</p>
                    </div>
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
                            <Link href="#">
                                View Full Report
                                <ArrowRight className="ml-2 h-4 w-4"/>
                            </Link>
                         </Button>
                    </CardTitle>
                    <CardDescription>An overview of {selectedChild.name}'s academic performance.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 gap-6">
                        <div className="p-4 rounded-lg bg-muted/50 text-center">
                            <Percent className="h-8 w-8 text-primary mx-auto mb-2" />
                            <p className="text-3xl font-bold">{selectedChild.overallGrade}</p>
                            <p className="text-sm text-muted-foreground">Overall Grade</p>
                        </div>
                         <div className="p-4 rounded-lg bg-muted/50 text-center">
                            <ClipboardCheck className="h-8 w-8 text-primary mx-auto mb-2" />
                            <p className="text-3xl font-bold">{selectedChild.attendance}%</p>
                            <p className="text-sm text-muted-foreground">Attendance</p>
                        </div>
                    </div>
                    <Separator className="my-6"/>
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

             <Card>
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        <span>Fee Status</span>
                        <Button asChild variant="secondary" size="sm">
                            <Link href="#">
                                Make Payment
                                <ArrowRight className="ml-2 h-4 w-4"/>
                            </Link>
                         </Button>
                    </CardTitle>
                    <CardDescription>Summary of school fee payments for {selectedChild.name}.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex justify-between items-center mb-4">
                        {getFeeStatusBadge(selectedChild.feeStatus.status)}
                        <p className="text-sm text-muted-foreground">Term 2, 2024</p>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-center">
                        <div className="p-2 rounded-lg">
                            <p className="text-sm text-muted-foreground">Total Billed</p>
                            <p className="font-bold text-lg">{formatCurrency(selectedChild.feeStatus.total)}</p>
                        </div>
                        <div className="p-2 rounded-lg">
                            <p className="text-sm text-muted-foreground">Total Paid</p>
                            <p className="font-bold text-lg text-green-600">{formatCurrency(selectedChild.feeStatus.paid)}</p>
                        </div>
                        <div className="p-2 rounded-lg">
                            <p className="text-sm text-muted-foreground">Balance</p>
                            <p className={`font-bold text-lg ${selectedChild.feeStatus.balance > 0 ? 'text-destructive' : ''}`}>
                                {formatCurrency(selectedChild.feeStatus.balance)}
                            </p>
                        </div>
                    </div>
                </CardContent>
             </Card>
        </div>
       </div>
    </div>
  );
}
