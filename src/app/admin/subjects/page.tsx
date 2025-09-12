
'use client';

import * as React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
import { Shapes, PlusCircle, User, Search, ArrowRight, Edit, UserPlus, Trash2, Filter } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';


type SchoolClass = {
  id: string;
  name: string;
  stream?: string;
  studentCount: number;
  capacity: number;
  classTeacher: {
    name: string;
    avatarUrl: string;
  };
};

const mockClasses: SchoolClass[] = [
  {
    id: 'form-4-a',
    name: 'Form 4',
    stream: 'A',
    studentCount: 42,
    capacity: 45,
    classTeacher: { name: 'Ms. Wanjiku', avatarUrl: 'https://picsum.photos/seed/teacher-wanjiku/100' },
  },
    {
    id: 'form-4-b',
    name: 'Form 4',
    stream: 'B',
    studentCount: 43,
    capacity: 45,
    classTeacher: { name: 'Mr. Kamau', avatarUrl: 'https://picsum.photos/seed/teacher-kamau/100' },
  },
  {
    id: 'form-3-north',
    name: 'Form 3',
    stream: 'North',
    studentCount: 45,
    capacity: 50,
    classTeacher: { name: 'Mr. Otieno', avatarUrl: 'https://picsum.photos/seed/teacher-otieno/100' },
  },
    {
    id: 'form-3-south',
    name: 'Form 3',
    stream: 'South',
    studentCount: 47,
    capacity: 50,
    classTeacher: { name: 'Ms. Njeri', avatarUrl: 'https://picsum.photos/seed/teacher-njeri/100' },
  },
  {
    id: 'form-2',
    name: 'Form 2',
    studentCount: 95,
    capacity: 100,
     classTeacher: { name: 'Mr. Kimani', avatarUrl: 'https://picsum.photos/seed/teacher-kimani/100' },
  },
   {
    id: 'form-1',
    name: 'Form 1',
    studentCount: 101,
    capacity: 110,
     classTeacher: { name: 'Ms. Akinyi', avatarUrl: 'https://picsum.photos/seed/teacher-akinyi/100' },
  },
];

const mockTeachers = [
    { id: 't-1', name: 'Ms. Wanjiku', avatarUrl: 'https://picsum.photos/seed/teacher-wanjiku/100' },
    { id: 't-2', name: 'Mr. Kamau', avatarUrl: 'https://picsum.photos/seed/teacher-kamau/100' },
    { id: 't-3', name: 'Mr. Otieno', avatarUrl: 'https://picsum.photos/seed/teacher-otieno/100' },
    { id: 't-4', name: 'Ms. Njeri', avatarUrl: 'https://picsum.photos/seed/teacher-njeri/100' },
    { id: 't-5', name: 'Mr. Kimani', avatarUrl: 'https://picsum.photos/seed/teacher-kimani/100' },
    { id: 't-6', name: 'Ms. Akinyi', avatarUrl: 'https://picsum.photos/seed/teacher-akinyi/100' },
];

const mockDepartments = ['Sciences', 'Mathematics', 'Languages', 'Humanities', 'Technical Subjects', 'Creative Arts'];

const mockSubjects = [
    { id: 'sub-math', name: 'Mathematics', code: '121', department: 'Mathematics', teachers: ['Mr. Otieno', 'Mr. Kimani'], classes: ['Form 1', 'Form 2', 'Form 3', 'Form 4'] },
    { id: 'sub-eng', name: 'English', code: '101', department: 'Languages', teachers: ['Ms. Njeri'], classes: ['Form 1', 'Form 2', 'Form 3', 'Form 4'] },
    { id: 'sub-chem', name: 'Chemistry', code: '233', department: 'Sciences', teachers: ['Ms. Wanjiku'], classes: ['Form 3', 'Form 4'] },
    { id: 'sub-phy', name: 'Physics', code: '232', department: 'Sciences', teachers: ['Mr. Kamau'], classes: ['Form 3', 'Form 4'] },
    { id: 'sub-bio', name: 'Biology', code: '231', department: 'Sciences', teachers: ['Ms. Wanjiku', 'Ms. Akinyi'], classes: ['Form 1', 'Form 2'] },
    { id: 'sub-hist', name: 'History & Government', code: '311', department: 'Humanities', teachers: ['Mr. Kamau'], classes: ['Form 1', 'Form 2', 'Form 3'] },
];


