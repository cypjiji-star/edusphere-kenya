
'use client';

import * as React from 'react';
import { format } from 'date-fns';
import { DateRange } from 'react-day-picker';
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
  Trophy,
  Loader2,
  Printer,
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
  Mail,
  Save,
  HelpCircle,
  CalendarIcon
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
  doc,
  getDoc,
  updateDoc,
  setDoc,
  writeBatch,
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { GradeSummaryWidget } from './grade-summary-widget';
import { logAuditEvent } from '@/lib/audit-log.service';
import { useAuth } from '@/context/auth-context';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';


type GradeStatus = 'Graded' | 'Pending';

export type Exam = {
  id: string;
  title: string;
  term: string;
  class: string;
  startDate: Timestamp;
  endDate: Timestamp;
  status: 'Draft' | 'Active' | 'Locked' | 'Published' | 'Archived';
  classId?: string;
  progress: number;
  className?: string;
  notes?: string;
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
  className?: string;
};

type GradingScaleItem = {
  grade: string;
  min: number;
  max: number;
  isDefault?: boolean;
};

type SubjectPerformance = {
  name: string;
  meanScore: number;
  highestScore: number;
  lowestScore: number;
  numAs: number;
  numEs: number;
};

type EditRequest = {
  id: string;
  teacherName: string;
  assessmentTitle: string;
  className: string;
  reason: string;
  status: 'pending' | 'approved' | 'denied';
  requestedAt: Timestamp;
  assessmentId: string;
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

const initialGradingScale: GradingScaleItem[] = [
  { grade: 'A', min: 80, max: 100, isDefault: true },
  { grade: 'A-', min: 75, max: 79, isDefault: true },
  { grade: 'B+', min: 70, max: 74, isDefault: true },
  { grade: 'B', min: 65, max: 69, isDefault: true },
  { grade: 'B-', min: 60, max: 64, isDefault: true },
  { grade: 'C+', min: 55, max: 59, isDefault: true },
  { grade: 'C', min: 50, max: 54, isDefault: true },
  { grade: 'C-', min: 45, max: 49, isDefault: true },
  { grade: 'D+', min: 40, max: 44, isDefault: true },
  { grade: 'D', min: 35, max: 39, isDefault: true },
  { grade: 'D-', min: 30, max: 34, isDefault: true },
  { grade: 'E', min: 0, max: 29, isDefault: true },
];

function EditRequestsTab({ schoolId }: { schoolId: string }) {
  const [requests, setRequests] = React.useState<EditRequest[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  React.useEffect(() => {
    const q = query(collection(firestore, `schools/${schoolId}/grade-edit-requests`), orderBy('requestedAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setRequests(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as EditRequest)));
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, [schoolId]);

  const handleRequestUpdate = async (requestId: string, assessmentId: string, newStatus: 'approved' | 'denied', requestDetails: EditRequest) => {
    if (!user) {
      toast({ title: 'Authentication Error', variant: 'destructive' });
      return;
    }

    const batch = writeBatch(firestore);

    const requestRef = doc(firestore, `schools/${schoolId}/grade-edit-requests`, requestId);
    batch.update(requestRef, { status: newStatus });

    if (newStatus === 'approved') {
      const assessmentRef = doc(firestore, `schools/${schoolId}/assessments`, assessmentId);
      batch.update(assessmentRef, { status: 'Active' });
    }

    try {
      await batch.commit();
      await logAuditEvent({
        schoolId,
        actionType: 'Academics',
        description: `Grade Edit Request ${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)}`,
        user: { id: user.uid, name: user.displayName || 'Admin', role: 'Admin' },
        details: `Request from ${requestDetails.teacherName} for ${requestDetails.assessmentTitle} (${requestDetails.className}) was ${newStatus}.`,
      });
      toast({ title: `Request ${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)}`, description: `The teacher has been notified.` });
    } catch (e) {
      console.error(e);
      toast({ title: 'Action Failed', variant: 'destructive' });
    }
  };

  const getStatusBadge = (status: EditRequest['status']) => {
    switch (status) {
      case 'pending': return <Badge variant="secondary" className="bg-yellow-500 text-white hover:bg-yellow-600">Pending</Badge>;
      case 'approved': return <Badge variant="default" className="bg-green-600 hover:bg-green-700">Approved</Badge>;
      case 'denied': return <Badge variant="destructive">Denied</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Grade Edit Requests</CardTitle>
        <CardDescription>Review and approve or deny requests from teachers to edit submitted grades.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="w-full overflow-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Teacher</TableHead>
                <TableHead>Assessment</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.length > 0 ? requests.map(req => (
                <TableRow key={req.id}>
                  <TableCell className="font-medium">{req.teacherName}</TableCell>
                  <TableCell>{req.assessmentTitle}<br /><span className="text-xs text-muted-foreground">{req.className}</span></TableCell>
                  <TableCell className="text-muted-foreground italic max-w-sm">"{req.reason}"</TableCell>
                  <TableCell>{getStatusBadge(req.status)}</TableCell>
                  <TableCell className="text-right">
                    {req.status === 'pending' && (
                      <div className="flex gap-2 justify-end">
                        <Button size="sm" variant="destructive" onClick={() => handleRequestUpdate(req.id, req.assessmentId, 'denied', req)}>Deny</Button>
                        <Button size="sm" onClick={() => handleRequestUpdate(req.id, req.assessmentId, 'approved', req)}>Approve</Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">No pending edit requests.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdminGradesPage() {
  const searchParams = useSearchParams();
  const schoolId = searchParams.get('schoolId');
  const { user } = useAuth();
  
  const [gradingScale, setGradingScale] = React.useState<GradingScaleItem[]>(initialGradingScale);
  const { toast } = useToast();
  const [classes, setClasses] = React.useState<{ id: string, name: string }[]>([]);
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
  const [editingExam, setEditingExam] = React.useState<Exam | null>(null);
  const [currentAssessments, setCurrentAssessments] = React.useState<Exam[]>([]);
  const [isGradebookLoading, setIsGradebookLoading] = React.useState(true);
  const [isSavingScale, setIsSavingScale] = React.useState(false);
  
  const [isExamDialogOpen, setIsExamDialogOpen] = React.useState(false);
  
  const currentYear = new Date().getFullYear();
  const academicTerms = Array.from({ length: 2 }, (_, i) => {
    const year = currentYear - 1 + i;
    return [`Term 1, ${year}`, `Term 2, ${year}`, `Term 3, ${year}`];
  }).flat();
  academicTerms.push(...[`Term 1, ${currentYear + 1}`, `Term 2, ${currentYear + 1}`, `Term 3, ${currentYear + 1}`]);

  const [newExamTitle, setNewExamTitle] = React.useState('');
  const [newExamTerm, setNewExamTerm] = React.useState(academicTerms[4]);
  const [newExamClass, setNewExamClass] = React.useState<string>('');
  const [newExamNotes, setNewExamNotes] = React.useState('');
  const [isSavingExam, setIsSavingExam] = React.useState(false);
  const [date, setDate] = React.useState<DateRange | undefined>({
    from: undefined,
    to: undefined,
  });

  const handleTermChange = React.useCallback((value: string) => {
    setNewExamTerm(value);
  }, []);

  const handleClassChange = React.useCallback((value: string) => {
    setNewExamClass(value);
  }, []);

  React.useEffect(() => {
    if (editingExam && editingExam.startDate && editingExam.endDate) {
      setNewExamTitle(editingExam.title);
      setNewExamTerm(editingExam.term);
      setNewExamClass(editingExam.classId || '');
      setDate({
        from: editingExam.startDate.toDate(),
        to: editingExam.endDate.toDate(),
      });
      setNewExamNotes(editingExam.notes || '');
      setIsExamDialogOpen(true);
    } else if (!isExamDialogOpen && !editingExam) {
      setNewExamTitle('');
      setNewExamTerm(academicTerms[4]);
      setNewExamClass('');
      setDate({ from: undefined, to: undefined });
      setNewExamNotes('');
    }
  }, [editingExam, isExamDialogOpen, academicTerms]);

  React.useEffect(() => {
    if (!schoolId) return;

    const unsubExams = onSnapshot(
      query(collection(firestore, `schools/${schoolId}/assessments`), where('status', '!=', 'Archived'), orderBy('status'), orderBy('startDate', 'desc')),
      async (snapshot) => {
        const examsWithProgress: Exam[] = await Promise.all(snapshot.docs.map(async (examDoc) => {
          const exam = { id: examDoc.id, ...examDoc.data() } as Exam;

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
        name: `${doc.data().name || doc.data().className || ''} ${doc.data().stream || ''}`.trim(),
      }));
      setClasses(classList);
      if (classList.length > 0 && !selectedClassForRanking) {
        setSelectedClassForRanking(classList[0].id);
      }
    });

    const unsubGradingScale = onSnapshot(doc(firestore, `schools/${schoolId}/settings`, 'grading'), (docSnap) => {
      if (docSnap.exists() && docSnap.data().scale) {
        setGradingScale(docSnap.data().scale);
      }
    });

    return () => {
      unsubExams();
      unsubClasses();
      unsubGradingScale();
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

  const handleGradingScaleChange = (index: number, field: 'min' | 'max' | 'grade', value: string) => {
    const newScale = [...gradingScale];
    if (field === 'min' || field === 'max') {
      newScale[index] = { ...newScale[index], [field]: parseInt(value, 10) || 0 };
    } else {
      newScale[index] = { ...newScale[index], [field]: value };
    }
    setGradingScale(newScale);
  };
  

  const addGradingRow = () => {
    setGradingScale([...gradingScale, { grade: 'New', min: 0, max: 0, isDefault: false }]);
  };

  const handleSaveScale = async () => {
    if (!schoolId || !user) {
      toast({ title: 'School ID missing', variant: 'destructive' });
      return;
    }
    setIsSavingScale(true);
    try {
      const settingsRef = doc(firestore, `schools/${schoolId}/settings`, 'grading');
      await setDoc(settingsRef, { scale: gradingScale }, { merge: true });

      await logAuditEvent({
        schoolId,
        actionType: 'Settings',
        description: 'Grading Scale Updated',
        user: { id: user.uid, name: user.displayName || 'Admin', role: 'Admin' },
        details: 'The school-wide grading scale was modified.',
      });

      toast({
        title: 'Grading Scale Saved',
        description: 'The new grading scale has been applied school-wide.',
      });
    } catch (e) {
      toast({
        title: 'Save Failed',
        description: 'Could not save the new grading scale.',
        variant: 'destructive',
      });
      console.error(e);
    } finally {
      setIsSavingScale(false);
    }
  };

  const handleCreateOrUpdateExam = async () => {
    if (!schoolId || !newExamTitle || !newExamClass || !date?.from || !user) {
      toast({ variant: 'destructive', title: 'Missing Information', description: 'Please fill out the title, class, and date range.' });
      return;
    }
    setIsSavingExam(true);

    const endDate = date.to || date.from;

    const examData = {
      title: newExamTitle,
      term: newExamTerm,
      classId: newExamClass,
      className: classes.find(c => c.id === newExamClass)?.name || 'N/A',
      startDate: Timestamp.fromDate(date.from),
      endDate: Timestamp.fromDate(endDate),
      notes: newExamNotes,
      status: editingExam ? editingExam.status : 'Draft',
    };

    try {
      let description = `New Exam Scheduled: ${examData.title} for ${examData.className}`;

      if (editingExam) {
        const examRef = doc(firestore, `schools/${schoolId}/assessments`, editingExam.id);
        await updateDoc(examRef, examData);
        toast({ title: 'Exam Updated', description: 'The exam schedule has been updated.' });
        description = `Exam Details Updated: ${examData.title}`;
      } else {
        await addDoc(collection(firestore, `schools/${schoolId}/assessments`), examData);
        toast({ title: 'Exam Created', description: 'The new exam has been scheduled.' });
      }

      await logAuditEvent({
        schoolId,
        actionType: 'Academics',
        description,
        user: { id: user.uid, name: user.displayName || 'Admin', role: 'Admin' },
        details: `Term: ${examData.term}, Dates: ${format(date.from, 'LLL dd, y')} - ${format(endDate, 'LLL dd, y')}`,
      });

      setEditingExam(null);
      setIsExamDialogOpen(false);
    } catch (e) {
      console.error(e);
      toast({ variant: 'destructive', title: 'Failed to save exam.' });
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
  };

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
    switch (status) {
      case 'Draft': return 'bg-gray-500';
      case 'Active': return 'bg-blue-500';
      case 'Locked': return 'bg-yellow-500';
      case 'Published': return 'bg-green-600';
      default: return 'bg-gray-500';
    }
  };

  const handleUpdateExamStatus = async (exam: Exam, newStatus: Exam['status']) => {
    if (!schoolId || !user) return;
    try {
      const examRef = doc(firestore, `schools/${schoolId}/assessments`, exam.id);
      await updateDoc(examRef, { status: newStatus });

      await logAuditEvent({
        schoolId,
        actionType: 'Academics',
        description: `Exam Status Changed to ${newStatus}`,
        user: { id: user.uid, name: user.displayName || 'Admin', role: 'Admin' },
        details: `Exam: ${exam.title} (${exam.className})`,
      });

      toast({
        title: `Exam Status Updated`,
        description: `The exam is now ${newStatus}.`,
      });
    } catch (e) {
      console.error(e);
      toast({
        title: 'Error',
        description: 'Could not update the exam status.',
        variant: 'destructive',
      });
    }
  };

  const handleArchiveExam = (exam: Exam) => {
    if (window.confirm(`Are you sure you want to archive the exam "${exam.title}"?`)) {
      handleUpdateExamStatus(exam, 'Archived');
    }
  };

  const renderExamActions = (exam: Exam) => {
    switch (exam.status) {
      case 'Draft':
        return <DropdownMenuItem onClick={() => handleUpdateExamStatus(exam, 'Active')}><Unlock className="mr-2 h-4 w-4" /> Activate Grading</DropdownMenuItem>;
      case 'Active':
        return <DropdownMenuItem onClick={() => handleUpdateExamStatus(exam, 'Locked')}><Lock className="mr-2 h-4 w-4" /> Lock Grading</DropdownMenuItem>;
      case 'Locked':
        return <DropdownMenuItem onClick={() => handleUpdateExamStatus(exam, 'Published')}><Send className="mr-2 h-4 w-4" /> Publish Results</DropdownMenuItem>;
      case 'Published':
        return <DropdownMenuItem disabled><CheckCircle className="mr-2 h-4 w-4" /> Published</DropdownMenuItem>;
      default:
        return null;
    }
  };

  const topStudents = studentsForRanking.slice(0, 3);

  const classAverage = React.useMemo(() => {
    if (studentsForRanking.length === 0) return 0;
    const total = studentsForRanking.reduce((acc, student) => acc + student.overall, 0);
    return Math.round(total / studentsForRanking.length);
  }, [studentsForRanking]);

  const subjectPerformance: SubjectPerformance[] = React.useMemo(() => {
    const subjectData: Record<string, { scores: number[] }> = {};

    studentsForRanking.forEach(student => {
      student.grades?.forEach(grade => {
        if (grade.subject) {
          if (!subjectData[grade.subject]) {
            subjectData[grade.subject] = { scores: [] };
          }
          const score = Number(grade.grade);
          if (!isNaN(score)) {
            subjectData[grade.subject].scores.push(score);
          }
        }
      });
    });

    return Object.entries(subjectData).map(([name, data]) => {
      const scores = data.scores;
      if (scores.length === 0) {
        return { name, meanScore: 0, highestScore: 0, lowestScore: 0, numAs: 0, numEs: 0 };
      }
      const meanScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
      const highestScore = Math.max(...scores);
      const lowestScore = Math.min(...scores);
      const numAs = scores.filter(s => s >= 80).length;
      const numEs = scores.filter(s => s < 30).length;
      return { name, meanScore, highestScore, lowestScore, numAs, numEs };
    });
  }, [studentsForRanking]);

  const streamComparisonData = React.useMemo(() => {
    return [
      { name: 'Form 3 North', avg: 72 },
      { name: 'Form 3 South', avg: 68 },
      { name: 'Form 3 East', avg: 75 },
      { name: 'Form 3 West', avg: 65 },
    ];
  }, [selectedClassForRanking]);

  const streamComparisonConfig = {
    avg: {
      label: 'Average Score',
      color: 'hsl(var(--primary))',
    },
  };

  const handleShare = () => {
    toast({
      title: "Sharing Report",
      description: "An email with the performance overview has been sent to the Principal.",
    });
  };

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
        <Dialog open={isExamDialogOpen} onOpenChange={(open) => {
          setIsExamDialogOpen(open);
          if (!open) setEditingExam(null);
        }}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Create Exam
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-xl">
            <DialogHeader>
              <DialogTitle>{editingExam ? 'Edit Exam Details' : 'Create New Exam'}</DialogTitle>
              <DialogDescription>{editingExam ? 'Update the details for this exam.' : 'Define a new examination schedule for a term.'}</DialogDescription>
            </DialogHeader>
            <div className="grid gap-6 py-4">
              <div className="space-y-2">
                <Label htmlFor="exam-title">Exam Title</Label>
                <Input id="exam-title" placeholder="e.g., Term 2 Mid-Term Exams" value={newExamTitle} onChange={(e) => setNewExamTitle(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="exam-term">Academic Term</Label>
                  <Select value={newExamTerm} onValueChange={handleTermChange}>
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
                  <Select value={newExamClass} onValueChange={handleClassChange}>
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
                      id="date"
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
              <div className="space-y-2">
                <Label htmlFor="exam-notes">Notes (Optional)</Label>
                <Textarea id="exam-notes" placeholder="Add any relevant instructions or notes for teachers." value={newExamNotes} onChange={e => setNewExamNotes(e.target.value)} />
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
              <Button onClick={handleCreateOrUpdateExam} disabled={isSavingExam}>
                {isSavingExam && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingExam ? 'Save Changes' : 'Create Exam'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="exams">Exams</TabsTrigger>
          <TabsTrigger value="ranking">Class Ranking</TabsTrigger>
          <TabsTrigger value="gradebook">Gradebook</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="exams" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Exam Management</CardTitle>
              <CardDescription>Create and manage examination schedules for different terms and classes.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search exams..."
                    className="pl-8"
                    value={examSearchTerm}
                    onChange={(e) => setExamSearchTerm(e.target.value)}
                  />
                </div>
                <Select value={selectedClassForRanking} onValueChange={setSelectedClassForRanking}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by class" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Exam Title</TableHead>
                      <TableHead>Term</TableHead>
                      <TableHead>Class</TableHead>
                      <TableHead>Date Range</TableHead>
                      <TableHead>Progress</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredExams.map((exam) => (
                      <TableRow key={exam.id}>
                        <TableCell className="font-medium">{exam.title}</TableCell>
                        <TableCell>{exam.term}</TableCell>
                        <TableCell>{exam.className}</TableCell>
                        <TableCell>
                          {exam.startDate.toDate().toLocaleDateString()} - {exam.endDate.toDate().toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress value={exam.progress} className="w-16" />
                            <span className="text-sm">{exam.progress}%</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusBadgeColor(exam.status)}>
                            {exam.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <Settings className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setEditingExam(exam)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              {renderExamActions(exam)}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleArchiveExam(exam)}>
                                <Archive className="mr-2 h-4 w-4" />
                                Archive
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredExams.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="h-24 text-center">
                          No exams found.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ranking" className="mt-4">
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
                  <Button onClick={() => handleExportRanking('CSV')}>
                    <FileDown className="mr-2 h-4 w-4" />
                    Export CSV
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
                          <TableHead className="text-right">Actions</TableHead>
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
                            <TableCell className="text-right">
                              <Button variant="ghost" size="sm" onClick={() => setSelectedStudentForDetails(student)}>
                                <BarChart2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                        {studentsForRanking.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={6} className="h-24 text-center">
                              No students found for this class.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                  {selectedStudentForDetails && (
                    <Card className="mt-6">
                      <CardHeader>
                        <CardTitle>Student Performance Details</CardTitle>
                        <CardDescription>Detailed grades for {selectedStudentForDetails.studentName}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <GradeAnalysisCharts
                          exam={null}
                          onBack={() => setSelectedStudentForDetails(null)}
                        />
                      </CardContent>
                      <CardFooter>
                        <Button variant="outline" onClick={() => setSelectedStudentForDetails(null)}>Close</Button>
                      </CardFooter>
                    </Card>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="gradebook" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Gradebook</CardTitle>
              <CardDescription>View and manage student grades for selected class assessments.</CardDescription>
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
              </div>
              {isGradebookLoading ? (
                <div className="flex justify-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : (
                <div className="rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student</TableHead>
                        {currentAssessments.map(assessment => (
                          <TableHead key={assessment.id}>{assessment.title}</TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {studentsForRanking.map(student => (
                        <TableRow key={student.id}>
                          <TableCell className="font-medium">{student.studentName}</TableCell>
                          {currentAssessments.map(assessment => (
                            <TableCell key={assessment.id}>{getGradeForStudent(student, assessment.id)}</TableCell>
                          ))}
                        </TableRow>
                      ))}
                      {studentsForRanking.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={currentAssessments.length + 1} className="h-24 text-center">
                            No students or assessments found.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Grading Settings</CardTitle>
              <CardDescription>Configure the grading scale and other academic settings.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Grade</TableHead>
                        <TableHead>Min Score</TableHead>
                        <TableHead>Max Score</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {gradingScale.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <Input
                              value={item.grade}
                              onChange={(e) => handleGradingScaleChange(index, 'grade', e.target.value)}
                              disabled={item.isDefault}
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              value={item.min}
                              onChange={(e) => handleGradingScaleChange(index, 'min', e.target.value)}
                              disabled={item.isDefault}
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              value={item.max}
                              onChange={(e) => handleGradingScaleChange(index, 'max', e.target.value)}
                              disabled={item.isDefault}
                            />
                          </TableCell>
                          <TableCell>
                            <Button variant="ghost" size="icon" disabled={item.isDefault}>
                              <Trash2 className="h-4 w-4 text-destructive"/>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <Button onClick={addGradingRow}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add Grade
                </Button>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSaveScale} disabled={isSavingScale}>
                {isSavingScale ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Save Scale
              </Button>
            </CardFooter>
          </Card>
          <div className="mt-4">
            <EditRequestsTab schoolId={schoolId || ''} />
          </div>
        </TabsContent>
      </Tabs>

      <ReportGenerator />
    </div>
  );
}
