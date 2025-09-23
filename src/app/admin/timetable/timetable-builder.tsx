
"use client";

import * as React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export function TimetableBuilder({ schoolId }: { schoolId: string }) {
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    // Simulate data loading
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading Timetable Data...</CardTitle>
          <CardDescription>
            Please wait while we prepare the timetable builder.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-96">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }
  return (
    <Card>
      <CardHeader>
        <CardTitle>Timetable Builder</CardTitle>
        <CardDescription>
          Drag and drop subjects to build the school timetable.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex h-96 items-center justify-center rounded-lg border-2 border-dashed">
          <p className="text-muted-foreground">Timetable interface will be built here.</p>
        </div>
      </CardContent>
    </Card>
  );
}

    