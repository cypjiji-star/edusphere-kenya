
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shapes, PlusCircle } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { FinanceSnapshot, PerformanceSnapshot } from './admin-charts';
import { CalendarWidget } from './calendar-widget';
import { overviewStats, quickStats, recentActivities } from './dashboard-data';


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
                        <Card key={stat.title}>
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
                    ))}
                </div>
            </div>

            <Separator />
            
            <div className="grid gap-8 lg:grid-cols-2">
                 <div>
                    <h2 className="text-xl font-semibold mb-4">Quick Stats</h2>
                     <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
                </div>
                <div>
                     <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
                     <Card>
                        <CardContent className="p-4">
                           <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                <Button disabled><PlusCircle /> Add Student</Button>
                                <Button disabled><Users /> Add Teacher</Button>
                                <Button disabled><Megaphone /> Post Announcement</Button>
                                <Button variant="secondary" asChild disabled><Link href="#"><Shapes/>Manage Classes</Link></Button>
                                <Button variant="secondary" asChild disabled><Link href="#"><CircleDollarSign/>Manage Fees</Link></Button>
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
                            <div key={index} className="flex items-start gap-4">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                                    {activity.icon}
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-medium">{activity.title}</p>
                                    <p className="text-xs text-muted-foreground">{activity.time}</p>
                                </div>
                                <Badge variant={activity.category === 'Urgent' ? 'destructive' : 'outline'}>{activity.category}</Badge>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
            <CalendarWidget />
         </div>
          <div className="lg:col-span-2 space-y-8">
            <FinanceSnapshot />
            <PerformanceSnapshot />
          </div>
      </div>
    </div>
  );
}
