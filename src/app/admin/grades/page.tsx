

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
  FileText,
  PlusCircle,
  Trophy,
  Loader2,
  Printer,
  CalendarIcon,
  BarChart2,
  Settings,
  Edit,
  Copy,
  Archive,
  Search,
  Filter,
  ChevronDown,
  Lock,
  Unlock,
  Send,
  CheckCircle,
  Minus,
  TrendingUp,
  TrendingDown,
  FileDown,
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { DateRange } from 'react-day-picker';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { firestore } from '@/lib/firebase';
import { 
  collection, 
  query, 
  onSnapshot, 
  orderBy, 
  Timestamp, 
  addDoc, 
  getDocs, 
  where, 
  DocumentData,
  doc,
  getDoc,
  updateDoc
} from 'firebase/firestore';
import { useSearchParams } from 'next/navigation';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { GradeAnalysisCharts } from './grade-analysis-charts';


type GradeStatus = 'Graded' | 'Pending';

export type Exam = {
  id: string;
  title: string;
  term: string;
  class: string;
  startDate: Timestamp;
  endDate: Timestamp;
  status: 'Draft' | 'Active' | 'Locked' | 'Published';
  classId?: string;
  progress: number;
};

type Grade = {
  assessmentId: string;
  grade: number | string;
  subject?: string;
};

export type StudentGrade = {
  id: string;
  studentName: string;
  avatarUrl: string;
  grade: string | number;
  overall: number;
  rollNumber?: string;
  grades?: Grade[];
  trend: 'up' | 'down' | 'stable';
};

