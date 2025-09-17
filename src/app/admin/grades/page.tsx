
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
  Mail,
  Save,
  HelpCircle,
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
import { firestore, auth } from '@/lib/firebase';
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
import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, LabelList } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { logAuditEvent } from '@/lib/audit-log.service';
import { useAuth } from '@/context/auth-context';


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
}

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
            toast({ title: 'Authentication Error', variant: 'destructive'});
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
                user: { id: user.uid, name: user.displayName || 'Admin', avatarUrl: user.photoURL || '' },
                details: `Request from ${requestDetails.teacherName} for ${requestDetails.assessmentTitle} (${requestDetails.className}) was ${newStatus}.`,
            });
            toast({ title: `Request ${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)}`, description: `The teacher has been notified.`});
        } catch (e) {
            console.error(e);
            toast({ title: 'Action Failed', variant: 'destructive'});
        }
    };
    
    const getStatusBadge = (status: EditRequest['status']) => {
        switch(status) {
            case 'pending': return <Badge variant="secondary" className="bg-yellow-500 text-white hover:bg-yellow-600">Pending</Badge>;
            case 'approved': return <Badge variant="default" className="bg-green-600 hover:bg-green-700">Approved</Badge>;
            case 'denied': return <Badge variant="destructive">Denied</Badge>;
        }
    }

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
                                    <TableCell>{req.assessmentTitle}<br/><span className="text-xs text-muted-foreground">{req.className}</span></TableCell>
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
  const [editingExam, setEditingExam] = React.useState<Exam | null>(null);
  
  const [currentAssessments, setCurrentAssessments] = React.useState<Exam[]>([]);
  const [isGradebookLoading, setIsGradebookLoading] = React.useState(true);
  const [isSavingScale, setIsSavingScale] = React.useState(false);


  const currentYear = new Date().getFullYear();
  const academicTerms = Array.from({ length: 2 }, (_, i) => {
    const year = currentYear - 1 + i;
    return [`Term 1, ${year}`, `Term 2, ${year}`, `Term 3, ${year}`];
  }).flat();
  academicTerms.push(...[`Term 1, ${currentYear + 1}`, `Term 2, ${currentYear + 1}`, `Term 3, ${currentYear + 1}`]);

  // State for the create/edit exam dialog
  const [isExamDialogOpen, setIsExamDialogOpen] = React.useState(false);
  const [newExamTitle, setNewExamTitle] = React.useState('');
  const [newExamTerm, setNewExamTerm] = React.useState(academicTerms[4]);
  const [newExamClass, setNewExamClass] = React.useState<string>('');
  const [newExamNotes, setNewExamNotes] = React.useState('');
  const [isSavingExam, setIsSavingExam] = React.useState(false);

  React.useEffect(() => {
    if (editingExam) {
        setNewExamTitle(editingExam.title);
        setNewExamTerm(editingExam.term);
        setNewExamClass(editingExam.classId || '');
        setDate({ from: editingExam.startDate.toDate(), to: editingExam.endDate.toDate() });
        setNewExamNotes(editingExam.notes || '');
        setIsExamDialogOpen(true);
    } else {
        // Reset form when not in edit mode
        setNewExamTitle('');
        setNewExamTerm(academicTerms[4]);
        setNewExamClass('');
        setDate(undefined);
        setNewExamNotes('');
    }
}, [editingExam, academicTerms]);

  React.useEffect(() => {
    if (!schoolId) return;

    const unsubExams = onSnapshot(
      query(collection(firestore, `schools/${schoolId}/assessments`), where('status', '!=', 'Archived'), orderBy('status'), orderBy('startDate', 'desc')),
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

        const studentGradesMap = new Map<string, {name: string, avatarUrl: string, rollNumber: string, className: string, grades: {subject: string, grade: number}[]}>();
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
  
  const handleSaveScale = async () => {
    if (!schoolId || !user) {
        toast({ title: 'School ID missing', variant: 'destructive'});
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
            user: { id: user.uid, name: user.displayName || 'Admin', avatarUrl: user.photoURL || '' },
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
  }
  
  const handleCreateOrUpdateExam = async () => {
    if (!schoolId || !newExamTitle || !newExamClass || !date?.from || !user) {
      toast({ variant: 'destructive', title: 'Missing Information', description: 'Please fill out the title, class, and date range.' });
      return;
    }
    setIsSavingExam(true);
    
    const examData = {
        title: newExamTitle,
        term: newExamTerm,
        classId: newExamClass,
        className: classes.find(c => c.id === newExamClass)?.name || 'N/A',
        startDate: Timestamp.fromDate(date.from),
        endDate: Timestamp.fromDate(date.to || date.from),
        notes: newExamNotes,
        status: editingExam ? editingExam.status : 'Draft',
      };
      
    try {
      let action = 'Created';
      let description = `New Exam Scheduled: ${examData.title} for ${examData.className}`;

      if (editingExam) {
          const examRef = doc(firestore, `schools/${schoolId}/assessments`, editingExam.id);
          await updateDoc(examRef, examData);
          toast({ title: 'Exam Updated', description: 'The exam schedule has been updated.' });
          action = 'Updated';
          description = `Exam Details Updated: ${examData.title}`;
      } else {
          await addDoc(collection(firestore, `schools/${schoolId}/assessments`), examData);
          toast({ title: 'Exam Created', description: 'The new exam has been scheduled.' });
      }

      await logAuditEvent({
        schoolId,
        actionType: 'Academics',
        description,
        user: { id: user.uid, name: user.displayName || 'Admin', avatarUrl: user.photoURL || '' },
        details: `Term: ${examData.term}, Dates: ${format(date.from, 'PPP')} - ${format(date.to || date.from, 'PPP')}`,
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
  
  const handleUpdateExamStatus = async (exam: Exam, newStatus: Exam['status']) => {
    if (!schoolId || !user) return;
    try {
        const examRef = doc(firestore, `schools/${schoolId}/assessments`, exam.id);
        await updateDoc(examRef, { status: newStatus });

        await logAuditEvent({
            schoolId,
            actionType: 'Academics',
            description: `Exam Status Changed to ${newStatus}`,
            user: { id: user.uid, name: user.displayName || 'Admin', avatarUrl: user.photoURL || '' },
            details: `Exam: ${exam.title} (${exam.className})`,
        });

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
    // This is mock data. In a real app, you would fetch and compute this.
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
              if (!open) setEditingExam(null); // Reset editing state on close
          }}>
            <DialogTrigger asChild>
              <Button>
                  <PlusCircle className="mr-2 h-4 w-4"/>
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
                        <Calendar initialFocus mode="single" selected={date?.from} onSelect={(day) => setDate({ from: day, to: day })} />
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
                    {isSavingExam && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                    {editingExam ? 'Save Changes' : 'Create Exam'}
                  </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4 md:w-auto md:inline-flex mb-6">
            <TabsTrigger value="exams">Exam Dashboard</TabsTrigger>
            <TabsTrigger value="requests">Edit Requests</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>
          
          <TabsContent value="reports">
            <ReportGenerator />
          </TabsContent>
          
          <TabsContent value="requests">
             <EditRequestsTab schoolId={schoolId!} />
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
                        <Input type="search" placeholder="Search by title, term, or class..." className="w-full bg-background pl-8" value={examSearchTerm} onChange={(e) => setExamSearchTerm(e.target.value)} />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="w-full overflow-auto rounded-lg border">
                        <Table>
                            <TableHeader><TableRow><TableHead>Exam Title</TableHead><TableHead>Term</TableHead><TableHead>Class</TableHead><TableHead>Date</TableHead><TableHead>Status</TableHead><TableHead>Progress</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                            <TableBody>
                            {filteredExams.map(exam => (
                                <TableRow key={exam.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelectedExam(exam)}>
                                    <TableCell className="font-medium">{exam.title}</TableCell>
                                    <TableCell>{exam.term}</TableCell>
                                    <TableCell>{exam.className}</TableCell>
                                    <TableCell>{format(exam.startDate.toDate(), 'dd MMM')} - {format(exam.endDate.toDate(), 'dd MMM, yyyy')}</TableCell>
                                    <TableCell><Badge variant="outline" className={cn("text-white", getStatusBadgeColor(exam.status))}>{exam.status}</Badge></TableCell>
                                     <TableCell><div className="flex items-center gap-2"><Progress value={exam.progress} className="w-24" /><span className="text-xs text-muted-foreground">{exam.progress}%</span></div></TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => e.stopPropagation()}><ChevronDown className="h-4 w-4"/></Button></DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                {renderExamActions(exam)}
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setEditingExam(exam); }}><Edit className="mr-2 h-4 w-4"/> Edit Details</DropdownMenuItem>
                                                <DropdownMenuItem disabled><Copy className="mr-2 h-4 w-4"/> Clone Exam</DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem className="text-destructive" onClick={(e) => { e.stopPropagation(); handleArchiveExam(exam); }}><Archive className="mr-2 h-4 w-4"/> Archive</DropdownMenuItem>
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
          <TabsContent value="settings">
            <Card>
                <CardHeader>
                    <CardTitle>Grading Scale & Policies</CardTitle>
                    <CardDescription>Define the grade boundaries for the entire school.</CardDescription>
                </CardHeader>
                <CardContent>
                     <div className="w-full max-w-lg space-y-4">
                        {gradingScale.map((scale, index) => (
                            <div key={index} className="grid grid-cols-3 items-center gap-4">
                                <Input value={scale.grade} readOnly className="font-semibold bg-muted" />
                                <div className="flex items-center gap-2">
                                    <Label htmlFor={`min-${index}`} className="shrink-0">Min</Label>
                                    <Input id={`min-${index}`} type="number" value={scale.min} onChange={(e) => handleGradingScaleChange(index, 'min', Number(e.target.value))} />
                                </div>
                                <div className="flex items-center gap-2">
                                    <Label htmlFor={`max-${index}`} className="shrink-0">Max</Label>
                                    <Input id={`max-${index}`} type="number" value={scale.max} onChange={(e) => handleGradingScaleChange(index, 'max', Number(e.target.value))} />
                                </div>
                            </div>
                        ))}
                        <Button variant="outline" size="sm" onClick={addGradingRow} className="mt-4">
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Add Row
                        </Button>
                    </div>
                </CardContent>
                <CardFooter>
                    <Button onClick={handleSaveScale} disabled={isSavingScale}>
                        {isSavingScale ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4"/>}
                        Save Scale
                    </Button>
                </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
    </div>
  );
}
