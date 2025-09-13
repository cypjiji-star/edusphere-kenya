
'use client';

import * as React from 'react';
import { DateRange } from 'react-day-picker';
import { format } from 'date-fns';

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
import { FileText, Loader2, Printer, GraduationCap, BarChart, Percent, Crown, BookCheck, AlertCircle, Trophy, Users, ClipboardList, Send, History, Bell, Calendar as CalendarIcon } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';


// Mock data - In a real app this would come from a central store or API
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

const assessmentsByClass: Record<string, Assessment[]> = {
  'f4': [
    { id: 'assess-1', title: 'Mid-Term Exam', type: 'Exam', date: '2024-06-15' },
    { id: 'assess-2', title: 'Titration Lab Report', type: 'Assignment', date: '2024-07-22' },
    { id: 'assess-3', title: 'Organic Compounds Quiz', type: 'Quiz', date: '2024-07-28' },
  ],
  'f3': [
    { id: 'assess-4', title: 'Mid-Term Exam', type: 'Exam', date: '2024-06-18' },
  ],
};

const gradesByClass: Record<string, StudentGrades[]> = {
  'f4': Array.from({ length: 31 }, (_, i) => ({
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
  'f3': [],
};

const teacherClasses = [
    { id: 'f4', name: 'Form 4' },
    { id: 'f3', name: 'Form 3' },
    { id: 'f2', name: 'Form 2' },
    { id: 'f1', name: 'Form 1' },
];


type ReportType = 'individual' | 'summary' | 'ranking';

export function ReportGenerator() {
  const [selectedClass, setSelectedClass] = React.useState(teacherClasses[0].id);
  const [selectedStudent, setSelectedStudent] = React.useState<string | null>(null);
  const [reportType, setReportType] = React.useState<ReportType>('individual');
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [report, setReport] = React.useState<{ student: StudentGrades, assessments: Assessment[] } | null>(null);
  const [date, setDate] = React.useState<DateRange | undefined>();

  const studentsInClass = gradesByClass[selectedClass] || [];

  React.useEffect(() => {
    setSelectedStudent(null);
    setReport(null);
  }, [selectedClass, reportType]);

  const handleGenerateReport = () => {
    if (reportType === 'individual' && !selectedStudent) return;
    
    setIsGenerating(true);
    setTimeout(() => {
      if (reportType === 'individual') {
        const studentData = studentsInClass.find(s => s.studentId === selectedStudent);
        const assessmentData = assessmentsByClass[selectedClass] || [];
        if (studentData) {
          setReport({ student: studentData, assessments: assessmentData });
        }
      }
      setIsGenerating(false);
    }, 1000);
  };
  
  const getGradeForStudent = (student: StudentGrades, assessmentId: string) => {
    const grade = student.grades.find(g => g.assessmentId === assessmentId);
    return grade ? grade.score : '—';
  };

  const isGenerateDisabled = isGenerating || (reportType === 'individual' && !selectedStudent);
  
  const comingSoonReports: ReportType[] = ['summary', 'ranking'];
  
  const reportTitles: Record<ReportType, string> = {
    'individual': 'Individual Student Report',
    'summary': 'Class Performance Summary',
    'ranking': 'Student Ranking & Percentiles',
  };

  return (
    <div className="grid gap-8 md:grid-cols-3">
        <Card className="md:col-span-1">
            <CardHeader>
                <CardTitle>Generate Report</CardTitle>
                <CardDescription>Select options to generate academic reports for students or classes.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-2">
                    <Label htmlFor="report-type-select">Report Type</Label>
                    <Select value={reportType} onValueChange={(value: ReportType) => setReportType(value)}>
                        <SelectTrigger id="report-type-select">
                            <SelectValue placeholder="Select a report type" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectGroup>
                                <SelectLabel>Academic Reports</SelectLabel>
                                <SelectItem value="individual">Individual Student Report</SelectItem>
                                <SelectItem value="summary">Class Performance Summary</SelectItem>
                                <SelectItem value="ranking">Student Ranking &amp; Percentiles</SelectItem>
                            </SelectGroup>
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="class-select">Select Class</Label>
                    <Select value={selectedClass} onValueChange={setSelectedClass}>
                        <SelectTrigger id="class-select">
                            <SelectValue placeholder="Select a class" />
                        </SelectTrigger>
                        <SelectContent>
                            {teacherClasses.map((cls) => (
                                <SelectItem key={cls.id} value={cls.id}>{cls.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                 {reportType === 'individual' && (
                    <div className="space-y-2">
                        <Label htmlFor="student-select">Select Student</Label>
                        <Select value={selectedStudent || ''} onValueChange={setSelectedStudent} disabled={studentsInClass.length === 0}>
                            <SelectTrigger id="student-select">
                                <SelectValue placeholder="Select a student" />
                            </SelectTrigger>
                            <SelectContent>
                                {studentsInClass.map((student) => (
                                    <SelectItem key={student.studentId} value={student.studentId}>{student.studentName}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                 )}
                 <div className="space-y-2">
                    <Label htmlFor="date-range-picker">Term / Date Range</Label>
                      <Select defaultValue="term2-2024">
                        <SelectTrigger id="date-range-picker">
                            <SelectValue placeholder="Select a term" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="term2-2024">Term 2, 2024</SelectItem>
                            <SelectItem value="term1-2024">Term 1, 2024</SelectItem>
                        </SelectContent>
                      </Select>
                 </div>
            </CardContent>
            <CardFooter>
                 <Button onClick={handleGenerateReport} disabled={isGenerateDisabled} className="w-full">
                    {isGenerating ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Generating...
                        </>
                    ) : (
                        <>
                            <FileText className="mr-2 h-4 w-4" />
                            Generate Report
                        </>
                    )}
                </Button>
            </CardFooter>
        </Card>
        
        <div className="md:col-span-2">
            <Card className="min-h-[600px]">
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Report Preview</CardTitle>
                        <CardDescription>A preview of the generated report will appear below.</CardDescription>
                    </div>
                    <Button variant="outline" size="sm" disabled={!report || isGenerating}>
                        <Printer className="mr-2 h-4 w-4" />
                        Print
                    </Button>
                </CardHeader>
                <CardContent>
                    {isGenerating && (
                        <div className="flex flex-col items-center justify-center gap-4 text-center text-muted-foreground pt-32">
                            <Loader2 className="h-12 w-12 animate-spin text-primary" />
                            <p className="font-semibold">Compiling data...</p>
                        </div>
                    )}
                    {!isGenerating && reportType === 'individual' && !report && (
                        <div className="flex flex-col items-center justify-center gap-4 text-center text-muted-foreground pt-32">
                            <FileText className="h-12 w-12 text-primary/50" />
                            <p className="font-semibold">Your generated report will appear here.</p>
                            <p className="text-sm">Select a student and click "Generate Report".</p>
                        </div>
                    )}
                    {!isGenerating && reportType === 'individual' && report && (
                        <div className="border rounded-lg p-6 bg-background shadow-none">
                            <header className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <GraduationCap className="h-10 w-10 text-primary" />
                                    <div>
                                        <h2 className="text-xl font-bold font-headline text-primary">EduSphere High School</h2>
                                        <p className="text-sm text-muted-foreground">End of Term Report</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-semibold">Date: {new Date().toLocaleDateString()}</p>
                                </div>
                            </header>

                            <Separator className="my-6"/>

                            <div className="flex items-center gap-6 mb-6">
                                <Avatar className="h-20 w-20">
                                    <AvatarImage src={report.student.studentAvatar} />
                                    <AvatarFallback>{report.student.studentName.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
                                    <div className="flex gap-2"><span className="font-medium text-muted-foreground">Name:</span> <p>{report.student.studentName}</p></div>
                                    <div className="flex gap-2"><span className="font-medium text-muted-foreground">Class:</span> <p>{teacherClasses.find(c => c.id === selectedClass)?.name}</p></div>
                                    <div className="flex gap-2"><span className="font-medium text-muted-foreground">Roll No:</span> <p>{report.student.rollNumber}</p></div>
                                    <div className="flex gap-2"><span className="font-medium text-muted-foreground">Overall:</span> <Badge>{report.student.overall}%</Badge></div>
                                </div>
                            </div>
                            
                            <h3 className="font-semibold mb-2">Term Performance</h3>
                            <div className="border rounded-md">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Subject / Assessment</TableHead>
                                            <TableHead>Type</TableHead>
                                            <TableHead className="text-right">Score</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {report.assessments.map(assessment => (
                                            <TableRow key={assessment.id}>
                                                <TableCell className="font-medium">{assessment.title}</TableCell>
                                                <TableCell>{assessment.type}</TableCell>
                                                <TableCell className="text-right font-medium">{getGradeForStudent(report.student, assessment.id)}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>

                             <div className="mt-6">
                                <h3 className="font-semibold mb-2">Teacher's Comments</h3>
                                <Textarea readOnly value="An excellent term for this student, showing great improvement in all areas. Keep up the fantastic work and continue to participate actively in class discussions." className="bg-muted/50" />
                            </div>

                             <Separator className="my-6"/>
                             
                             <footer className="text-center text-xs text-muted-foreground">
                                <p>This is an official school document. &copy; {new Date().getFullYear()} EduSphere High School</p>
                             </footer>
                        </div>
                    )}
                    {!isGenerating && comingSoonReports.includes(reportType) && (
                        <div className="flex flex-col items-center justify-center gap-4 text-center text-muted-foreground pt-32 opacity-60">
                            {reportType === 'summary' && <BarChart className="h-12 w-12 text-primary/50" />}
                            {reportType === 'ranking' && <Crown className="h-12 w-12 text-primary/50" />}
                             <Alert variant="default" className="text-left">
                                <AlertTitle>Feature Coming Soon</AlertTitle>
                                <AlertDescription>
                                   The "{reportTitles[reportType]}" report is currently in development. This preview shows where the report would appear.
                                </AlertDescription>
                            </Alert>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    </div>
  );
}
