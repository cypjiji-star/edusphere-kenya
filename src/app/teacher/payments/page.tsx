
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CircleDollarSign, PlusCircle, Search, FileDown, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { firestore, auth } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, query, where, onSnapshot, orderBy, Timestamp } from 'firebase/firestore';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/auth-context';

type MiniPayment = {
    id: string;
    studentName: string;
    studentId: string;
    className: string;
    amount: number;
    description: string;
    recordedAt: Timestamp;
    teacherId: string;
};

type TeacherClass = {
  id: string;
  name: string;
};

type TeacherStudent = {
    id: string;
    name: string;
    classId: string;
};

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', minimumFractionDigits: 0 }).format(amount);
};


export default function TeacherPaymentsPage() {
    const searchParams = useSearchParams();
    const schoolId = searchParams.get('schoolId');
    const { user } = useAuth();
    const { toast } = useToast();

    const [teacherClasses, setTeacherClasses] = React.useState<TeacherClass[]>([]);
    const [allTeacherStudents, setAllTeacherStudents] = React.useState<TeacherStudent[]>([]);
    const [payments, setPayments] = React.useState<MiniPayment[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);

    // Form state
    const [selectedStudentId, setSelectedStudentId] = React.useState('');
    const [amount, setAmount] = React.useState('');
    const [description, setDescription] = React.useState('');
    const [isSubmitting, setIsSubmitting] = React.useState(false);

    React.useEffect(() => {
        if (!schoolId || !user) return;
        const teacherId = user.uid;

        const classesQuery = query(collection(firestore, `schools/${schoolId}/classes`), where('teacherId', '==', teacherId));
        const unsubClasses = onSnapshot(classesQuery, (snapshot) => {
            const classesData = snapshot.docs.map(doc => ({ id: doc.id, name: `${doc.data().name} ${doc.data().stream || ''}`.trim() }));
            setTeacherClasses(classesData);
        });

        return () => unsubClasses();
    }, [schoolId, user]);
    
    React.useEffect(() => {
        if (!schoolId || teacherClasses.length === 0) return;
        const classIds = teacherClasses.map(c => c.id);
        if(classIds.length === 0) return;

        const studentsQuery = query(collection(firestore, `schools/${schoolId}/students`), where('classId', 'in', classIds));
        const unsubStudents = onSnapshot(studentsQuery, (snapshot) => {
            const studentsData = snapshot.docs.map(doc => ({ id: doc.id, name: doc.data().name, classId: doc.data().classId }));
            setAllTeacherStudents(studentsData);
        });
        return () => unsubStudents();
    }, [schoolId, teacherClasses]);

    React.useEffect(() => {
        if (!schoolId || !user) {
            setIsLoading(false);
            return;
        };
        const teacherId = user.uid;

        setIsLoading(true);
        const paymentsQuery = query(collection(firestore, `schools/${schoolId}/mini_payments`), where('teacherId', '==', teacherId), orderBy('recordedAt', 'desc'));
        const unsubscribe = onSnapshot(paymentsQuery, (snapshot) => {
            const paymentsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MiniPayment));
            setPayments(paymentsData);
            setIsLoading(false);
        }, (error) => {
            console.error("Error fetching payments: ", error);
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [schoolId, user]);

    const handleSavePayment = async () => {
        if (!selectedStudentId || !amount || !description || !schoolId || !user) {
            toast({ title: 'Missing Information', description: 'Please fill out all fields.', variant: 'destructive'});
            return;
        }
        setIsSubmitting(true);

        try {
            const student = allTeacherStudents.find(s => s.id === selectedStudentId);
            if (!student) throw new Error("Student not found");

            await addDoc(collection(firestore, `schools/${schoolId}/mini_payments`), {
                studentId: selectedStudentId,
                studentName: student.name,
                classId: student.classId,
                className: teacherClasses.find(c => c.id === student.classId)?.name || 'Unknown',
                amount: Number(amount),
                description: description,
                teacherId: user.uid,
                teacherName: user.displayName || 'Teacher',
                recordedAt: serverTimestamp(),
            });
            
            await addDoc(collection(firestore, `schools/${schoolId}/notifications`), {
                title: 'Class Funds Payment Recorded',
                description: `${user.displayName || 'A teacher'} recorded a payment of ${formatCurrency(Number(amount))} for ${student.name}.`,
                createdAt: serverTimestamp(),
                category: 'Finance',
                href: `/admin/expenses?schoolId=${schoolId}`,
            });

            toast({ title: 'Payment Recorded', description: 'The payment has been successfully logged.' });
            setSelectedStudentId('');
            setAmount('');
            setDescription('');

        } catch (error) {
            console.error("Error recording payment:", error);
            toast({ title: 'Submission Failed', variant: 'destructive' });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    if (!schoolId) return <div className="p-8">Error: School ID missing from URL.</div>
    if (!user) return <div className="p-8">Error: User not authenticated.</div>


    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <div className="mb-6">
                <h1 className="font-headline text-3xl font-bold flex items-center gap-2">
                    <CircleDollarSign className="h-8 w-8 text-primary" />
                    Class Funds
                </h1>
                <p className="text-muted-foreground">Record and track miscellaneous payments for your classes.</p>
            </div>
            <div className="grid gap-8 lg:grid-cols-3">
                <div className="lg:col-span-1">
                    <Card>
                        <CardHeader>
                            <CardTitle>Record New Payment</CardTitle>
                            <CardDescription>Log a new payment received from a student.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                             <div className="space-y-2">
                                <Label htmlFor="student-select">Student</Label>
                                <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
                                    <SelectTrigger id="student-select">
                                        <SelectValue placeholder="Select a student..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {allTeacherStudents.map(student => (
                                            <SelectItem key={student.id} value={student.id}>{student.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="payment-amount">Amount (KES)</Label>
                                <Input id="payment-amount" type="number" placeholder="e.g., 200" value={amount} onChange={e => setAmount(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="payment-desc">Description</Label>
                                <Textarea id="payment-desc" placeholder="e.g., Class party contribution, Trip fee" value={description} onChange={e => setDescription(e.target.value)} />
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button className="w-full" onClick={handleSavePayment} disabled={isSubmitting}>
                                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <PlusCircle className="mr-2 h-4 w-4"/>}
                                Record Payment
                            </Button>
                        </CardFooter>
                    </Card>
                </div>
                <div className="lg:col-span-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Payment Log</CardTitle>
                            <CardDescription>A log of all mini-payments you have recorded.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="w-full overflow-auto rounded-lg border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Date</TableHead>
                                            <TableHead>Student</TableHead>
                                            <TableHead>Description</TableHead>
                                            <TableHead className="text-right">Amount</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                    {isLoading ? (
                                        <TableRow><TableCell colSpan={4} className="h-24 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></TableCell></TableRow>
                                    ) : payments.length > 0 ? (
                                        payments.map(payment => (
                                            <TableRow key={payment.id}>
                                                <TableCell>{payment.recordedAt?.toDate().toLocaleDateString()}</TableCell>
                                                <TableCell>{payment.studentName}</TableCell>
                                                <TableCell>{payment.description}</TableCell>
                                                <TableCell className="text-right font-medium">{formatCurrency(payment.amount)}</TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow><TableCell colSpan={4} className="h-24 text-center">No payments recorded yet.</TableCell></TableRow>
                                    )}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
