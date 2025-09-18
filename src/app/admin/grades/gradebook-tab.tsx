
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
  Printer,
  Loader2,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { GradeSummaryWidget } from './grade-summary-widget';
import { firestore } from '@/lib/firebase';
import { collection, query, where, onSnapshot, getDocs } from 'firebase/firestore';
import type { StudentGrade, Assessment } from './types';
import { useToast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { DropdownMenuTrigger } from '@radix-ui/react-dropdown-menu';

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
    if (!schoolId) return;

    const unsubClasses = onSnapshot(collection(firestore, `schools/${schoolId}/classes`), (snapshot) => {
      const classList = snapshot.docs.map(doc => ({
        id: doc.id,
        name: `${doc.data().name || doc.data().className || ''} ${doc.data().stream || ''}`.trim(),
      }));
      setClasses(classList);
      if (classList.length > 0 && !selectedClass) {
        setSelectedClass(classList[0].id);
      }
    });

    return () => unsubClasses();
  }, [schoolId, selectedClass]);
  
  React.useEffect(() => {
    if (!schoolId || !selectedClass) {
      setIsGradebookLoading(false);
      return;
    }

    setIsGradebookLoading(true);

    const gradesQuery = query(collection(firestore, 'schools', schoolId, 'grades'), where('classId', '==', selectedClass));
    
    const unsubGrades = onSnapshot(gradesQuery, async (snapshot) => {
      const gradesByStudent: Record<string, { grades: { assessmentId: string, grade: string }[], studentInfo?: any }> = {};

      for (const gradeDoc of snapshot.docs) {
          const gradeData = gradeDoc.data();
          const studentId = gradeData.studentId;

          if (!gradesByStudent[studentId]) {
              const studentRef = doc(firestore, 'schools', schoolId, 'students', studentId);
              const studentSnap = await getDoc(studentRef);
              gradesByStudent[studentId] = { grades: [], studentInfo: studentSnap.data() };
          }
          
          gradesByStudent[studentId].grades.push({ assessmentId: gradeData.assessmentId, grade: gradeData.grade });
      }
      
      const studentsData = Object.entries(gradesByStudent).map(([studentId, data]) => {
          const numericScores = data.grades.map(g => parseInt(String(g.grade))).filter(s => !isNaN(s));
          const overall = numericScores.length > 0 ? Math.round(numericScores.reduce((a, b) => a + b, 0) / numericScores.length) : 0;
          
          return {
              studentId: studentId,
              studentName: data.studentInfo?.name || 'Unknown Student',
              studentAvatar: data.studentInfo?.avatarUrl || '',
              rollNumber: data.studentInfo?.rollNumber || '',
              grades: data.grades,
              overall,
          } as StudentGrade;
      });
      
      setCurrentStudents(studentsData);
      setIsGradebookLoading(false);
    });

    const assessmentsQuery = query(collection(firestore, 'schools', schoolId, 'assessments'), where('classId', '==', selectedClass));
    const unsubAssessments = onSnapshot(assessmentsQuery, (snapshot) => {
        const assessments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Assessment));
        setCurrentAssessments(assessments);
    });

    return () => {
        unsubGrades();
        unsubAssessments();
    };

}, [selectedClass, schoolId]);


  const gradebookStudents = React.useMemo(() => {
      return currentStudents.map(student => {
          const allScores = student.grades.map(g => parseInt(String(g.grade))).filter(s => !isNaN(s));
          const overall = allScores.length > 0 ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length) : 0;
          return {
              ...student,
              overall, 
          };
      }).sort((a,b) => b.overall - a.overall);
  }, [currentStudents]);

  const filteredStudents = gradebookStudents.filter(s => 
      s.studentName && s.studentName.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const getGradeForStudent = (student: StudentGrade, assessmentId: string) => {
    const grade = student.grades.find(g => g.assessmentId === assessmentId);
    return grade ? grade.grade : '—';
  };

  const handleExport = (type: 'PDF' | 'CSV') => {
    if (!selectedClass) return;
    const doc = new jsPDF();
    const tableData = filteredStudents.map(student => [
        student.studentName,
        student.rollNumber,
        `${student.overall}%`,
    ]);

    const className = classes.find(c => c.id === selectedClass)?.name;

    if (type === 'CSV') {
        const headers = ['Name', 'Roll Number', 'Overall Grade'];
        const csvContent = [
            headers.join(','),
            ...tableData.map(row => row.join(','))
        ].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute("download", `${className}-grades.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
        }
    } else {
         doc.text(`${className} Grades`, 14, 16);
         (doc as any).autoTable({
            startY: 22,
            head: [['Name', 'Roll Number', 'Overall Grade']],
            body: tableData,
         });
         doc.save(`${className}-grades.pdf`);
    }

    toast({
        title: 'Exporting Gradebook',
        description: `Your gradebook is being exported as a ${type} file.`
    });
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex w-full flex-col gap-4 md:w-auto md:flex-row md:items-center">
            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger className="w-full md:w-[180px]">
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
              />
            </div>
          </div>
          <div className="flex w-full flex-col gap-2 md:w-auto md:flex-row">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full">
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
                    <Table>
                        <TableHeader>
                        <TableRow>
                            <TableHead className="sticky left-0 bg-card z-10">Student Name</TableHead>
                            {currentAssessments.map(ass => <TableHead key={ass.id} className="text-center">{ass.title}</TableHead>)}
                            <TableHead className="text-center font-bold sticky right-0 bg-card z-10 w-[150px]">Overall Average</TableHead>
                        </TableRow>
                        </TableHeader>
                        <TableBody>
                        {filteredStudents.map(student => (
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
                                {currentAssessments.map(ass => (
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
            <div className="text-center py-16 text-muted-foreground">No grade data found for this class.</div>
        )}
      </CardContent>
    </Card>
  );
}
