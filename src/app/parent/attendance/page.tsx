
'use client';

import * as React from 'react';
import { format } from 'date-fns';
import { DateRange } from 'react-day-picker';

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
import { Calendar } from '@/components/ui/calendar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  ClipboardCheck,
  CalendarIcon,
  User,
  Percent,
  UserCheck,
  UserX,
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';

type AttendanceStatus = 'Present' | 'Absent' | 'Late';

type AttendanceRecord = {
  id: string;
  studentId: string;
  date: string;
  status: AttendanceStatus;
  notes?: string;
};

// --- Mock Data ---

const MOCK_RECORDS: AttendanceRecord[] = [
  { id: 'rec-1', studentId: 'child-1', date: '2024-07-18', status: 'Present' },
  { id: 'rec-2', studentId: 'child-1', date: '2024-07-17', status: 'Present' },
  { id: 'rec-3', studentId: 'child-1', date: '2024-07-16', status: 'Late', notes: 'Arrived at 8:30 AM' },
  { id: 'rec-4', studentId: 'child-1', date: '2024-07-15', status: 'Absent', notes: 'Sick' },
  { id: 'rec-5', studentId: 'child-2', date: '2024-07-18', status: 'Present' },
  { id: 'rec-6', studentId: 'child-2', date: '2024-07-17', status: 'Present' },
  { id: 'rec-7', studentId: 'child-2', date: '2024-07-16', status: 'Present' },
];

const childrenData = [
    { id: 'child-1', name: 'John Doe', class: 'Form 4' },
    { id: 'child-2', name: 'Jane Doe', class: 'Form 1' },
];

const getStatusBadge = (status: AttendanceStatus) => {
    switch (status) {
        case 'Present': return <Badge variant="default" className="bg-green-600 hover:bg-green-700">Present</Badge>;
        case 'Absent': return <Badge variant="destructive">Absent</Badge>;
        case 'Late': return <Badge variant="secondary" className="bg-yellow-500 text-white hover:bg-yellow-600">Late</Badge>;
    }
}


export default function ParentAttendancePage() {
  const [selectedChild, setSelectedChild] = React.useState(childrenData[0].id);
  const [date, setDate] = React.useState<DateRange | undefined>();

  React.useEffect(() => {
    setDate({
      from: new Date(),
      to: new Date(),
    });
  }, []);

  const filteredRecords = MOCK_RECORDS.filter(record => {
      if (record.studentId !== selectedChild) return false;
      const recordDate = new Date(record.date);
      const isDateInRange = date?.from && date?.to ? recordDate >= date.from && recordDate <= date.to : true;
      return isDateInRange;
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
        <p className="text-muted-foreground">View attendance data for your child.</p>
      </div>

       <Card>
            <CardHeader>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <User className="h-5 w-5 text-primary"/>
                        <Select value={selectedChild} onValueChange={setSelectedChild}>
                            <SelectTrigger className="w-full md:w-[240px]">
                                <SelectValue placeholder="Select a child" />
                            </SelectTrigger>
                            <SelectContent>
                                {childrenData.map((child) => (
                                    <SelectItem key={child.id} value={child.id}>{child.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                     <div className="flex w-full md:w-auto items-center gap-2">
                         <Select defaultValue="this-week" disabled>
                            <SelectTrigger className="w-full md:w-auto">
                                <SelectValue placeholder="Select period" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="this-week">This Week</SelectItem>
                                <SelectItem value="this-month">This Month</SelectItem>
                                <SelectItem value="custom">Custom Range</SelectItem>
                            </SelectContent>
                         </Select>
                        <Popover>
                            <PopoverTrigger asChild>
                            <Button
                                id="date"
                                variant="outline"
                                className={cn('w-full justify-start text-left font-normal md:w-auto lg:min-w-[250px]', !date && 'text-muted-foreground')}
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
                         <Select defaultValue="daily">
                            <SelectTrigger className="w-full md:w-auto">
                                <SelectValue placeholder="Select view" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="daily">Daily View</SelectItem>
                                <SelectItem value="weekly" disabled>Weekly View</SelectItem>
                                <SelectItem value="monthly" disabled>Monthly View</SelectItem>
                            </SelectContent>
                         </Select>
                    </div>
                </div>
            </CardHeader>
        </Card>
      
        <div className="grid gap-6 md:grid-cols-3">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Overall Attendance</CardTitle>
                    <Percent className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{attendanceRate}%</div>
                    <p className="text-xs text-muted-foreground">For the selected period</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Absences</CardTitle>
                    <UserX className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{summaryStats.absent}</div>
                    <p className="text-xs text-muted-foreground">Days marked absent</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Late Arrivals</CardTitle>
                    <UserCheck className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{summaryStats.late}</div>
                    <p className="text-xs text-muted-foreground">Days marked late</p>
                </CardContent>
            </Card>
        </div>


      <Card>
        <CardHeader>
            <CardTitle>Attendance Log</CardTitle>
             <CardDescription>
                Daily attendance records for the selected period.
            </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="w-full overflow-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRecords.length > 0 ? (
                  filteredRecords.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="font-medium">{record.date}</TableCell>
                      <TableCell>{getStatusBadge(record.status)}</TableCell>
                      <TableCell className="text-muted-foreground">{record.notes || '—'}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} className="h-24 text-center">
                      No attendance records found for the selected period.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
