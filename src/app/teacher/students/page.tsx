

'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, Users, Search, ArrowRight, ChevronDown, ClipboardCheck, Megaphone, Save, FileDown, Printer, CheckCircle, Clock, XCircle, Edit } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { ClassAnalytics } from './class-analytics';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { firestore, auth } from '@/lib/firebase';
import { collection, query, where, onSnapshot, doc, setDoc, Timestamp, writeBatch, getDocs, updateDoc, addDoc } from 'firebase/firestore';
import { format } from 'date-fns';
import { useSearchParams } from 'next/navigation';

type AttendanceStatus = 'present' | 'absent' | 'late' | 'unmarked';

export type Student = {
    id: string;
    name: string;
    rollNumber: string;
    avatarUrl: string;
    overallGrade: string;
    attendance: AttendanceStatus;
    notes?: string;
    classId: string;
    createdAt?: Timestamp;
};

export type TeacherClass = {
  id: string;
  name: string;
};

export default function StudentsPage() {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [teacherClasses, setTeacherClasses] = React.useState<TeacherClass[]>([]);
  const [activeTab, setActiveTab] = React.useState<string | undefined>();
  const { toast } = useToast();
  
  const [allClassStudents, setAllClassStudents] = React.useState<Record<string, Student[]>>({});
  const [isLoading, setIsLoading] = React.useState(true);
  const [newStudentName, setNewStudentName] = React.useState('');
  const [isAddStudentOpen, setIsAddStudentOpen] = React.useState(false);
  const [editingStudent, setEditingStudent] = React.useState<Student | null>(null);
  const searchParams = useSearchParams();
  const schoolId = searchParams.get('schoolId');
  const [statusFilter, setStatusFilter] = React.useState<AttendanceStatus | 'all'>('all');
  const [yearFilter, setYearFilter] = React.useState('All Years');
  const years = Array.from({ length: 10 }, (_, i) => (new Date().getFullYear() - i).toString());
  const [user, setUser] = React.useState(auth.currentUser);

  React.useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(setUser);
    return () => unsubscribe();
  }, []);

  // Effect to fetch the teacher's classes
  React.useEffect(() => {
    if (!schoolId || !user) {
      setIsLoading(false);
      return;
    }
    const teacherId = user.uid;

    const classesQuery = query(collection(firestore, 'schools', schoolId, 'classes'), where('teacherId', '==', teacherId));
    const unsubscribe = onSnapshot(classesQuery, (querySnapshot) => {
      const classesData: TeacherClass[] = querySnapshot.docs.map(doc => ({
        id: doc.id,
        name: `${doc.data().name} ${doc.data().stream || ''}`.trim(),
      }));
      
      setTeacherClasses(classesData);
      if (classesData.length > 0 && !activeTab) {
        setActiveTab(classesData[0].id);
      } else if (classesData.length === 0) {
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, [schoolId, user, activeTab]);

  // Effect to fetch students for the active class
  React.useEffect(() => {
    if (!activeTab || !schoolId) return;

    setIsLoading(true);
    const studentsQuery = query(collection(firestore, 'schools', schoolId, 'students'), where('classId', '==', activeTab));
    const unsubscribeStudents = onSnapshot(studentsQuery, async (snapshot) => {
      const studentsData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Student));
      
      const today = new Date();
      today.setHours(0,0,0,0);
      const attendanceDate = Timestamp.fromDate(today);

      const attendanceQuery = query(
          collection(firestore, 'schools', schoolId, 'attendance'), 
          where('classId', '==', activeTab),
          where('date', '==', attendanceDate)
      );
      const attendanceSnapshot = await getDocs(attendanceQuery);
      const attendanceMap = new Map();
      attendanceSnapshot.forEach(doc => {
          const data = doc.data();
          attendanceMap.set(data.studentId, { status: data.status, notes: data.notes });
      });

      const studentsWithAttendance = studentsData.map(student => ({
          ...student,
          attendance: attendanceMap.get(student.id)?.status || 'unmarked',
          notes: attendanceMap.get(student.id)?.notes || '',
      }));

      setAllClassStudents(prev => ({ ...prev, [activeTab]: studentsWithAttendance }));
      setIsLoading(false);
    });

    return () => unsubscribeStudents();
  }, [activeTab, schoolId]);


  const studentsForCurrentTab = allClassStudents[activeTab || ''] || [];
  
  const filteredStudents = 
    studentsForCurrentTab.filter(student =>
      (student.name.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (statusFilter === 'all' || student.attendance === statusFilter) &&
      (yearFilter === 'All Years' || (student.createdAt && student.createdAt.toDate().getFullYear().toString() === yearFilter))
    );

  const handleAttendanceChange = (studentId: string, status: AttendanceStatus) => {
    setAllClassStudents(prevAllStudents => {
      const newStudentsForClass = (prevAllStudents[activeTab!] || []).map(s =>
        s.id === studentId ? { ...s, attendance: status } : s
      );
      return {
        ...prevAllStudents,
        [activeTab!]: newStudentsForClass,
      };
    });
  };

  const handleNotesChange = (studentId: string, notes: string) => {
    setAllClassStudents(prevAllStudents => {
      const newStudentsForClass = (prevAllStudents[activeTab!] || []).map(s =>
        s.id === studentId ? { ...s, notes } : s
      );
      return {
        ...prevAllStudents,
        [activeTab!]: newStudentsForClass,
      };
    });
  };
  
  const handleSaveAttendance = async () => {
    if (!activeTab || !schoolId || !user) return;
    const teacherId = user.uid;

    const batch = writeBatch(firestore);
    const today = new Date();
    today.setHours(0,0,0,0);
    
    for (const student of studentsForCurrentTab) {
        const attendanceDate = Timestamp.fromDate(today);
        const attendanceQuery = query(
            collection(firestore, 'schools', schoolId, 'attendance'),
            where('studentId', '==', student.id),
            where('date', '==', attendanceDate)
        );

        const querySnapshot = await getDocs(attendanceQuery);
        if (!querySnapshot.empty) {
            const docId = querySnapshot.docs[0].id;
            const attendanceRef = doc(firestore, 'schools', schoolId, 'attendance', docId);
            batch.update(attendanceRef, {
                status: student.attendance,
                notes: student.notes || '',
            });
        } else {
            const attendanceRef = doc(collection(firestore, 'schools', schoolId, 'attendance'));
            batch.set(attendanceRef, {
                studentId: student.id,
                classId: activeTab,
                date: attendanceDate,
                status: student.attendance,
                notes: student.notes || '',
                teacherId,
            });
        }
    }

    try {
        await batch.commit();
        toast({
            title: 'Attendance Saved!',
            description: `Attendance for ${teacherClasses.find(c => c.id === activeTab)?.name} has been successfully updated.`,
        });
    } catch (e) {
        console.error(e);
        toast({
            title: 'Error Saving Attendance',
            description: 'Could not save attendance records. Please try again.',
            variant: 'destructive',
        });
    }
  };
  
  const handleAddNewStudent = async () => {
    if (!newStudentName.trim() || !activeTab || !schoolId) {
        toast({
            variant: 'destructive',
            title: 'Student name and class are required.',
        });
        return;
    }

    try {
        const newStudentRef = doc(collection(firestore, 'schools', schoolId, 'students'));
        await setDoc(newStudentRef, {
            id: newStudentRef.id,
            name: newStudentName,
            rollNumber: `TEMP-${Math.floor(1000 + Math.random() * 9000)}`,
            classId: activeTab,
            role: 'Student',
            avatarUrl: `https://picsum.photos/seed/${newStudentRef.id}/100`,
            overallGrade: 'N/A',
            attendance: 'present',
            createdAt: Timestamp.now(),
        });

        toast({
            title: 'Student Added',
            description: `${newStudentName} has been added to ${teacherClasses.find(c => c.id === activeTab)?.name}.`,
        });

        setNewStudentName('');
        setIsAddStudentOpen(false);

    } catch (e) {
        console.error(e);
        toast({ variant: 'destructive', title: 'Failed to add student.'})
    }
  };
  
  const handleExport = (type: 'PDF' | 'CSV') => {
    if (!activeTab) return;
    const doc = new jsPDF();
    const tableData = filteredStudents.map(student => [
        student.name,
        student.rollNumber,
        student.overallGrade,
        student.attendance.charAt(0).toUpperCase() + student.attendance.slice(1),
    ]);
    
    const className = teacherClasses.find(c => c.id === activeTab)?.name;

    if (type === 'CSV') {
        const headers = ['Name', 'Roll Number', 'Overall Grade', 'Attendance Status'];
        const csvContent = [
            headers.join(','),
            ...tableData.map(row => row.join(','))
        ].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute("download", `${className}-roster.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    } else {
         doc.text(`${className} Roster`, 14, 16);
         (doc as any).autoTable({
            startY: 22,
            head: [['Name', 'Roll Number', 'Overall Grade', 'Attendance Status']],
            body: tableData,
         });
         doc.save(`${className}-roster.pdf`);
    }
  };

  const handleUpdateStudent = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingStudent || !schoolId) return;

    const formData = new FormData(e.currentTarget);
    const updatedName = formData.get('name') as string;
    const updatedRollNumber = formData.get('rollNumber') as string;

    const studentRef = doc(firestore, 'schools', schoolId, 'students', editingStudent.id);
    try {
        await updateDoc(studentRef, {
            name: updatedName,
            rollNumber: updatedRollNumber,
        });
        toast({
        title: 'Student Updated',
        description: `Details for ${updatedName} have been saved.`,
        });
        setEditingStudent(null);
    } catch(e) {
        console.error(e);
        toast({variant: 'destructive', title: 'Update failed'});
    }
  }

  const getAttendanceBadge = (status: AttendanceStatus, isTrigger: boolean = false) => {
    switch (status) {
        case 'present':
            return <Badge variant="default" className="bg-green-600 hover:bg-green-700 w-full"><CheckCircle className="mr-2 h-4 w-4"/>Present</Badge>;
        case 'absent':
            return <Badge variant="destructive" className="w-full"><XCircle className="mr-2 h-4 w-4"/>Absent</Badge>;
        case 'late':
            return <Badge variant="secondary" className="w-full bg-yellow-500 hover:bg-yellow-600 text-white"><Clock className="mr-2 h-4 w-4"/>Late</Badge>;
        default:
            return <Badge variant="outline" className="w-full">Unmarked</Badge>;
    }
  }

  if (!schoolId) {
    return <div className="p-8">Error: School ID is missing. Please access this page through the developer dashboard.</div>
  }

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <div className="md:flex md:items-center md:justify-between">
                    <div className="mb-4 md:mb-0">
                        <h1 className="font-headline text-3xl font-bold">Class &amp; Student Management</h1>
                        <p className="text-muted-foreground">Switch between your classes to view student rosters and mark attendance.</p>
                    </div>
                    {teacherClasses.length > 0 && (
                        <TabsList>
                            {teacherClasses.map((cls) => (
                                <TabsTrigger key={cls.id} value={cls.id}>{cls.name}</TabsTrigger>
                            ))}
                        </TabsList>
                    )}
                </div>

                {teacherClasses.length === 0 && !isLoading && (
                    <Card className="mt-6">
                        <CardContent className="pt-6">
                            <div className="flex min-h-[400px] items-center justify-center rounded-lg border-2 border-dashed border-muted">
                                <div className="text-center">
                                <Users className="mx-auto h-12 w-12 text-muted-foreground" />
                                <h3 className="mt-4 text-xl font-semibold">No Classes Assigned</h3>
                                <p className="mt-2 text-sm text-muted-foreground">Please contact your school administrator to be assigned to a class.</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {teacherClasses.map((cls) => (
                    <TabsContent key={cls.id} value={cls.id}>
                        <ClassAnalytics students={filteredStudents} />
                        <Card className="mt-6">
                            <CardHeader>
                                <div className="md:flex-row md:items-start md:justify-between">
                                    <CardTitle className="font-headline text-2xl">{cls.name} Roster</CardTitle>
                                    <CardDescription>
                                        A total of {studentsForCurrentTab.length} students are enrolled in this class.
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
                                    <div className="flex w-full flex-col gap-2 md:w-auto md:flex-row">
                                        <Dialog open={isAddStudentOpen} onOpenChange={setIsAddStudentOpen}>
                                            <DialogTrigger asChild>
                                                <Button className="w-full md:w-auto" variant="outline">
                                                    <PlusCircle className="mr-2" />
                                                    Add New Student
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent>
                                                <DialogHeader>
                                                    <DialogTitle>Add New Student</DialogTitle>
                                                    <DialogDescription>
                                                        This will create a new student in this class.
                                                    </DialogDescription>
                                                </DialogHeader>
                                                <div className="grid gap-4 py-4">
                                                    <div className="space-y-2">
                                                        <Label htmlFor="student-name">Student Name</Label>
                                                        <Input id="student-name" placeholder="e.g., Mary Akinyi" value={newStudentName} onChange={(e) => setNewStudentName(e.target.value)} />
                                                    </div>
                                                </div>
                                                <DialogFooter>
                                                    <DialogClose asChild>
                                                        <Button variant="outline">Cancel</Button>
                                                    </DialogClose>
                                                    <Button onClick={handleAddNewStudent} disabled={!newStudentName.trim()}>Add Student</Button>
                                                </DialogFooter>
                                            </DialogContent>
                                        </Dialog>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button className="w-full md:w-auto" variant="secondary">
                                                    Actions
                                                    <ChevronDown className="ml-2" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent>
                                                <DropdownMenuItem asChild>
                                                    <Link href={`/teacher/attendance?schoolId=${schoolId}`}>
                                                        <ClipboardCheck className="mr-2" />
                                                        View Full Attendance
                                                    </Link>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem asChild>
                                                    <Link href={`/teacher/messaging?schoolId=${schoolId}`}>
                                                        <Megaphone className="mr-2" />
                                                        Send Class Announcement
                                                    </Link>
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem onClick={() => handleExport('PDF')}>
                                                    <FileDown className="mr-2" />
                                                    Download as PDF
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleExport('CSV')}>
                                                    <FileDown className="mr-2" />
                                                    Download as CSV
                                                </DropdownMenuItem>
                                                <DropdownMenuItem>
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
                                    <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>
                                ) : (
                                    <div className="w-full overflow-auto rounded-lg border">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead className="w-[80px] hidden sm:table-cell">Avatar</TableHead>
                                                    <TableHead>Name</TableHead>
                                                    <TableHead className="hidden md:table-cell">Roll Number</TableHead>
                                                    <TableHead className="hidden sm:table-cell">Overall Grade</TableHead>
                                                    <TableHead>Today's Status</TableHead>
                                                    <TableHead>Notes</TableHead>
                                                    <TableHead className="text-right">Actions</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {filteredStudents.length > 0 ? (
                                                    filteredStudents.map(student => (
                                                        <TableRow key={student.id}>
                                                            <TableCell className="hidden sm:table-cell">
                                                                <Avatar>
                                                                    <AvatarImage src={student.avatarUrl} alt={student.name} />
                                                                    <AvatarFallback>{student.name.charAt(0)}</AvatarFallback>
                                                                </Avatar>
                                                            </TableCell>
                                                            <TableCell className="font-medium">{student.name}</TableCell>
                                                            <TableCell className="text-muted-foreground hidden md:table-cell">{student.rollNumber}</TableCell>
                                                            <TableCell className="hidden sm:table-cell">
                                                                <Badge variant="outline">{student.overallGrade}</Badge>
                                                            </TableCell>
                                                            <TableCell>
                                                                <Select
                                                                    value={student.attendance}
                                                                    onValueChange={(value: AttendanceStatus) => handleAttendanceChange(student.id, value)}
                                                                >
                                                                    <SelectTrigger className="w-32">
                                                                        <SelectValue asChild>
                                                                            <div>{getAttendanceBadge(student.attendance, true)}</div>
                                                                        </SelectValue>
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        <SelectItem value="present">{getAttendanceBadge('present')}</SelectItem>
                                                                        <SelectItem value="absent">{getAttendanceBadge('absent')}</SelectItem>
                                                                        <SelectItem value="late">{getAttendanceBadge('late')}</SelectItem>
                                                                    </SelectContent>
                                                                </Select>
                                                            </TableCell>
                                                            <TableCell>
                                                                {(student.attendance === 'absent' || student.attendance === 'late') && (
                                                                    <Input
                                                                        placeholder="Add note..."
                                                                        value={student.notes}
                                                                        onChange={(e) => handleNotesChange(student.id, e.target.value)}
                                                                        className="w-full"
                                                                    />
                                                                )}
                                                            </TableCell>
                                                            <TableCell className="text-right">
                                                                <Dialog onOpenChange={(open) => !open && setEditingStudent(null)}>
                                                                    <DialogTrigger asChild>
                                                                        <Button variant="ghost" size="sm" onClick={() => setEditingStudent(student)}>
                                                                            <Edit className="mr-2 h-4 w-4"/>Edit
                                                                        </Button>
                                                                    </DialogTrigger>
                                                                </Dialog>
                                                                <Button asChild variant="ghost" size="sm">
                                                                    <Link href={`/teacher/students/${student.id}?schoolId=${schoolId}`}>
                                                                        View Profile
                                                                        <ArrowRight className="ml-2 h-4 w-4" />
                                                                    </Link>
                                                                </Button>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))
                                                ) : (
                                                    <TableRow>
                                                        <TableCell colSpan={7} className="h-24 text-center">
                                                            No students found matching your search.
                                                        </TableCell>
                                                    </TableRow>
                                                )}
                                            </TableBody>
                                        </Table>
                                    </div>
                                )}
                            </CardContent>
                            <CardFooter>
                                <Button onClick={handleSaveAttendance}>
                                    <Save className="mr-2" />
                                    Save Attendance
                                </Button>
                            </CardFooter>
                        </Card>
                    </TabsContent>
                ))}
            </Tabs>
            <Dialog onOpenChange={(open) => !open && setEditingStudent(null)} open={!!editingStudent}>
                {editingStudent && (
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Edit Student Details</DialogTitle>
                            <DialogDescription>
                                Update the details for {editingStudent.name}.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleUpdateStudent}>
                            <div className="grid gap-4 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Name</Label>
                                    <Input id="name" name="name" defaultValue={editingStudent.name} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="rollNumber">Roll Number</Label>
                                    <Input id="rollNumber" name="rollNumber" defaultValue={editingStudent.rollNumber} />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setEditingStudent(null)}>Cancel</Button>
                                <Button type="submit">Save Changes</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                )}
            </Dialog>
        </div>
    );
}
