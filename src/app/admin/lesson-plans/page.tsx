
'use client';

import * as React from 'react';
import { format } from 'date-fns';
import { DateRange } from 'react-day-picker';
import Link from 'next/link';

import { cn } from '@/lib/utils';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Calendar } from '@/components/ui/calendar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  BookOpen,
  CalendarIcon,
  Search,
  Filter,
  FileDown,
  ChevronDown,
  ArrowRight,
  Loader2,
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LessonPlanCalendar } from './lesson-plan-calendar';
import { useSearchParams } from 'next/navigation';
import { firestore } from '@/lib/firebase';
import { collection, onSnapshot, query, Timestamp, where } from 'firebase/firestore';


type LessonPlanStatus = 'Published' | 'Draft' | 'Completed' | 'In Progress' | 'Skipped';

type LessonPlan = {
  id: string;
  topic: string;
  teacher: {
    name: string;
    avatarUrl: string;
  };
  class: string;
  subject: string;
  date: Timestamp;
  status: LessonPlanStatus;
};

const getStatusBadge = (status: LessonPlanStatus) => {
    switch (status) {
        case 'Published': return <Badge variant="default" className="bg-blue-500 hover:bg-blue-600 text-white">Published</Badge>;
        case 'Draft': return <Badge variant="secondary">Draft</Badge>;
        case 'Completed': return <Badge variant="default" className="bg-green-600 hover:bg-green-700 text-white">Completed</Badge>;
        case 'In Progress': return <Badge variant="secondary" className="bg-yellow-500 text-white hover:bg-yellow-600">In Progress</Badge>;
        case 'Skipped': return <Badge variant="destructive" className="bg-red-500 text-white hover:bg-red-600">Skipped</Badge>;
    }
}


