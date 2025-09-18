```typescriptreact
'use client';

import * as React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Search,
  FileDown,
  ChevronDown,
  Loader2,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { GradeSummaryWidget } from './grade-summary-widget';
import { firestore } from '@/lib/firebase';
import { collection, query, where, onSnapshot, getDocs, doc, getDoc } from 'firebase/firestore';
import type { StudentGrade, Assessment } from './types';
import { useToast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

interface GradebookTabProps {
  schoolId: string;
}

export function GradebookTab({ schoolId }: GradebookTabProps) {
  const [classes, setClasses] = React.useState<{ id: string, name: string }[]>([]);
  const [selectedClass, setSelectedClass] = React.useState<string>('');
  const [searchTerm, setSearchTerm] = React.useState('');
  const [isGradebookLoading, setIsGradebookLoading] = React.useState(true);
  const [currentAssessments, setCurrentAssessments] = React.useState<Assessment[]>([]);
  const [currentStudents, setCurrentStudents] = React.useState<StudentGrade[]>([]);
  const { toast } = useToast();

  React.useEffect(() => {
    if (!schoolId) {
      setIsGradebookLoading(false);
      return;
    }

    // Fetch classes
    const unsubClasses = onSnapshot(
      collection(firestore, `schools/${schoolId}/classes`),
      (snapshot) => {
        const classList = snapshot.docs.map((doc) => ({
          id: doc.id,
          name: `${doc.data().name || doc.data().className || ''} ${doc.data().stream || ''}`.trim(),
        }));
        setClasses(classList);
        if (classList.length > 0 && !selectedClass) {
          setSelectedClass(classList[0].id);
        }
      },
      (error) => {
        console.error('Error fetching classes:', error);
        toast({
          title: 'Error',
          description: 'Failed to load classes. Please try again.',
          variant: 'destructive',
        });
      }
    );

    return () => unsubClasses();
  }, [schoolId, selectedClass, toast]);

  React.useEffect(() => {
    if (!schoolId || !selectedClass) {
      setIsGradebookLoading(false);
      return;
    }

    setIsGradebookLoading(true);

    // Fetch assessments
    const assessmentsQuery = query(
      collection(firestore, `schools/${schoolId}/assessments`),
      where('classId', '==', selectedClass)
    );
    const unsubAssessments = onSnapshot(
      assessmentsQuery,
      (snapshot) => {
        const assessments = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        } as Assessment));
        setCurrentAssessments(assessments);
      },
      (error) => {
        console.error('Error fetching assessments:', error);
        toast({
          title: 'Error',
          description: 'Failed to load assessments. Please try again.',
          variant: 'destructive',
        });
      }
    );

    // Fetch grades and student data
    const gradesQuery = query(
      collection(firestore, `schools/${schoolId}/grades`),
      where('classId', '==', selectedClass)
    );
    const unsubGrades = onSnapshot(
      gradesQuery,
      async (snapshot) => {
        try {
          const gradesByStudent: Record<
            string,
            { grades: { assessmentId: string; grade: string }[]; studentInfo?: any }
          > = {};

          // Group grades by student
          snapshot.forEach((gradeDoc) => {
            const gradeData = gradeDoc.data();
            const studentId = gradeData.studentId;
            if (!gradesByStudent[studentId]) {
              gradesByStudent[studentId] = { grades: [] };
            }
            gradesByStudent[studentId].grades.push({
              assessmentId: gradeData.assessmentId,
              grade: gradeData.grade,
            });
          });

          // Fetch student data in bulk
          const studentIds = Object.keys(gradesByStudent);
          const studentPromises = studentIds.map((studentId) =>
            getDoc(doc(firestore, `schools/${schoolId}/students`, studentId))
          );
          const studentSnapshots = await Promise.all(studentPromises);

          studentSnapshots.forEach((studentSnap, index) => {
            const studentId = studentIds[index];
            if (studentSnap.exists()) {
              gradesByStudent[studentId].studentInfo = studentSnap.data();
            }
          });

          // Process student data
          const studentsData = Object.entries(gradesByStudent).map(([studentId, data]) => {
            const numericScores = data.grades
              .map((g) => parseInt(String(g.grade)))
              .filter((s) => !isNaN(s));
            const overall =
              numericScores.length > 0
                ? Math.round(numericScores.reduce((a, b) => a + b, 0) / numericScores.length)
                : 0;

            return {
              studentId,
              studentName: data.studentInfo?.name || 'Unknown Student',
              studentAvatar: data.studentInfo?.avatarUrl || '',
              rollNumber: data.studentInfo?.rollNumber || 'N/A',
              grades: data.grades,
              overall,
            } as StudentGrade;
          });

          setCurrentStudents(studentsData.sort((a, b) => b.overall - a.overall));
        } catch (error) {
          console.error('Error processing grades:', error);
          toast({
            title: 'Error',
            description: 'Failed to load grades. Please try again.',
            variant: 'destructive',
          });
        } finally {
          setIsGradebookLoading(false);
        }
      },
      (error) => {
        console.error('Error fetching grades:', error);
        toast({
          title: 'Error',
          description: 'Failed to load grades. Please try again.',
          variant: 'destructive',
        });
        setIsGradebookLoading(false);
      }
    );

    return () => {
      unsubAssessments();
      unsubGrades();
    };
  }, [selectedClass, schoolId, toast]);

  const filteredStudents = React.useMemo(() => {
    return currentStudents.filter(
      (s) => s.studentName && s.studentName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [currentStudents, searchTerm]);

  const getGradeForStudent = (student: StudentGrade, assessmentId: string) => {
    const grade = student.grades.find((g) => g.assessmentId === assessmentId);
    return grade ? grade.grade : '—';
  };

  const handleExport = (type: 'PDF' | 'CSV') => {
    if (!selectedClass) {
      toast({
        title: 'Error',
        description: 'Please select a class to export.',
        variant: 'destructive',
      });
      return;
    }

    const className = classes.find((c) => c.id === selectedClass)?.name || 'Class';
    const tableData = filteredStudents.map((student) => [
      student.studentName,
      student.rollNumber,
      ...currentAssessments.map((ass) => getGradeForStudent(student, ass.id)),
      `${student.overall}%`,
    ]);

    if (type === 'CSV') {
      const headers = ['Name', 'Roll Number', ...currentAssessments.map((ass) => ass.title), 'Overall Grade'];
      const csvContent = [
        headers.join(','),
        ...tableData.map((row) => row.join(',')),
      ].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${className}-grades.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      const doc = new jsPDF();
      doc.text(`${className} Gradebook`, 14, 16);
      (doc as any).autoTable({
        startY: 22,
        head: [['Name', 'Roll Number', ...currentAssessments.map((ass) => ass.title), 'Overall Grade']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [59, 130, 246] },
        margin: { top: 20 },
      });
      doc.save(`${className}-grades.pdf`);
    }

    toast({
      title: 'Export Successful',
      description: `Gradebook exported as ${type} file.`,
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex w-full flex-col gap-4 md:w-auto md:flex-row md:items-center">
            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger className="w-full md:w-[180px]" aria-label="Select class">
                <SelectValue placeholder="Select a class" />
              </SelectTrigger>
              <SelectContent>
                {classes.map((cls) => (
                  <SelectItem key={cls.id} value={cls.id}>
                    {cls.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="relative w-full md:max-w-xs">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search by student name..."
                className="w-full bg-background pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                aria-label="Search students"
              />
            </div>
          </div>
          <div className="flex w-full flex-col gap-2 md:w-auto md:flex-row">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full" aria-label="Export options">
                  Export
                  <ChevronDown className="ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => handleExport('PDF')}>
                  <FileDown className="mr-2" />
                  Download as PDF
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport('CSV')}>
                  <FileDown className="mr-2" />
                  Download as CSV
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isGradebookLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          </div>
        ) : filteredStudents.length > 0 ? (
          <>
            <GradeSummaryWidget students={filteredStudents} />
            <div className="w-full overflow-auto rounded-lg border hidden md:block">
              <Table role="grid" aria-label="Gradebook table">
                <TableHeader>
                  <TableRow>
                    <TableHead className="sticky left-0 bg-card z-10">Student Name</TableHead>
                    {currentAssessments.map((ass) => (
                      <TableHead key={ass.id} className="text-center">
                        {ass.title}
                      </TableHead>
                    ))}
                    <TableHead className="text-center font-bold sticky right-0 bg-card z-10 w-[150px]">
                      Overall Average
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.map((student) => (
                    <TableRow key={student.studentId}>
                      <TableCell className="sticky left-0 bg-card z-10">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={student.studentAvatar} alt={student.studentName} />
                            <AvatarFallback>{student.studentName.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{student.studentName}</span>
                        </div>
                      </TableCell>
                      {currentAssessments.map((ass) => (
                        <TableCell key={ass.id} className="text-center">
                          {getGradeForStudent(student, ass.id)}
                        </TableCell>
                      ))}
                      <TableCell className="text-center font-bold sticky right-0 bg-card z-10">
                        <Badge>{student.overall}%</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        ) : (
          <div className="text-center py-16 text-muted-foreground">
            <p>No grade data found for this class.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```