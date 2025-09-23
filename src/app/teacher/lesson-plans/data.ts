"use client";

import { Timestamp } from "firebase/firestore";

export type LessonPlanStatus =
  | "Published"
  | "Draft"
  | "Completed"
  | "In Progress"
  | "Skipped";

export type LessonPlan = {
  id: string;
  topic: string;
  subject: string;
  grade: string;
  date: Timestamp;
  status: LessonPlanStatus;
  objectives?: string;
  materials?: string;
  activities?: string;
  assessment?: string;
};
