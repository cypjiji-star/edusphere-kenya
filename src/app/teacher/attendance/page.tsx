'use client';

import * as React from 'react';
import { addDays, format } from 'date-fns';
import { Calendar as CalendarIcon, ChevronDown } from 'lucide-react';

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
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

// Mock data - this would come from an API in a real app
const teacherClasses = [
  { id: 'f4-chem', name: 'Form 4 - Chemistry' },
  { id: 'f3-math', name: 'Form 3 - Mathematics' },
  { id: 'f2-phys', name: 'Form 2 - Physics' },
];

export default function AttendancePage() {
  const [selectedClass, setSelectedClass] = React.useState(teacherClasses[0].id);
  const [date, setDate] = React.useState<Date>(new Date());
  const { toast } = useToast();

  const handleSaveAttendance = () => {
    toast({
      title: "Attendance Submitted",
      description: `Attendance for ${
        teacherClasses.find((c) => c.id === selectedClass)?.name
      } on ${format(date, 'PPP')} has been saved.`,
    });
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <Card>
        <CardHeader>
            <CardTitle className="font-headline text-2xl">Take Attendance</CardTitle>
            <CardDescription>
              Select a class and date, then mark each student's status.
            </CardDescription>
            <div className="mt-4 flex flex-col gap-4 md:flex-row md:items-center">
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
                    <Label htmlFor="date-picker" className="text-sm font-medium">Date</Label>
                    <Popover>
                    <PopoverTrigger asChild>
                        <Button
                            id="date-picker"
                            variant={'outline'}
                            className={cn(
                                'w-full justify-start text-left font-normal md:w-[240px]',
                                !date && 'text-muted-foreground'
                            )}
                        >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date ? format(date, 'PPP') : <span>Pick a date</span>}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                        <Calendar
                        mode="single"
                        selected={date}
                        onSelect={(newDate) => newDate && setDate(newDate)}
                        initialFocus
                        />
                    </PopoverContent>
                    </Popover>
                </div>
            </div>
        </CardHeader>
        <CardContent>
          <div className="flex min-h-[400px] items-center justify-center rounded-lg border-2 border-dashed border-muted">
            <div className="text-center">
              <p className="mt-2 text-sm font-medium text-muted-foreground">
                Student list for <strong>{teacherClasses.find(c => c.id === selectedClass)?.name}</strong> on <strong>{format(date, 'PPP')}</strong> will appear here.
              </p>
              <p className="mt-1 text-sm text-muted-foreground">This feature is coming soon!</p>
            </div>
          </div>
        </CardContent>
        <CardFooter>
            <Button onClick={handleSaveAttendance} disabled>Save Attendance</Button>
        </CardFooter>
      </Card>
    </div>
  );
}
