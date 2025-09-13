
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
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
  } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Edit, GripVertical, Plus, Save, Settings, Share, Trash2, AlertTriangle, FileDown, Printer, ChevronDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';


const classes = ['Form 4', 'Form 3', 'Form 2', 'Form 1'];
const teachers = ['Ms. Wanjiku', 'Mr. Otieno', 'Ms. Njeri', 'Mr. Kamau'];
const rooms = ['Science Lab', 'Room 12A', 'Room 10B', 'Staff Room'];
const views = ['Class View', 'Teacher View', 'Room View'];

const periods = [
    { id: 1, time: '08:00 - 09:00' },
    { id: 2, time: '09:00 - 10:00' },
    { id: 3, time: '10:00 - 11:00' },
    { id: 4, time: '11:00 - 11:30', isBreak: true, title: 'Short Break' },
    { id: 5, time: '11:30 - 12:30' },
    { id: 6, time: '12:30 - 13:30' },
    { id: 7, time: '13:30 - 14:30', isBreak: true, title: 'Lunch Break' },
    { id: 8, time: '14:30 - 15:30' },
    { id: 9, time: '15:30 - 16:30' },
];

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

const subjects = [
    { name: 'Mathematics', teacher: 'Mr. Otieno', color: 'bg-blue-500' },
    { name: 'English', teacher: 'Ms. Njeri', color: 'bg-green-500' },
    { name: 'Chemistry', teacher: 'Ms. Wanjiku', color: 'bg-purple-500' },
    { name: 'Physics', teacher: 'Mr. Kamau', color: 'bg-orange-500' },
    { name: 'Biology', teacher: 'Ms. Wanjiku', color: 'bg-pink-500' },
    { name: 'History', teacher: 'Mr. Kamau', color: 'bg-yellow-500' },
    { name: 'Geography', teacher: 'Mr. Otieno', color: 'bg-teal-500' },
];

const mockTimetable: Record<string, Record<number, { subject: typeof subjects[number], room: string, clash?: { type: 'teacher' | 'room', message: string } }>> = {
    Monday: {
        1: { subject: subjects[0], room: 'Room 12A' }, // Math - Mr. Otieno
        2: { subject: subjects[2], room: 'Science Lab' }, // Chemistry - Ms. Wanjiku
    },
    Tuesday: {
        3: { subject: subjects[1], room: 'Room 10B' }, // English - Ms. Njeri
    },
    Wednesday: {
        5: { subject: subjects[3], room: 'Room 12A' }, // Physics - Mr. Kamau
        6: { subject: subjects[4], room: 'Science Lab' }, // Biology - Ms. Wanjiku
    },
    Thursday: {
        2: { subject: subjects[2], room: 'Room 10B', clash: { type: 'teacher', message: 'Clash: Ms. Wanjiku is double-booked.' } }, // Chemistry - Ms. Wanjiku (TEACHER CLASH)
        3: { subject: subjects[4], room: 'Science Lab' },
    },
    Friday: {
        8: { subject: subjects[0], room: 'Room 12A' }, // Math - Mr. Otieno
        9: { subject: subjects[6], room: 'Room 12A', clash: { type: 'room', message: 'Clash: Room 12A is double-booked.' } },
    }
}


