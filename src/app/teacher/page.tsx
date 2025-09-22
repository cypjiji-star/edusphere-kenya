

'use client';

import * as React from 'react';
import Link from 'next/link';
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
import { ArrowRight, BookMarked, Calendar, Check, CircleDollarSign, ClipboardCheck, FileText, Megaphone, Percent, User, Users, Loader2, AlertCircle } from 'lucide-react';
import { isPast } from 'date-fns';
import { firestore } from '@/lib/firebase';
import { collection, query, where, onSnapshot, orderBy, limit, Timestamp, doc, getDoc, getDocs } from 'firebase/firestore';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { MyAttendanceWidget } from './my-attendance-widget';
import { DashboardCharts } from './dashboard-charts';
import { TimetableWidget } from './timetable-widget';
import { AbsentStudentsWidget } from './absent-students-widget';
import { MessagesWidget } from './messages-widget';
import { LibraryNoticesWidget } from './library-notices-widget';
import { PendingTasksWidget } from './pending-tasks-widget';

// Types
type Child = {
    id: string;
    name: string;
    class: string;
    avatarUrl: string;
    overallGrade?: number;
    attendance?: number;
    feeStatus: {
        total: number;
        paid: number;
        balance: number;
        status: 'Paid' | 'Partial' | 'Overdue';
        dueDate: string;
    };
    recentGrades?: { subject: string; grade: string; date: string }[];
};

type Announcement = {
    id: string;
    title: string;
    content: string;
    sentAt: Timestamp;
    readBy?: string[];
};

type EventType = 'Meeting' | 'Exam' | 'Holiday' | 'Event' | 'Sports' | 'Trip';

type UpcomingEvent = {
  id: string;
  date: Date;
  title: string;
  type: EventType;
};

const eventTypeColors: Record<EventType, string> = {
    Meeting: 'bg-purple-500',
    Exam: 'bg-red-600',
    Holiday: 'bg-green-600',
    Event: 'bg-blue-500',
    Sports: 'bg-orange-500',
    Trip: 'bg-pink-500',
};

