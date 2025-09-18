
import type { Timestamp } from 'firebase/firestore';

export type GradeStatus = 'Graded' | 'Pending';

export type Exam = {
  id: string;
  title: string;
  term: string;
  class: string;
  startDate: Timestamp;
  endDate: Timestamp;
  status: 'Draft' | 'Active' | 'Locked' | 'Published' | 'Archived';
  classId?: string;
  progress: number;
  className?: string;
  notes?: string;
};

type Grade = {
  assessmentId: string;
  grade: number | string;
  subject?: string;
};

export type StudentGrade = {
  id: string;
  studentName: string;
  avatarUrl: string;
  grade: string | number;
  overall: number;
  rollNumber?: string;
  grades?: Grade[];
  trend: 'up' | 'down' | 'stable';
  className?: string;
};

export type Assessment = {
  id: string;
  title: string;
  type: 'Exam' | 'Assignment' | 'Quiz';
  date: Timestamp;
  subject?: string;
  className: string;
  classId: string;
  totalStudents?: number;
  submissions?: number;
  dueDate?: Timestamp;
};
