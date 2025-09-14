
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
import { FileText, Loader2, Printer, GraduationCap, BarChart as BarChartIcon, Percent, Crown, BookCheck, AlertCircle, Trophy, Users, ClipboardList, Send, History, Bell, Calendar as CalendarIcon, TrendingUp, TrendingDown, UserCheck, UserX } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';
import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, LabelList } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { firestore } from '@/lib/firebase';
import { collection, query, where, onSnapshot, getDocs, doc } from 'firebase/firestore';
import { useSearchParams } from 'next/navigation';

// --- Data Types (could be shared in a types file) ---
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

// --- Report Specific Types ---
type ReportType = 'individual' | 'summary' | 'ranking' | 'assignment-completion' | 'daily-log' | 'absentee-patterns' | 'participation-records' | 'performance-stats' | 'team-rosters' | 'message-delivery' | 'interaction-logs' | 'notification-history';

type ClassSummary = {
    average: number;
    highest: number;
    lowest: number;
    passRate: number;
    distribution: { name: string; students: number }[];
    topPerformers: StudentGrades[];
    needsAttention: StudentGrades[];
}

const gradeDistributionRanges = [
  { range: 'A (80-100)', min: 80, max: 100, count: 0 },
  { range: 'B (65-79)', min: 65, max: 79, count: 0 },
  { range: 'C (50-64)', min: 50, max: 64, count: 0 },
  { range: 'D (35-49)', min: 35, max: 49, count: 0 },
  { range: 'E (0-34)', min: 0, max: 34, count: 0 },
];

const summaryChartConfig = {
  students: {
    label: 'Students',
    color: 'hsl(var(--primary))',
  },
};

type TeacherClass = {
  id: string;
  name: string;
};