export function TimetableBuilder() {
  const [view, setView] = React.useState(views[0]);
  const [selectedItem, setSelectedItem] = React.useState(classes[0]);

  const renderFilterDropdown = () => {
    let items: string[] = [];
    switch(view) {
        case 'Class View':
            items = classes;
            break;
        case 'Teacher View':
            items = teachers;
            break;
        case 'Room View':
            items = rooms;
            break;
    }
    
    return (
        <Select value={selectedItem} onValueChange={setSelectedItem}>
            <SelectTrigger className="w-full md:w-auto">
                <SelectValue placeholder={`Select ${view.split(' ')[0]}`} />
            </SelectTrigger>
            <SelectContent>
                {items.map(item => <SelectItem key={item} value={item}>{item}</SelectItem>)}
            </SelectContent>
        </Select>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
             <Card>
                <CardHeader>
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                            <CardTitle>Timetable for {selectedItem}</CardTitle>
                            <CardDescription>Drag subjects from the right panel and drop them into time slots.</CardDescription>
                        </div>
                        <div className="flex w-full flex-wrap md:w-auto items-center gap-2">
                             <Select defaultValue="term2-2024" disabled>
                                <SelectTrigger className="w-full sm:w-auto">
                                    <SelectValue placeholder="Select term" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="term2-2024">Term 2, 2024</SelectItem>
                                    <SelectItem value="term1-2024">Term 1, 2024</SelectItem>
                                </SelectContent>
                             </Select>
                             <Select value={view} onValueChange={(v) => {
                                setView(v);
                                // Reset selected item when view changes
                                if (v === 'Class View') setSelectedItem(classes[0]);
                                if (v === 'Teacher View') setSelectedItem(teachers[0]);
                                if (v === 'Room View') setSelectedItem(rooms[0]);
                             }}>
                                <SelectTrigger className="w-full sm:w-auto">
                                    <SelectValue placeholder="Select view" />
                                </SelectTrigger>
                                <SelectContent>
                                    {views.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                                </SelectContent>
                             </Select>
                            {renderFilterDropdown()}
                            <Dialog>
                                <DialogTrigger asChild>
                                    <Button variant="outline">
                                        <Settings className="mr-2 h-4 w-4" />
                                        Define Periods
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-xl">
                                    <DialogHeader>
                                        <DialogTitle>Manage School Day Periods</DialogTitle>
                                        <DialogDescription>Define the time slots for lessons, breaks, and other activities. These will apply to all timetables.</DialogDescription>
                                    </DialogHeader>
                                    <div className="py-4 max-h-[60vh] overflow-y-auto pr-4 space-y-4">
                                        {periods.map(period => (
                                            <div key={period.id} className="grid grid-cols-[1fr_1fr_auto] items-center gap-4 border-b pb-4">
                                                <div className="space-y-1.5">
                                                    <Label htmlFor={`start-time-${period.id}`}>Start Time</Label>
                                                    <Input id={`start-time-${period.id}`} type="time" defaultValue={period.time.split(' - ')[0]} />
                                                </div>
                                                 <div className="space-y-1.5">
                                                    <Label htmlFor={`end-time-${period.id}`}>End Time</Label>
                                                    <Input id={`end-time-${period.id}`} type="time" defaultValue={period.time.split(' - ')[1]} />
                                                </div>
                                                <Button variant="ghost" size="icon" className="self-end text-destructive hover:text-destructive">
                                                    <Trash2 className="h-4 w-4"/>
                                                </Button>
                                                {period.isBreak && (
                                                    <div className="col-span-full grid grid-cols-[1fr_auto] items-center gap-4 pt-2">
                                                        <div className="space-y-1.5">
                                                            <Label htmlFor={`break-title-${period.id}`}>Break Title</Label>
                                                            <Input id={`break-title-${period.id}`} defaultValue={period.title} />
                                                        </div>
                                                        <div className="flex items-center space-x-2 self-end pb-1">
                                                            <Switch id={`is-break-${period.id}`} checked={period.isBreak} />
                                                            <Label htmlFor={`is-break-${period.id}`}>Is a Break</Label>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                    <DialogFooter className="border-t pt-4 flex-col sm:flex-row gap-2">
                                        <Button variant="outline" className="w-full sm:w-auto">
                                            <Plus className="mr-2 h-4 w-4"/>
                                            Add New Period
                                        </Button>
                                        <DialogClose asChild>
                                            <Button variant="secondary" className="w-full sm:w-auto">Cancel</Button>
                                        </DialogClose>
                                        <Button className="w-full sm:w-auto">Save Periods</Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline">
                                        Export / Print
                                        <ChevronDown className="ml-2 h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                    <DropdownMenuItem disabled>
                                        <FileDown className="mr-2 h-4 w-4"/>
                                        Export as PDF
                                    </DropdownMenuItem>
                                    <DropdownMenuItem disabled>
                                        <FileDown className="mr-2 h-4 w-4"/>
                                        Export as Excel
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                     <DropdownMenuItem disabled>
                                        <Printer className="mr-2 h-4 w-4"/>
                                        Print View
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                             </DropdownMenu>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="w-full overflow-auto rounded-lg border">
                        <table className="w-full min-w-[800px]">
                            <thead>
                                <tr className="border-b bg-muted/50">
                                    <th className="p-2 w-32 font-medium text-muted-foreground border-r">Time</th>
                                    {days.map(day => (
                                        <th key={day} className="p-2 font-medium text-muted-foreground">{day}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {periods.map(period => (
                                    <tr key={period.id} className="border-b">
                                        <td className="p-2 font-semibold text-primary text-sm border-r text-center">{period.time}</td>
                                        {days.map(day => {
                                            const cellData = mockTimetable[day]?.[period.id];
                                            const cellContent = (
                                                <div className={cn("h-full w-full", cellData?.clash && "relative ring-2 ring-destructive ring-inset rounded-md")}>
                                                    {cellData?.clash && (
                                                        <div className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-0.5 z-10">
                                                            <AlertTriangle className="h-3 w-3" />
                                                        </div>
                                                    )}
                                                    {period.isBreak ? (
                                                        period.id === 4 ? <div className="h-full flex items-center justify-center bg-gray-100 rounded-md"><p className="text-xs font-semibold text-gray-500 transform -rotate-90">{period.title}</p></div> :
                                                        <div className="h-full flex items-center justify-center bg-gray-200 rounded-md"><p className="font-semibold text-gray-600">{period.title}</p></div>
                                                    ) : (
                                                        cellData && (
                                                            <div className={cn('p-2 rounded-md text-white h-full flex flex-col justify-between cursor-pointer', cellData.subject.color)}>
                                                                <div>
                                                                    <p className="font-bold text-sm">{cellData.subject.name}</p>
                                                                    <p className="text-xs opacity-80">{cellData.subject.teacher}</p>
                                                                    <p className="text-xs opacity-80 mt-1">@{cellData.room}</p>
                                                                </div>
                                                                <div className="text-right">
                                                                    <Button variant="ghost" size="icon" className="h-6 w-6 text-white/50 hover:bg-white/20 hover:text-white">
                                                                        <Edit className="h-4 w-4" />
                                                                    </Button>
                                                                    <Button variant="ghost" size="icon" className="h-6 w-6 text-white/50 hover:bg-white/20 hover:text-white">
                                                                        <Trash2 className="h-4 w-4" />
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        )
                                                    )}
                                                </div>
                                            );
                                            
                                            return (
                                                <td key={day} className="h-28 p-1 align-top border-r">
                                                    {cellData?.clash ? (
                                                        <TooltipProvider>
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>{cellContent}</TooltipTrigger>
                                                                <TooltipContent>
                                                                    <p className="text-destructive">{cellData.clash.message}</p>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        </TooltipProvider>
                                                    ) : (
                                                        cellContent
                                                    )}
                                                </td>
                                            )
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
                <CardFooter className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => {}}>Clear Timetable</Button>
                    <Button variant="secondary">
                        <Share className="mr-2 h-4 w-4" />
                        Publish
                    </Button>
                    <Button>
                        <Save className="mr-2 h-4 w-4" />
                        Save Timetable
                    </Button>
                </CardFooter>
             </Card>
        </div>
        <div className="lg:col-span-1">
            <Card>
                <CardHeader>
                    <CardTitle>Available Subjects</CardTitle>
                    <CardDescription>Drag these to the timetable.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    {subjects.map(subject => (
                        <div key={subject.name} className={`p-3 rounded-md text-white flex items-center justify-between cursor-grab active:cursor-grabbing ${subject.color}`}>
                            <div>
                                <p className="font-bold">{subject.name}</p>
                                <p className="text-xs opacity-80">{subject.teacher}</p>
                            </div>
                            <GripVertical className="h-5 w-5 text-white/50" />
                        </div>
                    ))}
                    <Separator/>
                    <Button variant="secondary" className="w-full" disabled>
                        <Plus className="mr-2 h-4 w-4" />
                        Add New Subject
                    </Button>
                </CardContent>
            </Card>
        </div>
    </div>
  );
}

