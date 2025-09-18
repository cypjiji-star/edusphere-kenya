
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
import { firestore } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, Timestamp, query, onSnapshot, orderBy, getDocs, where, getDoc, doc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';


type Exam = {
    id: string;
    title: string;
    class: string;
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
  user: { name: string };
  student: string;
  action: string;
  details: string;
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

const aiInsights = [
    { id: 'ai-1', level: 'warning', text: "A student's score of 25 in Mathematics is a significant outlier compared to their average of 60. Could be an entry error." },
    { id: 'ai-2', level: 'info', text: "The average score for the Form 4 Chemistry CAT is 45%, which is 15% lower than the previous exam. Consider reviewing the exam's difficulty or class performance." },
    { id: 'ai-3', level: 'info', text: "Teacher 'Mr. Otieno' has an average awarded score of 82%, which is consistently higher than the departmental average of 71%." },
]


function ReportCardDialog({ student, studentGrades, open, onOpenChange }: { student: Ranking | null, studentGrades: StudentGrade[] | null, open: boolean, onOpenChange: (open: boolean) => void }) {
    if (!student || !studentGrades) return null;
    
    const studentData = studentGrades.find(s => s.admNo === student.admNo);

    const handleDownloadPdf = () => {
        const doc = new jsPDF();
        const reportCardElement = document.getElementById('report-card-content');
        if (reportCardElement) {
            doc.html(reportCardElement, {
                callback: function (doc) {
                    doc.save(`report-card-${student.admNo}.pdf`);
                },
                x: 10,
                y: 10,
                width: 180,
                windowWidth: reportCardElement.scrollWidth,
            });
        }
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
                                <div className="flex justify-between"><span className="font-semibold">Class Rank:</span><span>{student.position} of {studentGrades.length}</span></div>
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

export default function AdminGradesPage() {
    const searchParams = useSearchParams();
    const schoolId = searchParams.get('schoolId');
    const { toast } = useToast();
    const [exams, setExams] = React.useState<Exam[]>([]);
    const [isCreateDialogOpen, setIsCreateDialogOpen] = React.useState(false);
    const [selectedStudentForReport, setSelectedStudentForReport] = React.useState<Ranking | null>(null);
    const [classRanking, setClassRanking] = React.useState<Ranking[]>([]);
    const [studentGrades, setStudentGrades] = React.useState<StudentGrade[]>([]);
    const [auditLog, setAuditLog] = React.useState<AuditLog[]>([]);

    // State for the create exam form
    const [examTitle, setExamTitle] = React.useState('');
    const [examClass, setExamClass] = React.useState('');
    const [examSubject, setExamSubject] = React.useState('');
    const [examDate, setExamDate] = React.useState<Date | undefined>();
    const [examDuration, setExamDuration] = React.useState('');
    const [examType, setExamType] = React.useState<Exam['type'] | undefined>();
    const [classes, setClasses] = React.useState<string[]>([]);
    const [subjects, setSubjects] = React.useState<string[]>([]);
    const [subjectPerformanceData, setSubjectPerformanceData] = React.useState<{subject: string; average: number}[]>([]);


    React.useEffect(() => {
        if (!schoolId) return;

        const examsQuery = query(collection(firestore, `schools/${schoolId}/exams`), orderBy('date', 'desc'));
        const unsubscribeExams = onSnapshot(examsQuery, (snapshot) => {
            const fetchedExams = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Exam));
            setExams(fetchedExams);
        });
        
        const classesQuery = query(collection(firestore, `schools/${schoolId}/classes`));
        const unsubscribeClasses = onSnapshot(classesQuery, snapshot => {
            setClasses(snapshot.docs.map(doc => `${doc.data().name} ${doc.data().stream || ''}`.trim()));
        });
        
        const subjectsQuery = query(collection(firestore, `schools/${schoolId}/subjects`));
        const unsubscribeSubjects = onSnapshot(subjectsQuery, snapshot => {
            setSubjects(snapshot.docs.map(doc => doc.data().name));
        });

        // Real-time listener for grades to update ranking
        const gradesQuery = query(collection(firestore, `schools/${schoolId}/grades`));
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
            
            // Sort by total score and assign rank
            const sortedRanking = calculatedRanking.sort((a, b) => b.total - a.total).map((student, index) => ({
                ...student,
                position: index + 1,
                streamPosition: index + 1, // Placeholder for stream rank
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

        // Fetch audit logs for grade changes
        const auditLogQuery = query(collection(firestore, 'schools', schoolId, 'audit_logs'), where('action', 'in', ['GRADE_UPDATED', 'GRADE_APPROVED', 'GRADE_REJECTED']), orderBy('timestamp', 'desc'));
        const unsubscribeLogs = onSnapshot(auditLogQuery, (snapshot) => {
            const logs = snapshot.docs.map(doc => ({id: doc.id, ...doc.data()} as AuditLog));
            setAuditLog(logs);
        });

        return () => {
            unsubscribeExams();
            unsubscribeGrades();
            unsubscribeClasses();
            unsubscribeSubjects();
            unsubscribeLogs();
        };
    }, [schoolId]);

    const handleCreateExam = async () => {
        if (!schoolId || !examTitle || !examClass || !examSubject || !examDate || !examDuration || !examType) {
            toast({
                title: 'Missing Information',
                description: 'Please fill out all exam details.',
                variant: 'destructive',
            });
            return;
        }

        try {
            await addDoc(collection(firestore, `schools/${schoolId}/exams`), {
                title: examTitle,
                class: examClass,
                subject: examSubject,
                date: Timestamp.fromDate(examDate),
                duration: Number(examDuration),
                type: examType,
                createdAt: serverTimestamp(),
            });
            
            await addDoc(collection(firestore, 'schools', schoolId, 'notifications'), {
                title: 'New Exam Scheduled',
                description: `A new ${examType} exam, "${examTitle}", has been scheduled for ${examClass} on ${format(examDate, 'PPP')}.`,
                createdAt: serverTimestamp(),
                read: false,
                href: `/teacher/assignments?schoolId=${schoolId}`,
            });

            toast({
                title: 'Exam Created & Notified',
                description: 'The new exam has been scheduled and relevant teachers have been notified.',
            });
            
            // Reset form and close dialog
            setExamTitle('');
            setExamClass('');
            setExamSubject('');
            setExamDate(undefined);
            setExamDuration('');
            setExamType(undefined);
            setIsCreateDialogOpen(false);

        } catch (error) {
            console.error("Error creating exam: ", error);
            toast({ title: 'Error', description: 'Could not create the exam.', variant: 'destructive' });
        }
    };
    
    const handleNotify = (exam: Exam) => {
         toast({
            title: 'Notification Sent',
            description: `A reminder for the "${exam.title}" exam has been sent.`,
        });
    };
    
    const handlePublishResults = async () => {
        if (!schoolId) return;

        try {
            await addDoc(collection(firestore, 'schools', schoolId, 'notifications'), {
                title: 'Exam Results Published!',
                description: `The results for Form 4, Term 2 2024 exams are now available on the portal.`,
                createdAt: serverTimestamp(),
                read: false,
                href: `/parent/grades?schoolId=${schoolId}`,
            });
            toast({
                title: 'Results Published!',
                description: 'Parents and students have been notified that results are available.',
            });
        } catch (e) {
            toast({ title: 'Failed to publish results.', variant: 'destructive' });
        }
    };

    if (!schoolId) {
        return <div className="p-8">Error: School ID is missing from URL.</div>
    }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
        <ReportCardDialog student={selectedStudentForReport} studentGrades={studentGrades} open={!!selectedStudentForReport} onOpenChange={(open) => !open && setSelectedStudentForReport(null)} />
       <div className="mb-6">
        <h1 className="font-headline text-3xl font-bold flex items-center gap-2"><FileText className="h-8 w-8 text-primary"/>Grades & Exams</h1>
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
                        0
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-xs text-muted-foreground">
                        assignments require grading
                    </div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                 <CardContent className="flex flex-col gap-2">
                    <Button variant="outline" disabled>
                        <Upload className="mr-2 h-4 w-4" />
                        Upload Marks
                    </Button>
                     <Button variant="outline" disabled>
                        <BarChartIcon className="mr-2 h-4 w-4" />
                        View Reports
                    </Button>
                </CardContent>
            </Card>
        </div>

        <Tabs defaultValue="exam-management" className="w-full">
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
                                            <Select value={examClass} onValueChange={setExamClass}><SelectTrigger><SelectValue placeholder="Select a class"/></SelectTrigger><SelectContent>{classes.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="exam-subject">Subject</Label>
                                            <Select value={examSubject} onValueChange={setExamSubject}><SelectTrigger><SelectValue placeholder="Select a subject"/></SelectTrigger><SelectContent>{subjects.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select>
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
                                            <Select value={examType} onValueChange={(v: Exam['type']) => setExamType(v)}><SelectTrigger><SelectValue placeholder="Select a type"/></SelectTrigger><SelectContent>{examTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select>
                                        </div>
                                    </div>
                                    <Separator/>
                                    <div className="space-y-4">
                                        <h4 className="font-medium text-sm">Advanced Options</h4>
                                        <div className="flex items-center justify-between rounded-lg border p-3">
                                            <div>
                                                <Label>Assign Invigilators</Label>
                                                <p className="text-xs text-muted-foreground">Assign teachers to supervise the exam.</p>
                                            </div>
                                            <Button variant="secondary" size="sm" disabled><PlusCircle className="mr-2 h-4 w-4"/>Assign</Button>
                                        </div>
                                        <div className="flex items-center justify-between rounded-lg border p-3">
                                            <div>
                                                <Label>Save as Template</Label>
                                                <p className="text-xs text-muted-foreground">Save this configuration for future use.</p>
                                            </div>
                                            <Button variant="secondary" size="sm" disabled><Save className="mr-2 h-4 w-4"/>Save Template</Button>
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
                                                 <Button variant="outline" size="sm" onClick={() => handleNotify(exam)}><Clock className="mr-2 h-4 w-4"/>Schedule &amp; Notify</Button>
                                                <Button variant="ghost" size="icon" disabled><Copy className="h-4 w-4"/></Button>
                                                <Button variant="ghost" size="icon" disabled><Edit className="h-4 w-4"/></Button>
                                                <Button variant="ghost" size="icon" disabled><Trash2 className="h-4 w-4 text-destructive"/></Button>
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
                            <Select>
                                <SelectTrigger className="w-full md:w-[240px]">
                                    <SelectValue placeholder="Select a Class"/>
                                </SelectTrigger>
                                <SelectContent>{classes.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                            </Select>
                            <Select>
                                <SelectTrigger className="w-full md:w-[240px]">
                                    <SelectValue placeholder="Select an Exam"/>
                                </SelectTrigger>
                                <SelectContent>{exams.map(e => <SelectItem key={e.id} value={e.id}>{e.title}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="w-full overflow-auto rounded-lg border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Student</TableHead>
                                        {subjects.slice(0, 5).map(sub => (
                                            <TableHead key={sub} className="text-center">{sub.substring(0,3).toUpperCase()}</TableHead>
                                        ))}
                                        <TableHead className="text-right font-bold">Total</TableHead>
                                        <TableHead className="text-right font-bold">Grade</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {studentGrades.map(student => {
                                        const total = Object.values(student.scores).reduce((a, b) => a + b, 0);
                                        const mean = total / Object.keys(student.scores).length;
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
                                             {subjects.slice(0, 5).map(sub => (
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
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">No pending approvals.</TableCell>
                                    </TableRow>
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
                             <Select defaultValue="form-4">
                                <SelectTrigger className="w-full md:w-[240px]">
                                    <SelectValue placeholder="Select a Class"/>
                                </SelectTrigger>
                                <SelectContent>
                                    {classes.map(c => <SelectItem key={c} value={c.replace(' ','-').toLowerCase()}>{c}</SelectItem>)}
                                </SelectContent>
                            </Select>
                            <Select defaultValue="term2-2024">
                                <SelectTrigger className="w-full md:w-[240px]">
                                    <SelectValue placeholder="Select Term/Year"/>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="term2-2024">Term 2, 2024</SelectItem>
                                    <SelectItem value="term1-2024">Term 1, 2024</SelectItem>
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
                                                This will make results for Form 4, Term 2 visible to all students and parents. Are you sure you want to proceed?
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
                                <Button variant="secondary" disabled><Printer className="mr-2 h-4 w-4"/>Print Class Results</Button>
                                <Button variant="secondary" disabled><Download className="mr-2 h-4 w-4"/>Download Report Cards</Button>
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
                             <div className="w-full overflow-auto rounded-lg border">
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

    