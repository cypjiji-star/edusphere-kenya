
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, UserCheck, UserPlus, ClipboardCheck, CircleDollarSign, Calendar, ArrowUp, PlusCircle, Megaphone, Shapes } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';

const overviewStats = [
    {
        title: "Total Students",
        stat: "852",
        icon: <Users className="h-6 w-6 text-muted-foreground" />,
        subtext: "1.2%",
        subtextIcon: <ArrowUp className="h-4 w-4 text-green-600" />,
        subtextDescription: "vs last term",
    },
    {
        title: "Total Teachers",
        stat: "45",
        icon: <UserCheck className="h-6 w-6 text-muted-foreground" />,
    },
    {
        title: "Active Parents",
        stat: "780",
        icon: <Users className="h-6 w-6 text-muted-foreground" />,
    },
    {
        title: "Pending Registrations",
        stat: "5",
        icon: <UserPlus className="h-6 w-6 text-muted-foreground" />,
    }
];

const quickStats = [
    {
        title: "Today's Attendance",
        stat: "96%",
        icon: <ClipboardCheck className="h-6 w-6 text-muted-foreground" />,
    },
    {
        title: "Fees Collected (Term 2)",
        stat: "82%",
        icon: <CircleDollarSign className="h-6 w-6 text-muted-foreground" />,
    },
     {
        title: "Upcoming Events",
        stat: "3",
        icon: <Calendar className="h-6 w-6 text-muted-foreground" />,
    },
];


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
                                <Button disabled><UserPlus /> Add Teacher</Button>
                                <Button disabled><Megaphone /> Post Announcement</Button>
                                <Button variant="secondary" asChild disabled><Link href="#"><Shapes/>Manage Classes</Link></Button>
                                <Button variant="secondary" asChild disabled><Link href="#"><CircleDollarSign/>Manage Fees</Link></Button>
                           </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
       </div>

       <div className="mt-8 grid gap-8 lg:grid-cols-2">
         <Card>
            <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Placeholder for recent system-wide activity log.</CardDescription>
            </CardHeader>
            <CardContent>
                 <div className="flex h-[200px] items-center justify-center rounded-lg border-2 border-dashed border-muted">
                    <p className="text-muted-foreground">Activity feed coming soon...</p>
                 </div>
            </CardContent>
         </Card>
          <Card>
            <CardHeader>
                <CardTitle>System Status</CardTitle>
                <CardDescription>Placeholder for system health and status updates.</CardDescription>
            </CardHeader>
            <CardContent>
                 <div className="flex h-[200px] items-center justify-center rounded-lg border-2 border-dashed border-muted">
                    <p className="text-muted-foreground">System status indicators coming soon...</p>
                 </div>
            </CardContent>
         </Card>
      </div>
    </div>
  );
}
