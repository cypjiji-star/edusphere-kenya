
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
  Upload,
  BarChart as BarChartIcon,
  AlertTriangle,
  CalendarIcon,
  ChevronDown,
  Clock,
  Trash2,
  Edit,
  Save,
  Copy,
  Check,
  X,
  History,
  Printer,
  FileDown,
  Download,
  User,
  ShieldAlert,
  Bell,
  Wand2,
  CheckCircle,
  XCircle,
  Columns,
  Loader2,
  Send,
  RefreshCcw,
  ArrowLeft,
  Search,
  Users,
  ChevronLeft,
  ChevronRight,
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { useSearchParams } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, LabelList } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { firestore } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, Timestamp, query, onSnapshot, orderBy, getDocs, where, getDoc, doc, updateDoc, writeBatch, deleteDoc, setDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/auth-context';
import { logAuditEvent } from '@/lib/audit-log.service';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';

type Exam = {
  id: string;
  title: string;
  class: string;
  classId: string;
  subject: string;
  date: Timestamp;
  duration: number;
  type: 'CAT' | 'Midterm' | 'Final' | 'Practical';
  moderatorFeedback?: string;
  status: 'Open' | 'Pending Approval' | 'Closed' | 'Grading Complete';
};

type GroupedExam = Exam & {
  isGrouped?: boolean;
  subjectCount?: number;
  groupedIds?: string[];
};

type StudentGrade = {
  studentId: string;
  studentName: string;
  admNo: string;
  avatarUrl: string;
  scores: Record<string, number>;
  classId: string;
};

type StudentGradeEntry = {
  studentId: string;
  studentName: string;
  avatarUrl: string;
  admNo: string;
  score: string;
  grade: string;
  gradeStatus: 'Unmarked' | 'Pending Approval' | 'Approved' | 'Rejected';
  submissionId?: string;
  error?: string;
}

type Ranking = {
  position: number;
  streamPosition: number;
  name: string;
  admNo: string;
  avatarUrl: string;
  total: number;
  avg: number;
  grade: string;
};

type AuditLog = {
  id: string;
  timestamp: Timestamp;
  user: { id: string; name: string };
  student?: string;
  action: string;
  details: string;
};

type PendingGrade = {
  id: string;
  studentName: string;
  studentId: string;
  subject: string;
  grade: string;
  teacherName: string;
  assessmentTitle: string;
  examId: string;
  className: string;
};

type GroupedPendingGrades = Record<string, Record<string, PendingGrade[]>>;

type TeacherClass = {
  id: string;
  name: string;
}

const examTypes: Exam['type'][] = ['CAT', 'Midterm', 'Final', 'Practical'];

const chartConfig = {
  average: {
    label: "Average",
    color: "hsl(var(--primary))",
  },
} satisfies React.ComponentProps<typeof ChartContainer>["config"];

const schoolInfo = {
  name: "EduSphere High School",
  motto: "Excellence & Integrity",
  logoUrl: "https://i.postimg.cc/0r1RGZvk/android-launchericon-512_512.png",
};

// Custom hook for debouncing
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = React.useState<T>(value);

  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Error Boundary Component
class GradeErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Grade component error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 border border-destructive rounded-lg bg-destructive/10">
          <h3 className="text-lg font-semibold text-destructive">Something went wrong</h3>
          <p className="text-muted-foreground">Please refresh the page and try again.</p>
          <Button 
            onClick={() => this.setState({ hasError: false })}
            className="mt-2"
          >
            Try Again
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Student Grade Row Component
const StudentGradeRow = React.memo(({ 
  student, 
  index, 
  onScoreChange, 
  onSaveGrade, 
  onKeyDown,
  isLocked 
}: {
  student: StudentGradeEntry;
  index: number;
  onScoreChange: (studentId: string, score: string) => void;
  onSaveGrade: (studentId: string, score: string, index: number) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>, index: number) => void;
  isLocked: boolean;
}) => {
  const inputRef = React.useRef<HTMLInputElement>(null);
  
  return (
    <TableRow key={student.studentId}>
      <TableCell>
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            <AvatarImage src={student.avatarUrl} alt={student.studentName} />
            <AvatarFallback>{student.studentName.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <span className="font-medium">{student.studentName}</span>
            <p className="text-xs text-muted-foreground">Adm: {student.admNo}</p>
          </div>
        </div>
      </TableCell>
      <TableCell>
        <div className="relative">
          <Input
            ref={inputRef}
            type="number"
            placeholder="Enter score"
            value={student.score}
            onChange={(e) => onScoreChange(student.studentId, e.target.value)}
            onBlur={(e) => onSaveGrade(student.studentId, e.target.value, index)}
            onKeyDown={(e) => onKeyDown(e, index)}
            className={cn("w-32", student.error && "border-destructive focus-visible:ring-destructive")}
            disabled={isLocked || student.gradeStatus === 'Approved' || student.gradeStatus === 'Pending Approval'}
          />
          {student.error && <p className="text-xs text-destructive mt-1">{student.error}</p>}
        </div>
      </TableCell>
      <TableCell>
        <Badge variant={!student.score || student.error ? "outline" : "default"} className="text-lg font-bold p-2 w-12 justify-center">
          {student.grade || '—'}
        </Badge>
      </TableCell>
      <TableCell>
        {student.gradeStatus === 'Pending Approval' ? 
          <Badge variant="secondary" className="bg-yellow-500 text-white">Pending</Badge> :
        student.gradeStatus === 'Approved' ?
          <Badge variant="default" className="bg-green-600">Approved</Badge> :
        student.gradeStatus === 'Rejected' ?
          <Badge variant="destructive">Rejected</Badge> :
          <Badge variant="outline">Unmarked</Badge>
        }
      </TableCell>
    </TableRow>
  );
});

StudentGradeRow.displayName = 'StudentGradeRow';

