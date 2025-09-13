
'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ClipboardList, AlertTriangle, CheckCircle, ArrowRight } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

const tasks = [
  { 
    type: 'assignment',
    title: 'Form 4 Chemistry - Acid-Base Titration Lab',
    dueDate: '2 days ago',
    status: 'Ungraded',
    count: 15,
    href: '/teacher/assignments/1',
  },
  {
    type: 'reminder',
    title: 'Mid-Term Exam Grades Due',
    dueDate: 'in 3 days',
    status: 'Upcoming Deadline',
  },
  { 
    type: 'assignment',
    title: 'Form 3 English - The River and The Source Essay',
    dueDate: '4 days ago',
    status: 'Ungraded',
    count: 22,
    href: '/teacher/assignments/2',
  },
];

export function PendingTasksWidget() {
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
                  <span>Due {task.dueDate}</span>
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
