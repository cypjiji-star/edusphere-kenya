import { z } from 'zod';

const studentGradeSchema = z.object({
  studentId: z.string(),
  grade: z.string()
    .transform((val) => val.trim()) // Trim whitespace
    .refine((val) => {
      if (val === '') return true; // Allow empty string
      const num = Number(val);
      return !isNaN(num) && num >= 0 && num <= 100;
    }, {
      message: "Grade must be a number between 0 and 100, or empty.",
    })
    .optional()
    .or(z.literal('')), // Explicitly allow empty string
});

export const gradeEntrySchema = z.object({
  classId: z.string({ required_error: 'Please select a class.' }).min(1, 'Please select a class.'),
  subject: z.string({ required_error: 'Please select a subject.' }).min(1, 'Please select a subject.'),
  assessmentId: z.string({ required_error: 'Please select an assessment.' }).min(1, 'Please select an assessment.'),
  grades: z.array(studentGradeSchema).min(1, 'At least one student grade entry is required.'),
}).refine((data) => {
  // Custom validation: ensure at least one grade is provided
  const hasAtLeastOneGrade = data.grades.some(grade => grade.grade && grade.grade.trim() !== '');
  return hasAtLeastOneGrade;
}, {
  message: "Please enter at least one grade.",
  path: ["grades"], // This will attach the error to the grades field
});

export type GradeEntryFormValues = z.infer<typeof gradeEntrySchema>;