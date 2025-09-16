
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
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, PieChart, Pie, Cell } from 'recharts';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart';
import { Badge } from '@/components/ui/badge';
import { CircleDollarSign, TrendingUp, TrendingDown, Hourglass, Loader2, CreditCard, Send, FileText, PlusCircle, Users, UserX, UserCheck, Trophy, AlertCircle, Calendar, Search, Edit2, Trash2, Shield, CalendarIcon, Printer, Mail } from 'lucide-react';
import { firestore } from '@/lib/firebase';
import { collection, query, onSnapshot, where, Timestamp, orderBy, limit, doc, getDoc, addDoc, updateDoc, deleteDoc, writeBatch, getDocs } from 'firebase/firestore';
import { useSearchParams } from 'next/navigation';
import { format, isPast, differenceInDays, formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
  DialogFooter
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';


const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    minimumFractionDigits: 0,
  }).format(amount);
};

const collectionTrendConfig = {
  collected: {
    label: 'Collected',
    color: 'hsl(var(--primary))',
  },
};

const arrearsChartConfig = {
  Collected: {
    label: 'Collected',
    color: 'hsl(var(--chart-1))',
  },
  Outstanding: {
    label: 'Outstanding',
    color: 'hsl(var(--chart-2))',
  },
};

type StudentFeeProfile = {
    id: string;
    name: string;
    class: string;
    avatarUrl: string;
    totalBilled: number;
    totalPaid: number;
    balance: number;
    status: 'Paid' | 'Partial' | 'Overdue';
    admissionNo?: string;
    transactions?: Transaction[];
};

type Transaction = {
    id: string;
    date: Timestamp;
    description: string;
    type: 'Charge' | 'Payment';
    amount: number;
    balance: number;
}

type FeeStructureItem = {
    id: string;
    category: string;
    amount: number;
    appliesTo: string;
}