type GradingScaleItem = {
  grade: string;
  min: number;
  max: number;
}

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
  const [date, setDate] = React.useState<DateRange | undefined>();
  const [gradingScale, setGradingScale] = React.useState<GradingScaleItem[]>(initialGradingScale);
  const { toast } = useToast();
  const [classes, setClasses] = React.useState<{id: string, name: string}[]>([]);
  const [activeTab, setActiveTab] = React.useState('exams');
  const [studentsForRanking, setStudentsForRanking] = React.useState<StudentGrade[]>([]);
  const [selectedClassForRanking, setSelectedClassForRanking] = React.useState<string>('');
  const [selectedSubjectForRanking, setSelectedSubjectForRanking] = React.useState<string>('All Subjects');
  const [subjectsForRanking, setSubjectsForRanking] = React.useState<string[]>(['All Subjects']);
  const [selectedStudentForDetails, setSelectedStudentForDetails] = React.useState<StudentGrade | null>(null);
  const [allExams, setAllExams] = React.useState<Exam[]>([]);
  const [isLoadingRanking, setIsLoadingRanking] = React.useState(true);
  const [examSearchTerm, setExamSearchTerm] = React.useState('');
  
  const [selectedExam, setSelectedExam] = React.useState<Exam | null>(null);
  
  const [currentAssessments, setCurrentAssessments] = React.useState<Exam[]>([]);
  const [isGradebookLoading, setIsGradebookLoading] = React.useState(true);

  const currentYear = new Date().getFullYear();
  const academicTerms = Array.from({ length: 2 }, (_, i) => {
    const year = currentYear - 1 + i;
    return [`Term 1, ${year}`, `Term 2, ${year}`, `Term 3, ${year}`];
  }).flat();
  academicTerms.push(...[`Term 1, ${currentYear + 1}`, `Term 2, ${currentYear + 1}`, `Term 3, ${currentYear + 1}`]);

  // State for the create exam dialog
  const [isCreateExamOpen, setIsCreateExamOpen] = React.useState(false);
  const [newExamTitle, setNewExamTitle] = React.useState('');
  const [newExamTerm, setNewExamTerm] = React.useState(academicTerms[4]);
  const [newExamClass, setNewExamClass] = React.useState<string>('');
  const [newExamNotes, setNewExamNotes] = React.useState('');
  const [isSavingExam, setIsSavingExam] = React.useState(false);

  React.useEffect(() => {
    if (!schoolId) return;

    const unsubExams = onSnapshot(
      query(collection(firestore, `schools/${schoolId}/assessments`), orderBy('startDate', 'desc')),
      async (snapshot) => {
        const examsWithProgress: Exam[] = await Promise.all(snapshot.docs.map(async (examDoc) => {
          const exam = { id: examDoc.id, ...examDoc.data() } as Exam;

          // Calculate progress
          const gradesQuery = query(collection(firestore, `schools/${schoolId}/grades`), where('assessmentId', '==', exam.id));
          const studentsQuery = query(collection(firestore, `schools/${schoolId}/students`), where('classId', '==', exam.classId));
          
          const [gradesSnap, studentsSnap] = await Promise.all([getDocs(gradesQuery), getDocs(studentsQuery)]);
          
          const totalStudents = studentsSnap.size;
          const enteredGrades = gradesSnap.size;

          const progress = totalStudents > 0 ? Math.round((enteredGrades / totalStudents) * 100) : 0;

          return { ...exam, progress };
        }));

        setAllExams(examsWithProgress);
      }
    );

    const unsubClasses = onSnapshot(collection(firestore, `schools/${schoolId}/classes`), (snapshot) => {
      const classList = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        name: `${doc.data().name || doc.data().className || ''} ${doc.data().stream || ''}`.trim() 
      }));
      setClasses(classList);
      if (classList.length > 0 && !selectedClassForRanking) {
        setSelectedClassForRanking(classList[0].id);
      }
    });

    return () => {
      unsubExams();
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

        const studentGradesMap = new Map<string, {name: string, avatarUrl: string, rollNumber: string, grades: {subject: string, grade: number}[]}>();
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
                  rollNumber: studentSnap.data().rollNumber || '',
                  grades: [],
               });
            }
          }

          const gradeValue = parseInt(gradeData.grade, 10);
          if (!isNaN(gradeValue)) {
            studentGradesMap.get(studentId)?.grades.push({
                subject: gradeData.subject,
                grade: gradeValue
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
              grade: average,
              overall: average,
              grades: data.grades,
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
          description: 'Please check your database structure and try again.'
        });
      } finally {
        setIsLoadingRanking(false);
      }
    };
    
    fetchStudentGradesForRanking();
  }, [selectedClassForRanking, selectedSubjectForRanking, schoolId, toast]);

    React.useEffect(() => {
        if (!schoolId || !selectedClassForRanking) {
            setIsGradebookLoading(false);
            return;
        }

        const fetchGradebookData = async () => {
            setIsGradebookLoading(true);
            const assessmentsQuery = query(collection(firestore, 'schools', schoolId, 'assessments'), where('classId', '==', selectedClassForRanking));
            const assessmentsSnap = await getDocs(assessmentsQuery);
            setCurrentAssessments(assessmentsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Exam)));
            setIsGradebookLoading(false);
        };

        fetchGradebookData();
    }, [schoolId, selectedClassForRanking]);


  const handleGradingScaleChange = (index: number, field: 'min' | 'max', value: number) => {
    const newScale = [...gradingScale];
    newScale[index][field] = value;
    setGradingScale(newScale);
  };

  const addGradingRow = () => {
    setGradingScale([...gradingScale, { grade: 'New', min: 0, max: 0 }]);
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
      await addDoc(collection(firestore, `schools/${schoolId}/assessments`), {
        title: newExamTitle,
        term: newExamTerm,
        classId: newExamClass,
        className: classes.find(c => c.id === newExamClass)?.name || 'N/A',
        startDate: Timestamp.fromDate(date.from),
        endDate: Timestamp.fromDate(date.to || date.from),
        notes: newExamNotes,
        status: 'Draft',
      });
      toast({ title: 'Exam Created', description: 'The new exam has been scheduled.' });
      setNewExamTitle('');
      setNewExamClass('');
      setDate(undefined);
      setNewExamNotes('');
      setIsCreateExamOpen(false);
    } catch (e) {
      console.error(e);
      toast({ variant: 'destructive', title: 'Failed to create exam.' });
    } finally {
      setIsSavingExam(false);
    }
  };
  
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
  }
  
  const getGradeForStudent = (student: StudentGrade, assessmentId: string) => {
    const grade = student.grades?.find(g => g.assessmentId === assessmentId);
    return grade ? grade.grade : '—';
  };

  const filteredExams = allExams.filter(exam => 
      exam.title.toLowerCase().includes(examSearchTerm.toLowerCase()) ||
      exam.term.toLowerCase().includes(examSearchTerm.toLowerCase()) ||
      (exam.className && exam.className.toLowerCase().includes(examSearchTerm.toLowerCase()))
  );
  
  const getStatusBadgeColor = (status: Exam['status']) => {
    switch(status) {
        case 'Draft': return 'bg-gray-500';
        case 'Active': return 'bg-blue-500';
        case 'Locked': return 'bg-yellow-500';
        case 'Published': return 'bg-green-600';
    }
  }
  
  const handleUpdateExamStatus = async (examId: string, newStatus: Exam['status']) => {
    if (!schoolId) return;
    try {
        const examRef = doc(firestore, `schools/${schoolId}/assessments`, examId);
        await updateDoc(examRef, { status: newStatus });
        toast({
            title: `Exam Status Updated`,
            description: `The exam is now ${newStatus}.`,
        });
    } catch(e) {
        console.error(e);
        toast({
            title: 'Error',
            description: 'Could not update the exam status.',
            variant: 'destructive',
        });
    }
  };

  const renderExamActions = (exam: Exam) => {
    switch (exam.status) {
        case 'Draft':
            return <DropdownMenuItem onClick={() => handleUpdateExamStatus(exam.id, 'Active')}><Unlock className="mr-2 h-4 w-4" /> Activate Grading</DropdownMenuItem>;
        case 'Active':
            return <DropdownMenuItem onClick={() => handleUpdateExamStatus(exam.id, 'Locked')}><Lock className="mr-2 h-4 w-4" /> Lock Grading</DropdownMenuItem>;
        case 'Locked':
            return <DropdownMenuItem onClick={() => handleUpdateExamStatus(exam.id, 'Published')}><Send className="mr-2 h-4 w-4" /> Publish Results</DropdownMenuItem>;
        case 'Published':
             return <DropdownMenuItem disabled><CheckCircle className="mr-2 h-4 w-4" /> Published</DropdownMenuItem>;
        default:
            return null;
    }
  };
  
    const topStudents = studentsForRanking.slice(0, 3);

  return (
    <div className="p-4 sm:p-6 lg:p-8">
        <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
              <h1 className="font-headline text-3xl font-bold flex items-center gap-2">
                  <FileText className="h-8 w-8 text-primary" />
                  Grades &amp; Exams Management
              </h1>
              <p className="text-muted-foreground">Oversee school-wide examination schedules, grade analysis, and reporting.</p>
          </div>
          <Dialog open={isCreateExamOpen} onOpenChange={setIsCreateExamOpen}>
            <DialogTrigger asChild>
              <Button>
                  <PlusCircle className="mr-2 h-4 w-4"/>
                  Create Exam
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-xl">
              <DialogHeader>
                  <DialogTitle>Exam Details</DialogTitle>
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
        </div>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4 md:w-auto md:inline-flex mb-6">
            <TabsTrigger value="exams">Exam Dashboard</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
            <TabsTrigger value="ranking">Class Ranking</TabsTrigger>
            <TabsTrigger value="gradebook">Broad Sheet</TabsTrigger>
          </TabsList>

          <TabsContent value="reports">
            <ReportGenerator />
          </TabsContent>
          
          <TabsContent value="ranking">
          <Card>
              <CardHeader>
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div>
                          <CardTitle className="flex items-center gap-2"><Trophy className="h-5 w-5 text-primary"/>Class Ranking</CardTitle>
                          <CardDescription>Student ranking based on performance in a specific subject or overall.</CardDescription>
                      </div>
                      <div className="flex w-full flex-col md:flex-row md:items-center gap-2">
                           <Select value={selectedClassForRanking} onValueChange={setSelectedClassForRanking}>
                              <SelectTrigger className="w-full md:w-[240px]">
                                  <SelectValue placeholder="Select a class" />
                              </SelectTrigger>
                              <SelectContent>
                                  {classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                              </SelectContent>
                          </Select>
                          <Select value={selectedSubjectForRanking} onValueChange={setSelectedSubjectForRanking}>
                              <SelectTrigger className="w-full md:w-[240px]">
                                  <SelectValue placeholder="Select a subject" />
                              </SelectTrigger>
                              <SelectContent>
                                  {subjectsForRanking.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                              </SelectContent>
                          </Select>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                <Button variant="outline">
                                    <FileDown className="mr-2 h-4 w-4" />
                                    Export
                                    <ChevronDown className="ml-2 h-4 w-4" />
                                </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                <DropdownMenuItem onClick={() => handleExportRanking('PDF')}>
                                    <FileDown className="mr-2 h-4 w-4" />
                                    Export as PDF
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleExportRanking('CSV')}>
                                    <FileDown className="mr-2 h-4 w-4" />
                                    Export as CSV
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => window.print()}>
                                    <Printer className="mr-2 h-4 w-4" />
                                    Print Ranking
                                </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                      </div>
                  </div>
              </CardHeader>
              <CardContent>
                {isLoadingRanking ? (
                  <div className="flex justify-center items-center py-16">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <span className="ml-2">Loading ranking data...</span>
                  </div>
                ) : (
                  <Dialog onOpenChange={(open) => !open && setSelectedStudentForDetails(null)}>
                    {studentsForRanking.length > 0 ? (
                        <>
                            <Card className="mb-6 border-amber-300/50 bg-amber-50/50 dark:bg-amber-900/10">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-amber-500"><Trophy/> Top Performers</CardTitle>
                                </CardHeader>
                                <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                                    {topStudents.map((student, index) => (
                                        <div key={student.id} className={cn("p-4 rounded-lg", index === 0 && "bg-amber-100 dark:bg-amber-900/20")}>
                                            <Avatar className="h-16 w-16 mx-auto mb-2">
                                                <AvatarImage src={student.avatarUrl} />
                                                <AvatarFallback>{student.studentName.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                            <p className="font-bold text-lg">{index + 1}{index === 0 ? 'st' : index === 1 ? 'nd' : 'rd'}</p>
                                            <p className="font-semibold">{student.studentName}</p>
                                            <p className="text-sm text-muted-foreground">{student.rollNumber}</p>
                                            <Badge className="mt-2">{student.overall}% ({getGradeFromScore(student.overall)})</Badge>
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>
                            <Separator/>
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mt-6">
                                {studentsForRanking.map((student, index) => (
                                    <DialogTrigger key={student.id} asChild>
                                        <Card className="flex items-center p-4 gap-4 cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => setSelectedStudentForDetails(student)}>
                                            <div className="flex items-center justify-center font-bold text-lg h-10 w-10 rounded-full bg-muted">{index + 1}</div>
                                            <Avatar className="h-12 w-12">
                                                <AvatarImage src={student.avatarUrl} />
                                                <AvatarFallback>{student.studentName.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1">
                                                <p className="font-semibold">{student.studentName}</p>
                                                <p className="text-sm text-muted-foreground flex items-center gap-1">
                                                    Score: <span className="font-bold text-foreground">{student.overall}%</span>
                                                    {student.trend === 'up' && <TrendingUp className="h-4 w-4 text-green-500" />}
                                                    {student.trend === 'down' && <TrendingDown className="h-4 w-4 text-red-500" />}
                                                    {student.trend === 'stable' && <Minus className="h-4 w-4 text-gray-500" />}
                                                </p>
                                            </div>
                                        </Card>
                                    </DialogTrigger>
                                ))}
                            </div>
                        </>
                    ) : (
                        <div className="text-center text-muted-foreground py-16">
                            <p>No ranking data available for this class and subject yet.</p>
                            <p className="text-sm mt-2">Make sure students have grades assigned.</p>
                        </div>
                    )}
                    <DialogContent className="sm:max-w-md">
                        {selectedStudentForDetails && (
                            <>
                                <DialogHeader>
                                    <DialogTitle>{selectedStudentForDetails.studentName}</DialogTitle>
                                    <DialogDescription>
                                      Overall Average: <span className="font-bold text-primary">{selectedStudentForDetails.overall}%</span>
                                      {selectedStudentForDetails.rollNumber && (
                                        <span> | Adm No: {selectedStudentForDetails.rollNumber}</span>
                                      )}
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
                                              {selectedStudentForDetails.grades?.map((gradeInfo, index) => (
                                                  <TableRow key={index}>
                                                      <TableCell className="font-medium">{gradeInfo.subject}</TableCell>
                                                      <TableCell className="text-right">{gradeInfo.grade}%</TableCell>
                                                  </TableRow>
                                              ))}
                                          </TableBody>
                                      </Table>
                                    </div>
                                </div>
                            </>
                        )}
                    </DialogContent>
                  </Dialog>
                )}
              </CardContent>
          </Card>
          </TabsContent>

          <TabsContent value="gradebook">
             <Card>
                <CardHeader>
                    <CardTitle>Broad Sheet / Gradebook</CardTitle>
                    <CardDescription>A single-sheet overview of the entire class's results for all assessments.</CardDescription>
                </CardHeader>
                 <CardContent>
                 {isGradebookLoading ? (
                  <div className="flex justify-center items-center py-16">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <span className="ml-2">Loading gradebook...</span>
                  </div>
                 ) : (
                    <div className="w-full overflow-auto rounded-lg border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="sticky left-0 bg-card z-10">Student Name</TableHead>
                                    {currentAssessments.map(assessment => <TableHead key={assessment.id} className="text-center">{assessment.title}</TableHead>)}
                                    <TableHead className="text-center font-bold sticky right-0 bg-card z-10 w-[150px]">Overall Average</TableHead>
                                </TableRow>
                            </TableHeader>
                             <TableBody>
                                {studentsForRanking.map(student => (
                                    <TableRow key={student.id}>
                                        <TableCell className="sticky left-0 bg-card z-10">
                                          <div className="flex items-center gap-3">
                                            <Avatar className="h-9 w-9">
                                                <AvatarImage src={student.avatarUrl} alt={student.studentName} />
                                                <AvatarFallback>{student.studentName.slice(0,2)}</AvatarFallback>
                                            </Avatar>
                                            <span className="font-medium">{student.studentName}</span>
                                          </div>
                                        </TableCell>
                                         {currentAssessments.map(assessment => (
                                            <TableCell key={assessment.id} className="text-center">
                                                {getGradeForStudent(student, assessment.id)}
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
                 )}
                 </CardContent>
             </Card>
          </TabsContent>

          <TabsContent value="exams">
            {selectedExam ? (
                <GradeAnalysisCharts exam={selectedExam} onBack={() => setSelectedExam(null)} />
            ) : (
             <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Settings className="h-5 w-5 text-primary"/>Exam Dashboard &amp; Schedules</CardTitle>
                    <CardDescription>View, edit, or clone existing examination schedules.</CardDescription>
                    <div className="relative w-full md:max-w-sm pt-4">
                        <Search className="absolute left-2.5 top-6 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="search"
                            placeholder="Search by title, term, or class..."
                            className="w-full bg-background pl-8"
                            value={examSearchTerm}
                            onChange={(e) => setExamSearchTerm(e.target.value)}
                        />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="w-full overflow-auto rounded-lg border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Exam Title</TableHead>
                                    <TableHead>Term</TableHead>
                                    <TableHead>Class</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Progress</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                            {filteredExams.map(exam => (
                                <TableRow key={exam.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelectedExam(exam)}>
                                    <TableCell className="font-medium">{exam.title}</TableCell>
                                    <TableCell>{exam.term}</TableCell>
                                    <TableCell>{exam.className}</TableCell>
                                    <TableCell>{format(exam.startDate.toDate(), 'dd MMM')} - {format(exam.endDate.toDate(), 'dd MMM, yyyy')}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className={cn("text-white", getStatusBadgeColor(exam.status))}>{exam.status}</Badge>
                                    </TableCell>
                                     <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Progress value={exam.progress} className="w-24" />
                                            <span className="text-xs text-muted-foreground">{exam.progress}%</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => e.stopPropagation()}>
                                                    <ChevronDown className="h-4 w-4"/>
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                {renderExamActions(exam)}
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem><Edit className="mr-2 h-4 w-4"/> Edit Details</DropdownMenuItem>
                                                <DropdownMenuItem><Copy className="mr-2 h-4 w-4"/> Clone Exam</DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem className="text-destructive"><Archive className="mr-2 h-4 w-4"/> Archive</DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
             </Card>
             )}
          </TabsContent>
        </Tabs>
    </div>
  );
}
