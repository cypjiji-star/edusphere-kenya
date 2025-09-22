
'use client';

import * as React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shapes, PlusCircle, Users, Megaphone, CircleDollarSign, ArrowUp, UserCheck, UserPlus, ClipboardCheck, Calendar, ShieldAlert, FileText, AlertTriangle, BookOpen, Loader2, ArrowRight, LayoutDashboard } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { FinanceSnapshot } from './admin-charts';
import { CalendarWidget } from './calendar-widget';
import { firestore } from '@/lib/firebase';
import { collection, query, where, onSnapshot, limit, orderBy, Timestamp, getDoc, doc, getDocs } from 'firebase/firestore';
import { useSearchParams } from 'next/navigation';
import { SecurityAlertsWidget } from './security-alerts-widget';
import { ScrollArea } from '@/components/ui/scroll-area';

const overviewLinks: Record<string, string> = {
    "Total Students": "/admin/students",
    "Total Staff": "/admin/users-list",
    "Overall Fee Balance": "/admin/fees",
    "Today's Attendance": "/admin/attendance",
};

const activityCategoryLinks: Record<string, string> = {
    Urgent: '/admin/health',
    Registration: '/admin/enrolment',
    Grades: '/admin/grades',
    Attendance: '/admin/attendance',
    Academics: '/admin/lesson-plans',
    Comms: '/admin/announcements',
    Security: '/admin/logs',
};

const activityIconMap: Record<string, React.ElementType> = {
    Urgent: ShieldAlert,
    Registration: UserPlus,
    Grades: FileText,
    Attendance: AlertTriangle,
    Academics: BookOpen,
    Comms: Megaphone,
    Security: ShieldAlert,
};

type RecentActivity = {
    id: string;
    icon: React.ElementType;
    title: string;
    time: string;
    category: string;
    href: string;
};

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', minimumFractionDigits: 0 }).format(amount);
}

function formatTimeAgo(timestamp: Timestamp | undefined) {
    if (!timestamp) return '';
    const now = new Date();
    const then = timestamp.toDate();
    const seconds = Math.floor((now.getTime() - then.getTime()) / 1000);

    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
}

