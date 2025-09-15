

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
import { collection, query, onSnapshot, orderBy, Timestamp, addDoc, updateDoc, doc, getDocs, where } from 'firebase/firestore';
import { useSearchParams } from 'next/navigation';


type ExamStatus = 'Scheduled' | 'In Progress' | 'Completed' | 'Grading';
type SubmissionStatus = 'Pending' | 'Submitted' | 'Approved';

export type Exam = {
    id: string;
    title: string;
    term: string;
    classes: string;
    startDate: Timestamp;
    endDate: Timestamp;
    status: ExamStatus;
};

type Submission = {
    id: string;
    examId: string;
    subject: string;
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
}


const statusColors: Record<ExamStatus, string> = {
    'Scheduled': 'bg-blue-500',
    'In Progress': 'bg-yellow-500',
    'Completed': 'bg-green-600',
    'Grading': 'bg-purple-500',
};

const getSubmissionStatusBadge = (status: SubmissionStatus) => {
    switch (status) {
        case 'Pending': return <Badge className="bg-yellow-500 text-white hover:bg-yellow-600"><Clock className="mr-1 h-3 w-3" />Pending</Badge>;
        case 'Submitted': return <Badge className="bg-blue-500 text-white hover:bg-blue-600"><CheckCircle className="mr-1 h-3 w-3" />Submitted</Badge>;
        case 'Approved': return <Badge className="bg-green-600 text-white hover:bg-green-700"><CheckCircle className="mr-1 h-3 w-3" />Approved</Badge>;
    }
}


