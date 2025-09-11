import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Calendar } from 'lucide-react';

export default function CalendarPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <Card>
        <CardHeader>
          <div>
            <CardTitle className="font-headline text-2xl">Events Calendar</CardTitle>
            <CardDescription>View school events, class schedules, and important dates.</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex min-h-[400px] items-center justify-center rounded-lg border-2 border-dashed border-muted">
            <div className="text-center">
              <Calendar className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-sm font-medium text-muted-foreground">Full Calendar Coming Soon</h3>
              <p className="mt-1 text-sm text-muted-foreground">This section will display a full monthly or weekly calendar view.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
