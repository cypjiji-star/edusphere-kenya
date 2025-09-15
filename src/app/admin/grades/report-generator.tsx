
'use client';

import * as React from 'react';
import { format } from 'date-fns';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { useSearchParams } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { FileText, Loader2, Printer, GraduationCap, BarChart, Crown, AlertCircle } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';

// Updated types based on your actual database structure
type Grade = {
  assessmentId: string;
  score: number | string;
  subject?: string;
};

export type StudentGrades = {
  studentId: string;
  studentName: string;
  studentAvatar: string;
  rollNumber: string;
  className: string;
  grades: Grade[];
  overall: number;
};

export type Assessment = {
  id: string;
  title: string;
  term: string;
  startDate: any; // Firestore Timestamp or Date
  class: string;
  subject?: string;
  teacher?: string;
};

const teacherClasses = [
  { id: 'form1', name: 'Form 1' },
  { id: 'form2', name: 'Form 2' },
  { id: 'form3', name: 'Form 3' },
  { id: 'form4', name: 'Form 4' },
  { id: 'form5', name: 'Form 5' },
] as const;

type ReportType = 'individual' | 'summary' | 'ranking';

type GeneratedReport = {
  student: StudentGrades;
  assessments: Assessment[];
};

export function ReportGenerator() {
  const [selectedClass, setSelectedClass] = React.useState<string>('form1');
  const [selectedStudent, setSelectedStudent] = React.useState<string | null>(null);
  const [reportType, setReportType] = React.useState<ReportType>('individual');
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [report, setReport] = React.useState<GeneratedReport | null>(null);
  const [students, setStudents] = React.useState<StudentGrades[]>([]);
  const [assessments, setAssessments] = React.useState<Assessment[]>([]);
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const schoolId = searchParams.get('schoolId');

  // Fetch students and assessments from Firebase
  React.useEffect(() => {
    if (!schoolId) return;

    const fetchData = async () => {
      try {
        // Fetch assessments for the school
        const assessmentsQuery = query(
          collection(firestore, `schools/${schoolId}/assessments`),
        );
        const assessmentsSnapshot = await getDocs(assessmentsQuery);
        const assessmentsData = assessmentsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Assessment[];
        
        setAssessments(assessmentsData);

        // Fetch students for the school
        const studentsQuery = query(
          collection(firestore, `schools/${schoolId}/students`),
          where('classId', '==', selectedClass)
        );
        const studentsSnapshot = await getDocs(studentsQuery);
        const studentsData = studentsSnapshot.docs.map(doc => ({
          studentId: doc.id,
          ...doc.data(),
          grades: [], // You'll need to fetch grades separately
          overall: 0
        })) as StudentGrades[];
        
        setStudents(studentsData);

      } catch (error) {
        console.error('Error fetching data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load data from database',
          variant: 'destructive'
        });
      }
    };

    fetchData();
  }, [schoolId, selectedClass, toast]);

  const handleGenerateReport = async () => {
    if (reportType === 'individual' && !selectedStudent) {
      toast({
        title: 'Selection Required',
        description: 'Please select a student to generate the report.',
        variant: 'destructive'
      });
      return;
    }
    
    setIsGenerating(true);
    
    try {
      if (reportType === 'individual') {
        const studentData = students.find(s => s.studentId === selectedStudent);
        const classAssessments = assessments.filter(a => a.class === selectedClass);
        
        if (!studentData) {
          throw new Error('Student data not found');
        }
        
        const grades = await fetchStudentGrades(selectedStudent!, schoolId!);
        
        setReport({ 
          student: { ...studentData, grades }, 
          assessments: classAssessments 
        });
        
        toast({
          title: 'Report Generated',
          description: 'Individual student report has been successfully generated.',
        });
      }
    } catch (error) {
      toast({
        title: 'Generation Failed',
        description: 'Failed to generate the report. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const fetchStudentGrades = async (studentId: string, schoolId: string): Promise<Grade[]> => {
    try {
      const gradesQuery = query(
        collection(firestore, `schools/${schoolId}/students/${studentId}/grades`)
      );
      const gradesSnapshot = await getDocs(gradesQuery);
      return gradesSnapshot.docs.map(doc => ({
        assessmentId: doc.data().assessmentId,
        score: doc.data().grade, // grade field stores the score
        subject: doc.data().assessmentTitle // This might need adjustment
      }));
    } catch (error) {
      console.error('Error fetching grades for student:', error);
      return [];
    }
  };
  
  const getGradeForStudent = (student: StudentGrades, assessmentId: string): string => {
    const grade = student.grades.find(g => g.assessmentId === assessmentId);
    return grade ? String(grade.score) : '—';
  };

  const isGenerateDisabled = isGenerating || (reportType === 'individual' && !selectedStudent);
  
  const comingSoonReports: ReportType[] = ['summary', 'ranking'];
  
  const reportTitles: Record<ReportType, string> = {
    'individual': 'Individual Student Report',
    'summary': 'Class Performance Summary',
    'ranking': 'Student Ranking & Percentiles',
  };

  const handlePrint = () => {
    toast({
      title: 'Printing Report',
      description: 'Your report is being sent to the printer.',
    });
  };

  return (
    <div className="grid gap-8 md:grid-cols-3">
        {/* ... (the rest of your JSX remains mostly the same, but update field names) */}
        {report && report.assessments.map(assessment => (
          <div key={assessment.id} className="border rounded-lg p-6 bg-background shadow-none">
            {/* Update field names to match your database */}
            <TableCell className="font-medium">{assessment.title}</TableCell>
            <TableCell>{assessment.term}</TableCell>
            <TableCell className="text-right font-medium">
              {getGradeForStudent(report.student, assessment.id)}
            </TableCell>
          </div>
        ))}
    </div>
  );
}