// Utility functions
const getFeeStatusBadge = (status: 'Paid' | 'Partial' | 'Overdue') => {
    switch(status) {
        case 'Paid': return <Badge className="bg-green-600 hover:bg-green-700">Paid</Badge>;
        case 'Partial': return <Badge className="bg-blue-500 hover:bg-blue-500">Partial Payment</Badge>;
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

// Error Boundary Component
const ErrorMessage = ({ message, onRetry }: { message: string; onRetry?: () => void }) => (
  <div className="flex flex-col items-center justify-center p-6 text-center text-destructive">
    <AlertCircle className="h-8 w-8 mb-2" />
    <p className="mb-4">{message}</p>
    {onRetry && (
      <Button variant="outline" onClick={onRetry}>
        Try Again
      </Button>
    )}
  </div>
);

// Loading Component
const LoadingSpinner = ({ message }: { message?: string }) => (
  <div className="flex flex-col items-center justify-center p-6">
    <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
    {message && <p className="text-muted-foreground">{message}</p>}
  </div>
);

function AnnouncementsWidget({ schoolId, currentUserId }: { schoolId: string, currentUserId: string }) {
    const [announcements, setAnnouncements] = React.useState<Announcement[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);

    React.useEffect(() => {
        if (!schoolId) {
            setLoading(false);
            return;
        }

        setLoading(true);
        try {
            const q = query(
                collection(firestore, `schools/${schoolId}/announcements`), 
                orderBy('sentAt', 'desc'), 
                limit(2)
            );
            
            const unsubscribe = onSnapshot(
                q,
                (snapshot) => {
                    const fetchedAnnouncements = snapshot.docs.map(doc => ({ 
                        id: doc.id, 
                        ...doc.data() 
                    } as Announcement));
                    setAnnouncements(fetchedAnnouncements);
                    setLoading(false);
                },
                (error) => {
                    console.error('Error fetching announcements:', error);
                    setError('Failed to load announcements');
                    setLoading(false);
                }
            );
            
            return () => unsubscribe();
        } catch (error) {
            setError('Error setting up announcements listener');
            setLoading(false);
        }
    }, [schoolId]);

    if (loading) return <LoadingSpinner message="Loading announcements..." />;
    if (error) return <ErrorMessage message={error} />;

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Megaphone className="h-5 w-5 text-primary"/>
                    Recent Announcements
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {announcements.map((ann, index) => {
                    const isRead = ann.readBy?.includes(currentUserId);
                    return (
                     <div key={ann.id}>
                        <Link href={`/parent/announcements?schoolId=${schoolId}`} className="block hover:bg-muted/50 p-2 -m-2 rounded-lg">
                            <div className="flex items-start gap-3">
                                {!isRead && <div className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-primary" />}
                                <div className="flex-1 space-y-1">
                                    <p className="font-semibold text-sm">{ann.title}</p>
                                    <p className="text-sm text-muted-foreground truncate">{ann.content}</p>
                                </div>
                                <p className="text-xs text-muted-foreground whitespace-nowrap">
                                    {ann.sentAt.toDate().toLocaleDateString()}
                                </p>
                            </div>
                        </Link>
                        {index < announcements.length - 1 && <Separator className="mt-4" />}
                    </div>
                )})}
                 {announcements.length === 0 && (
                    <div className="text-center text-muted-foreground py-4">
                        <p>No recent announcements.</p>
                    </div>
                )}
            </CardContent>
            <CardFooter>
                 <Button asChild variant="outline" size="sm" className="w-full">
                    <Link href={`/parent/announcements?schoolId=${schoolId}`}>
                        View All Announcements
                        <ArrowRight className="ml-2 h-4 w-4"/>
                    </Link>
                </Button>
            </CardFooter>
        </Card>
    );
}

function CalendarWidget({ schoolId }: { schoolId: string }) {
    const [upcomingEvents, setUpcomingEvents] = React.useState<UpcomingEvent[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);

    React.useEffect(() => {
        if (!schoolId) {
            setLoading(false);
            return;
        }

        setLoading(true);
        try {
            const q = query(
                collection(firestore, `schools/${schoolId}/calendar-events`),
                where('date', '>=', Timestamp.now()),
                orderBy('date', 'asc'),
                limit(4)
            );
            
            const unsubscribe = onSnapshot(
                q,
                (snapshot) => {
                    const fetchedEvents = snapshot.docs.map(doc => {
                        const data = doc.data();
                        return {
                            id: doc.id,
                            ...data,
                            date: (data.date as Timestamp).toDate(),
                        } as UpcomingEvent;
                    });
                    setUpcomingEvents(fetchedEvents);
                    setLoading(false);
                },
                (error) => {
                    console.error('Error fetching events:', error);
                    setError('Failed to load calendar events');
                    setLoading(false);
                }
            );
            
            return () => unsubscribe();
        } catch (error) {
            setError('Error setting up calendar listener');
            setLoading(false);
        }
    }, [schoolId]);

    if (loading) return <LoadingSpinner message="Loading events..." />;
    if (error) return <ErrorMessage message={error} />;

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
                        <div key={event.id}>
                            <div className="flex items-center gap-4">
                                <div className="flex flex-col items-center justify-center w-14 text-center bg-muted/50 rounded-md p-2">
                                    <span className="text-sm font-bold uppercase text-primary">
                                        {event.date.toLocaleDateString('en-US', { month: 'short' })}
                                    </span>
                                    <span className="text-xl font-bold">{event.date.getDate()}</span>
                                </div>
                                <div className="flex-1">
                                    <p className="font-semibold text-sm">{event.title}</p>
                                    <Badge className={`mt-1 text-white ${eventTypeColors[event.type]}`}>
                                        {event.type}
                                    </Badge>
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
                    <Link href={`/teacher/calendar?schoolId=${schoolId}`}>
                        View Full Calendar
                        <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                </Button>
            </CardFooter>
        </Card>
    );
}

export default function TeacherDashboard() {
    const searchParams = useSearchParams();
    const schoolId = searchParams.get('schoolId');
    const { user, clientReady } = useAuth();
    
    const [schoolName, setSchoolName] = React.useState('');
    const [teacherName, setTeacherName] = React.useState('Teacher');
    const [totalStudents, setTotalStudents] = React.useState(0);
    const [ungradedAssignments, setUngradedAssignments] = React.useState(0);
    const [attendancePercentage, setAttendancePercentage] = React.useState(0);
    const [isLoading, setIsLoading] = React.useState(true);

    React.useEffect(() => {
        if (!schoolId || !user) {
            setIsLoading(false);
            return;
        }
        
        const teacherId = user.uid;
        setIsLoading(true);

        const unsubscribers: (() => void)[] = [];

        try {
            const schoolRef = doc(firestore, 'schools', schoolId);
            unsubscribers.push(onSnapshot(schoolRef, (docSnap) => {
                if(docSnap.exists()) setSchoolName(docSnap.data().name);
            }));
            
            const teacherDocRef = doc(firestore, `schools/${schoolId}/users`, teacherId);
            unsubscribers.push(onSnapshot(teacherDocRef, (docSnap) => {
                if (docSnap.exists()) {
                    setTeacherName(docSnap.data().name || 'Teacher');
                }
            }));

            const classesQuery = query(collection(firestore, `schools/${schoolId}/classes`), where('teacherId', '==', teacherId));
            unsubscribers.push(onSnapshot(classesQuery, (classesSnapshot) => {
                const classIds = classesSnapshot.docs.map(doc => doc.id);
                if (classIds.length === 0) {
                    setTotalStudents(0);
                    setAttendancePercentage(100);
                    setIsLoading(false);
                    return;
                }

                const studentsQuery = query(collection(firestore, `schools/${schoolId}/users`), where('role', '==', 'Student'), where('classId', 'in', classIds));
                const unsubStudents = onSnapshot(studentsQuery, async (studentsSnapshot) => {
                    const studentCount = studentsSnapshot.size;
                    const studentIds = studentsSnapshot.docs.map(doc => doc.id);
                    setTotalStudents(studentCount);

                    if (studentCount > 0) {
                        const today = new Date();
                        const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
                        const attendanceQuery = query(
                            collection(firestore, `schools/${schoolId}/attendance`), 
                            where('studentId', 'in', studentIds),
                            where('date', '>=', Timestamp.fromDate(startOfToday))
                        );
                        const attendanceSnapshot = await getDocs(attendanceQuery);
                        const presentCount = attendanceSnapshot.docs.filter(r => ['present', 'late'].includes(r.data().status.toLowerCase())).length;
                        setAttendancePercentage(Math.round((presentCount / studentCount) * 100));
                    } else {
                        setAttendancePercentage(100);
                    }
                    setIsLoading(false);
                });
                 unsubscribers.push(unsubStudents);
            }));
            
            const assignmentsQuery = query(collection(firestore, `schools/${schoolId}/assignments`), where('teacherId', '==', teacherId));
            unsubscribers.push(onSnapshot(assignmentsQuery, (snapshot) => {
                let ungradedCount = 0;
                snapshot.forEach(doc => {
                    const assignment = doc.data();
                    if (assignment.submissions < assignment.totalStudents) ungradedCount++;
                });
                setUngradedAssignments(ungradedCount);
            }));


        } catch (error) {
            console.error("Error setting up dashboard listeners:", error);
            setIsLoading(false);
        }

        return () => unsubscribers.forEach(unsub => unsub());

    }, [schoolId, user]);

    const quickStats = React.useMemo(() => [
        {
            title: "Total Students",
            stat: totalStudents,
            icon: <Users className="h-6 w-6 text-muted-foreground" />,
            href: `/teacher/students?schoolId=${schoolId}`,
        },
        {
            title: "Today's Attendance",
            stat: `${attendancePercentage}%`,
            icon: <ClipboardCheck className="h-6 w-6 text-muted-foreground" />,
            href: `/teacher/attendance?schoolId=${schoolId}`,
        },
        {
            title: "Ungraded Assignments",
            stat: ungradedAssignments,
            icon: <BookMarked className="h-6 w-6 text-muted-foreground" />,
            href: `/teacher/assignments?schoolId=${schoolId}`,
        },
    ], [totalStudents, attendancePercentage, ungradedAssignments, schoolId]);

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <Card className="mb-8 overflow-hidden">
          <CardHeader className="bg-card border-b p-4 md:p-6">
              <CardTitle className="font-headline text-3xl font-bold text-primary">Welcome, {teacherName}!</CardTitle>
              {clientReady && <CardDescription>Your dashboard for {schoolName}. Today is {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}.</CardDescription>}
          </CardHeader>
      </Card>

       <div className="mb-8">
          <MyAttendanceWidget />
       </div>

       {isLoading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {Array(3).fill(0).map((_, index) => (
                    <Card key={index}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                             <div className="h-5 w-32 rounded-md bg-muted animate-pulse" />
                             <div className="h-6 w-6 rounded-md bg-muted animate-pulse" />
                        </CardHeader>
                        <CardContent>
                             <div className="h-8 w-16 rounded-md bg-muted animate-pulse" />
                        </CardContent>
                    </Card>
                ))}
            </div>
       ) : (
            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {quickStats.map((stat) => (
                <Link href={stat.href} key={stat.title} aria-label={`View ${stat.title}`}>
                  <Card>
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
       )}

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
            <TimetableWidget />
            {user && <DashboardCharts teacherId={user.uid} teacherName={teacherName} />}
        </div>
        <div className="lg:col-span-1 space-y-8">
            <AbsentStudentsWidget />
            <LibraryNoticesWidget />
            <MessagesWidget />
        </div>
      </div>
    </div>
  );
}
