
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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Users, Search, Filter, ChevronDown, PlusCircle, Edit, FileText, Phone, Mail, Loader2 } from 'lucide-react';
import { firestore } from '@/lib/firebase';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

type Student = {
    id: string;
    name: string;
    admissionNumber: string;
    class: string;
    gender: 'Male' | 'Female';
    dateOfBirth: string; // Stored as ISO string
    parentName: string;
    parentContact: string;
    status: 'Active' | 'Inactive' | 'Graduated';
    avatarUrl: string;
};

const getStatusBadge = (status: Student['status']) => {
    switch (status) {
      case 'Active':
        return <Badge>Active</Badge>;
      case 'Inactive':
        return <Badge variant="secondary">Inactive</Badge>;
      case 'Graduated':
        return <Badge variant="outline">Graduated</Badge>;
    }
};

export default function StudentManagementPage() {
  const searchParams = useSearchParams();
  const schoolId = searchParams.get('schoolId');

  const [students, setStudents] = React.useState<Student[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [classFilter, setClassFilter] = React.useState('All Classes');
  const [statusFilter, setStatusFilter] = React.useState('All Statuses');
  const [classes, setClasses] = React.useState<string[]>(['All Classes']);
  const [selectedStudent, setSelectedStudent] = React.useState<Student | null>(null);

  React.useEffect(() => {
    if (!schoolId) {
      setIsLoading(false);
      return;
    }

    const q = query(collection(firestore, `schools/${schoolId}/students`));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const studentData = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name,
          admissionNumber: data.admissionNumber,
          class: data.class,
          gender: data.gender,
          dateOfBirth: data.dateOfBirth.toDate().toISOString(),
          parentName: data.parentName,
          parentContact: data.parentPhone,
          status: data.status,
          avatarUrl: data.avatarUrl
        } as Student;
      });
      setStudents(studentData);
      
      const uniqueClasses = [...new Set(studentData.map(s => s.class))];
      setClasses(['All Classes', ...uniqueClasses]);
      
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [schoolId]);

  const filteredStudents = students.filter(student => 
    (student.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
     student.admissionNumber?.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (classFilter === 'All Classes' || student.class === classFilter) &&
    (statusFilter === 'All Statuses' || student.status === statusFilter)
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <Dialog onOpenChange={(open) => !open && setSelectedStudent(null)}>
        <div className="mb-6">
          <h1 className="font-headline text-3xl font-bold flex items-center gap-2">
            <Users className="h-8 w-8 text-primary" />
            Student Management
          </h1>
          <p className="text-muted-foreground">
            A central database for all student information.
          </p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="relative w-full md:max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search by name or admission no..."
                  className="w-full bg-background pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex w-full flex-col gap-2 md:w-auto md:flex-row">
                <Select value={classFilter} onValueChange={setClassFilter}>
                    <SelectTrigger className="w-full md:w-[180px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                        {classes.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full md:w-[180px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="All Statuses">All Statuses</SelectItem>
                        <SelectItem value="Active">Active</SelectItem>
                        <SelectItem value="Inactive">Inactive</SelectItem>
                         <SelectItem value="Graduated">Graduated</SelectItem>
                    </SelectContent>
                </Select>
                <Button asChild className="w-full md:w-auto">
                    <Link href={`/admin/enrolment?schoolId=${schoolId}`}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Enroll New Student
                    </Link>
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
                <div className="flex h-64 items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>
            ) : (
                <div className="w-full overflow-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Admission No.</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Parent</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.map((student) => (
                    <DialogTrigger key={student.id} asChild>
                        <TableRow className="cursor-pointer" onClick={() => setSelectedStudent(student)}>
                            <TableCell>
                                <div className="flex items-center gap-3">
                                <Avatar className="h-9 w-9">
                                    <AvatarImage src={student.avatarUrl} alt={student.name} />
                                    <AvatarFallback>{student.name?.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <span className="font-medium">{student.name}</span>
                                </div>
                            </TableCell>
                            <TableCell>{student.admissionNumber}</TableCell>
                            <TableCell>{student.class}</TableCell>
                            <TableCell>{student.parentName}</TableCell>
                            <TableCell>{getStatusBadge(student.status)}</TableCell>
                            <TableCell className="text-right">
                                <Button variant="ghost" size="sm">View Details</Button>
                            </TableCell>
                        </TableRow>
                    </DialogTrigger>
                  ))}
                </TableBody>
              </Table>
            </div>
            )}
          </CardContent>
           <CardFooter>
                <div className="text-xs text-muted-foreground">
                    Showing <strong>{filteredStudents.length}</strong> of <strong>{students.length}</strong> students.
                </div>
            </CardFooter>
        </Card>
        {selectedStudent && (
             <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <div className="flex items-center gap-4">
                        <Avatar className="h-16 w-16">
                            <AvatarImage src={selectedStudent.avatarUrl} />
                            <AvatarFallback>{selectedStudent.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                            <DialogTitle className="text-2xl font-bold">{selectedStudent.name}</DialogTitle>
                            <DialogDescription>
                                {selectedStudent.class} | Adm No: {selectedStudent.admissionNumber}
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>
                <div className="py-4 space-y-4 max-h-[60vh] overflow-y-auto">
                    <Card>
                        <CardHeader><CardTitle className="text-base">Bio Data</CardTitle></CardHeader>
                        <CardContent className="grid grid-cols-2 gap-4 text-sm">
                            <div><Label>Gender</Label><p>{selectedStudent.gender}</p></div>
                            <div><Label>Date of Birth</Label><p>{new Date(selectedStudent.dateOfBirth).toLocaleDateString()}</p></div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader><CardTitle className="text-base">Parent / Guardian Details</CardTitle></CardHeader>
                         <CardContent className="grid grid-cols-2 gap-4 text-sm">
                            <div><Label>Name</Label><p>{selectedStudent.parentName}</p></div>
                             <div><Label>Contact</Label><p className="flex items-center gap-2"><Phone className="h-4 w-4 text-muted-foreground"/>{selectedStudent.parentContact}</p></div>
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader><CardTitle className="text-base">Official Documents</CardTitle></CardHeader>
                        <CardContent className="grid grid-cols-2 gap-4 text-sm">
                            <div className="flex items-center gap-2"><FileText className="h-4 w-4 text-muted-foreground"/><p>Birth Certificate: <span className="font-mono">N/A</span></p></div>
                             <div className="flex items-center gap-2"><FileText className="h-4 w-4 text-muted-foreground"/><p>NHIF Number: <span className="font-mono">N/A</span></p></div>
                        </CardContent>
                    </Card>
                </div>
                <DialogFooter>
                    <DialogClose asChild><Button variant="outline">Close</Button></DialogClose>
                </DialogFooter>
             </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
