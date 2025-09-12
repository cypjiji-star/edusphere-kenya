
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { FileClock } from 'lucide-react';

export default function AuditLogsPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="font-headline text-3xl font-bold flex items-center gap-2">
            <FileClock className="h-8 w-8 text-primary"/>
            Audit Logs
        </h1>
        <p className="text-muted-foreground">Track important activities and changes within the portal.</p>
      </div>

       <Card>
            <CardHeader>
                <CardTitle>System Activity Log</CardTitle>
                <CardDescription>This is a placeholder for where the activity log will be displayed.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex h-[400px] w-full items-center justify-center rounded-lg border-2 border-dashed border-muted">
                    <p className="text-muted-foreground">A detailed log of all actions will be available here soon.</p>
                </div>
            </CardContent>
        </Card>
    </div>
  );
}
