
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

export function ParentTimetable({ schoolId }: { schoolId: string }) {
  const { user } = useAuth();
  const [children, setChildren] = React.useState<Child[]>([]);
  const [selectedChildId, setSelectedChildId] = React.useState<string>("");
  const [timetable, setTimetable] = React.useState<TimetableData>({});
  const [periods, setPeriods] = React.useState<Period[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    if (!schoolId || !user) return;

    const childrenQuery = query(
      collection(firestore, `schools/${schoolId}/users`),
      where("parentId", "==", user.uid),
      where("role", "==", "Student"),
    );

    const unsubChildren = onSnapshot(childrenQuery, (snapshot) => {
      const childrenData = snapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() }) as Child,
      );
      setChildren(childrenData);
      if (childrenData.length > 0 && !selectedChildId) {
        setSelectedChildId(childrenData[0].id);
      }
      setIsLoading(false);
    });

    const unsubPeriods = onSnapshot(
        doc(firestore, `schools/${schoolId}/timetableSettings/periods`),
        (doc) => {
          if (doc.exists()) {
            setPeriods(doc.data().periods as Period[]);
          }
        },
      );

    return () => {
        unsubChildren();
        unsubPeriods();
    };
  }, [schoolId, user, selectedChildId]);


  React.useEffect(() => {
    if (!selectedChildId) return;
    
    const selectedChild = children.find(c => c.id === selectedChildId);
    if (!selectedChild?.classId) return;

    const timetableRef = doc(firestore, `schools/${schoolId}/timetables`, selectedChild.classId);
    const unsubTimetable = onSnapshot(timetableRef, (docSnap) => {
        if(docSnap.exists()){
            setTimetable(docSnap.data() as TimetableData);
        } else {
            setTimetable({});
        }
    });

    return () => unsubTimetable();

  }, [selectedChildId, children, schoolId]);

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
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <CardTitle>Class Timetable</CardTitle>
            <CardDescription>
              The weekly lesson schedule for your child.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            <Select value={selectedChildId} onValueChange={setSelectedChildId}>
              <SelectTrigger className="w-full md:w-[240px]">
                <SelectValue placeholder="Select a child" />
              </SelectTrigger>
              <SelectContent>
                {children.map((child) => (
                  <SelectItem key={child.id} value={child.id}>
                    {child.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
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
                    const entry = timetable[day]?.[period.time];
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
                              {entry.subject.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {entry.subject.teacher}
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
