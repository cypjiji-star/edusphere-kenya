
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
import { Shapes, PlusCircle, Users, Megaphone, CircleDollarSign, ArrowUp, UserCheck, UserPlus, ClipboardCheck, Calendar, ShieldAlert, FileText, AlertTriangle, BookOpen, Loader2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { FinanceSnapshot, PerformanceSnapshot } from './admin-charts';
import { CalendarWidget } from './calendar-widget';
import { firestore } from '@/lib/firebase';
import { collection, query, where, onSnapshot, limit, orderBy, Timestamp } from 'firebase/firestore';

const overviewLinks: Record<string, string> = {
    "Total Students": "/admin/users",
    "Total Teachers": "/admin/users",
    "Active Parents": "/admin/users",
    "Pending Registrations": "/admin/enrolment",
};

const quickStatLinks: Record<string, string> = {
    "Today's Attendance": "/admin/attendance",
    "Fees Collected (Term 2)": "/admin/fees",
    "Upcoming Events": "/admin/calendar",
};

const activityCategoryLinks: Record<string, string> = {
    Urgent: '/admin/health',
    Registration: '/admin/enrolment',
    Grades: '/admin/grades',
    Attendance: '/admin/attendance',
    Academics: '/admin/lesson-plans',
    Comms: '/admin/announcements',
};

const activityIconMap: Record<string, React.ElementType> = {
    Urgent: ShieldAlert,
    Registration: UserPlus,
    Grades: FileText,
    Attendance: AlertTriangle,
    Academics: BookOpen,
    Comms: Megaphone,
};

type RecentActivity = {
    id: string;
    icon: React.ElementType;
    title: string;
    time: string;
    category: string;
};

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
  const [stats, setStats] = React.useState({ totalStudents: 0, totalTeachers: 0, activeParents: 0, pendingRegistrations: 0 });
  const [quickStatsData, setQuickStatsData] = React.useState({ attendance: 0, feesCollected: 0, upcomingEvents: 0 });
  const [activities, setActivities] = React.useState<RecentActivity[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    // --- STATS ---
    const usersQuery = query(collection(firestore, 'users'));
    const unsubUsers = onSnapshot(usersQuery, (snapshot) => {
        let students = 0, teachers = 0, parents = 0;
        snapshot.forEach(doc => {
            const user = doc.data();
            if (user.role === 'Student') students++;
            if (user.role === 'Teacher') teachers++;
            if (user.role === 'Parent' && user.status === 'Active') parents++;
        });
        setStats(prev => ({...prev, totalStudents: students, totalTeachers: teachers, activeParents: parents }));
    });
    
    const pendingRegQuery = query(collection(firestore, 'students'), where('status', '==', 'Pending'));
    const unsubPendingReg = onSnapshot(pendingRegQuery, (snapshot) => {
      setStats(prev => ({ ...prev, pendingRegistrations: snapshot.size }));
    });
    
    // --- QUICK STATS (mocked for now as logic is complex) ---
    setQuickStatsData({ attendance: 96, feesCollected: 82, upcomingEvents: 3 });

    // --- RECENT ACTIVITIES ---
    const notificationsQuery = query(collection(firestore, 'notifications'), orderBy('createdAt', 'desc'), limit(6));
    const unsubActivities = onSnapshot(notificationsQuery, (snapshot) => {
      const fetchedActivities = snapshot.docs.map(doc => {
          const data = doc.data();
          const category = data.href.split('/')[2]?.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()).split(' ')[0] || 'General';
          return {
            id: doc.id,
            icon: activityIconMap[category] || BookOpen,
            title: data.description,
            time: formatTimeAgo(data.createdAt),
            category: category,
          }
      });
      setActivities(fetchedActivities);
      setIsLoading(false);
    });

    return () => {
        unsubUsers();
        unsubPendingReg();
        unsubActivities();
    };
  }, []);
  
  const overviewStats = [
    { title: "Total Students", stat: stats.totalStudents, icon: <Users className="h-6 w-6 text-muted-foreground" />, subtext: "1.2%", subtextIcon: <ArrowUp className="h-4 w-4 text-green-600" />, subtextDescription: "vs last term" },
    { title: "Total Teachers", stat: stats.totalTeachers, icon: <UserCheck className="h-6 w-6 text-muted-foreground" /> },
    { title: "Active Parents", stat: stats.activeParents, icon: <Users className="h-6 w-6 text-muted-foreground" /> },
    { title: "Pending Registrations", stat: stats.pendingRegistrations, icon: <UserPlus className="h-6 w-6 text-muted-foreground" /> }
  ];

  const quickStats = [
    { title: "Today's Attendance", stat: `${quickStatsData.attendance}%`, icon: <ClipboardCheck className="h-6 w-6 text-muted-foreground" /> },
    { title: "Fees Collected (Term 2)", stat: `${quickStatsData.feesCollected}%`, icon: <CircleDollarSign className="h-6 w-6 text-muted-foreground" /> },
    { title: "Upcoming Events", stat: quickStatsData.upcomingEvents, icon: <Calendar className="h-6 w-6 text-muted-foreground" /> },
  ];


  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="font-headline text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">School-wide overview and management.</p>
      </div>
      
       <div className="space-y-8">
            <div>
                <h2 className="text-xl font-semibold mb-4">School Overview</h2>
                 <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    {overviewStats.map((stat) => (
                        <Link href={overviewLinks[stat.title] || '#'} key={stat.title}>
                            <Card className="hover:bg-muted/50 transition-colors">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                                    {stat.icon}
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{stat.stat}</div>
                                    {stat.subtext && (
                                        <div className="flex items-center text-xs text-muted-foreground">
                                            {stat.subtextIcon}
                                            <span>{stat.subtext} {stat.subtextDescription}</span>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>
            </div>

            <Separator />
            
            <div className="grid gap-8 lg:grid-cols-2">
                 <div>
                    <h2 className="text-xl font-semibold mb-4">Quick Stats</h2>
                     <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {quickStats.map((stat) => (
                            <Link href={quickStatLinks[stat.title] || '#'} key={stat.title}>
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
                <div>
                     <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
                     <Card>
                        <CardContent className="p-4">
                           <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                <Button asChild><Link href="/admin/enrolment"><PlusCircle /> Add Student</Link></Button>
                                <Button asChild><Link href="/admin/users"><Users /> Add Teacher</Link></Button>
                                <Button asChild><Link href="/admin/announcements"><Megaphone /> Post Announcement</Link></Button>
                                <Button asChild variant="secondary"><Link href="/admin/subjects"><Shapes/>Manage Classes</Link></Button>
                                <Button asChild variant="secondary"><Link href="/admin/fees"><CircleDollarSign/>Manage Fees</Link></Button>
                           </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
       </div>

       <div className="mt-8 grid gap-8 lg:grid-cols-3">
         <div className="lg:col-span-1 space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                    <CardDescription>A live feed of important events across the school.</CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex items-center justify-center h-48">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {activities.map((activity, index) => (
                                <Link key={activity.id} href={activityCategoryLinks[activity.category] || '#'} className="block hover:bg-muted/50 p-2 -m-2 rounded-lg">
                                    <div className="flex items-start gap-4">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                                            <activity.icon className="h-5 w-5 text-red-600" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-medium">{activity.title}</p>
                                            <p className="text-xs text-muted-foreground">{activity.time}</p>
                                        </div>
                                        <Badge variant={activity.category === 'Urgent' ? 'destructive' : 'outline'}>{activity.category}</Badge>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
            <CalendarWidget />
         </div>
          <div className="lg:col-span-2 space-y-8">
            <Link href="/admin/fees">
                <FinanceSnapshot />
            </Link>
            <PerformanceSnapshot />
          </div>
      </div>
    </div>
  );
}
