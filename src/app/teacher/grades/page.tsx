
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
  AlertDialogTrigger,
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
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { firestore, auth } from '@/lib/firebase';
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
    gradeStatus: 'Unmarked' | 'Pending Approval' | 'Approved';
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
};

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

const getStatusBadge = (status: Exam['status']) => {
    switch (status) {
        case 'Open': return <Badge variant="secondary" className="bg-blue-500 text-white hover:bg-blue-600">Open</Badge>;
        case 'Pending Approval': return <Badge variant="secondary" className="bg-yellow-500 text-white hover:bg-yellow-600">Pending Approval</Badge>;
        case 'Closed': return <Badge variant="outline">Closed</Badge>;
        case 'Grading Complete': return <Badge variant="default" className="bg-green-600 hover:bg-green-700">Grading Complete</Badge>;
        default: return <Badge variant="outline">{status}</Badge>;
    }
}


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
                score >= 80 ? 'A' : score >= 65 ? 'B' : 'C',
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
                                    <TableCell>{score >= 80 ? 'A' : score >= 65 ? 'B' : 'C'}</TableCell>
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
        const studentsQuery = query(collection(firestore, 'schools', schoolId, 'students'), where('classId', '==', exam.classId));
        const gradesQuery = query(collection(firestore, 'schools', schoolId, 'grades'), where('examId', '==', exam.id));

        Promise.all([getDocs(studentsQuery), getDocs(gradesQuery)]).then(([studentsSnap, gradesSnap]) => {
            const gradesMap = new Map(gradesSnap.docs.map(doc => [doc.data().studentId, { submissionId: doc.id, score: doc.data().grade, status: doc.data().status || 'Approved' }]));
            
            const studentData = studentsSnap.docs.map(doc => {
                const data = doc.data();
                const existingGrade = gradesMap.get(doc.id);
                const score = existingGrade?.score || '';
                return {
                    studentId: doc.id,
                    studentName: data.name,
                    avatarUrl: data.avatarUrl || '',
                    admNo: data.admissionNumber || '',
                    score: score,
                    grade: score ? calculateGrade(Number(score)) : '',
                    gradeStatus: existingGrade ? existingGrade.status : 'Unmarked',
                    submissionId: existingGrade?.submissionId,
                }
            });
            setStudents(studentData);
            gradeInputRefs.current = gradeInputRefs.current.slice(0, studentData.length);
            setIsLoading(false);
        });
    }, [exam, schoolId]);
    
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
            const isEditing = !!student.submissionId;
            const status = isEditing ? 'Pending Approval' : 'Approved';

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
                status: status
            }, { merge: true });
            
            toast({
                title: 'Grade Saved!',
                description: `The grade for ${student.studentName} is saved and ${status === 'Pending Approval' ? 'awaits approval' : 'is approved'}.`,
            });

            setStudents(prev => prev.map(s => s.studentId === studentId ? { ...s, submissionId: gradeRef.id, gradeStatus: status } : s));

        } catch (e) {
            console.error(e);
            toast({ title: 'Error', description: 'Failed to save grade.', variant: 'destructive'});
        }
    };

    const handleSubmitAllGrades = async () => {
        setIsSaving(true);
        try {
            const examRef = doc(firestore, 'schools', schoolId, 'exams', exam.id);
            await updateDoc(examRef, { status: 'Grading Complete' });
            
            await logAuditEvent({
                schoolId,
                action: 'GRADES_SUBMITTED',
                actionType: 'Academics',
                user: { id: teacher.id, name: teacher.name, role: 'Teacher' },
                details: `Finished grading for exam: "${exam.title}" - ${exam.className}.`,
            });
            
            toast({
                title: 'Grading Complete!',
                description: 'All grades for this exam have been recorded. Any edits will require admin approval.',
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
    const isLocked = exam.status === 'Closed';
    
    return (
        <Card>
            <CardHeader>
                <Button variant="outline" size="sm" onClick={onBack} className="mb-4 w-fit">
                    <ArrowLeft className="mr-2 h-4 w-4"/> Back to Exams
                </Button>
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="font-headline text-2xl">Enter Marks: {exam.title}</CardTitle>
                        <CardDescription>{exam.className} - {exam.subject}</CardDescription>
                    </div>
                    {isLocked ? (
                        <Button variant="secondary" onClick={handleRequestUnlock}>
                            <RefreshCcw className="mr-2 h-4 w-4" />
                            Request Unlock
                        </Button>
                    ) : (
                         <Button onClick={handleSubmitAllGrades} disabled={isSaving}>
                            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4"/>}
                            Mark as Complete
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
                                            disabled={isLocked}
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

export default function TeacherGradesPage() {
    const searchParams = useSearchParams();
    const schoolId = searchParams.get('schoolId')!;
    const { toast } = useToast();
    const { user } = useAuth();
    
    const [exams, setExams] = React.useState<Exam[]>([]);
    const [teacherClasses, setTeacherClasses] = React.useState<TeacherClass[]>([]);
    const [teacherSubjects, setTeacherSubjects] = React.useState<string[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [selectedExam, setSelectedExam] = React.useState<Exam | null>(null);

    const [classFilter, setClassFilter] = React.useState('all');
    const [subjectFilter, setSubjectFilter] = React.useState('all');
    const [academicTerms] = React.useState(generateAcademicTerms());
    const [termFilter, setTermFilter] = React.useState(getCurrentTerm());

    const [isUploadDialogOpen, setIsUploadDialogOpen] = React.useState(false);
    const [bulkImportFile, setBulkImportFile] = React.useState<File | null>(null);
    const [isFileProcessed, setIsFileProcessed] = React.useState(false);
    const [isProcessingFile, setIsProcessingFile] = React.useState(false);

    React.useEffect(() => {
        if (!schoolId || !user?.displayName) return;
        
        const subjectsQuery = query(collection(firestore, 'schools', schoolId, 'subjects'), where('teachers', 'array-contains', user.displayName));
        const unsubSubjects = onSnapshot(subjectsQuery, (snapshot) => {
            setTeacherSubjects(snapshot.docs.map(doc => doc.data().name));
        });

        return () => unsubSubjects();
    }, [schoolId, user]);
    
    React.useEffect(() => {
        if (!schoolId || !user) return;
        
        const classIdsQuery = query(collection(firestore, 'schools', schoolId, 'classes'), where('teacherId', '==', user.uid));
        
        const unsubClasses = onSnapshot(classIdsQuery, (classSnapshot) => {
            const teacherClassIds = classSnapshot.docs.map(doc => doc.id);
            setTeacherClasses(classSnapshot.docs.map(d => ({id: d.id, name: `${d.data().name} ${d.data().stream || ''}`.trim()})));

            let examQueries: any[] = [];
            if (teacherClassIds.length > 0) {
                 examQueries.push(query(collection(firestore, `schools/${schoolId}/exams`), where('classId', 'in', teacherClassIds)));
            }
            if(teacherSubjects.length > 0) {
                examQueries.push(query(collection(firestore, `schools/${schoolId}/exams`), where('subject', 'in', teacherSubjects)));
            }

            if (examQueries.length > 0) {
                setIsLoading(true);
                Promise.all(examQueries.map(q => getDocs(q))).then(results => {
                    const examMap = new Map<string, Exam>();
                    results.forEach(snapshot => {
                        snapshot.docs.forEach(doc => {
                             examMap.set(doc.id, { id: doc.id, ...doc.data() } as Exam);
                        });
                    });
                    setExams(Array.from(examMap.values()));
                    setIsLoading(false);
                });
            } else {
                 setIsLoading(false);
                 setExams([]);
            }
        });
        
        return () => unsubClasses();
    }, [schoolId, user, teacherSubjects]);


    const filteredExams = exams.filter(exam => {
        const classMatch = classFilter === 'all' || exam.classId === classFilter;
        const subjectMatch = subjectFilter === 'all' || exam.subject === subjectFilter;
        return classMatch && subjectMatch;
    });

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

    if (selectedExam) {
        return <GradeEntryView exam={selectedExam} onBack={() => setSelectedExam(null)} schoolId={schoolId} teacher={{ id: user!.uid, name: user!.displayName || 'Teacher' }} />;
    }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
       <div className="mb-6">
        <h1 className="font-headline text-3xl font-bold flex items-center gap-2"><FileText className="h-8 w-8 text-primary"/>Grades &amp; Exams</h1>
        <p className="text-muted-foreground">View assigned exams and enter student marks.</p>
       </div>

        <Card className="mb-6">
            <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
                <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
                    <DialogTrigger asChild>
                        <Button variant="outline">
                            <Upload className="mr-2 h-4 w-4" />
                            Upload Marks from CSV/Excel
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>Upload Student Marks</DialogTitle>
                            <DialogDescription>
                                Bulk upload marks for an exam from a CSV or Excel file.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-6 py-4">
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Exam</Label>
                                    <Select><SelectTrigger><SelectValue placeholder="Select exam..."/></SelectTrigger><SelectContent>{filteredExams.map(exam => <SelectItem key={exam.id} value={exam.id}>{exam.title} - {exam.className}</SelectItem>)}</SelectContent></Select>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Step 1: Upload File</Label>
                                <div className="flex items-center justify-center w-full">
                                    {bulkImportFile ? (
                                        <div className="w-full p-4 rounded-lg border bg-muted/50 flex items-center justify-between">
                                            <div className="flex items-center gap-2 text-sm font-medium">
                                                <FileText className="h-5 w-5 text-primary" />
                                                <span className="truncate">{bulkImportFile.name}</span>
                                            </div>
                                            <Button variant="ghost" size="icon" onClick={handleRemoveBulkFile} className="h-6 w-6">
                                                <X className="h-4 w-4 text-destructive" />
                                            </Button>
                                        </div>
                                    ) : (
                                        <Label htmlFor="dropzone-file-bulk" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted/50 hover:bg-muted">
                                            <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center">
                                                <Upload className="w-8 h-8 mb-2 text-muted-foreground" />
                                                <p className="mb-2 text-sm text-muted-foreground">Click to upload or drag and drop</p>
                                                <p className="text-xs text-muted-foreground">CSV or Excel (up to 5MB)</p>
                                            </div>
                                            <Input id="dropzone-file-bulk" type="file" className="hidden" onChange={handleBulkFileChange} />
                                        </Label>
                                    )}
                                </div>
                            </div>
                            <div className={cn("space-y-4", !isFileProcessed && "opacity-50")}>
                                <div className="flex items-center gap-2">
                                    <Columns className="h-5 w-5 text-primary" />
                                    <h4 className="font-medium">Step 2: Map Columns</h4>
                                </div>
                                <p className="text-sm text-muted-foreground">Match the columns from your file to the required fields in the system.</p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="grid grid-cols-[1fr,150px] items-center gap-2">
                                        <Label>Admission No.</Label>
                                        <Select defaultValue="col1" disabled={!isFileProcessed}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="col1">Column A</SelectItem></SelectContent></Select>
                                    </div>
                                    <div className="grid grid-cols-[1fr,150px] items-center gap-2">
                                        <Label>Score</Label>
                                        <Select defaultValue="col2" disabled={!isFileProcessed}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="col2">Column B</SelectItem></SelectContent></Select>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsUploadDialogOpen(false)}>Cancel</Button>
                            {isFileProcessed ? (
                                <Button onClick={handleImportMarks}><CheckCircle className="mr-2 h-4 w-4" /> Import Marks</Button>
                            ) : (
                                <Button onClick={handleProcessFile} disabled={!bulkImportFile || isProcessingFile}>
                                    {isProcessingFile ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/>Processing...</> : 'Process File'}
                                </Button>
                            )}
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </CardContent>
        </Card>
        
        <Card className="mt-6">
            <CardHeader>
                <CardTitle>My Assigned Exams</CardTitle>
                <CardDescription>A list of all exams for your assigned classes and subjects.</CardDescription>
                <div className="pt-4 flex flex-col md:flex-row md:items-center gap-4">
                    <Select value={classFilter} onValueChange={setClassFilter}>
                        <SelectTrigger className="w-full md:w-[180px]">
                            <SelectValue placeholder="Filter by class..." />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All My Classes</SelectItem>
                            {teacherClasses.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                     <Select value={subjectFilter} onValueChange={setSubjectFilter}>
                        <SelectTrigger className="w-full md:w-[180px]">
                            <SelectValue placeholder="Filter by subject..." />
                        </SelectTrigger>
                        <SelectContent>
                             <SelectItem value="all">All My Subjects</SelectItem>
                            {teacherSubjects.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                        </SelectContent>
                    </Select>
                     <Select value={termFilter} onValueChange={setTermFilter}>
                        <SelectTrigger className="w-full md:w-[180px]">
                            <SelectValue placeholder="Filter by term..." />
                        </SelectTrigger>
                        <SelectContent>
                            {academicTerms.map(term => <SelectItem key={term.value} value={term.value}>{term.label}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
            </CardHeader>
            <CardContent>
                <div className="w-full overflow-auto rounded-lg border hidden md:block">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Exam Title</TableHead>
                                <TableHead>Class &amp; Subject</TableHead>
                                <TableHead>Exam Date</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Feedback</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow><TableCell colSpan={6} className="h-24 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto"/></TableCell></TableRow>
                            ) : filteredExams.length > 0 ? (
                                filteredExams.map(exam => (
                                    <TableRow key={exam.id}>
                                        <TableCell className="font-semibold">{exam.title}</TableCell>
                                        <TableCell>
                                            <div className="font-medium">{exam.className}</div>
                                            <div className="text-sm text-muted-foreground">{exam.subject}</div>
                                        </TableCell>
                                        <TableCell>{exam.date?.toDate().toLocaleDateString()}</TableCell>
                                        <TableCell>{getStatusBadge(exam.status)}</TableCell>
                                        <TableCell>
                                            {exam.moderatorFeedback ? (
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button variant="secondary" size="sm">View Feedback</Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>Moderator Feedback</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                {exam.moderatorFeedback}
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>Close</AlertDialogCancel>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            ) : (
                                                <Badge variant="outline">No Feedback</Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button size="sm" onClick={() => setSelectedExam(exam)}>
                                                {exam.status === 'Open' ? 'Enter Marks' : 'View Results'}
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow><TableCell colSpan={6} className="h-24 text-center">No exams assigned.</TableCell></TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
                 <div className="grid grid-cols-1 gap-4 md:hidden">
                    {isLoading ? (
                        <div className="col-span-full h-24 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto"/></div>
                    ) : filteredExams.length > 0 ? (
                        filteredExams.map(exam => (
                            <Card key={exam.id}>
                                <CardHeader>
                                    <CardTitle className="text-base">{exam.title}</CardTitle>
                                    <CardDescription>{exam.className} - {exam.subject}</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-2">
                                    <p className="text-sm">Date: {exam.date?.toDate().toLocaleDateString()}</p>
                                    <p className="text-sm flex items-center gap-2">Status: {getStatusBadge(exam.status)}</p>
                                    {exam.moderatorFeedback && (
                                        <p className="text-sm text-yellow-500">Feedback: {exam.moderatorFeedback}</p>
                                    )}
                                    <Button size="sm" className="w-full" onClick={() => setSelectedExam(exam)}>
                                        {exam.status === 'Open' ? 'Enter Marks' : 'View Results'}
                                    </Button>
                                </CardContent>
                            </Card>
                        ))
                    ) : (
                        <div className="col-span-full h-24 text-center">No exams assigned.</div>
                    )}
                 </div>
            </CardContent>
        </Card>
    </div>
  )
}

  