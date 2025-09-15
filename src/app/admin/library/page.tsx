
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
import { Library, Search, PlusCircle, Book, FileText, Newspaper, Upload, Edit, Trash2, Loader2, Filter, ChevronDown, FileDown, Printer, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { firestore } from '@/lib/firebase';
import { collection, onSnapshot, query, addDoc, serverTimestamp, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import type { Resource, ResourceType, ResourceStatus } from '@/app/teacher/library/types';
import { MultiSelect } from '@/components/ui/multi-select';

const resourceTypes: ResourceType[] = ['Textbook', 'Past Paper', 'Curriculum Guide', 'Journal'];
const statuses: ResourceStatus[] = ['Available', 'Out', 'Digital'];

const typeIcons: Record<Resource['type'], React.ElementType> = {
  Textbook: Book,
  'Past Paper': FileText,
  'Curriculum Guide': Newspaper,
  Journal: Newspaper,
};

const statusConfig: Record<Resource['status'], { label: string; className: string }> = {
    Available: { label: 'Available', className: 'bg-green-100 text-green-800 border-green-200' },
    Out: { label: 'Checked Out', className: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
    Digital: { label: 'Digital', className: 'bg-blue-100 text-blue-800 border-blue-200' },
};


function EditResourceDialog({ resource, open, onOpenChange, onSave, onDelete }: { resource: Resource | null, open: boolean, onOpenChange: (open: boolean) => void, onSave: (id: string, data: Partial<Resource>) => void, onDelete: (id: string) => void }) {
    const [title, setTitle] = React.useState('');
    const [author, setAuthor] = React.useState('');
    const [description, setDescription] = React.useState('');
    
    React.useEffect(() => {
        if (resource) {
            setTitle(resource.title);
            setAuthor(resource.author);
            setDescription(resource.description);
        }
    }, [resource]);
    
    if (!resource) return null;

    const handleSave = () => {
        onSave(resource.id, { title, author, description });
        onOpenChange(false);
    };

    return (
         <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle>Edit Resource: {resource.title}</DialogTitle>
                </DialogHeader>
                 <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="edit-title">Title</Label>
                        <Input id="edit-title" value={title} onChange={(e) => setTitle(e.target.value)} />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="edit-author">Author/Publisher</Label>
                        <Input id="edit-author" value={author} onChange={(e) => setAuthor(e.target.value)} />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="edit-desc">Description</Label>
                        <Textarea id="edit-desc" value={description} onChange={(e) => setDescription(e.target.value)} />
                    </div>
                </div>
                <DialogFooter className="justify-between">
                     <Button variant="destructive" onClick={() => { onDelete(resource.id); onOpenChange(false); }}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete Resource
                    </Button>
                    <div>
                        <Button variant="outline" className="mr-2" onClick={() => onOpenChange(false)}>Cancel</Button>
                        <Button onClick={handleSave}>Save Changes</Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export default function AdminLibraryPage() {
    const searchParams = useSearchParams();
    const schoolId = searchParams.get('schoolId');
    const [resources, setResources] = React.useState<Resource[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [searchTerm, setSearchTerm] = React.useState('');
    const [filteredType, setFilteredType] = React.useState('All Types');
    const [filteredSubject, setFilteredSubject] = React.useState('All Subjects');
    const [filteredStatus, setFilteredStatus] = React.useState('All Statuses');
    const [editingResource, setEditingResource] = React.useState<Resource | null>(null);
    const { toast } = useToast();
    
    // State for new resource dialog
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const [newTitle, setNewTitle] = React.useState('');
    const [newAuthor, setNewAuthor] = React.useState('');
    const [newType, setNewType] = React.useState<ResourceType | undefined>();
    const [newSubject, setNewSubject] = React.useState<string | undefined>();
    const [newGrades, setNewGrades] = React.useState<string[]>([]);
    const [newDesc, setNewDesc] = React.useState('');

    const [dbSubjects, setDbSubjects] = React.useState<string[]>([]);
    const [dbGrades, setDbGrades] = React.useState<string[]>([]);

    React.useEffect(() => {
        if (!schoolId) {
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        const q = query(collection(firestore, `schools/${schoolId}/library-resources`));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setResources(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Resource)));
            setIsLoading(false);
        }, (error) => {
            console.error("Failed to fetch library resources: ", error);
            setIsLoading(false);
        });

        const subjectsQuery = query(collection(firestore, `schools/${schoolId}/subjects`));
        const unsubSubjects = onSnapshot(subjectsQuery, (snapshot) => {
            const subjectNames = snapshot.docs.map(doc => doc.data().name);
            setDbSubjects(subjectNames);
        });

        const classesQuery = query(collection(firestore, `schools/${schoolId}/classes`));
        const unsubClasses = onSnapshot(classesQuery, (snapshot) => {
            const gradeNames = snapshot.docs.map(doc => doc.data().name);
            setDbGrades([...new Set(gradeNames)]); // Use Set to get unique grade names like 'Form 1', 'Form 2'
        });


        return () => {
            unsubscribe();
            unsubSubjects();
            unsubClasses();
        };
    }, [schoolId]);

    const filteredResources = resources.filter(res => 
        res.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
        (filteredType === 'All Types' || res.type === filteredType) &&
        (filteredSubject === 'All Subjects' || res.subject === filteredSubject) &&
        (filteredStatus === 'All Statuses' || res.status === filteredStatus)
    );
    
    const dashboardStats = React.useMemo(() => {
        const total = resources.length;
        const available = resources.filter(r => r.status === 'Available').length;
        const out = resources.filter(r => r.status === 'Out').length;
        const digital = resources.filter(r => r.status === 'Digital').length;
        const overdue = resources.filter(r => r.status === 'Out' && r.dueDate && new Date(r.dueDate) < new Date()).length;
        return { total, available, out, digital, overdue };
    }, [resources]);

    const resetForm = () => {
        setNewTitle('');
        setNewAuthor('');
        setNewType(undefined);
        setNewSubject(undefined);
        setNewGrades([]);
        setNewDesc('');
    };

    const handleAddResource = async () => {
        if (!schoolId || !newTitle || !newAuthor || !newType || !newSubject || newGrades.length === 0) {
            toast({ title: "Missing Information", description: "Please fill out all fields.", variant: "destructive" });
            return;
        }

        setIsSubmitting(true);
        try {
            await addDoc(collection(firestore, `schools/${schoolId}/library-resources`), {
                title: newTitle,
                author: newAuthor,
                type: newType,
                subject: newSubject,
                grade: newGrades,
                description: newDesc,
                status: 'Available',
                createdAt: serverTimestamp(),
            });
            toast({ title: "Resource Added", description: `"${newTitle}" has been added to the library.` });
            resetForm();
        } catch (error) {
            console.error("Error adding resource:", error);
            toast({ title: "Failed to add resource", variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const handleUpdateResource = async (id: string, data: Partial<Resource>) => {
        if (!schoolId) return;
        try {
            await updateDoc(doc(firestore, 'schools', schoolId, 'library-resources', id), data);
            toast({ title: "Resource Updated" });
        } catch (error) {
            toast({ title: "Update Failed", variant: "destructive" });
        }
    };
    
    const handleDeleteResource = async (id: string) => {
        if (!schoolId) return;
         if (!window.confirm("Are you sure you want to delete this resource? This cannot be undone.")) return;
        try {
            await deleteDoc(doc(firestore, 'schools', schoolId, 'library-resources', id));
            toast({ title: "Resource Deleted", variant: "destructive" });
        } catch (error) {
            toast({ title: "Deletion Failed", variant: "destructive" });
        }
    };

    if (!schoolId) {
        return <div className="p-8">Error: School ID is missing.</div>
    }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between mb-6">
        <div className="text-left">
          <h1 className="font-headline text-3xl font-bold flex items-center gap-2">
            <Library className="h-8 w-8 text-primary" />
            Library Management
          </h1>
          <p className="text-muted-foreground">Oversee all library resources, borrowing, and inventory.</p>
        </div>
      </div>
      
       <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5 mb-6">
            <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Total Resources</CardTitle><Book className="h-4 w-4 text-muted-foreground"/></CardHeader><CardContent><div className="text-2xl font-bold">{dashboardStats.total}</div></CardContent></Card>
            <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Available</CardTitle><Book className="h-4 w-4 text-muted-foreground"/></CardHeader><CardContent><div className="text-2xl font-bold">{dashboardStats.available}</div></CardContent></Card>
            <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Checked Out</CardTitle><Book className="h-4 w-4 text-muted-foreground"/></CardHeader><CardContent><div className="text-2xl font-bold">{dashboardStats.out}</div></CardContent></Card>
            <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Digital Copies</CardTitle><Book className="h-4 w-4 text-muted-foreground"/></CardHeader><CardContent><div className="text-2xl font-bold">{dashboardStats.digital}</div></CardContent></Card>
            <Card className="border-destructive/50"><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium text-destructive">Overdue</CardTitle><AlertTriangle className="h-4 w-4 text-destructive"/></CardHeader><CardContent><div className="text-2xl font-bold text-destructive">{dashboardStats.overdue}</div></CardContent></Card>
       </div>

      <Card>
        <CardHeader>
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex w-full items-center gap-2 md:max-w-sm">
                    <div className="relative w-full">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input type="search" placeholder="Search by title, author..." className="w-full bg-background pl-8" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    </div>
                </div>
                <div className="flex w-full flex-col gap-2 md:w-auto md:flex-row md:items-center">
                    <Select value={filteredType} onValueChange={setFilteredType}><SelectTrigger className="w-full md:w-[150px]"><SelectValue /></SelectTrigger><SelectContent>{['All Types', ...resourceTypes].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select>
                    <Select value={filteredSubject} onValueChange={setFilteredSubject}><SelectTrigger className="w-full md:w-[150px]"><SelectValue /></SelectTrigger><SelectContent>{['All Subjects', ...dbSubjects].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select>
                    <Select value={filteredStatus} onValueChange={setFilteredStatus}><SelectTrigger className="w-full md:w-[150px]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="All Statuses">All Statuses</SelectItem>{statuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select>
                </div>
                 <div className="flex w-full md:w-auto items-center gap-2">
                    <Dialog>
                        <DialogTrigger asChild><Button><PlusCircle className="mr-2"/>Add Resource</Button></DialogTrigger>
                        <DialogContent className="sm:max-w-xl">
                            <DialogHeader><DialogTitle>Add New Library Resource</DialogTitle><DialogDescription>Fill in the details for the new resource.</DialogDescription></DialogHeader>
                            <div className="grid gap-6 py-4 max-h-[70vh] overflow-y-auto pr-4">
                                <div className="grid grid-cols-2 gap-4"><div className="space-y-2"><Label htmlFor="new-title">Title</Label><Input id="new-title" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} /></div><div className="space-y-2"><Label htmlFor="new-author">Author / Publisher</Label><Input id="new-author" value={newAuthor} onChange={(e) => setNewAuthor(e.target.value)} /></div></div>
                                <div className="grid grid-cols-2 gap-4"><div className="space-y-2"><Label htmlFor="new-type">Type</Label><Select value={newType} onValueChange={(v: ResourceType) => setNewType(v)}><SelectTrigger id="new-type"><SelectValue placeholder="Select type..." /></SelectTrigger><SelectContent>{resourceTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select></div><div className="space-y-2"><Label htmlFor="new-subject">Subject</Label><Select value={newSubject} onValueChange={setNewSubject}><SelectTrigger id="new-subject"><SelectValue placeholder="Select subject..." /></SelectTrigger><SelectContent>{dbSubjects.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div></div>
                                <div className="space-y-2"><Label>Applicable Grades/Forms</Label><MultiSelect options={dbGrades.map(g => ({value: g, label: g}))} selected={newGrades} onChange={setNewGrades} placeholder="Select grades..." /></div>
                                <div className="space-y-2"><Label htmlFor="new-desc">Description</Label><Textarea id="new-desc" value={newDesc} onChange={(e) => setNewDesc(e.target.value)} /></div>
                            </div>
                            <DialogFooter><DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose><Button onClick={handleAddResource} disabled={isSubmitting}>{isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Add Resource</Button></DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>
        </CardHeader>
        <CardContent>
            {isLoading ? (
                <div className="flex h-64 items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>
            ) : filteredResources.length > 0 ? (
                <div className="w-full overflow-auto rounded-lg border">
                    <Table><TableHeader><TableRow><TableHead>Title</TableHead><TableHead>Type</TableHead><TableHead>Subject</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                        <TableBody>
                            {filteredResources.map((res) => {
                                const Icon = typeIcons[res.type];
                                return (
                                <TableRow key={res.id}>
                                    <TableCell className="font-medium"><div className="flex items-center gap-3"><Icon className="h-5 w-5 text-primary/80 hidden sm:block" />{res.title}</div></TableCell>
                                    <TableCell>{res.type}</TableCell>
                                    <TableCell>{res.subject}</TableCell>
                                    <TableCell><Badge className={cn('whitespace-nowrap', statusConfig[res.status].className)}>{statusConfig[res.status].label}</Badge></TableCell>
                                    <TableCell className="text-right"><Button variant="ghost" size="sm" onClick={() => setEditingResource(res)}><Edit className="mr-2 h-4 w-4" />Edit</Button></TableCell>
                                </TableRow>
                            )})}
                        </TableBody>
                    </Table>
                </div>
            ) : (
                <div className="flex min-h-[300px] items-center justify-center rounded-lg border-2 border-dashed border-muted">
                    <div className="text-center text-muted-foreground">
                        <Search className="mx-auto h-12 w-12" />
                        <h3 className="mt-4 text-lg font-semibold">No Resources Found</h3>
                        <p className="mt-1 text-sm">Your search or filters returned no results.</p>
                    </div>
                </div>
            )}
        </CardContent>
      </Card>
      <EditResourceDialog resource={editingResource} open={!!editingResource} onOpenChange={(open) => !open && setEditingResource(null)} onSave={handleUpdateResource} onDelete={handleDeleteResource} />
    </div>
  );
}