export function ReportGenerator() {
  const searchParams = useSearchParams();
  const schoolId = searchParams.get('schoolId');
  const [teacherClasses, setTeacherClasses] = React.useState<TeacherClass[]>([]);
  const [selectedClass, setSelectedClass] = React.useState<string | undefined>();
  const [selectedStudent, setSelectedStudent] = React.useState<string | null>(null);
  const [reportType, setReportType] = React.useState<ReportType>('individual');
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [individualReport, setIndividualReport] = React.useState<{ student: StudentGrades, assessments: Assessment[] } | null>(null);
  const [summaryReport, setSummaryReport] = React.useState<ClassSummary | null>(null);
  const [date, setDate] = React.useState<DateRange | undefined>();
  const [alertLowPerf, setAlertLowPerf] = React.useState(false);
  const [alertAbsent, setAlertAbsent] = React.useState(false);

  const [studentsInClass, setStudentsInClass] = React.useState<StudentGrades[]>([]);
  const [assessmentsForClass, setAssessmentsForClass] = React.useState<Assessment[]>([]);
  const teacherId = 'teacher-wanjiku'; // Placeholder

  React.useEffect(() => {
    if (!schoolId) return;

    const classesQuery = query(collection(firestore, `schools/${schoolId}/classes`), where('teacherId', '==', teacherId));
    const unsubClasses = onSnapshot(classesQuery, (snapshot) => {
        const classes = snapshot.docs.map(doc => ({ id: doc.id, name: `${doc.data().name} ${doc.data().stream || ''}`.trim() }));
        setTeacherClasses(classes);
        if (!selectedClass && classes.length > 0) {
            setSelectedClass(classes[0].id);
        }
    });

    return () => unsubClasses();
  }, [schoolId, selectedClass, teacherId]);

  React.useEffect(() => {
    if (!schoolId || !selectedClass) return;

    // Listener for students in the selected class
    const studentsQuery = query(collection(firestore, 'schools', schoolId, 'students'), where('classId', '==', selectedClass));
    const unsubStudents = onSnapshot(studentsQuery, async (snapshot) => {
        const studentsData = await Promise.all(snapshot.docs.map(async (studentDoc) => {
            const student = { studentId: studentDoc.id, ...studentDoc.data() } as any;
            const gradesQuery = query(collection(firestore, 'schools', schoolId, 'students', student.studentId, 'grades'));
            const gradesSnapshot = await getDocs(gradesQuery);
            const grades: Grade[] = gradesSnapshot.docs.map(gdoc => ({ assessmentId: gdoc.data().assessmentId, score: gdoc.data().grade }));
            const numericScores = grades.map(g => parseInt(String(g.score))).filter(s => !isNaN(s));
            const overall = numericScores.length > 0 ? Math.round(numericScores.reduce((a,b) => a+b, 0) / numericScores.length) : 0;
            return { ...student, grades, overall };
        }));
        setStudentsInClass(studentsData);
    });

    // Listener for assessments for the selected class
    const assessmentsQuery = query(collection(firestore, 'schools', schoolId, 'assessments'), where('classId', '==', selectedClass));
    const unsubAssessments = onSnapshot(assessmentsQuery, (snapshot) => {
        const assessments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Assessment));
        setAssessmentsForClass(assessments);
    });

    return () => {
        unsubStudents();
        unsubAssessments();
    }
  }, [selectedClass, schoolId]);


  React.useEffect(() => {
    setSelectedStudent(null);
    setIndividualReport(null);
    setSummaryReport(null);
  }, [selectedClass, reportType]);

  const handleGenerateReport = () => {
    if (reportType === 'individual' && !selectedStudent) return;
    
    setIsGenerating(true);
    setTimeout(() => {
      if (reportType === 'individual') {
        const studentData = studentsInClass.find(s => s.studentId === selectedStudent);
        if (studentData) {
          setIndividualReport({ student: studentData, assessments: assessmentsForClass });
        }
      } else if (reportType === 'summary') {
        if (studentsInClass.length === 0) {
            setSummaryReport(null);
            setIsGenerating(false);
            return;
        }
        const grades = studentsInClass.map(s => s.overall);
        const average = grades.reduce((acc, grade) => acc + grade, 0) / grades.length;
        const distribution = [...gradeDistributionRanges.map(r => ({ ...r, count: 0 }))];
        studentsInClass.forEach(student => {
            const range = distribution.find(r => student.overall >= r.min && student.overall <= r.max);
            if (range) range.count++;
        });

        const newSummary: ClassSummary = {
            average: Math.round(average),
            highest: Math.max(...grades),
            lowest: Math.min(...grades),
            passRate: Math.round((studentsInClass.filter(s => s.overall >= 50).length / studentsInClass.length) * 100),
            distribution: distribution.map(d => ({ name: d.range.split(' ')[0], students: d.count })),
            topPerformers: [...studentsInClass].sort((a,b) => b.overall - a.overall).slice(0, 3),
            needsAttention: [...studentsInClass].filter(s => s.overall < average - 15).sort((a,b) => a.overall - b.overall).slice(0, 3),
        };
        setSummaryReport(newSummary);
      }
      setIsGenerating(false);
    }, 1000);
  };
  
  const getGradeForStudent = (student: StudentGrades, assessmentId: string) => {
    const grade = student.grades.find(g => g.assessmentId === assessmentId);
    return grade ? grade.score : '—';
  };

  const isGenerateDisabled = (reportType === 'individual' && !selectedStudent) || isGenerating;
  const showReport = (reportType === 'individual' && individualReport) || (reportType === 'summary' && summaryReport);
  
  const comingSoonReports: ReportType[] = ['ranking', 'assignment-completion', 'daily-log', 'absentee-patterns', 'participation-records', 'performance-stats', 'team-rosters', 'message-delivery', 'interaction-logs', 'notification-history'];
  
  const reportTitles: Record<ReportType, string> = {
    'individual': 'Individual Student Report',
    'summary': 'Class Performance Summary',
    'ranking': 'Student Ranking & Percentiles',
    'assignment-completion': 'Assignment Completion Report',
    'daily-log': 'Daily/Weekly Attendance Log',
    'absentee-patterns': 'Absentee Pattern Analysis',
    'participation-records': 'Participation Records',
    'performance-stats': 'Performance Stats & Awards',
    'team-rosters': 'Event Attendance & Rosters',
    'message-delivery': 'Message Delivery & Read Receipts',
    'interaction-logs': 'Parent-Teacher Interaction Logs',
    'notification-history': 'Notification History',
  };

  return (
    <>
      <div className="grid gap-8 md:grid-cols-3">
          <Card className="md:col-span-1">
              <CardHeader>
                  <CardTitle>Generate Report</CardTitle>
                  <CardDescription>Select options to generate academic, attendance, or activity reports.</CardDescription>
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
                              <SelectGroup>
                                  <SelectLabel>Assignment Reports</SelectLabel>
                                  <SelectItem value="assignment-completion">Assignment Completion Report</SelectItem>
                              </SelectGroup>
                              <SelectGroup>
                                  <SelectLabel>Attendance Reports</SelectLabel>
                                  <SelectItem value="daily-log">Daily/Weekly Attendance Log</SelectItem>
                                  <SelectItem value="absentee-patterns">Absentee Pattern Analysis</SelectItem>
                              </SelectGroup>
                              <SelectGroup>
                                  <SelectLabel>Sports &amp; Activities Reports</SelectLabel>
                                  <SelectItem value="participation-records">Participation Records</SelectItem>
                                  <SelectItem value="performance-stats">Performance Stats &amp; Awards</SelectItem>
                                  <SelectItem value="team-rosters">Event Attendance &amp; Rosters</SelectItem>
                              </SelectGroup>
                              <SelectGroup>
                                  <SelectLabel>Communication Reports</SelectLabel>
                                  <SelectItem value="message-delivery">Message Delivery &amp; Read Receipts</SelectItem>
                                  <SelectItem value="interaction-logs">Parent-Teacher Interaction Logs</SelectItem>
                                  <SelectItem value="notification-history">Notification History</SelectItem>
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
                      <Label htmlFor="date-range-picker">Date Range (Optional)</Label>
                        <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                id="date-range-picker"
                                variant={'outline'}
                                className={cn(
                                    'w-full justify-start text-left font-normal',
                                    !date && 'text-muted-foreground'
                                )}
                            >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {date?.from ? (
                              date.to ? (
                                <>
                                  {format(date.from, 'LLL dd, y')} -{' '}
                                  {format(date.to, 'LLL dd, y')}
                                </>
                              ) : (
                                format(date.from, 'LLL dd, y')
                              )
                            ) : (
                              <span>Pick a date range</span>
                            )}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              initialFocus
                              mode="range"
                              defaultMonth={date?.from}
                              selected={date}
                              onSelect={setDate}
                              numberOfMonths={2}
                            />
                        </PopoverContent>
                        </Popover>
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
              <Separator className="my-4" />
              <div className="p-4 space-y-4">
                  <h4 className="font-semibold flex items-center gap-2 text-base">
                      <Bell className="h-5 w-5 text-primary" />
                      Automated Alerts
                  </h4>
                  <p className="text-xs text-muted-foreground">Set up automated reports for specific triggers.</p>
                  <div className="space-y-3">
                      <div className="flex items-center justify-between space-x-2 p-2 rounded-md border border-transparent hover:border-border hover:bg-muted/50">
                          <Label htmlFor="alert-low-perf" className="text-sm">Low performance alert</Label>
                          <Switch id="alert-low-perf" checked={alertLowPerf} onCheckedChange={setAlertLowPerf} />
                      </div>
                      <div className="flex items-center justify-between space-x-2 p-2 rounded-md border border-transparent hover:border-border hover:bg-muted/50">
                          <Label htmlFor="alert-absenteeism" className="text-sm">High absenteeism alert</Label>
                          <Switch id="alert-absenteeism" checked={alertAbsent} onCheckedChange={setAlertAbsent} />
                      </div>
                  </div>
              </div>
          </Card>
          
          <div className="md:col-span-2">
              <Card className="min-h-[600px]">
                  <CardHeader className="flex flex-row items-center justify-between">
                      <div>
                          <CardTitle>Report Preview</CardTitle>
                          <CardDescription>A preview of the generated report will appear below.</CardDescription>
                      </div>
                      <Button variant="outline" size="sm" disabled={!showReport || isGenerating} onClick={() => window.print()}>
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
                      {!isGenerating && !showReport && (
                          <div className="flex flex-col items-center justify-center gap-4 text-center text-muted-foreground pt-32">
                              <FileText className="h-12 w-12 text-primary/50" />
                              <p className="font-semibold">Your generated report will appear here.</p>
                              <p className="text-sm">Select a report type and click "Generate Report".</p>
                          </div>
                      )}
                      {!isGenerating && reportType === 'individual' && individualReport && (
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
                                      <AvatarImage src={individualReport.student.studentAvatar} />
                                      <AvatarFallback>{individualReport.student.studentName.charAt(0)}</AvatarFallback>
                                  </Avatar>
                                  <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
                                      <div className="flex gap-2"><span className="font-medium text-muted-foreground">Name:</span> <p>{individualReport.student.studentName}</p></div>
                                      <div className="flex gap-2"><span className="font-medium text-muted-foreground">Class:</span> <p>{teacherClasses.find(c => c.id === selectedClass)?.name}</p></div>
                                      <div className="flex gap-2"><span className="font-medium text-muted-foreground">Roll No:</span> <p>{individualReport.student.rollNumber}</p></div>
                                      <div className="flex gap-2"><span className="font-medium text-muted-foreground">Overall:</span> <Badge>{individualReport.student.overall}%</Badge></div>
                                  </div>
                              </div>
                              
                              <h3 className="font-semibold mb-2">Term Performance</h3>
                              <div className="border rounded-md">
                                  <Table>
                                      <TableHeader>
                                          <TableRow>
                                              <TableHead>Assessment</TableHead>
                                              <TableHead>Type</TableHead>
                                              <TableHead className="text-right">Score</TableHead>
                                          </TableRow>
                                      </TableHeader>
                                      <TableBody>
                                          {individualReport.assessments.map(assessment => (
                                              <TableRow key={assessment.id}>
                                                  <TableCell className="font-medium">{assessment.title}</TableCell>
                                                  <TableCell>{assessment.type}</TableCell>
                                                  <TableCell className="text-right font-medium">{getGradeForStudent(individualReport.student, assessment.id)}</TableCell>
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
                      {!isGenerating && reportType === 'summary' && summaryReport && (
                          <div className="border rounded-lg p-6 bg-background shadow-none">
                              <header className="flex items-center justify-between mb-6">
                                  <div className="flex items-center gap-3">
                                      <BarChartIcon className="h-10 w-10 text-primary" />
                                      <div>
                                          <h2 className="text-xl font-bold font-headline text-primary">Class Performance Summary</h2>
                                          <p className="text-sm text-muted-foreground">{teacherClasses.find(c=>c.id === selectedClass)?.name} - Term 2, 2024</p>
                                      </div>
                                  </div>
                              </header>
                              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                                  <Card>
                                      <CardHeader className="pb-2"><CardDescription>Class Average</CardDescription></CardHeader>
                                      <CardContent><p className="text-2xl font-bold">{summaryReport.average}%</p></CardContent>
                                  </Card>
                                  <Card>
                                      <CardHeader className="pb-2"><CardDescription>Pass Rate</CardDescription></CardHeader>
                                      <CardContent><p className="text-2xl font-bold">{summaryReport.passRate}%</p></CardContent>
                                  </Card>
                                  <Card>
                                      <CardHeader className="pb-2"><CardDescription>Highest Score</CardDescription></CardHeader>
                                      <CardContent><p className="text-2xl font-bold">{summaryReport.highest}%</p></CardContent>
                                  </Card>
                                  <Card>
                                      <CardHeader className="pb-2"><CardDescription>Lowest Score</CardDescription></CardHeader>
                                      <CardContent><p className="text-2xl font-bold">{summaryReport.lowest}%</p></CardContent>
                                  </Card>
                              </div>
                              <h3 className="font-semibold mb-2">Grade Distribution</h3>
                              <ChartContainer config={summaryChartConfig} className="h-[200px] w-full">
                                  <BarChart accessibilityLayer data={summaryReport.distribution} margin={{ top: 20 }}>
                                      <CartesianGrid vertical={false} />
                                      <XAxis dataKey="name" tickLine={false} tickMargin={10} axisLine={false} />
                                      <YAxis />
                                      <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
                                      <Bar key="students" dataKey="students" fill="var(--color-students)" radius={8}>
                                          <LabelList position="top" offset={8} className="fill-foreground" fontSize={12} />
                                      </Bar>
                                  </BarChart>
                              </ChartContainer>
                              <Separator className="my-6"/>
                              <div className="grid md:grid-cols-2 gap-6">
                                  <div>
                                      <h3 className="font-semibold mb-2 flex items-center gap-2"><TrendingUp className="text-green-500" />Top Performers</h3>
                                      <div className="space-y-2">
                                          {summaryReport.topPerformers.map(s => (
                                              <div key={s.studentId} className="flex items-center justify-between text-sm p-2 rounded-md bg-muted/50">
                                                  <p>{s.studentName}</p><Badge>{s.overall}%</Badge>
                                              </div>
                                          ))}
                                      </div>
                                  </div>
                                  <div>
                                      <h3 className="font-semibold mb-2 flex items-center gap-2"><TrendingDown className="text-red-500" />Needs Attention</h3>
                                      <div className="space-y-2">
                                        {summaryReport.needsAttention.map(s => (
                                              <div key={s.studentId} className="flex items-center justify-between text-sm p-2 rounded-md bg-muted/50">
                                                  <p>{s.studentName}</p><Badge variant="destructive">{s.overall}%</Badge>
                                              </div>
                                          ))}
                                          {summaryReport.needsAttention.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No students are significantly below average.</p>}
                                      </div>
                                  </div>
                              </div>
                          </div>
                      )}
                      {!isGenerating && comingSoonReports.includes(reportType) && (
                          <div className="flex flex-col items-center justify-center gap-4 text-center text-muted-foreground pt-32 opacity-60">
                              {reportType === 'ranking' && <Crown className="h-12 w-12 text-primary/50" />}
                              {reportType === 'assignment-completion' && <BookCheck className="h-12 w-12 text-primary/50" />}
                              {(reportType === 'daily-log' || reportType === 'absentee-patterns') && <AlertCircle className="h-12 w-12 text-primary/50" />}
                              {reportType === 'participation-records' && <Users className="h-12 w-12 text-primary/50" />}
                              {reportType === 'performance-stats' && <Trophy className="h-12 w-12 text-primary/50" />}
                              {reportType === 'team-rosters' && <ClipboardList className="h-12 w-12 text-primary/50" />}
                              {reportType === 'message-delivery' && <Send className="h-12 w-12 text-primary/50" />}
                              {reportType === 'interaction-logs' && <History className="h-12 w-12 text-primary/50" />}
                              {reportType === 'notification-history' && <Bell className="h-12 w-12 text-primary/50" />}
                              <Alert variant="default" className="text-left">
                                  <AlertTitle>Feature Coming Soon</AlertTitle>
                                  <AlertDescription>
                                    The "{reportTitles[reportType]}" report is currently in development. This preview shows the intended layout.
                                  </AlertDescription>
                              </Alert>
                          </div>
                      )}
                  </CardContent>
              </Card>
          </div>
      </div>
    </>
  );
}
