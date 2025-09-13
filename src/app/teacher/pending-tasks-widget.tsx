
'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ClipboardList, AlertTriangle, CheckCircle, ArrowRight } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { allAssignments } from '@/app/teacher/assignments/page';
import { differenceInDays, parseISO } from 'date-fns';

const tasks = allAssignments
    .filter(a => a.submissions < a.totalStudents)
    .map(a => ({
        type: 'assignment' as const,
        id: a.id,
        title: a.title,
        dueDate: a.dueDate,
        status: 'Ungraded',
        count: a.totalStudents - a.submissions,
        href: `/teacher/assignments/${a.id}`,
    }))
    .sort((a,b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());


export function PendingTasksWidget() {

  const getDueDateText = (dueDate: string) => {
    const days = differenceInDays(parseISO(dueDate), new Date());
    if (days < -1) return `${Math.abs(days)} days ago`;
    if (days === -1) return 'Yesterday';
    if (days === 0) return 'Today';
    if (days === 1) return 'Tomorrow';
    return `in ${days} days`;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline text-lg flex items-center gap-2">
          <ClipboardList className="h-5 w-5 text-primary" />
          Pending Tasks
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {tasks.map((task, index) => (
            <div key={index}>
              <div className="flex flex-col gap-2">
                <div className="flex items-start justify-between">
                    <div className="space-y-1">
                        <p className="font-semibold text-sm">{task.title}</p>
                        {task.type === 'assignment' && (
                            <p className="text-xs text-muted-foreground">{task.count} submissions to grade</p>
                        )}
                    </div>
                    {task.type === 'assignment' ? (
                         <Button asChild size="sm" variant="secondary">
                            <Link href={task.href!}>Grade Now</Link>
                         </Button>
                    ): null}
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  {task.status === 'Ungraded' ? (
                     <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  ) : (
                     <CheckCircle className="h-4 w-4 text-green-500" />
                  )}
                  <span>{task.status}</span>
                  <Separator orientation="vertical" className="h-4" />
                  <span>Due {getDueDateText(task.dueDate)}</span>
                </div>
              </div>
              {index < tasks.length - 1 && <Separator className="my-4" />}
            </div>
          ))}
          {tasks.length === 0 && (
            <div className="text-center text-muted-foreground py-8">
              <CheckCircle className="h-12 w-12 mx-auto text-green-500" />
              <p className="mt-4 font-semibold">All caught up!</p>
              <p className="text-sm">You have no pending tasks.</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
