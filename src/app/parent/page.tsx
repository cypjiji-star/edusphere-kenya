
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
    const { user, clientReady } = useAuth();
    const parentId = user?.uid;
    
    const [schoolName, setSchoolName] = React.useState('');
    const [parentName, setParentName] = React.useState('Parent');
    const [childrenData, setChildrenData] = React.useState<Child[]>([]);
    const [selectedChild, setSelectedChild] = React.useState<Child | null>(null);
    const [isLoading, setIsLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);
    
    React.useEffect(() => {
        if (!schoolId || !parentId) {
            setIsLoading(false);
            return;
        }

        const unsubscribers: (() => void)[] = [];
        setIsLoading(true);

        try {
            const schoolRef = doc(firestore, 'schools', schoolId);
            unsubscribers.push(onSnapshot(schoolRef, (docSnap) => {
                if(docSnap.exists()) setSchoolName(docSnap.data().name);
            }));

            const childrenQuery = query(collection(firestore, `schools/${schoolId}/students`), where('parentId', '==', parentId));
            unsubscribers.push(onSnapshot(childrenQuery, async (studentsSnapshot) => {
                if (studentsSnapshot.empty) {
                    setChildrenData([]);
                    setSelectedChild(null);
                    setParentName('Parent');
                    setIsLoading(false);
                    return;
                }
                
                // Set parent name from the first child record found
                setParentName(studentsSnapshot.docs[0].data().parentName || 'Parent');

                const studentIds = studentsSnapshot.docs.map(doc => doc.id);
                
                const termStartDate = new Date();
                termStartDate.setMonth(termStartDate.getMonth() - 3);

                const attendanceQuery = query(collection(firestore, `schools/${schoolId}/attendance`), where('studentId', 'in', studentIds), where('date', '>=', Timestamp.fromDate(termStartDate)));
                const gradesQuery = query(collection(firestore, `schools/${schoolId}/grades`), where('studentId', 'in', studentIds));
                
                const [attendanceSnapshot, gradesSnapshot] = await Promise.all([getDocs(attendanceQuery), getDocs(gradesQuery)]);
                
                const attendanceByStudent = new Map<string, { present: number; total: number }>();
                attendanceSnapshot.forEach(doc => {
                    const data = doc.data();
                    const studentId = data.studentId;
                    if (!attendanceByStudent.has(studentId)) attendanceByStudent.set(studentId, { present: 0, total: 0 });
                    const record = attendanceByStudent.get(studentId)!;
                    record.total++;
                    if (['present', 'late'].includes(data.status.toLowerCase())) record.present++;
                });

                const gradesByStudent = new Map<string, { scores: number[], recent: { subject: string; grade: string; date: string }[] }>();
                gradesSnapshot.forEach(doc => {
                    const data = doc.data();
                    const studentId = data.studentId;
                    const score = parseInt(data.grade, 10);
                    if (!gradesByStudent.has(studentId)) gradesByStudent.set(studentId, { scores: [], recent: [] });
                    const record = gradesByStudent.get(studentId)!;
                    if (!isNaN(score)) record.scores.push(score);
                    if (record.recent.length < 3) record.recent.push({ subject: data.subject || 'Unknown', grade: data.grade, date: (data.date as Timestamp).toDate().toLocaleDateString('en-GB') });
                });

                const processedChildren = studentsSnapshot.docs.map(studentDoc => {
                    const studentData = studentDoc.data();
                    const studentId = studentDoc.id;
                    const attendanceStats = attendanceByStudent.get(studentId);
                    const attendance = attendanceStats && attendanceStats.total > 0 ? Math.round((attendanceStats.present / attendanceStats.total) * 100) : 100;
                    const gradeStats = gradesByStudent.get(studentId);
                    const overallGrade = gradeStats && gradeStats.scores.length > 0 ? Math.round(gradeStats.scores.reduce((a, b) => a + b, 0) / gradeStats.scores.length) : 0;
                    const totalFee = studentData.totalFee || 0;
                    const amountPaid = studentData.amountPaid || 0;
                    const balance = totalFee - amountPaid;
                    const dueDate = studentData.dueDate instanceof Timestamp ? studentData.dueDate.toDate() : (studentData.dueDate ? new Date(studentData.dueDate) : new Date());

                    return {
                        id: studentId,
                        name: studentData.name || 'Unknown',
                        class: studentData.class || 'Unknown',
                        avatarUrl: studentData.avatarUrl || `https://picsum.photos/seed/${studentId}/100`,
                        attendance,
                        overallGrade,
                        feeStatus: { total: totalFee, paid: amountPaid, balance, status: balance <= 0 ? 'Paid' as const : (isPast(dueDate) ? 'Overdue' as const : 'Partial' as const), dueDate: dueDate.toISOString() },
                        recentGrades: gradeStats?.recent.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
                    } as Child;
                });
                
                setChildrenData(processedChildren);
                const currentSelectedId = selectedChild?.id || (processedChildren.length > 0 ? processedChildren[0].id : null);
                if(currentSelectedId) {
                    setSelectedChild(processedChildren.find(c => c.id === currentSelectedId) || processedChildren[0] || null);
                } else if (processedChildren.length > 0) {
                    setSelectedChild(processedChildren[0]);
                }

                setIsLoading(false);
            }, (err) => {
              console.error("Error fetching children or sub-data:", err);
              setError('Failed to load dashboard data. Please try again.');
              setIsLoading(false);
            }));
        } catch (err) {
            console.error('Error setting up dashboard listeners:', err);
            setError('Failed to load dashboard data. Please try again.');
            setIsLoading(false);
        }

        return () => unsubscribers.forEach(unsub => unsub());
    }, [schoolId, parentId]);


    if (isLoading) {
        return (
            <div className="flex h-[calc(100vh-200px)] items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex h-[calc(100vh-200px)] items-center justify-center">
                <ErrorMessage message={error} />
            </div>
        );
    }

    if (!schoolId) {
        return (
            <div className="flex h-[calc(100vh-200px)] items-center justify-center">
                <ErrorMessage message="School ID is required" />
            </div>
        );
    }

    if (childrenData.length === 0) {
        return (
            <div className="flex h-[calc(100vh-200px)] items-center justify-center">
                <div className="text-center">
                    <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <h2 className="text-xl font-semibold mb-2">No Students Found</h2>
                    <p className="text-muted-foreground mb-4">
                        No students are registered under your account.
                    </p>
                    <Button asChild>
                        <Link href={`/parent/support?schoolId=${schoolId}`}>Contact Support</Link>
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <div className="mb-8">
                <h1 className="font-headline text-3xl font-bold">Welcome, {parentName}!</h1>
                {clientReady && <p className="text-muted-foreground">Your dashboard for the {schoolName} parent portal.</p>}
            </div>

            {/* Dashboard stats cards */}
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <ClipboardCheck className="h-4 w-4 text-muted-foreground"/>
                            Attendance
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold ${getAttendanceColor(selectedChild?.attendance || 0)}`}>
                            {selectedChild?.attendance || 100}%
                        </div>
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
                        <div className="text-2xl font-bold">{selectedChild?.overallGrade || 0}%</div>
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
                        <div className="text-2xl font-bold text-destructive">
                            {formatCurrency(selectedChild?.feeStatus.balance || 0)}
                        </div>
                        {clientReady && <p className="text-xs text-muted-foreground">
                            Due: {selectedChild ? new Date(selectedChild.feeStatus.dueDate).toLocaleDateString('en-GB') : 'N/A'}
                        </p>}
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

            {/* Main content grid */}
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
                                    className={`w-full text-left p-4 rounded-lg border transition-all ${
                                        selectedChild?.id === child.id ? 
                                        'ring-2 ring-primary bg-primary/5' : 
                                        'hover:bg-muted/50'
                                    }`}
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
                                        {selectedChild?.id === child.id && 
                                            <Check className="ml-auto h-5 w-5 text-primary" />
                                        }
                                    </div>
                                </button>
                            ))}
                        </CardContent>
                    </Card>
                    
                    <AnnouncementsWidget schoolId={schoolId} currentUserId={parentId || ''} />
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
                            <CardDescription>
                                An overview of {selectedChild?.name}'s academic performance.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div>
                                <h4 className="font-semibold mb-4 flex items-center gap-2">
                                    <FileText className="h-5 w-5 text-primary/80"/>
                                    Recent Grades
                                </h4>
                                <div className="space-y-3">
                                    {(selectedChild?.recentGrades || []).map((grade, index) => (
                                        <div key={index} className="flex justify-between items-center text-sm p-3 rounded-md bg-muted/50">
                                            <div className="font-medium">{grade.subject}</div>
                                            <Badge variant="outline">{grade.grade}</Badge>
                                        </div>
                                    ))}
                                    {(selectedChild?.recentGrades || []).length === 0 && (
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
