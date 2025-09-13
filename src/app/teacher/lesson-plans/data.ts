'use client';

import { atom } from 'jotai';

export type LessonPlanStatus = 'Published' | 'Draft' | 'Completed' | 'In Progress' | 'Skipped';

export type LessonPlan = {
  id: string;
  topic: string;
  subject: string;
  gradeLevel: string;
  lastUpdated: string;
  status: LessonPlanStatus;
  objectives?: string;
  materials?: string;
  activities?: string;
  assessment?: string;
};

const initialLessonPlans: LessonPlan[] = [
  {
    id: 'lp-1',
    topic: 'Photosynthesis & Respiration',
    subject: 'Biology',
    gradeLevel: 'Form 2',
    lastUpdated: '2024-07-15',
    status: 'Completed',
  },
  {
    id: 'lp-2',
    topic: 'Introduction to Chemical Equations',
    subject: 'Chemistry',
    gradeLevel: 'Form 1',
    lastUpdated: '2024-07-18',
    status: 'In Progress',
  },
  {
    id: 'lp-3',
    topic: 'Shakespeare\'s Macbeth: Act 1 Analysis',
    subject: 'English',
    gradeLevel: 'Form 3',
    lastUpdated: '2024-06-28',
    status: 'Published',
  },
    {
    id: 'lp-4',
    topic: 'The Maasai Culture',
    subject: 'History',
    gradeLevel: 'Grade 6',
    lastUpdated: '2024-07-10',
    status: 'Draft',
  },
  {
    id: 'lp-5',
    topic: 'Linear Equations',
    subject: 'Mathematics',
    gradeLevel: 'Form 3',
    lastUpdated: '2024-07-20',
    status: 'Skipped',
  }
];

export const lessonPlansAtom = atom<LessonPlan[]>(initialLessonPlans);
