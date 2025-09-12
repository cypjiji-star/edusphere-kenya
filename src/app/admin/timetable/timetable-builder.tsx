
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
import { Edit, GripVertical, Plus, Save, Settings, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

const classes = ['Form 4', 'Form 3', 'Form 2', 'Form 1'];
const teachers = ['All Teachers', 'Ms. Wanjiku', 'Mr. Otieno', 'Ms. Njeri'];
const views = ['Class View', 'Teacher View', 'Master View'];

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

const mockTimetable: Record<string, Record<number, typeof subjects[number]>> = {
    Monday: {
        1: subjects[0], // Math
        2: subjects[2], // Chemistry
    },
    Tuesday: {
        3: subjects[1], // English
    },
    Wednesday: {
        5: subjects[3], // Physics
        6: subjects[4], // Biology
    },
    Friday: {
        8: subjects[0], // Math
    }
}


export function TimetableBuilder() {

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
             <Card>
                <CardHeader>
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                            <CardTitle>Timetable for Form 4</CardTitle>
                            <CardDescription>Drag subjects from the right panel and drop them into time slots.</CardDescription>
                        </div>
                        <div className="flex w-full md:w-auto items-center gap-2">
                             <Select defaultValue="Class View">
                                <SelectTrigger className="w-full md:w-auto">
                                    <SelectValue placeholder="Select view" />
                                </SelectTrigger>
                                <SelectContent>
                                    {views.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                                </SelectContent>
                             </Select>
                            <Select defaultValue="Form 4">
                                <SelectTrigger className="w-full md:w-auto">
                                    <SelectValue placeholder="Select class" />
                                </SelectTrigger>
                                <SelectContent>
                                    {classes.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                </SelectContent>
                             </Select>
                             <Button variant="outline" disabled>
                                <Settings className="mr-2 h-4 w-4" />
                                Define Periods
                             </Button>
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
                                        {days.map(day => (
                                            <td key={day} className="h-24 p-1 align-top border-r">
                                                {period.isBreak ? (
                                                    period.id === 4 ? <div className="h-full flex items-center justify-center bg-gray-100 rounded-md"><p className="text-xs font-semibold text-gray-500 transform -rotate-90">{period.title}</p></div> :
                                                    <div className="h-full flex items-center justify-center bg-gray-200 rounded-md"><p className="font-semibold text-gray-600">{period.title}</p></div>
                                                ) : (
                                                    mockTimetable[day]?.[period.id] && (
                                                        <div className={`p-2 rounded-md text-white h-full flex flex-col justify-between cursor-pointer ${mockTimetable[day][period.id].color}`}>
                                                            <div>
                                                                <p className="font-bold text-sm">{mockTimetable[day][period.id].name}</p>
                                                                <p className="text-xs opacity-80">{mockTimetable[day][period.id].teacher}</p>
                                                            </div>
                                                            <div className="text-right">
                                                                <Button variant="ghost" size="icon" className="h-6 w-6 text-white/50 hover:bg-white/20 hover:text-white">
                                                                    <Trash2 className="h-4 w-4" />
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    )
                                                )}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
                <CardFooter className="flex justify-end gap-2">
                    <Button variant="outline" disabled>Clear Timetable</Button>
                    <Button disabled>
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
