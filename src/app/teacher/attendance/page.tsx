'use client';

import * as React from 'react';
import { addDays, format } from 'date-fns';
import { Calendar as CalendarIcon, ChevronDown } from 'lucide-react';
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';

type AttendanceStatus = 'present' | 'absent' | 'late';

type Student = {
    id: string;
    name: string;
    avatarUrl: string;
    status: AttendanceStatus | 'unmarked';
};

// Mock data - this would come from an API in a real app
const allStudents: Record<string, Omit<Student, 'status'>[]> = {
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

  React.useEffect(() => {
    // In a real app, you would fetch students and their attendance for the selected date.
    // For this mock, we'll just initialize them with 'unmarked' status.
    const classStudents = allStudents[selectedClass] || [];
    setStudents(classStudents.map(s => ({ ...s, status: 'unmarked' })));
  }, [selectedClass, date]);

  const handleSaveAttendance = React.useCallback(() => {
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
  }, [date, selectedClass, toast]);
  
  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setStudents(currentStudents => 
      currentStudents.map(s => s.id === studentId ? { ...s, status } : s)
    );
    // Auto-save on change
    handleSaveAttendance();
  };
  
  const markAll = (status: AttendanceStatus) => {
    setStudents(currentStudents => currentStudents.map(s => ({ ...s, status })));
    handleSaveAttendance();
  };

  const clearAll = () => {
    setStudents(currentStudents => currentStudents.map(s => ({...s, status: 'unmarked' })));
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <Card>
        <CardHeader>
            <CardTitle className="font-headline text-2xl">Take Attendance</CardTitle>
            <CardDescription>
              Select a class and date range to view or update attendance records.
            </CardDescription>
            <div className="mt-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex flex-col gap-4 md:flex-row md:items-center">
                  <div className="flex items-center gap-2">
                      <Label htmlFor="class-selector" className="text-sm font-medium">Class</Label>
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
                  <div className="flex items-center gap-2">
                      <Label htmlFor="date-picker" className="text-sm font-medium">Date Range</Label>
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
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => markAll('present')} disabled={isRange}>Mark All Present</Button>
                <Button variant="outline" onClick={clearAll} disabled={isRange}>Clear All</Button>
              </div>
            </div>
        </CardHeader>
        <CardContent>
          {isRange ? (
             <div className="flex min-h-[400px] items-center justify-center rounded-lg border-2 border-dashed border-muted">
                <div className="text-center">
                    <h3 className="mt-2 text-sm font-medium text-muted-foreground">Historical View Not Implemented</h3>
                    <p className="mt-1 text-sm text-muted-foreground">The view for a date range is not yet available.</p>
                </div>
             </div>
          ) : (
            <div className="w-full overflow-auto rounded-lg border">
                <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead className="w-[250px]">Student</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {students.map(student => (
                    <TableRow key={student.id}>
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
                            className="flex justify-center space-x-2 md:space-x-8"
                            >
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="present" id={`${student.id}-present`} />
                                <Label htmlFor={`${student.id}-present`}>Present</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="absent" id={`${student.id}-absent`} />
                                <Label htmlFor={`${student.id}-absent`}>Absent</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="late" id={`${student.id}-late`} />
                                <Label htmlFor={`${student.id}-late`}>Late</Label>
                            </div>
                            </RadioGroup>
                        </TableCell>
                    </TableRow>
                    ))}
                </TableBody>
                </Table>
            </div>
          )}
        </CardContent>
        {isRange && (
             <CardFooter>
                <Button>View Records</Button>
            </CardFooter>
        )}
      </Card>
    </div>
  );
}