const initialGradingScale = [
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
    const [gradingScale, setGradingScale] = React.useState(initialGradingScale);
    const [viewingSubmission, setViewingSubmission] = React.useState<Submission | null>(null);
    const [viewingGrades, setViewingGrades] = React.useState<StudentGrade[]>([]);
    const [isFetchingGrades, setIsFetchingGrades] = React.useState(false);
    const { toast } = useToast();
    const [exams, setExams] = React.useState<Exam[]>([]);
    const [submissions, setSubmissions] = React.useState<Submission[]>([]);
    const [classes, setClasses] = React.useState<{id: string, name: string}[]>([]);
    
    const [activeTab, setActiveTab] = React.useState('schedules');
    const [examForAnalysis, setExamForAnalysis] = React.useState<Exam | null>(null);
    
    const currentYear = new Date().getFullYear();
    const academicTerms = Array.from({ length: 2 }, (_, i) => {
        const year = currentYear - 1 + i;
        return [`Term 1, ${year}`, `Term 2, ${year}`, `Term 3, ${year}`];
    }).flat();
    academicTerms.push(...[`Term 1, ${currentYear + 1}`, `Term 2, ${currentYear + 1}`, `Term 3, ${currentYear + 1}`]);


    // State for the create exam dialog
    const [newExamTitle, setNewExamTitle] = React.useState('');
    const [newExamTerm, setNewExamTerm] = React.useState(academicTerms[4]);
    const [newExamClass, setNewExamClass] = React.useState<string | undefined>();
    const [newExamNotes, setNewExamNotes] = React.useState('');
    const [isSavingExam, setIsSavingExam] = React.useState(false);


    React.useEffect(() => {
        if (!schoolId) return;

        setClientReady(true);
        const examsQuery = query(collection(firestore, `schools/${schoolId}/assesments`), orderBy('startDate', 'desc'));
        const unsubExams = onSnapshot(examsQuery, (snapshot) => {
            const fetchedExams = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Exam));
            setExams(fetchedExams);
            if (submissionExamFilter === 'all' && fetchedExams.length > 0) {
                setSubmissionExamFilter(fetchedExams[0].id);
            }
        });

        const submissionsQuery = query(collection(firestore, `schools/${schoolId}/submissions`), orderBy('lastUpdated', 'desc'));
        const unsubSubmissions = onSnapshot(submissionsQuery, (snapshot) => {
            const fetchedSubmissions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Submission));
            setSubmissions(fetchedSubmissions);
        });

        const classesQuery = query(collection(firestore, 'schools', schoolId, 'classes'));
        const unsubClasses = onSnapshot(classesQuery, (snapshot) => {
            const classNames = snapshot.docs.map(doc => ({id: doc.id, name: `${doc.data().name} ${doc.data().stream || ''}`.trim()}));
            setClasses(classNames);
        });

        return () => {
            unsubExams();
            unsubSubmissions();
            unsubClasses();
        };
    }, [schoolId, submissionExamFilter]);

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
            await addDoc(collection(firestore, `schools/${schoolId}/assesments`), {
                title: newExamTitle,
                term: newExamTerm,
                classId: newExamClass,
                classes: classes.find(c => c.id === newExamClass)?.name || 'N/A',
                startDate: Timestamp.fromDate(date.from),
                endDate: Timestamp.fromDate(date.to || date.from),
                notes: newExamNotes,
                status: 'Scheduled',
            });
            toast({ title: 'Exam Created', description: 'The new exam has been scheduled.' });
            // Reset form
            setNewExamTitle('');
            setNewExamClass(undefined);
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
            // We need to find all students in the class and then find their grade for this specific assessment.
            // This is inefficient. A better data model would be to have grades under the submission itself.
            const studentsQuery = query(collection(firestore, `schools/${schoolId}/students`), where('class', '==', submission.class));
            const studentsSnapshot = await getDocs(studentsQuery);

            for (const studentDoc of studentsSnapshot.docs) {
                const studentData = studentDoc.data();
                const gradeQuery = query(collection(firestore, `schools/${schoolId}/students/${studentDoc.id}/grades`), where('assessmentId', '==', submission.examId));
                const gradeSnapshot = await getDocs(gradeQuery);

                if (!gradeSnapshot.empty) {
                    const gradeData = gradeSnapshot.docs[0].data();
                    grades.push({
                        id: studentDoc.id,
                        studentName: studentData.name,
                        avatarUrl: studentData.avatarUrl,
                        grade: gradeData.grade,
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
                <TabsList className="grid w-full grid-cols-5 md:w-auto md:inline-flex mb-6">
                    <TabsTrigger value="schedules">Exam Schedules</TabsTrigger>
                    <TabsTrigger value="submissions">Submission Status</TabsTrigger>
                    <TabsTrigger value="analysis">Grade Analysis</TabsTrigger>
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
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                <div>
                                    <CardTitle>Grade Submission Status</CardTitle>
                                    <CardDescription>Track the progress of grade submissions from teachers for each exam.</CardDescription>
                                </div>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button>
                                            Bulk Actions
                                            <ChevronDown className="ml-2 h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent>
                                        <DropdownMenuItem onClick={handleApproveAll}>
                                            <CheckCircle className="mr-2 h-4 w-4" />
                                            Approve All Submitted
                                        </DropdownMenuItem>
                                         <DropdownMenuItem onClick={handlePublishAll}>
                                            <BookCheck className="mr-2 h-4 w-4" />
                                            Publish All Approved Grades
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem onClick={handleSendReminders}>
                                            <Send className="mr-2 h-4 w-4" />
                                            Send Submission Reminders
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                            <div className="mt-4 flex flex-col md:flex-row md:items-center gap-4">
                                <div className="grid w-full md:w-auto gap-1.5">
                                    <Label htmlFor="exam-filter">Exam</Label>
                                    <Select value={submissionExamFilter} onValueChange={setSubmissionExamFilter}>
                                        <SelectTrigger id="exam-filter" className="w-full md:w-auto">
                                            <SelectValue placeholder="Filter by exam" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Exams</SelectItem>
                                            {exams.map(exam => <SelectItem key={exam.id} value={exam.id}>{exam.title}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                 <div className="grid w-full md:w-auto gap-1.5">
                                    <Label htmlFor="class-filter">Class</Label>
                                    <Select value={submissionClassFilter} onValueChange={setSubmissionClassFilter}>
                                        <SelectTrigger id="class-filter" className="w-full md:w-auto">
                                            <SelectValue placeholder="Filter by class" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="All Classes">All Classes</SelectItem>
                                            {classes.map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
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
                                            <TableHead>Status</TableHead>
                                            <TableHead>Last Updated</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredSubmissions.map(submission => (
                                            <TableRow key={submission.id}>
                                                <TableCell className="font-medium">{submission.subject}</TableCell>
                                                <TableCell>{submission.teacher}</TableCell>
                                                <TableCell>{getSubmissionStatusBadge(submission.status)}</TableCell>
                                                <TableCell>{clientReady && submission.lastUpdated ? submission.lastUpdated.toDate().toLocaleDateString() : 'N/A'}</TableCell>
                                                <TableCell className="text-right">
                                                    <DialogTrigger asChild>
                                                        <Button variant="outline" size="sm" disabled={submission.status === 'Pending'} onClick={() => handleViewGrades(submission)}>
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
                <TabsContent value="reports">
                    <ReportGenerator />
                </TabsContent>
                 <TabsContent value="settings">
                    <div className="grid gap-6 md:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>Grading Scale</CardTitle>
                                <CardDescription>Define the marks required for each grade. This will be applied school-wide.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                {gradingScale.map((item, index) => (
                                    <div key={index} className="flex items-center gap-2">
                                        <Input defaultValue={item.grade} className="w-16 font-bold" />
                                        <Input type="number" value={item.min} onChange={(e) => handleGradingScaleChange(index, 'min', parseInt(e.target.value, 10) || 0)} className="w-20" />
                                        <span>-</span>
                                        <Input type="number" value={item.max} onChange={(e) => handleGradingScaleChange(index, 'max', parseInt(e.target.value, 10) || 0)} className="w-20" />
                                        <Button variant="ghost" size="icon" onClick={() => removeGradingRow(index)}>
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                    </div>
                                ))}
                                </div>
                            </CardContent>
                            <CardFooter className="flex justify-between">
                                <Button variant="outline" onClick={addGradingRow}>
                                    <PlusCircle className="mr-2 h-4 w-4"/>
                                    Add Row
                                </Button>
                                <Button onClick={handleSaveScale}>
                                    <Save className="mr-2 h-4 w-4"/>
                                    Save Scale
                                </Button>
                            </CardFooter>
                        </Card>
                         <div className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Report Card Templates</CardTitle>
                                    <CardDescription>Manage templates for official student report cards.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                     <div className="flex flex-col h-[150px] w-full items-center justify-center rounded-lg border-2 border-dashed border-muted">
                                        <Button variant="secondary">
                                            Manage Templates
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                             <Card>
                                <CardHeader>
                                    <CardTitle>GPA Calculation</CardTitle>
                                    <CardDescription>Configure how Grade Point Average is calculated.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                   <div className="flex items-center space-x-2">
                                        <Switch id="gpa-switch" />
                                        <Label htmlFor="gpa-switch">Enable GPA on reports</Label>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
        
        {/* Exam Details Dialog */}
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
        
        {/* View Grades Dialog */}
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

    

    
