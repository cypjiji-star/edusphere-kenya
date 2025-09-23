
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
import { Users, Search, Filter, ChevronDown, PlusCircle, Edit, FileText, Phone, Mail, Loader2, TrendingUp, BarChart, History, HeartPulse, ShieldAlert, CheckCircle, XCircle, TrendingDown, Save, Trophy } from 'lucide-react';
import { firestore, auth } from '@/lib/firebase';
import { collection, onSnapshot, query, where, Timestamp, getDocs, orderBy, doc, updateDoc } from 'firebase/firestore';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';
import { ClassAnalytics } from './class-analytics';
import { useAuth } from '@/context/auth-context';


export type Student = {
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
    feeStatus: 'Paid' | 'Partial' | 'Overdue';
    overallGrade?: string;
    attendance?: 'present' | 'absent' | 'late' | 'unmarked';
};

type TeacherClass = {
    id: string;
    name: string;
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


export default function TeacherClassManagementPage() {
  const searchParams = useSearchParams();
  const schoolId = searchParams.get('schoolId');
  const { user } = useAuth();
  
  const [studentsByClass, setStudentsByClass] = React.useState<Record<string, Student[]>>({});
  const [teacherClasses, setTeacherClasses] = React.useState<TeacherClass[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [activeClassId, setActiveClassId] = React.useState<string>('');
  
  const [searchTerm, setSearchTerm] = React.useState('');
  const [selectedStudent, setSelectedStudent] = React.useState<Student | null>(null);

  React.useEffect(() => {
    if (!schoolId || !user) {
        setIsLoading(false);
        return;
    }
    const teacherId = user.uid;

    const qClasses = query(collection(firestore, `schools/${schoolId}/classes`), where('teacherId', '==', teacherId));
    const unsubscribeClasses = onSnapshot(qClasses, async (classSnapshot) => {
        const classesData = classSnapshot.docs.map(doc => ({ id: doc.id, name: `${doc.data().name} ${doc.data().stream || ''}`.trim() }));
        setTeacherClasses(classesData);
        
        if (classesData.length > 0) {
            if (!activeClassId) {
                setActiveClassId(classesData[0].id);
            }
            
            const classIds = classesData.map(c => c.id);
            const studentQuery = query(collection(firestore, `schools/${schoolId}/users`), where('role', '==', 'Student'), where('classId', 'in', classIds));
            
            const [studentsSnapshot, gradesSnapshot, attendanceSnapshot] = await Promise.all([
                getDocs(studentQuery),
                getDocs(query(collection(firestore, `schools/${schoolId}/grades`), where('status', '==', 'Approved'))),
                getDocs(query(collection(firestore, `schools/${schoolId}/attendance`), where('date', '>=', Timestamp.fromDate(new Date(new Date().setHours(0,0,0,0))))))
            ]);

            const studentGrades: Record<string, number[]> = {};
            gradesSnapshot.forEach(doc => {
                const data = doc.data();
                if (!studentGrades[data.studentId]) {
                    studentGrades[data.studentId] = [];
                }
                const grade = parseInt(data.grade, 10);
                if (!isNaN(grade)) {
                    studentGrades[data.studentId].push(grade);
                }
            });

            const attendanceMap = new Map();
            attendanceSnapshot.forEach(doc => {
                const data = doc.data();
                attendanceMap.set(data.studentId, data.status);
            });

            const allStudents = studentsSnapshot.docs.map(doc => {
                const data = doc.data();
                const grades = studentGrades[doc.id] || [];
                const overallGrade = grades.length > 0 ? Math.round(grades.reduce((a, b) => a + b, 0) / grades.length) : undefined;
                return {
                    id: doc.id,
                    name: data.name,
                    admissionNumber: data.admissionNumber,
                    class: data.class,
                    classId: data.classId,
                    status: data.status || 'Active',
                    avatarUrl: data.avatarUrl,
                    feeStatus: ((data.balance || 0) > 0) ? 'Overdue' : 'Paid',
                    attendance: attendanceMap.get(doc.id) || 'unmarked',
                    overallGrade: overallGrade ? `${overallGrade}%` : undefined,
                } as Student;
            });
            
            const groupedByClass: Record<string, Student[]> = {};
            allStudents.forEach(student => {
                if (!groupedByClass[student.classId]) {
                    groupedByClass[student.classId] = [];
                }
                groupedByClass[student.classId].push(student);
            });

            // Rank students within each class
            for (const classId in groupedByClass) {
                groupedByClass[classId].sort((a, b) => {
                    const gradeA = a.overallGrade ? parseInt(a.overallGrade, 10) : -1;
                    const gradeB = b.overallGrade ? parseInt(b.overallGrade, 10) : -1;
                    return gradeB - gradeA;
                });
            }
            
            setStudentsByClass(groupedByClass);
        }

        setIsLoading(false);
    });

    return () => unsubscribeClasses();
  }, [schoolId, user, activeClassId]);
  
  const currentStudents = (activeClassId ? studentsByClass[activeClassId] : []) || [];
  const filteredStudents = currentStudents.filter(student => 
    (student.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
     student.admissionNumber?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8">
        <div className="mb-6">
          <h1 className="font-headline text-3xl font-bold flex items-center gap-2">
            <Users className="h-8 w-8 text-primary" />
            Class Management
          </h1>
          <p className="text-muted-foreground">
            View student profiles and performance for your classes.
          </p>
        </div>
        
        {isLoading ? (
            <div className="flex h-64 items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>
        ) : teacherClasses.length === 0 ? (
             <Card><CardContent className="p-8 text-center text-muted-foreground">You are not assigned to any classes.</CardContent></Card>
        ) : (
        <Tabs value={activeClassId} onValueChange={setActiveClassId} className="w-full">
            <TabsList>
                {teacherClasses.map(c => (
                    <TabsTrigger key={c.id} value={c.id}>{c.name}</TabsTrigger>
                ))}
            </TabsList>
            {teacherClasses.map(c => (
                 <TabsContent key={c.id} value={c.id} className="mt-4">
                    <ClassAnalytics students={studentsByClass[c.id] || []} />
                    <Card>
                        <CardHeader>
                             <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
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
                             </div>
                        </CardHeader>
                        <CardContent>
                            <div className="w-full overflow-auto rounded-lg border">
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead className="w-12 text-center">Rank</TableHead>
                                    <TableHead>Student</TableHead>
                                    <TableHead>Admission No.</TableHead>
                                    <TableHead className="text-center">Overall Grade</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {filteredStudents.map((student, index) => (
                                    <TableRow key={student.id}>
                                        <TableCell className="text-center font-bold text-lg">{index + 1}</TableCell>
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
                                        <TableCell className="text-center">
                                            <Badge variant={parseInt(student.overallGrade || '0') >= 50 ? "default" : "destructive"} className={parseInt(student.overallGrade || '0') >= 80 ? 'bg-green-600' : ''}>
                                                {student.overallGrade || 'N/A'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                           <Button asChild variant="ghost" size="sm">
                                                <Link href={`/teacher/students/${student.id}?schoolId=${schoolId}`}>
                                                    View Profile
                                                </Link>
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
            ))}
        </Tabs>
        )}
    </div>
  );
}

```
</change>
<change>
<file>src/app/parent/fees/page.tsx</file>
<content><![CDATA[
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
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { CircleDollarSign, User, ChevronDown, FileDown, Printer, CreditCard, Upload, Phone, AlertCircle, Loader2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { isPast } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { firestore } from '@/lib/firebase';
import { collection, query, onSnapshot, where, doc, getDoc, Timestamp, writeBatch, addDoc, orderBy, runTransaction, serverTimestamp } from 'firebase/firestore';
import type { DocumentData } from 'firebase/firestore';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { logAuditEvent } from '@/lib/audit-log.service';


type Child = {
    id: string;
    name: string;
    class: string;
};

type FeeSummary = {
    totalBilled: number;
    totalPaid: number;
    balance: number;
    dueDate: string;
    status: 'Paid' | 'Partial' | 'Overdue';
};

type Transaction = {
    id: string;
    date: Timestamp;
    description: string;
    type: 'Charge' | 'Payment' | 'Waiver' | 'Refund';
    amount: number;
    balance: number;
    recordedBy?: string;
};

type PaymentHistory = {
    id: string;
    term: string;
    date: string;
    amount: number;
    method: string;
}

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', minimumFractionDigits: 0 }).format(amount);
};

const getFeeStatusBadge = (status: 'Paid' | 'Partial' | 'Overdue') => {
    switch(status) {
        case 'Paid': return <Badge className="bg-green-600 hover:bg-green-700">Paid</Badge>;
        case 'Partial': return <Badge className="bg-blue-500 hover:bg-blue-500">Partial Payment</Badge>;
        case 'Overdue': return <Badge variant="destructive">Overdue</Badge>;
    }
}

export default function ParentFeesPage() {
    const searchParams = useSearchParams();
    const schoolId = searchParams.get('schoolId');
    const { user } = useAuth();
    const parentId = user?.uid;
    const [childrenData, setChildrenData] = React.useState<Child[]>([]);
    const [selectedChild, setSelectedChild] = React.useState<string | undefined>();
    const [feeSummary, setFeeSummary] = React.useState<FeeSummary | null>(null);
    const [ledger, setLedger] = React.useState<Transaction[]>([]);
    const [paymentHistory, setPaymentHistory] = React.useState<PaymentHistory[]>([]);
    const [clientReady, setClientReady] = React.useState(false);
    const [isProcessingPayment, setIsProcessingPayment] = React.useState(false);
    const [paymentAmount, setPaymentAmount] = React.useState(0);
    const { toast } = useToast();

    // Fetch children once
    React.useEffect(() => {
        if (!schoolId || !parentId) return;
        setClientReady(true);
        
        const q = query(collection(firestore, `schools/${schoolId}/users`), where('role', '==', 'Student'), where('parentId', '==', parentId));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedChildren = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Child));
            setChildrenData(fetchedChildren);
            if (!selectedChild && fetchedChildren.length > 0) {
                setSelectedChild(fetchedChildren[0].id);
            }
        });
        return () => unsubscribe();
    }, [schoolId, parentId]);


    // Fetch data for the selected child
    React.useEffect(() => {
        if (!selectedChild || !schoolId) return;

        // Listener for student summary data
        const studentDocRef = doc(firestore, `schools/${schoolId}/users`, selectedChild);
        const unsubStudent = onSnapshot(studentDocRef, (studentSnap) => {
            if (studentSnap.exists()) {
                const studentData = studentSnap.data() as DocumentData;
                const balance = (studentData.totalFee || 0) - (studentData.amountPaid || 0);
                const dueDate = studentData.dueDate instanceof Timestamp ? studentData.dueDate.toDate() : (studentData.dueDate ? new Date(studentData.dueDate) : new Date());

                 const summary: FeeSummary = {
                    totalBilled: studentData.totalFee || 0,
                    totalPaid: studentData.amountPaid || 0,
                    balance,
                    dueDate: dueDate.toISOString(),
                    status: balance <= 0 ? 'Paid' as const : (isPast(dueDate) ? 'Overdue' as const : 'Partial' as const),
                };
                setFeeSummary(summary);
                if (balance > 0) {
                    setPaymentAmount(balance);
                }
            }
        });
        
        // Listener for transactions
        const transactionsQuery = query(collection(firestore, `schools/${schoolId}/users`, selectedChild, 'transactions'), orderBy('date', 'desc'));
        const unsubTransactions = onSnapshot(transactionsQuery, (snapshot) => {
            const fetchedLedger = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction));
            setLedger(fetchedLedger);
            
            const fetchedHistory = fetchedLedger
                .filter(t => t.type === 'Payment')
                .map(t => ({
                    id: t.id,
                    term: 'Term 2, 2024',
                    date: t.date.toDate().toLocaleDateString('en-GB'),
                    amount: Math.abs(t.amount),
                    method: 'Bank/Other',
                }));
            setPaymentHistory(fetchedHistory);
        });

        return () => {
            unsubStudent();
            unsubTransactions();
        }

    }, [selectedChild, schoolId]);

    if (!clientReady || !feeSummary) {
        return (
            <div className="p-8 h-full flex items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin text-primary"/>
            </div>
        );
    }
    
    const isOverdue = feeSummary.status === 'Overdue';

    const handleCardPayment = () => {
        toast({
            title: 'Simulating Payment',
            description: 'Redirecting to secure card payment gateway...',
        });
    };
    
    const finalStatus = feeSummary.status;

    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-6">
            <div className="mb-2 p-4 md:p-6 bg-card border rounded-lg">
                <h1 className="font-headline text-3xl font-bold flex items-center gap-2">
                <CircleDollarSign className="h-8 w-8 text-primary" />
                Fees &amp; Payments
                </h1>
                <p className="text-muted-foreground">View fee statements, balances, and payment information.</p>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div className="flex items-center gap-2">
                            <User className="h-5 w-5 text-primary"/>
                            <Select value={selectedChild} onValueChange={setSelectedChild}>
                                <SelectTrigger className="w-full md:w-[240px]">
                                <SelectValue placeholder="Select a child" />
                                </SelectTrigger>
                                <SelectContent>
                                {childrenData.map((child) => (
                                    <SelectItem key={child.id} value={child.id}>{child.name}</SelectItem>
                                ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardHeader>
            </Card>

            {isOverdue && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Fee Balance Overdue</AlertTitle>
                    <AlertDescription>The fee balance for this term is overdue. Please make a payment as soon as possible.</AlertDescription>
                </Alert>
            )}

            <Tabs defaultValue="statement">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="statement">Current Term Statement</TabsTrigger>
                    <TabsTrigger value="history">Overall Payment History</TabsTrigger>
                </TabsList>
                <TabsContent value="statement" className="mt-6">
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                        <Card><CardHeader className="pb-2"><CardDescription>Outstanding Balance</CardDescription><CardTitle className={`text-4xl ${feeSummary.balance > 0 ? 'text-destructive' : 'text-green-600'}`}>{formatCurrency(feeSummary.balance)}</CardTitle></CardHeader><CardContent><div className="text-xs text-muted-foreground">Due: {new Date(feeSummary.dueDate).toLocaleDateString('en-GB')}</div></CardContent></Card>
                        <Card><CardHeader className="pb-2"><CardDescription>Total Billed (Term 2)</CardDescription><CardTitle className="text-2xl">{formatCurrency(feeSummary.totalBilled)}</CardTitle></CardHeader></Card>
                        <Card><CardHeader className="pb-2"><CardDescription>Total Paid (Term 2)</CardDescription><CardTitle className="text-2xl">{formatCurrency(feeSummary.totalPaid)}</CardTitle></CardHeader></Card>
                        <Card><CardHeader className="pb-2"><CardDescription>Payment Status</CardDescription><CardTitle className="text-2xl">{getFeeStatusBadge(finalStatus)}</CardTitle></CardHeader></Card>
                    </div>
                    
                    <div className="grid gap-6 lg:grid-cols-3 mt-6">
                        <Card className="lg:col-span-2">
                            <CardHeader><div className="flex items-center justify-between"><CardTitle>Fee Statement (Term 2, 2024)</CardTitle><DropdownMenu><DropdownMenuTrigger asChild><Button variant="outline" className="w-full sm:w-auto"><FileDown className="mr-2 h-4 w-4" />Export<ChevronDown className="ml-2 h-4 w-4" /></Button></DropdownMenuTrigger><DropdownMenuContent><DropdownMenuItem><Printer className="mr-2"/> Print Statement</DropdownMenuItem><DropdownMenuItem><FileDown className="mr-2"/> Export as PDF</DropdownMenuItem></DropdownMenuContent></DropdownMenu></div><CardDescription>A detailed transaction history for the current term.</CardDescription></CardHeader>
                            <CardContent>
                                <div className="w-full overflow-auto rounded-lg border">
                                    <Table>
                                        <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Description</TableHead><TableHead className="text-right">Charges (KES)</TableHead><TableHead className="text-right">Payments (KES)</TableHead><TableHead className="text-right">Balance (KES)</TableHead></TableRow></TableHeader>
                                        <TableBody>
                                            {ledger.map(item => (<TableRow key={item.id}><TableCell>{item.date.toDate().toLocaleDateString('en-GB')}</TableCell><TableCell className="font-medium">{item.description}</TableCell><TableCell className={`text-right ${item.amount > 0 ? 'text-destructive' : ''}`}>{item.amount > 0 ? formatCurrency(item.amount) : '—'}</TableCell><TableCell className={`text-right text-green-600`}>{item.amount < 0 ? formatCurrency(Math.abs(item.amount)) : '—'}</TableCell><TableCell className="text-right font-semibold">{formatCurrency(item.balance)}</TableCell></TableRow>))}
                                            {ledger.length === 0 && (<TableRow><TableCell colSpan={5} className="h-24 text-center">No transactions for this term yet.</TableCell></TableRow>)}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader><CardTitle>Payment Options</CardTitle><CardDescription>Select your preferred payment method.</CardDescription></CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-4"><h4 className="font-semibold text-sm">Pay with Card</h4><Button className="w-full" variant="outline" onClick={handleCardPayment} disabled={feeSummary.balance <= 0}><CreditCard className="mr-2 h-4 w-4"/>Visa / Mastercard</Button></div>
                                <Separator />
                                <div className="space-y-4"><h4 className="font-semibold text-sm">Bank Transfer</h4><div className="text-xs space-y-1 text-muted-foreground bg-muted/50 p-3 rounded-md"><p>Bank: <span className="font-bold">Kenya Commercial Bank</span></p><p>Account: <span className="font-bold">1122334455</span></p><p>Branch: <span className="font-bold">University Way</span></p><p>Account Name: <span className="font-bold">EduSphere High School</span></p></div><Button className="w-full" variant="outline" disabled><Upload className="mr-2 h-4 w-4"/>Upload Proof of Payment</Button></div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
                <TabsContent value="history" className="mt-6">
                     <Card>
                        <CardHeader><CardTitle>Overall Payment History</CardTitle><CardDescription>A record of all payments made for {childrenData.find(c => c.id === selectedChild)?.name}.</CardDescription></CardHeader>
                        <CardContent>
                            <Card className="mb-6 bg-muted/50"><CardHeader><CardDescription>Total Amount Paid to Date</CardDescription><CardTitle className="text-3xl">{formatCurrency(paymentHistory.reduce((sum, p) => sum + p.amount, 0))}</CardTitle></CardHeader></Card>
                            <div className="w-full overflow-auto rounded-lg border"><Table><TableHeader><TableRow><TableHead>Term</TableHead><TableHead>Payment Date</TableHead><TableHead>Method</TableHead><TableHead className="text-right">Amount (KES)</TableHead></TableRow></TableHeader><TableBody>{paymentHistory.map(item => (<TableRow key={item.id}><TableCell className="font-medium">{item.term}</TableCell><TableCell>{item.date}</TableCell><TableCell><Badge variant="outline">{item.method}</Badge></TableCell><TableCell className="text-right font-semibold">{formatCurrency(item.amount)}</TableCell></TableRow>))}</TableBody></Table></div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}

    
