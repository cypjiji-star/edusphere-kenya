
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


type Exam = {
    id: string;
    title: string;
    class: string;
    subject: string;
    date: Date;
    duration: number; // in minutes
    type: 'CAT' | 'Midterm' | 'Final' | 'Practical';
};

const mockExams: Exam[] = [
    { id: 'exm-001', title: 'Term 2 Midterm Exam', class: 'Form 4', subject: 'Mathematics', date: new Date('2024-07-15'), duration: 120, type: 'Midterm' },
    { id: 'exm-002', title: 'CAT 1', class: 'Form 4', subject: 'Chemistry', date: new Date('2024-06-20'), duration: 45, type: 'CAT' },
    { id: 'exm-003', title: 'End of Term Practical', class: 'Form 3', subject: 'Physics', date: new Date('2024-08-01'), duration: 90, type: 'Practical' },
    { id: 'exm-004', title: 'Term 1 Final Exam', class: 'Form 2', subject: 'English', date: new Date('2024-04-10'), duration: 150, type: 'Final' },
];

const mockClasses = ['Form 1', 'Form 2', 'Form 3', 'Form 4'];
const mockSubjects = ['Mathematics', 'English', 'Kiswahili', 'Chemistry', 'Physics', 'Biology', 'History', 'Geography', 'CRE', 'Business Studies', 'Computer Science'];
const examTypes: Exam['type'][] = ['CAT', 'Midterm', 'Final', 'Practical'];
const mockStudents = [
    { id: 'stu-001', name: 'John Doe', admNo: '1234', avatarUrl: 'https://picsum.photos/seed/student1/100', scores: { Mathematics: 85, English: 72, Chemistry: 65, Physics: 78, Biology: 81 } },
    { id: 'stu-002', name: 'Jane Smith', admNo: '1235', avatarUrl: 'https://picsum.photos/seed/student2/100', scores: { Mathematics: 92, English: 88, Chemistry: 75, Physics: 85, Biology: 90 } },
    { id: 'stu-003', name: 'Peter Jones', admNo: '1236', avatarUrl: 'https://picsum.photos/seed/student3/100', scores: { Mathematics: 65, English: 58, Chemistry: 50, Physics: 61, Biology: 55 } },
    { id: 'stu-004', name: 'Mary Anne', admNo: '1237', avatarUrl: 'https://picsum.photos/seed/student4/100', scores: { Mathematics: 98, English: 95, Chemistry: 91, Physics: 89, Biology: 94 } },
];
const gradebookSubjects = ['Mathematics', 'English', 'Chemistry', 'Physics', 'Biology'];

const mockPendingGrades = [
    { id: 'grd-001', studentName: 'John Doe', admNo: '1234', class: 'Form 4', subject: 'Mathematics', score: 85, enteredBy: 'Mr. Otieno' },
    { id: 'grd-002', studentName: 'Jane Smith', admNo: '1235', class: 'Form 4', subject: 'Mathematics', score: 92, enteredBy: 'Mr. Otieno' },
    { id: 'grd-003', studentName: 'Peter Jones', admNo: '1236', avatarUrl: 'https://picsum.photos/seed/student3/100', scores: { Mathematics: 65, English: 58, Chemistry: 50, Physics: 61, Biology: 55 } },
];

const mockGradeLog = [
    { id: 'log-001', timestamp: '2024-07-29 10:05 AM', user: 'Mr. Otieno', student: 'John Doe (1234)', action: 'Entered grade', details: 'Maths Midterm: 85' },
    { id: 'log-002', timestamp: '2024-07-29 10:06 AM', user: 'Mr. Otieno', student: 'Jane Smith (1235)', action: 'Entered grade', details: 'Maths Midterm: 92' },
    { id: 'log-003', timestamp: '2024-07-29 11:30 AM', user: 'Ms. Wanjiku (HOD)', student: 'John Doe (1234)', action: 'Approved grade', details: 'Maths Midterm: 85' },
];

const mockRanking = [
    { position: 1, name: 'Mary Anne', admNo: '1237', total: 467, avg: 93.4, grade: 'A' },
    { position: 2, name: 'Jane Smith', admNo: '1235', total: 435, avg: 87.0, grade: 'A-' },
    { position: 3, name: 'John Doe', admNo: '1234', total: 381, avg: 76.2, grade: 'B+' },
    { position: 4, name: 'Peter Jones', admNo: '1236', total: 289, avg: 57.8, grade: 'C' },
];

