
'use client';

import * as React from 'react';
import { format } from 'date-fns';
import { DateRange } from 'react-day-picker';
import { Bar, BarChart, CartesianGrid, XAxis, ResponsiveContainer } from 'recharts';

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
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import {
  ClipboardCheck,
  CalendarIcon,
  Search,
  Filter,
  FileDown,
  ChevronDown,
  Percent,
  UserCheck,
  UserX,
  TrendingUp,
  AlertTriangle,
  Send,
  Lock,
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';

type AttendanceStatus = 'Present' | 'Absent' | 'Late';

type AttendanceRecord = {
  id: string;
  studentName: string;
  studentAvatar: string;
  class: string;
  teacher: string;
  date: string;
  status: AttendanceStatus;
};

// --- Mock Data ---

const MOCK_RECORDS: AttendanceRecord[] = [
  { id: 'rec-1', studentName: 'Student 1', studentAvatar: 'https://picsum.photos/seed/f4-student1/100', class: 'Form 4', teacher: 'Ms. Wanjiku', date: '2024-07-18', status: 'Absent' },
  { id: 'rec-2', studentName: 'Student 2', studentAvatar: 'https://picsum.photos/seed/f4-student2/100', class: 'Form 4', teacher: 'Ms. Wanjiku', date: '2024-07-18', status: 'Present' },
  { id: 'rec-3', studentName: 'Student 32', studentAvatar: 'https://picsum.photos/seed/f3-student1/100', class: 'Form 3', teacher: 'Mr. Otieno', date: '2024-07-18', status: 'Late' },
  { id: 'rec-4', studentName: 'Student 33', studentAvatar: 'https://picsum.photos/seed/f3-student2/100', class: 'Form 3', teacher: 'Mr. Otieno', date: '2024-07-17', status: 'Present' },
  { id: 'rec-5', studentName: 'Student 60', studentAvatar: 'https://picsum.photos/seed/f2-student1/100', class: 'Form 2', teacher: 'Ms. Njeri', date: '2024-07-17', status: 'Absent' },
  { id: 'rec-6', studentName: 'Student 61', studentAvatar: 'https://picsum.photos/seed/f2-student2/100', class: 'Form 2', teacher: 'Ms. Njeri', date: '2024-07-16', status: 'Present' },
  { id: 'rec-7', studentName: 'Student 62', studentAvatar: 'https://picsum.photos/seed/f2-student3/100', class: 'Form 2', teacher: 'Ms. Njeri', date: '2024-07-16', status: 'Present' },
  { id: 'rec-8', studentName: 'Student 3', studentAvatar: 'https://picsum.photos/seed/f4-student3/100', class: 'Form 4', teacher: 'Ms. Wanjiku', date: '2024-07-15', status: 'Present' },
];

const classes = ['All Classes', 'Form 4', 'Form 3', 'Form 2', 'Form 1'];
const teachers = ['All Teachers', 'Ms. Wanjiku', 'Mr. Otieno', 'Ms. Njeri'];
const statuses: (AttendanceStatus | 'All Statuses')[] = ['All Statuses', 'Present', 'Absent', 'Late'];

const getStatusBadge = (status: AttendanceStatus) => {
    switch (status) {
        case 'Present': return <Badge variant="default" className="bg-green-600 hover:bg-green-700">Present</Badge>;
        case 'Absent': return <Badge variant="destructive">Absent</Badge>;
        case 'Late': return <Badge variant="secondary" className="bg-yellow-500 text-white hover:bg-yellow-600">Late</Badge>;
    }
}

const dailyTrendData = [
  { date: 'Jul 15', rate: 95 },
  { date: 'Jul 16', rate: 92 },
  { date: 'Jul 17', rate: 88 },
  { date: 'Jul 18', rate: 91 },
  { date: 'Jul 19', rate: 94 },
];

const lowAttendanceAlerts = [
    { class: 'Form 2', teacher: 'Ms. Njeri', rate: 68 },
    { class: 'Form 1', teacher: 'Mr. Kamau', rate: 65 },
]

const chartConfig = {
    rate: { label: 'Attendance Rate', color: 'hsl(var(--primary))' },
} satisfies React.ComponentProps<typeof ChartContainer>['config'];

function LowAttendanceAlerts() {
    const { toast } = useToast();

    const handleSendReminder = (teacher: string) => {
        toast({
            title: 'Reminder Sent',
            description: `A reminder notification has been sent to ${teacher}.`,
        });
    }

    return (
        <Card className="border-red-500/50">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-600">
                    <AlertTriangle className="h-6 w-6"/>
                    Low Attendance Alerts
                </CardTitle>
                 <CardDescription>Classes with attendance below 70% in the selected period.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {lowAttendanceAlerts.map(alert => (
                    <div key={alert.class} className="flex items-center justify-between p-3 rounded-lg bg-red-500/10">
                        <div>
                            <p className="font-bold">{alert.class} <span className="text-red-600">({alert.rate}%)</span></p>
                            <p className="text-sm text-muted-foreground">{alert.teacher}</p>
                        </div>
                         <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="secondary" size="sm" onClick={() => handleSendReminder(alert.teacher)}>
                                        <Send className="mr-2 h-4 w-4"/>
                                        Send Reminder
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Send a reminder to the class teacher.</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>
                ))}
            </CardContent>
        </Card>
    )
}

export default function AdminAttendancePage() {
  const [date, setDate] = React.useState<DateRange | undefined>();
  const [searchTerm, setSearchTerm] = React.useState('');
  const [classFilter, setClassFilter] = React.useState('All Classes');
  const [teacherFilter, setTeacherFilter] = React.useState('All Teachers');
  const [statusFilter, setStatusFilter] = React.useState<AttendanceStatus | 'All Statuses'>('All Statuses');

  React.useEffect(() => {
    setDate({
        from: new Date(),
        to: new Date()
    })
  }, [])

  const filteredRecords = MOCK_RECORDS.filter(record => {
      const recordDate = new Date(record.date);
      const isDateInRange = date?.from && date?.to ? recordDate >= date.from && recordDate <= date.to : true;
      const matchesSearch = record.studentName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesClass = classFilter === 'All Classes' || record.class === classFilter;
      const matchesTeacher = teacherFilter === 'All Teachers' || record.teacher === teacherFilter;
      const matchesStatus = statusFilter === 'All Statuses' || record.status === statusFilter;

      return isDateInRange && matchesSearch && matchesClass && matchesTeacher && matchesStatus;
  });
  
  const summaryStats = {
      present: filteredRecords.filter(r => r.status === 'Present').length,
      absent: filteredRecords.filter(r => r.status === 'Absent').length,
      late: filteredRecords.filter(r => r.status === 'Late').length,
  }
  const totalRecords = filteredRecords.length;
  const attendanceRate = totalRecords > 0 ? Math.round(((summaryStats.present + summaryStats.late) / totalRecords) * 100) : 0;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="mb-2">
        <h1 className="font-headline text-3xl font-bold flex items-center gap-2">
          <ClipboardCheck className="h-8 w-8 text-primary" />
          Attendance Records
        </h1>
        <p className="text-muted-foreground">View and export attendance data for the entire school.</p>
      </div>
      
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
            <CardHeader>
                <CardTitle>Attendance Summary</CardTitle>
                <CardDescription>
                    Summary for the selected period: {date?.from && format(date.from, 'LLL dd, y')}
                    {date?.to && date.from?.getTime() !== date.to?.getTime() ? ` - ${format(date.to, 'LLL dd, y')}` : ''}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid gap-6 sm:grid-cols-3">
                    <button className="w-full text-left" onClick={() => setStatusFilter('All Statuses')}>
                        <Card className="hover:bg-muted/50 transition-colors h-full">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Overall Attendance Rate</CardTitle>
                                <Percent className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{attendanceRate}%</div>
                                <p className="text-xs text-muted-foreground">{summaryStats.present + summaryStats.late} of {totalRecords} students</p>
                            </CardContent>
                        </Card>
                    </button>
                    <button className="w-full text-left" onClick={() => setStatusFilter('Absent')}>
                        <Card className="hover:bg-muted/50 transition-colors h-full">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Absences</CardTitle>
                                <UserX className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{summaryStats.absent}</div>
                                <p className="text-xs text-muted-foreground">students marked absent</p>
                            </CardContent>
                        </Card>
                    </button>
                    <button className="w-full text-left" onClick={() => setStatusFilter('Late')}>
                        <Card className="hover:bg-muted/50 transition-colors h-full">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Late Arrivals</CardTitle>
                                <UserCheck className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{summaryStats.late}</div>
                                <p className="text-xs text-muted-foreground">students marked late</p>
                            </CardContent>
                        </Card>
                    </button>
                </div>
            </CardContent>
        </Card>
        <LowAttendanceAlerts />
      </div>


       <Card>
            <CardHeader>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex items-center gap-2">
                         <TrendingUp className="h-6 w-6 text-primary" />
                        <div>
                            <CardTitle>Attendance Trends</CardTitle>
                            <CardDescription>Daily attendance rate for the selected period.</CardDescription>
                        </div>
                    </div>
                     <div className="flex w-full md:w-auto items-center gap-2">
                         <Select defaultValue="term2">
                            <SelectTrigger className="w-full md:w-auto">
                                <SelectValue placeholder="Select term" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="term2">Term 2, 2024</SelectItem>
                                <SelectItem value="term1">Term 1, 2024</SelectItem>
                            </SelectContent>
                         </Select>
                         <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                     <Button variant="outline">Compare</Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Term comparison feature is coming soon.</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <ChartContainer config={chartConfig} className="h-[250px] w-full">
                    <BarChart data={dailyTrendData}>
                        <CartesianGrid vertical={false} />
                        <XAxis
                        dataKey="date"
                        tickLine={false}
                        tickMargin={10}
                        axisLine={false}
                        />
                        <ChartTooltip
                        cursor={false}
                        content={<ChartTooltipContent indicator="dot" />}
                        />
                        <Bar dataKey="rate" fill="var(--color-rate)" radius={8} />
                    </BarChart>
                </ChartContainer>
            </CardContent>
        </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="relative w-full md:max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Search by student name..."
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
                                <label className="text-sm font-medium">Class</label>
                                <Select value={classFilter} onValueChange={setClassFilter}>
                                    <SelectTrigger><SelectValue/></SelectTrigger>
                                    <SelectContent>
                                        {classes.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
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
                                <label className="text-sm font-medium">Status</label>
                                <Select value={statusFilter} onValueChange={(v: AttendanceStatus | 'All Statuses') => setStatusFilter(v)}>
                                    <SelectTrigger><SelectValue/></SelectTrigger>
                                    <SelectContent>
                                        {statuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
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
                {classFilter !== 'All Classes' && <Badge variant="secondary" className="cursor-pointer" onClick={() => setClassFilter('All Classes')}>Class: {classFilter} &times;</Badge>}
                {teacherFilter !== 'All Teachers' && <Badge variant="secondary" className="cursor-pointer" onClick={() => setTeacherFilter('All Teachers')}>Teacher: {teacherFilter} &times;</Badge>}
                {statusFilter !== 'All Statuses' && <Badge variant="secondary" className="cursor-pointer" onClick={() => setStatusFilter('All Statuses')}>Status: {statusFilter} &times;</Badge>}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="w-full overflow-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Teacher</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRecords.length > 0 ? (
                  filteredRecords.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={record.studentAvatar} alt={record.studentName} />
                            <AvatarFallback>{record.studentName.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{record.studentName}</span>
                        </div>
                      </TableCell>
                      <TableCell>{record.class}</TableCell>
                      <TableCell>{record.teacher}</TableCell>
                      <TableCell>{record.date}</TableCell>
                      <TableCell>{getStatusBadge(record.status)}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      No records found for the selected filters.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
         <CardFooter>
            <div className="text-xs text-muted-foreground">
                Showing <strong>{filteredRecords.length}</strong> of <strong>{MOCK_RECORDS.length}</strong> records.
            </div>
        </CardFooter>
      </Card>
    </div>
  );
}
