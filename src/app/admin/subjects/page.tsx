
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
import { Shapes, PlusCircle, User, Search, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';

type SchoolClass = {
  id: string;
  name: string;
  stream?: string;
  studentCount: number;
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
    classTeacher: { name: 'Ms. Wanjiku', avatarUrl: 'https://picsum.photos/seed/teacher-wanjiku/100' },
  },
    {
    id: 'form-4-b',
    name: 'Form 4',
    stream: 'B',
    studentCount: 43,
    classTeacher: { name: 'Mr. Kamau', avatarUrl: 'https://picsum.photos/seed/teacher-kamau/100' },
  },
  {
    id: 'form-3-north',
    name: 'Form 3',
    stream: 'North',
    studentCount: 45,
    classTeacher: { name: 'Mr. Otieno', avatarUrl: 'https://picsum.photos/seed/teacher-otieno/100' },
  },
    {
    id: 'form-3-south',
    name: 'Form 3',
    stream: 'South',
    studentCount: 47,
    classTeacher: { name: 'Ms. Njeri', avatarUrl: 'https://picsum.photos/seed/teacher-njeri/100' },
  },
  {
    id: 'form-2',
    name: 'Form 2',
    studentCount: 95,
     classTeacher: { name: 'Mr. Kimani', avatarUrl: 'https://picsum.photos/seed/teacher-kimani/100' },
  },
   {
    id: 'form-1',
    name: 'Form 1',
    studentCount: 101,
     classTeacher: { name: 'Ms. Akinyi', avatarUrl: 'https://picsum.photos/seed/teacher-akinyi/100' },
  },
];


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
        <Button disabled>
          <PlusCircle className="mr-2" />
          Add New Class
        </Button>
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
                            <TableHead className="text-center">Students</TableHead>
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
                                <TableCell className="text-center">{schoolClass.studentCount}</TableCell>
                                <TableCell className="text-right">
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
