
'use client';

import * as React from 'react';
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
  FileText,
  PlusCircle,
  Search,
  Filter,
  FileDown,
  ChevronDown,
  Settings,
  BarChart2,
  Save,
  Trash2,
  CheckCircle,
  Clock,
  Send,
  BookCheck,
  CalendarIcon,
  Users,
  Loader2,
  Printer,
  Trophy,
  ArrowRight,
} from 'lucide-react';
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
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { GradeAnalysisCharts } from './grade-analysis-charts';
import { ReportGenerator } from './report-generator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { DateRange } from 'react-day-picker';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { firestore } from '@/lib/firebase';
import { 
  collection, 
  query, 
  onSnapshot, 
  orderBy, 
  Timestamp, 
  addDoc, 
  updateDoc, 
  doc, 
  getDocs, 
  where, 
  DocumentData,
  getDoc
} from 'firebase/firestore';
import { useSearchParams } from 'next/navigation';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

type ExamStatus = 'Scheduled' | 'In Progress' | 'Completed' | 'Grading' | 'Subsided';
type SubmissionStatus = 'Pending' | 'Submitted' | 'Approved' | 'Password';

export type Exam = {
  id: string;
  title: string;
  term: string;
  class: string;
  startDate: Timestamp;
  endDate: Timestamp;
  status: ExamStatus;
  classId?: string;
};

type Submission = {
  id: string;
  examId: string;
  subject: string;
  teacherId: string;
  teacher: string;
  class: string;
  status: SubmissionStatus;
  lastUpdated: Timestamp;
};

type StudentGrade = {
  id: string;
  studentName: string;
  avatarUrl: string;
  grade: string;
  overall?: number;
  rollNumber?: string;
}

type Teacher = {
  id: string;
  name: string;
}

type GradingScaleItem = {
  grade: string;
  min: number;
  max: number;
}

const statusColors: Record<ExamStatus, string> = {
  'Scheduled': 'bg-blue-500',
  'In Progress': 'bg-yellow-500',
  'Completed': 'bg-green-600',
  'Grading': 'bg-purple-500',
  'Subsided': 'bg-gray-500', // Added for your Firebase status
};

const getSubmissionStatusBadge = (status: SubmissionStatus) => {
  switch (status) {
    case 'Pending': return <Badge className="bg-yellow-500 text-white hover:bg-yellow-600"><Clock className="mr-1 h-3 w-3" />Pending</Badge>;
    case 'Submitted': return <Badge className="bg-blue-500 text-white hover:bg-blue-600"><CheckCircle className="mr-1 h-3 w-3" />Submitted</Badge>;
    case 'Approved': return <Badge className="bg-green-600 text-white hover:bg-green-700"><CheckCircle className="mr-1 h-3 w-3" />Approved</Badge>;
    case 'Password': return <Badge className="bg-orange-500 text-white hover:bg-orange-600"><Clock className="mr-1 h-3 w-3" />Password</Badge>;
    default: return <Badge className="bg-gray-500 text-white hover:bg-gray-600">{status}</Badge>;
  }
}

const initialGradingScale: GradingScaleItem[] = [
  { grade: 'A', min: 80, max: 100 },
  { grade: 'A-', min: 75, max: 79 },
  { grade: 'B+', min: 70, max: 74 },
  { grade: 'B', min: 65, max: 69 },
  { grade: 'B-', min: 60, max: 64 },
  { grade: 'C+', min: 55, max: 59 },
  { grade: 'C', min: 50, max: 54 },
  { grade: 'C-', min: 45, max: 49 },
  { grade: 'D+', min: 40, max: 44 },
  { grade: 'D', min: 35, max: 39 },
  { grade: 'D-', min: 30, max: 34 },
  { grade: 'E', min: 0, max: 29 },
]