export default function ClassesAndSubjectsPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="font-headline text-3xl font-bold flex items-center gap-2">
          <Shapes className="h-8 w-8 text-primary" />
          Classes &amp; Subjects
        </h1>
        <p className="text-muted-foreground">Manage school classes, subjects, and teacher assignments.</p>
      </div>

      <Tabs defaultValue="classes">
        <TabsList className="mb-4 grid w-full grid-cols-3 md:w-auto md:inline-flex">
            <TabsTrigger value="classes">Class Management</TabsTrigger>
            <TabsTrigger value="subjects">Subject Management</TabsTrigger>
            <TabsTrigger value="assignments">Teacher Assignments</TabsTrigger>
        </TabsList>
        <TabsContent value="classes">
            <Card>
                <CardHeader>
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                             <CardTitle>Class List</CardTitle>
                            <CardDescription>View, create, and edit classes and streams.</CardDescription>
                        </div>
                        <Dialog>
                            <DialogTrigger asChild>
                                <Button>
                                <PlusCircle className="mr-2" />
                                Add New Class
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Add a New Class</DialogTitle>
                                    <DialogDescription>
                                        Fill in the details below. A unique class code will be generated automatically.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="class-name" className="text-right">Class Name</Label>
                                        <Input id="class-name" placeholder="e.g., Form 1" className="col-span-3" />
                                    </div>
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="class-stream" className="text-right">Stream</Label>
                                        <Input id="class-stream" placeholder="e.g., A, North (Optional)" className="col-span-3" />
                                    </div>
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="class-teacher" className="text-right">Class Teacher</Label>
                                        <Select>
                                            <SelectTrigger id="class-teacher" className="col-span-3">
                                                <SelectValue placeholder="Select a teacher" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {mockTeachers.map(teacher => (
                                                    <SelectItem key={teacher.id} value={teacher.id}>{teacher.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="class-capacity" className="text-right">Capacity</Label>
                                        <Input id="class-capacity" type="number" placeholder="e.g., 45" className="col-span-3" />
                                    </div>
                                    <div className="grid grid-cols-4 items-start gap-4">
                                        <Label className="text-right pt-2">Co-Teachers</Label>
                                        <div className="col-span-3">
                                            <Button variant="outline" size="sm" disabled>
                                                <UserPlus className="mr-2 h-4 w-4"/>
                                                Assign Co-Teacher
                                            </Button>
                                            <p className="text-xs text-muted-foreground mt-2">Multiple teacher assignment is coming soon.</p>
                                        </div>
                                    </div>
                                </div>
                                <DialogFooter>
                                    <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                                    <Button disabled>Save Class</Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="w-full overflow-auto rounded-lg border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Class</TableHead>
                                    <TableHead>Stream</TableHead>
                                    <TableHead>Class Teacher</TableHead>
                                    <TableHead className="text-center">Enrollment</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {mockClasses.map((schoolClass) => (
                                    <TableRow key={schoolClass.id}>
                                        <TableCell className="font-semibold">{schoolClass.name}</TableCell>
                                        <TableCell>
                                            {schoolClass.stream ? (
                                                <Badge variant="outline">{schoolClass.stream}</Badge>
                                            ) : (
                                                <span className="text-muted-foreground">—</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-8 w-8">
                                                    <AvatarImage src={schoolClass.classTeacher.avatarUrl} alt={schoolClass.classTeacher.name} />
                                                    <AvatarFallback>{schoolClass.classTeacher.name.charAt(0)}</AvatarFallback>
                                                </Avatar>
                                                <span className="font-medium">{schoolClass.classTeacher.name}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-center">{schoolClass.studentCount} / {schoolClass.capacity}</TableCell>
                                        <TableCell className="text-right space-x-2">
                                            <Dialog>
                                                <DialogTrigger asChild>
                                                    <Button variant="ghost" size="sm">
                                                        <Edit className="mr-2 h-4 w-4" /> Edit
                                                    </Button>
                                                </DialogTrigger>
                                                <DialogContent>
                                                    <DialogHeader>
                                                        <DialogTitle>Edit Class: {schoolClass.name} {schoolClass.stream || ''}</DialogTitle>
                                                        <DialogDescription>
                                                            Update the details for this class.
                                                        </DialogDescription>
                                                    </DialogHeader>
                                                    <div className="grid gap-4 py-4">
                                                        <div className="grid grid-cols-4 items-center gap-4">
                                                            <Label htmlFor="class-name-edit" className="text-right">Class Name</Label>
                                                            <Input id="class-name-edit" defaultValue={schoolClass.name} className="col-span-3" />
                                                        </div>
                                                        <div className="grid grid-cols-4 items-center gap-4">
                                                            <Label htmlFor="class-stream-edit" className="text-right">Stream</Label>
                                                            <Input id="class-stream-edit" defaultValue={schoolClass.stream} className="col-span-3" />
                                                        </div>
                                                        <div className="grid grid-cols-4 items-center gap-4">
                                                            <Label htmlFor="class-teacher-edit" className="text-right">Class Teacher</Label>
                                                            <Select defaultValue={mockTeachers.find(t => t.name === schoolClass.classTeacher.name)?.id}>
                                                                <SelectTrigger id="class-teacher-edit" className="col-span-3">
                                                                    <SelectValue />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    {mockTeachers.map(teacher => (
                                                                        <SelectItem key={teacher.id} value={teacher.id}>{teacher.name}</SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                        <div className="grid grid-cols-4 items-center gap-4">
                                                            <Label htmlFor="class-capacity-edit" className="text-right">Capacity</Label>
                                                            <Input id="class-capacity-edit" type="number" defaultValue={schoolClass.capacity} className="col-span-3" />
                                                        </div>
                                                    </div>
                                                    <DialogFooter className="justify-between">
                                                         <Button variant="destructive" disabled>
                                                            <Trash2 className="mr-2 h-4 w-4" />
                                                            Archive Class
                                                        </Button>
                                                        <div className="flex gap-2">
                                                            <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                                                            <Button disabled>Save Changes</Button>
                                                        </div>
                                                    </DialogFooter>
                                                </DialogContent>
                                            </Dialog>
                                            <Dialog>
                                                <DialogTrigger asChild>
                                                    <Button variant="ghost" size="sm">
                                                        Manage Subjects
                                                        <ArrowRight className="ml-2 h-4 w-4" />
                                                    </Button>
                                                </DialogTrigger>
                                                <DialogContent className="sm:max-w-2xl">
                                                    <DialogHeader>
                                                        <DialogTitle>Manage Subjects for {schoolClass.name} {schoolClass.stream || ''}</DialogTitle>
                                                        <DialogDescription>Select the subjects taught in this class and assign a primary teacher for each.</DialogDescription>
                                                    </DialogHeader>
                                                    <div className="py-4 max-h-[60vh] overflow-y-auto">
                                                        <div className="space-y-4">
                                                            {mockSubjects.map(subject => (
                                                                <div key={subject.id} className="grid grid-cols-[auto_1fr_1fr] items-center gap-4 border-b pb-4">
                                                                    <Checkbox id={`subj-${schoolClass.id}-${subject.id}`} />
                                                                    <Label htmlFor={`subj-${schoolClass.id}-${subject.id}`} className="font-medium">{subject.name}</Label>
                                                                    <Select>
                                                                        <SelectTrigger>
                                                                            <SelectValue placeholder="Assign Teacher" />
                                                                        </SelectTrigger>
                                                                        <SelectContent>
                                                                            {subject.teachers.map(teacherName => {
                                                                                const teacher = mockTeachers.find(t => t.name === teacherName);
                                                                                return teacher ? <SelectItem key={teacher.id} value={teacher.id}>{teacher.name}</SelectItem> : null;
                                                                            })}
                                                                        </SelectContent>
                                                                    </Select>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                    <DialogFooter>
                                                        <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                                                        <Button disabled>Save Assignments</Button>
                                                    </DialogFooter>
                                                </DialogContent>
                                            </Dialog>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </TabsContent>
        <TabsContent value="subjects">
            <Card>
                <CardHeader>
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                         <div>
                             <CardTitle>Subject List</CardTitle>
                            <CardDescription>Manage all subjects offered by the school and assign teachers.</CardDescription>
                        </div>
                        <div className="flex w-full flex-wrap gap-2 md:w-auto">
                            <Dialog>
                                <DialogTrigger asChild>
                                    <Button>
                                        <PlusCircle className="mr-2 h-4 w-4"/>
                                        Add New Subject
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-[600px]">
                                    <DialogHeader>
                                        <DialogTitle>Add New Subject</DialogTitle>
                                        <DialogDescription>Define a new subject and assign it to classes and teachers.</DialogDescription>
                                    </DialogHeader>
                                    <div className="grid gap-6 py-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="subject-name">Subject Name</Label>
                                                <Input id="subject-name" placeholder="e.g., Computer Science" />
                                            </div>
                                             <div className="space-y-2">
                                                <Label htmlFor="subject-code">Subject Code</Label>
                                                <Input id="subject-code" placeholder="e.g., 451" />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="subject-dept">Department</Label>
                                            <Select>
                                                <SelectTrigger id="subject-dept">
                                                    <SelectValue placeholder="Select a department" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {mockDepartments.map(dept => (
                                                        <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <Separator />
                                         <div className="space-y-2">
                                            <Label>Assign to Classes</Label>
                                            <div className="grid grid-cols-3 gap-2">
                                                {mockClasses.map(cls => (
                                                    <div key={cls.id} className="flex items-center space-x-2">
                                                        <Checkbox id={`class-${cls.id}`} />
                                                        <Label htmlFor={`class-${cls.id}`} className="font-normal">{cls.name} {cls.stream || ''}</Label>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        <Separator />
                                         <div className="space-y-2">
                                            <Label>Assign Teachers</Label>
                                            <div className="grid grid-cols-3 gap-2">
                                                {mockTeachers.map(teacher => (
                                                    <div key={teacher.id} className="flex items-center space-x-2">
                                                        <Checkbox id={`teacher-${teacher.id}`} />
                                                        <Label htmlFor={`teacher-${teacher.id}`} className="font-normal">{teacher.name}</Label>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                     <DialogFooter>
                                        <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                                        <Button disabled>Save Subject</Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="w-full overflow-auto rounded-lg border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Subject Name</TableHead>
                                    <TableHead>Code</TableHead>
                                    <TableHead>Department</TableHead>
                                    <TableHead>Teachers</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                             <TableBody>
                                {mockSubjects.map(subject => (
                                    <TableRow key={subject.id}>
                                        <TableCell className="font-semibold">{subject.name}</TableCell>
                                        <TableCell><Badge variant="outline">{subject.code}</Badge></TableCell>
                                        <TableCell className="text-muted-foreground">{subject.department}</TableCell>
                                        <TableCell>
                                            <div className="flex flex-wrap gap-1">
                                                {subject.teachers.map(teacher => (
                                                    <Badge key={teacher} variant="secondary" className="font-normal">{teacher}</Badge>
                                                ))}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="sm" disabled>
                                                <Edit className="mr-2 h-4 w-4" /> Edit
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </TabsContent>
        <TabsContent value="assignments">
            <Card>
                <CardHeader>
                    <CardTitle>Teacher Assignments</CardTitle>
                    <CardDescription>View and manage subject and class assignments for each teacher.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-6 md:grid-cols-2">
                    {mockTeachers.map(teacher => {
                        const classTeacherOf = mockClasses.filter(c => c.classTeacher.name === teacher.name).map(c => `${c.name} ${c.stream || ''}`);
                        const subjectAssignments = mockSubjects.filter(s => s.teachers.includes(teacher.name));
                        
                        return (
                            <Card key={teacher.id}>
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <Avatar>
                                                <AvatarImage src={teacher.avatarUrl} alt={teacher.name} />
                                                <AvatarFallback>{teacher.name.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <CardTitle className="text-lg">{teacher.name}</CardTitle>
                                                {classTeacherOf.length > 0 && <CardDescription>Class Teacher for {classTeacherOf.join(', ')}</CardDescription>}
                                            </div>
                                        </div>
                                        <Button variant="outline" size="sm" disabled>
                                            <Edit className="mr-2 h-4 w-4" />
                                            Edit
                                        </Button>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <h4 className="font-semibold text-sm mb-2">Subject Assignments:</h4>
                                    {subjectAssignments.length > 0 ? (
                                         <div className="flex flex-wrap gap-2">
                                            {subjectAssignments.map(subject => (
                                                <Badge key={subject.id} variant="secondary">{subject.name} ({subject.classes.join(', ')})</Badge>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-muted-foreground">No subjects assigned.</p>
                                    )}
                                </CardContent>
                            </Card>
                        )
                    })}
                </CardContent>
            </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
