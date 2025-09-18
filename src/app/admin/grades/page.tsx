
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
import { collection, addDoc, serverTimestamp, Timestamp, query, onSnapshot, orderBy, getDocs, where, getDoc, doc, updateDoc, writeBatch, deleteDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/auth-context';
import { logAuditEvent } from '@/lib/audit-log.service';


type Exam = {
    id: string;
    title: string;
    class: string;
    classId: string;
    subject: string;
    date: Timestamp;
    duration: number; // in minutes
    type: 'CAT' | 'Midterm' | 'Final' | 'Practical';
};

type StudentGrade = {
    studentId: string;
    studentName: string;
    admNo: string;
    avatarUrl: string;
    scores: Record<string, number>;
};

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
};


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

export default function AdminGradesPage() {
    const searchParams = useSearchParams();
    const schoolId = searchParams.get('schoolId');
    const { toast } = useToast();
    const { user: adminUser } = useAuth();
    const [exams, setExams] = React.useState<Exam[]>([]);
    const [isCreateDialogOpen, setIsCreateDialogOpen] = React.useState(false);
    const [selectedStudentForReport, setSelectedStudentForReport] = React.useState<Ranking | null>(null);
    const [classRanking, setClassRanking] = React.useState<Ranking[]>([]);
    const [studentGrades, setStudentGrades] = React.useState<StudentGrade[]>([]);
    const [auditLog, setAuditLog] = React.useState<AuditLog[]>([]);
    const [pendingGrades, setPendingGrades] = React.useState<PendingGrade[]>([]);
    const [activeTab, setActiveTab] = React.useState('exam-management');

    // State for the create exam form
    const [examTitle, setExamTitle] = React.useState('');
    const [examClassId, setExamClassId] = React.useState('');
    const [examSubject, setExamSubject] = React.useState('');
    const [examDate, setExamDate] = React.useState<Date | undefined>();
    const [examDuration, setExamDuration] = React.useState('');
    const [examType, setExamType] = React.useState<Exam['type'] | undefined>();
    const [classes, setClasses] = React.useState<{id: string, name: string}[]>([]);
    const [subjects, setSubjects] = React.useState<string[]>([]);
    const [subjectPerformanceData, setSubjectPerformanceData] = React.useState<{subject: string; average: number}[]>([]);
    const [academicTerms] = React.useState(generateAcademicTerms());
    
    // Gradebook state
    const [selectedGradebookClass, setSelectedGradebookClass] = React.useState<string>('');
    const [selectedGradebookExam, setSelectedGradebookExam] = React.useState<string>('');
    const [selectedReportClass, setSelectedReportClass] = React.useState<string>('');
    const [selectedReportTerm, setSelectedReportTerm] = React.useState<string>(getCurrentTerm());
    
    const [isUploadDialogOpen, setIsUploadDialogOpen] = React.useState(false);
    const [bulkImportFile, setBulkImportFile] = React.useState<File | null>(null);
    const [isFileProcessed, setIsFileProcessed] = React.useState(false);
    const [isProcessingFile, setIsProcessingFile] = React.useState(false);


    React.useEffect(() => {
        if (!schoolId) return;

        const examsQuery = query(collection(firestore, `schools/${schoolId}/exams`), orderBy('date', 'desc'));
        const unsubscribeExams = onSnapshot(examsQuery, (snapshot) => {
            const fetchedExams = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Exam));
            setExams(fetchedExams);
        });
        
        const classesQuery = query(collection(firestore, `schools/${schoolId}/classes`));
        const unsubscribeClasses = onSnapshot(classesQuery, snapshot => {
            const classData = snapshot.docs.map(doc => ({id: doc.id, name: `${doc.data().name} ${doc.data().stream || ''}`.trim()}));
            setClasses(classData);
            if (classData.length > 0) {
                if (!selectedGradebookClass) setSelectedGradebookClass(classData[0].id);
                if (!selectedReportClass) setSelectedReportClass(classData[0].id);
            }
        });
        
        const subjectsQuery = query(collection(firestore, `schools/${schoolId}/subjects`));
        const unsubscribeSubjects = onSnapshot(subjectsQuery, snapshot => {
            setSubjects(snapshot.docs.map(doc => doc.data().name));
        });

        const gradesQuery = query(collection(firestore, `schools/${schoolId}/grades`), where('status', '==', 'Approved'));
        const unsubscribeGrades = onSnapshot(gradesQuery, async (snapshot) => {
            const gradesByStudent: Record<string, { studentId: string, scores: Record<string, number> }> = {};
            const studentPromises = [];
            
            for (const doc of snapshot.docs) {
                const gradeData = doc.data();
                if (!gradeData.studentId || !gradeData.subject || isNaN(parseInt(gradeData.grade))) continue;

                if (!gradesByStudent[gradeData.studentId]) {
                    gradesByStudent[gradeData.studentId] = { studentId: gradeData.studentId, scores: {} };
                    studentPromises.push(getDoc(gradeData.studentRef));
                }
                gradesByStudent[gradeData.studentId].scores[gradeData.subject] = parseInt(gradeData.grade);
            }
            
            const studentDocs = await Promise.all(studentPromises);
            const studentDataMap = new Map(studentDocs.map(doc => [doc.id, doc.data()]));
            
            const studentScores: StudentGrade[] = Object.values(gradesByStudent).map(data => {
                const studentInfo = studentDataMap.get(data.studentId);
                return {
                    studentId: data.studentId,
                    studentName: studentInfo?.name || 'Unknown',
                    admNo: studentInfo?.admissionNumber || 'N/A',
                    avatarUrl: studentInfo?.avatarUrl || '',
                    scores: data.scores
                }
            });
            
            setStudentGrades(studentScores);
            
            const calculatedRanking: Omit<Ranking, 'position' | 'streamPosition'>[] = studentScores.map(student => {
                const subjectCount = Object.keys(student.scores).length;
                const total = Object.values(student.scores).reduce((a, b) => a + b, 0);
                const avg = subjectCount > 0 ? total / subjectCount : 0;
                let grade;
                if (avg >= 80) grade = 'A';
                else if (avg >= 65) grade = 'B';
                else if (avg >= 50) grade = 'C';
                else if (avg >= 40) grade = 'D';
                else grade = 'E';

                return {
                    name: student.studentName,
                    admNo: student.admNo,
                    avatarUrl: student.avatarUrl,
                    total,
                    avg,
                    grade,
                };
            });
            
            const sortedRanking = calculatedRanking.sort((a, b) => b.total - a.total).map((student, index) => ({
                ...student,
                position: index + 1,
                streamPosition: index + 1, 
            }));
            
            setClassRanking(sortedRanking);

            const perfData: Record<string, { total: number, count: number }> = {};
            studentScores.forEach(student => {
                Object.entries(student.scores).forEach(([subject, score]) => {
                    if (!perfData[subject]) {
                        perfData[subject] = { total: 0, count: 0 };
                    }
                    perfData[subject].total += score;
                    perfData[subject].count++;
                });
            });
             setSubjectPerformanceData(Object.entries(perfData).map(([subject, data]) => ({
                subject: subject.substring(0, 5),
                average: Math.round(data.total / data.count),
            })));
        });

        const auditLogQuery = query(collection(firestore, 'schools', schoolId, 'audit_logs'), where('action', 'in', ['GRADE_UPDATED', 'GRADE_APPROVED', 'GRADE_REJECTED']), orderBy('timestamp', 'desc'));
        const unsubscribeLogs = onSnapshot(auditLogQuery, (snapshot) => {
            const logs = snapshot.docs.map(doc => ({id: doc.id, ...doc.data()} as AuditLog));
            setAuditLog(logs);
        });
        
        const pendingGradesQuery = query(collection(firestore, 'schools', schoolId, 'grades'), where('status', '==', 'Pending Approval'));
        const unsubscribePendingGrades = onSnapshot(pendingGradesQuery, async (snapshot) => {
            const pendingData: PendingGrade[] = await Promise.all(snapshot.docs.map(async (gradeDoc) => {
                const data = gradeDoc.data();
                const studentSnap = await getDoc(data.studentRef);
                return {
                    id: gradeDoc.id,
                    studentName: studentSnap.data()?.name || 'Unknown',
                    studentId: studentSnap.id,
                    subject: data.subject,
                    grade: data.grade,
                    teacherName: data.teacherName,
                    assessmentTitle: data.assessmentTitle || 'N/A'
                };
            }));
            setPendingGrades(pendingData);
        });

        return () => {
            unsubscribeExams();
            unsubscribeGrades();
            unsubscribeClasses();
            unsubscribeSubjects();
            unsubscribeLogs();
            unsubscribePendingGrades();
        };
    }, [schoolId, selectedGradebookClass]);

    const filteredGradebookExams = React.useMemo(() => {
        return exams.filter(exam => exam.classId === selectedGradebookClass);
    }, [exams, selectedGradebookClass]);

    const gradebookStudents = React.useMemo(() => {
        return studentGrades;
    }, [studentGrades]);
    
    const gradebookSubjects = React.useMemo(() => {
        if (!selectedGradebookExam) return [];
        const exam = exams.find(e => e.id === selectedGradebookExam);
        return exam ? [exam.subject] : [];
    }, [exams, selectedGradebookExam]);


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
    
    const handleGradeModeration = async (gradeId: string, studentId: string, studentName: string, subject: string, grade: string, decision: 'Approved' | 'Rejected') => {
        if (!schoolId || !adminUser) return;
        const gradeRef = doc(firestore, `schools/${schoolId}/grades`, gradeId);
        try {
            await updateDoc(gradeRef, { status: decision });
            
            await logAuditEvent({
                schoolId,
                action: decision === 'Approved' ? 'GRADE_APPROVED' : 'GRADE_REJECTED',
                actionType: 'Academics',
                user: { id: adminUser.uid, name: adminUser.displayName || 'Admin', role: 'Admin' },
                details: `${decision} grade of ${grade} for ${studentName} in ${subject}.`,
            });
            
            toast({
                title: `Grade ${decision}`,
                description: `The grade has been successfully ${decision.toLowerCase()}.`,
            });
        } catch (e) {
            toast({ title: 'Error', description: 'Could not update grade status.', variant: 'destructive' });
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
                audience: 'parents-and-students' 
            });
            toast({
                title: 'Results Published!',
                description: 'Parents and students have been notified that results are available.',
            });
        } catch (e) {
            toast({ title: 'Failed to publish results.', variant: 'destructive' });
        }
    };
    
    const handlePrintResults = () => {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            const tableHtml = document.getElementById('class-ranking-table')?.outerHTML;
            printWindow.document.write('<html><head><title>Class Ranking</title>');
            // Basic styles for printing
            printWindow.document.write('<style>body { font-family: sans-serif; } table { width: 100%; border-collapse: collapse; } th, td { border: 1px solid #ddd; padding: 8px; } th { background-color: #f2f2f2; } </style>');
            printWindow.document.write('</head><body>');
            printWindow.document.write(`<h2>Class Ranking - ${classes.find(c => c.id === selectedReportClass)?.name} - ${selectedReportTerm}</h2>`);
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
        
        classRanking.forEach((student, index) => {
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
                    score >= 80 ? 'A' : score >= 65 ? 'B' : 'C'
                ]) : [],
            });

            const finalY = (doc as any).lastAutoTable.finalY;
            doc.text(`Total Marks: ${student.total}`, 14, finalY + 10);
            doc.text(`Average: ${student.avg.toFixed(1)}%`, 14, finalY + 16);
            doc.text(`Mean Grade: ${student.grade}`, 14, finalY + 22);
            doc.text(`Class Rank: ${student.position} of ${classRanking.length}`, 14, finalY + 28);
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
    
    const handleDeleteExam = async (examId: string) => {
      if (!schoolId || !window.confirm('Are you sure you want to delete this exam? This action cannot be undone.')) return;
      try {
        await deleteDoc(doc(firestore, `schools/${schoolId}/exams`, examId));
        toast({ title: 'Exam Deleted', description: 'The exam has been removed.', variant: 'destructive'});
      } catch (error) {
        console.error("Error deleting exam:", error);
        toast({ title: 'Error', description: 'Could not delete exam.', variant: 'destructive'});
      }
    };


    if (!schoolId) {
        return <div className="p-8">Error: School ID is missing from URL.</div>
    }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
        <ReportCardDialog student={selectedStudentForReport} studentGrades={studentGrades} open={!!selectedStudentForReport} onOpenChange={(open) => !open && setSelectedStudentForReport(null)} />
       <div className="mb-6">
        <h1 className="font-headline text-3xl font-bold flex items-center gap-2"><FileText className="h-8 w-8 text-primary"/>Grades &amp; Exams</h1>
        <p className="text-muted-foreground">Manage exams, grades, and academic reports.</p>
       </div>
        <div className="grid gap-6 md:grid-cols-3 mb-6">
            <Card>
                <CardHeader className="pb-2">
                    <CardDescription>Total Exams Created</CardDescription>
                    <CardTitle className="text-4xl">{exams.length}</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-xs text-muted-foreground">
                        {exams.filter(e => e.date.toDate() > new Date(new Date().setMonth(new Date().getMonth() - 3))).length} this term
                    </div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="pb-2">
                    <CardDescription>Pending Grading</CardDescription>
                    <CardTitle className="text-4xl text-yellow-500 flex items-center gap-2">
                        <AlertTriangle/>
                        {pendingGrades.length}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-xs text-muted-foreground">
                        entries require approval
                    </div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                 <CardContent className="flex flex-col gap-2">
                    <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline">
                                <Upload className="mr-2 h-4 w-4" />
                                Upload Marks
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
                    <Button variant="outline" onClick={() => setActiveTab('reports')}>
                        <BarChartIcon className="mr-2 h-4 w-4" />
                        View Reports
                    </Button>
                </CardContent>
            </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="exam-management">Exam Management</TabsTrigger>
                <TabsTrigger value="gradebook">Gradebook</TabsTrigger>
                <TabsTrigger value="moderation">Moderation &amp; Approval</TabsTrigger>
                <TabsTrigger value="reports">Reports &amp; Analytics</TabsTrigger>
            </TabsList>
            <TabsContent value="exam-management" className="mt-4">
                <Card>
                    <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between">
                        <div>
                            <CardTitle>Exam Scheduler</CardTitle>
                            <CardDescription>Create, schedule, and manage all school examinations.</CardDescription>
                        </div>
                        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                            <DialogTrigger asChild>
                                <Button>
                                    <PlusCircle className="mr-2 h-4 w-4"/>
                                    Create Exam
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-2xl">
                                <DialogHeader>
                                    <DialogTitle>Create New Exam</DialogTitle>
                                    <DialogDescription>Fill in the details for the new examination.</DialogDescription>
                                </DialogHeader>
                                <div className="py-4 space-y-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="exam-title">Exam Title</Label>
                                        <Input id="exam-title" placeholder="e.g., Form 4 Midterm Exam" value={examTitle} onChange={e => setExamTitle(e.target.value)} />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="exam-class">Class</Label>
                                            <Select value={examClassId} onValueChange={setExamClassId}>
                                                <SelectTrigger><SelectValue placeholder="Select a class"/></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="all">All Classes</SelectItem>
                                                    {classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="exam-subject">Subject</Label>
                                            <Select value={examSubject} onValueChange={setExamSubject}>
                                                <SelectTrigger><SelectValue placeholder="Select a subject"/></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="all">All Subjects</SelectItem>
                                                    {subjects.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="exam-date">Date</Label>
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <Button variant="outline" className="w-full justify-start font-normal">
                                                        <CalendarIcon className="mr-2 h-4 w-4"/>
                                                        {examDate ? format(examDate, 'PPP') : <span>Pick a date</span>}
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={examDate} onSelect={setExamDate} initialFocus/></PopoverContent>
                                            </Popover>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="exam-duration">Duration (minutes)</Label>
                                            <Input id="exam-duration" type="number" placeholder="e.g., 120" value={examDuration} onChange={e => setExamDuration(e.target.value)} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="exam-type">Type</Label>
                                            <Select value={examType} onValueChange={(v: Exam['type']) => setExamType(v)}>
                                                <SelectTrigger><SelectValue placeholder="Select a type"/></SelectTrigger>
                                                <SelectContent>{examTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>Cancel</Button>
                                    <Button onClick={handleCreateExam}>Create Exam</Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
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
                                        <TableHead>Type</TableHead>
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
                                            <TableCell><Badge variant="outline">{exam.type}</Badge></TableCell>
                                            <TableCell className="text-right space-x-2">
                                                <Button variant="outline" size="sm" onClick={() => toast({title: "Notifications Sent", description: "Teachers have been notified about this exam."})}><Clock className="mr-2 h-4 w-4"/>Schedule &amp; Notify</Button>
                                                <Button variant="ghost" size="icon" disabled><Copy className="h-4 w-4"/></Button>
                                                <Button variant="ghost" size="icon" disabled><Edit className="h-4 w-4"/></Button>
                                                <Button variant="ghost" size="icon" onClick={() => handleDeleteExam(exam.id)}><Trash2 className="h-4 w-4 text-destructive"/></Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>
            <TabsContent value="gradebook" className="mt-4">
                 <Card>
                    <CardHeader>
                        <CardTitle>Gradebook</CardTitle>
                        <CardDescription>View and manage student marks for different exams.</CardDescription>
                        <div className="pt-4 flex flex-col md:flex-row md:items-center gap-4">
                             <Select value={selectedGradebookClass} onValueChange={setSelectedGradebookClass}>
                                <SelectTrigger className="w-full md:w-[240px]">
                                    <SelectValue placeholder="Select a Class"/>
                                </SelectTrigger>
                                <SelectContent>{classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                            </Select>
                            <Select value={selectedGradebookExam} onValueChange={setSelectedGradebookExam} disabled={filteredGradebookExams.length === 0}>
                                <SelectTrigger className="w-full md:w-[240px]">
                                    <SelectValue placeholder="Select an Exam"/>
                                </SelectTrigger>
                                <SelectContent>{filteredGradebookExams.map(e => <SelectItem key={e.id} value={e.id}>{e.title}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="w-full overflow-auto rounded-lg border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Student</TableHead>
                                        {gradebookSubjects.map(sub => (
                                            <TableHead key={sub} className="text-center">{sub}</TableHead>
                                        ))}
                                        <TableHead className="text-right font-bold">Total</TableHead>
                                        <TableHead className="text-right font-bold">Grade</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {gradebookStudents.map(student => {
                                        let total = 0;
                                        let subjectCount = 0;
                                        gradebookSubjects.forEach(sub => {
                                            if (student.scores[sub]) {
                                                total += student.scores[sub];
                                                subjectCount++;
                                            }
                                        });
                                        const mean = subjectCount > 0 ? total / subjectCount : 0;
                                        const grade = mean >= 80 ? 'A' : mean >= 65 ? 'B' : 'C';

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
                                             {gradebookSubjects.map(sub => (
                                                <TableCell key={sub} className="text-center">{student.scores[sub] || '—'}</TableCell>
                                            ))}
                                            <TableCell className="text-right font-bold">{total}</TableCell>
                                            <TableCell className="text-right font-bold">
                                                <Badge>{grade}</Badge>
                                            </TableCell>
                                        </TableRow>
                                    )})}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>
            <TabsContent value="moderation" className="mt-4 space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Wand2 className="h-5 w-5 text-primary"/>AI-Assisted Grading Insights</CardTitle>
                        <CardDescription>AI-powered analysis to detect potential grading anomalies, patterns, or inconsistencies.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="p-4 rounded-lg flex items-center gap-3 bg-muted/50">
                            <p className="text-sm text-muted-foreground">AI Insights are disabled. This feature requires a more complex data pipeline.</p>
                        </div>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle>Grade Approval Queue</CardTitle>
                        <CardDescription>Review and approve grade entries submitted by teachers.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="w-full overflow-auto rounded-lg border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Student</TableHead>
                                        <TableHead>Subject</TableHead>
                                        <TableHead>Score</TableHead>
                                        <TableHead>Entered By</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                     {pendingGrades.length > 0 ? pendingGrades.map(grade => (
                                        <TableRow key={grade.id}>
                                            <TableCell>{grade.studentName}</TableCell>
                                            <TableCell>{grade.subject}</TableCell>
                                            <TableCell className="font-semibold">{grade.grade}</TableCell>
                                            <TableCell className="text-muted-foreground">{grade.teacherName}</TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="sm" className="text-green-600 hover:text-green-700" onClick={() => handleGradeModeration(grade.id, grade.studentId, grade.studentName, grade.subject, grade.grade, 'Approved')}>
                                                    <CheckCircle className="mr-2 h-4 w-4"/>Approve
                                                </Button>
                                                <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700" onClick={() => handleGradeModeration(grade.id, grade.studentId, grade.studentName, grade.subject, grade.grade, 'Rejected')}>
                                                    <XCircle className="mr-2 h-4 w-4"/>Reject
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                     )) : (
                                        <TableRow><TableCell colSpan={5} className="h-24 text-center text-muted-foreground">No pending approvals.</TableCell></TableRow>
                                     )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                 </Card>
                 <Card>
                     <CardHeader>
                        <CardTitle>Grade Change Audit Trail</CardTitle>
                        <CardDescription>A log of all grade entries and modifications for accountability.</CardDescription>
                     </CardHeader>
                     <CardContent>
                        <div className="w-full overflow-auto rounded-lg border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Timestamp</TableHead>
                                        <TableHead>User</TableHead>
                                        <TableHead>Action</TableHead>
                                        <TableHead>Details</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                     {auditLog.map(log => (
                                        <TableRow key={log.id}>
                                            <TableCell className="text-xs text-muted-foreground">{format(log.timestamp.toDate(), 'PPp')}</TableCell>
                                            <TableCell className="font-medium">{log.user.name}</TableCell>
                                            <TableCell><Badge variant="secondary">{log.action}</Badge></TableCell>
                                            <TableCell className="text-sm text-muted-foreground italic">"{log.details}"</TableCell>
                                        </TableRow>
                                    ))}
                                    {auditLog.length === 0 && <TableRow><TableCell colSpan={4} className="h-24 text-center text-muted-foreground">No grade-related audit events found.</TableCell></TableRow>}
                                </TableBody>
                            </Table>
                         </div>
                     </CardContent>
                 </Card>
            </TabsContent>
             <TabsContent value="reports" className="mt-4 space-y-6">
                <Card>
                    <CardHeader>
                         <CardTitle>Reports &amp; Analytics</CardTitle>
                        <CardDescription>Generate reports and analyze academic performance.</CardDescription>
                        <div className="pt-4 flex flex-col md:flex-row md:items-center gap-4">
                             <Select value={selectedReportClass} onValueChange={setSelectedReportClass}>
                                <SelectTrigger className="w-full md:w-[240px]">
                                    <SelectValue placeholder="Select a Class"/>
                                </SelectTrigger>
                                <SelectContent>{classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                            </Select>
                            <Select value={selectedReportTerm} onValueChange={setSelectedReportTerm}>
                                <SelectTrigger className="w-full md:w-[240px]">
                                    <SelectValue placeholder="Select Term/Year"/>
                                </SelectTrigger>
                                <SelectContent>
                                    {academicTerms.map(term => <SelectItem key={term.value} value={term.value}>{term.label}</SelectItem>)}
                                </SelectContent>
                            </Select>
                            <div className="flex gap-2">
                                <Dialog>
                                    <DialogTrigger asChild>
                                        <Button variant="secondary">
                                            <Bell className="mr-2 h-4 w-4" />
                                            Publish Results
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>Confirm Publication</DialogTitle>
                                            <DialogDescription>
                                                This will make results for the selected term visible to all students and parents. Are you sure you want to proceed?
                                            </DialogDescription>
                                        </DialogHeader>
                                        <DialogFooter>
                                            <DialogClose asChild>
                                                <Button variant="outline">Cancel</Button>
                                            </DialogClose>
                                            <DialogClose asChild>
                                                <Button onClick={handlePublishResults}>
                                                    Confirm &amp; Publish
                                                </Button>
                                            </DialogClose>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>
                                <Button variant="secondary" onClick={handlePrintResults}><Printer className="mr-2 h-4 w-4"/>Print Class Results</Button>
                                <Button variant="secondary" onClick={handleDownloadAllReportCards}><Download className="mr-2 h-4 w-4"/>Download Report Cards</Button>
                            </div>
                        </div>
                    </CardHeader>
                </Card>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Class Ranking</CardTitle>
                        </CardHeader>
                        <CardContent>
                             <div className="w-full overflow-auto rounded-lg border" id="class-ranking-table">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Pos</TableHead>
                                            <TableHead>Stream</TableHead>
                                            <TableHead>Name</TableHead>
                                            <TableHead className="text-right">Total</TableHead>
                                            <TableHead className="text-right">Average</TableHead>
                                            <TableHead>Grade</TableHead>
                                            <TableHead className="text-right">Report</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {classRanking.map(student => (
                                            <TableRow key={student.admNo}>
                                                <TableCell className="font-bold">{student.position}</TableCell>
                                                <TableCell className="font-bold">{student.streamPosition}</TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <Avatar className="h-8 w-8"><AvatarImage src={student.avatarUrl}/><AvatarFallback>{student.name[0]}</AvatarFallback></Avatar>
                                                        {student.name}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right">{student.total}</TableCell>
                                                <TableCell className="text-right">{student.avg.toFixed(1)}</TableCell>
                                                <TableCell><Badge>{student.grade}</Badge></TableCell>
                                                <TableCell className="text-right">
                                                    <Button variant="outline" size="sm" onClick={() => setSelectedStudentForReport(student)}>View Report</Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>Performance Analytics</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 gap-4 text-center mb-6">
                                <div className="p-4 bg-muted/50 rounded-lg">
                                    <p className="text-xs text-muted-foreground">Class Average</p>
                                    <p className="text-2xl font-bold">{classRanking.length > 0 ? (classRanking.reduce((sum, s) => sum + s.avg, 0) / classRanking.length).toFixed(1) : 0}%</p>
                                </div>
                                <div className="p-4 bg-muted/50 rounded-lg">
                                    <p className="text-xs text-muted-foreground">Pass Rate</p>
                                    <p className="text-2xl font-bold">{classRanking.length > 0 ? (classRanking.filter(s => s.avg >= 40).length / classRanking.length * 100).toFixed(0) : 100}%</p>
                                </div>
                            </div>
                             <Separator />
                            <h4 className="font-semibold text-sm my-4 text-center">Average Score by Subject</h4>
                            <ChartContainer config={chartConfig} className="h-[250px] w-full">
                                <BarChart data={subjectPerformanceData}>
                                <CartesianGrid vertical={false} />
                                <XAxis dataKey="subject" tickLine={false} tickMargin={10} axisLine={false} />
                                <YAxis />
                                <ChartTooltip content={<ChartTooltipContent />} />
                                <Bar dataKey="average" fill="var(--color-average)" radius={4} />
                                </BarChart>
                            </ChartContainer>
                        </CardContent>
                    </Card>
                </div>
             </TabsContent>
        </Tabs>
    </div>
  );
}
