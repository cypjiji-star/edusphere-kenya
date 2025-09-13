
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shapes, PlusCircle, Users, Megaphone, CircleDollarSign } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { FinanceSnapshot, PerformanceSnapshot } from './admin-charts';
import { CalendarWidget } from './calendar-widget';
import { overviewStats, quickStats, recentActivities } from './dashboard-data';


const overviewLinks: Record<string, string> = {
    "Total Students": "/admin/users",
    "Total Teachers": "/admin/users",
    "Active Parents": "/admin/users",
    "Pending Registrations": "/admin/enrolment",
}

const quickStatLinks: Record<string, string> = {
    "Today's Attendance": "/admin/attendance",
    "Fees Collected (Term 2)": "/admin/fees",
    "Upcoming Events": "/admin/calendar",
}

const activityCategoryLinks: Record<string, string> = {
    Urgent: '/admin/health',
    Registration: '/admin/enrolment',
    Grades: '/admin/grades',
    Attendance: '/admin/attendance',
    Academics: '/admin/lesson-plans',
    Comms: '/admin/announcements',
}


export default function AdminDashboard() {
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
                    <div className="space-y-6">
                        {recentActivities.map((activity, index) => (
                            <Link key={index} href={activityCategoryLinks[activity.category] || '#'} className="block hover:bg-muted/50 p-2 -m-2 rounded-lg">
                                <div className="flex items-start gap-4">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                                        {activity.icon}
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
