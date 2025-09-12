
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
import { Library, Search, Book, FileText, Newspaper, Upload, Bookmark, Clock, Eye } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type ResourceType = 'Textbook' | 'Past Paper' | 'Curriculum Guide' | 'Journal';
type ResourceStatus = 'Available' | 'Out' | 'Digital';

type Resource = {
  id: string;
  title: string;
  type: ResourceType;
  subject: string;
  grade: string;
  status: ResourceStatus;
  dueDate?: string;
};

const mockResources: Resource[] = [
  { id: 'res-1', title: 'Form 4 Chemistry Textbook', type: 'Textbook', subject: 'Chemistry', grade: 'Form 4', status: 'Available' },
  { id: 'res-2', title: '2023 KCSE Mathematics Paper 1', type: 'Past Paper', subject: 'Mathematics', grade: 'Form 4', status: 'Digital' },
  { id: 'res-3', title: 'History & Government Curriculum', type: 'Curriculum Guide', subject: 'History', grade: 'All Grades', status: 'Digital' },
  { id: 'res-4', title: 'Journal of African History Vol. 65', type: 'Journal', subject: 'History', grade: 'Senior School', status: 'Out', dueDate: '2024-08-05' },
  { id: 'res-5', title: 'Physics for Secondary Schools F2', type: 'Textbook', subject: 'Physics', grade: 'Form 2', status: 'Available' },
  { id: 'res-6', title: 'The River and The Source Novel', type: 'Textbook', subject: 'English', grade: 'Form 3', status: 'Out', dueDate: '2024-07-30'},
];

const resourceTypes = ['All Types', 'Textbook', 'Past Paper', 'Curriculum Guide', 'Journal'];
const subjects = ['All Subjects', 'Chemistry', 'Mathematics', 'History', 'Physics', 'English'];

const typeIcons: Record<ResourceType, React.ElementType> = {
  Textbook: Book,
  'Past Paper': FileText,
  'Curriculum Guide': Newspaper,
  Journal: Newspaper,
};

const statusConfig: Record<ResourceStatus, { label: string; className: string }> = {
    Available: { label: 'Available', className: 'bg-green-100 text-green-800 border-green-200' },
    Out: { label: 'Out', className: 'bg-red-100 text-red-800 border-red-200' },
    Digital: { label: 'Digital', className: 'bg-blue-100 text-blue-800 border-blue-200' },
}

export default function LibraryPage() {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [filteredType, setFilteredType] = React.useState('All Types');
  const [filteredSubject, setFilteredSubject] = React.useState('All Subjects');

  const filteredResources = mockResources.filter(res => 
    res.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
    (filteredType === 'All Types' || res.type === filteredType) &&
    (filteredSubject === 'All Subjects' || res.subject === filteredSubject)
  );

  const renderActionButton = (resource: Resource) => {
    switch (resource.status) {
        case 'Available':
            return <Button variant="outline" size="sm" disabled><Bookmark className="mr-2 h-4 w-4" />Borrow</Button>;
        case 'Out':
            return <Button variant="outline" size="sm" disabled><Clock className="mr-2 h-4 w-4" />Reserve</Button>;
        case 'Digital':
             return <Button variant="outline" size="sm" disabled><Eye className="mr-2 h-4 w-4" />View Digital</Button>;
    }
  }

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
                                <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden sm:table-cell">Type</th>
                                <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden md:table-cell">Subject</th>
                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
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
                                    <td className="p-4 align-middle text-muted-foreground hidden sm:table-cell">{res.type}</td>
                                    <td className="p-4 align-middle text-muted-foreground hidden md:table-cell">{res.subject}</td>
                                    <td className="p-4 align-middle">
                                        <Badge className={cn('whitespace-nowrap', statusConfig[res.status].className)}>
                                            {statusConfig[res.status].label}
                                        </Badge>
                                        {res.status === 'Out' && (
                                            <p className="text-xs text-muted-foreground mt-1">Due: {res.dueDate ? new Date(res.dueDate).toLocaleDateString() : 'N/A'}</p>
                                        )}
                                    </td>
                                    <td className="p-4 align-middle text-right">
                                       {renderActionButton(res)}
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
