"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ClipboardList,
  AlertTriangle,
  CheckCircle,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { differenceInDays, parseISO } from "date-fns";
import * as React from "react";
import { firestore, auth } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  Timestamp,
} from "firebase/firestore";
import { useSearchParams } from "next/navigation";

type AssignmentTask = {
  type: "assignment";
  id: string;
  title: string;
  dueDate: string;
  status: "Ungraded";
  count: number;
  href: string;
};

export function PendingTasksWidget() {
  const searchParams = useSearchParams();
  const schoolId = searchParams.get("schoolId");
  const [tasks, setTasks] = React.useState<AssignmentTask[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const user = auth.currentUser;

  React.useEffect(() => {
    if (!schoolId || !user) {
      setIsLoading(false);
      return;
    }
    const teacherId = user.uid;

    setIsLoading(true);
    const assignmentsQuery = query(
      collection(firestore, `schools/${schoolId}/assignments`),
      where("teacherId", "==", teacherId),
    );

    const unsubscribe = onSnapshot(
      assignmentsQuery,
      (snapshot) => {
        const fetchedTasks: AssignmentTask[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          if (data.submissions < data.totalStudents) {
            fetchedTasks.push({
              type: "assignment",
              id: doc.id,
              title: data.title,
              dueDate: (data.dueDate as Timestamp).toDate().toISOString(),
              status: "Ungraded",
              count: data.totalStudents - data.submissions,
              href: `/teacher/assignments/${doc.id}?schoolId=${schoolId}`,
            });
          }
        });
        setTasks(
          fetchedTasks.sort(
            (a, b) =>
              new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime(),
          ),
        );
        setIsLoading(false);
      },
      (error) => {
        console.error("Error fetching tasks: ", error);
        setIsLoading(false);
      },
    );

    return () => unsubscribe();
  }, [schoolId, user]);

  const getDueDateText = (dueDate: string) => {
    const days = differenceInDays(parseISO(dueDate), new Date());
    if (days < -1) return `${Math.abs(days)} days ago`;
    if (days === -1) return "Yesterday";
    if (days === 0) return "Today";
    if (days === 1) return "Tomorrow";
    return `in ${days} days`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline text-lg flex items-center gap-2">
          <ClipboardList className="h-5 w-5 text-primary" />
          Pending Tasks
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center h-24">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-4">
            {tasks.map((task, index) => (
              <div key={index}>
                <div className="flex flex-col gap-2">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <p className="font-semibold text-sm">{task.title}</p>
                      {task.type === "assignment" && (
                        <p className="text-xs text-muted-foreground">
                          {task.count} submissions to grade
                        </p>
                      )}
                    </div>
                    {task.type === "assignment" ? (
                      <Button asChild size="sm" variant="secondary">
                        <Link href={task.href!}>Grade Now</Link>
                      </Button>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {task.status === "Ungraded" ? (
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
        )}
      </CardContent>
    </Card>
  );
}
