

import { z } from 'zod';

const studentGradeSchema = z.object({
  studentId: z.string(),
  grade: z.string().refine((val) => {
    if (val === '') return true; // Allow empty string
    const num = Number(val);
    return !isNaN(num) && num >= 0 && num <= 100;
  }, {
    message: "Grade must be a number between 0 and 100, or empty.",
  }).optional(),
});

export const gradeEntrySchema = z.object({
  classId: z.string({ required_error: 'Please select a class.' }),
  subject: z.string({ required_error: 'Please select a subject.' }),
  assessmentId: z.string({ required_error: 'Please select an assessment.' }),
  grades: z.array(studentGradeSchema),
});

export type GradeEntryFormValues = z.infer<typeof gradeEntrySchema>;

