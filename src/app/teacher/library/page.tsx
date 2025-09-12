
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
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Library, Search, Book, FileText, Newspaper, Download, Upload } from 'lucide-react';
import Link from 'next/link';

type Resource = {
  id: string;
  title: string;
  type: 'Textbook' | 'Past Paper' | 'Curriculum Guide' | 'Journal';
  subject: string;
  grade: string;
  fileUrl: string;
};

const mockResources: Resource[] = [
  { id: 'res-1', title: 'Form 4 Chemistry Textbook', type: 'Textbook', subject: 'Chemistry', grade: 'Form 4', fileUrl: '#' },
  { id: 'res-2', title: '2023 KCSE Mathematics Paper 1', type: 'Past Paper', subject: 'Mathematics', grade: 'Form 4', fileUrl: '#' },
  { id: 'res-3', title: 'History & Government Curriculum', type: 'Curriculum Guide', subject: 'History', grade: 'All Grades', fileUrl: '#' },
  { id: 'res-4', title: 'Journal of African History Vol. 65', type: 'Journal', subject: 'History', grade: 'Senior School', fileUrl: '#' },
  { id: 'res-5', title: 'Physics for Secondary Schools F2', type: 'Textbook', subject: 'Physics', grade: 'Form 2', fileUrl: '#' },
];

const resourceTypes = ['All Types', 'Textbook', 'Past Paper', 'Curriculum Guide', 'Journal'];
const subjects = ['All Subjects', 'Chemistry', 'Mathematics', 'History', 'Physics', 'English'];
const grades = ['All Grades', 'Senior School', 'Form 4', 'Form 3', 'Form 2', 'Form 1'];

const typeIcons: Record<Resource['type'], React.ElementType> = {
  Textbook: Book,
  'Past Paper': FileText,
  'Curriculum Guide': Newspaper,
  Journal: Newspaper,
};

export default function LibraryPage() {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [filteredType, setFilteredType] = React.useState('All Types');
  const [filteredSubject, setFilteredSubject] = React.useState('All Subjects');

  const filteredResources = mockResources.filter(res => 
    res.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
    (filteredType === 'All Types' || res.type === filteredType) &&
    (filteredSubject === 'All Subjects' || res.subject === filteredSubject)
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between mb-6">
        <div className="text-left">
          <h1 className="font-headline text-3xl font-bold flex items-center gap-2">
            <Library className="h-8 w-8 text-primary" />
            School Library & Resources
          </h1>
          <p className="text-muted-foreground">Access digital textbooks, past papers, and other learning materials.</p>
        </div>
         <Button disabled>
            <Upload className="mr-2" />
            Upload Resource
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="relative w-full md:max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    type="search"
                    placeholder="Search resources by title..."
                    className="w-full bg-background pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <div className="flex w-full flex-col gap-2 md:w-auto md:flex-row md:items-center">
                <Select value={filteredType} onValueChange={setFilteredType}>
                    <SelectTrigger className="w-full md:w-[180px]">
                        <SelectValue placeholder="Filter by type" />
                    </SelectTrigger>
                    <SelectContent>
                        {resourceTypes.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                </Select>
                 <Select value={filteredSubject} onValueChange={setFilteredSubject}>
                    <SelectTrigger className="w-full md:w-[180px]">
                        <SelectValue placeholder="Filter by subject" />
                    </SelectTrigger>
                    <SelectContent>
                        {subjects.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
            {filteredResources.length > 0 ? (
                <div className="w-full overflow-auto rounded-lg border">
                    <table className="w-full">
                        <thead className="bg-muted/50">
                            <tr className="border-b">
                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Title</th>
                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Type</th>
                                <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden sm:table-cell">Subject</th>
                                <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden md:table-cell">Grade</th>
                                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredResources.map((res) => {
                                const Icon = typeIcons[res.type];
                                return (
                                <tr key={res.id} className="border-b transition-colors hover:bg-muted/50">
                                    <td className="p-4 align-middle font-medium">
                                        <div className="flex items-center gap-3">
                                            <Icon className="h-5 w-5 text-primary/80 hidden sm:block" />
                                            <span>{res.title}</span>
                                        </div>
                                    </td>
                                    <td className="p-4 align-middle text-muted-foreground">{res.type}</td>
                                    <td className="p-4 align-middle text-muted-foreground hidden sm:table-cell">{res.subject}</td>
                                    <td className="p-4 align-middle text-muted-foreground hidden md:table-cell">{res.grade}</td>
                                    <td className="p-4 align-middle text-right">
                                        <Button asChild variant="outline" size="sm" disabled>
                                            <Link href={res.fileUrl}>
                                                <Download className="mr-2 h-4 w-4" />
                                                Download
                                            </Link>
                                        </Button>
                                    </td>
                                </tr>
                                );
                            })}
                        </tbody>
                    </table>
                 </div>
            ) : (
                <div className="flex min-h-[400px] items-center justify-center rounded-lg border-2 border-dashed border-muted">
                    <div className="text-center">
                    <Search className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-4 text-xl font-semibold">No Resources Found</h3>
                    <p className="mt-2 text-sm text-muted-foreground">Your search and filter combination yielded no results.</p>
                    </div>
                </div>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
