
import { z } from 'zod';

const studentGradeSchema = z.object({
  studentId: z.string(),
  grade: z.string().optional(),
});

export const gradeEntrySchema = z.object({
  classId: z.string({ required_error: 'Please select a class.' }),
  subject: z.string({ required_error: 'Please select a subject.' }),
  assessmentId: z.string({ required_error: 'Please select an assessment.' }),
  grades: z.array(studentGradeSchema),
});

export type GradeEntryFormValues = z.infer<typeof gradeEntrySchema>;
