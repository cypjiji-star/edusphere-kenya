
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


type ExamStatus = 'Scheduled' | 'In Progress' | 'Completed' | 'Grading';
type SubmissionStatus = 'Pending' | 'Submitted' | 'Approved';

type Exam = {
    id: string;
    title: string;
    term: string;
    classes: string;
    startDate: string;
    endDate: string;
    status: ExamStatus;
};

type Submission = {
    id: string;
    examId: string;
    subject: string;
    teacher: string;
    class: string;
    status: SubmissionStatus;
    lastUpdated: string;
};


const mockExams: Exam[] = [
    { id: 'ex-1', title: 'Term 2 Mid-Term Exams', term: 'Term 2, 2024', classes: 'All Classes', startDate: '2024-07-29', endDate: '2024-08-02', status: 'Scheduled' },
    { id: 'ex-2', title: 'Form 4 Chemistry Practical', term: 'Term 2, 2024', classes: 'Form 4', startDate: '2024-07-22', endDate: '2024-07-22', status: 'Grading' },
    { id: 'ex-3', title: 'Term 1 Final Exams', term: 'Term 1, 2024', classes: 'All Classes', startDate: '2024-04-15', endDate: '2024-04-19', status: 'Completed' },
];

const mockSubmissions: Submission[] = [
    { id: 'sub-1', examId: 'ex-1', subject: 'Mathematics', teacher: 'Mr. Otieno', class: 'Form 4', status: 'Submitted', lastUpdated: '2024-08-03' },
    { id: 'sub-2', examId: 'ex-1', subject: 'English', teacher: 'Ms. Njeri', class: 'Form 4', status: 'Submitted', lastUpdated: '2024-08-04' },
    { id: 'sub-3', examId: 'ex-1', subject: 'Chemistry', teacher: 'Ms. Wanjiku', class: 'Form 4', status: 'Pending', lastUpdated: 'N/A' },
    { id: 'sub-4', examId: 'ex-1', subject: 'Physics', teacher: 'Mr. Kamau', class: 'Form 4', status: 'Pending', lastUpdated: 'N/A' },
    { id: 'sub-5', examId: 'ex-2', subject: 'Chemistry Practical', teacher: 'Ms. Wanjiku', class: 'Form 4', status: 'Approved', lastUpdated: '2024-07-25' },
]

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


