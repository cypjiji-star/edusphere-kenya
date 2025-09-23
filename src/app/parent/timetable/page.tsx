
"use client";

import * as React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Calendar } from "lucide-react";
import { ParentTimetable } from "./parent-timetable";
import { useSearchParams } from "next/navigation";

export default function TimetablePage() {
  const searchParams = useSearchParams();
  const schoolId = searchParams.get("schoolId");

  if (!schoolId) {
    return <div className="p-8">Error: School ID is missing.</div>;
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6 p-4 md:p-6 bg-card border rounded-lg">
        <h1 className="font-headline text-3xl font-bold flex items-center gap-2">
          <Calendar className="h-8 w-8 text-primary" />
          Weekly Timetable
        </h1>
        <p className="text-muted-foreground">
          View your child's weekly class schedule.
        </p>
      </div>

      <ParentTimetable schoolId={schoolId} />
    </div>
  );
}