export default function AdminGradesPage() {
  const searchParams = useSearchParams();
  const schoolId = searchParams.get('schoolId');
  const [clientReady, setClientReady] = React.useState(false);
  const [date, setDate] = React.useState<DateRange | undefined>();
  const [selectedExam, setSelectedExam] = React.useState<Exam | null>(null);
  const [submissionExamFilter, setSubmissionExamFilter] = React.useState('all');
  const [submissionClassFilter, setSubmissionClassFilter] = React.useState('All Classes');
  const [gradingScale, setGradingScale] = React.useState<GradingScaleItem[]>(initialGradingScale);
  const [viewingSubmission, setViewingSubmission] = React.useState<Submission | null>(null);
  const [viewingGrades, setViewingGrades] = React.useState<StudentGrade[]>([]);
  const [isFetchingGrades, setIsFetchingGrades] = React.useState(false);
  const { toast } = useToast();
  const [exams, setExams] = React.useState<Exam[]>([]);
  const [submissions, setSubmissions] = React.useState<Submission[]>([]);
  const [classes, setClasses] = React.useState<{id: string, name: string}[]>([]);
  
  const [activeTab, setActiveTab] = React.useState('schedules');
  const [examForAnalysis, setExamForAnalysis] = React.useState<Exam | null>(null);
  const [studentsForRanking, setStudentsForRanking] = React.useState<StudentGrade[]>([]);
  
  const currentYear = new Date().getFullYear();
  const academicTerms = Array.from({ length: 2 }, (_, i) => {
    const year = currentYear - 1 + i;
    return [`Term 1, ${year}`, `Term 2, ${year}`, `Term 3, ${year}`];
  }).flat();
  academicTerms.push(...[`Term 1, ${currentYear + 1}`, `Term 2, ${currentYear + 1}`, `Term 3, ${currentYear + 1}`]);

  // State for the create exam dialog
  const [newExamTitle, setNewExamTitle] = React.useState('');
  const [newExamTerm, setNewExamTerm] = React.useState(academicTerms[4]);
  const [newExamClass, setNewExamClass] = React.useState<string>('');
  const [newExamNotes, setNewExamNotes] = React.useState('');
  const [isSavingExam, setIsSavingExam] = React.useState(false);

  React.useEffect(() => {
    if (!schoolId) return;

    setClientReady(true);
    
    const examsQuery = query(collection(firestore, `schools/${schoolId}/Assessments`), orderBy('startDate', 'desc'));
    const unsubExams = onSnapshot(examsQuery, (snapshot) => {
      const fetchedExams = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data(),
        classes: doc.data().class || 'N/A'
      } as Exam));
      setExams(fetchedExams);
      if (submissionExamFilter === 'all' && fetchedExams.length > 0) {
        setSubmissionExamFilter(fetchedExams[0].id);
      }
    });
    
    const classesQuery = query(collection(firestore, 'schools', schoolId, 'classes'));
    const unsubClasses = onSnapshot(classesQuery, (snapshot) => {
      const classNames = snapshot.docs.map(doc => ({id: doc.id, name: `${doc.data().name} ${doc.data().stream || ''}`.trim()}));
      setClasses(classNames);
    });

    const teachersQuery = query(collection(firestore, `schools/${schoolId}/users`), where('role', '==', 'Teacher'));
    const submissionsQuery = query(collection(firestore, `schools/${schoolId}/submissions`), orderBy('lastUpdated', 'desc'));

    const fetchSubmissionsAndTeachers = async () => {
        const teacherListSnapshot = await getDocs(teachersQuery);
        const teacherList = teacherListSnapshot.docs.map(d => ({id: d.id, name: d.data().name}));

        const unsubSubmissions = onSnapshot(submissionsQuery, async (snapshot) => {
          const fetchedSubmissions = snapshot.docs.map(doc => {
            const data = doc.data();
            const teacher = teacherList.find(t => t.id === data.teacherId);
            return { 
              id: doc.id, 
              ...data,
              teacher: teacher?.name || 'N/A'
            } as Submission
          });
          setSubmissions(fetchedSubmissions);
        });

        return unsubSubmissions;
    }
    
    const submissionsUnsubscribePromise = fetchSubmissionsAndTeachers();

    return () => {
      unsubExams();
      unsubClasses();
      submissionsUnsubscribePromise.then(unsub => unsub());
    };
  }, [schoolId]);
  
  React.useEffect(() => {
    if (!examForAnalysis || !schoolId) return;

    const fetchStudentGradesForRanking = async () => {
      try {
        const submissionsQuery = query(
          collection(firestore, `schools/${schoolId}/submissions`), 
          where('examId', '==', examForAnalysis.id)
        );
        const submissionsSnapshot = await getDocs(submissionsQuery);
        const submissionsData = submissionsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        const allStudentGrades: Record<string, { total: number, count: number, name: string, avatar: string, rollNumber: string }> = {};

        for (const submission of submissionsData) {
          if (!submission.id) continue;
          
          const gradesRef = collection(firestore, `schools/${schoolId}/submissions`, submission.id, 'grades');
          const gradesSnapshot = await getDocs(gradesRef);
          
          for (const gradeDoc of gradesSnapshot.docs) {
            const gradeData = gradeDoc.data();
            const studentId = gradeData.studentId;
            
            if (studentId) {
              const studentDoc = await getDoc(doc(firestore, `schools/${schoolId}/students`, studentId));
              if (studentDoc.exists()) {
                const studentData = studentDoc.data();
                
                if (!allStudentGrades[studentId]) {
                  allStudentGrades[studentId] = { 
                    total: 0, 
                    count: 0, 
                    name: studentData.name, 
                    avatar: studentData.avatarUrl || '', 
                    rollNumber: studentData.rollNumber || '' 
                  };
                }
                
                const gradeValue = parseInt(gradeData.grade, 10) || 0;
                allStudentGrades[studentId].total += gradeValue;
                allStudentGrades[studentId].count++;
              }
            }
          }
        }
        
        const rankedStudents = Object.entries(allStudentGrades).map(([id, data]) => ({
          id,
          studentName: data.name,
          avatarUrl: data.avatar,
          rollNumber: data.rollNumber,
          grade: '',
          overall: data.count > 0 ? Math.round(data.total / data.count) : 0,
        })).sort((a, b) => (b.overall || 0) - (a.overall || 0));

        setStudentsForRanking(rankedStudents);
      } catch (error) {
        console.error('Error fetching student grades for ranking:', error);
        toast({ variant: 'destructive', title: 'Failed to fetch ranking data' });
      }
    };
    
    fetchStudentGradesForRanking();
  }, [examForAnalysis, schoolId, toast]);

  const filteredSubmissions = submissions.filter(s =>
    (submissionExamFilter === 'all' || s.examId === submissionExamFilter) &&
    (submissionClassFilter === 'All Classes' || s.class === submissionClassFilter)
  );
  
  const handleGradingScaleChange = (index: number, field: 'min' | 'max', value: number) => {
    const newScale = [...gradingScale];
    newScale[index][field] = value;
    setGradingScale(newScale);
  };

  const addGradingRow = () => {
    setGradingScale([...gradingScale, { grade: 'New', min: 0, max: 0 }]);
  };
  
  const removeGradingRow = (index: number) => {
    setGradingScale(gradingScale.filter((_, i) => i !== index));
  };

  const handleSaveScale = () => {
    toast({
      title: 'Grading Scale Saved',
      description: 'The new grading scale has been applied school-wide.',
    });
  }
  
  const handleCreateExam = async () => {
    if (!schoolId || !newExamTitle || !newExamClass || !date?.from) {
      toast({ variant: 'destructive', title: 'Missing Information', description: 'Please fill out the title, class, and date range.' });
      return;
    }
    setIsSavingExam(true);
    try {
      await addDoc(collection(firestore, `schools/${schoolId}/Assessments`), {
        title: newExamTitle,
        term: newExamTerm,
        class: newExamClass,
        classes: classes.find(c => c.id === newExamClass)?.name || 'N/A',
        startDate: Timestamp.fromDate(date.from),
        endDate: Timestamp.fromDate(date.to || date.from),
        notes: newExamNotes,
        status: 'Scheduled',
      });
      toast({ title: 'Exam Created', description: 'The new exam has been scheduled.' });
      setNewExamTitle('');
      setNewExamClass('');
      setDate(undefined);
      setNewExamNotes('');
    } catch (e) {
      console.error(e);
      toast({ variant: 'destructive', title: 'Failed to create exam.' });
    } finally {
      setIsSavingExam(false);
    }
  };

  const handleApproveAll = () => {
    toast({ title: 'Grades Approved', description: 'All submitted grades for the selected view have been approved.' });
  };

  const handlePublishAll = () => {
    toast({ title: 'Grades Published (Simulation)', description: 'In a real app, this would make all approved grades visible to students and parents.' });
  };

  const handleSendReminders = () => {
    toast({ title: 'Reminders Sent (Simulation)', description: 'Reminder notifications have been sent to teachers with pending submissions.' });
  };

  const handleExport = (type: string) => {
    toast({
      title: 'Exporting...',
      description: `A ${type} file is being generated and will be downloaded shortly.`,
    });
  };

  const handleApproveGrades = async () => {
    if (!viewingSubmission || !schoolId) return;

    const submissionRef = doc(firestore, `schools/${schoolId}/submissions`, viewingSubmission.id);
    try {
      await updateDoc(submissionRef, { status: 'Approved' });
      toast({
        title: 'Grades Approved',
        description: `Grades for ${viewingSubmission.subject} have been approved.`
      });
      setViewingSubmission(null);
    } catch (error) {
      console.error('Error approving grades:', error);
      toast({ variant: 'destructive', title: 'Approval Failed' });
    }
  };

  const handleViewGrades = async (submission: Submission) => {
    if (!schoolId) return;
    setViewingSubmission(submission);
    setIsFetchingGrades(true);
    try {
      const grades: StudentGrade[] = [];
      
      const studentsQuery = query(
        collection(firestore, `schools/${schoolId}/students`), 
        where('class', '==', submission.class)
      );
      const studentsSnapshot = await getDocs(studentsQuery);

      const gradesRef = collection(firestore, `schools/${schoolId}/submissions`, submission.id, 'grades');
      const gradesSnapshot = await getDocs(gradesRef);
      const gradesData = gradesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      for (const studentDoc of studentsSnapshot.docs) {
        const studentData = studentDoc.data();
        const studentGrade = gradesData.find(g => g.studentId === studentDoc.id);
        
        if (studentGrade) {
          grades.push({
            id: studentDoc.id,
            studentName: studentData.name,
            avatarUrl: studentData.avatarUrl || '',
            grade: studentGrade.grade || '0',
          });
        }
      }
      
      setViewingGrades(grades);
    } catch (error) {
      console.error("Error fetching grades for submission:", error);
      toast({ variant: 'destructive', title: 'Failed to fetch grades.' });
    } finally {
      setIsFetchingGrades(false);
    }
  };
  
  const handleAnalyzeExam = (exam: Exam) => {
    setExamForAnalysis(exam);
    setActiveTab('analysis');
  }
  
  const handlePrintRanking = () => {
    const doc = new jsPDF();
    const className = classes.find(c => c.id === (examForAnalysis?.classId || ''))?.name;
    doc.text(`Class Ranking for ${className || 'Selected Class'}`, 14, 16);
    
    const tableData = studentsForRanking.map((student, index) => [
      index + 1,
      student.studentName,
      `${student.overall}%`,
    ]);

    (doc as any).autoTable({
      startY: 22,
      head: [['Rank', 'Student Name', 'Overall Grade']],
      body: tableData,
    });
    
    doc.save("class-ranking.pdf");

    toast({
      title: 'Export Successful',
      description: 'The class ranking has been downloaded as a PDF.',
    });
  }

  return (
    <Dialog onOpenChange={(open) => {
      if (!open) {
        setSelectedExam(null);
        setViewingSubmission(null);
        setViewingGrades([]);
      }
    }}>
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="mb-6">
          <h1 className="font-headline text-3xl font-bold flex items-center gap-2">
            <FileText className="h-8 w-8 text-primary" />
            Grades &amp; Exams Management
          </h1>
          <p className="text-muted-foreground">Oversee school-wide examination schedules, grade analysis, and reporting.</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4 md:grid-cols-6 mb-6">
            <TabsTrigger value="schedules">Exam Schedules</TabsTrigger>
            <TabsTrigger value="submissions">Submission Status</TabsTrigger>
            <TabsTrigger value="analysis">Grade Analysis</TabsTrigger>
            <TabsTrigger value="ranking">Class Ranking</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
            <TabsTrigger value="settings">Settings &amp; Policies</TabsTrigger>
          </TabsList>

          <TabsContent value="schedules">
            <Card>
              <CardHeader>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <CardTitle>Upcoming &amp; Past Exams</CardTitle>
                    <CardDescription>A log of all major examination periods.</CardDescription>
                  </div>
                  <div className="flex w-full md:w-auto items-center gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button>
                          <PlusCircle className="mr-2 h-4 w-4"/>
                          Create Exam
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-xl">
                        <DialogHeader>
                          <DialogTitle>Create New Exam</DialogTitle>
                          <DialogDescription>Define a new examination schedule for a term.</DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-6 py-4">
                          <div className="space-y-2">
                            <Label htmlFor="exam-title">Exam Title</Label>
                            <Input id="exam-title" placeholder="e.g., Term 2 Mid-Term Exams" value={newExamTitle} onChange={(e) => setNewExamTitle(e.target.value)} />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="exam-term">Academic Term</Label>
                              <Select value={newExamTerm} onValueChange={setNewExamTerm}>
                                <SelectTrigger id="exam-term">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {academicTerms.map(term => (
                                    <SelectItem key={term} value={term}>{term}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label>Classes Involved</Label>
                              <Select value={newExamClass} onValueChange={setNewExamClass}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select classes..." />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="All Classes">All Classes</SelectItem>
                                  {classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="date-range">Date Range</Label>
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  id="date-range"
                                  variant="outline"
                                  className={cn('w-full justify-start text-left font-normal', !date && 'text-muted-foreground')}
                                >
                                  <CalendarIcon className="mr-2 h-4 w-4" />
                                  {date?.from ? (
                                    date.to ? `${format(date.from, 'LLL dd, y')} - ${format(date.to, 'LLL dd, y')}` : format(date.from, 'LLL dd, y')
                                  ) : <span>Pick a date range</span>}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar initialFocus mode="range" defaultMonth={date?.from} selected={date} onSelect={setDate} numberOfMonths={2} />
                              </PopoverContent>
                            </Popover>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="exam-notes">Notes (Optional)</Label>
                            <Textarea id="exam-notes" placeholder="Add any relevant instructions or notes for teachers." value={newExamNotes} onChange={e => setNewExamNotes(e.target.value)} />
                          </div>
                        </div>
                        <DialogFooter>
                          <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                          <Button onClick={handleCreateExam} disabled={isSavingExam}>
                            {isSavingExam && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                            Save Exam
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline">
                          <FileDown className="mr-2 h-4 w-4"/>
                          Export
                          <ChevronDown className="ml-2 h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => handleExport('PDF')}>Export Schedule (PDF)</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleExport('.ics')}>Export to Calendar (.ics)</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
                <div className="mt-4 flex flex-col items-start gap-4 md:flex-row md:items-center">
                  <div className="relative w-full md:max-w-xs">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Search exams..."
                      className="w-full bg-background pl-8"
                    />
                  </div>
                  <Select defaultValue="all-terms">
                    <SelectTrigger className="w-full md:w-[180px]">
                      <SelectValue placeholder="Filter by term" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all-terms">All Terms</SelectItem>
                      <SelectItem value="Term 2, 2024">Term 2, 2024</SelectItem>
                      <SelectItem value="Term 1, 2024">Term 1, 2024</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                <div className="w-full overflow-auto rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Exam Title</TableHead>
                        <TableHead>Term</TableHead>
                        <TableHead>Classes</TableHead>
                        <TableHead>Date Range</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {exams.map(exam => (
                        <TableRow key={exam.id}>
                          <TableCell className="font-medium">{exam.title}</TableCell>
                          <TableCell>{exam.term}</TableCell>
                          <TableCell>{exam.classes}</TableCell>
                          <TableCell>
                            {clientReady && `${exam.startDate.toDate().toLocaleDateString()} - ${exam.endDate.toDate().toLocaleDateString()}`}
                          </TableCell>
                          <TableCell>
                            <Badge className={`${statusColors[exam.status]} text-white`}>{exam.status}</Badge>
                          </TableCell>
                          <TableCell className="text-right space-x-2">
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="sm" onClick={() => setSelectedExam(exam)}>Details</Button>
                            </DialogTrigger>
                            <Button variant="outline" size="sm" onClick={() => handleAnalyzeExam(exam)}>
                              <BarChart2 className="mr-2 h-4 w-4"/>
                              Analyze
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="submissions">
            <Card>
                <CardHeader>
                    <CardTitle>Grade Submission Status</CardTitle>
                    <CardDescription>Track which teachers have submitted grades for each exam.</CardDescription>
                    <div className="mt-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                         <div className="flex w-full flex-col gap-2 md:w-auto md:flex-row md:items-center">
                            <Select value={submissionExamFilter} onValueChange={setSubmissionExamFilter}>
                                <SelectTrigger className="w-full md:w-[240px]">
                                <SelectValue placeholder="Filter by exam" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Exams</SelectItem>
                                    {exams.map(exam => <SelectItem key={exam.id} value={exam.id}>{exam.title}</SelectItem>)}
                                </SelectContent>
                            </Select>
                             <Select value={submissionClassFilter} onValueChange={setSubmissionClassFilter}>
                                <SelectTrigger className="w-full md:w-[180px]">
                                <SelectValue placeholder="Filter by class" />
                                </SelectTrigger>
                                <SelectContent>
                                    {classes.map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex w-full gap-2 md:w-auto">
                            <Button variant="outline" onClick={handleSendReminders}>
                                <Send className="mr-2 h-4 w-4" />
                                Send Reminders
                            </Button>
                            <Button onClick={handleApproveAll}>
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Approve All
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="w-full overflow-auto rounded-lg border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                <TableHead>Subject</TableHead>
                                <TableHead>Teacher</TableHead>
                                <TableHead>Class</TableHead>
                                <TableHead>Last Updated</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredSubmissions.map(submission => (
                                <TableRow key={submission.id}>
                                    <TableCell className="font-medium">{submission.subject}</TableCell>
                                    <TableCell>{submission.teacher}</TableCell>
                                    <TableCell>{submission.class}</TableCell>
                                    <TableCell>{clientReady ? submission.lastUpdated.toDate().toLocaleString() : ''}</TableCell>
                                    <TableCell>{getSubmissionStatusBadge(submission.status)}</TableCell>
                                    <TableCell className="text-right">
                                    <DialogTrigger asChild>
                                        <Button variant="outline" size="sm" onClick={() => handleViewGrades(submission)}>
                                        View Grades
                                        </Button>
                                    </DialogTrigger>
                                    </TableCell>
                                </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="analysis">
            <GradeAnalysisCharts exam={examForAnalysis} onBack={() => setActiveTab('schedules')} />
          </TabsContent>
          <TabsContent value="ranking">
            <Card>
                <CardHeader>
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                            <CardTitle className="flex items-center gap-2"><Trophy className="h-5 w-5 text-primary"/>Class Ranking</CardTitle>
                            <CardDescription>Student ranking based on overall performance for the selected exam.</CardDescription>
                        </div>
                        <Button variant="outline" onClick={handlePrintRanking}>
                            <Printer className="mr-2 h-4 w-4"/>
                            Print Ranking
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {studentsForRanking.length > 0 ? (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {studentsForRanking.map((student, index) => (
                                <Card key={student.id} className="flex items-center p-4 gap-4">
                                    <div className="flex items-center justify-center font-bold text-lg h-10 w-10 rounded-full bg-muted">{index + 1}</div>
                                    <Avatar className="h-12 w-12">
                                        <AvatarImage src={student.avatarUrl} />
                                        <AvatarFallback>{student.studentName.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1">
                                        <p className="font-semibold">{student.studentName}</p>
                                        <p className="text-sm text-muted-foreground">Overall: <span className="font-bold text-foreground">{student.overall}%</span></p>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center text-muted-foreground py-16">
                            <p>Select an exam on the "Schedules" tab and click "Analyze" to see class rankings.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="reports">
            <ReportGenerator />
          </TabsContent>
          <TabsContent value="settings">
             <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Settings className="h-5 w-5 text-primary"/>Grading Policies</CardTitle>
                    <CardDescription>Define the grading scale and other report card settings.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                             <h4 className="font-semibold text-base">Grading Scale</h4>
                             <div className="space-y-2">
                                {gradingScale.map((item, index) => (
                                <div key={index} className="grid grid-cols-[80px_1fr_1fr_auto] items-center gap-2">
                                    <Input defaultValue={item.grade} className="font-bold"/>
                                    <Input type="number" defaultValue={item.min} onChange={(e) => handleGradingScaleChange(index, 'min', Number(e.target.value))} />
                                    <Input type="number" defaultValue={item.max} onChange={(e) => handleGradingScaleChange(index, 'max', Number(e.target.value))} />
                                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => removeGradingRow(index)}>
                                        <Trash2 className="h-4 w-4"/>
                                    </Button>
                                </div>
                                ))}
                             </div>
                        </div>
                         <div className="space-y-4">
                            <h4 className="font-semibold text-base">Report Card Settings</h4>
                             <div className="flex items-center justify-between rounded-lg border p-3">
                                <div className="space-y-0.5">
                                    <Label>Include Class Rank</Label>
                                </div>
                                <Switch/>
                            </div>
                            <div className="flex items-center justify-between rounded-lg border p-3">
                                <div className="space-y-0.5">
                                    <Label>Include Teacher Comments</Label>
                                </div>
                                <Switch defaultChecked/>
                            </div>
                         </div>
                    </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                    <Button variant="outline" onClick={addGradingRow}>
                        <PlusCircle className="mr-2 h-4 w-4"/>
                        Add Row
                    </Button>
                    <Button onClick={handleSaveScale}>
                        <Save className="mr-2 h-4 w-4"/>
                        Save Policies
                    </Button>
                </CardFooter>
             </Card>
          </TabsContent>
        </Tabs>
      </div>
      
      {selectedExam && (
        <DialogContent className="sm:max-w-xl">
          <>
            <DialogHeader>
              <DialogTitle>{selectedExam.title}</DialogTitle>
              <DialogDescription>Details for the selected examination period.</DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="font-semibold">Term</p>
                  <p className="text-muted-foreground">{selectedExam.term}</p>
                </div>
                <div>
                  <p className="font-semibold">Status</p>
                  <Badge className={`${statusColors[selectedExam.status]} text-white`}>{selectedExam.status}</Badge>
                </div>
              </div>
              <div>
                <p className="font-semibold">Date Range</p>
                <p className="text-muted-foreground">{clientReady && `${selectedExam.startDate.toDate().toLocaleDateString()} - ${selectedExam.endDate.toDate().toLocaleDateString()}`}</p>
              </div>
              <div>
                <p className="font-semibold">Applicable To</p>
                <p className="text-muted-foreground">{selectedExam.classes}</p>
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Close</Button>
              </DialogClose>
            </DialogFooter>
          </>
        </DialogContent>
      )}
      
      {viewingSubmission && (
        <DialogContent className="sm:max-w-2xl">
          <>
            <DialogHeader>
              <DialogTitle>Grades for {viewingSubmission.subject}</DialogTitle>
              <DialogDescription>Submitted by {viewingSubmission.teacher} for {viewingSubmission.class}.</DialogDescription>
            </DialogHeader>
            <div className="py-4">
              {isFetchingGrades ? <div className="h-48 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary"/></div> :
                <div className="w-full overflow-auto rounded-lg border max-h-[60vh]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student</TableHead>
                        <TableHead className="text-right">Score</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {viewingGrades.map(grade => (
                        <TableRow key={grade.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-9 w-9">
                                <AvatarImage src={grade.avatarUrl} alt={grade.studentName} />
                                <AvatarFallback>{grade.studentName.charAt(0)}</AvatarFallback>
                              </Avatar>
                              <span className="font-medium">{grade.studentName}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge variant="secondary">{grade.grade}%</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              }
            </div>
            <DialogFooter>
              <Button variant="secondary">Request Changes</Button>
              <DialogClose asChild>
                <Button variant="outline">Close</Button>
              </DialogClose>
              <Button onClick={handleApproveGrades} disabled={viewingSubmission.status !== 'Submitted'}>Approve Grades</Button>
            </DialogFooter>
          </>
        </DialogContent>
      )}
    </Dialog>
  );
}
