
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
import { ArrowRight, BookMarked, Calendar, Check, CircleDollarSign, ClipboardCheck, FileText, Megaphone, Percent, User, Users, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { isPast } from 'date-fns';
import { firestore } from '@/lib/firebase';
import { collection, query, where, onSnapshot, orderBy, limit, Timestamp, doc, getDoc, getDocs } from 'firebase/firestore';
import { useSearchParams } from 'next/navigation';


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

function AnnouncementsWidget({ schoolId, currentUserId }: { schoolId: string, currentUserId: string }) {
    const [announcements, setAnnouncements] = React.useState<Announcement[]>([]);

    React.useEffect(() => {
        if (!schoolId) return;
        const q = query(collection(firestore, `schools/${schoolId}/announcements`), orderBy('sentAt', 'desc'), limit(2));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedAnnouncements = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Announcement));
            setAnnouncements(fetchedAnnouncements);
        });
        return () => unsubscribe();
    }, [schoolId]);

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
                                <p className="text-xs text-muted-foreground whitespace-nowrap">{ann.sentAt.toDate().toLocaleDateString()}</p>
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

    React.useEffect(() => {
        if (!schoolId) return;
        const q = query(
            collection(firestore, `schools/${schoolId}/calendar-events`),
            where('date', '>=', Timestamp.now()),
            orderBy('date', 'asc'),
            limit(4)
        );
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedEvents = snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    ...data,
                    date: (data.date as Timestamp).toDate(),
                } as UpcomingEvent;
            });
            setUpcomingEvents(fetchedEvents);
        });
        return () => unsubscribe();
    }, [schoolId]);

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
                    <span className="text-sm font-bold uppercase text-primary">{event.date.toLocaleDateString('en-US', { month: 'short' })}</span>
                    <span className="text-xl font-bold">{event.date.getDate()}</span>
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
            <Link href={`/parent/calendar?schoolId=${schoolId}`}>
                View Full Calendar
                <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}