export default function AdminLessonPlansPage() {
  const searchParams = useSearchParams();
  const schoolId = searchParams.get('schoolId');
  const [lessonPlans, setLessonPlans] = React.useState<LessonPlan[]>([]);
  const [teachers, setTeachers] = React.useState<string[]>(['All Teachers']);
  const [classes, setClasses] = React.useState<string[]>(['All Classes']);
  const [subjects, setSubjects] = React.useState<string[]>(['All Subjects']);
  const [isLoading, setIsLoading] = React.useState(true);

  const [date, setDate] = React.useState<DateRange | undefined>();
  const [searchTerm, setSearchTerm] = React.useState('');
  const [teacherFilter, setTeacherFilter] = React.useState('All Teachers');
  const [classFilter, setClassFilter] = React.useState('All Classes');
  const [subjectFilter, setSubjectFilter] = React.useState('All Subjects');
  const [clientReady, setClientReady] = React.useState(false);

  React.useEffect(() => {
    if (!schoolId) {
      setIsLoading(false);
      return;
    };

    setClientReady(true);
    setIsLoading(true);

    const plansUnsub = onSnapshot(query(collection(firestore, `schools/${schoolId}/lesson-plans`)), (snapshot) => {
        setLessonPlans(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as LessonPlan)));
        setIsLoading(false);
    });

    const teachersUnsub = onSnapshot(query(collection(firestore, 'schools', schoolId, 'users'), where('role', '==', 'Teacher')), (snapshot) => {
        setTeachers(['All Teachers', ...snapshot.docs.map(d => d.data().name)]);
    });

    const classesUnsub = onSnapshot(collection(firestore, 'schools', schoolId, 'classes'), (snapshot) => {
        setClasses(['All Classes', ...snapshot.docs.map(d => `${d.data().name} ${d.data().stream || ''}`.trim())]);
    });
    
    const subjectsUnsub = onSnapshot(collection(firestore, 'schools', schoolId, 'subjects'), (snapshot) => {
        setSubjects(['All Subjects', ...snapshot.docs.map(d => d.data().name)]);
    });

    return () => {
        plansUnsub();
        teachersUnsub();
        classesUnsub();
        subjectsUnsub();
    };

  }, [schoolId]);

  const filteredSubmissions = lessonPlans.filter(submission => {
      const recordDate = submission.date.toDate();
      const isDateInRange = date?.from && date?.to ? recordDate >= date.from && recordDate <= date.to : true;
      const matchesSearch = submission.topic.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesTeacher = teacherFilter === 'All Teachers' || submission.teacher.name === teacherFilter;
      const matchesClass = classFilter === 'All Classes' || submission.class === classFilter;
      const matchesSubject = subjectFilter === 'All Subjects' || submission.subject === subjectFilter;

      return isDateInRange && matchesSearch && matchesTeacher && matchesClass && matchesSubject;
  });

  if (!schoolId) {
    return <div className="p-8">Error: School ID is missing from URL.</div>
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="font-headline text-3xl font-bold flex items-center gap-2">
          <BookOpen className="h-8 w-8 text-primary" />
          Lesson Plan Submissions
        </h1>
        <p className="text-muted-foreground">Review and manage lesson plans submitted by all teachers.</p>
      </div>
      
      <Tabs defaultValue="list-view">
        <div className="flex items-center justify-between">
            <TabsList>
                <TabsTrigger value="list-view">List View</TabsTrigger>
                <TabsTrigger value="calendar-view">Calendar View</TabsTrigger>
            </TabsList>
        </div>
        <TabsContent value="list-view">
            <Card className="mt-4">
              <CardHeader>
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                      <div className="relative w-full md:max-w-sm">
                          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input
                              type="search"
                              placeholder="Search by topic or keyword..."
                              className="w-full bg-background pl-8"
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                          />
                      </div>
                      <div className="flex w-full flex-col gap-2 md:w-auto md:flex-row md:items-center">
                          <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                              <Button variant="outline" className="w-full md:w-auto">
                                  <Filter className="mr-2 h-4 w-4" />
                                  Filters
                                  <ChevronDown className="ml-2 h-4 w-4" />
                              </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="p-4 space-y-4 w-64">
                                  <div>
                                      <label className="text-sm font-medium">Teacher</label>
                                      <Select value={teacherFilter} onValueChange={setTeacherFilter}>
                                          <SelectTrigger><SelectValue/></SelectTrigger>
                                          <SelectContent>
                                              {teachers.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                                          </SelectContent>
                                      </Select>
                                  </div>
                                  <div>
                                      <label className="text-sm font-medium">Class</label>
                                      <Select value={classFilter} onValueChange={setClassFilter}>
                                          <SelectTrigger><SelectValue/></SelectTrigger>
                                          <SelectContent>
                                              {classes.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                          </SelectContent>
                                      </Select>
                                  </div>
                                  <div>
                                      <label className="text-sm font-medium">Subject</label>
                                      <Select value={subjectFilter} onValueChange={setSubjectFilter}>
                                          <SelectTrigger><SelectValue/></SelectTrigger>
                                          <SelectContent>
                                              {subjects.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                          </SelectContent>
                                      </Select>
                                  </div>
                              </DropdownMenuContent>
                          </DropdownMenu>

                          <Popover>
                              <PopoverTrigger asChild>
                              <Button
                                  id="date"
                                  variant="outline"
                                  className={cn('w-full justify-start text-left font-normal md:w-[300px]', !date && 'text-muted-foreground')}
                              >
                                  <CalendarIcon className="mr-2 h-4 w-4" />
                                  {date?.from ? (
                                  date.to ? `${format(date.from, 'LLL dd, y')} - ${format(date.to, 'LLL dd, y')}` : format(date.from, 'LLL dd, y')
                                  ) : <span>Pick a date range</span>}
                              </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="end">
                              <Calendar initialFocus mode="range" defaultMonth={date?.from} selected={date} onSelect={setDate} numberOfMonths={2} />
                              </PopoverContent>
                          </Popover>

                          <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                  <Button variant="secondary" className="w-full md:w-auto">
                                      Export
                                      <ChevronDown className="ml-2 h-4 w-4" />
                                  </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                  <DropdownMenuItem disabled><FileDown className="mr-2" />Export as PDF</DropdownMenuItem>
                                  <DropdownMenuItem disabled><FileDown className="mr-2" />Export as CSV</DropdownMenuItem>
                              </DropdownMenuContent>
                          </DropdownMenu>
                      </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                      {teacherFilter !== 'All Teachers' && <Badge variant="secondary" className="cursor-pointer" onClick={() => setTeacherFilter('All Teachers')}>Teacher: {teacherFilter} &times;</Badge>}
                      {classFilter !== 'All Classes' && <Badge variant="secondary" className="cursor-pointer" onClick={() => setClassFilter('All Classes')}>Class: {classFilter} &times;</Badge>}
                      {subjectFilter !== 'All Subjects' && <Badge variant="secondary" className="cursor-pointer" onClick={() => setSubjectFilter('All Subjects')}>Subject: {subjectFilter} &times;</Badge>}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                    <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>
                ) : (
                <div className="w-full overflow-auto rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Lesson Topic</TableHead>
                        <TableHead>Teacher</TableHead>
                        <TableHead>Class & Subject</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredSubmissions.length > 0 ? (
                        filteredSubmissions.map((submission) => (
                          <TableRow key={submission.id}>
                            <TableCell className="font-medium">{submission.topic}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <Avatar className="h-8 w-8">
                                  <AvatarImage src={submission.teacher.avatarUrl} alt={submission.teacher.name} />
                                  <AvatarFallback>{submission.teacher.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <span>{submission.teacher.name}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                                <div>{submission.class}</div>
                                <div className="text-sm text-muted-foreground">{submission.subject}</div>
                            </TableCell>
                            <TableCell>{clientReady ? new Date(submission.date.toDate()).toLocaleDateString() : ''}</TableCell>
                            <TableCell>{getStatusBadge(submission.status)}</TableCell>
                            <TableCell className="text-right">
                                <Button asChild variant="outline" size="sm">
                                  <Link href={`/admin/lesson-plans/${submission.id}?schoolId=${schoolId}`}>
                                      View Plan
                                      <ArrowRight className="ml-2 h-4 w-4" />
                                  </Link>
                                </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={6} className="h-24 text-center">
                            No lesson plans found for the selected filters.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
                )}
              </CardContent>
              <CardFooter>
                  <div className="text-xs text-muted-foreground">
                      Showing <strong>{filteredSubmissions.length}</strong> of <strong>{lessonPlans.length}</strong> total lesson plans.
                  </div>
              </CardFooter>
            </Card>
        </TabsContent>
        <TabsContent value="calendar-view">
             <Card className="mt-4">
                <CardHeader>
                    <CardTitle>Lesson Plan Calendar</CardTitle>
                    <CardDescription>A monthly overview of all scheduled lesson plans.</CardDescription>
                </CardHeader>
                <CardContent>
                    <LessonPlanCalendar lessonPlans={lessonPlans} />
                </CardContent>
             </Card>
        </TabsContent>
      </Tabs>
    </div>
  );

    