export default function AdminDashboard() {
  const searchParams = useSearchParams();
  const schoolId = searchParams.get('schoolId');
  const [schoolName, setSchoolName] = React.useState('');
  const [stats, setStats] = React.useState({ totalStudents: 0, totalStaff: 0, overallFeeBalance: 0, attendanceRate: 0 });
  const [activities, setActivities] = React.useState<RecentActivity[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    if (!schoolId) {
      setIsLoading(false);
      return;
    }
    
    const unsubscribers: (() => void)[] = [];

    const schoolRef = doc(firestore, 'schools', schoolId);
    unsubscribers.push(onSnapshot(schoolRef, (docSnap) => {
      if (docSnap.exists()) {
        setSchoolName(docSnap.data().name);
      }
    }));
    
    const usersQuery = query(collection(firestore, `schools/${schoolId}/users`));
    unsubscribers.push(onSnapshot(usersQuery, (usersSnapshot) => {
        const studentCount = usersSnapshot.docs.filter(doc => doc.data().role === 'Student').length;
        setStats(prev => ({...prev, totalStudents: studentCount, totalStaff: usersSnapshot.size - studentCount }));
        
        let totalBilled = 0;
        let totalPaid = 0;
        usersSnapshot.forEach(doc => {
            if (doc.data().role === 'Student') {
                totalBilled += doc.data().totalFee || 0;
                totalPaid += doc.data().amountPaid || 0;
            }
        });
        const balance = totalBilled - totalPaid;
        setStats(prev => ({...prev, overallFeeBalance: balance}));
    }));

    const fetchAttendanceRate = async () => {
        const studentDocs = await getDocs(query(collection(firestore, `schools/${schoolId}/users`), where('role', '==', 'Student')));
        const studentCount = studentDocs.size;
        if (studentCount === 0) {
            setStats(prev => ({...prev, attendanceRate: 100}));
            return;
        }

        const today = new Date();
        const startOfToday = new Date(today.setHours(0, 0, 0, 0));
        const attendanceQuery = query(collection(firestore, `schools/${schoolId}/attendance`), where('date', '>=', Timestamp.fromDate(startOfToday)));
        const attSnapshot = await getDocs(attendanceQuery);
        const presentCount = attSnapshot.docs.filter(r => ['Present', 'Late', 'present', 'late'].includes(r.data().status)).length;
        setStats(prev => ({...prev, attendanceRate: Math.round((presentCount / studentCount) * 100)}));
    }
    fetchAttendanceRate();


    const notificationsQuery = query(collection(firestore, `schools/${schoolId}/notifications`), orderBy('createdAt', 'desc'), limit(15));
    unsubscribers.push(onSnapshot(notificationsQuery, (snapshot) => {
      const fetchedActivities = snapshot.docs.map(doc => {
        const data = doc.data();
        let category;
        if(data.href) {
            category = data.href.split('/')[2]?.replace('-', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()).split(' ')[0] || 'General';
        } else {
            category = data.category || 'General';
        }
        
        return {
          id: doc.id,
          icon: activityIconMap[category] || BookOpen,
          title: data.description,
          time: formatTimeAgo(data.createdAt),
          category: category,
          href: data.href || '#',
        }
      });
      setActivities(fetchedActivities);
      setIsLoading(false);
    }));

    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }, [schoolId]);

  const overviewStats = [
    { title: "Total Students", stat: stats.totalStudents, icon: <Users className="h-6 w-6 text-muted-foreground" /> },
    { title: "Total Staff", stat: stats.totalStaff, icon: <UserCheck className="h-6 w-6 text-muted-foreground" /> },
    { title: "Overall Fee Balance", stat: formatCurrency(stats.overallFeeBalance), icon: <CircleDollarSign className="h-6 w-6 text-muted-foreground" /> },
    { title: "Today's Attendance", stat: `${stats.attendanceRate}%`, icon: <ClipboardCheck className="h-6 w-6 text-muted-foreground" /> }
  ];

  if (!schoolId) {
      return (
        <div className="flex h-screen items-center justify-center">
            <div className="text-center">
                <h2 className="text-2xl font-bold">School Not Found</h2>
                <p className="text-muted-foreground">Please select a school from the developer portal.</p>
                <Button asChild className="mt-4">
                    <Link href="/developer">Go to Developer Portal</Link>
                </Button>
            </div>
        </div>
      )
  }

  return (
    <div>
      <div className="mb-8 flex justify-between items-start">
        <div>
            <h1 className="font-headline text-3xl font-bold flex items-center gap-2">
                <LayoutDashboard className="h-8 w-8 text-primary"/>
                {schoolName || 'Admin Dashboard'}
            </h1>
            <p className="text-muted-foreground">School-wide overview and management.</p>
        </div>
      </div>
      
       <div className="space-y-8 overflow-auto">
            <div>
                <h2 className="text-xl font-headline font-semibold mb-4">Key Metrics</h2>
                 <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    {isLoading ? Array(4).fill(0).map((_, index) => (
                        <Card key={index}>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                 <div className="h-5 w-32 rounded-md bg-muted animate-pulse" />
                            </CardHeader>
                            <CardContent>
                                 <div className="h-8 w-16 rounded-md bg-muted animate-pulse" />
                            </CardContent>
                        </Card>
                    )) : overviewStats.map((stat) => (
                        <Link href={`${overviewLinks[stat.title]}?schoolId=${schoolId}` || '#'} key={stat.title}>
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
            </div>

            <Separator />
            
             <Card>
                <CardHeader>
                    <CardTitle className="font-headline">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    <Button asChild size="lg"><Link href={`/admin/enrolment?schoolId=${schoolId}`}><UserPlus className="mr-2" /> Register New Student</Link></Button>
                    <Button asChild size="lg"><Link href={`/admin/fees?schoolId=${schoolId}`}><CircleDollarSign className="mr-2"/> Record Bulk Payment</Link></Button>
                    <Button asChild size="lg"><Link href={`/admin/announcements?schoolId=${schoolId}`}><Megaphone className="mr-2"/> Send Announcement</Link></Button>
                </CardContent>
            </Card>
       </div>

       <div className="mt-8 grid gap-8 lg:grid-cols-3">
         <div className="lg:col-span-1 space-y-8">
            <SecurityAlertsWidget schoolId={schoolId} />
         </div>
          <div className="lg:col-span-2 space-y-8 overflow-auto">
            <FinanceSnapshot />
          </div>
          <div className="lg:col-span-3">
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline">Recent Activity</CardTitle>
                    <CardDescription>A live feed of important events across the school.</CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex items-center justify-center h-48">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : (
                        <ScrollArea className="h-[500px] pr-4">
                            <div className="space-y-6">
                                {activities.map((activity, index) => (
                                    <Link key={activity.id} href={`${activity.href}?schoolId=${schoolId}` || '#'} className="block hover:bg-muted/50 p-2 -m-2 rounded-lg">
                                        <div className="flex items-start gap-4">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                                                <activity.icon className="h-5 w-5 text-red-600" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm font-medium"><span className="bg-muted dark:bg-transparent px-2 py-1 rounded-md">{activity.title}</span></p>
                                                <p className="text-xs text-muted-foreground">{activity.time}</p>
                                            </div>
                                            <Badge variant={activity.category === 'Urgent' || activity.category === 'Security' ? 'destructive' : 'outline'}>{activity.category}</Badge>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </ScrollArea>
                    )}
                </CardContent>
            </Card>
          </div>
          <div className="lg:col-span-3">
             <CalendarWidget />
          </div>
      </div>
    </div>
  );
}
