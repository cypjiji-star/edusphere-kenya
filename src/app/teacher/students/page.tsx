
'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, Users, Search, ArrowRight, ChevronDown, ClipboardCheck, Megaphone, Save, FileDown, Printer } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { ClassAnalytics } from './class-analytics';

// A simple deterministic "random" number generator based on a seed
const seededRandom = (seed: number) => {
  const a = 1664525;
  const c = 1013904223;
  const m = 2 ** 32;
  let state = seed;
  state = (a * state + c) % m;
  return state / m;
};

type AttendanceStatus = 'present' | 'absent' | 'late';

export type Student = {
    id: string;
    name: string;
    rollNumber: string;
    avatarUrl: string;
    overallGrade: string;
    attendance: AttendanceStatus;
};


// Mock data for students
const students: Record<string, Student[]> = {
  'f4-chem': Array.from({ length: 31 }, (_, i) => ({
    id: `f4-chem-${i + 1}`,
    name: `Student ${i + 1}`,
    rollNumber: `F4-00${i + 1}`,
    avatarUrl: `https://picsum.photos/seed/f4-student${i + 1}/100`,
    overallGrade: `${Math.floor(seededRandom(i + 1) * (85 - 60 + 1)) + 60}%`,
    attendance: 'present',
  })),
  'f3-math': Array.from({ length: 28 }, (_, i) => ({
    id: `f3-math-${i + 1}`,
    name: `Student ${i + 32}`,
    rollNumber: `F3-00${i + 1}`,
    avatarUrl: `https://picsum.photos/seed/f3-student${i + 1}/100`,
    overallGrade: `${Math.floor(seededRandom(i + 32) * (90 - 65 + 1)) + 65}%`,
    attendance: 'present',
  })),
  'f2-phys': Array.from({ length: 35 }, (_, i) => ({
    id: `f2-phys-${i + 1}`,
    name: `Student ${i + 60}`,
    rollNumber: `F2-00${i + 1}`,
    avatarUrl: `https://picsum.photos/seed/f2-student${i + 1}/100`,
    overallGrade: `${Math.floor(seededRandom(i + 60) * (80 - 55 + 1)) + 55}%`,
    attendance: 'present',
  })),
};

// Mock data for teacher's classes
const teacherClasses = [
  { id: 'f4-chem', name: 'Form 4 - Chemistry', students: students['f4-chem'] },
  { id: 'f3-math', name: 'Form 3 - Mathematics', students: students['f3-math'] },
  { id: 'f2-phys', name: 'Form 2 - Physics', students: students['f2-phys'] },
];

export default function StudentsPage() {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [activeTab, setActiveTab] = React.useState(teacherClasses[0].id);
  const { toast } = useToast();

  const [classStudents, setClassStudents] = React.useState<Student[]>(
    teacherClasses.find(c => c.id === activeTab)?.students || []
  );

  React.useEffect(() => {
    setClassStudents(teacherClasses.find(c => c.id === activeTab)?.students || []);
  }, [activeTab]);

  const handleAttendanceChange = (studentId: string, status: AttendanceStatus) => {
    setClassStudents(prevStudents =>
        prevStudents.map(s =>
          s.id === studentId ? { ...s, attendance: status } : s
        )
      );
  };
  
  const handleSaveAttendance = () => {
    // Here you would typically make an API call to save the attendance data.
    // For this mock, we'll just show a success toast.
    toast({
      title: 'Attendance Saved!',
      description: `Attendance for ${teacherClasses.find(c => c.id === activeTab)?.name} has been successfully updated.`,
    });
  };

  const getAttendanceBadgeVariant = (status: AttendanceStatus) => {
    switch (status) {
        case 'present':
            return 'default';
        case 'absent':
            return 'destructive';
        case 'late':
            return 'secondary';
        default:
            return 'outline';
    }
  }

  const filteredStudents = 
    classStudents.filter(student =>
      student.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="md:flex md:items-center md:justify-between">
          <div className="mb-4 md:mb-0">
            <h1 className="font-headline text-3xl font-bold">Class &amp; Student Management</h1>
            <p className="text-muted-foreground">Switch between your classes to view student rosters and mark attendance.</p>
          </div>
          <TabsList>
            {teacherClasses.map((cls) => (
              <TabsTrigger key={cls.id} value={cls.id}>{cls.name}</TabsTrigger>
            ))}
          </TabsList>
        </div>

        {teacherClasses.map((cls) => (
          <TabsContent key={cls.id} value={cls.id}>
             <ClassAnalytics students={classStudents} />
            <Card className="mt-6">
              <CardHeader>
                <div className="md:flex-row md:items-start md:justify-between">
                  <CardTitle className="font-headline text-2xl">{cls.name} Roster</CardTitle>
                  <CardDescription>
                    A total of {cls.students.length} students are enrolled in this class.
                  </CardDescription>
                </div>
                <div className="mt-4 flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="relative w-full md:max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Search students by name..."
                      className="w-full bg-background pl-8"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <div className="flex w-full flex-col gap-2 md:w-auto md:flex-row">
                    <Button className="w-full md:w-auto" variant="outline">
                      <PlusCircle className="mr-2" />
                      Add New Student
                    </Button>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button className="w-full md:w-auto" variant="secondary">
                                Actions
                                <ChevronDown className="ml-2" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            <DropdownMenuItem asChild>
                                <Link href="/teacher/attendance">
                                    <ClipboardCheck className="mr-2" />
                                    Mark Full Attendance
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                                <Link href="/teacher/messaging">
                                    <Megaphone className="mr-2" />
                                    Send Class Announcement
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                             <DropdownMenuItem disabled>
                                <FileDown className="mr-2" />
                                Download as PDF
                            </DropdownMenuItem>
                             <DropdownMenuItem disabled>
                                <FileDown className="mr-2" />
                                Download as Excel
                            </DropdownMenuItem>
                             <DropdownMenuItem disabled>
                                <Printer className="mr-2" />
                                Print List
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-hidden rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[80px]">Avatar</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Roll Number</TableHead>
                        <TableHead>Overall Grade</TableHead>
                        <TableHead>Today's Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredStudents.length > 0 ? (
                        filteredStudents.map(student => (
                          <TableRow key={student.id}>
                            <TableCell>
                              <Avatar>
                                <AvatarImage src={student.avatarUrl} alt={student.name} />
                                <AvatarFallback>{student.name.charAt(0)}</AvatarFallback>
                              </Avatar>
                            </TableCell>
                            <TableCell className="font-medium">{student.name}</TableCell>
                            <TableCell className="text-muted-foreground">{student.rollNumber}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{student.overallGrade}</Badge>
                            </TableCell>
                            <TableCell>
                                <Select
                                    value={student.attendance}
                                    onValueChange={(value: AttendanceStatus) => handleAttendanceChange(student.id, value)}
                                >
                                    <SelectTrigger className="w-32">
                                        <SelectValue placeholder="Mark status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="present">Present</SelectItem>
                                        <SelectItem value="absent">Absent</SelectItem>
                                        <SelectItem value="late">Late</SelectItem>
                                    </SelectContent>
                                </Select>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button asChild variant="ghost" size="sm">
                                <Link href={`/teacher/students/${student.name.toLowerCase().replace(/ /g, '-')}`}>
                                  View Profile
                                  <ArrowRight className="ml-2 h-4 w-4" />
                                </Link>
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={6} className="h-24 text-center">
                            No students found matching your search.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
              <CardFooter>
                 <Button onClick={handleSaveAttendance}>
                    <Save className="mr-2" />
                    Save Attendance
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
