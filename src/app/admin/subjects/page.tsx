

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
import { Shapes, PlusCircle, User, Search, ArrowRight, Edit, UserPlus, Trash2, Filter, AlertCircle, UserCheck, FileDown, Printer, ChevronDown } from 'lucide-react';
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
import { collection, onSnapshot, doc, addDoc, updateDoc, deleteDoc, query, where, serverTimestamp, setDoc } from 'firebase/firestore';
import { useSearchParams } from 'next/navigation';
import { MultiSelect } from '@/components/ui/multi-select';


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
    const [selectedSubjects, setSelectedSubjects] = React.useState<string[]>(() => {
        return (classAssignments[schoolClass.id] || []).map(a => a.subject);
    });

    const handleCheckboxChange = (subjectName: string, checked: boolean) => {
        setSelectedSubjects(prev => 
            checked ? [...prev, subjectName] : prev.filter(s => s !== subjectName)
        );
    };

    const handleSaveChanges = async () => {
        const assignments = selectedSubjects.map(subjectName => {
            const existing = (classAssignments[schoolClass.id] || []).find(a => a.subject === subjectName);
            return existing || { subject: subjectName, teacher: null };
        });

        try {
            const assignmentRef = doc(firestore, 'schools', schoolId, 'class-assignments', schoolClass.id);
            await setDoc(assignmentRef, { assignments });
            // Optimistic update
            setClassAssignments(prev => ({ ...prev, [schoolClass.id]: assignments }));
        } catch (e) {
            console.error("Failed to save subject assignments:", e);
        }
    };

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="secondary" size="sm">Manage Subjects</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Manage Subjects for {schoolClass.name} {schoolClass.stream}</DialogTitle>
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
                    <DialogClose asChild><Button onClick={handleSaveChanges}>Save</Button></DialogClose>
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
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Edit Subject: {subject.name}</DialogTitle>
                </DialogHeader>
                <div className="grid gap-6 py-4">
                    <div className="grid grid-cols-2 gap-4">
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

    React.useEffect(() => {
        if (!schoolId) return;

        const unsubClasses = onSnapshot(collection(firestore, 'schools', schoolId, 'classes'), (snapshot) => {
            setClasses(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as SchoolClass)));
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
    }, [schoolId]);
    
    const teacherWorkload: Record<string, number> = React.useMemo(() => {
        const load: Record<string, number> = {};
        Object.values(classAssignments).flat().forEach(assignment => {
            if (assignment.teacher) {
                load[assignment.teacher] = (load[assignment.teacher] || 0) + 1;
            }
        });
        return load;
    }, [classAssignments]);

    const OVER_ASSIGNED_THRESHOLD = 3;
    
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

        const teacher = teachers.find(t => t.id === newClassTeacherId);
        if (!teacher) {
            toast({ title: 'Invalid Teacher', description: 'Selected teacher could not be found.', variant: 'destructive' });
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
                schoolId: schoolId,
                createdAt: serverTimestamp(),
            });

            toast({ title: 'Class Created', description: `The class "${newClassName} ${newClassStream}" has been successfully created.` });
            resetNewClassForm();
        } catch (error) {
            console.error('Error creating class:', error);
            toast({ title: 'Creation Failed', variant: 'destructive' });
        }
    };


    const handleExport = (type: string) => {
        toast({
            title: 'Exporting...',
            description: `Your data is being exported as a ${type} file.`,
        });
    };

    const handleAssignTeacher = async (classId: string, subject: string, teacherName: string) => {
        if (!schoolId) return;
        const currentAssignments = classAssignments[classId] || [];
        const updatedAssignments = currentAssignments.map(a => 
            a.subject === subject ? { ...a, teacher: teacherName } : a
        );

        try {
            const assignmentRef = doc(firestore, `schools/${schoolId}/class-assignments`, classId);
            await setDoc(assignmentRef, { assignments: updatedAssignments });
            toast({
                title: 'Teacher Assigned',
                description: `${teacherName} has been assigned to teach ${subject} in this class.`
            });
        } catch (error) {
            console.error("Failed to assign teacher:", error);
            toast({ title: 'Assignment Failed', variant: 'destructive' });
        }
    };
    
    const handleDelete = async (collectionName: string, id: string, name: string) => {
        if (!schoolId) return;
         if (!window.confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) {
            return;
        }
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
        try {
            await addDoc(collection(firestore, `schools/${schoolId}/subjects`), {
                name: newSubjectName,
                code: newSubjectCode,
                department: newSubjectDept,
                teachers: newSubjectTeachers,
                classes: [],
            });
            toast({ title: 'Subject Created' });
            setNewSubjectName('');
            setNewSubjectCode('');
            setNewSubjectDept('');
            setNewSubjectTeachers([]);
        } catch(e) {
            console.error(e);
            toast({ title: 'Creation Failed', variant: 'destructive' });
        }
    }
    
    const handleUpdateSubject = async (id: string, data: Partial<Subject>) => {
        if (!schoolId) return;
        try {
            await updateDoc(doc(firestore, 'schools', schoolId, 'subjects', id), data);
            toast({ title: 'Subject Updated' });
        } catch (e) {
            console.error(e);
            toast({ title: 'Update Failed', variant: 'destructive' });
        }
    };
    
    if (!schoolId) {
        return <div className="p-8">Error: School ID is missing from URL.</div>
    }

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
                        <div className="flex gap-2">
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
                                            <Input id="class-name" placeholder="e.g., Form 1" className="col-span-3" value={newClassName} onChange={e => setNewClassName(e.target.value)} />
                                        </div>
                                        <div className="grid grid-cols-4 items-center gap-4">
                                            <Label htmlFor="class-stream" className="text-right">Stream</Label>
                                            <Input id="class-stream" placeholder="e.g., A, North (Optional)" className="col-span-3" value={newClassStream} onChange={e => setNewClassStream(e.target.value)} />
                                        </div>
                                        <div className="grid grid-cols-4 items-center gap-4">
                                            <Label htmlFor="class-teacher" className="text-right">Class Teacher</Label>
                                            <Select value={newClassTeacherId} onValueChange={setNewClassTeacherId}>
                                                <SelectTrigger id="class-teacher" className="col-span-3">
                                                    <SelectValue placeholder="Select a teacher" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {teachers.map(teacher => (
                                                        <SelectItem key={teacher.id} value={teacher.id}>{teacher.name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="grid grid-cols-4 items-center gap-4">
                                            <Label htmlFor="class-capacity" className="text-right">Capacity</Label>
                                            <Input id="class-capacity" type="number" placeholder="e.g., 45" className="col-span-3" value={newClassCapacity} onChange={e => setNewClassCapacity(e.target.value)} />
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <DialogClose asChild><Button variant="outline" onClick={resetNewClassForm}>Cancel</Button></DialogClose>
                                        <DialogClose asChild>
                                            <Button onClick={handleCreateClass}>Save Class</Button>
                                        </DialogClose>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                             <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline">
                                        <FileDown className="mr-2 h-4 w-4" />
                                        Export
                                        <ChevronDown className="ml-2 h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                    <DropdownMenuItem onClick={() => handleExport('PDF')}><FileDown className="mr-2 h-4 w-4" />Export as PDF</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleExport('CSV')}><FileDown className="mr-2 h-4 w-4" />Export as CSV</DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
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
                                                            <Select defaultValue={teachers.find(t => t.name === schoolClass.classTeacher.name)?.id}>
                                                                <SelectTrigger id="class-teacher-edit" className="col-span-3">
                                                                    <SelectValue />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    {teachers.map(teacher => (
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
                                                         <DialogClose asChild>
                                                            <Button variant="destructive" onClick={() => handleDelete('classes', schoolClass.id, `${schoolClass.name} ${schoolClass.stream || ''}`)}>
                                                                <Trash2 className="mr-2 h-4 w-4" />
                                                                Archive Class
                                                            </Button>
                                                        </DialogClose>
                                                        <div className="flex gap-2">
                                                            <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                                                            <DialogClose asChild>
                                                                <Button>Save Changes</Button>
                                                            </DialogClose>
                                                        </div>
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
                                            <Button onClick={handleCreateSubject}>Save Subject</Button>
                                        </DialogClose>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                             <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline">
                                        <FileDown className="mr-2 h-4 w-4" />
                                        Export
                                        <ChevronDown className="ml-2 h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                    <DropdownMenuItem onClick={() => handleExport('PDF')}><FileDown className="mr-2 h-4 w-4" />Export as PDF</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleExport('CSV')}><FileDown className="mr-2 h-4 w-4" />Export as CSV</DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
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
                </CardContent>
            </Card>
        </TabsContent>
        <TabsContent value="assignments">
            <Card>
                <CardHeader>
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                         <div>
                            <CardTitle>Per-Class Teacher Assignments</CardTitle>
                            <CardDescription>View which teacher is teaching which subject in each class and identify any unassigned subjects.</CardDescription>
                         </div>
                         <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline">
                                    <FileDown className="mr-2 h-4 w-4"/>
                                    Export / Print
                                    <ChevronDown className="ml-2 h-4 w-4"/>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                                <DropdownMenuItem onClick={() => handleExport('PDF')}><FileDown className="mr-2 h-4 w-4" />Export Full Report (PDF)</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleExport('Print')}><Printer className="mr-2 h-4 w-4" />Print Teacher Allocations</DropdownMenuItem>
                            </DropdownMenuContent>
                         </DropdownMenu>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    <TooltipProvider>
                    {classes.map((schoolClass) => {
                        const assignments = classAssignments[schoolClass.id] || [];
                        return (
                            <Card key={schoolClass.id}>
                                <CardHeader className="flex flex-row items-center justify-between">
                                    <div>
                                        <CardTitle className="text-lg">{schoolClass.name} {schoolClass.stream || ''}</CardTitle>
                                        <CardDescription>Class Teacher: {schoolClass.classTeacher.name}</CardDescription>
                                    </div>
                                    <ManageClassSubjectsDialog
                                        schoolClass={schoolClass}
                                        allSubjects={subjects}
                                        schoolId={schoolId}
                                        classAssignments={classAssignments}
                                        setClassAssignments={setClassAssignments}
                                    />
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-2">
                                        {assignments.length > 0 ? assignments.map(assignment => {
                                            const isOverAssigned = assignment.teacher && (teacherWorkload[assignment.teacher] || 0) > OVER_ASSIGNED_THRESHOLD;
                                            const subjectDetails = subjects.find(s => s.name === assignment.subject);
                                            const availableTeachers = subjectDetails ? (subjectDetails.teachers || []).filter(t => (teacherWorkload[t] || 0) <= OVER_ASSIGNED_THRESHOLD) : [];

                                            return (
                                            <div key={assignment.subject} className="flex items-center justify-between border-b py-3">
                                                <span className="font-medium">{assignment.subject}</span>
                                                {assignment.teacher ? (
                                                    <div className="flex items-center gap-2">
                                                         {isOverAssigned && (
                                                            <Tooltip>
                                                                <TooltipTrigger>
                                                                    <AlertCircle className="h-4 w-4 text-destructive"/>
                                                                </TooltipTrigger>
                                                                <TooltipContent>
                                                                    <p>{assignment.teacher} may be over-assigned.</p>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        )}
                                                        <User className="h-4 w-4 text-muted-foreground"/>
                                                        <span className="text-sm text-muted-foreground">{assignment.teacher}</span>
                                                    </div>
                                                ) : (
                                                    <Popover>
                                                        <PopoverTrigger asChild>
                                                            <Badge variant="destructive" className="cursor-pointer">
                                                                <AlertCircle className="mr-2 h-4 w-4"/>
                                                                Unassigned
                                                            </Badge>
                                                        </PopoverTrigger>
                                                        <PopoverContent className="w-auto">
                                                            <div className="space-y-2">
                                                                <p className="font-semibold text-sm">Suggested Teachers</p>
                                                                {availableTeachers.length > 0 ? availableTeachers.map(t => (
                                                                    <Button key={t} variant="ghost" size="sm" className="w-full justify-start" onClick={() => handleAssignTeacher(schoolClass.id, assignment.subject, t)}>
                                                                        <UserCheck className="mr-2 h-4 w-4" /> {t}
                                                                    </Button>
                                                                )) : <p className="text-xs text-muted-foreground">No available teachers found.</p>}
                                                            </div>
                                                        </PopoverContent>
                                                    </Popover>
                                                )}
                                            </div>
                                        )}) : (
                                            <div className="text-sm text-muted-foreground text-center py-4">
                                                No subjects assigned to this class yet.
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        )
                    })}
                    </TooltipProvider>
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
