
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
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';


type ExamStatus = 'Scheduled' | 'In Progress' | 'Completed' | 'Grading';

type Exam = {
    id: string;
    title: string;
    term: string;
    classes: string;
    startDate: string;
    endDate: string;
    status: ExamStatus;
};

const mockExams: Exam[] = [
    { id: 'ex-1', title: 'Term 2 Mid-Term Exams', term: 'Term 2, 2024', classes: 'All Classes', startDate: '2024-07-29', endDate: '2024-08-02', status: 'Scheduled' },
    { id: 'ex-2', title: 'Form 4 Chemistry Practical', term: 'Term 2, 2024', classes: 'Form 4', startDate: '2024-07-22', endDate: '2024-07-22', status: 'Grading' },
    { id: 'ex-3', title: 'Term 1 Final Exams', term: 'Term 1, 2024', classes: 'All Classes', startDate: '2024-04-15', endDate: '2024-04-19', status: 'Completed' },
];

const statusColors: Record<ExamStatus, string> = {
    'Scheduled': 'bg-blue-500',
    'In Progress': 'bg-yellow-500',
    'Completed': 'bg-green-600',
    'Grading': 'bg-purple-500',
};

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
                <TabsList className="grid w-full grid-cols-3 md:w-auto md:inline-flex mb-6">
                    <TabsTrigger value="schedules">Exam Schedules</TabsTrigger>
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
                    <Card>
                        <CardHeader>
                            <CardTitle>Settings &amp; Policies</CardTitle>
                            <CardDescription>Manage school-wide grading scales, report card templates, and GPA calculations.</CardDescription>
                        </CardHeader>
                        <CardContent>
                           <div className="flex h-[400px] w-full items-center justify-center rounded-lg border-2 border-dashed border-muted">
                                <div className="text-center text-muted-foreground">
                                    <Settings className="mx-auto h-12 w-12" />
                                    <h3 className="mt-4 text-lg font-semibold">Grading Policy Management Coming Soon</h3>
                                    <p className="mt-1 text-sm">Controls for setting grading scales and report card formats will be here.</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
