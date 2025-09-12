import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Users, ClipboardCheck, UserCheck, UserX } from 'lucide-react';

const adminStats = [
    {
        title: "Total Students",
        stat: "852",
        icon: <Users className="h-6 w-6 text-muted-foreground" />,
    },
    {
        title: "Total Staff",
        stat: "45",
        icon: <UserCheck className="h-6 w-6 text-muted-foreground" />,
    },
    {
        title: "School-wide Attendance",
        stat: "96%",
        icon: <ClipboardCheck className="h-6 w-6 text-muted-foreground" />,
    },
    {
        title: "Staff on Leave",
        stat: "2",
        icon: <UserX className="h-6 w-6 text-muted-foreground" />,
    }
];


export default function AdminDashboard() {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="font-headline text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">School-wide overview and management.</p>
      </div>

       <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {adminStats.map((stat) => (
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
