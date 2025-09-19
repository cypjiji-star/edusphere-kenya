
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
import { Shapes, PlusCircle, User, Search, ArrowRight, Edit, UserPlus, Trash2, Filter, AlertCircle, UserCheck, FileDown, Printer, ChevronDown, GraduationCap, Loader2, Users } from 'lucide-react';
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { firestore } from '@/lib/firebase';
import { collection, onSnapshot, doc, addDoc, updateDoc, deleteDoc, query, where, serverTimestamp, setDoc, writeBatch, getDocs } from 'firebase/firestore';
import { useSearchParams } from 'next/navigation';
import { MultiSelect } from '@/components/ui/multi-select';
import jsPDF from 'jspdf';
import 'jspdf-autotable';


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
  teacherId: string;
  status: 'Active' | 'Graduated';
};

type Subject = {
    id: string;
    name: string;
    code: string;
    department: string;
    teachers: string[];
    classes: string[];
};

type Teacher = {
    id: string;
    name: string;
    avatarUrl: string;
};

type ClassAssignment = {
    [classId: string]: { subject: string; teacher: string | null }[];
};

const mockDepartments = ['Sciences', 'Mathematics', 'Languages', 'Humanities', 'Technical Subjects', 'Creative Arts'];

function ManageClassSubjectsDialog({ schoolClass, allSubjects, schoolId, classAssignments, setClassAssignments }: { schoolClass: SchoolClass, allSubjects: Subject[], schoolId: string, classAssignments: ClassAssignment, setClassAssignments: React.Dispatch<React.SetStateAction<ClassAssignment>> }) {
    const { toast } = useToast();
    const [selectedSubjects, setSelectedSubjects] = React.useState<string[]>(() => {
        return (classAssignments[schoolClass.id] || []).map(a => a.subject);
    });
    const [isSaving, setIsSaving] = React.useState(false);

    const handleCheckboxChange = (subjectName: string, checked: boolean) => {
        setSelectedSubjects(prev => 
            checked ? [...prev, subjectName] : prev.filter(s => s !== subjectName)
        );
    };

    const handleSaveChanges = async () => {
        setIsSaving(true);
        const assignments = selectedSubjects.map(subjectName => {
            const existing = (classAssignments[schoolClass.id] || []).find(a => a.subject === subjectName);
            return existing || { subject: subjectName, teacher: null };
        });

        try {
            const assignmentRef = doc(firestore, 'schools', schoolId, 'class-assignments', schoolClass.id);
            await setDoc(assignmentRef, { assignments });
            // Optimistic update
            setClassAssignments(prev => ({ ...prev, [schoolClass.id]: assignments }));
            toast({ title: 'Subjects Updated', description: `Subjects for ${schoolClass.name} ${schoolClass.stream || ''} have been saved.` });
        } catch (e) {
            console.error("Failed to save subject assignments:", e);
            toast({ title: 'Save Failed', variant: 'destructive' });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="secondary" size="sm">Manage Subjects</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Manage Subjects for {schoolClass.name} {schoolClass.stream || ''}</DialogTitle>
                    <DialogDescription>Select the subjects taught in this class.</DialogDescription>
                </DialogHeader>
                <div className="py-4 max-h-[60vh] overflow-y-auto">
                    <div className="space-y-2">
                        {allSubjects.map(subject => (
                            <div key={subject.id} className="flex items-center space-x-2 p-2 rounded-md hover:bg-muted">
                                <Checkbox
                                    id={`sub-${schoolClass.id}-${subject.id}`}
                                    checked={selectedSubjects.includes(subject.name)}
                                    onCheckedChange={(checked) => handleCheckboxChange(subject.name, !!checked)}
                                />
                                <Label htmlFor={`sub-${schoolClass.id}-${subject.id}`} className="font-normal">{subject.name}</Label>
                            </div>
                        ))}
                    </div>
                </div>
                <DialogFooter>
                    <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                    <DialogClose asChild>
                        <Button onClick={handleSaveChanges} disabled={isSaving}>
                            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save
                        </Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

function EditSubjectDialog({ subject, teachers, open, onOpenChange, onSave, onDelete }: { subject: Subject | null, teachers: Teacher[], open: boolean, onOpenChange: (open: boolean) => void, onSave: (id: string, data: Partial<Subject>) => void, onDelete: (id: string, name: string) => void }) {
    const [name, setName] = React.useState('');
    const [code, setCode] = React.useState('');
    const [department, setDepartment] = React.useState('');
    const [assignedTeachers, setAssignedTeachers] = React.useState<string[]>([]);
    
    const teacherOptions = React.useMemo(() => teachers.map(t => ({ value: t.name, label: t.name })), [teachers]);

    React.useEffect(() => {
        if (subject) {
            setName(subject.name);
            setCode(subject.code);
            setDepartment(subject.department);
            setAssignedTeachers(subject.teachers || []);
        }
    }, [subject]);
    
    if (!subject) return null;

    const handleSave = () => {
        onSave(subject.id, { name, code, department, teachers: assignedTeachers });
        onOpenChange(false);
    };

    return (
         <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle>Edit Subject: {subject.name}</DialogTitle>
                </DialogHeader>
                <div className="grid gap-6 py-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="subject-name-edit">Subject Name</Label>
                            <Input id="subject-name-edit" value={name} onChange={(e) => setName(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="subject-code-edit">Subject Code</Label>
                            <Input id="subject-code-edit" value={code} onChange={(e) => setCode(e.target.value)} />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="subject-dept-edit">Department</Label>
                        <Select value={department} onValueChange={setDepartment}>
                            <SelectTrigger id="subject-dept-edit">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {mockDepartments.map(dept => (
                                    <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="subject-teachers-edit">Assigned Teachers</Label>
                         <MultiSelect
                            options={teacherOptions}
                            selected={assignedTeachers}
                            onChange={setAssignedTeachers}
                            placeholder="Select teachers..."
                        />
                    </div>
                </div>
                <DialogFooter className="justify-between">
                     <Button variant="destructive" onClick={() => { onDelete(subject.id, subject.name); onOpenChange(false); }}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete Subject
                    </Button>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                        <Button onClick={handleSave}>Save Changes</Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export default function ClassesAndSubjectsPage() {
    const searchParams = useSearchParams();
    const schoolId = searchParams.get('schoolId');
    const { toast } = useToast();
    const [classes, setClasses] = React.useState<SchoolClass[]>([]);
    const [subjects, setSubjects] = React.useState<Subject[]>([]);
    const [teachers, setTeachers] = React.useState<Teacher[]>([]);
    const [classAssignments, setClassAssignments] = React.useState<ClassAssignment>({});
    
    // State for new class dialog
    const [newClassName, setNewClassName] = React.useState('');
    const [newClassStream, setNewClassStream] = React.useState('');
    const [newClassTeacherId, setNewClassTeacherId] = React.useState('');
    const [newClassCapacity, setNewClassCapacity] = React.useState('');

    // State for new subject dialog
    const [newSubjectName, setNewSubjectName] = React.useState('');
    const [newSubjectCode, setNewSubjectCode] = React.useState('');
    const [newSubjectDept, setNewSubjectDept] = React.useState('');
    const [newSubjectTeachers, setNewSubjectTeachers] = React.useState<string[]>([]);
    
    // State for editing subject
    const [editingSubject, setEditingSubject] = React.useState<Subject | null>(null);
    const [selectedAssignmentClass, setSelectedAssignmentClass] = React.useState<string>('');
    const [isLoading, setIsLoading] = React.useState(true);
    const [isSaving, setIsSaving] = React.useState(false);


    React.useEffect(() => {
        if (!schoolId) return;

        const unsubClasses = onSnapshot(collection(firestore, 'schools', schoolId, 'classes'), (snapshot) => {
            const fetchedClasses = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as SchoolClass));
            setClasses(fetchedClasses);
            if (!selectedAssignmentClass && fetchedClasses.length > 0) {
              setSelectedAssignmentClass(fetchedClasses[0].id);
            }
            setIsLoading(false);
        });
        const unsubSubjects = onSnapshot(collection(firestore, 'schools', schoolId, 'subjects'), (snapshot) => {
            setSubjects(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Subject)));
        });
        const unsubTeachers = onSnapshot(query(collection(firestore, 'schools', schoolId, 'users'), where('role', '==', 'Teacher')), (snapshot) => {
            setTeachers(snapshot.docs.map(d => ({ id: d.id, name: d.data().name, avatarUrl: d.data().avatarUrl } as Teacher)));
        });
        const unsubAssignments = onSnapshot(collection(firestore, 'schools', schoolId, 'class-assignments'), (snapshot) => {
            const assignments: ClassAssignment = {};
            snapshot.forEach(doc => {
                assignments[doc.id] = doc.data().assignments;
            });
            setClassAssignments(assignments);
        });

        return () => {
            unsubClasses();
            unsubSubjects();
            unsubTeachers();
            unsubAssignments();
        };
    }, [schoolId, selectedAssignmentClass]);
    
    const teacherWorkload: Record<string, number> = React.useMemo(() => {
        const load: Record<string, number> = {};
        Object.values(classAssignments).flat().forEach(assignment => {
            if (assignment.teacher) {
                load[assignment.teacher] = (load[assignment.teacher] || 0) + 1;
            }
        });
        return load;
    }, [classAssignments]);

    const OVER_ASSIGNED_THRESHOLD = 5;
    
    const resetNewClassForm = () => {
        setNewClassName('');
        setNewClassStream('');
        setNewClassTeacherId('');
        setNewClassCapacity('');
    };

    const handleCreateClass = async () => {
        if (!schoolId || !newClassName || !newClassTeacherId || !newClassCapacity) {
            toast({ title: 'Missing Information', description: 'Please fill out all required fields.', variant: 'destructive' });
            return;
        }

        setIsSaving(true);
        const teacher = teachers.find(t => t.id === newClassTeacherId);
        if (!teacher) {
            toast({ title: 'Invalid Teacher', description: 'Selected teacher could not be found.', variant: 'destructive' });
            setIsSaving(false);
            return;
        }

        try {
            await addDoc(collection(firestore, 'schools', schoolId, 'classes'), {
                name: newClassName,
                stream: newClassStream || null,
                classTeacher: { name: teacher.name, avatarUrl: teacher.avatarUrl },
                teacherId: newClassTeacherId,
                capacity: Number(newClassCapacity),
                studentCount: 0,
                status: 'Active',
                createdAt: serverTimestamp(),
            });

            toast({ title: 'Class Created', description: `The class "${newClassName} ${newClassStream}" has been successfully created.` });
            resetNewClassForm();
        } catch (error) {
            console.error('Error creating class:', error);
            toast({ title: 'Creation Failed', variant: 'destructive' });
        } finally {
            setIsSaving(false);
        }
    };
    
    const handleUpdateClass = async (classId: string, updates: Partial<SchoolClass>) => {
        if (!schoolId) return;
        
        setIsSaving(true);
        try {
            const classRef = doc(firestore, 'schools', schoolId, 'classes', classId);
            await updateDoc(classRef, updates);

            // If class is marked as Graduated, update all students in that class
            if (updates.status === 'Graduated') {
                const studentsQuery = query(collection(firestore, `schools/${schoolId}/students`), where('classId', '==', classId));
                const studentsSnapshot = await getDocs(studentsQuery);
                
                const batch = writeBatch(firestore);
                studentsSnapshot.forEach(studentDoc => {
                    const studentRef = doc(firestore, 'schools', schoolId, 'students', studentDoc.id);
                    batch.update(studentRef, { status: 'Graduated' });
                });
                await batch.commit();

                toast({ title: 'Class & Students Graduated', description: `The class and its students have been marked as graduated.` });
            } else {
                toast({ title: 'Class Updated', description: 'The class details have been saved.' });
            }

        } catch (error) {
            console.error('Error updating class:', error);
            toast({ title: 'Update Failed', variant: 'destructive' });
        } finally {
            setIsSaving(false);
        }
    };


    const handleExport = (type: 'PDF' | 'CSV' | 'Print', tab: 'classes' | 'subjects' | 'assignments') => {
        let headers: string[] = [];
        let body: (string | number)[][] = [];
        let title = '';
        let filename = '';

        if (tab === 'classes') {
            headers = ['Class', 'Stream', 'Class Teacher', 'Enrollment'];
            body = classes.map(c => [c.name, c.stream || '-', c.classTeacher.name, `${c.studentCount}/${c.capacity}`]);
            title = 'Class List';
            filename = 'class-list';
        } else if (tab === 'subjects') {
            headers = ['Subject', 'Code', 'Department', 'Assigned Teachers'];
            body = subjects.map(s => [s.name, s.code, s.department, (s.teachers || []).join(', ')]);
            title = 'Subject List';
            filename = 'subject-list';
        } else { // Assignments
            const className = classes.find(c => c.id === selectedAssignmentClass)?.name || '';
            headers = ['Subject', 'Assigned Teacher'];
            body = (classAssignments[selectedAssignmentClass] || []).map(a => [a.subject, a.teacher || 'Unassigned']);
            title = `Teacher Assignments for ${className}`;
            filename = `assignments-${className.replace(/\s+/g, '-')}`;
        }

        if (type === 'Print') {
            window.print();
            return;
        }

        if (type === 'CSV') {
            const csvContent = [headers.join(','), ...body.map(row => row.join(','))].join('\n');
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement("a");
            const url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute("download", `${filename}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } else { // PDF
            const doc = new jsPDF();
            doc.text(title, 14, 16);
            (doc as any).autoTable({ startY: 22, head: [headers], body: body });
            doc.save(`${filename}.pdf`);
        }

        toast({
            title: 'Exporting Data',
            description: `Your ${filename.replace('-', ' ')} is being exported as a ${type} file.`,
        });
    };

    const handleAssignTeacher = async (classId: string, subject: string, teacherName: string) => {
        if (!schoolId) return;
        setIsSaving(true);
        const currentAssignments = classAssignments[classId] || [];
        const updatedAssignments = currentAssignments.map(a => 
            a.subject === subject ? { ...a, teacher: teacherName } : a
        );

        try {
            const assignmentRef = doc(firestore, `schools/${schoolId}/class-assignments`, classId);
            await setDoc(assignmentRef, { assignments: updatedAssignments }, { merge: true });
            toast({
                title: 'Teacher Assigned',
                description: `${teacherName} has been assigned to teach ${subject} in this class.`
            });
        } catch (error) {
            console.error("Failed to assign teacher:", error);
            toast({ title: 'Assignment Failed', variant: 'destructive' });
        } finally {
            setIsSaving(false);
        }
    };
    
    const handleDelete = async (collectionName: string, id: string, name: string) => {
        if (!schoolId) return;
        try {
            await deleteDoc(doc(firestore, `schools/${schoolId}/${collectionName}`, id));
            toast({
                title: `${collectionName === 'subjects' ? 'Subject' : 'Class'} Deleted`,
                description: `The ${collectionName === 'subjects' ? 'subject' : 'class'} "${name}" has been deleted.`,
                variant: 'destructive',
            });
        } catch (error) {
             toast({ title: 'Deletion failed', variant: 'destructive' });
        }
    };
    
    const handleCreateSubject = async () => {
        if (!schoolId || !newSubjectName || !newSubjectCode || !newSubjectDept) {
            toast({ title: 'Missing Information', variant: 'destructive' });
            return;
        }
        setIsSaving(true);
        try {
            await addDoc(collection(firestore, `schools/${schoolId}/subjects`), {
                name: newSubjectName,
                code: newSubjectCode,
                department: newSubjectDept,
                teachers: newSubjectTeachers,
                classes: [],
                createdAt: serverTimestamp(),
            });
            toast({ title: 'Subject Created' });
            setNewSubjectName('');
            setNewSubjectCode('');
            setNewSubjectDept('');
            setNewSubjectTeachers([]);
        } catch(e) {
            console.error(e);
            toast({ title: 'Creation Failed', variant: 'destructive' });
        } finally {
            setIsSaving(false);
        }
    }
    
    const handleUpdateSubject = async (id: string, data: Partial<Subject>) => {
        if (!schoolId) return;
        setIsSaving(true);
        try {
            await updateDoc(doc(firestore, 'schools', schoolId, 'subjects', id), data);
            toast({ title: 'Subject Updated' });
        } catch (e) {
            console.error(e);
            toast({ title: 'Update Failed', variant: 'destructive' });
        } finally {
            setIsSaving(false);
        }
    };
    
    if (!schoolId) {
        return <div className="p-8">Error: School ID is missing from URL.</div>
    }

    const currentClassForAssignment = classes.find(c => c.id === selectedAssignmentClass);
    const assignmentsForSelectedClass = currentClassForAssignment ? classAssignments[currentClassForAssignment.id] || [] : [];


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
        <TabsList className="mb-4 grid w-full grid-cols-1 sm:grid-cols-3 h-auto">
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
                        <div className="flex w-full flex-col sm:flex-row gap-2 md:w-auto">
                            <Dialog>
                                <DialogTrigger asChild>
                                    <Button className="w-full sm:w-auto">
                                    <PlusCircle className="mr-2" />
                                    Add New Class
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-md">
                                    <DialogHeader>
                                        <DialogTitle>Add a New Class</DialogTitle>
                                        <DialogDescription>
                                            Fill in the details below. A unique class code will be generated automatically.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="grid gap-4 py-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="class-name">Class Name</Label>
                                            <Input id="class-name" placeholder="e.g., Form 1" value={newClassName} onChange={e => setNewClassName(e.target.value)} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="class-stream">Stream</Label>
                                            <Input id="class-stream" placeholder="e.g., A, North (Optional)" value={newClassStream} onChange={e => setNewClassStream(e.target.value)} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="class-teacher">Class Teacher</Label>
                                            <Select value={newClassTeacherId} onValueChange={setNewClassTeacherId}>
                                                <SelectTrigger id="class-teacher">
                                                    <SelectValue placeholder="Select a teacher" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {teachers.map(teacher => (
                                                        <SelectItem key={teacher.id} value={teacher.id}>{teacher.name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="class-capacity">Capacity</Label>
                                            <Input id="class-capacity" type="number" placeholder="e.g., 45" value={newClassCapacity} onChange={e => setNewClassCapacity(e.target.value)} />
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <DialogClose asChild><Button variant="outline" onClick={resetNewClassForm}>Cancel</Button></DialogClose>
                                        <DialogClose asChild>
                                            <Button onClick={handleCreateClass} disabled={isSaving}>
                                                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                                                Save Class
                                            </Button>
                                        </DialogClose>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                             <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" className="w-full sm:w-auto">
                                        <FileDown className="mr-2 h-4 w-4" />
                                        Export
                                        <ChevronDown className="ml-2 h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                    <DropdownMenuItem onClick={() => handleExport('PDF', 'classes')}><FileDown className="mr-2 h-4 w-4" />Export as PDF</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleExport('CSV', 'classes')}><FileDown className="mr-2 h-4 w-4" />Export as CSV</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleExport('Print', 'classes')}><Printer className="mr-2 h-4 w-4" />Print List</DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {/* Desktop Table */}
                    <div className="w-full overflow-auto rounded-lg border hidden md:block">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Class</TableHead>
                                    <TableHead>Stream</TableHead>
                                    <TableHead>Class Teacher</TableHead>
                                    <TableHead className="text-center">Enrollment</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {classes.map((schoolClass) => (
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
                                        <TableCell>
                                            {schoolClass.status === 'Graduated' ? 
                                                <Badge variant="outline" className="text-purple-600 border-purple-500"><GraduationCap className="mr-1 h-3 w-3"/>Graduated</Badge> : 
                                                <Badge>Active</Badge>
                                            }
                                        </TableCell>
                                        <TableCell className="text-right space-x-2">
                                            <ManageClassSubjectsDialog
                                                schoolClass={schoolClass}
                                                allSubjects={subjects}
                                                schoolId={schoolId}
                                                classAssignments={classAssignments}
                                                setClassAssignments={setClassAssignments}
                                            />
                                            <Dialog>
                                                <DialogTrigger asChild>
                                                    <Button variant="ghost" size="sm">
                                                        <Edit className="mr-2 h-4 w-4" /> Edit
                                                    </Button>
                                                </DialogTrigger>
                                                <DialogContent className="sm:max-w-md">
                                                    <form onSubmit={(e) => {
                                                        e.preventDefault();
                                                        const formData = new FormData(e.currentTarget);
                                                        const teacherId = formData.get('teacherId') as string;
                                                        const teacher = teachers.find(t => t.id === teacherId);
                                                        const updates: Partial<SchoolClass> = {
                                                            name: formData.get('className') as string,
                                                            stream: formData.get('stream') as string,
                                                            capacity: Number(formData.get('capacity')),
                                                            status: formData.get('status') as 'Active' | 'Graduated'
                                                        };
                                                        if (teacher) {
                                                            updates.teacherId = teacherId;
                                                            updates.classTeacher = { name: teacher.name, avatarUrl: teacher.avatarUrl };
                                                        }
                                                        handleUpdateClass(schoolClass.id, updates);
                                                    }}>
                                                    <DialogHeader>
                                                        <DialogTitle>Edit Class: {schoolClass.name} {schoolClass.stream || ''}</DialogTitle>
                                                        <DialogDescription>
                                                            Update the details for this class.
                                                        </DialogDescription>
                                                    </DialogHeader>
                                                    <div className="grid gap-4 py-4">
                                                        <div className="space-y-2">
                                                            <Label htmlFor="className">Class Name</Label>
                                                            <Input id="className" name="className" defaultValue={schoolClass.name} />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label htmlFor="stream">Stream</Label>
                                                            <Input id="stream" name="stream" defaultValue={schoolClass.stream} />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label htmlFor="teacherId">Class Teacher</Label>
                                                            <Select name="teacherId" defaultValue={schoolClass.teacherId}>
                                                                <SelectTrigger id="teacherId">
                                                                    <SelectValue />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    {teachers.map(teacher => (
                                                                        <SelectItem key={teacher.id} value={teacher.id}>{teacher.name}</SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label htmlFor="capacity">Capacity</Label>
                                                            <Input id="capacity" name="capacity" type="number" defaultValue={schoolClass.capacity} />
                                                        </div>
                                                         <div className="space-y-2">
                                                            <Label htmlFor="status">Status</Label>
                                                            <Select name="status" defaultValue={schoolClass.status || 'Active'}>
                                                                <SelectTrigger id="status">
                                                                    <SelectValue />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value="Active">Active</SelectItem>
                                                                    <SelectItem value="Graduated">Graduated</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                    </div>
                                                    <DialogFooter className="justify-between">
                                                        <AlertDialog>
                                                            <AlertDialogTrigger asChild>
                                                                <Button type="button" variant="destructive">
                                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                                    Archive Class
                                                                </Button>
                                                            </AlertDialogTrigger>
                                                            <AlertDialogContent>
                                                                <AlertDialogHeader>
                                                                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                                    <AlertDialogDescription>This will archive the class. This action cannot be easily undone.</AlertDialogDescription>
                                                                </AlertDialogHeader>
                                                                <AlertDialogFooter>
                                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                    <AlertDialogAction onClick={() => handleDelete('classes', schoolClass.id, `${schoolClass.name} ${schoolClass.stream || ''}`)}>Continue</AlertDialogAction>
                                                                </AlertDialogFooter>
                                                            </AlertDialogContent>
                                                        </AlertDialog>
                                                        <div className="flex gap-2">
                                                            <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
                                                            <Button type="submit" disabled={isSaving}>
                                                                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                                                                Save Changes
                                                            </Button>
                                                        </div>
                                                    </DialogFooter>
                                                    </form>
                                                </DialogContent>
                                            </Dialog>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                     {/* Mobile Cards */}
                    <div className="grid grid-cols-1 gap-4 md:hidden">
                        {classes.map(schoolClass => (
                            <Card key={schoolClass.id}>
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-base">{schoolClass.name} {schoolClass.stream || ''}</CardTitle>
                                        {schoolClass.status === 'Graduated' ? 
                                            <Badge variant="outline" className="text-purple-600 border-purple-500"><GraduationCap className="mr-1 h-3 w-3"/>Graduated</Badge> : 
                                            <Badge>Active</Badge>
                                        }
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-sm space-y-2">
                                        <div className="flex items-center gap-2">
                                            <UserCheck className="h-4 w-4 text-muted-foreground"/>
                                            <span>Class Teacher: {schoolClass.classTeacher.name}</span>
                                        </div>
                                         <div className="flex items-center gap-2">
                                             <Users className="h-4 w-4 text-muted-foreground"/>
                                             <span>Enrollment: {schoolClass.studentCount} / {schoolClass.capacity}</span>
                                         </div>
                                    </div>
                                </CardContent>
                                <CardFooter className="flex justify-end">
                                     <Dialog>
                                        <DialogTrigger asChild>
                                            <Button variant="outline" size="sm">
                                                <Edit className="mr-2 h-4 w-4" /> Edit
                                            </Button>
                                        </DialogTrigger>
                                        {/* DialogContent for mobile edit would be same as desktop */}
                                    </Dialog>
                                </CardFooter>
                            </Card>
                        ))}
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
                                    <Button className="w-full sm:w-auto">
                                        <PlusCircle className="mr-2 h-4 w-4"/>
                                        Add New Subject
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-xl">
                                    <DialogHeader>
                                        <DialogTitle>Add New Subject</DialogTitle>
                                        <DialogDescription>Define a new subject and assign it to classes and teachers.</DialogDescription>
                                    </DialogHeader>
                                    <div className="grid gap-6 py-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="subject-name">Subject Name</Label>
                                                <Input id="subject-name" placeholder="e.g., Computer Science" value={newSubjectName} onChange={e => setNewSubjectName(e.target.value)} />
                                            </div>
                                             <div className="space-y-2">
                                                <Label htmlFor="subject-code">Subject Code</Label>
                                                <Input id="subject-code" placeholder="e.g., 451" value={newSubjectCode} onChange={e => setNewSubjectCode(e.target.value)} />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="subject-dept">Department</Label>
                                            <Select value={newSubjectDept} onValueChange={setNewSubjectDept}>
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
                                         <div className="space-y-2">
                                            <Label>Assigned Teachers</Label>
                                            <MultiSelect
                                                options={teachers.map(t => ({ value: t.name, label: t.name }))}
                                                selected={newSubjectTeachers}
                                                onChange={setNewSubjectTeachers}
                                                placeholder="Select teachers..."
                                            />
                                        </div>
                                    </div>
                                     <DialogFooter>
                                        <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                                        <DialogClose asChild>
                                            <Button onClick={handleCreateSubject} disabled={isSaving}>
                                                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                                                Save Subject
                                            </Button>
                                        </DialogClose>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                             <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" className="w-full sm:w-auto">
                                        <FileDown className="mr-2 h-4 w-4" />
                                        Export
                                        <ChevronDown className="ml-2 h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                    <DropdownMenuItem onClick={() => handleExport('PDF', 'subjects')}><FileDown className="mr-2 h-4 w-4" />Export as PDF</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleExport('CSV', 'subjects')}><FileDown className="mr-2 h-4 w-4" />Export as CSV</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleExport('Print', 'subjects')}><Printer className="mr-2 h-4 w-4" />Print List</DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {/* Desktop Table */}
                    <div className="w-full overflow-auto rounded-lg border hidden md:block">
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
                                {subjects.map(subject => (
                                    <TableRow key={subject.id}>
                                        <TableCell className="font-semibold">{subject.name}</TableCell>
                                        <TableCell><Badge variant="outline">{subject.code}</Badge></TableCell>
                                        <TableCell className="text-muted-foreground">{subject.department}</TableCell>
                                        <TableCell>
                                            <div className="flex flex-wrap gap-1">
                                                {(subject.teachers || []).map(teacher => (
                                                    <Badge key={teacher} variant="secondary" className="font-normal">{teacher}</Badge>
                                                ))}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="sm" onClick={() => setEditingSubject(subject)}>
                                                <Edit className="mr-2 h-4 w-4" /> Edit
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                    {/* Mobile Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:hidden">
                        {subjects.map(subject => (
                            <Card key={subject.id}>
                                <CardHeader>
                                    <div className="flex justify-between items-start">
                                        <CardTitle className="text-base">{subject.name}</CardTitle>
                                        <Badge variant="outline">{subject.code}</Badge>
                                    </div>
                                    <CardDescription>{subject.department}</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <Label>Teachers</Label>
                                     <div className="flex flex-wrap gap-1 mt-2">
                                        {(subject.teachers || []).map(teacher => (
                                            <Badge key={teacher} variant="secondary" className="font-normal">{teacher}</Badge>
                                        ))}
                                        {(subject.teachers || []).length === 0 && <p className="text-xs text-muted-foreground">No teachers assigned</p>}
                                    </div>
                                </CardContent>
                                <CardFooter className="flex justify-end">
                                    <Button variant="outline" size="sm" onClick={() => setEditingSubject(subject)}>
                                        <Edit className="mr-2 h-4 w-4" /> Edit
                                    </Button>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </TabsContent>
        <TabsContent value="assignments">
             <Card>
                <CardHeader>
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                         <div>
                            <CardTitle>Per-Class Teacher Assignments</CardTitle>
                            <CardDescription>View which teacher is teaching which subject in each class and identify any unassigned subjects.</CardDescription>
                         </div>
                         <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="w-full sm:w-auto">
                                    <FileDown className="mr-2 h-4 w-4"/>
                                    Export / Print
                                    <ChevronDown className="ml-2 h-4 w-4"/>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                                <DropdownMenuItem onClick={() => handleExport('PDF', 'assignments')}><FileDown className="mr-2 h-4 w-4" />Export Full Report (PDF)</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleExport('Print', 'assignments')}><Printer className="mr-2 h-4 w-4" />Print Teacher Allocations</DropdownMenuItem>
                            </DropdownMenuContent>
                         </DropdownMenu>
                    </div>
                     <div className="mt-4">
                        <Label htmlFor="class-assignment-filter">Select Class</Label>
                        <Select value={selectedAssignmentClass} onValueChange={setSelectedAssignmentClass}>
                            <SelectTrigger id="class-assignment-filter" className="w-full md:w-[280px]">
                                <SelectValue placeholder="Select a class to view" />
                            </SelectTrigger>
                            <SelectContent>
                                {classes.map((c) => (
                                    <SelectItem key={c.id} value={c.id}>{c.name} {c.stream || ''}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    {isLoading ? <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div> :
                    currentClassForAssignment ? (
                    <TooltipProvider>
                        <Card>
                            <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between">
                                <div>
                                    <CardTitle className="text-lg">{currentClassForAssignment.name} {currentClassForAssignment.stream || ''}</CardTitle>
                                    <CardDescription>Class Teacher: {currentClassForAssignment.classTeacher.name}</CardDescription>
                                </div>
                                <ManageClassSubjectsDialog
                                    schoolClass={currentClassForAssignment}
                                    allSubjects={subjects}
                                    schoolId={schoolId}
                                    classAssignments={classAssignments}
                                    setClassAssignments={setClassAssignments}
                                />
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    {assignmentsForSelectedClass.length > 0 ? assignmentsForSelectedClass.map(assignment => {
                                        const subjectDetails = subjects.find(s => s.name === assignment.subject);
                                        const availableTeachers = subjectDetails ? (subjectDetails.teachers || []) : [];
                                        const isOverAssigned = assignment.teacher && (teacherWorkload[assignment.teacher] || 0) > OVER_ASSIGNED_THRESHOLD;

                                        return (
                                        <div key={assignment.subject} className="flex flex-col gap-2 md:flex-row md:items-center justify-between border-b py-3">
                                            <span className="font-medium">{assignment.subject}</span>
                                            <div className="flex items-center gap-2">
                                                 {isOverAssigned && (
                                                    <Tooltip>
                                                        <TooltipTrigger>
                                                            <AlertCircle className="h-4 w-4 text-destructive"/>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p>{assignment.teacher} may be over-assigned with {teacherWorkload[assignment.teacher!]} classes.</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                )}
                                                <Popover>
                                                    <PopoverTrigger asChild>
                                                        {assignment.teacher ? (
                                                            <Button variant="outline" size="sm" className="w-full md:w-48 justify-start text-left">
                                                                <User className="mr-2 h-4 w-4 text-muted-foreground"/>
                                                                <span className="truncate">{assignment.teacher}</span>
                                                            </Button>
                                                        ) : (
                                                            <Button variant="destructive" size="sm" className="w-full md:w-48 justify-start">
                                                                <AlertCircle className="mr-2 h-4 w-4" />
                                                                Unassigned
                                                            </Button>
                                                        )}
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-auto p-2">
                                                        <div className="space-y-2">
                                                            <p className="font-semibold text-sm">Assign Teacher</p>
                                                            {availableTeachers.length > 0 ? availableTeachers.map(t => {
                                                                const load = teacherWorkload[t] || 0;
                                                                return (
                                                                <Button key={t} variant="ghost" size="sm" className="w-full justify-between" onClick={() => handleAssignTeacher(currentClassForAssignment.id, assignment.subject, t)}>
                                                                    <span><UserCheck className="mr-2 h-4 w-4 inline" /> {t}</span>
                                                                    <Badge variant={load > OVER_ASSIGNED_THRESHOLD ? "destructive" : "secondary"}>{load} classes</Badge>
                                                                </Button>
                                                            )}) : <p className="text-xs text-muted-foreground p-2">No qualified teachers found for this subject.</p>}
                                                        </div>
                                                    </PopoverContent>
                                                </Popover>
                                            </div>
                                        </div>
                                    )}) : (
                                        <div className="text-sm text-muted-foreground text-center py-4">
                                            No subjects assigned to this class yet. Click 'Manage Subjects' to begin.
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </TooltipProvider>
                     ) : (
                        <div className="text-center text-muted-foreground py-16">
                            <p>Select a class to view its assignments.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </TabsContent>
      </Tabs>
        <EditSubjectDialog 
            subject={editingSubject} 
            teachers={teachers}
            open={!!editingSubject} 
            onOpenChange={(open) => !open && setEditingSubject(null)}
            onSave={handleUpdateSubject}
            onDelete={handleDelete}
        />
    </div>
  );
}
