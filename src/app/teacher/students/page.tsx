'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, Users, Search, ArrowRight } from 'lucide-react';
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

// Mock data for students
const students = {
  'f4-chem': Array.from({ length: 31 }, (_, i) => ({
    id: `f4-chem-${i + 1}`,
    name: `Student ${i + 1}`,
    rollNumber: `F4-00${i + 1}`,
    avatarUrl: `https://picsum.photos/seed/f4-student${i + 1}/100`,
    overallGrade: `${Math.floor(Math.random() * (85 - 60 + 1)) + 60}%`,
  })),
  'f3-math': Array.from({ length: 28 }, (_, i) => ({
    id: `f3-math-${i + 1}`,
    name: `Student ${i + 32}`,
    rollNumber: `F3-00${i + 1}`,
    avatarUrl: `https://picsum.photos/seed/f3-student${i + 1}/100`,
    overallGrade: `${Math.floor(Math.random() * (90 - 65 + 1)) + 65}%`,
  })),
  'f2-phys': Array.from({ length: 35 }, (_, i) => ({
    id: `f2-phys-${i + 1}`,
    name: `Student ${i + 60}`,
    rollNumber: `F2-00${i + 1}`,
    avatarUrl: `https://picsum.photos/seed/f2-student${i + 1}/100`,
    overallGrade: `${Math.floor(Math.random() * (80 - 55 + 1)) + 55}%`,
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

  const filteredStudents = (students: any[]) =>
    students.filter(student =>
      student.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="md:flex md:items-center md:justify-between">
          <div className="mb-4 md:mb-0">
            <h1 className="font-headline text-3xl font-bold">Class & Student Management</h1>
            <p className="text-muted-foreground">Switch between your classes to view student rosters.</p>
          </div>
          <TabsList>
            {teacherClasses.map((cls) => (
              <TabsTrigger key={cls.id} value={cls.id}>{cls.name}</TabsTrigger>
            ))}
          </TabsList>
        </div>

        {teacherClasses.map((cls) => (
          <TabsContent key={cls.id} value={cls.id}>
            <Card className="mt-6">
              <CardHeader>
                <div className="md:flex-row md:items-start md:justify-between">
                  <CardTitle className="font-headline text-2xl">{cls.name}</CardTitle>
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
                  <Button className="w-full md:w-auto">
                    <PlusCircle className="mr-2" />
                    Add New Student
                  </Button>
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
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredStudents(cls.students).length > 0 ? (
                        filteredStudents(cls.students).map(student => (
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
                            <TableCell className="text-right">
                              <Button asChild variant="ghost" size="sm">
                                <Link href={`/teacher/students/${student.id}?classId=${activeTab}`}>
                                  View Profile
                                  <ArrowRight className="ml-2 h-4 w-4" />
                                </Link>
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={5} className="h-24 text-center">
                            No students found matching your search.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
