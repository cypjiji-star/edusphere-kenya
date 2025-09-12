
'use client';

import * as React from 'react';
import { addDays, format, eachDayOfInterval, isBefore, startOfToday, eachWeekOfInterval, startOfWeek, endOfWeek } from 'date-fns';
import { Calendar as CalendarIcon, ChevronDown, Check, History, Percent, FilePenLine, FileDown, Printer, Lock, Bell } from 'lucide-react';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Calendar } from '@/components/ui/calendar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';


type AttendanceStatus = 'present' | 'absent' | 'late';

type Student = {
    id: string;
    name: string;
    avatarUrl: string;
    status: AttendanceStatus | 'unmarked';
    notes?: string;
};

// Mock data - this would come from an API in a real app
const allStudents: Record<string, Omit<Student, 'status' | 'notes'>[]> = {
  'f4-chem': Array.from({ length: 31 }, (_, i) => ({
    id: `f4-chem-${i + 1}`,
    name: `Student ${i + 1}`,
    avatarUrl: `https://picsum.photos/seed/f4-student${i + 1}/100`,
  })),
  'f3-math': Array.from({ length: 28 }, (_, i) => ({
    id: `f3-math-${i + 1}`,
    name: `Student ${i + 32}`,
    avatarUrl: `https://picsum.photos/seed/f3-student${i + 1}/100`,
  })),
  'f2-phys': Array.from({ length: 35 }, (_, i) => ({
    id: `f2-phys-${i + 1}`,
    name: `Student ${i + 60}`,
    avatarUrl: `https://picsum.photos/seed/f2-student${i + 1}/100`,
  })),
};

const teacherClasses = [
  { id: 'f4-chem', name: 'Form 4 - Chemistry' },
  { id: 'f3-math', name: 'Form 3 - Mathematics' },
  { id: 'f2-phys', name: 'Form 2 - Physics' },
];

