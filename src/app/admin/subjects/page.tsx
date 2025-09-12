
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
import { Shapes, PlusCircle, User, Book, Edit, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';

type Subject = {
  id: string;
  name: string;
  teacher: {
    name: string;
    avatarUrl: string;
  };
};

type SchoolClass = {
  id: string;
  name: string;
  studentCount: number;
  subjects: Subject[];
};

const mockClasses: SchoolClass[] = [
  {
    id: 'form-4',
    name: 'Form 4',
    studentCount: 85,
    subjects: [
      { id: 's1', name: 'Chemistry', teacher: { name: 'Ms. Wanjiku', avatarUrl: 'https://picsum.photos/seed/teacher-wanjiku/100' } },
      { id: 's2', name: 'Mathematics', teacher: { name: 'Mr. Otieno', avatarUrl: 'https://picsum.photos/seed/teacher-otieno/100' } },
      { id: 's3', name: 'English', teacher: { name: 'Ms. Njeri', avatarUrl: 'https://picsum.photos/seed/teacher-njeri/100' } },
      { id: 's4', name: 'Physics', teacher: { name: 'Mr. Kamau', avatarUrl: 'https://picsum.photos/seed/teacher-kamau/100' } },
    ],
  },
  {
    id: 'form-3',
    name: 'Form 3',
    studentCount: 92,
    subjects: [
      { id: 's5', name: 'History', teacher: { name: 'Mr. Kamau', avatarUrl: 'https://picsum.photos/seed/teacher-kamau/100' } },
      { id: 's6', name: 'Geography', teacher: { name: 'Mr. Otieno', avatarUrl: 'https://picsum.photos/seed/teacher-otieno/100' } },
      { id: 's7', name: 'Biology', teacher: { name: 'Ms. Wanjiku', avatarUrl: 'https://picsum.photos/seed/teacher-wanjiku/100' } },
    ],
  },
  {
    id: 'form-2',
    name: 'Form 2',
    studentCount: 95,
    subjects: [],
  },
];


export default function ClassesAndSubjectsPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6 flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="font-headline text-3xl font-bold flex items-center gap-2">
            <Shapes className="h-8 w-8 text-primary" />
            Classes &amp; Subjects Management
          </h1>
          <p className="text-muted-foreground">Define classes, assign subjects, and manage teacher allocations.</p>
        </div>
        <Button disabled>
          <PlusCircle className="mr-2" />
          Add New Class
        </Button>
      </div>

      <div className="space-y-8">
        {mockClasses.map((schoolClass) => (
          <Card key={schoolClass.id}>
            <CardHeader>
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                 <div>
                    <CardTitle className="text-2xl font-headline">{schoolClass.name}</CardTitle>
                    <CardDescription>
                        <span className="flex items-center gap-2 mt-1">
                            <Users className="h-4 w-4" />
                            {schoolClass.studentCount} students
                        </span>
                    </CardDescription>
                 </div>
                 <div className="flex gap-2">
                    <Button variant="outline" disabled>Class Settings</Button>
                 </div>
              </div>
            </CardHeader>
            <CardContent>
              {schoolClass.subjects.length > 0 ? (
                 <div className="space-y-4">
                    {schoolClass.subjects.map((subject, index) => (
                        <div key={subject.id}>
                            <div className="flex flex-col gap-4 md:flex-row md:items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <Book className="h-5 w-5 text-primary" />
                                    <p className="font-semibold w-48">{subject.name}</p>
                                    <Separator orientation="vertical" className="h-6 hidden md:block" />
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <Avatar className="h-6 w-6">
                                            <AvatarImage src={subject.teacher.avatarUrl} />
                                            <AvatarFallback>{subject.teacher.name.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <span className="text-sm">{subject.teacher.name}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 self-end md:self-center">
                                    <Button variant="ghost" size="sm" disabled>
                                        <Edit className="mr-2 h-4 w-4" />
                                        Edit
                                    </Button>
                                    <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600" disabled>
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Remove
                                    </Button>
                                </div>
                            </div>
                            {index < schoolClass.subjects.length - 1 && <Separator className="mt-4" />}
                        </div>
                    ))}
                 </div>
              ) : (
                <div className="flex min-h-[100px] items-center justify-center rounded-lg border-2 border-dashed border-muted">
                    <p className="text-muted-foreground">No subjects assigned to this class yet.</p>
                </div>
              )}
            </CardContent>
            <CardFooter>
                 <Button variant="secondary" disabled>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Subject to {schoolClass.name}
                 </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
