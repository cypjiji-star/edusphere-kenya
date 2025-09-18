
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Users, Search, Filter, ChevronDown, PlusCircle, Edit, FileText, Phone, Mail, Loader2, TrendingUp, BarChart, History, HeartPulse, ShieldAlert, CheckCircle, XCircle, TrendingDown } from 'lucide-react';
import { firestore } from '@/lib/firebase';
import { collection, onSnapshot, query, where, Timestamp, getDocs, orderBy, doc } from 'firebase/firestore';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';


type Student = {
    id: string;
    name: string;
    admissionNumber: string;
    class: string;
    classId: string;
    gender: 'Male' | 'Female';
    dateOfBirth: string; // Stored as ISO string
    parentName: string;
    parentContact: string;
    status: 'Active' | 'Inactive' | 'Graduated';
    avatarUrl: string;
    balance: number;
    feeStatus: 'Paid' | 'Partial' | 'Overdue';
    birthCertificateNumber?: string;
    nhifNumber?: string;
    parentEmail?: string;
    parentAddress?: string;
    emergencyContactName?: string;
    emergencyContactPhone?: string;
};

type AttendanceRecord = {
    id: string;
    date: Timestamp;
    status: 'Present' | 'Absent' | 'Late';
    notes?: string;
};

type GradeRecord = {
    id: string;
    assessmentTitle: string;
    subject: string;
    grade: string;
    date: Timestamp;
};

type Transaction = {
    id: string;
    date: Timestamp;
    description: string;
    type: 'Charge' | 'Payment';
    amount: number;
    balance: number;
    notes?: string;
};

type Incident = {
    id: string;
    date: Timestamp;
    type: string;
    description: string;
    reportedBy: string;
    status: string;
};

type SelectedStudentDetails = Student & {
    attendance: AttendanceRecord[];
    grades: GradeRecord[];
    transactions: Transaction[];
    incidents: Incident[];
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

const getFeeStatusBadge = (status: Student['feeStatus']) => {
    switch (status) {
        case 'Paid': return <Badge className="bg-green-600 hover:bg-green-700">Paid</Badge>;
        case 'Partial': return <Badge className="bg-blue-500 hover:bg-blue-500">Partial</Badge>;
        case 'Overdue': return <Badge variant="destructive">Overdue</Badge>;
    }
};

const getAttendanceStatusBadge = (status: AttendanceRecord['status']) => {
    switch (status) {
        case 'Present': return <Badge className="bg-green-600 hover:bg-green-700"><CheckCircle className="mr-1 h-3 w-3"/>Present</Badge>;
        case 'Absent': return <Badge variant="destructive"><XCircle className="mr-1 h-3 w-3"/>Absent</Badge>;
        case 'Late': return <Badge variant="secondary" className="bg-yellow-500 text-white hover:bg-yellow-600">Late</Badge>;
    }
};

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', minimumFractionDigits: 0 }).format(amount);
};


