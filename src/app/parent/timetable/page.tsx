
'use client';

import * as React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
import { Button } from '@/components/ui/button';
import { Calendar, User, Printer, FileDown, ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const childrenData = [
    { id: 'child-1', name: 'John Doe', class: 'Form 4' },
    { id: 'child-2', name: 'Jane Doe', class: 'Form 1' },
];

const periods = [
    { time: '08:00 - 09:00' },
    { time: '09:00 - 10:00' },
    { time: '10:00 - 11:00' },
    { time: '11:00 - 11:30', isBreak: true, title: 'Short Break' },
    { time: '11:30 - 12:30' },
    { time: '12:30 - 13:30' },
    { time: '13:30 - 14:30', isBreak: true, title: 'Lunch Break' },
    { time: '14:30 - 15:30' },
    { time: '15:30 - 16:30' },
];

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

const mockTimetable: Record<string, Record<string, { subject: string, teacher: string }>> = {
    'Monday': {
        '08:00 - 09:00': { subject: 'Mathematics', teacher: 'Mr. Otieno' },
        '09:00 - 10:00': { subject: 'English', teacher: 'Ms. Njeri' },
        '10:00 - 11:00': { subject: 'Chemistry', teacher: 'Ms. Wanjiku' },
        '11:30 - 12:30': { subject: 'History', teacher: 'Mr. Kamau' },
        '12:30 - 13:30': { subject: 'Physics', teacher: 'Mr. Kamau' },
        '14:30 - 15:30': { subject: 'Geography', teacher: 'Mr. Otieno' },
        '15:30 - 16:30': { subject: 'Biology', teacher: 'Ms. Wanjiku' },
    },
    'Tuesday': {
        '08:00 - 09:00': { subject: 'English', teacher: 'Ms. Njeri' },
        '09:00 - 10:00': { subject: 'Mathematics', teacher: 'Mr. Otieno' },
        '10:00 - 11:00': { subject: 'Physics', teacher: 'Mr. Kamau' },
    },
     'Wednesday': {
        '08:00 - 09:00': { subject: 'Chemistry', teacher: 'Ms. Wanjiku' },
    },
    // Add more data for other days as needed
};

export default function ParentTimetablePage() {
    const [selectedChild, setSelectedChild] = React.useState(childrenData[0].id);

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <div className="mb-6">
                <h1 className="font-headline text-3xl font-bold flex items-center gap-2">
                    <Calendar className="h-8 w-8 text-primary" />
                    Weekly Timetable
                </h1>
                <p className="text-muted-foreground">View your child's weekly class schedule.</p>
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
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" disabled>
                                    Export
                                    <ChevronDown className="ml-2 h-4 w-4"/>
                                </Button>
                            </DropdownMenuTrigger>
                             <DropdownMenuContent>
                                <DropdownMenuItem disabled><Printer className="mr-2 h-4 w-4" /> Print Timetable</DropdownMenuItem>
                                <DropdownMenuItem disabled><FileDown className="mr-2 h-4 w-4" /> Export as PDF</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </CardHeader>
                <CardContent>
                     <div className="w-full overflow-auto rounded-lg border">
                        <Table className="min-w-[800px]">
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-32 text-center">Time</TableHead>
                                    {days.map(day => (
                                        <TableHead key={day} className="text-center">{day}</TableHead>
                                    ))}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {periods.map(period => (
                                    <TableRow key={period.time}>
                                        <TableCell className="font-semibold text-center text-primary">{period.time}</TableCell>
                                        {days.map(day => {
                                            const entry = mockTimetable[day]?.[period.time];
                                            return (
                                                <TableCell key={`${day}-${period.time}`} className="text-center p-1">
                                                    {period.isBreak ? (
                                                         <div className="h-full flex items-center justify-center bg-muted/50 rounded-md p-2">
                                                            <p className="font-semibold text-muted-foreground text-xs">{period.title}</p>
                                                        </div>
                                                    ) : entry ? (
                                                        <div className="bg-primary/10 rounded-md p-2">
                                                            <p className="font-bold text-sm text-primary">{entry.subject}</p>
                                                            <p className="text-xs text-muted-foreground">{entry.teacher}</p>
                                                        </div>
                                                    ) : null}
                                                </TableCell>
                                            )
                                        })}
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
