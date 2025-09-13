
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
import { Calendar, User, Printer, FileDown, ChevronDown, BookOpen, MapPin } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format } from 'date-fns';


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

const subjectDetails = {
    'Mathematics': { color: 'bg-blue-100 text-blue-800 border-blue-200' },
    'English': { color: 'bg-green-100 text-green-800 border-green-200' },
    'Chemistry': { color: 'bg-purple-100 text-purple-800 border-purple-200' },
    'History': { color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
    'Physics': { color: 'bg-orange-100 text-orange-800 border-orange-200' },
    'Geography': { color: 'bg-teal-100 text-teal-800 border-teal-200' },
    'Biology': { color: 'bg-pink-100 text-pink-800 border-pink-200' },
}

const mockTimetable: Record<string, Record<string, { subject: string, teacher: { name: string, avatar: string }, room: string }>> = {
    'Monday': {
        '08:00 - 09:00': { subject: 'Mathematics', teacher: { name: 'Mr. Otieno', avatar: 'https://picsum.photos/seed/teacher-otieno/100' }, room: 'Room 12A' },
        '09:00 - 10:00': { subject: 'English', teacher: { name: 'Ms. Njeri', avatar: 'https://picsum.photos/seed/teacher-njeri/100' }, room: 'Room 10B' },
        '10:00 - 11:00': { subject: 'Chemistry', teacher: { name: 'Ms. Wanjiku', avatar: 'https://picsum.photos/seed/teacher-wanjiku/100' }, room: 'Science Lab' },
        '11:30 - 12:30': { subject: 'History', teacher: { name: 'Mr. Kamau', avatar: 'https://picsum.photos/seed/teacher-kamau/100' }, room: 'Room 11A' },
        '12:30 - 13:30': { subject: 'Physics', teacher: { name: 'Mr. Kamau', avatar: 'https://picsum.photos/seed/teacher-kamau/100' }, room: 'Physics Lab' },
        '14:30 - 15:30': { subject: 'Geography', teacher: { name: 'Mr. Otieno', avatar: 'https://picsum.photos/seed/teacher-otieno/100' }, room: 'Room 12A' },
        '15:30 - 16:30': { subject: 'Biology', teacher: { name: 'Ms. Wanjiku', avatar: 'https://picsum.photos/seed/teacher-wanjiku/100' }, room: 'Science Lab' },
    },
    'Tuesday': {
        '08:00 - 09:00': { subject: 'English', teacher: { name: 'Ms. Njeri', avatar: 'https://picsum.photos/seed/teacher-njeri/100' }, room: 'Room 10B' },
        '09:00 - 10:00': { subject: 'Mathematics', teacher: { name: 'Mr. Otieno', avatar: 'https://picsum.photos/seed/teacher-otieno/100' }, room: 'Room 12A' },
        '10:00 - 11:00': { subject: 'Physics', teacher: { name: 'Mr. Kamau', avatar: 'https://picsum.photos/seed/teacher-kamau/100' }, room: 'Physics Lab' },
    },
     'Wednesday': {
        '08:00 - 09:00': { subject: 'Chemistry', teacher: { name: 'Ms. Wanjiku', avatar: 'https://picsum.photos/seed/teacher-wanjiku/100' }, room: 'Science Lab' },
    },
};

export default function ParentTimetablePage() {
    const [selectedChild, setSelectedChild] = React.useState(childrenData[0].id);
    const [clientReady, setClientReady] = React.useState(false);
    
    React.useEffect(() => {
        setClientReady(true);
    }, []);

    // For demo purposes, we'll use Monday's data for "Today"
    const today = "Monday";
    const todaysLessons = clientReady ? Object.entries(mockTimetable[today] || {}).map(([time, lesson]) => ({ time, ...lesson })) : [];


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
                     {/* Mobile View */}
                    <div className="md:hidden space-y-4">
                        <h2 className="font-bold text-lg">Today's Lessons ({clientReady ? format(new Date(), 'EEEE') : ''})</h2>
                        {todaysLessons.length > 0 ? todaysLessons.map(lesson => (
                            <Card key={lesson.time} className="bg-muted/30">
                                <CardContent className="p-4">
                                    <p className="font-bold">{lesson.subject}</p>
                                    <p className="text-sm text-muted-foreground">{lesson.time}</p>
                                    <p className="text-sm text-muted-foreground">Teacher: {lesson.teacher.name}</p>
                                    <p className="text-sm text-muted-foreground">Room: {lesson.room}</p>
                                </CardContent>
                            </Card>
                        )) : (
                            <p className="text-muted-foreground">No lessons scheduled for today.</p>
                        )}
                    </div>
                     {/* Desktop View */}
                     <div className="w-full overflow-auto rounded-lg border hidden md:block">
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
                                                        <Popover>
                                                            <PopoverTrigger asChild>
                                                                <div className={`p-2 rounded-md cursor-pointer transition-transform hover:scale-105 ${subjectDetails[entry.subject as keyof typeof subjectDetails]?.color || 'bg-gray-100 text-gray-800'}`}>
                                                                    <p className="font-bold text-sm">{entry.subject}</p>
                                                                </div>
                                                            </PopoverTrigger>
                                                            <PopoverContent className="w-80">
                                                                <div className="space-y-4">
                                                                    <h4 className="font-medium leading-none flex items-center gap-2">
                                                                        <BookOpen className="h-5 w-5 text-primary" />
                                                                        {entry.subject}
                                                                    </h4>
                                                                    <div className="flex items-center gap-3">
                                                                        <Avatar className="h-9 w-9">
                                                                            <AvatarImage src={entry.teacher.avatar} alt={entry.teacher.name} />
                                                                            <AvatarFallback>{entry.teacher.name.charAt(0)}</AvatarFallback>
                                                                        </Avatar>
                                                                        <div>
                                                                            <p className="text-sm font-semibold">{entry.teacher.name}</p>
                                                                            <p className="text-xs text-muted-foreground">Teacher</p>
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex items-center gap-3 text-sm">
                                                                        <MapPin className="h-4 w-4 text-muted-foreground" />
                                                                        <p>{entry.room}</p>
                                                                    </div>
                                                                </div>
                                                            </PopoverContent>
                                                        </Popover>
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