const gradingScale = [
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
    const [clientReady, setClientReady] = React.useState(false);

    React.useEffect(() => {
        setClientReady(true);
    }, []);

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <div className="mb-6">
                <h1 className="font-headline text-3xl font-bold flex items-center gap-2">
                <FileText className="h-8 w-8 text-primary" />
                Grades &amp; Exams Management
                </h1>
                <p className="text-muted-foreground">Oversee school-wide examination schedules, grade analysis, and reporting.</p>
            </div>

            <Tabs defaultValue="schedules">
                <TabsList className="grid w-full grid-cols-4 md:w-auto md:inline-flex mb-6">
                    <TabsTrigger value="schedules">Exam Schedules</TabsTrigger>
                    <TabsTrigger value="submissions">Submission Status</TabsTrigger>
                    <TabsTrigger value="analysis">Grade Analysis</TabsTrigger>
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
                                     <Button disabled>
                                        <PlusCircle className="mr-2 h-4 w-4"/>
                                        Create Exam
                                    </Button>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="outline">
                                                <FileDown className="mr-2 h-4 w-4"/>
                                                Export
                                                <ChevronDown className="ml-2 h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent>
                                            <DropdownMenuItem disabled>Export Schedule (PDF)</DropdownMenuItem>
                                            <DropdownMenuItem disabled>Export to Calendar (.ics)</DropdownMenuItem>
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
                                        <SelectItem value="term2-2024">Term 2, 2024</SelectItem>
                                        <SelectItem value="term1-2024">Term 1, 2024</SelectItem>
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
                                        {mockExams.map(exam => (
                                            <TableRow key={exam.id}>
                                                <TableCell className="font-medium">{exam.title}</TableCell>
                                                <TableCell>{exam.term}</TableCell>
                                                <TableCell>{exam.classes}</TableCell>
                                                <TableCell>
                                                    {clientReady && `${new Date(exam.startDate).toLocaleDateString()} - ${new Date(exam.endDate).toLocaleDateString()}`}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge className={`${statusColors[exam.status]} text-white`}>{exam.status}</Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button variant="ghost" size="sm" disabled>View Details</Button>
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
                                        <DropdownMenuItem disabled>
                                            <CheckCircle className="mr-2 h-4 w-4" />
                                            Approve All Submitted
                                        </DropdownMenuItem>
                                         <DropdownMenuItem disabled>
                                            <BookCheck className="mr-2 h-4 w-4" />
                                            Publish All Approved Grades
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem disabled>
                                            <Send className="mr-2 h-4 w-4" />
                                            Send Submission Reminders
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                            <div className="mt-4 flex flex-col md:flex-row md:items-center gap-4">
                                <div className="grid w-full md:w-auto gap-1.5">
                                    <Label htmlFor="exam-filter">Exam</Label>
                                    <Select defaultValue="ex-1">
                                        <SelectTrigger id="exam-filter" className="w-full md:w-auto">
                                            <SelectValue placeholder="Filter by exam" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {mockExams.map(exam => <SelectItem key={exam.id} value={exam.id}>{exam.title}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                 <div className="grid w-full md:w-auto gap-1.5">
                                    <Label htmlFor="class-filter">Class</Label>
                                    <Select defaultValue="f4">
                                        <SelectTrigger id="class-filter" className="w-full md:w-auto">
                                            <SelectValue placeholder="Filter by class" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="f4">Form 4</SelectItem>
                                            <SelectItem value="f3">Form 3</SelectItem>
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
                                        {mockSubmissions.filter(s => s.examId === 'ex-1' && s.class === 'Form 4').map(submission => (
                                            <TableRow key={submission.id}>
                                                <TableCell className="font-medium">{submission.subject}</TableCell>
                                                <TableCell>{submission.teacher}</TableCell>
                                                <TableCell>{getSubmissionStatusBadge(submission.status)}</TableCell>
                                                <TableCell>{clientReady && submission.lastUpdated !== 'N/A' ? new Date(submission.lastUpdated).toLocaleDateString() : 'N/A'}</TableCell>
                                                <TableCell className="text-right">
                                                    <Button variant="outline" size="sm" disabled={submission.status === 'Pending'}>
                                                        View Grades
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
                <TabsContent value="analysis">
                     <Card>
                        <CardHeader>
                            <CardTitle>Grade Analysis</CardTitle>
                            <CardDescription>Analyze school-wide academic performance trends.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex h-[400px] w-full items-center justify-center rounded-lg border-2 border-dashed border-muted">
                                <div className="text-center text-muted-foreground">
                                    <BarChart2 className="mx-auto h-12 w-12" />
                                    <h3 className="mt-4 text-lg font-semibold">Performance Analysis Coming Soon</h3>
                                    <p className="mt-1 text-sm">Cross-subject and cross-term performance charts will be available here.</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
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
                                        <Input value={item.grade} className="w-16 font-bold" readOnly />
                                        <Input type="number" value={item.min} readOnly className="w-20" />
                                        <span>-</span>
                                        <Input type="number" value={item.max} readOnly className="w-20" />
                                        <Button variant="ghost" size="icon" disabled>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                                </div>
                            </CardContent>
                            <CardFooter className="flex justify-between">
                                <Button variant="outline" disabled>
                                    <PlusCircle className="mr-2 h-4 w-4"/>
                                    Add Row
                                </Button>
                                <Button disabled>
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
                                    <div className="flex h-[150px] w-full items-center justify-center rounded-lg border-2 border-dashed border-muted">
                                        <div className="text-center text-muted-foreground">
                                            <p>Template management coming soon.</p>
                                        </div>
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
                                        <Switch id="gpa-switch" disabled />
                                        <Label htmlFor="gpa-switch">Enable GPA on reports</Label>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );

    