export default function ParentDashboard() {
  const searchParams = useSearchParams();
  const schoolId = searchParams.get('schoolId');
  const parentId = 'parent-user-id'; // Placeholder for logged-in user
  const [schoolName, setSchoolName] = React.useState('');
  const [childrenData, setChildrenData] = React.useState<Child[]>([]);
  const [selectedChild, setSelectedChild] = React.useState<Child | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    if (!schoolId) {
        setIsLoading(false);
        return;
    }
    
    getDoc(doc(firestore, 'schools', schoolId)).then(docSnap => {
        if(docSnap.exists()) setSchoolName(docSnap.data().name);
    });

    const childrenQuery = query(collection(firestore, `schools/${schoolId}/students`), where('parentId', '==', parentId));
    const unsubscribe = onSnapshot(childrenQuery, async (snapshot) => {
      const fetchedChildren = await Promise.all(snapshot.docs.map(async (studentDoc) => {
          const studentData = studentDoc.data();
          const studentId = studentDoc.id;

          // Fetch attendance
          const termStartDate = new Date(); // In real app, get from academic calendar
          termStartDate.setMonth(termStartDate.getMonth() - 3);
          const attendanceQuery = query(collection(firestore, `schools/${schoolId}/attendance`), where('studentId', '==', studentId), where('date', '>=', Timestamp.fromDate(termStartDate)));
          const attendanceSnapshot = await getDocs(attendanceQuery);
          const totalDays = attendanceSnapshot.size;
          const presentDays = attendanceSnapshot.docs.filter(d => ['Present', 'Late'].includes(d.data().status)).length;
          const attendancePercentage = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 100;
          
          // Fetch grades
          const gradesQuery = query(collection(firestore, `schools/${schoolId}/students/${studentId}/grades`), orderBy('date', 'desc'), limit(3));
          const gradesSnapshot = await getDocs(gradesQuery);
          const recentGrades = gradesSnapshot.docs.map(d => {
              const gradeData = d.data();
              return {
                  subject: gradeData.assessmentTitle, // Or fetch assessment for subject name
                  grade: gradeData.grade,
                  date: (gradeData.date as Timestamp).toDate().toLocaleDateString('en-GB'),
              }
          });
          
          // Calculate overall grade
          const allGradesQuery = query(collection(firestore, `schools/${schoolId}/students/${studentId}/grades`));
          const allGradesSnapshot = await getDocs(allGradesQuery);
          const numericScores = allGradesSnapshot.docs.map(d => parseInt(d.data().grade)).filter(score => !isNaN(score));
          const overallGrade = numericScores.length > 0 ? Math.round(numericScores.reduce((a, b) => a + b, 0) / numericScores.length) : 0;
          
          return { 
              id: studentId, 
              name: studentData.name,
              class: studentData.class,
              avatarUrl: studentData.avatarUrl,
              attendance: attendancePercentage,
              overallGrade: overallGrade,
              feeStatus: {
                total: studentData.totalFee || 0,
                paid: studentData.amountPaid || 0,
                balance: studentData.balance || 0,
                status: studentData.balance <= 0 ? 'Paid' : 'Partial', // Simplified
                dueDate: (studentData.dueDate as Timestamp)?.toDate().toISOString() || new Date().toISOString(),
              },
              recentGrades: recentGrades,
          } as Child;
      }));
      
      setChildrenData(fetchedChildren);
      if (!selectedChild && fetchedChildren.length > 0) {
        setSelectedChild(fetchedChildren[0]);
      }
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, [schoolId, parentId]);
  
  const getFeeStatus = (feeStatus: Child['feeStatus']) => {
    if (feeStatus.balance <= 0) return 'Paid';
    if (isPast(new Date(feeStatus.dueDate))) return 'Overdue';
    return 'Partial';
  }

  if (isLoading || !selectedChild || !schoolId) {
    return (
        <div className="flex h-[calc(100vh-200px)] items-center justify-center">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="font-headline text-3xl font-bold">Parent Dashboard</h1>
        <p className="text-muted-foreground">Welcome to the {schoolName} parent portal.</p>
      </div>

       <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <ClipboardCheck className="h-4 w-4 text-muted-foreground"/>
                        Attendance
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className={`text-2xl font-bold ${getAttendanceColor(selectedChild.attendance || 0)}`}>{selectedChild.attendance || 100}%</div>
                    <p className="text-xs text-muted-foreground">Current term average</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                         <Percent className="h-4 w-4 text-muted-foreground"/>
                        Overall Grade
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{selectedChild.overallGrade || 0}%</div>
                    <p className="text-xs text-muted-foreground">Term 2 Average</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <CircleDollarSign className="h-4 w-4 text-muted-foreground"/>
                        Fee Balance
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-destructive">{formatCurrency(selectedChild.feeStatus.balance)}</div>
                    <p className="text-xs text-muted-foreground">Due: {new Date(selectedChild.feeStatus.dueDate).toLocaleDateString('en-GB')}</p>
                </CardContent>
                <CardFooter>
                    <Button asChild size="sm" className="w-full">
                      <Link href={`/parent/fees?schoolId=${schoolId}`}>Pay Now</Link>
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
                                    <p className="text-sm text-muted-foreground">{child.class}</p>
                                </div>
                                {selectedChild.id === child.id && <Check className="ml-auto h-5 w-5 text-primary" />}
                            </div>
                        </button>
                    ))}
                </CardContent>
            </Card>
             <AnnouncementsWidget schoolId={schoolId} currentUserId={parentId} />
        </div>

        <div className="lg:col-span-2 space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        <span>Academic Snapshot</span>
                         <Button asChild variant="secondary" size="sm">
                            <Link href={`/parent/grades?schoolId=${schoolId}`}>
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
                            {(selectedChild.recentGrades || []).map((grade, index) => (
                                <div key={index} className="flex justify-between items-center text-sm p-3 rounded-md bg-muted/50">
                                    <div className="font-medium">{grade.subject}</div>
                                    <Badge variant="outline">{grade.grade}</Badge>
                                </div>
                            ))}
                             {(selectedChild.recentGrades || []).length === 0 && (
                                <p className="text-sm text-muted-foreground">No recent grades to display.</p>
                             )}
                        </div>
                    </div>
                </CardContent>
            </Card>
             <CalendarWidget schoolId={schoolId} />
        </div>
       </div>
    </div>
  );
}
