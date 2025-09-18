
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
  Trophy,
  Loader2,
  TrendingUp,
  TrendingDown,
  Minus,
  FileDown,
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { firestore } from '@/lib/firebase';
import {
  collection,
  query,
  onSnapshot,
  orderBy,
  where,
  doc,
  getDoc,
} from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import type { StudentGrade } from './types';

interface RankingTabProps {
  schoolId: string;
}

export function RankingTab({ schoolId }: RankingTabProps) {
  const { toast } = useToast();
  const [classes, setClasses] = React.useState<{ id: string, name: string }[]>([]);
  const [studentsForRanking, setStudentsForRanking] = React.useState<StudentGrade[]>([]);
  const [selectedClassForRanking, setSelectedClassForRanking] = React.useState<string>('');
  const [selectedSubjectForRanking, setSelectedSubjectForRanking] = React.useState<string>('All Subjects');
  const [subjectsForRanking, setSubjectsForRanking] = React.useState<string[]>(['All Subjects']);
  const [isLoadingRanking, setIsLoadingRanking] = React.useState(true);

  React.useEffect(() => {
    if (!schoolId) return;

    const unsubClasses = onSnapshot(collection(firestore, `schools/${schoolId}/classes`), (snapshot) => {
      const classList = snapshot.docs.map(doc => ({
        id: doc.id,
        name: `${doc.data().name || doc.data().className || ''} ${doc.data().stream || ''}`.trim(),
      }));
      setClasses(classList);
      if (classList.length > 0 && !selectedClassForRanking) {
        setSelectedClassForRanking(classList[0].id);
      }
    });

    return () => {
      unsubClasses();
    };
  }, [schoolId, selectedClassForRanking]);

  React.useEffect(() => {
    if (!selectedClassForRanking || !schoolId) {
      setStudentsForRanking([]);
      setSubjectsForRanking(['All Subjects']);
      return;
    }

    const fetchStudentGradesForRanking = async () => {
      setIsLoadingRanking(true);
      try {
        const gradesQuery = query(
          collection(firestore, `schools/${schoolId}/grades`),
          where('classId', '==', selectedClassForRanking)
        );

        const gradesSnapshot = await getDocs(gradesQuery);

        if (gradesSnapshot.empty) {
          setStudentsForRanking([]);
          setSubjectsForRanking(['All Subjects']);
          setIsLoadingRanking(false);
          return;
        }

        const studentGradesMap = new Map<string, { name: string, avatarUrl: string, rollNumber: string, className: string, grades: { subject: string, grade: number }[] }>();
        const availableSubjects = new Set<string>();

        for (const gradeDoc of gradesSnapshot.docs) {
          const gradeData = gradeDoc.data();
          const studentId = gradeData.studentId;

          if (!studentGradesMap.has(studentId)) {
            const studentRef = doc(firestore, 'schools', schoolId, 'students', studentId);
            const studentSnap = await getDoc(studentRef);
            if (studentSnap.exists()) {
              studentGradesMap.set(studentId, {
                name: studentSnap.data().name || 'Unknown',
                avatarUrl: studentSnap.data().avatarUrl || '',
                rollNumber: studentSnap.data().admissionNumber || 'N/A',
                className: studentSnap.data().class || 'N/A',
                grades: [],
              });
            }
          }

          const gradeValue = parseInt(gradeData.grade, 10);
          if (!isNaN(gradeValue)) {
            studentGradesMap.get(studentId)?.grades.push({
              subject: gradeData.subject,
              grade: gradeValue,
            });
            if (gradeData.subject) {
              availableSubjects.add(gradeData.subject);
            }
          }
        }

        setSubjectsForRanking(['All Subjects', ...Array.from(availableSubjects)]);

        const rankedStudents: StudentGrade[] = Array.from(studentGradesMap.entries())
          .map(([studentId, data]) => {
            const gradesToAverage = selectedSubjectForRanking === 'All Subjects'
              ? data.grades
              : data.grades.filter((g: any) => g.subject === selectedSubjectForRanking);

            const numericScores = gradesToAverage.map((g: any) => g.grade);
            const average = numericScores.length > 0 ? Math.round(numericScores.reduce((a: number, b: number) => a + b, 0) / numericScores.length) : 0;

            return {
              id: studentId,
              studentName: data.name,
              avatarUrl: data.avatarUrl,
              rollNumber: data.rollNumber,
              className: data.className,
              grade: average,
              overall: average,
              grades: data.grades as any,
              trend: ['up', 'down', 'stable'][Math.floor(Math.random() * 3)] as 'up' | 'down' | 'stable',
            };
          })
          .sort((a, b) => b.overall - a.overall);

        setStudentsForRanking(rankedStudents);
      } catch (error) {
        console.error('Error fetching student grades for ranking:', error);
        toast({
          variant: 'destructive',
          title: 'Failed to fetch ranking data',
          description: 'Please check your database structure and try again.',
        });
      } finally {
        setIsLoadingRanking(false);
      }
    };

    fetchStudentGradesForRanking();
  }, [selectedClassForRanking, selectedSubjectForRanking, schoolId, toast]);

  const handleExportRanking = (type: 'PDF' | 'CSV') => {
    const className = classes.find(c => c.id === selectedClassForRanking)?.name;
    const doc = new jsPDF();
    const tableData = studentsForRanking.map((student, index) => [
      index + 1,
      student.studentName,
      `${student.overall}%`,
    ]);
    const tableHeaders = ['Rank', 'Student Name', 'Overall Grade'];

    if (type === 'CSV') {
      let csvContent = "data:text/csv;charset=utf-8," + tableHeaders.join(",") + "\n"
        + tableData.map(e => e.join(",")).join("\n");
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `class-ranking-${className}.csv`);
      document.body.appendChild(link);
      link.click();
    } else {
      doc.text(`Class Ranking for ${className || 'Selected Class'} (${selectedSubjectForRanking})`, 14, 16);
      (doc as any).autoTable({
        startY: 22,
        head: [tableHeaders],
        body: tableData,
      });
      doc.save("class-ranking.pdf");
    }

    toast({
      title: 'Export Successful',
      description: `The class ranking has been downloaded as a ${type} file.`,
    });
  };

  const getGradeFromScore = (score: number) => {
    if (score >= 80) return 'A';
    if (score >= 75) return 'A-';
    if (score >= 70) return 'B+';
    if (score >= 65) return 'B';
    if (score >= 60) return 'B-';
    if (score >= 55) return 'C+';
    if (score >= 50) return 'C';
    if (score >= 45) return 'C-';
    if (score >= 40) return 'D+';
    if (score >= 35) return 'D';
    if (score >= 30) return 'D-';
    return 'E';
  };

  const topStudents = studentsForRanking.slice(0, 3);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Class Ranking</CardTitle>
        <CardDescription>View and export student performance rankings.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4 mb-4">
          <Select value={selectedClassForRanking} onValueChange={setSelectedClassForRanking}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select class" />
            </SelectTrigger>
            <SelectContent>
              {classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={selectedSubjectForRanking} onValueChange={setSelectedSubjectForRanking}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select subject" />
            </SelectTrigger>
            <SelectContent>
              {subjectsForRanking.map(subject => <SelectItem key={subject} value={subject}>{subject}</SelectItem>)}
            </SelectContent>
          </Select>
          <div className="flex gap-2 ml-auto">
            <Button onClick={() => handleExportRanking('PDF')}>
              <FileDown className="mr-2 h-4 w-4" />
              Export PDF
            </Button>
          </div>
        </div>
        {isLoadingRanking ? (
          <div className="flex justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {topStudents.map((student, index) => (
                <Card key={student.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Trophy className={`h-6 w-6 ${index === 0 ? 'text-yellow-500' : index === 1 ? 'text-gray-400' : 'text-orange-400'}`} />
                      {student.studentName}
                    </CardTitle>
                    <CardDescription>Rank #{index + 1}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4">
                      <Avatar>
                        <AvatarImage src={student.avatarUrl} />
                        <AvatarFallback>{student.studentName[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{student.overall}% ({getGradeFromScore(student.overall)})</p>
                        <p className="text-sm text-muted-foreground">{student.className}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rank</TableHead>
                    <TableHead>Student</TableHead>
                    <TableHead>Roll Number</TableHead>
                    <TableHead>Overall Grade</TableHead>
                    <TableHead>Trend</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {studentsForRanking.map((student, index) => (
                    <TableRow key={student.id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={student.avatarUrl} />
                            <AvatarFallback>{student.studentName[0]}</AvatarFallback>
                          </Avatar>
                          {student.studentName}
                        </div>
                      </TableCell>
                      <TableCell>{student.rollNumber}</TableCell>
                      <TableCell>{student.overall}% ({getGradeFromScore(student.overall)})</TableCell>
                      <TableCell>
                        {student.trend === 'up' && <TrendingUp className="h-4 w-4 text-green-500" />}
                        {student.trend === 'down' && <TrendingDown className="h-4 w-4 text-red-500" />}
                        {student.trend === 'stable' && <Minus className="h-4 w-4 text-gray-500" />}
                      </TableCell>
                    </TableRow>
                  ))}
                  {studentsForRanking.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center">
                        No students found for this class.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