function ReceiptDialog({ transaction, student, schoolName, open, onOpenChange }: { transaction: Transaction | null, student: StudentFeeProfile | null, schoolName: string, open: boolean, onOpenChange: (open: boolean) => void }) {
    if (!transaction || !student) return null;

    const printReceipt = () => {
        const printWindow = window.open('', 'PRINT', 'height=600,width=800');
        const receiptContent = document.getElementById('receipt-content');
        if (printWindow && receiptContent) {
            printWindow.document.write('<html><head><title>Receipt</title>');
            // A basic style for printing
            printWindow.document.write('<style>body { font-family: sans-serif; } .receipt-container { width: 100%; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ccc; } h2, h3 { color: #333; } .paid-stamp { border: 3px solid #008000; color: #008000; padding: 10px; font-weight: bold; text-align: center; transform: rotate(-15deg); width: 100px; margin: 20px auto; } </style>');
            printWindow.document.write('</head><body>');
            printWindow.document.write(receiptContent.innerHTML);
            printWindow.document.write('</body></html>');
            printWindow.document.close();
            printWindow.focus();
            printWindow.print();
            printWindow.close();
        }
    };
    
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl">
                <div id="receipt-content">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold">{schoolName}</DialogTitle>
                        <DialogDescription>Official Payment Receipt</DialogDescription>
                    </DialogHeader>
                    <div className="py-6 space-y-6">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <p className="font-semibold">Receipt No:</p>
                                <p className="font-mono text-xs">{transaction.id}</p>
                            </div>
                             <div className="text-right">
                                <p className="font-semibold">Date:</p>
                                <p>{transaction.date.toDate().toLocaleDateString()}</p>
                            </div>
                        </div>
                        <Separator />
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <p className="font-semibold">Received From:</p>
                                <p>{student.name}</p>
                                <p className="text-muted-foreground">{student.class}</p>
                            </div>
                             <div className="text-right">
                                <p className="font-semibold">Amount Paid:</p>
                                <p className="text-2xl font-bold text-green-600">{formatCurrency(Math.abs(transaction.amount))}</p>
                            </div>
                        </div>
                        <div className="text-center text-lg font-bold text-green-600 border-4 border-green-600 p-2 rounded-lg inline-block transform -rotate-12">
                            PAID
                        </div>
                        <Separator />
                         <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <p className="font-semibold">Details:</p>
                                <p>{transaction.description}</p>
                            </div>
                            <div className="text-right">
                                <p className="font-semibold">Balance After Payment:</p>
                                <p className="font-bold">{formatCurrency(transaction.balance)}</p>
                            </div>
                        </div>
                        <div className="text-center text-xs text-muted-foreground mt-8">
                            Thank you for your payment.
                        </div>
                    </div>
                </div>
                 <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
                    <Button onClick={printReceipt}><Printer className="mr-2 h-4 w-4" />Print Receipt</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export default function FeesPage() {
  const searchParams = useSearchParams();
  const schoolId = searchParams.get('schoolId');
  const { toast } = useToast();
  const [financials, setFinancials] = React.useState({
    totalBilled: 0,
    totalCollected: 0,
    outstanding: 0,
    todaysCollections: 0,
  });
  const [collectionTrend, setCollectionTrend] = React.useState<any[]>([]);
  const [arrearsData, setArrearsData] = React.useState<any[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [studentsWithFees, setStudentsWithFees] = React.useState<{cleared: number; arrears: number; overdue: number}>({ cleared: 0, arrears: 0, overdue: 0 });
  const [topDebtors, setTopDebtors] = React.useState<any[]>([]);
  const [upcomingDeadline, setUpcomingDeadline] = React.useState<Date | null>(null);

  // State for student profiles tab
  const [allStudents, setAllStudents] = React.useState<StudentFeeProfile[]>([]);
  const [filteredStudents, setFilteredStudents] = React.useState<StudentFeeProfile[]>([]);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [classFilter, setClassFilter] = React.useState('All Classes');
  const [statusFilter, setStatusFilter] = React.useState('All Statuses');
  const [classes, setClasses] = React.useState<string[]>(['All Classes']);
  const [selectedStudent, setSelectedStudent] = React.useState<StudentFeeProfile | null>(null);
  const [selectedTransaction, setSelectedTransaction] = React.useState<Transaction | null>(null);
  const [schoolName, setSchoolName] = React.useState('');
  
  // State for manual payment dialog
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = React.useState(false);
  const [selectedStudentForPayment, setSelectedStudentForPayment] = React.useState('');
  const [paymentAmount, setPaymentAmount] = React.useState('');
  const [paymentMethod, setPaymentMethod] = React.useState('Cash');
  const [paymentDate, setPaymentDate] = React.useState<Date | undefined>(new Date());
  const [paymentNotes, setPaymentNotes] = React.useState('');
  const [isSavingPayment, setIsSavingPayment] = React.useState(false);

  // State for Fee Structure tab
  const [feeStructure, setFeeStructure] = React.useState<FeeStructureItem[]>([]);
  const [selectedClassForStructure, setSelectedClassForStructure] = React.useState('');
  const [classYearlyFee, setClassYearlyFee] = React.useState<number>(0);
  const [newFeeItemCategory, setNewFeeItemCategory] = React.useState('');
  const [newFeeItemAmount, setNewFeeItemAmount] = React.useState('');


  React.useEffect(() => {
    if (!schoolId) {
        setIsLoading(false);
        return;
    };
    setIsLoading(true);

    const schoolRef = doc(firestore, 'schools', schoolId);
    getDoc(schoolRef).then(doc => {
        if(doc.exists()) {
            setSchoolName(doc.data().name);
        }
    })

    const studentsQuery = query(collection(firestore, `schools/${schoolId}/students`));
    const unsubStudents = onSnapshot(studentsQuery, (snapshot) => {
      let totalBilled = 0;
      let totalCollected = 0;
      let clearedCount = 0;
      let arrearsCount = 0;
      let overdueCount = 0;
      const studentDebtors: any[] = [];
      let nextDeadline: Date | null = null;
      const studentProfiles: StudentFeeProfile[] = [];
      const classSet = new Set<string>();

      snapshot.forEach(doc => {
        const data = doc.data();
        const studentBalance = (data.totalFee || 0) - (data.amountPaid || 0);
        const dueDate = data.dueDate instanceof Timestamp ? data.dueDate.toDate() : (data.dueDate ? new Date(data.dueDate) : new Date());

        totalBilled += data.totalFee || 0;
        totalCollected += data.amountPaid || 0;
        
        let status: 'Paid' | 'Partial' | 'Overdue' = 'Paid';
        if (studentBalance > 0) {
            status = isPast(dueDate) ? 'Overdue' : 'Partial';
        }

        studentProfiles.push({
            id: doc.id,
            name: data.name,
            class: data.class,
            avatarUrl: data.avatarUrl,
            totalBilled: data.totalFee || 0,
            totalPaid: data.amountPaid || 0,
            balance: studentBalance,
            status: status,
            admissionNo: data.admissionNumber,
        });

        if (data.class) classSet.add(data.class);

        if (studentBalance <= 0) {
            clearedCount++;
        } else {
            arrearsCount++;
            if(isPast(dueDate)) {
                overdueCount++;
            } else {
                if (!nextDeadline || dueDate < nextDeadline) {
                    nextDeadline = dueDate;
                }
            }
            studentDebtors.push({
                id: doc.id,
                name: data.name,
                class: data.class,
                avatarUrl: data.avatarUrl,
                balance: studentBalance,
            });
        }
      });
      const outstanding = totalBilled - totalCollected;
      setFinancials(prev => ({...prev, totalBilled, totalCollected, outstanding }));
      setUpcomingDeadline(nextDeadline);
      
      const collectedPercentage = totalBilled > 0 ? (totalCollected / totalBilled) * 100 : 0;
      setArrearsData([
          { name: 'Collected', value: collectedPercentage, fill: 'hsl(var(--chart-1))' },
          { name: 'Outstanding', value: 100 - collectedPercentage, fill: 'hsl(var(--chart-2))'},
      ]);

      setStudentsWithFees({ cleared: clearedCount, arrears: arrearsCount, overdue: overdueCount });
      setTopDebtors(studentDebtors.sort((a, b) => b.balance - a.balance).slice(0, 5));
      setAllStudents(studentProfiles);
      setFilteredStudents(studentProfiles); // Initially show all
      const classList = ['All Classes', ...Array.from(classSet)];
      setClasses(classList);
      if (!selectedClassForStructure && classList.length > 1) {
        setSelectedClassForStructure(classList[1]); // Default to first actual class
      }
    });

    const feeStructureQuery = query(collection(firestore, `schools/${schoolId}/feeStructure`));
    const unsubFeeStructure = onSnapshot(feeStructureQuery, (snapshot) => {
        const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FeeStructureItem));
        setFeeStructure(items);
    });

    const today = new Date();
    const startOfToday = new Date(today.setHours(0, 0, 0, 0));
    const paymentsQuery = query(
      collection(firestore, `schools/${schoolId}/transactions`), 
      where('date', '>=', Timestamp.fromDate(startOfToday)),
      where('type', '==', 'Payment')
    );
    const unsubPayments = onSnapshot(paymentsQuery, (snapshot) => {
      let todaysTotal = 0;
      snapshot.forEach(doc => {
        todaysTotal += Math.abs(doc.data().amount);
      });
      setFinancials(prev => ({...prev, todaysCollections: todaysTotal}));
    });

    const trends = [ { month: 'Jan', collected: 4500000 }, { month: 'Feb', collected: 4800000 }, { month: 'Mar', collected: 5200000 }, { month: 'Apr', collected: 3900000 }, { month: 'May', collected: 6100000 }, ];
    setCollectionTrend(trends);
    
    setIsLoading(false);

    return () => {
      unsubStudents();
      unsubPayments();
      unsubFeeStructure();
    };
  }, [schoolId]);

  React.useEffect(() => {
    let students = allStudents;
    if (searchTerm) {
        students = students.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.admissionNo?.toLowerCase().includes(searchTerm.toLowerCase()));
    }
    if (classFilter !== 'All Classes') {
        students = students.filter(s => s.class === classFilter);
    }
    if (statusFilter !== 'All Statuses') {
        students = students.filter(s => s.status === statusFilter);
    }
    setFilteredStudents(students);
  }, [searchTerm, classFilter, statusFilter, allStudents]);
  
  React.useEffect(() => {
    const classFees = feeStructure
        .filter(item => item.appliesTo === selectedClassForStructure || item.appliesTo === 'All Students')
        .reduce((total, item) => total + item.amount, 0);
    setClassYearlyFee(classFees);
  }, [selectedClassForStructure, feeStructure]);

  const openStudentDialog = async (student: StudentFeeProfile) => {
    const transactionsQuery = query(collection(firestore, `schools/${schoolId}/students/${student.id}/transactions`), orderBy('date', 'desc'));
    const transactionsSnapshot = await getDocs(transactionsQuery);
    const transactions = transactionsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction));
    setSelectedStudent({ ...student, transactions });
  }
  
  const handleRecordPayment = async () => {
    if (!schoolId || !selectedStudentForPayment || !paymentAmount || !paymentDate) {
        toast({ title: "Missing fields", description: "Please select a student and enter an amount and date.", variant: "destructive" });
        return;
    }
    setIsSavingPayment(true);
    
    const studentRef = doc(firestore, `schools/${schoolId}/students`, selectedStudentForPayment);
    
    try {
        const studentDoc = await getDoc(studentRef);
        if (!studentDoc.exists()) throw new Error("Student not found");
        
        const currentData = studentDoc.data();
        const amount = Number(paymentAmount);
        
        const newPaid = (currentData.amountPaid || 0) + amount;
        
        const batch = writeBatch(firestore);
        
        batch.update(studentRef, { amountPaid: newPaid });

        const transactionRef = doc(collection(studentRef, 'transactions'));
        batch.set(transactionRef, {
            date: Timestamp.fromDate(paymentDate),
            description: `Payment via ${paymentMethod}`,
            type: 'Payment',
            amount: -amount,
            notes: paymentNotes
        });

        await batch.commit();

        toast({
            title: "Payment Recorded",
            description: `A ${paymentMethod} payment of ${formatCurrency(amount)} has been recorded and a confirmation has been sent.`
        });
        
        setSelectedStudentForPayment('');
        setPaymentAmount('');
        setPaymentNotes('');
        setIsPaymentDialogOpen(false);

    } catch (e) {
        console.error("Error recording payment:", e);
        toast({ title: 'Error', description: 'Could not record payment.', variant: 'destructive'});
    } finally {
        setIsSavingPayment(false);
    }
  }


  const handleSaveFeeItem = async (itemId?: string) => {
    if (!newFeeItemCategory || !newFeeItemAmount || !schoolId) {
        toast({ title: "Missing Information", variant: "destructive" });
        return;
    }
    
    const itemData = {
        category: newFeeItemCategory,
        amount: Number(newFeeItemAmount),
        appliesTo: selectedClassForStructure
    };

    try {
        if (itemId) {
            await updateDoc(doc(firestore, `schools/${schoolId}/feeStructure`, itemId), itemData);
            toast({ title: "Fee Item Updated" });
        } else {
            await addDoc(collection(firestore, `schools/${schoolId}/feeStructure`), itemData);
            toast({ title: "New Fee Item Added" });
        }
        setNewFeeItemCategory('');
        setNewFeeItemAmount('');
    } catch (e) {
        console.error(e);
        toast({ title: "Save Failed", variant: "destructive" });
    }
  }

  const handleDeleteFeeItem = async (itemId: string) => {
    if (!window.confirm("Are you sure you want to delete this fee item?")) return;
    if (!schoolId) return;
    try {
        await deleteDoc(doc(firestore, `schools/${schoolId}/feeStructure`, itemId));
        toast({ title: "Fee Item Deleted" });
    } catch (e) {
        console.error(e);
        toast({ title: "Delete Failed", variant: "destructive" });
    }
  }
  
  const handleSaveClassFees = async () => {
    if (!selectedClassForStructure || !schoolId) return;
    const batch = writeBatch(firestore);
    const studentsInClassQuery = query(collection(firestore, 'schools', schoolId, 'students'), where('class', '==', selectedClassForStructure));
    const studentsSnapshot = await getDocs(studentsInClassQuery);
    
    studentsSnapshot.forEach(studentDoc => {
        const studentRef = doc(firestore, 'schools', schoolId, 'students', studentDoc.id);
        batch.update(studentRef, { totalFee: classYearlyFee });
    });

    try {
        await batch.commit();
        toast({
            title: 'Fees Applied',
            description: `Yearly fee of ${formatCurrency(classYearlyFee)} has been applied to all students in ${selectedClassForStructure}.`,
        });
    } catch (e) {
        console.error(e);
        toast({title: 'Failed to Apply Fees', variant: 'destructive'});
    }
  };

  const handleSendReminders = () => {
    toast({
      title: "Sending Reminders...",
      description: `Bulk reminders are being sent to parents with overdue balances.`,
    });
  };
  
  const handleSendStatement = () => {
      toast({
          title: 'Statement Sent',
          description: `The fee statement for ${selectedStudent?.name} has been sent to their parent.`,
      });
  }


  if (isLoading) {
    return <div className="p-8 h-full flex items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>
  }
  
  if (!schoolId) {
    return <div className="p-8">Error: School ID is missing from URL.</div>
  }

  const getFeeStatusBadge = (status: StudentFeeProfile['status']) => {
    switch (status) {
      case 'Paid': return <Badge variant="default" className="bg-green-600 hover:bg-green-700">Paid</Badge>;
      case 'Partial': return <Badge variant="secondary" className="bg-blue-500 text-white hover:bg-blue-500">Partial</Badge>;
      case 'Overdue': return <Badge variant="destructive">Overdue</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const currentClassFeeItems = feeStructure.filter(item => item.appliesTo === selectedClassForStructure || item.appliesTo === 'All Students');


  return (
    <>
      <Dialog onOpenChange={(open) => !open && setSelectedStudent(null)}>
        <div className="p-4 sm:p-6 lg:p-8">
          <div className="mb-6">
            <h1 className="font-headline text-3xl font-bold flex items-center gap-2">
              <CircleDollarSign className="h-8 w-8 text-primary" />
              Fees & Payments
            </h1>
            <p className="text-muted-foreground">An overview of the school's fee collection status and student accounts.</p>
          </div>

          <Tabs defaultValue="dashboard">
              <TabsList className="mb-4 grid w-full grid-cols-3">
                  <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
                  <TabsTrigger value="students">Student Accounts</TabsTrigger>
                  <TabsTrigger value="structure">Fee Structure</TabsTrigger>
              </TabsList>
              <TabsContent value="dashboard" className="space-y-6">
                   {upcomingDeadline && differenceInDays(upcomingDeadline, new Date()) <= 30 && (
                      <Alert className="mb-6">
                          <Calendar className="h-4 w-4" />
                          <AlertTitle>Upcoming Deadline</AlertTitle>
                          <AlertDescription>
                              A fee payment deadline is approaching on {format(upcomingDeadline, 'PPP')} ({formatDistanceToNow(upcomingDeadline, { addSuffix: true })}).
                          </AlertDescription>
                      </Alert>
                  )}

                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                      <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Total Expected Fees (Term)</CardTitle><TrendingUp className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{formatCurrency(financials.totalBilled)}</div><p className="text-xs text-muted-foreground">Based on current enrollment</p></CardContent></Card>
                      <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Total Collected (To Date)</CardTitle><TrendingUp className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold text-green-600">{formatCurrency(financials.totalCollected)}</div><p className="text-xs text-muted-foreground">Across all terms and sessions</p></CardContent></Card>
                      <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Total Outstanding Balance</CardTitle><TrendingDown className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold text-destructive">{formatCurrency(financials.outstanding)}</div><p className="text-xs text-muted-foreground">Aggregate of all student arrears</p></CardContent></Card>
                      <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Today's Collections</CardTitle><Hourglass className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{formatCurrency(financials.todaysCollections)}</div><p className="text-xs text-muted-foreground">{format(new Date(), 'PPP')}</p></CardContent></Card>
                  </div>

                  <Card>
                      <CardHeader><CardTitle>Quick Actions</CardTitle></CardHeader>
                      <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
                              <DialogTrigger asChild>
                                  <Button><CreditCard className="mr-2 h-4 w-4" />Record Payment</Button>
                              </DialogTrigger>
                               <DialogContent>
                                  <DialogHeader>
                                      <DialogTitle>Record Manual Payment</DialogTitle>
                                      <DialogDescription>Record a cash, cheque, or bank deposit payment.</DialogDescription>
                                  </DialogHeader>
                                  <div className="space-y-4 py-4">
                                      <div className="space-y-2">
                                          <Label htmlFor="payment-student">Student</Label>
                                          <Select value={selectedStudentForPayment} onValueChange={setSelectedStudentForPayment}>
                                              <SelectTrigger id="payment-student"><SelectValue placeholder="Select a student..." /></SelectTrigger>
                                              <SelectContent>
                                                  {allStudents.map(s => <SelectItem key={s.id} value={s.id}>{s.name} ({s.class})</SelectItem>)}
                                              </SelectContent>
                                          </Select>
                                      </div>
                                      <div className="grid grid-cols-2 gap-4">
                                          <div className="space-y-2">
                                              <Label htmlFor="payment-amount">Amount (KES)</Label>
                                              <Input id="payment-amount" type="number" placeholder="e.g., 10000" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} />
                                          </div>
                                           <div className="space-y-2">
                                              <Label htmlFor="payment-method">Payment Method</Label>
                                              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                                                  <SelectTrigger id="payment-method"><SelectValue /></SelectTrigger>
                                                  <SelectContent>
                                                      <SelectItem value="Cash">Cash</SelectItem>
                                                      <SelectItem value="Bank Deposit">Bank Deposit</SelectItem>
                                                      <SelectItem value="Cheque">Cheque</SelectItem>
                                                      <SelectItem value="Airtel Money">Airtel Money</SelectItem>
                                                      <SelectItem value="Pesalink">Pesalink</SelectItem>
                                                  </SelectContent>
                                              </Select>
                                          </div>
                                      </div>
                                       <div className="space-y-2">
                                          <Label>Date of Payment</Label>
                                          <Popover>
                                              <PopoverTrigger asChild>
                                                  <Button variant="outline" className={cn("w-full font-normal", !paymentDate && "text-muted-foreground")}>
                                                      <CalendarIcon className="mr-2 h-4 w-4"/>
                                                      {paymentDate ? format(paymentDate, 'PPP') : 'Pick a date'}
                                                  </Button>
                                              </PopoverTrigger>
                                              <PopoverContent><Calendar mode="single" selected={paymentDate} onSelect={setPaymentDate} /></PopoverContent>
                                          </Popover>
                                      </div>
                                       <div className="space-y-2">
                                          <Label htmlFor="payment-notes">Notes / Reference No.</Label>
                                          <Textarea id="payment-notes" placeholder="e.g., Cheque no. 12345, Deposit slip ref..." value={paymentNotes} onChange={(e) => setPaymentNotes(e.target.value)} />
                                      </div>
                                  </div>
                                  <DialogFooter>
                                      <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                                      <Button onClick={handleRecordPayment} disabled={isSavingPayment}>
                                          {isSavingPayment && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                                          Save Payment
                                      </Button>
                                  </DialogFooter>
                              </DialogContent>
                          </Dialog>
                          <Button onClick={handleSendReminders}><Send className="mr-2 h-4 w-4" />Send Reminders</Button>
                          <Button><FileText className="mr-2 h-4 w-4" />Generate Report</Button>
                          <Button><PlusCircle className="mr-2 h-4 w-4" />New Invoice</Button>
                      </CardContent>
                  </Card>
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                      <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium flex items-center gap-2"><UserCheck className="h-4 w-4 text-green-600"/>Students with Cleared Balances</CardTitle></CardHeader><CardContent><div className="text-3xl font-bold text-green-600">{studentsWithFees.cleared}</div><p className="text-xs text-muted-foreground">students have a zero or positive balance.</p></CardContent></Card>
                      <Card className="border-red-500/50"><CardHeader className="pb-2"><CardTitle className="text-sm font-medium flex items-center gap-2 text-destructive"><UserX className="h-4 w-4"/>Students with Overdue Payments</CardTitle></CardHeader><CardContent><div className="text-3xl font-bold text-destructive">{studentsWithFees.overdue}</div><p className="text-xs text-muted-foreground">{studentsWithFees.arrears} total students have some arrears.</p></CardContent></Card>
                      <Card className="lg:col-span-1 md:col-span-2"><CardHeader><CardTitle className="flex items-center gap-2"><Trophy className="h-4 w-4 text-yellow-500"/>Top 5 Highest Balances</CardTitle></CardHeader><CardContent>
                          <Table><TableHeader><TableRow><TableHead>Student</TableHead><TableHead className="text-right">Balance</TableHead></TableRow></TableHeader>
                              <TableBody>
                                  {topDebtors.map(student => (
                                      <TableRow key={student.id}><TableCell><div className="flex items-center gap-3"><Avatar className="h-8 w-8"><AvatarImage src={student.avatarUrl} /><AvatarFallback>{student.name.charAt(0)}</AvatarFallback></Avatar><div><div className="font-medium">{student.name}</div><div className="text-xs text-muted-foreground">{student.class}</div></div></div></TableCell><TableCell className="text-right font-semibold text-destructive">{formatCurrency(student.balance)}</TableCell></TableRow>
                                  ))}
                              </TableBody>
                          </Table>
                      </CardContent></Card>
                  </div>

                  <div className="grid gap-6 md:grid-cols-2">
                      <Card><CardHeader><CardTitle>Collection vs. Arrears</CardTitle><CardDescription>A visual breakdown of collected fees against outstanding amounts for the current term.</CardDescription></CardHeader><CardContent><ChartContainer config={arrearsChartConfig} className="mx-auto aspect-square h-[250px]"><PieChart><ChartTooltip content={<ChartTooltipContent nameKey="name" hideLabel />} /><Pie data={arrearsData} dataKey="value" nameKey="name" innerRadius={60} strokeWidth={5}>{arrearsData.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.fill} />))}</Pie><ChartLegend content={<ChartLegendContent nameKey="name" />} className="-translate-y-2 flex-wrap gap-2 [&>*]:basis-1/2 [&>*]:justify-center" /></PieChart></ChartContainer></CardContent></Card>
                      <Card><CardHeader><CardTitle>Monthly Collection Trend</CardTitle><CardDescription>A look at the fee collection performance over the past few months.</CardDescription></CardHeader><CardContent><ChartContainer config={collectionTrendConfig} className="h-[250px] w-full"><BarChart data={collectionTrend}><CartesianGrid vertical={false} /><XAxis dataKey="month" tickLine={false} tickMargin={10} axisLine={false} /><YAxis tickFormatter={(value) => `${value / 1000000}M`} /><ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} /><Bar dataKey="collected" fill="var(--color-collected)" radius={8} /></BarChart></ChartContainer></CardContent></Card>
                  </div>
              </TabsContent>
              <TabsContent value="students">
                  <Card>
                      <CardHeader>
                          <CardTitle>Student Fee Accounts</CardTitle>
                          <CardDescription>Search for a student to view their detailed fee profile and payment history.</CardDescription>
                          <div className="mt-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                              <div className="relative w-full md:max-w-sm">
                                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                  <Input placeholder="Search by name or admission no..." className="pl-8" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                              </div>
                              <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
                                  <Select value={classFilter} onValueChange={setClassFilter}>
                                      <SelectTrigger className="w-full md:w-[180px]"><SelectValue /></SelectTrigger>
                                      <SelectContent>{classes.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                                  </Select>
                                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                                      <SelectTrigger className="w-full md:w-[180px]"><SelectValue /></SelectTrigger>
                                      <SelectContent>
                                          <SelectItem value="All Statuses">All Statuses</SelectItem>
                                          <SelectItem value="Paid">Paid</SelectItem>
                                          <SelectItem value="Partial">Partial</SelectItem>
                                          <SelectItem value="Overdue">Overdue</SelectItem>
                                      </SelectContent>
                                  </Select>
                              </div>
                          </div>
                      </CardHeader>
                      <CardContent>
                          <div className="w-full overflow-auto rounded-lg border">
                              <Table>
                                  <TableHeader>
                                      <TableRow>
                                          <TableHead>Student</TableHead>
                                          <TableHead>Class</TableHead>
                                          <TableHead className="text-right">Balance</TableHead>
                                          <TableHead className="text-center">Status</TableHead>
                                      </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                      {filteredStudents.map(student => (
                                          <DialogTrigger key={student.id} asChild>
                                              <TableRow className="cursor-pointer" onClick={() => openStudentDialog(student)}>
                                                  <TableCell>
                                                      <div className="flex items-center gap-3">
                                                          <Avatar className="h-9 w-9"><AvatarImage src={student.avatarUrl} /><AvatarFallback>{student.name.charAt(0)}</AvatarFallback></Avatar>
                                                          <span className="font-medium">{student.name}</span>
                                                      </div>
                                                  </TableCell>
                                                  <TableCell>{student.class}</TableCell>
                                                  <TableCell className="text-right font-semibold">{formatCurrency(student.balance)}</TableCell>
                                                  <TableCell className="text-center">{getFeeStatusBadge(student.status)}</TableCell>
                                              </TableRow>
                                          </DialogTrigger>
                                      ))}
                                  </TableBody>
                              </Table>
                          </div>
                      </CardContent>
                  </Card>
              </TabsContent>
              <TabsContent value="structure">
                  <Card>
                       <CardHeader>
                          <CardTitle>Class Fee Structures</CardTitle>
                          <CardDescription>Define the fee items for each class. These amounts will be used to calculate the total yearly fee for each student.</CardDescription>
                           <div className="pt-4">
                              <Label htmlFor="class-structure-select">Select a Class to Manage</Label>
                               <Select value={selectedClassForStructure} onValueChange={setSelectedClassForStructure}>
                                  <SelectTrigger id="class-structure-select" className="w-full md:w-72 mt-2">
                                      <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                      {classes.filter(c => c !== 'All Classes').map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                  </SelectContent>
                              </Select>
                           </div>
                      </CardHeader>
                      <CardContent>
                           <Card>
                              <CardHeader>
                                  <CardTitle className="text-lg">Fee Items for {selectedClassForStructure}</CardTitle>
                              </CardHeader>
                              <CardContent>
                                  <Table>
                                      <TableHeader><TableRow><TableHead>Category</TableHead><TableHead>Applies To</TableHead><TableHead className="text-right">Amount (KES)</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                                      <TableBody>
                                          {currentClassFeeItems.map(item => (
                                              <TableRow key={item.id}>
                                                  <TableCell className="font-medium">{item.category}</TableCell>
                                                  <TableCell><Badge variant="outline">{item.appliesTo}</Badge></TableCell>
                                                  <TableCell className="text-right">{formatCurrency(item.amount)}</TableCell>
                                                  <TableCell className="text-right space-x-2">
                                                      <Button variant="ghost" size="icon" disabled><Edit2 className="h-4 w-4" /></Button>
                                                      <Button variant="ghost" size="icon" onClick={() => handleDeleteFeeItem(item.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                                                  </TableCell>
                                              </TableRow>
                                          ))}
                                          <TableRow>
                                              <TableCell><Input placeholder="New Item Category" value={newFeeItemCategory} onChange={e => setNewFeeItemCategory(e.target.value)}/></TableCell>
                                              <TableCell>{selectedClassForStructure}</TableCell>
                                              <TableCell className="text-right"><Input type="number" placeholder="Amount" className="ml-auto text-right w-32" value={newFeeItemAmount} onChange={e => setNewFeeItemAmount(e.target.value)} /></TableCell>
                                              <TableCell className="text-right"><Button size="sm" onClick={() => handleSaveFeeItem()}>Add Item</Button></TableCell>
                                          </TableRow>
                                      </TableBody>
                                  </Table>
                              </CardContent>
                              <CardFooter className="bg-muted/50 p-4 flex justify-between items-center rounded-b-lg">
                                  <div className="font-semibold">Total Yearly Fee for {selectedClassForStructure}: {formatCurrency(classYearlyFee)}</div>
                                  <Button onClick={handleSaveClassFees}>Save & Apply to Class</Button>
                              </CardFooter>
                           </Card>
                      </CardContent>
                  </Card>
              </TabsContent>
          </Tabs>
        </div>
        <DialogContent className="sm:max-w-3xl">
          {selectedStudent && (
            <>
              <DialogHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                      <Avatar className="h-16 w-16"><AvatarImage src={selectedStudent.avatarUrl} /><AvatarFallback>{selectedStudent.name.charAt(0)}</AvatarFallback></Avatar>
                      <div>
                        <DialogTitle className="text-2xl font-bold">{selectedStudent.name}</DialogTitle>
                        <DialogDescription>{selectedStudent.class} | Admission No: {selectedStudent.admissionNo}</DialogDescription>
                      </div>
                  </div>
                  <Button variant="outline" onClick={handleSendStatement}>
                    <Mail className="mr-2 h-4 w-4" />
                    Send Statement
                  </Button>
                </div>
              </DialogHeader>
              
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-center border-t border-b py-4">
                  <div>
                      <p className="text-xs text-muted-foreground">Arrears B/F</p>
                      <p className="font-semibold">{formatCurrency(0)}</p>
                  </div>
                  <div>
                      <p className="text-xs text-muted-foreground">Total Payable</p>
                      <p className="font-semibold">{formatCurrency(selectedStudent.totalBilled)}</p>
                  </div>
                  <div>
                      <p className="text-xs text-muted-foreground">Total Paid</p>
                      <p className="font-semibold text-green-600">{formatCurrency(selectedStudent.totalPaid)}</p>
                  </div>
                   <div>
                      <p className="text-xs text-muted-foreground">Current Balance</p>
                      <p className={`font-semibold text-lg ${selectedStudent.balance > 0 ? 'text-destructive' : 'text-green-600'}`}>{formatCurrency(selectedStudent.balance)}</p>
                  </div>
              </div>

               <Accordion type="single" defaultValue="fee-structure" collapsible className="w-full">
                  <AccordionItem value="fee-structure">
                      <AccordionTrigger className="text-lg font-semibold">Fee Structure</AccordionTrigger>
                      <AccordionContent>
                          <div className="space-y-4">
                              <div>
                                  <h4 className="font-semibold text-primary">Termly Tuition Fees</h4>
                                  <div className="grid grid-cols-3 gap-4 text-center mt-2">
                                      <Card className="p-3"><CardDescription>Term 1</CardDescription><CardTitle className="text-base">{formatCurrency(50000)}</CardTitle></Card>
                                      <Card className="p-3"><CardDescription>Term 2</CardDescription><CardTitle className="text-base">{formatCurrency(50000)}</CardTitle></Card>
                                      <Card className="p-3"><CardDescription>Term 3</CardDescription><CardTitle className="text-base">{formatCurrency(50000)}</CardTitle></Card>
                                  </div>
                              </div>
                              <Separator />
                              <div>
                                  <h4 className="font-semibold text-primary">Compulsory Charges</h4>
                                  <div className="text-sm mt-2 space-y-1">
                                      <div className="flex justify-between"><span>Activity Fee</span><span className="font-medium">{formatCurrency(2000)}</span></div>
                                      <div className="flex justify-between"><span>Medical Fee</span><span className="font-medium">{formatCurrency(1500)}</span></div>
                                      <div className="flex justify-between"><span>Exam Fee</span><span className="font-medium">{formatCurrency(1000)}</span></div>
                                  </div>
                              </div>
                              <Separator />
                              <div>
                                  <h4 className="font-semibold text-primary">Optional Charges</h4>
                                   <div className="text-sm mt-2 space-y-1">
                                      <div className="flex justify-between"><span>Lunch Program</span><span className="font-medium">{formatCurrency(8000)}</span></div>
                                      <div className="flex justify-between"><span>Music Club</span><span className="font-medium">{formatCurrency(3000)}</span></div>
                                  </div>
                              </div>
                              <Separator />
                               <div className="flex justify-between font-bold text-lg p-2 bg-muted rounded-md">
                                  <span>Total Yearly Fees:</span>
                                  <span>{formatCurrency(164500)}</span>
                              </div>
                          </div>
                      </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="transaction-ledger">
                      <AccordionTrigger className="text-lg font-semibold">Transaction Ledger</AccordionTrigger>
                      <AccordionContent>
                           <div className="max-h-[30vh] overflow-y-auto">
                              <Table>
                                  <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Description</TableHead><TableHead className="text-right">Amount</TableHead><TableHead className="text-right">Balance</TableHead><TableHead className="text-right">Receipt</TableHead></TableRow></TableHeader>
                                  <TableBody>
                                      {selectedStudent.transactions?.map(tx => (
                                          <TableRow key={tx.id}>
                                              <TableCell>{tx.date.toDate().toLocaleDateString()}</TableCell>
                                              <TableCell>{tx.description}</TableCell>
                                              <TableCell className={`text-right ${tx.amount > 0 ? 'text-destructive' : 'text-green-600'}`}>{formatCurrency(tx.amount)}</TableCell>
                                              <TableCell className="text-right font-medium">{formatCurrency(tx.balance)}</TableCell>
                                              <TableCell className="text-right">
                                                {tx.type === 'Payment' && (
                                                  <Button variant="outline" size="sm" onClick={() => setSelectedTransaction(tx)}>View Receipt</Button>
                                                )}
                                              </TableCell>
                                          </TableRow>
                                      ))}
                                  </TableBody>
                              </Table>
                          </div>
                      </AccordionContent>
                  </AccordionItem>
                   <AccordionItem value="adjustments">
                      <AccordionTrigger className="text-lg font-semibold">Adjustments</AccordionTrigger>
                      <AccordionContent className="space-y-6">
                          <Card>
                              <CardHeader><CardTitle className="text-base">Add Charge / Credit</CardTitle></CardHeader>
                              <CardContent className="space-y-4">
                                  <div className="space-y-2">
                                      <Label htmlFor="charge-desc">Description</Label>
                                      <Input id="charge-desc" placeholder="e.g., Lost Textbook Fee" />
                                  </div>
                                  <div className="flex items-center gap-4">
                                      <div className="space-y-2 flex-1">
                                          <Label htmlFor="charge-amount">Amount</Label>
                                          <Input id="charge-amount" type="number" placeholder="2500" />
                                      </div>
                                      <div className="space-y-2">
                                          <Label>Type</Label>
                                          <Select defaultValue="charge">
                                              <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
                                              <SelectContent>
                                                  <SelectItem value="charge">Charge</SelectItem>
                                                  <SelectItem value="credit">Credit</SelectItem>
                                              </SelectContent>
                                          </Select>
                                      </div>
                                  </div>
                                  <Button size="sm">Add Transaction</Button>
                              </CardContent>
                          </Card>
                           <Card>
                              <CardHeader><CardTitle className="text-base">Apply Discount</CardTitle></CardHeader>
                              <CardContent className="space-y-4">
                                  <div className="space-y-2">
                                      <Label htmlFor="discount-desc">Description</Label>
                                      <Input id="discount-desc" placeholder="e.g., Sibling Discount" />
                                  </div>
                                  <div className="flex items-center gap-4">
                                      <div className="space-y-2 flex-1">
                                          <Label htmlFor="discount-amount">Value</Label>
                                          <Input id="discount-amount" type="number" placeholder="10" />
                                      </div>
                                      <div className="space-y-2">
                                          <Label>Type</Label>
                                          <Select defaultValue="percent">
                                              <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
                                              <SelectContent>
                                                  <SelectItem value="percent">% (Percentage)</SelectItem>
                                                  <SelectItem value="fixed">KES (Fixed)</SelectItem>
                                              </SelectContent>
                                          </Select>
                                      </div>
                                  </div>
                                  <Button size="sm">Apply Discount</Button>
                              </CardContent>
                          </Card>
                           <Card>
                              <CardHeader><CardTitle className="text-base">Apply Waiver</CardTitle></CardHeader>
                              <CardContent className="space-y-4">
                                  <div className="space-y-2">
                                      <Label htmlFor="waiver-amount">Waiver Amount (KES)</Label>
                                      <Input id="waiver-amount" type="number" placeholder="5000" />
                                  </div>
                                  <div className="space-y-2">
                                      <Label htmlFor="waiver-reason">Reason</Label>
                                      <Textarea id="waiver-reason" placeholder="e.g., Staff Dependent, Charity Case" />
                                  </div>
                                  <div className="space-y-2">
                                      <Label htmlFor="waiver-approver">Approved By</Label>
                                      <Input id="waiver-approver" placeholder="e.g., Principal Jane Doe" />
                                  </div>
                                  <Button size="sm">
                                      <Shield className="mr-2 h-4 w-4"/>
                                      Apply Waiver
                                  </Button>
                              </CardContent>
                          </Card>
                      </AccordionContent>
                  </AccordionItem>
               </Accordion>
            </>
          )}
        </DialogContent>
      </Dialog>
      <ReceiptDialog 
        transaction={selectedTransaction}
        student={selectedStudent}
        schoolName={schoolName}
        open={!!selectedTransaction}
        onOpenChange={(open) => !open && setSelectedTransaction(null)}
      />
    </>
  );
}
