"use client";

import * as React from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Loader2 } from "lucide-react";
import { firestore } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
  limit,
  Timestamp,
} from "firebase/firestore";

type UpcomingEvent = {
  id: string;
  date: Timestamp;
  title: string;
};

export function NextEventWidget({ schoolId }: { schoolId: string }) {
  const [nextEvent, setNextEvent] = React.useState<UpcomingEvent | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    if (!schoolId) {
      setIsLoading(false);
      return;
    }

    const q = query(
      collection(firestore, `schools/${schoolId}/calendar-events`),
      where("date", ">=", Timestamp.now()),
      orderBy("date", "asc"),
      limit(1),
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        setNextEvent({ id: doc.id, ...doc.data() } as UpcomingEvent);
      } else {
        setNextEvent(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [schoolId]);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          Next Event
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex h-10 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : nextEvent ? (
          <>
            <div className="text-lg font-bold">{nextEvent.title}</div>
            <p className="text-xs text-muted-foreground">
              {nextEvent.date.toDate().toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            No upcoming events scheduled.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
