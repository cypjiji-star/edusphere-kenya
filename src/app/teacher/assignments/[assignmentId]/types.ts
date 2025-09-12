
export type SubmissionStatus = 'Submitted' | 'Not Submitted' | 'Late';

export type Submission = {
  studentId: string;
  studentName: string;
  avatarUrl: string;
  status: SubmissionStatus;
  submittedDate?: string;
  grade?: string;
  feedback?: string;
};
