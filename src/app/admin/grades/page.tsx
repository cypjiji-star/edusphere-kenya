
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
  BarChart,
  AlertTriangle,
  CalendarIcon,
  ChevronDown,
  Clock,
  Trash2,
  Edit,
  Save,
  Copy,
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
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-6">
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
        </div>

        <Card>
            <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div>
                    <CardTitle>Exam Management</CardTitle>
                    <CardDescription>Create, schedule, and manage all school examinations.</CardDescription>
                </div>
                 <div className="flex gap-2 mt-4 md:mt-0">
                    <Button variant="outline" disabled>
                        <Upload className="mr-2 h-4 w-4" />
                        Upload Marks
                    </Button>
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
    </div>
  );
}
