
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
import { TimetableBuilder } from "./timetable-builder";
import { useSearchParams } from "next/navigation";
import { NiceError } from "@/components/ui/nice-error";

export default function TimetablePage() {
  const searchParams = useSearchParams();
  const schoolId = searchParams.get("schoolId");

  if (!schoolId) {
    return (
      <NiceError
        title="School ID Missing"
        description="The school identifier is missing from the URL. Please access this page through your school's portal."
      />
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="font-headline text-3xl font-bold flex items-center gap-2">
          <Calendar className="h-8 w-8 text-primary" />
          Timetable Builder
        </h1>
        <p className="text-muted-foreground">
          Manage the master timetable for the entire school.
        </p>
      </div>

      <TimetableBuilder schoolId={schoolId} />
    </div>
  );
}

    