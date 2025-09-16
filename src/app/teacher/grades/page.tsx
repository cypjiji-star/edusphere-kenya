

'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Search,
  FileDown,
  Edit,
  FileText,
  ChevronDown,
  Printer,
  Loader2,
  Trophy,
  TrendingUp,
  TrendingDown,
  Minus,
  PlusCircle,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { GradeSummaryWidget } from './grade-summary-widget';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ReportGenerator } from './report-generator';
import { useToast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { GradeEntryForm } from './new/grade-entry-form';
import { firestore, auth } from '@/lib/firebase';
import { collection, query, where, onSnapshot, getDoc, doc } from 'firebase/firestore';
import { useSearchParams } from 'next/navigation';
import type { DocumentData, Timestamp } from 'firebase/firestore';
import { BulkGradeEntry } from './new/bulk-grade-entry';


// --- Data Types ---
type Grade = {
  assessmentId: string;
  grade: number | string;
  subject?: string;
};

export type StudentGrades = {
  studentId: string;
  studentName: string;
  studentAvatar: string;
  rollNumber: string;
  grades: Grade[];
  overall: number;
  trend: 'up' | 'down' | 'stable';
};

export type Assessment = {
  id: string;
  title: string;
  type: 'Exam' | 'Assignment' | 'Quiz';
  date: Timestamp;
  subject?: string;
};

type TeacherClass = {
  id: string;
  name: string;
};


export default function GradesPage() {
    const searchParams = useSearchParams();
    const schoolId = searchParams.get('schoolId');
    const [teacherClasses, setTeacherClasses] = React.useState<TeacherClass[]>([]);
    const [teacherSubjects, setTeacherSubjects] = React.useState<string[]>(['All Subjects']);
    const [selectedClass, setSelectedClass] = React.useState<string | undefined>();
    const [selectedSubject, setSelectedSubject] = React.useState<string>('All Subjects');
    const [searchTerm, setSearchTerm] = React.useState('');
    const { toast } = useToast();
    const [editingStudent, setEditingStudent] = React.useState<StudentGrades | null>(null);
    const [activeTab, setActiveTab] = React.useState('ranking');
    const [isGradebookLoading, setIsGradebookLoading] = React.useState(true);
    const [user, setUser] = React.useState(auth.currentUser);

    const [currentAssessments, setCurrentAssessments] = React.useState<Assessment[]>([]);
    const [currentStudents, setCurrentStudents] = React.useState<StudentGrades[]>([]);
    const [selectedStudentForDetails, setSelectedStudentForDetails] = React.useState<StudentGrades | null>(null);


    React.useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(setUser);
        return () => unsubscribe();
    }, []);

    React.useEffect(() => {
        if (!schoolId || !user) return;
        const teacherId = user.uid;

        const classesQuery = query(collection(firestore, `schools/${schoolId}/classes`), where('teacherId', '==', teacherId));
        const unsubClasses = onSnapshot(classesQuery, (snapshot) => {
            const classes = snapshot.docs.map(doc => ({ id: doc.id, name: `${doc.data().name} ${doc.data().stream || ''}`.trim() }));
            setTeacherClasses(classes);
            if (!selectedClass && classes.length > 0) {
                setSelectedClass(classes[0].id);
            }
        });

        const subjectsQuery = query(collection(firestore, `schools/${schoolId}/subjects`), where('teachers', 'array-contains', user.displayName));
        const unsubSubjects = onSnapshot(subjectsQuery, (snapshot) => {
            const subjects = snapshot.docs.map(doc => doc.data().name as string);
            setTeacherSubjects(['All Subjects', ...subjects]);
        });


        return () => {
            unsubClasses();
            unsubSubjects();
        };
    }, [schoolId, selectedClass, user]);

    React.useEffect(() => {
        if (!schoolId || !selectedClass) {
            setIsGradebookLoading(false);
            return;
        };

        setIsGradebookLoading(true);

        const gradesQuery = query(collection(firestore, 'schools', schoolId, 'grades'), where('classId', '==', selectedClass));
        
        const unsubGrades = onSnapshot(gradesQuery, async (snapshot) => {
             const gradesByStudent: Record<string, { grades: Grade[], studentInfo?: any }> = {};

            for (const gradeDoc of snapshot.docs) {
                const gradeData = gradeDoc.data();
                const studentId = gradeData.studentId;

                if (!gradesByStudent[studentId]) {
                    const studentRef = doc(firestore, 'schools', schoolId, 'students', studentId);
                    const studentSnap = await getDoc(studentRef);
                    gradesByStudent[studentId] = { grades: [], studentInfo: studentSnap.data() };
                }
                
                gradesByStudent[studentId].grades.push({ assessmentId: gradeData.assessmentId, grade: gradeData.grade, subject: gradeData.subject });
            }
            
            const studentsData = Object.entries(gradesByStudent).map(([studentId, data]) => {
                const gradesToAverage = selectedSubject === 'All Subjects' 
                    ? data.grades 
                    : data.grades.filter((g: any) => g.subject === selectedSubject);

                const numericScores = gradesToAverage.map(g => parseInt(String(g.grade))).filter(s => !isNaN(s));
                const overall = numericScores.length > 0 ? Math.round(numericScores.reduce((a,b) => a + b, 0) / numericScores.length) : 0;
                
                return {
                    studentId: studentId,
                    studentName: data.studentInfo?.name || 'Unknown Student',
                    studentAvatar: data.studentInfo?.avatarUrl || '',
                    rollNumber: data.studentInfo?.rollNumber || '',
                    grades: data.grades,
                    overall,
                    trend: ['up', 'down', 'stable'][Math.floor(Math.random() * 3)] as 'up' | 'down' | 'stable',
                };
            }).sort((a, b) => b.overall - a.overall);
            
            setCurrentStudents(studentsData);
            setIsGradebookLoading(false);
        });


        return () => {
            unsubGrades();
        }

    }, [selectedClass, schoolId, selectedSubject]);
    
      React.useEffect(() => {
        if (!schoolId || !selectedClass) return;

        let assessmentsQuery;
        if (selectedSubject === 'All Subjects') {
            assessmentsQuery = query(collection(firestore, 'schools', schoolId, 'assessments'), where('classId', '==', selectedClass));
        } else {
            assessmentsQuery = query(collection(firestore, 'schools', schoolId, 'assessments'), where('classId', '==', selectedClass), where('subject', '==', selectedSubject));
        }

        const unsubAssessments = onSnapshot(assessmentsQuery, (snapshot) => {
            const assessments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Assessment));
            setCurrentAssessments(assessments);
        });

        return () => unsubAssessments();
    }, [selectedClass, schoolId, selectedSubject]);

    const filteredStudents = currentStudents.filter(s => 
        s.studentName && s.studentName.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
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

    const getGradeForStudent = (student: StudentGrades, assessmentId: string) => {
        const grade = student.grades.find(g => g.assessmentId === assessmentId);
        return grade ? grade.grade : '—';
    };

    const handleExport = (type: 'PDF' | 'CSV') => {
        if (!activeTab) return;
        const doc = new jsPDF();
        const tableData = filteredStudents.map(student => [
            student.studentName,
            student.rollNumber,
            student.overall,
        ]);
    
        const className = teacherClasses.find(c => c.id === selectedClass)?.name;

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
                document.body.removeChild(link);
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
    
  if (!schoolId) {
    return <div className="p-8">Error: School ID is missing.</div>
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="md:flex md:items-center md:justify-between mb-6">
            <div>
              <h1 className="font-headline text-3xl font-bold">Gradebook</h1>
              <p className="text-muted-foreground">View, manage, and export student grades for your classes.</p>
            </div>
            <TabsList className="grid w-full grid-cols-4 mt-4 md:mt-0 md:w-auto">
                <TabsTrigger value="ranking">Ranking</TabsTrigger>
                <TabsTrigger value="gradebook">Gradebook</TabsTrigger>
                <TabsTrigger value="entry">Enter Grades</TabsTrigger>
                <TabsTrigger value="reports">Reports</TabsTrigger>
            </TabsList>
        </div>

        <TabsContent value="ranking">
             <Card>
              <CardHeader>
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div>
                          <CardTitle className="flex items-center gap-2"><Trophy className="h-5 w-5 text-primary"/>Class Ranking</CardTitle>
                          <CardDescription>Student ranking based on performance in a specific subject.</CardDescription>
                      </div>
                      <div className="flex w-full flex-col md:flex-row md:items-center gap-2">
                           <Select value={selectedClass} onValueChange={setSelectedClass}>
                              <SelectTrigger className="w-full md:w-[240px]">
                                  <SelectValue placeholder="Select a class" />
                              </SelectTrigger>
                              <SelectContent>
                                  {teacherClasses.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                              </SelectContent>
                          </Select>
                          <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                              <SelectTrigger className="w-full md:w-[240px]">
                                  <SelectValue placeholder="Select a subject" />
                              </SelectTrigger>
                              <SelectContent>
                                  {teacherSubjects.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                              </SelectContent>
                          </Select>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline">
                                    Export / Actions
                                    <ChevronDown className="ml-2 h-4 w-4"/>
                                </Button>
                            </DropdownMenuTrigger>
                             <DropdownMenuContent>
                                <DropdownMenuItem onClick={() => window.print()}><Printer className="mr-2 h-4 w-4" />Print Ranking</DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => handleExport('PDF')}><FileDown className="mr-2 h-4 w-4" />Export as PDF</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleExport('CSV')}><FileDown className="mr-2 h-4 w-4" />Export as CSV</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                      </div>
                  </div>
              </CardHeader>
              <CardContent>
                {isGradebookLoading ? (
                  <div className="flex justify-center items-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /><span className="ml-2">Loading ranking data...</span></div>
                ) : (
                  <>
                  <GradeSummaryWidget students={filteredStudents} />
                  <div className="w-full overflow-auto rounded-lg border mt-6">
                  <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Rank</TableHead>
                            <TableHead>Student</TableHead>
                            <TableHead>Overall Grade</TableHead>
                            <TableHead>Trend</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                     <TableBody>
                        {filteredStudents.length > 0 ? (
                            filteredStudents.map((student, index) => (
                                <TableRow key={student.studentId}>
                                    <TableCell className="font-bold">{index + 1}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-9 w-9">
                                                <AvatarImage src={student.studentAvatar} alt={student.studentName} />
                                                <AvatarFallback>{student.studentName.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                            <span className="font-medium">{student.studentName}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline">{student.overall}%</Badge>
                                    </TableCell>
                                    <TableCell>
                                         {student.trend === 'up' && <TrendingUp className="h-4 w-4 text-green-500" />}
                                         {student.trend === 'down' && <TrendingDown className="h-4 w-4 text-red-500" />}
                                         {student.trend === 'stable' && <Minus className="h-4 w-4 text-gray-500" />}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Dialog onOpenChange={(open) => !open && setSelectedStudentForDetails(null)}>
                                            <DialogTrigger asChild>
                                                <Button variant="ghost" size="sm" onClick={() => setSelectedStudentForDetails(student)}>
                                                    View Details
                                                </Button>
                                            </DialogTrigger>
                                             {selectedStudentForDetails?.studentId === student.studentId && (
                                                <DialogContent className="sm:max-w-md">
                                                    <DialogHeader>
                                                        <DialogTitle>{selectedStudentForDetails.studentName}</DialogTitle>
                                                        <DialogDescription>
                                                        Overall Average: <span className="font-bold text-primary">{selectedStudentForDetails.overall}%</span>
                                                        </DialogDescription>
                                                    </DialogHeader>
                                                    <div className="py-4">
                                                        <h4 className="mb-4 font-semibold">Scores by Subject</h4>
                                                        <div className="w-full overflow-auto rounded-lg border">
                                                        <Table>
                                                            <TableHeader>
                                                                <TableRow>
                                                                    <TableHead>Subject</TableHead>
                                                                    <TableHead className="text-right">Score</TableHead>
                                                                </TableRow>
                                                            </TableHeader>
                                                            <TableBody>
                                                                {selectedStudentForDetails.grades?.map((gradeInfo, index) => {
                                                                    return (
                                                                    <TableRow key={index}>
                                                                        <TableCell className="font-medium">{gradeInfo.subject || 'Unknown'}</TableCell>
                                                                        <TableCell className="text-right">{gradeInfo.grade}%</TableCell>
                                                                    </TableRow>
                                                                    )
                                                                })}
                                                            </TableBody>
                                                        </Table>
                                                        </div>
                                                    </div>
                                                </DialogContent>
                                            )}
                                        </Dialog>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                             <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">
                                    No students found for the selected filters.
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
        </TabsContent>
        <TabsContent value="gradebook">
          <Card>
            <CardHeader>
               <div className="flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="flex w-full flex-col gap-4 md:w-auto md:flex-row md:items-center">
                     <Select value={selectedClass} onValueChange={setSelectedClass}>
                        <SelectTrigger className="w-full md:w-[180px]">
                            <SelectValue placeholder="Select a class" />
                        </SelectTrigger>
                        <SelectContent>
                            {teacherClasses.map((cls) => (
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
                ) : gradebookStudents.length > 0 ? (
                    <>
                        <GradeSummaryWidget students={gradebookStudents} />
                        {/* Desktop Table */}
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
                                {gradebookStudents.filter(s => s.studentName.toLowerCase().includes(searchTerm.toLowerCase())).map(student => (
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
                    <div className="flex min-h-[400px] items-center justify-center rounded-lg border-2 border-dashed border-muted">
                        <div className="text-center">
                            <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
                            <h3 className="mt-4 text-xl font-semibold">No Grade Data</h3>
                            <p className="mt-2 text-sm text-muted-foreground">There is no grade information for this class yet.</p>
                            <Button className="mt-4" onClick={() => setActiveTab('entry')}>Enter Grades</Button>
                        </div>
                    </div>
                )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="entry">
           <Card>
                <CardHeader>
                    <CardTitle>Enter Grades</CardTitle>
                    <CardDescription>Select an assessment and enter grades for your class. You can also upload a completed CSV file.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="manual">
                    <TabsList>
                      <TabsTrigger value="manual">Manual Entry</TabsTrigger>
                      <TabsTrigger value="bulk">Bulk Grade Upload</TabsTrigger>
                    </TabsList>
                    <TabsContent value="manual" className="pt-6">
                      <GradeEntryForm />
                    </TabsContent>
                    <TabsContent value="bulk" className="pt-6">
                       <BulkGradeEntry />
                    </TabsContent>
                  </Tabs>
                </CardContent>
            </Card>
        </TabsContent>
        <TabsContent value="reports">
            <ReportGenerator />
        </TabsContent>
      </Tabs>
      <Dialog open={!!editingStudent} onOpenChange={(open) => !open && setEditingStudent(null)}>
        {editingStudent && (
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Grades for {editingStudent.studentName}</DialogTitle>
              <DialogDescription>
                Update the assessment scores for this student.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {/* Simplified for demo. A real app would use a form. */}
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
