
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
import { Shapes, PlusCircle, User, Search, ArrowRight, Edit, UserPlus, Trash2 } from 'lucide-react';
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
    { id: 't-1', name: 'Ms. Wanjiku' },
    { id: 't-2', name: 'Mr. Kamau' },
    { id: 't-3', name: 'Mr. Otieno' },
    { id: 't-4', name: 'Ms. Njeri' },
    { id: 't-5', name: 'Mr. Kimani' },
    { id: 't-6', name: 'Ms. Akinyi' },
]


export default function ClassesAndSubjectsPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6 flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="font-headline text-3xl font-bold flex items-center gap-2">
            <Shapes className="h-8 w-8 text-primary" />
            Class Management
          </h1>
          <p className="text-muted-foreground">View classes, assign subjects, and manage class teachers.</p>
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

      <Card>
        <CardHeader>
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="relative w-full md:max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Search by class or teacher..."
                        className="w-full bg-background pl-8"
                    />
                </div>
                <div className="flex w-full flex-col gap-2 md:w-auto md:flex-row md:items-center">
                    <Select defaultValue="all">
                        <SelectTrigger className="w-full md:w-[180px]">
                            <SelectValue placeholder="Filter by Grade" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Grades</SelectItem>
                            <SelectItem value="f4">Form 4</SelectItem>
                            <SelectItem value="f3">Form 3</SelectItem>
                            <SelectItem value="f2">Form 2</SelectItem>
                            <SelectItem value="f1">Form 1</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
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
                                    <Button variant="ghost" size="sm" disabled>
                                        Manage Subjects
                                        <ArrowRight className="ml-2 h-4 w-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
