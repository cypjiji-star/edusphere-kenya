
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
  PlusCircle,
  Search,
  FileDown,
  Edit,
  FileText,
  ChevronDown,
  Printer,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import { GradeSummaryWidget } from './grade-summary-widget';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ReportGenerator } from './report-generator';


// --- Mock Data ---

type Grade = {
  assessmentId: string;
  score: number | string; // Can be percentage or letter grade
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

export const assessmentsByClass: Record<string, Assessment[]> = {
  'f4-chem': [
    { id: 'assess-1', title: 'Mid-Term Exam', type: 'Exam', date: '2024-06-15' },
    { id: 'assess-2', title: 'Titration Lab Report', type: 'Assignment', date: '2024-07-22' },
    { id: 'assess-3', title: 'Organic Compounds Quiz', type: 'Quiz', date: '2024-07-28' },
  ],
  'f3-math': [
    { id: 'assess-4', title: 'Mid-Term Exam', type: 'Exam', date: '2024-06-18' },
    { id: 'assess-5', title: 'Algebra Problem Set', type: 'Assignment', date: '2024-07-10' },
  ],
  'f2-phys': [
     { id: 'assess-6', title: 'Mid-Term Exam', type: 'Exam', date: '2024-06-20' },
  ],
};

export const gradesByClass: Record<string, StudentGrades[]> = {
  'f4-chem': Array.from({ length: 31 }, (_, i) => ({
    studentId: `f4-chem-${i + 1}`,
    studentName: `Student ${i + 1}`,
    studentAvatar: `https://picsum.photos/seed/f4-student${i + 1}/100`,
    rollNumber: `F4-0${i + 1}`,
    grades: [
      { assessmentId: 'assess-1', score: 60 + (i % 36) },
      { assessmentId: 'assess-2', score: 'A' },
      { assessmentId: 'assess-3', score: 70 + (i % 31) },
    ],
    overall: 65 + ((i * 3) % 35),
  })),
  'f3-math': Array.from({ length: 28 }, (_, i) => ({
    studentId: `f3-math-${i + 1}`,
    studentName: `Student ${i + 32}`,
    studentAvatar: `https://picsum.photos/seed/f3-student${i + 1}/100`,
    rollNumber: `F3-0${i + 1}`,
    grades: [
        { assessmentId: 'assess-4', score: 70 + (i % 29) },
        { assessmentId: 'assess-5', score: 'B+' },
    ],
    overall: 70 + ((i * 3) % 30),
  })),
  'f2-phys': [],
};

export const teacherClasses = [
    { id: 'f4-chem', name: 'Form 4 - Chemistry' },
    { id: 'f3-math', name: 'Form 3 - Mathematics' },
    { id: 'f2-phys', name: 'Form 2 - Physics' },
];

export default function GradesPage() {
    const [selectedClass, setSelectedClass] = React.useState(teacherClasses[0].id);
    const [searchTerm, setSearchTerm] = React.useState('');

    const currentAssessments = assessmentsByClass[selectedClass] || [];
    const currentStudents = gradesByClass[selectedClass] || [];

    const filteredStudents = currentStudents.filter(s => 
        s.studentName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getGradeForStudent = (student: StudentGrades, assessmentId: string) => {
        const grade = student.grades.find(g => g.assessmentId === assessmentId);
        return grade ? grade.score : '—';
    };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <Tabs defaultValue="gradebook">
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
                        <DropdownMenuItem disabled>
                          <FileDown className="mr-2" />
                          Download as PDF
                        </DropdownMenuItem>
                        <DropdownMenuItem disabled>
                          <FileDown className="mr-2" />
                          Download as Excel/CSV
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem disabled>
                          <Printer className="mr-2" />
                          Print Gradebook
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
            </CardHeader>
            <CardContent>
                {currentStudents.length > 0 ? (
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
                                            <Button variant="ghost" size="sm" disabled>
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
                                         <Separator/>
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
                            <Button asChild className="mt-4">
                                <Link href="/teacher/grades/new">Enter Grades</Link>
                            </Button>
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
                    <CardTitle>Create New Assessment</CardTitle>
                    <CardDescription>
                        Create a new assessment record (e.g., Exam, Quiz) and enter grades for your class.
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex min-h-[400px] flex-col items-center justify-center">
                     <div className="text-center">
                        <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
                        <h3 className="mt-4 text-xl font-semibold">Ready to Enter Grades?</h3>
                        <p className="mt-2 text-sm text-muted-foreground">Click the button below to go to the grade entry form.</p>
                        <Button asChild className="mt-6">
                            <Link href="/teacher/grades/new">
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Create New Assessment
                            </Link>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </TabsContent>
        <TabsContent value="reports">
            <ReportGenerator />
        </TabsContent>
      </Tabs>
    </div>
  );
}
