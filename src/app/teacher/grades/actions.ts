
'use server';

import { z } from 'zod';

const studentGradeSchema = z.object({
  studentId: z.string(),
  grade: z.string().min(1, { message: "Grade is required" }),
});

export const gradeEntrySchema = z.object({
  classId: z.string({ required_error: 'Please select a class.' }),
  assessmentTitle: z.string().min(3, 'Assessment title must be at least 3 characters.'),
  assessmentType: z.enum(['Exam', 'Quiz', 'Assignment', 'Project']),
  assessmentDate: z.date({ required_error: 'An assessment date is required.' }),
  grades: z.array(studentGradeSchema),
});

export type GradeEntryFormValues = z.infer<typeof gradeEntrySchema>;

// In a real app, this would save to a database.
export async function saveGradesAction(data: GradeEntryFormValues) {
  console.log('Saving new assessment grades:', data);
  
  // Here you would:
  // 1. Create a new assessment record in your database.
  // 2. Create grade records for each student linked to the new assessment.
  // 3. Revalidate the path for the main grades page to show the new assessment column.
  
  // revalidatePath(`/teacher/grades`);

  return { success: true, message: 'Grades saved successfully!' };
}
