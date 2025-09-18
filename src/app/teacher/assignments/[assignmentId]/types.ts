
export type SubmissionStatus = 'Graded' | 'Handed In' | 'Not Handed In';

export type Submission = {
  studentId: string;
  studentName: string;
  avatarUrl: string;
  status: SubmissionStatus;
  submittedDate?: string;
  grade?: string;
  feedback?: string;
  submissionId?: string; // Add this to track the submission document ID
};