// Grade Table Component
const GradeTable = ({ students, isLoading, onScoreChange, onSaveGrade, onKeyDown, isLocked }: {
  students: StudentGradeEntry[];
  isLoading: boolean;
  onScoreChange: (studentId: string, score: string) => void;
  onSaveGrade: (studentId: string, score: string, index: number) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>, index: number) => void;
  isLocked: boolean;
}) => {
  if (isLoading) {
    return (
      <TableRow>
        <TableCell colSpan={4} className="h-24 text-center">
          <Loader2 className="h-6 w-6 animate-spin mx-auto"/>
        </TableCell>
      </TableRow>
    );
  }

  return (
    <>
      {students.map((student, index) => (
        <StudentGradeRow
          key={student.studentId}
          student={student}
          index={index}
          onScoreChange={onScoreChange}
          onSaveGrade={onSaveGrade}
          onKeyDown={onKeyDown}
          isLocked={isLocked}
        />
      ))}
    </>
  );
};

function ReportCardDialog({ student, studentGrades, open, onOpenChange }: { student: Ranking | null, studentGrades: StudentGrade[] | null, open: boolean, onOpenChange: (open: boolean) => void }) {
  if (!student || !studentGrades) return null;
  
  const studentData = studentGrades.find(s => s.admNo === student.admNo);

  const handleDownloadPdf = () => {
    const doc = new jsPDF();
    
    doc.setFontSize(22);
    doc.text(schoolInfo.name, 14, 22);
    doc.setFontSize(12);
    doc.text(schoolInfo.motto, 14, 30);
    doc.setFontSize(16);
    doc.text("Student Report Card", 105, 40, { align: 'center' });
    
    doc.setFontSize(10);
    doc.text(`Student: ${student.name}`, 14, 50);
    doc.text(`Admission No: ${student.admNo}`, 14, 56);
    doc.text(`Class: Form 4`, 14, 62);

    (doc as any).autoTable({
      startY: 70,
      head: [['Subject', 'Score', 'Grade', 'Comment']],
      body: studentData ? Object.entries(studentData.scores).map(([subject, score]) => [
        subject,
        score,
        calculateGrade(score),
        'Good progress.'
      ]) : [],
    });
    
    const finalY = (doc as any).lastAutoTable.finalY || 100;
    
    doc.setFontSize(10);
    doc.text('Summary', 14, finalY + 10);
    (doc as any).autoTable({
      startY: finalY + 15,
      theme: 'plain',
      body: [
        ['Total Marks:', `${student.total} / ${studentData ? Object.keys(studentData.scores).length * 100 : 'N/A'}`],
        ['Average:', `${student.avg.toFixed(1)}%`],
        ['Mean Grade:', student.grade],
        ['Class Rank:', `${student.position} of ${studentGrades.length}`],
      ],
    });

    doc.save(`report-card-${student.admNo}.pdf`);
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <div id="report-card-content" className="p-8">
          <DialogHeader className="border-b pb-4 mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16"><AvatarImage src={schoolInfo.logoUrl} /></Avatar>
                <div>
                  <DialogTitle className="text-2xl font-headline">{schoolInfo.name}</DialogTitle>
                  <DialogDescription className="italic">"{schoolInfo.motto}"</DialogDescription>
                </div>
              </div>
              <div className="text-right">
                <h3 className="font-bold text-lg">Student Report Card</h3>
                <p className="text-sm text-muted-foreground">Term 2, 2024</p>
              </div>
            </div>
          </DialogHeader>
          <div className="grid grid-cols-3 gap-4 text-sm mb-6">
            <div><span className="font-semibold">Student:</span> {student.name}</div>
            <div><span className="font-semibold">Admission No:</span> {student.admNo}</div>
            <div><span className="font-semibold">Class:</span> Form 4</div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Subject</TableHead>
                <TableHead className="text-center">Score</TableHead>
                <TableHead>Grade</TableHead>
                <TableHead>Comment</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {studentData && Object.entries(studentData.scores).map(([subject, score]) => (
                <TableRow key={subject}>
                  <TableCell>{subject}</TableCell>
                  <TableCell className="text-center font-semibold">{score}</TableCell>
                  <TableCell>{calculateGrade(score)}</TableCell>
                  <TableCell className="text-xs text-muted-foreground italic">Good progress.</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="mt-6 grid grid-cols-2 gap-4">
            <Card>
              <CardHeader><CardTitle className="text-base">Summary</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="font-semibold">Total Marks:</span><span>{student.total} / {studentData ? Object.keys(studentData.scores).length * 100 : 'N/A'}</span></div>
                <div className="flex justify-between"><span className="font-semibold">Average:</span><span>{student.avg.toFixed(1)}%</span></div>
                <div className="flex justify-between"><span className="font-semibold">Mean Grade:</span><Badge>{student.grade}</Badge></div>
                <div className="flex justify-between"><span className="font-semibold">Class Rank:</span><span>{student.position} of ${studentGrades.length}</span></div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base">Comments</CardTitle></CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div><Label>Class Teacher:</Label><p className="italic text-muted-foreground">A commendable effort this term. Keep focusing in class.</p></div>
                <div><Label>Principal:</Label><p className="italic text-muted-foreground">Satisfactory performance. Well done.</p></div>
              </CardContent>
            </Card>
          </div>
        </div>
        <DialogFooter className="border-t pt-4">
          <DialogClose asChild><Button variant="outline">Close</Button></DialogClose>
          <Button onClick={handleDownloadPdf}><Download className="mr-2 h-4 w-4"/>Download as PDF</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const getCurrentTerm = (): string => {
  const today = new Date();
  const month = today.getMonth();
  const year = today.getFullYear();

  if (month >= 0 && month <= 3) {
    return `term1-${year}`;
  } else if (month >= 4 && month <= 7) {
    return `term2-${year}`;
  } else {
    return `term3-${year}`;
  }
};

const generateAcademicTerms = () => {
  const currentYear = new Date().getFullYear();
  const terms = [];
  for (let year = currentYear - 2; year <= currentYear; year++) {
    terms.push({ value: `term1-${year}`, label: `Term 1, ${year}` });
    terms.push({ value: `term2-${year}`, label: `Term 2, ${year}` });
    terms.push({ value: `term3-${year}`, label: `Term 3, ${year}` });
  }
  return terms.sort((a,b) => b.value.localeCompare(a.value));
}

function RejectGradeDialog({ open, onOpenChange, onSubmit, grade }: { open: boolean, onOpenChange: (open: boolean) => void, onSubmit: (feedback: string) => void, grade: PendingGrade | null }) {
  const [feedback, setFeedback] = React.useState('');
  if (!grade) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reject Grade Submission</DialogTitle>
          <DialogDescription>
            Provide feedback to the teacher explaining why the grade for {grade.studentName} in {grade.subject} is being rejected. The teacher will be able to edit and resubmit.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Label htmlFor="feedback-input">Feedback</Label>
          <Textarea
            id="feedback-input"
            placeholder="e.g., Please double check this score, it seems unusually low..."
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button variant="destructive" onClick={() => onSubmit(feedback)} disabled={!feedback}>Reject &amp; Send Feedback</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function calculateGrade(score: number): string {
    if (isNaN(score) || score < 0 || score > 100) return '';
    if (score >= 80) return 'A';
    if (score >= 65) return 'B';
    if (score >= 50) return 'C';
    if (score >= 40) return 'D';
    return 'E';
}

function GradeEntryView({ exam, onBack, schoolId, teacher }: { exam: Exam, onBack: () => void, schoolId: string, teacher: { id: string, name: string } }) {
  const { toast } = useToast();
  const [students, setStudents] = React.useState<StudentGradeEntry[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [currentPage, setCurrentPage] = React.useState(1);
  const studentsPerPage = 25;
  const gradeInputRefs = React.useRef<(HTMLInputElement | null)[]>([]);

  React.useEffect(() => {
    setIsLoading(true);
    let studentUnsub: () => void = () => {};
    let gradesUnsub: () => void = () => {};

    const studentsQuery = query(collection(firestore, 'schools', schoolId, 'students'), where('classId', '==', exam.classId));
    studentUnsub = onSnapshot(studentsQuery, (studentsSnap) => {
      const studentData = studentsSnap.docs.map(doc => {
        const data = doc.data();
        return {
          studentId: doc.id,
          studentName: data.name,
          avatarUrl: data.avatarUrl || '',
          admNo: data.admissionNumber || '',
          score: '',
          grade: '',
          gradeStatus: 'Unmarked' as const,
          submissionId: undefined,
        };
      });

      const gradesQuery = query(collection(firestore, 'schools', schoolId, 'grades'), where('examId', '==', exam.id));
      gradesUnsub = onSnapshot(gradesQuery, (gradesSnap) => {
        const gradesMap = new Map(gradesSnap.docs.map(doc => [doc.data().studentId, { submissionId: doc.id, score: doc.data().grade, status: doc.data().status || 'Approved' }]));
        
        const mergedStudents = studentData.map(student => {
          const existingGrade = gradesMap.get(student.studentId);
          const score = existingGrade?.score || '';
          return {
            ...student,
            score,
            grade: score ? calculateGrade(Number(score)) : '',
            gradeStatus: existingGrade ? existingGrade.status : 'Unmarked',
            submissionId: existingGrade?.submissionId,
          };
        });
        setStudents(mergedStudents);
        gradeInputRefs.current = gradeInputRefs.current.slice(0, studentData.length);
        setIsLoading(false);
      });
    });

    return () => {
      studentUnsub();
      gradesUnsub();
    };
  }, [exam.id, exam.classId, schoolId]);
  
  const handleScoreChange = (studentId: string, score: string) => {
    let error = undefined;
    const scoreNum = Number(score);
    if (score && (isNaN(scoreNum) || scoreNum < 0 || scoreNum > 100)) {
      error = 'Score must be between 0 and 100.';
    }

    setStudents(prev => prev.map(s => 
      s.studentId === studentId 
      ? { ...s, score, grade: calculateGrade(scoreNum), error } 
      : s
    ));
  };

  const handleSaveGrade = async (studentId: string, score: string, index: number) => {
    const scoreNum = Number(score);
    if (!score || isNaN(scoreNum) || scoreNum < 0 || scoreNum > 100) return;

    const student = students.find(s => s.studentId === studentId);
    if (!student) return;

    try {
      const gradeRef = student.submissionId ? doc(firestore, 'schools', schoolId, 'grades', student.submissionId) : doc(collection(firestore, 'schools', schoolId, 'grades'));
      
      await setDoc(gradeRef, {
        grade: score,
        examId: exam.id,
        studentId: student.studentId,
        studentRef: doc(firestore, 'schools', schoolId, 'students', student.studentId),
        subject: exam.subject,
        classId: exam.classId,
        date: exam.date,
        teacherName: teacher.name,
        status: 'Pending Approval'
      }, { merge: true });
      
      toast({
        title: 'Grade Saved!',
        description: `The grade for ${student.studentName} is saved and awaits admin approval.`,
      });
    } catch (e: any) {
      console.error(e);
      toast({ title: 'Error', description: e.message || 'Failed to save grade.', variant: 'destructive'});
    }
  };

  const handleSubmitAllGrades = async () => {
    setIsSaving(true);
    try {
      const examRef = doc(firestore, 'schools', schoolId, 'exams', exam.id);
      await updateDoc(examRef, { status: 'Pending Approval' });
      
      await logAuditEvent({
        schoolId,
        action: 'GRADES_SUBMITTED_FOR_APPROVAL',
        actionType: 'Academics',
        user: { id: teacher.id, name: teacher.name, role: 'Teacher' },
        details: `Grades for exam: "${exam.title}" - ${exam.class} submitted for admin approval.`,
      });
      
      toast({
        title: 'Grades Submitted!',
        description: 'All grades for this exam have been submitted for moderation.',
      });
      onBack();
    } catch(e: any) {
      toast({ title: 'Error', description: e.message || 'Failed to submit grades.', variant: 'destructive'});
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Enter' || e.key === 'ArrowDown') {
      e.preventDefault();
      gradeInputRefs.current[index + 1]?.focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      gradeInputRefs.current[index - 1]?.focus();
    }
  };

  const handleRequestUnlock = async () => {
    if (!schoolId) return;

    await addDoc(collection(firestore, 'schools', schoolId, 'notifications'), {
      title: 'Unlock Request',
      description: `Teacher ${teacher.name} has requested to unlock grades for exam: "${exam.title}".`,
      createdAt: serverTimestamp(),
      read: false,
      href: `/admin/grades?schoolId=${schoolId}&examId=${exam.id}`,
    });

    toast({
      title: 'Request Sent',
      description: 'The administrator has been notified of your request to unlock these grades.'
    });
  }

  const filteredStudents = React.useMemo(() => {
    return students.filter(s => 
      s.studentName.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
      s.admNo.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
    );
  }, [students, debouncedSearchTerm]);
  
  const paginatedStudents = React.useMemo(() => {
    const startIndex = (currentPage - 1) * studentsPerPage;
    return filteredStudents.slice(startIndex, startIndex + studentsPerPage);
  }, [filteredStudents, currentPage]);
  
  const totalPages = Math.ceil(filteredStudents.length / studentsPerPage);
  
  const gradedCount = students.filter(s => s.score !== '' && !s.error).length;
  const totalStudents = students.length;
  const progress = totalStudents > 0 ? (gradedCount / totalStudents) * 100 : 0;
  const isLocked = exam.status === 'Closed' || exam.status === 'Grading Complete';
  
  const PaginationControls = () => (
    <div className="flex items-center justify-between mt-4">
      <div className="text-sm text-muted-foreground">
        Showing {paginatedStudents.length} of {filteredStudents.length} students
      </div>
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
          disabled={currentPage === 1}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm">
          Page {currentPage} of {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
          disabled={currentPage === totalPages || totalPages === 0}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
  
  return (
    <Card>
      <CardHeader>
        <Button variant="outline" size="sm" onClick={onBack} className="mb-4 w-fit">
          <ArrowLeft className="mr-2 h-4 w-4"/> Back to Exams
        </Button>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="font-headline text-2xl">Enter Marks: {exam.title}</CardTitle>
            <CardDescription>{exam.class} - {exam.subject}</CardDescription>
          </div>
          {isLocked ? (
            <Button variant="secondary" onClick={handleRequestUnlock}>
              <RefreshCcw className="mr-2 h-4 w-4" />
              Request Unlock
            </Button>
          ) : (
            <Button onClick={handleSubmitAllGrades} disabled={isSaving}>
              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4"/>}
              Submit for Approval
            </Button>
          )}
        </div>
        <div className="pt-4 space-y-2">
          <div className="flex justify-between text-sm font-medium">
            <Label>Grading Progress</Label>
            <span>{gradedCount} / {totalStudents} Students</span>
          </div>
          <Progress value={progress} />
        </div>
        <div className="relative w-full md:max-w-sm mt-4">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search students..."
            className="w-full bg-background pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className="w-full overflow-auto rounded-lg border hidden md:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[300px]">Student</TableHead>
                <TableHead className="w-[200px]">Mark / Score (out of 100)</TableHead>
                <TableHead className="w-[150px]">Auto-Grade</TableHead>
                <TableHead className="w-[150px]">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <GradeTable
                students={paginatedStudents}
                isLoading={isLoading}
                onScoreChange={handleScoreChange}
                onSaveGrade={handleSaveGrade}
                onKeyDown={handleKeyDown}
                isLocked={isLocked}
              />
            </TableBody>
          </Table>
          <PaginationControls />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:hidden">
          {isLoading ? (
            <div className="col-span-full h-24 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto"/></div>
          ) : paginatedStudents.map((student, index) => (
            <Card key={student.studentId}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={student.avatarUrl} alt={student.studentName} />
                    <AvatarFallback>{student.studentName.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-base">{student.studentName}</CardTitle>
                    <CardDescription>Adm: {student.admNo}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor={`score-${student.studentId}`}>Score (out of 100)</Label>
                  <Input
                    id={`score-${student.studentId}`}
                    ref={el => gradeInputRefs.current[index] = el}
                    type="number"
                    placeholder="Enter score"
                    value={student.score}
                    onChange={(e) => handleScoreChange(student.studentId, e.target.value)}
                    onBlur={(e) => handleSaveGrade(student.studentId, e.target.value, index)}
                    className={cn(student.error && "border-destructive focus-visible:ring-destructive")}
                    disabled={isLocked}
                  />
                  {student.error && <p className="text-xs text-destructive mt-1">{student.error}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Auto-Grade</Label>
                  <Badge variant={!student.score || student.error ? "outline" : "default"} className="text-lg font-bold p-2 w-16 justify-center block">
                    {student.grade || '—'}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <div>
                    {student.gradeStatus === 'Pending Approval' ? 
                      <Badge variant="secondary" className="bg-yellow-500 text-white">Pending</Badge> :
                    student.gradeStatus === 'Approved' ?
                      <Badge variant="default" className="bg-green-600">Approved</Badge> :
                      <Badge variant="outline">Unmarked</Badge>
                    }
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          <PaginationControls />
        </div>
      </CardContent>
    </Card>
  );
}

const getStatusBadge = (status: Exam['status']) => {
  switch (status) {
    case 'Open': return <Badge variant="secondary" className="bg-blue-500 text-white hover:bg-blue-600">Open</Badge>;
    case 'Pending Approval': return <Badge variant="secondary" className="bg-yellow-500 text-white hover:bg-yellow-600">Pending Approval</Badge>;
    case 'Closed': return <Badge variant="outline">Closed</Badge>;
    case 'Grading Complete': return <Badge variant="default" className="bg-green-600 hover:bg-green-700">Grading Complete</Badge>;
    default: return <Badge variant="outline">{status}</Badge>;
  }
}

export default function TeacherGradesContent() {
  const searchParams = useSearchParams();
  const schoolId = searchParams.get('schoolId');
  const { toast } = useToast();
  const { user: adminUser } = useAuth();
  
  const [exams, setExams] = React.useState<Exam[]>([]);
  const [editingExam, setEditingExam] = React.useState<Exam | null>(null);
  const [examToDelete, setExamToDelete] = React.useState<GroupedExam | null>(null);
  const [selectedStudentForReport, setSelectedStudentForReport] = React.useState<Ranking | null>(null);
  const [studentGrades, setStudentGrades] = React.useState<StudentGrade[]>([]);
  const [auditLog, setAuditLog] = React.useState<AuditLog[]>([]);
  const [pendingGrades, setPendingGrades] = React.useState<PendingGrade[]>([]);
  const [groupedPendingGrades, setGroupedPendingGrades] = React.useState<GroupedPendingGrades>({});
  const [activeTab, setActiveTab] = React.useState('exam-management');
  const [loadingState, setLoadingState] = React.useState({
    exams: true,
    students: true,
    grades: true,
    classes: true,
    auditLog: true,
    pendingGrades: true
  });

  const [isCreateDialogOpen, setIsCreateDialogOpen] = React.useState(false);
  const [examTitle, setExamTitle] = React.useState('');
  const [examClassId, setExamClassId] = React.useState('');
  const [examSubject, setExamSubject] = React.useState('');
  const [examDate, setExamDate] = React.useState<Date | undefined>();
  const [examDuration, setExamDuration] = React.useState('');
  const [examType, setExamType] = React.useState<Exam['type'] | undefined>();
  const [classes, setClasses] = React.useState<{id: string, name: string}[]>([]);
  const [subjects, setSubjects] = React.useState<string[]>([]);
  const [classPerformanceData, setClassPerformanceData] = React.useState<{ name: string; average: number }[]>([]);
  const [academicTerms] = React.useState(generateAcademicTerms());
  
  const [selectedReportTerm, setSelectedReportTerm] = React.useState<string>(getCurrentTerm());
  const [termExams, setTermExams] = React.useState<GroupedExam[]>([]);
  const [selectedReportExamTitle, setSelectedReportExamTitle] = React.useState<string>('');
  const [reportClassFilter, setReportClassFilter] = React.useState<string>('all');
  const [classRankings, setClassRankings] = React.useState<Record<string, Ranking[]>>({});

  const [isUploadDialogOpen, setIsUploadDialogOpen] = React.useState(false);
  const [bulkImportFile, setBulkImportFile] = React.useState<File | null>(null);
  const [isFileProcessed, setIsFileProcessed] = React.useState(false);
  const [isProcessingFile, setIsProcessingFile] = React.useState(false);
  const [gradeToReject, setGradeToReject] = React.useState<PendingGrade | null>(null);
  const [examTermFilter, setExamTermFilter] = React.useState<string>(getCurrentTerm());
  const [selectedExamForSubmissions, setSelectedExamForSubmissions] = React.useState<Exam | null>(null);
  
  React.useEffect(() => {
    if (!schoolId) return;

    const unsubscribers: (()=>void)[] = [];

    unsubscribers.push(onSnapshot(query(collection(firestore, `schools/${schoolId}/classes`)), snapshot => {
      setClasses(snapshot.docs.map(doc => ({id: doc.id, name: `${doc.data().name} ${doc.data().stream || ''}`.trim()})));
      setLoadingState(prev => ({ ...prev, classes: false }));
    }));

    unsubscribers.push(onSnapshot(query(collection(firestore, `schools/${schoolId}/subjects`)), snapshot => {
      setSubjects(snapshot.docs.map(doc => doc.data().name));
    }));

    unsubscribers.push(onSnapshot(query(collection(firestore, `schools/${schoolId}/exams`), orderBy('date', 'desc')), (snapshot) => {
      setExams(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Exam)));
      setLoadingState(prev => ({ ...prev, exams: false }));
    }));

    unsubscribers.push(onSnapshot(query(collection(firestore, `schools/${schoolId}/grades`), where('status', '==', 'Approved')), async (snapshot) => {
        const gradesByStudent: Record<string, { scores: Record<string, number>, classId: string, admNo: string, studentName: string, avatarUrl: string }> = {};
        
        for (const doc of snapshot.docs) {
            const data = doc.data();
            const studentId = data.studentId;

            if (!gradesByStudent[studentId]) {
                const studentSnap = await getDoc(data.studentRef);
                if (studentSnap.exists()) {
                    const sData = studentSnap.data();
                    gradesByStudent[studentId] = { studentId, scores: {}, classId: sData.classId, admNo: sData.admissionNumber, studentName: sData.name, avatarUrl: sData.avatarUrl };
                }
            }
            if (gradesByStudent[studentId]) {
                gradesByStudent[studentId].scores[data.subject] = Number(data.grade);
            }
        }
        
        const studentScores = Object.values(gradesByStudent).map(data => ({
            studentId: data.studentId,
            studentName: data.studentName,
            admNo: data.admNo,
            avatarUrl: data.avatarUrl,
            classId: data.classId,
            scores: data.scores
        }));

        setStudentGrades(studentScores);
        setLoadingState(prev => ({ ...prev, grades: false }));

        const classAvgs: Record<string, { total: number; count: number }> = {};
        studentScores.forEach(student => {
            const avg = student.scores ? Object.values(student.scores).reduce((a, b) => a + b, 0) / Object.keys(student.scores).length : 0;
            const studentClassName = classes.find(c => c.id === student.classId)?.name;
            if (studentClassName) {
                if (!classAvgs[studentClassName]) {
                    classAvgs[studentClassName] = { total: 0, count: 0 };
                }
                classAvgs[studentClassName].total += avg;
                classAvgs[studentClassName].count++;
            }
        });
        setClassPerformanceData(Object.entries(classAvgs).map(([className, data]) => ({ name: className, average: Math.round(data.total / data.count) })));
    }));

    unsubscribers.push(onSnapshot(query(collection(firestore, 'schools', schoolId, 'audit_logs'), where('action', 'in', ['GRADE_UPDATED', 'GRADE_APPROVED', 'GRADE_REJECTED']), orderBy('timestamp', 'desc')), (snapshot) => {
      setAuditLog(snapshot.docs.map(doc => ({id: doc.id, ...doc.data()} as AuditLog)));
      setLoadingState(prev => ({ ...prev, auditLog: false }));
    }));
      
    unsubscribers.push(onSnapshot(query(collection(firestore, 'schools', schoolId, 'grades'), where('status', '==', 'Pending Approval')), async (snapshot) => {
      const classMap = new Map(classes.map(c => [c.id, c.name]));
      const pendingData: PendingGrade[] = await Promise.all(snapshot.docs.map(async (gradeDoc) => {
        const data = gradeDoc.data();
        const studentSnap = await getDoc(data.studentRef);
        const examSnap = data.examId ? await getDoc(doc(firestore, 'schools', schoolId, 'exams', data.examId)) : null;

        return {
          id: gradeDoc.id,
          studentName: studentSnap.data()?.name || 'Unknown',
          studentId: studentSnap.id,
          subject: data.subject,
          grade: data.grade,
          teacherName: data.teacherName,
          assessmentTitle: examSnap?.data()?.title || 'N/A',
          examId: data.examId,
          className: classMap.get(data.classId) || 'Unknown Class',
        };
      }));
      setPendingGrades(pendingData);
      setLoadingState(prev => ({ ...prev, pendingGrades: false }));

      const grouped: GroupedPendingGrades = {};
      for (const grade of pendingData) {
        if (!grouped[grade.className]) grouped[grade.className] = {};
        if (!grouped[grade.className][grade.studentName]) grouped[grade.className][grade.studentName] = [];
        grouped[grade.className][grade.studentName].push(grade);
      }
      setGroupedPendingGrades(grouped);
    }));

    return () => unsubscribers.forEach(unsub => unsub());
  }, [schoolId, classes]);

  const getTermDates = (term: string) => {
    const [termName, yearStr] = term.split('-');
    const year = parseInt(yearStr, 10);
    switch(termName) {
      case 'term1': return { start: new Date(year, 0, 1), end: new Date(year, 3, 30) };
      case 'term2': return { start: new Date(year, 4, 1), end: new Date(year, 7, 31) };
      case 'term3': return { start: new Date(year, 8, 1), end: new Date(year, 11, 31) };
      default: return null;
    }
  };
  
  const groupedExams = React.useMemo(() => {
    const termRange = getTermDates(examTermFilter);
    const filteredExams = termRange
      ? exams.filter(exam => {
          const examDate = exam.date.toDate();
          return examDate >= termRange.start && examDate <= termRange.end;
        })
      : exams;

    const groups = new Map<string, Exam[]>();
    filteredExams.forEach(exam => {
      const key = `${exam.title}|${exam.classId}|${exam.date.toMillis()}`;
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(exam);
    });

    const allSubjectsCount = subjects.length;

    return Array.from(groups.values()).map(group => {
      const representative = group[0];
      if (group.length > 1) {
        return {
          ...representative,
          id: group.map(g => g.id).join(','),
          isGrouped: true,
          subjectCount: group.length,
          subject: group.length === allSubjectsCount ? 'All Subjects' : `${group.length} subjects`,
          groupedIds: group.map(g => g.id),
        };
      }
      return representative;
    });
  }, [exams, subjects.length, examTermFilter]);
  
  React.useEffect(() => {
    const termRange = getTermDates(selectedReportTerm);
    if (!termRange) {
      setTermExams([]);
      return;
    }
    const filteredExams = exams.filter(exam => {
      const examDate = exam.date.toDate();
      return examDate >= termRange.start && examDate <= termRange.end;
    });
    setTermExams(filteredExams);
  }, [selectedReportTerm, exams]);

  // Ranking calculation
  React.useEffect(() => {
    if (!selectedReportExamTitle || studentGrades.length === 0) {
        setClassRankings({});
        return;
    }
    const relevantGrades = studentGrades.filter(sg => {
        return reportClassFilter === 'all' || sg.classId === reportClassFilter;
    });

    const gradesForSelectedExam = termExams.filter(exam => exam.title === selectedReportExamTitle);
    const subjectsInExam = [...new Set(gradesForSelectedExam.map(exam => exam.subject))];

    const studentScores: Record<string, { name: string, admNo: string, avatarUrl: string, classId: string, scores: number[] }> = {};

    relevantGrades.forEach(studentGrade => {
        subjectsInExam.forEach(subject => {
            if (studentGrade.scores[subject] !== undefined) {
                if (!studentScores[studentGrade.studentId]) {
                    studentScores[studentGrade.studentId] = { name: studentGrade.studentName, admNo: studentGrade.admNo, avatarUrl: studentGrade.avatarUrl, classId: studentGrade.classId, scores: [] };
                }
                studentScores[studentGrade.studentId].scores.push(studentGrade.scores[subject]);
            }
        });
    });

    const calculatedRankingsByClass: Record<string, Ranking[]> = {};
    const allStudentsForRanking = Object.entries(studentScores).map(([id, data]) => {
        const total = data.scores.reduce((a, b) => a + b, 0);
        const avg = data.scores.length > 0 ? total / data.scores.length : 0;
        return {
            id,
            ...data,
            total,
            avg,
            grade: calculateGrade(avg),
        };
    }).sort((a, b) => b.total - a.total);
    
    allStudentsForRanking.forEach((studentData, index) => {
        const classId = studentData.classId;
        if (!calculatedRankingsByClass[classId]) {
            calculatedRankingsByClass[classId] = [];
        }
        calculatedRankingsByClass[classId].push({
            position: index + 1, // Overall position
            streamPosition: 0, // Placeholder
            name: studentData.name,
            admNo: studentData.admNo,
            avatarUrl: studentData.avatarUrl,
            total: studentData.total,
            avg: studentData.avg,
            grade: studentData.grade,
        });
    });

    // Calculate stream-specific ranks
    Object.keys(calculatedRankingsByClass).forEach(classId => {
        calculatedRankingsByClass[classId].sort((a,b) => b.total - a.total).forEach((student, index) => {
            student.streamPosition = index + 1;
        });
    });

    setClassRankings(calculatedRankingsByClass);
  }, [selectedReportExamTitle, studentGrades, classes, reportClassFilter, termExams]);

  const handleCreateExam = async () => {
    if (!schoolId || !examTitle || !examClassId || !examSubject || !examDate || !examDuration || !examType) {
      toast({
        title: 'Missing Information',
        description: 'Please fill out all exam details.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const classesToCreateFor = examClassId === 'all' ? classes : classes.filter(c => c.id === examClassId);
      const subjectsToCreateFor = examSubject === 'all' ? subjects : [examSubject];

      if (classesToCreateFor.length === 0 || subjectsToCreateFor.length === 0) {
        toast({
          title: 'No targets found',
          description: 'Could not find any classes or subjects to create exams for.',
          variant: 'destructive',
        });
        return;
      }

      const batch = writeBatch(firestore);

      for (const classInfo of classesToCreateFor) {
        for (const subjectName of subjectsToCreateFor) {
          const examRef = doc(collection(firestore, `schools/${schoolId}/exams`));
          batch.set(examRef, {
            title: examTitle,
            class: classInfo.name,
            classId: classInfo.id,
            subject: subjectName,
            date: Timestamp.fromDate(examDate),
            duration: Number(examDuration),
            type: examType,
            createdAt: serverTimestamp(),
            status: 'Open',
          });
        }
      }

      await batch.commit();
      
      let successMessage = `The "${examTitle}" exam has been scheduled.`;
      if (examClassId === 'all' || examSubject === 'all') {
        successMessage = `Exams have been created for the selected classes and subjects.`;
      }
      
      toast({
        title: 'Exams Created',
        description: successMessage,
      });

      await addDoc(collection(firestore, 'schools', schoolId, 'notifications'), {
        title: 'New Exam Scheduled',
        description: `A new ${examType} exam, "${examTitle}", has been scheduled for ${examClassId === 'all' ? 'all classes' : classes.find(c=>c.id === examClassId)?.name} on ${format(examDate, 'PPP')}.`,
        createdAt: serverTimestamp(),
        read: false,
        href: `/teacher/assignments?schoolId=${schoolId}`,
        category: 'Academics',
      });

      setExamTitle('');
      setExamClassId('');
      setExamSubject('');
      setExamDate(undefined);
      setExamDuration('');
      setExamType(undefined);
      setIsCreateDialogOpen(false);

    } catch (error) {
      console.error("Error creating exam(s): ", error);
      toast({ title: 'Error', description: 'Could not create the exam(s).', variant: 'destructive' });
    }
  };
  
  const handleGradeModeration = async (gradeId: string, studentId: string, studentName: string, subject: string, grade: string, decision: 'Approved' | 'Rejected', feedback?: string) => {
    if (!schoolId || !adminUser) return;
    const gradeRef = doc(firestore, `schools/${schoolId}/grades`, gradeId);
    try {
      await updateDoc(gradeRef, { status: decision, moderatorFeedback: feedback || null });
      
      const pendingGrade = pendingGrades.find(g => g.id === gradeId);
      if (decision === 'Rejected' && pendingGrade?.examId) {
        const examRef = doc(firestore, 'schools', schoolId, 'exams', pendingGrade.examId);
        await updateDoc(examRef, { status: 'Open' });
      }

      await logAuditEvent({
        schoolId,
        action: decision === 'Approved' ? 'GRADE_APPROVED' : 'GRADE_REJECTED',
        actionType: 'Academics',
        user: { id: adminUser.uid, name: adminUser.displayName || 'Admin', role: 'Admin' },
        details: `${decision} grade of ${grade} for ${studentName} in ${subject}. Feedback: ${feedback || 'N/A'}`,
      });
      
      toast({
        title: `Grade ${decision}`,
        description: `The grade has been successfully ${decision.toLowerCase()}.`,
      });

      if (decision === 'Rejected') {
        setGradeToReject(null);
      }
    } catch (e: any) {
      toast({ title: 'Error', description: e.message || 'Could not update grade status.', variant: 'destructive' });
    }
  };
  
  const handlePublishResults = async () => {
    if (!schoolId) return;

    try {
      await addDoc(collection(firestore, 'schools', schoolId, 'notifications'), {
        title: 'Exam Results Published!',
        description: `The results for ${selectedReportTerm} are now available on the portal.`,
        createdAt: serverTimestamp(),
        read: false,
        href: `/parent/grades?schoolId=${schoolId}`,
        audience: 'parents-and-students',
        category: 'Academics',
      });
      toast({
        title: 'Results Published!',
        description: 'Parents and students have been notified that results are available.',
      });
    } catch (e: any) {
      toast({ title: 'Failed to publish results.', variant: 'destructive' });
    }
  };
  
  const handlePrintResults = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      const tableHtml = document.getElementById('class-ranking-table')?.outerHTML;
      printWindow.document.write('<html><head><title>Class Ranking</title>');
      printWindow.document.write('<style>body { font-family: sans-serif; } table { width: 100%; border-collapse: collapse; } th, td { border: 1px solid #ddd; padding: 8px; } th { background-color: #f2f2f2; } </style>');
      printWindow.document.write(`<h2>Class Ranking - ${classes.find(c => c.id === reportClassFilter)?.name} - ${selectedReportTerm}</h2>`);
      if (tableHtml) {
        printWindow.document.write(tableHtml);
      }
      printWindow.document.write('</body></html>');
      printWindow.document.close();
      printWindow.print();
    }
  };

  const handleDownloadAllReportCards = () => {
    const doc = new jsPDF();
    
    const ranking = classRankings[reportClassFilter];
    if (!ranking) return;

    ranking.forEach((student, index) => {
      if (index > 0) {
        doc.addPage();
      }
      const studentData = studentGrades.find(s => s.admNo === student.admNo);
      
      doc.text(`${schoolInfo.name} Report Card`, 14, 22);
      doc.text(`Student: ${student.name}`, 14, 30);
      doc.text(`Admission No: ${student.admNo}`, 14, 36);

      (doc as any).autoTable({
        startY: 45,
        head: [['Subject', 'Score', 'Grade']],
        body: studentData ? Object.entries(studentData.scores).map(([subject, score]) => [
          subject,
          score,
          calculateGrade(score)
        ]) : [],
      });

      const finalY = (doc as any).lastAutoTable.finalY;
      doc.text(`Total Marks: ${student.total}`, 14, finalY + 10);
      doc.text(`Average: ${student.avg.toFixed(1)}%`, 14, finalY + 16);
      doc.text(`Mean Grade: ${student.grade}`, 14, finalY + 22);
      doc.text(`Class Rank: ${student.position} of ${ranking.length}`, 14, finalY + 28);
    });

    doc.save('all-report-cards.pdf');
    toast({
      title: "Bulk Download Started",
      description: "All report cards are being downloaded as a single PDF.",
    });
  };

  const handleBulkFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setBulkImportFile(event.target.files[0]);
      setIsFileProcessed(false);
    }
  };
  
  const handleRemoveBulkFile = () => {
    setBulkImportFile(null);
    setIsFileProcessed(false);
  };
  
  const handleProcessFile = () => {
    setIsProcessingFile(true);
    setTimeout(() => {
      setIsProcessingFile(false);
      setIsFileProcessed(true);
      toast({
        title: 'File Processed',
        description: 'Please map the columns from your file to the required fields.',
      });
    }, 1500);
  };

  const handleImportMarks = () => {
    setIsUploadDialogOpen(false);
    toast({
      title: 'Marks Imported',
      description: 'The marks have been successfully uploaded and are pending moderation.',
    });
    setTimeout(() => {
      setBulkImportFile(null);
      setIsFileProcessed(false);
    }, 300);
  };
  
  const handleDeleteExam = async () => {
    if (!examToDelete || !schoolId || !adminUser) return;
    const examIdsToDelete = examToDelete.isGrouped ? examToDelete.groupedIds! : [examToDelete.id];

    const batch = writeBatch(firestore);
    examIdsToDelete.forEach(id => {
      const examRef = doc(firestore, `schools/${schoolId}/exams`, id);
      batch.delete(examRef);
    });

    try {
      await batch.commit();

      await logAuditEvent({
        schoolId,
        action: 'EXAM_DELETED',
        actionType: 'Academics',
        user: { id: adminUser.uid, name: adminUser.displayName || 'Admin', role: 'Admin' },
        details: `Deleted exam: "${examToDelete.title}" for class ${examToDelete.class}. Deleted ${examIdsToDelete.length} subject entries.`,
      });
      
      toast({ title: 'Exam Deleted', description: 'The exam has been removed.', variant: 'destructive' });
      
      setExams(prevExams => prevExams.filter(e => !examIdsToDelete.includes(e.id)));
      setExamToDelete(null);
      
    } catch (error) {
      console.error("Error deleting exam:", error);
      toast({ title: 'Error', description: 'Could not delete exam.', variant: 'destructive' });
    }
  };

  const handleUpdateExam = async (id: string, updates: Partial<Exam>) => {
    if (!schoolId) return;
    try {
      const examRef = doc(firestore, 'schools', schoolId, 'exams', id);
      await updateDoc(examRef, updates);
      toast({ title: "Exam Updated", description: "The exam details have been successfully updated."});
    } catch (e: any) {
      console.error(e);
      toast({ title: 'Error', description: e.message || 'Could not update exam details.', variant: 'destructive' });
    }
  };
  
  if (selectedExamForSubmissions) {
    return <GradeEntryView exam={selectedExamForSubmissions} onBack={() => setSelectedExamForSubmissions(null)} schoolId={schoolId!} teacher={{id: adminUser!.uid, name: adminUser!.displayName || 'Admin'}} />;
  }

  if (!schoolId) {
    return <div className="p-8">Error: School ID is missing from URL.</div>
  }

  return (
    <GradeErrorBoundary>
      <TeacherGradesContent />
    </GradeErrorBoundary>
  );
}
const TeacherGradesContent = () => {
    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <h1 className="font-headline text-3xl font-bold">Grades & Exams</h1>
            <p className="text-muted-foreground">This feature is under development.</p>
        </div>
    );
};
```