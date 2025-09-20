
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
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
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
    duration: number; // in minutes
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
    logoUrl: "https://i.postimg.cc/0r1RGZvk/android-launchericon-512-512.png",
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
        doc.text(`Class: Form 4`, 14, 62); // Placeholder class

        (doc as any).autoTable({
            startY: 70,
            head: [['Subject', 'Score', 'Grade', 'Comment']],
            body: studentData ? Object.entries(studentData.scores).map(([subject, score]) => [
                subject,
                score,
                calculateGrade(score),
                'Good progress.' // Placeholder comment
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
    )
}

const getCurrentTerm = (): string => {
  const today = new Date();
  const month = today.getMonth(); // 0-11
  const year = today.getFullYear();

  if (month >= 0 && month <= 3) { // Jan - Apr
    return `term1-${year}`;
  } else if (month >= 4 && month <= 7) { // May - Aug
    return `term2-${year}`;
  } else { // Sep - Dec
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
    const gradeInputRefs = React.useRef<(HTMLInputElement | null)[]>([]);

    React.useEffect(() => {
        setIsLoading(true);
        let studentUnsub: () => void = () => {};
        let gradesUnsub: () => void = () => {};

        // 1. Fetch students for the class just once
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

            // 2. After students are loaded, set up a real-time listener for grades
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
            // The onSnapshot listener will handle the UI update automatically
        } catch (e) {
            console.error(e);
            toast({ title: 'Error', description: 'Failed to save grade.', variant: 'destructive'});
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
        } catch(e) {
            toast({ title: 'Error', description: 'Failed to submit grades.', variant: 'destructive'});
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
    
    const filteredStudents = students.filter(s => s.studentName.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const gradedCount = students.filter(s => s.score !== '' && !s.error).length;
    const totalStudents = students.length;
    const progress = totalStudents > 0 ? (gradedCount / totalStudents) * 100 : 0;
    const isLocked = exam.status === 'Closed' || exam.status === 'Grading Complete';
    
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
                        {isLoading ? (
                            <TableRow><TableCell colSpan={4} className="h-24 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto"/></TableCell></TableRow>
                        ) : filteredStudents.map((student, index) => (
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
                                            ref={el => gradeInputRefs.current[index] = el}
                                            type="number"
                                            placeholder="Enter score"
                                            value={student.score}
                                            onChange={(e) => handleScoreChange(student.studentId, e.target.value)}
                                            onBlur={(e) => handleSaveGrade(student.studentId, e.target.value, index)}
                                            onKeyDown={(e) => handleKeyDown(e, index)}
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
                        ))}
                        </TableBody>
                    </Table>
                 </div>
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:hidden">
                    {isLoading ? (
                         <div className="col-span-full h-24 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto"/></div>
                    ) : filteredStudents.map((student, index) => (
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
                 </div>
            </CardContent>
        </Card>
    )
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

export default function TeacherGradesPage() {
    const searchParams = useSearchParams();
    const schoolId = searchParams.get('schoolId');
    const { toast } = useToast();
    const { user } = useAuth();
    
    const [exams, setExams] = React.useState<Exam[]>([]);
    const [selectedExamForGrading, setSelectedExamForGrading] = React.useState<Exam | null>(null);
    const [activeTab, setActiveTab] = React.useState('exam-management');
    const [classes, setClasses] = React.useState<{id: string, name: string}[]>([]);
    const [subjects, setSubjects] = React.useState<string[]>([]);
    
    React.useEffect(() => {
        if (!schoolId || !user) return;

        const teacherId = user.uid;
        const teacherDisplayName = user.displayName || '';

        const classesQuery = query(collection(firestore, `schools/${schoolId}/classes`), where('teacherId', '==', teacherId));
        const unsubscribeClasses = onSnapshot(classesQuery, snapshot => {
            const classData = snapshot.docs.map(doc => ({id: doc.id, name: `${doc.data().name} ${doc.data().stream || ''}`.trim()}));
            setClasses(classData);
        });

        const subjectsQuery = query(collection(firestore, `schools/${schoolId}/subjects`), where('teachers', 'array-contains', teacherDisplayName));
        const unsubscribeSubjects = onSnapshot(subjectsQuery, snapshot => {
            setSubjects(snapshot.docs.map(doc => doc.data().name));
        });

        return () => {
            unsubscribeClasses();
            unsubscribeSubjects();
        };
    }, [schoolId, user]);

    React.useEffect(() => {
        if (classes.length === 0 || subjects.length === 0 || !schoolId) {
            setExams([]);
            return;
        }

        const classIds = classes.map(c => c.id);
        
        const examsQuery = query(
            collection(firestore, `schools/${schoolId}/exams`), 
            where('classId', 'in', classIds),
            where('subject', 'in', subjects)
        );
        const unsubscribeExams = onSnapshot(examsQuery, (examSnapshot) => {
            const fetchedExams = examSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Exam));
            setExams(fetchedExams);
        });
        
        return () => unsubscribeExams();

    }, [classes, subjects, schoolId]);
    
    if (selectedExamForGrading) {
        return <GradeEntryView exam={selectedExamForGrading} onBack={() => setSelectedExamForGrading(null)} schoolId={schoolId!} teacher={{id: user!.uid, name: user!.displayName || 'Teacher'}} />;
    }


    if (!schoolId) {
        return <div className="p-8">Error: School ID is missing from URL.</div>
    }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
       <div className="mb-6">
        <h1 className="font-headline text-3xl font-bold flex items-center gap-2"><FileText className="h-8 w-8 text-primary"/>Grades &amp; Exams</h1>
        <p className="text-muted-foreground">Manage exams and grades for your classes.</p>
       </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="exam-management">My Exams</TabsTrigger>
                <TabsTrigger value="reports" disabled>Reports &amp; Analytics</TabsTrigger>
            </TabsList>
            <TabsContent value="exam-management" className="mt-4">
                <Card>
                    <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between">
                        <div>
                            <CardTitle>My Scheduled Exams</CardTitle>
                            <CardDescription>A list of all exams you are assigned to invigilate or grade.</CardDescription>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="w-full overflow-auto rounded-lg border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Exam Title</TableHead>
                                        <TableHead>Class</TableHead>
                                        <TableHead>Subject</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {exams.map(exam => (
                                        <TableRow key={exam.id}>
                                            <TableCell className="font-medium">{exam.title}</TableCell>
                                            <TableCell>{exam.class}</TableCell>
                                            <TableCell>{exam.subject}</TableCell>
                                            <TableCell>{format(exam.date.toDate(), 'PPP')}</TableCell>
                                            <TableCell>{getStatusBadge(exam.status)}</TableCell>
                                            <TableCell className="text-right space-x-2">
                                                 <Button variant="outline" size="sm" onClick={() => setSelectedExamForGrading(exam)}>Enter Grades</Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>
             <TabsContent value="reports" className="mt-4 space-y-6">
                <Card>
                   <CardContent className="pt-6 text-center text-muted-foreground">
                        <p>Analytics coming soon.</p>
                   </CardContent>
                </Card>
             </TabsContent>
        </Tabs>
    </div>
  );
}
