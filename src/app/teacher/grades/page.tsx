
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
  Loader2
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
} from '@/components/ui/dialog';
import { GradeSummaryWidget } from './grade-summary-widget';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ReportGenerator } from './report-generator';
import { useToast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { GradeEntryForm } from './new/grade-entry-form';
import { firestore, auth } from '@/lib/firebase';
import { collection, query, where, onSnapshot, getDocs, doc } from 'firebase/firestore';
import { useSearchParams } from 'next/navigation';

// --- Data Types ---
type Grade = {
  assessmentId: string;
  score: number | string;
};

export type StudentGrades = {
  studentId: string;
  studentName: string;
  studentAvatar: string;
  rollNumber: string;
  grades: Grade[];
  overall: number;
};

export type Assessment = {
  id: string;
  title: string;
  type: 'Exam' | 'Assignment' | 'Quiz';
  date: string;
};

type TeacherClass = {
  id: string;
  name: string;
};


export default function GradesPage() {
    const searchParams = useSearchParams();
    const schoolId = searchParams.get('schoolId');
    const [teacherClasses, setTeacherClasses] = React.useState<TeacherClass[]>([]);
    const [selectedClass, setSelectedClass] = React.useState<string | undefined>();
    const [searchTerm, setSearchTerm] = React.useState('');
    const { toast } = useToast();
    const [editingStudent, setEditingStudent] = React.useState<StudentGrades | null>(null);
    const [activeTab, setActiveTab] = React.useState('gradebook');
    const [isGradebookLoading, setIsGradebookLoading] = React.useState(true);
    const [user, setUser] = React.useState(auth.currentUser);

    const [currentAssessments, setCurrentAssessments] = React.useState<Assessment[]>([]);
    const [currentStudents, setCurrentStudents] = React.useState<StudentGrades[]>([]);

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

        return () => unsubClasses();
    }, [schoolId, selectedClass, user]);

    React.useEffect(() => {
        if (!schoolId || !selectedClass) {
            setIsGradebookLoading(false);
            return;
        };

        setIsGradebookLoading(true);

        // Listener for assessments for the selected class
        const assessmentsQuery = query(collection(firestore, 'schools', schoolId, 'assessments'), where('classId', '==', selectedClass));
        const unsubAssessments = onSnapshot(assessmentsQuery, (snapshot) => {
            const assessments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Assessment));
            setCurrentAssessments(assessments);
        });

        // Listener for students in the selected class
        const studentsQuery = query(collection(firestore, 'schools', schoolId, 'students'), where('classId', '==', selectedClass));
        const unsubStudents = onSnapshot(studentsQuery, async (snapshot) => {
            const studentsData = await Promise.all(snapshot.docs.map(async (studentDoc) => {
                const student = { studentId: studentDoc.id, ...studentDoc.data() } as any;
                
                // Fetch all grades for this student at once
                const gradesQuery = query(collection(firestore, `schools/${schoolId}/students/${student.studentId}/grades`));
                const gradesSnapshot = await getDocs(gradesQuery);
                const grades: Grade[] = gradesSnapshot.docs.map(gdoc => ({ assessmentId: gdoc.data().assessmentId, score: gdoc.data().grade }));
                
                const numericScores = grades.map(g => parseInt(String(g.score))).filter(s => !isNaN(s));
                const overall = numericScores.length > 0 ? Math.round(numericScores.reduce((a,b) => a+b, 0) / numericScores.length) : 0;
                
                return {
                    ...student,
                    grades,
                    overall,
                };
            }));
            setCurrentStudents(studentsData);
            setIsGradebookLoading(false);
        });


        return () => {
            unsubAssessments();
            unsubStudents();
        }

    }, [selectedClass, schoolId]);

    const filteredStudents = currentStudents.filter(s => 
        s.studentName && s.studentName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getGradeForStudent = (student: StudentGrades, assessmentId: string) => {
        const grade = student.grades.find(g => g.assessmentId === assessmentId);
        return grade ? grade.score : '—';
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
        <CardHeader className="px-0">
          <div className="md:flex md:items-start md:justify-between">
            <div>
              <CardTitle className="font-headline text-2xl">Gradebook</CardTitle>
              <CardDescription>View, manage, and export student grades for your classes.</CardDescription>
            </div>
            <TabsList className="grid w-full grid-cols-3 md:w-auto mt-4 md:mt-0">
              <TabsTrigger value="gradebook">Gradebook</TabsTrigger>
              <TabsTrigger value="entry">Enter Grades</TabsTrigger>
              <TabsTrigger value="reports">Reports</TabsTrigger>
            </TabsList>
          </div>
        </CardHeader>
        <TabsContent value="gradebook">
          <Card>
            <CardHeader>
               <div className="flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="flex w-full flex-col gap-4 md:w-auto md:flex-row md:items-center">
                     <Select value={selectedClass} onValueChange={setSelectedClass}>
                        <SelectTrigger className="w-full md:w-[240px]">
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
                        <Button variant="outline">
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
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => window.print()}>
                          <Printer className="mr-2" />
                          Print Gradebook
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
                ) : currentStudents.length > 0 ? (
                    <>
                        <GradeSummaryWidget students={currentStudents} />
                        {/* Desktop Table */}
                        <div className="w-full overflow-auto rounded-lg border hidden md:block">
                            <Table>
                                <TableHeader>
                                <TableRow>
                                    <TableHead className="sticky left-0 bg-background z-10">Student Name</TableHead>
                                    {currentAssessments.map(assessment => (
                                        <TableHead key={assessment.id} className="text-center whitespace-nowrap">{assessment.title}</TableHead>
                                    ))}
                                    <TableHead className="text-center font-bold">Overall</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                                </TableHeader>
                                <TableBody>
                                {filteredStudents.map(student => (
                                    <TableRow key={student.studentId}>
                                        <TableCell className="sticky left-0 bg-background z-10">
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-8 w-8">
                                                    <AvatarImage src={student.studentAvatar} alt={student.studentName} />
                                                    <AvatarFallback>{student.studentName.charAt(0)}</AvatarFallback>
                                                </Avatar>
                                                <span className="font-medium">{student.studentName}</span>
                                            </div>
                                        </TableCell>
                                        {currentAssessments.map(assessment => (
                                            <TableCell key={assessment.id} className="text-center">
                                                <Badge variant="outline">{getGradeForStudent(student, assessment.id)}</Badge>
                                            </TableCell>
                                        ))}
                                         <TableCell className="text-center font-bold">
                                            <Badge>{student.overall}%</Badge>
                                         </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="sm" onClick={() => setEditingStudent(student)}>
                                                <Edit className="mr-2 h-4 w-4" /> Edit
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Mobile Cards */}
                        <div className="grid gap-4 md:hidden">
                            {filteredStudents.map(student => (
                                <Card key={student.studentId} className="w-full">
                                    <CardHeader>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <Avatar>
                                                <AvatarImage src={student.studentAvatar} alt={student.studentName} />
                                                <AvatarFallback>{student.studentName.charAt(0)}</AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <span className="font-medium">{student.studentName}</span>
                                                    <p className="text-sm text-muted-foreground">{student.rollNumber}</p>
                                                </div>
                                            </div>
                                            <Badge>{student.overall}%</Badge>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-4 pt-2">
                                         {currentAssessments.map(assessment => (
                                             <div key={assessment.id} className="flex justify-between items-center text-sm">
                                                <span className="font-medium text-muted-foreground">{assessment.title}:</span>
                                                <Badge variant="outline">{getGradeForStudent(student, assessment.id)}</Badge>
                                             </div>
                                         ))}
                                    </CardContent>
                                </Card>
                            ))}
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
             <CardFooter>
                <p className="text-xs text-muted-foreground">
                    This is a summary of student performance. For detailed reports, visit the student's profile.
                </p>
             </CardFooter>
          </Card>
        </TabsContent>
        <TabsContent value="entry">
           <Card>
                <CardHeader>
                    <CardTitle>Enter New Grades</CardTitle>
                    <CardDescription>Fill out the form to add a new assessment and enter grades for your class.</CardDescription>
                </CardHeader>
                <CardContent>
                    <GradeEntryForm />
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