export default function StudentManagementPage() {
  const searchParams = useSearchParams();
  const schoolId = searchParams.get('schoolId');

  const [students, setStudents] = React.useState<Student[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [classFilter, setClassFilter] = React.useState('All Classes');
  const [enrollmentStatusFilter, setEnrollmentStatusFilter] = React.useState('All Statuses');
  const [feeStatusFilter, setFeeStatusFilter] = React.useState('All Fee Statuses');
  const [classes, setClasses] = React.useState<string[]>(['All Classes']);
  const [selectedStudent, setSelectedStudent] = React.useState<SelectedStudentDetails | null>(null);
  const [isDialogLoading, setIsDialogLoading] = React.useState(false);

  React.useEffect(() => {
    if (!schoolId) {
      setIsLoading(false);
      return;
    }

    const q = query(collection(firestore, `schools/${schoolId}/students`));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const studentData = snapshot.docs.map(doc => {
        const data = doc.data();
        const balance = data.balance || 0;
        let feeStatus: 'Paid' | 'Partial' | 'Overdue' = 'Paid';
        if (balance > 0) {
            feeStatus = 'Partial'; // Simplified logic
        }

        return {
          id: doc.id,
          name: data.name,
          admissionNumber: data.admissionNumber,
          class: data.class,
          classId: data.classId,
          gender: data.gender,
          dateOfBirth: data.dateOfBirth?.toDate().toISOString(),
          parentName: data.parentName,
          parentContact: data.parentPhone,
          status: data.status || 'Active',
          avatarUrl: data.avatarUrl,
          balance: balance,
          feeStatus: feeStatus,
          birthCertificateNumber: data.birthCertificateNumber,
          nhifNumber: data.nhifNumber,
          parentEmail: data.parentEmail,
          parentAddress: data.parentAddress,
          emergencyContactName: data.emergencyContactName,
          emergencyContactPhone: data.emergencyContactPhone,
        } as Student;
      });
      setStudents(studentData);
      
      const uniqueClasses = [...new Set(studentData.map(s => s.class))];
      setClasses(['All Classes', ...uniqueClasses]);
      
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [schoolId]);

  const openStudentDialog = async (student: Student) => {
    if (!schoolId) return;
    setIsDialogLoading(true);
    setSelectedStudent({ ...student, attendance: [], grades: [], transactions: [], incidents: [] }); // Set basic data immediately

    const attendanceQuery = query(collection(firestore, `schools/${schoolId}/attendance`), where('studentId', '==', student.id), orderBy('date', 'desc'), limit(5));
    const transactionsQuery = query(collection(firestore, `schools/${schoolId}/students/${student.id}/transactions`), orderBy('date', 'desc'));
    const incidentsQuery = query(collection(firestore, `schools/${schoolId}/incidents`), where('studentId', '==', student.id), orderBy('date', 'desc'), limit(5));
    const gradesQuery = query(collection(firestore, `schools/${schoolId}/grades`), where('studentId', '==', student.id), orderBy('date', 'desc'), limit(5));

    const [attendanceSnap, transactionsSnap, incidentsSnap, gradesSnap] = await Promise.all([
        getDocs(attendanceQuery),
        getDocs(transactionsQuery),
        getDocs(incidentsQuery),
        getDocs(gradesQuery),
    ]);

    const attendanceRecords = attendanceSnap.docs.map(d => ({id: d.id, ...d.data()}) as AttendanceRecord);
    const transactionRecords = transactionsSnap.docs.map(d => ({id: d.id, ...d.data()}) as Transaction);
    const incidentRecords = incidentsSnap.docs.map(d => ({id: d.id, ...d.data()}) as Incident);
    const gradeRecords = gradesSnap.docs.map(d => ({id: d.id, ...d.data(), assessmentTitle: d.data().subject + " Exam"} as GradeRecord));


    setSelectedStudent({
        ...student,
        attendance: attendanceRecords,
        grades: gradeRecords,
        transactions: transactionRecords,
        incidents: incidentRecords,
    });
    setIsDialogLoading(false);
  };

  const filteredStudents = students.filter(student => 
    (student.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
     student.admissionNumber?.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (classFilter === 'All Classes' || student.class === classFilter) &&
    (enrollmentStatusFilter === 'All Statuses' || student.status === enrollmentStatusFilter) &&
    (feeStatusFilter === 'All Fee Statuses' || student.feeStatus === feeStatusFilter)
  );
  
  const stats = React.useMemo(() => ({
    totalStudents: students.length,
    activeStudents: students.filter(s => s.status === 'Active').length,
    graduatedStudents: students.filter(s => s.status === 'Graduated').length,
    inactiveStudents: students.filter(s => s.status === 'Inactive').length,
  }), [students]);

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

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-6">
            <Card><CardHeader className="pb-2"><CardDescription>Total Students</CardDescription><CardTitle className="text-2xl font-bold">{stats.totalStudents}</CardTitle></CardHeader></Card>
            <Card><CardHeader className="pb-2"><CardDescription>Active Students</CardDescription><CardTitle className="text-2xl font-bold text-green-600">{stats.activeStudents}</CardTitle></CardHeader></Card>
            <Card><CardHeader className="pb-2"><CardDescription>Graduated</CardDescription><CardTitle className="text-2xl font-bold">{stats.graduatedStudents}</CardTitle></CardHeader></Card>
            <Card><CardHeader className="pb-2"><CardDescription>Inactive/Transferred</CardDescription><CardTitle className="text-2xl font-bold text-muted-foreground">{stats.inactiveStudents}</CardTitle></CardHeader></Card>
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
                    <SelectTrigger className="w-full md:w-[160px]"><SelectValue /></SelectTrigger>
                    <SelectContent>{classes.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
                 <Select value={enrollmentStatusFilter} onValueChange={(v) => setEnrollmentStatusFilter(v as any)}>
                    <SelectTrigger className="w-full md:w-[160px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="All Statuses">All Enrollment Statuses</SelectItem>
                        <SelectItem value="Active">Active</SelectItem>
                        <SelectItem value="Inactive">Inactive</SelectItem>
                         <SelectItem value="Graduated">Graduated</SelectItem>
                    </SelectContent>
                </Select>
                <Select value={feeStatusFilter} onValueChange={(v) => setFeeStatusFilter(v as any)}>
                    <SelectTrigger className="w-full md:w-[160px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="All Fee Statuses">All Fee Statuses</SelectItem>
                        <SelectItem value="Paid">Paid</SelectItem>
                        <SelectItem value="Partial">Partial</SelectItem>
                        <SelectItem value="Overdue">Overdue</SelectItem>
                    </SelectContent>
                </Select>
                <Button asChild className="w-full md:w-auto">
                    <Link href={`/admin/enrolment?schoolId=${schoolId}`}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Enroll Student
                    </Link>
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
                <div className="flex h-64 items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>
            ) : (
            <>
                <div className="w-full overflow-auto rounded-lg border hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Admission No.</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Fee Status</TableHead>
                    <TableHead>Enrollment Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.map((student) => (
                    <TableRow key={student.id}>
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
                        <TableCell>{getFeeStatusBadge(student.feeStatus)}</TableCell>
                        <TableCell>{getStatusBadge(student.status)}</TableCell>
                        <TableCell className="text-right">
                           <DialogTrigger asChild>
                               <Button variant="ghost" size="sm" onClick={() => openStudentDialog(student)}>View Details</Button>
                           </DialogTrigger>
                        </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
             <div className="grid grid-cols-1 gap-4 md:hidden">
                {filteredStudents.map((student) => (
                    <DialogTrigger asChild key={student.id}>
                        <Card className="cursor-pointer" onClick={() => openStudentDialog(student)}>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-10 w-10">
                                            <AvatarImage src={student.avatarUrl} alt={student.name} />
                                            <AvatarFallback>{student.name?.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <CardTitle className="text-base">{student.name}</CardTitle>
                                            <CardDescription>Adm: {student.admissionNumber}</CardDescription>
                                        </div>
                                    </div>
                                    {getStatusBadge(student.status)}
                                </div>
                            </CardHeader>
                            <CardContent className="flex justify-between items-center text-sm">
                                <span>{student.class}</span>
                                {getFeeStatusBadge(student.feeStatus)}
                            </CardContent>
                        </Card>
                    </DialogTrigger>
                ))}
            </div>
            </>
            )}
          </CardContent>
           <CardFooter>
                <div className="text-xs text-muted-foreground">
                    Showing <strong>{filteredStudents.length}</strong> of <strong>{students.length}</strong> students.
                </div>
            </CardFooter>
        </Card>
        {selectedStudent && (
             <DialogContent className="sm:max-w-4xl">
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
                 {isDialogLoading ? <div className="h-64 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div> : (
                    <div className="py-4 space-y-4 max-h-[60vh] overflow-y-auto">
                        <Tabs defaultValue="bio">
                            <TabsList className="grid w-full grid-cols-4">
                                <TabsTrigger value="bio">Bio Data</TabsTrigger>
                                <TabsTrigger value="academics">Academics</TabsTrigger>
                                <TabsTrigger value="finance">Finance</TabsTrigger>
                                <TabsTrigger value="health">Health & Incidents</TabsTrigger>
                            </TabsList>
                            <TabsContent value="bio" className="mt-4">
                                <Card>
                                    <CardHeader><CardTitle className="text-base">Personal Details</CardTitle></CardHeader>
                                    <CardContent className="grid grid-cols-2 gap-4 text-sm">
                                        <div><Label>Gender</Label><p>{selectedStudent.gender}</p></div>
                                        <div><Label>Date of Birth</Label><p>{selectedStudent.dateOfBirth ? new Date(selectedStudent.dateOfBirth).toLocaleDateString() : 'N/A'}</p></div>
                                        <div><Label>Birth Certificate No.</Label><p className="font-mono">{selectedStudent.birthCertificateNumber || 'N/A'}</p></div>
                                        <div><Label>NHIF Number</Label><p className="font-mono">{selectedStudent.nhifNumber || 'N/A'}</p></div>
                                    </CardContent>
                                </Card>
                                <Card className="mt-4">
                                    <CardHeader><CardTitle className="text-base">Parent / Guardian Details</CardTitle></CardHeader>
                                    <CardContent className="grid grid-cols-2 gap-4 text-sm">
                                        <div><Label>Name</Label><p>{selectedStudent.parentName}</p></div>
                                        <div><Label>Primary Contact</Label><p className="flex items-center gap-2"><Phone className="h-4 w-4 text-muted-foreground"/>{selectedStudent.parentContact}</p></div>
                                        <div><Label>Email Address</Label><p className="flex items-center gap-2"><Mail className="h-4 w-4 text-muted-foreground"/>{selectedStudent.parentEmail || 'N/A'}</p></div>
                                        <div><Label>Physical Address</Label><p>{selectedStudent.parentAddress || 'N/A'}</p></div>
                                        <div><Label>Emergency Contact</Label><p>{selectedStudent.emergencyContactName || 'N/A'} ({selectedStudent.emergencyContactPhone || 'N/A'})</p></div>
                                    </CardContent>
                                </Card>
                            </TabsContent>
                            <TabsContent value="academics" className="mt-4 space-y-4">
                                <Card>
                                    <CardHeader><CardTitle className="text-base flex items-center gap-2"><History className="h-4 w-4 text-primary"/>Attendance History (Last 5)</CardTitle></CardHeader>
                                    <CardContent>
                                        <div className="w-full overflow-auto rounded-lg border">
                                            <Table><TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Status</TableHead><TableHead>Notes</TableHead></TableRow></TableHeader>
                                                <TableBody>
                                                    {selectedStudent.attendance.map(att => <TableRow key={att.id}><TableCell>{att.date.toDate().toLocaleDateString()}</TableCell><TableCell>{getAttendanceStatusBadge(att.status)}</TableCell><TableCell>{att.notes || '—'}</TableCell></TableRow>)}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader><CardTitle className="text-base flex items-center gap-2"><BarChart className="h-4 w-4 text-primary"/>Grade History (Last 5)</CardTitle></CardHeader>
                                    <CardContent>
                                        <div className="w-full overflow-auto rounded-lg border">
                                            <Table>
                                                <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Assessment</TableHead><TableHead>Subject</TableHead><TableHead className="text-right">Grade</TableHead></TableRow></TableHeader>
                                                <TableBody>
                                                    {selectedStudent.grades.map(grade => (
                                                        <TableRow key={grade.id}>
                                                            <TableCell>{grade.date.toDate().toLocaleDateString()}</TableCell>
                                                            <TableCell>{grade.assessmentTitle}</TableCell>
                                                            <TableCell>{grade.subject}</TableCell>
                                                            <TableCell className="text-right font-semibold">{grade.grade}</TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>
                            <TabsContent value="finance" className="mt-4">
                                <Card>
                                    <CardHeader><CardTitle className="text-base">Full Fee Statement</CardTitle></CardHeader>
                                    <CardContent>
                                        <div className="w-full overflow-auto rounded-lg border max-h-80">
                                            <Table>
                                                <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Description</TableHead><TableHead className="text-right">Charge</TableHead><TableHead className="text-right">Payment</TableHead><TableHead className="text-right">Balance</TableHead></TableRow></TableHeader>
                                                <TableBody>
                                                    {selectedStudent.transactions.map(tx => (
                                                        <TableRow key={tx.id}>
                                                            <TableCell>{tx.date.toDate().toLocaleDateString()}</TableCell>
                                                            <TableCell>{tx.description}</TableCell>
                                                            <TableCell className={`text-right ${tx.type === 'Charge' ? 'text-destructive' : ''}`}>{tx.type === 'Charge' ? formatCurrency(tx.amount) : '—'}</TableCell>
                                                            <TableCell className={`text-right text-green-600`}>{tx.type === 'Payment' ? formatCurrency(Math.abs(tx.amount)) : '—'}</TableCell>
                                                             <TableCell className="text-right font-semibold">{formatCurrency(tx.balance)}</TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    </CardContent>
                                    <CardFooter className="font-bold flex justify-end">
                                        Balance: {formatCurrency(selectedStudent.balance)}
                                    </CardFooter>
                                </Card>
                            </TabsContent>
                            <TabsContent value="health" className="mt-4">
                                <Card>
                                    <CardHeader><CardTitle className="text-base flex items-center gap-2"><HeartPulse className="h-4 w-4 text-primary"/>Incidents &amp; Health Log (Last 5)</CardTitle></CardHeader>
                                    <CardContent>
                                        <div className="w-full overflow-auto rounded-lg border">
                                            <Table>
                                                <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Type</TableHead><TableHead>Reported By</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                                                <TableBody>
                                                    {selectedStudent.incidents.map(inc => (
                                                        <TableRow key={inc.id}>
                                                            <TableCell>{inc.date.toDate().toLocaleDateString()}</TableCell>
                                                            <TableCell><Badge variant={inc.type === 'Health' ? 'destructive' : 'secondary'}>{inc.type}</Badge></TableCell>
                                                            <TableCell>{inc.reportedBy}</TableCell>
                                                            <TableCell><Badge variant="outline">{inc.status}</Badge></TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        </Tabs>
                    </div>
                 )}
                <DialogFooter>
                    <DialogClose asChild><Button variant="outline">Close</Button></DialogClose>
                </DialogFooter>
             </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
