
"use client";

import * as React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { User, Loader2 } from "lucide-react";
import { firestore } from "@/lib/firebase";
import { collection, query, where, onSnapshot, doc, getDoc } from "firebase/firestore";
import { useAuth } from "@/context/auth-context";

type Lesson = {
  subject: { name: string; teacher: string };
  room: string;
};
type TimetableData = Record<string, Record<string, Lesson>>;
type Period = { id: number; time: string; isBreak?: boolean; title?: string };
type Child = { id: string; name: string; classId: string };

const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

export function TeacherTimetable({ schoolId }: { schoolId: string }) {
  const { user } = useAuth();
  const [schedule, setSchedule] = React.useState<Record<string, any>>({});
  const [periods, setPeriods] = React.useState<Period[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    if (!schoolId || !user) return;

    const teacherName = user.displayName;

    const unsub = onSnapshot(
      collection(firestore, `schools/${schoolId}/timetables`),
      (snapshot) => {
        const teacherSchedule: Record<string, any> = {};
        snapshot.forEach((doc) => {
          const classTimetable = doc.data() as TimetableData;
          const className = doc.id; // Or fetch class name if needed
          Object.entries(classTimetable).forEach(([day, periods]) => {
            Object.entries(periods).forEach(([time, lesson]) => {
              if (lesson.subject.teacher === teacherName) {
                if (!teacherSchedule[time]) {
                  teacherSchedule[time] = {};
                }
                teacherSchedule[time][day] = {
                  subject: lesson.subject.name,
                  class: className,
                  room: lesson.room,
                };
              }
            });
          });
        });
        setSchedule(teacherSchedule);
        setIsLoading(false);
      },
    );

    const unsubPeriods = onSnapshot(
      doc(firestore, `schools/${schoolId}/timetableSettings/periods`),
      (doc) => {
        if (doc.exists()) {
          setPeriods(doc.data().periods as Period[]);
        }
      },
    );

    return () => {
      unsub();
      unsubPeriods();
    };
  }, [schoolId, user]);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>My Weekly Schedule</CardTitle>
        <CardDescription>
          Your assigned teaching schedule for the week.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="w-full overflow-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-32 text-center">Time</TableHead>
                {days.map((day) => (
                  <TableHead key={day} className="text-center">
                    {day}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {periods.map((period) => (
                <TableRow key={period.id}>
                  <TableCell className="font-semibold text-center text-primary">
                    {period.time}
                  </TableCell>
                  {days.map((day) => {
                    const entry = schedule[period.time]?.[day];
                    return (
                      <TableCell key={day} className="p-1 text-center">
                        {period.isBreak ? (
                          <div className="h-full flex items-center justify-center bg-muted/50 rounded-md p-2">
                            <p className="font-semibold text-muted-foreground text-xs">
                              {period.title}
                            </p>
                          </div>
                        ) : entry ? (
                          <div className="p-2 rounded-md bg-primary/10">
                            <p className="font-bold text-sm">
                              {entry.subject}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {entry.class}
                            </p>
                          </div>
                        ) : null}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