const subjectPerformanceData = [
  { subject: 'Maths', average: 85 },
  { subject: 'Eng', average: 78 },
  { subject: 'Chem', average: 70 },
  { subject: 'Phy', average: 78 },
  { subject: 'Bio', average: 80 },
];
const chartConfig = {
  average: {
    label: "Average",
    color: "hsl(var(--primary))",
  },
} satisfies React.ComponentProps<typeof ChartContainer>["config"];

export default function AdminGradesPage() {
    const searchParams = useSearchParams();
    const schoolId = searchParams.get('schoolId');
    const [exams, setExams] = React.useState(mockExams);
    const [isCreateDialogOpen, setIsCreateDialogOpen] = React.useState(false);

    if (!schoolId) {
        return <div className="p-8">Error: School ID is missing from URL.</div>
    }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
       <div className="mb-6">
        <h1 className="font-headline text-3xl font-bold flex items-center gap-2"><FileText className="h-8 w-8 text-primary"/>Grades & Exams</h1>
        <p className="text-muted-foreground">Manage exams, grades, and academic reports.</p>
       </div>
        <div className="grid gap-6 md:grid-cols-3 mb-6">
            <Card>
                <CardHeader className="pb-2">
                    <CardDescription>Total Exams Created</CardDescription>
                    <CardTitle className="text-4xl">12</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-xs text-muted-foreground">
                        5 this term, 7 past terms
                    </div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="pb-2">
                    <CardDescription>Pending Grading</CardDescription>
                    <CardTitle className="text-4xl text-yellow-500 flex items-center gap-2">
                        <AlertTriangle/>
                        3
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
                <TabsTrigger value="reports">Reports & Analytics</TabsTrigger>
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
                                        <Input id="exam-title" placeholder="e.g., Form 4 Midterm Exam" />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="exam-class">Class</Label>
                                            <Select><SelectTrigger><SelectValue placeholder="Select a class"/></SelectTrigger><SelectContent>{mockClasses.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="exam-subject">Subject</Label>
                                            <Select><SelectTrigger><SelectValue placeholder="Select a subject"/></SelectTrigger><SelectContent>{mockSubjects.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="exam-date">Date</Label>
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <Button variant="outline" className="w-full justify-start font-normal">
                                                        <CalendarIcon className="mr-2 h-4 w-4"/>
                                                        <span>Pick a date</span>
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-auto p-0"><Calendar mode="single" initialFocus/></PopoverContent>
                                            </Popover>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="exam-duration">Duration (minutes)</Label>
                                            <Input id="exam-duration" type="number" placeholder="e.g., 120" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="exam-type">Type</Label>
                                            <Select><SelectTrigger><SelectValue placeholder="Select a type"/></SelectTrigger><SelectContent>{examTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select>
                                        </div>
                                    </div>
                                    <Separator/>
                                    <div className="space-y-4">
                                        <h4 className="font-medium text-sm">Advanced Options</h4>
                                        <div className="flex items-center justify-between rounded-lg border p-3">
                                            <div>
                                                <Label>Schedule Exam</Label>
                                                <p className="text-xs text-muted-foreground">Add this exam to the school timetable and notify students.</p>
                                            </div>
                                            <Button variant="secondary" size="sm" disabled><Clock className="mr-2 h-4 w-4"/>Schedule</Button>
                                        </div>
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
                                    <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                                    <Button>Create Exam</Button>
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
                                            <TableCell>{format(exam.date, 'PPP')}</TableCell>
                                            <TableCell><Badge variant="outline">{exam.type}</Badge></TableCell>
                                            <TableCell className="text-right space-x-2">
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
                                <SelectContent>
                                    {mockClasses.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                </SelectContent>
                            </Select>
                            <Select>
                                <SelectTrigger className="w-full md:w-[240px]">
                                    <SelectValue placeholder="Select an Exam"/>
                                </SelectTrigger>
                                <SelectContent>
                                    {mockExams.map(e => <SelectItem key={e.id} value={e.id}>{e.title}</SelectItem>)}
                                </SelectContent>
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
                                            <TableHead key={sub} className="text-center">{sub.substring(0,3).toUpperCase()}</TableHead>
                                        ))}
                                        <TableHead className="text-right font-bold">Total</TableHead>
                                        <TableHead className="text-right font-bold">Grade</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {mockStudents.map(student => {
                                        const total = Object.values(student.scores).reduce((a, b) => a + b, 0);
                                        const mean = total / Object.keys(student.scores).length;
                                        const grade = mean >= 80 ? 'A' : mean >= 65 ? 'B' : 'C';

                                        return (
                                        <TableRow key={student.id}>
                                            <TableCell>
                                                 <div className="flex items-center gap-3">
                                                    <Avatar className="h-9 w-9">
                                                        <AvatarImage src={student.avatarUrl} alt={student.name} />
                                                        <AvatarFallback>{student.name.charAt(0)}</AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <span className="font-medium">{student.name}</span>
                                                        <p className="text-xs text-muted-foreground">Adm: {student.admNo}</p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                             {gradebookSubjects.map(sub => (
                                                <TableCell key={sub} className="text-center">{student.scores[sub as keyof typeof student.scores] || '—'}</TableCell>
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
                                    {mockPendingGrades.map(grade => (
                                        <TableRow key={grade.id}>
                                            <TableCell>{grade.studentName} ({grade.admNo})</TableCell>
                                            <TableCell>{grade.subject}</TableCell>
                                            <TableCell className="font-semibold flex items-center gap-2">
                                                {grade.score}
                                                {grade.flagged && <AlertTriangle className="h-4 w-4 text-destructive" title="Flagged: Abnormal score"/>}
                                            </TableCell>
                                            <TableCell>{grade.enteredBy}</TableCell>
                                            <TableCell className="text-right space-x-2">
                                                <Button variant="outline" size="sm" className="text-green-600 border-green-600 hover:bg-green-50 hover:text-green-700">
                                                    <Check className="mr-2 h-4 w-4"/>Approve
                                                </Button>
                                                <Button variant="outline" size="sm" className="text-red-600 border-red-600 hover:bg-red-50 hover:text-red-700">
                                                    <X className="mr-2 h-4 w-4"/>Reject
                                                </Button>
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
                                        <TableHead>Student</TableHead>
                                        <TableHead>Details</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {mockGradeLog.map(log => (
                                        <TableRow key={log.id}>
                                            <TableCell className="text-xs text-muted-foreground">{log.timestamp}</TableCell>
                                            <TableCell className="font-medium">{log.user}</TableCell>
                                            <TableCell><Badge variant="secondary">{log.action}</Badge></TableCell>
                                            <TableCell>{log.student}</TableCell>
                                            <TableCell className="text-sm text-muted-foreground italic">"{log.details}"</TableCell>
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
                    <CardHeader>
                         <CardTitle>Reports & Analytics</CardTitle>
                        <CardDescription>Generate reports and analyze academic performance.</CardDescription>
                        <div className="pt-4 flex flex-col md:flex-row md:items-center gap-4">
                             <Select defaultValue="form-4">
                                <SelectTrigger className="w-full md:w-[240px]">
                                    <SelectValue placeholder="Select a Class"/>
                                </SelectTrigger>
                                <SelectContent>
                                    {mockClasses.map(c => <SelectItem key={c} value={c.replace(' ','-').toLowerCase()}>{c}</SelectItem>)}
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
                                <Button variant="secondary"><Printer className="mr-2 h-4 w-4"/>Print Class Results</Button>
                                <Button variant="secondary"><Download className="mr-2 h-4 w-4"/>Download Report Cards</Button>
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
                                            <TableHead>Name</TableHead>
                                            <TableHead className="text-right">Total</TableHead>
                                            <TableHead className="text-right">Average</TableHead>
                                            <TableHead className="text-right">Grade</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {mockRanking.map(student => (
                                            <TableRow key={student.admNo}>
                                                <TableCell className="font-bold">{student.position}</TableCell>
                                                <TableCell>{student.name}</TableCell>
                                                <TableCell className="text-right">{student.total}</TableCell>
                                                <TableCell className="text-right">{student.avg.toFixed(1)}</TableCell>
                                                <TableCell className="text-right"><Badge>{student.grade}</Badge></TableCell>
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
                                    <p className="text-2xl font-bold">76.7%</p>
                                </div>
                                <div className="p-4 bg-muted/50 rounded-lg">
                                    <p className="text-xs text-muted-foreground">Pass Rate</p>
                                    <p className="text-2xl font-bold">100%</p>
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