export default function AttendancePage() {
  const [selectedClass, setSelectedClass] = React.useState(teacherClasses[0].id);
  const [date, setDate] = React.useState<DateRange | undefined>({
    from: new Date(),
    to: undefined,
  });
  const [students, setStudents] = React.useState<Student[]>([]);
  const { toast } = useToast();
  
  const isRange = date?.from && date?.to;
  const selectedDate = date?.from && !date.to ? date.from : undefined;
  const isPastDate = selectedDate ? isBefore(selectedDate, startOfToday()) : false;
  const isEditable = !isRange && !isPastDate;

  const weeklyIntervals = React.useMemo(() => {
    if (!isRange || !date.from || !date.to) return [];
    return eachWeekOfInterval({ start: date.from, end: date.to }, { weekStartsOn: 1 });
  }, [date, isRange]);


  React.useEffect(() => {
    // In a real app, you would fetch students and their attendance for the selected date.
    // For this mock, we'll just initialize them with 'unmarked' status.
    const classStudents = allStudents[selectedClass] || [];
    setStudents(classStudents.map(s => ({ ...s, status: 'unmarked', notes: '' })));
  }, [selectedClass, date]);

  const handleSaveAttendance = React.useCallback(() => {
    if (!isEditable) return;
    let description = '';
    if (date?.from && !date.to) {
        description = `Attendance for ${
            teacherClasses.find((c) => c.id === selectedClass)?.name
        } on ${format(date.from, 'PPP')} has been saved.`
    } else {
        description = 'Attendance has been saved.';
    }

    toast({
      title: "✓ Saved",
      description,
    });
  }, [date, selectedClass, toast, isEditable]);
  
  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    if (!isEditable) return;
    setStudents(currentStudents => 
      currentStudents.map(s => s.id === studentId ? { ...s, status } : s)
    );
    // Auto-save on change
    handleSaveAttendance();
  };

  const handleNotesChange = (studentId: string, notes: string) => {
     if (!isEditable) return;
    setStudents(currentStudents =>
      currentStudents.map(s => s.id === studentId ? { ...s, notes } : s)
    );
    handleSaveAttendance();
  };
  
  const markAll = (status: AttendanceStatus) => {
     if (!isEditable) return;
    setStudents(currentStudents => currentStudents.map(s => ({ ...s, status })));
    handleSaveAttendance();
  };

  const clearAll = () => {
    if (!isEditable) return;
    setStudents(currentStudents => currentStudents.map(s => ({...s, status: 'unmarked', notes: '' })));
  }

  const attendanceSummary = React.useMemo(() => {
    const totalStudents = students.length;
    if (totalStudents === 0) return { present: 0 };
    const presentCount = students.filter(s => s.status === 'present').length;
    return {
      present: Math.round((presentCount / totalStudents) * 100),
    };
  }, [students]);

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <Card>
        <CardHeader>
            <CardTitle className="font-headline text-2xl">Take Attendance</CardTitle>
            <CardDescription>
              Select a class and date range to view or update attendance records.
            </CardDescription>
            <div className="mt-4 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div className="flex flex-col gap-4 md:flex-row md:items-end">
                  <div className="grid w-full md:w-auto gap-1.5">
                      <Label htmlFor="class-selector">Class</Label>
                      <Select value={selectedClass} onValueChange={setSelectedClass}>
                          <SelectTrigger className="w-full md:w-[240px]" id="class-selector">
                              <SelectValue placeholder="Select a class" />
                          </SelectTrigger>
                          <SelectContent>
                              {teacherClasses.map((cls) => (
                                  <SelectItem key={cls.id} value={cls.id}>
                                  {cls.name}
                                  </SelectItem>
                              ))}
                          </SelectContent>
                      </Select>
                  </div>
                  <div className="grid w-full md:w-auto gap-1.5">
                      <Label htmlFor="date-picker">Date Range</Label>
                      <Popover>
                      <PopoverTrigger asChild>
                          <Button
                              id="date-picker"
                              variant={'outline'}
                              className={cn(
                                  'w-full justify-start text-left font-normal md:w-auto',
                                  !date && 'text-muted-foreground'
                              )}
                          >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {date?.from ? (
                            date.to ? (
                              <>
                                {format(date.from, 'LLL dd, y')} -{' '}
                                {format(date.to, 'LLL dd, y')}
                              </>
                            ) : (
                              format(date.from, 'LLL dd, y')
                            )
                          ) : (
                            <span>Pick a date</span>
                          )}
                          </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                          <Calendar
                            initialFocus
                            mode="range"
                            defaultMonth={date?.from}
                            selected={date}
                            onSelect={setDate}
                            numberOfMonths={2}
                          />
                      </PopoverContent>
                      </Popover>
                  </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <Button variant="outline" onClick={() => markAll('present')} disabled={!isEditable} className="w-full sm:w-auto">Mark All Present</Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="w-full sm:w-auto">
                      Actions
                      <ChevronDown className="ml-2 h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={clearAll} disabled={!isEditable}>
                      Clear All Selections
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem disabled>
                      <FileDown className="mr-2" />
                      Download as PDF
                    </DropdownMenuItem>
                    <DropdownMenuItem disabled>
                      <FileDown className="mr-2" />
                      Download as Excel/CSV
                    </DropdownMenuItem>
                    <DropdownMenuItem disabled>
                      <Printer className="mr-2" />
                      Print List
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
            {!isRange && (
                 <Card className="mt-4 bg-muted/50">
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <Percent className="h-5 w-5 text-primary"/>
                            Today's Summary
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="flex items-center gap-6">
                        <div>
                            <p className="text-2xl font-bold">{attendanceSummary.present}%</p>
                            <p className="text-sm text-muted-foreground">Present Today</p>
                        </div>
                        <Separator orientation="vertical" className="h-10"/>
                         <div>
                            <p className="text-2xl font-bold text-muted-foreground/70">88%</p>
                            <p className="text-sm text-muted-foreground">Class Average</p>
                        </div>
                    </CardContent>
                </Card>
            )}
        </CardHeader>
        <CardContent>
          {isRange && date?.from && date?.to ? (
             <div className="space-y-4">
                <h3 className="font-headline text-lg flex items-center gap-2"><History className="h-5 w-5 text-primary" /> Historical Records</h3>
                <Accordion type="single" collapsible className="w-full">
                {weeklyIntervals.map((weekStart, index) => {
                    const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
                    const weekLabel = `Week of ${format(weekStart, 'LLL dd')} - ${format(weekEnd, 'LLL dd, yyyy')}`;
                    const daysInWeek = eachDayOfInterval({ start: weekStart, end: weekEnd }).filter(d => d >= date.from! && d <= date.to!);

                    return (
                        <AccordionItem value={`item-${index}`} key={index}>
                            <AccordionTrigger>{weekLabel}</AccordionTrigger>
                            <AccordionContent>
                                <div className="w-full overflow-auto rounded-lg border">
                                    <Table>
                                        <TableHeader>
                                        <TableRow>
                                            <TableHead>Date</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead className="text-center">Attendance Rate</TableHead>
                                            <TableHead>Marked By</TableHead>
                                        </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                        {daysInWeek.map((d) => (
                                        <TableRow key={d.toString()}>
                                            <TableCell>
                                                <Button variant="link" className="p-0 h-auto" onClick={() => setDate({ from: d, to: undefined })}>
                                                {format(d, 'EEEE, PPP')}
                                                </Button>
                                            </TableCell>
                                            <TableCell>
                                                {Math.random() > 0.2 ? (
                                                <div className="flex items-center gap-2 text-sm text-green-600">
                                                    <Check className="h-4 w-4" />
                                                    <span>Record Saved</span>
                                                </div>
                                                ) : (
                                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                    <span>No Record</span>
                                                </div>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {Math.random() > 0.2 ? `${Math.floor(Math.random() * (100 - 85 + 1)) + 85}%` : '—'}
                                            </TableCell>
                                            <TableCell>
                                                {Math.random() > 0.2 ? "Ms. Wanjiku" : '—'}
                                            </TableCell>
                                        </TableRow>
                                        ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    );
                })}
                </Accordion>
             </div>
          ) : (
            <>
            {isPastDate && (
              <Alert variant="default" className="mb-4 bg-yellow-50 border-yellow-200 text-yellow-800">
                <Lock className="h-4 w-4 text-yellow-700" />
                <AlertTitle>Records Locked</AlertTitle>
                <AlertDescription>
                  Attendance records for past dates are view-only. Editing is disabled as per administrative policy.
                </AlertDescription>
              </Alert>
            )}
            <div className="w-full overflow-auto rounded-lg border">
                <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead className="w-full md:w-[250px]">Student</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="hidden sm:table-cell">Notes</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {students.map(student => (
                    <TableRow key={student.id} className="flex flex-col md:table-row">
                        <TableCell>
                        <div className="flex items-center gap-3">
                            <Avatar>
                            <AvatarImage src={student.avatarUrl} alt={student.name} />
                            <AvatarFallback>{student.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <span className="font-medium">{student.name}</span>
                        </div>
                        </TableCell>
                        <TableCell>
                        <RadioGroup
                            value={student.status}
                            onValueChange={(value: AttendanceStatus) => handleStatusChange(student.id, value)}
                            className="flex flex-row justify-around md:justify-center md:space-x-8 py-2"
                            disabled={!isEditable}
                            >
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="present" id={`${student.id}-present`} disabled={!isEditable}/>
                                <Label htmlFor={`${student.id}-present`}>Present</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="absent" id={`${student.id}-absent`} disabled={!isEditable}/>
                                <Label htmlFor={`${student.id}-absent`}>Absent</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="late" id={`${student.id}-late`} disabled={!isEditable}/>
                                <Label htmlFor={`${student.id}-late`}>Late</Label>
                            </div>
                            </RadioGroup>
                        </TableCell>
                        <TableCell className="w-full md:w-[250px]">
                            {(student.status === 'absent' || student.status === 'late') && (
                                <Input
                                    type="text"
                                    placeholder="Add a note (e.g., Sick, family emergency)"
                                    value={student.notes}
                                    onChange={(e) => handleNotesChange(student.id, e.target.value)}
                                    onBlur={() => handleSaveAttendance()}
                                    disabled={!isEditable}
                                    className="mt-2 md:mt-0"
                                />
                            )}
                        </TableCell>
                    </TableRow>
                    ))}
                </TableBody>
                </Table>
            </div>
            </>
          )}
        </CardContent>
        {isRange ? (
             <CardFooter>
                <Button disabled>View Detailed Report (Coming Soon)</Button>
            </CardFooter>
        ) : (
            <CardFooter className="flex-col items-start gap-4 border-t pt-6">
                <div className="space-y-2">
                    <h4 className="font-semibold flex items-center gap-2">
                        <Bell className="h-5 w-5 text-primary" />
                        Automated Alerts & Notifications
                    </h4>
                    <p className="text-sm text-muted-foreground">Configure actions to be triggered automatically after attendance is submitted.</p>
                </div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-6">
                    <div className="flex items-center space-x-2 p-2 rounded-md border border-transparent hover:border-border hover:bg-muted/50">
                        <Switch id="notify-parents" disabled />
                        <Label htmlFor="notify-parents">Notify parents of absent students</Label>
                    </div>
                     <div className="flex items-center space-x-2 p-2 rounded-md border border-transparent hover:border-border hover:bg-muted/50">
                        <Switch id="notify-admin" disabled />
                        <Label htmlFor="notify-admin">Alert admin for low attendance</Label>
                    </div>
                </div>
                 <p className="text-xs text-muted-foreground pt-2">Full alert customization is coming soon.</p>
            </CardFooter>
        )}
      </Card>
    </div>
  );
}
