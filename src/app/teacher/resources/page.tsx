
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
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import { Library, Search, Book, FileText, Newspaper, Eye, Printer, FileDown, ChevronDown, Star, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ResourceDetailsDialog } from '../library/resource-details-dialog';
import type { Resource, ResourceType } from '../library/types';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { firestore } from '@/lib/firebase';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/auth-context';

const resourceTypes: ResourceType[] = ['Textbook', 'Past Paper', 'Curriculum Guide', 'Journal'];

const typeIcons: Record<Resource['type'], React.ElementType> = {
  Textbook: Book,
  'Past Paper': FileText,
  'Curriculum Guide': Newspaper,
  Journal: Newspaper,
};

const statusConfig: Record<Resource['status'], { label: string; className: string }> = {
    Available: { label: 'Available', className: 'bg-green-100 text-green-800 border-green-200' },
    Out: { label: 'Out', className: 'bg-red-100 text-red-800 border-red-200' },
    Digital: { label: 'Digital', className: 'bg-blue-100 text-blue-800 border-blue-200' },
}

export default function LibraryPage() {
  const searchParams = useSearchParams();
  const schoolId = searchParams.get('schoolId');
  const [resources, setResources] = React.useState<Resource[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [filteredType, setFilteredType] = React.useState('All Types');
  const [filteredSubject, setFilteredSubject] = React.useState('All Subjects');
  const [selectedResource, setSelectedResource] = React.useState<Resource | null>(null);
  const [clientReady, setClientReady] = React.useState(false);
  const { toast } = useToast();
  const [teacherSubjects, setTeacherSubjects] = React.useState<string[]>(['All Subjects']);
  const { user } = useAuth();

  React.useEffect(() => {
    if (!schoolId) return;

    setClientReady(true);
    setIsLoading(true);
    const q = query(collection(firestore, `schools/${schoolId}/library-resources`));
    const unsubscribe = onSnapshot(q, (snapshot) => {
        const resourcesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Resource));
        setResources(resourcesData);
        setIsLoading(false);
    });

    if (user) {
        const subjectsQuery = query(collection(firestore, 'schools', schoolId, 'subjects'), where('teachers', 'array-contains', user.displayName));
        const unsubSubjects = onSnapshot(subjectsQuery, (snapshot) => {
            const subjectNames = snapshot.docs.map(doc => doc.data().name);
            setTeacherSubjects(['All Subjects', ...subjectNames]);
        });
        return () => {
            unsubscribe();
            unsubSubjects();
        };
    }
    
    return () => unsubscribe();
  }, [schoolId, user]);

  const filteredResources = resources.filter(res => 
    res.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
    (filteredType === 'All Types' || res.type === filteredType) &&
    (filteredSubject === 'All Subjects' || res.subject === filteredSubject)
  );

  const handleExport = (type: 'PDF' | 'CSV') => {
    if (type === 'CSV') {
        const headers = ['Title', 'Type', 'Subject', 'Status'];
        const rows = filteredResources.map(res => 
            [
                `"${res.title}"`,
                res.type,
                res.subject,
                res.status
            ].join(',')
        );
        const csvContent = [headers.join(','), ...rows].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute("download", "library-resources.csv");
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    } else {
         const doc = new jsPDF();
         doc.text("Library Resources", 14, 16);
         (doc as any).autoTable({
            startY: 22,
            head: [['Title', 'Type', 'Subject', 'Status']],
            body: filteredResources.map(res => [res.title, res.type, res.subject, res.status]),
         });
         doc.save('library-resources.pdf');
    }

     toast({
        title: 'Exporting Resources',
        description: `The resource list is being exported as a ${type} file.`
    });
  };
  
  if (!schoolId) {
    return <div className="p-8">Error: School ID is missing.</div>
  }


  return (
    <div className="p-4 sm:p-6 lg:p-8">
       <ResourceDetailsDialog
        resource={selectedResource}
        open={!!selectedResource}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            setSelectedResource(null);
          }
        }}
      />
      <div className="flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between mb-6">
        <div className="text-left">
          <h1 className="font-headline text-3xl font-bold flex items-center gap-2">
            <Library className="h-8 w-8 text-primary" />
            School Library & Resources
          </h1>
          <p className="text-muted-foreground">Access digital textbooks, past papers, and other learning materials.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex w-full items-center gap-2 md:max-w-sm">
                <div className="relative w-full">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Search resources..."
                        className="w-full bg-background pl-8"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
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
                        {teacherSubjects.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                </Select>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="w-full md:w-auto">
                            Export
                            <ChevronDown className="ml-2 h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => handleExport('PDF')}>
                            <FileDown className="mr-2" />
                            Export as PDF
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleExport('CSV')}>
                            <FileDown className="mr-2" />
                            Export as CSV
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => window.print()}>
                            <Printer className="mr-2" />
                            Print List
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
          </div>
        </CardHeader>
        <CardContent>
            {isLoading ? (
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                </div>
            ) : filteredResources.length > 0 ? (
                <>
                {/* Desktop Table */}
                <div className="w-full overflow-auto rounded-lg border hidden md:block">
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
                                <tr key={res.id} className="border-b transition-colors hover:bg-muted/50 cursor-pointer" onClick={() => setSelectedResource(res)}>
                                    <td className="p-4 align-middle font-medium">
                                        <div className="flex items-center gap-3">
                                            <Icon className="h-5 w-5 text-primary/80 hidden sm:block" />
                                            <div className="flex flex-col">
                                                <span className="hover:underline">{res.title}</span>
                                                {res.recommended && (
                                                    <Badge className="w-fit bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-100 mt-1">
                                                        <Star className="mr-1 h-3 w-3" /> Recommended
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4 align-middle text-muted-foreground hidden sm:table-cell">{res.type}</td>
                                    <td className="p-4 align-middle text-muted-foreground hidden md:table-cell">{res.subject}</td>
                                    <td className="p-4 align-middle">
                                        <Badge className={cn('whitespace-nowrap', statusConfig[res.status].className)}>
                                            {res.status === 'Available' ? `${res.availableCopies}/${res.totalCopies} Available` : statusConfig[res.status].label}
                                        </Badge>
                                        {res.status === 'Out' && clientReady && (
                                            <p className="text-xs text-muted-foreground mt-1">Due: {res.dueDate ? new Date(res.dueDate).toLocaleDateString('en-US', { timeZone: 'UTC' }) : 'N/A'}</p>
                                        )}
                                    </td>
                                    <td className="p-4 align-middle text-right" onClick={(e) => e.stopPropagation()}>
                                       <Button variant="outline" size="sm" onClick={() => setSelectedResource(res)}><Eye className="mr-2 h-4 w-4" />View</Button>
                                    </td>
                                </tr>
                                );
                            })}
                        </tbody>
                    </table>
                 </div>

                 {/* Mobile Cards */}
                <div className="grid gap-4 md:hidden">
                {filteredResources.map((res) => {
                    const Icon = typeIcons[res.type];
                    return (
                        <Card key={res.id} onClick={() => setSelectedResource(res)}>
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <Icon className="h-5 w-5 text-primary/80" />
                                        <CardTitle className="text-base font-semibold leading-tight">{res.title}</CardTitle>
                                    </div>
                                    <Badge className={cn('whitespace-nowrap', statusConfig[res.status].className)}>
                                        {res.status === 'Available' ? `${res.availableCopies}/${res.totalCopies} Avail.` : statusConfig[res.status].label}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-3">
                               <p className="text-sm text-muted-foreground">{res.subject} - {res.type}</p>
                               {res.recommended && (
                                    <Badge className="w-fit bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-100">
                                        <Star className="mr-1 h-3 w-3" /> Recommended
                                    </Badge>
                                )}
                               {res.status === 'Out' && clientReady && (
                                    <p className="text-xs text-muted-foreground">Due: {res.dueDate ? new Date(res.dueDate).toLocaleDateString('en-US', { timeZone: 'UTC' }) : 'N/A'}</p>
                                )}
                            </CardContent>
                             <CardFooter onClick={(e) => e.stopPropagation()}>
                               <Button variant="outline" size="sm" className="w-full" onClick={() => setSelectedResource(res)}><Eye className="mr-2 h-4 w-4" />View Details</Button>
                            </CardFooter>
                        </Card>
                    );
                })}
                </div>
                </>
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

    

    

    