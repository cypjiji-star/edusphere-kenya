import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { GraduationCap } from 'lucide-react';

export default function TeacherDashboard() {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-2xl">Teacher Dashboard</CardTitle>
          <CardDescription>Welcome to your central hub for managing your classroom.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 rounded-lg border-2 border-dashed border-muted">
            <div className="text-center">
              <GraduationCap className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-sm font-medium text-muted-foreground">Content coming soon</h3>
              <p className="mt-1 text-sm text-muted-foreground">This is where your dashboard widgets will appear.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
