

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
    DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CircleDollarSign, Search, Filter, ChevronDown, Percent, FileDown, Receipt, Send, PlusCircle, Edit, Trash2, Tag, HandHelping, FileText, Bell } from 'lucide-react';
import { BarChart, Bar, CartesianGrid, XAxis, YAxis } from 'recharts';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { firestore } from '@/lib/firebase';
import { collection, query, onSnapshot, addDoc, doc, deleteDoc, updateDoc, writeBatch } from 'firebase/firestore';
import { Timestamp } from 'firebase/firestore';
import jsPDF from 'jspdf';
import 'jspdf-autotable';


type PaymentStatus = 'Paid' | 'Partial' | 'Unpaid' | 'Overdue';

type StudentFee = {
    id: string;
    name: string;
    avatarUrl: string;
    class: string;
    feeStatus: PaymentStatus;
    totalFee: number;
    amountPaid: number;
    balance: number;
};

type FeeStructureItem = {
    id: string;
    category: string;
    appliesTo: string;
    amount: number;
};

type DiscountItem = {
    id: string;
    name: string;
    type: 'Percentage' | 'Fixed';
    value: string;
    appliesTo: string;
};

type Transaction = {
    id: string;
    date: string | Timestamp;
    description: string;
    type: 'Charge' | 'Payment' | 'Waiver' | 'Refund';
    amount: number;
    balance: number;
    recordedBy: string;
};

const classes = ['All Classes', 'Form 4', 'Form 3', 'Form 2', 'Form 1'];
const statuses: (PaymentStatus | 'All Statuses')[] = ['All Statuses', 'Paid', 'Partial', 'Unpaid', 'Overdue'];

const getStatusBadge = (status: PaymentStatus) => {
    switch (status) {
        case 'Paid': return <Badge variant="default" className="bg-green-600 hover:bg-green-700">Paid</Badge>;
        case 'Partial': return <Badge variant="secondary" className="bg-blue-500 text-white hover:bg-blue-600">Partial</Badge>;
        case 'Unpaid': return <Badge variant="secondary" className="bg-gray-500 text-white hover:bg-gray-600">Unpaid</Badge>;
        case 'Overdue': return <Badge variant="destructive">Overdue</Badge>;
    }
}

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', minimumFractionDigits: 0 }).format(amount);
};

const collectionData = [
  { name: 'F4', collected: 85, total: 100 },
  { name: 'F3', collected: 70, total: 100 },
  { name: 'F2', collected: 92, total: 100 },
  { name: 'F1', collected: 65, total: 100 },
];

const chartConfig = {
  collected: { label: 'Collected', color: 'hsl(var(--primary))' },
} satisfies React.ComponentProps<typeof ChartContainer>['config'];

type TransactionType = 'payment' | 'charge' | 'waiver' | 'refund';

function NewTransactionDialog({ students }: { students: StudentFee[] }) {
    const { toast } = useToast();
    const [transactionType, setTransactionType] = React.useState<TransactionType>('payment');
    const [date, setDate] = React.useState<Date | undefined>(new Date());
    const [studentId, setStudentId] = React.useState<string | undefined>();
    const [amount, setAmount] = React.useState('');
    const [description, setDescription] = React.useState('');

    const handleSaveTransaction = async () => {
        if (!studentId || !amount || !description) {
            toast({ title: 'Missing Information', description: 'Please fill out all required fields.', variant: 'destructive' });
            return;
        }

        const isCredit = transactionType === 'payment' || transactionType === 'waiver';
        const isDebit = transactionType === 'charge' || transactionType === 'refund';

        const transactionTypeLabels: Record<TransactionType, Transaction['type']> = {
            payment: 'Payment',
            charge: 'Charge',
            waiver: 'Waiver',
            refund: 'Refund',
        };

        const transactionData = {
            date: Timestamp.fromDate(date || new Date()),
            description,
            type: transactionTypeLabels[transactionType],
            amount: 0,
            recordedBy: 'Admin User', // In real app, get current user
        };

        try {
            const studentRef = doc(firestore, 'students', studentId);
            const studentDoc = students.find(s => s.id === studentId);
            if (!studentDoc) throw new Error("Student not found");

            let newBalance = studentDoc.balance;
            let newAmountPaid = studentDoc.amountPaid;
            const transactionAmount = Number(amount);

            if (transactionType === 'waiver' || transactionType === 'payment') {
                newBalance -= transactionAmount;
                 if(transactionType === 'payment') {
                    newAmountPaid += transactionAmount;
                }
                transactionData.amount = -transactionAmount;
            }
            if (transactionType === 'charge' || transactionType === 'refund') {
                newBalance += transactionAmount;
                transactionData.amount = transactionAmount;
            }

            await addDoc(collection(firestore, `students/${studentId}/transactions`), transactionData);

            await updateDoc(studentRef, {
                balance: newBalance,
                amountPaid: newAmountPaid,
                feeStatus: newBalance <= 0 ? 'Paid' : 'Partial'
            });

            toast({
                title: 'Transaction Recorded',
                description: `A new ${transactionType} of ${formatCurrency(Number(amount))} for the selected student has been saved.`,
            });
            
            setStudentId(undefined);
            setAmount('');
            setDescription('');

        } catch (error) {
            console.error('Error saving transaction:', error);
            toast({ title: 'Error', description: 'Could not save the transaction.', variant: 'destructive' });
        }
    };

    return (
         <DialogContent className="sm:max-w-xl">
            <DialogHeader>
                <DialogTitle>New Manual Transaction</DialogTitle>
                <DialogDescription>Record a payment, add a manual charge, or apply a credit/waiver for a student.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-6 py-4">
                <div className="space-y-2">
                    <Label htmlFor="student-select">Student</Label>
                    <Select value={studentId} onValueChange={setStudentId}>
                        <SelectTrigger id="student-select">
                            <SelectValue placeholder="Select a student" />
                        </SelectTrigger>
                        <SelectContent>
                            {students.map(student => (
                                <SelectItem key={student.id} value={student.id}>{student.name} ({student.class})</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="transaction-type">Transaction Type</Label>
                    <Select value={transactionType} onValueChange={(v: TransactionType) => setTransactionType(v)}>
                        <SelectTrigger id="transaction-type">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="payment">Record Payment</SelectItem>
                            <SelectItem value="charge">Add Manual Charge</SelectItem>
                            <SelectItem value="waiver">Apply Credit / Waiver</SelectItem>
                            <SelectItem value="refund">Process Refund</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <Separator />
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="transaction-amount">Amount (KES)</Label>
                        <Input id="transaction-amount" type="number" placeholder="e.g., 10000" value={amount} onChange={e => setAmount(e.target.value)} />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="transaction-date">Transaction Date</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                            <Button
                                variant={"outline"}
                                className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {date ? format(date, "PPP") : <span>Pick a date</span>}
                            </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
                            </PopoverContent>
                        </Popover>
                    </div>
                </div>
                {transactionType === 'payment' && (
                    <div className='space-y-4'>
                        <div className="space-y-2">
                            <Label htmlFor="payment-method">Payment Method</Label>
                            <Select>
                                <SelectTrigger id="payment-method">
                                    <SelectValue placeholder="Select a payment method" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="mpesa">M-PESA</SelectItem>
                                    <SelectItem value="bank">Bank Transfer</SelectItem>
                                    <SelectItem value="cash">Cash</SelectItem>
                                    <SelectItem value="cheque">Cheque</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex items-center space-x-2 pt-2">
                            <Switch id="notify-parent" defaultChecked />
                            <Label htmlFor="notify-parent">Notify parent/guardian of this payment</Label>
                        </div>
                    </div>
                )}
                 <div className="space-y-2">
                    <Label htmlFor="transaction-description">Description / Notes</Label>
                    <Textarea id="transaction-description" placeholder="e.g., 'Term 2 Fee Payment', 'Charge for lost textbook'" value={description} onChange={e => setDescription(e.target.value)} />
                </div>
            </div>
            <DialogFooter>
                <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                <DialogClose asChild>
                    <Button onClick={handleSaveTransaction}>Save Transaction</Button>
                </DialogClose>
            </DialogFooter>
        </DialogContent>
    )
}

function StudentLedgerDialog({ student, open, onOpenChange }: { student: StudentFee | null, open: boolean, onOpenChange: (open: boolean) => void }) {
    const [ledger, setLedger] = React.useState<Transaction[]>([]);

    React.useEffect(() => {
        if (student) {
            const q = query(collection(firestore, `students/${student.id}/transactions`));
            const unsubscribe = onSnapshot(q, (snapshot) => {
                const transactions = snapshot.docs.map(doc => {
                    const data = doc.data();
                    return {
                        id: doc.id,
                        ...data,
                        date: (data.date as Timestamp).toDate().toLocaleDateString('en-GB'),
                    } as Transaction;
                });

                let runningBalance = student.totalFee;
                 const calculatedLedger = transactions
                    .sort((a, b) => new Date(a.date as string).getTime() - new Date(b.date as string).getTime())
                    .map(t => {
                        runningBalance += t.amount;
                        return { ...t, balance: runningBalance };
                    });

                setLedger(calculatedLedger.reverse());
            });
            return () => unsubscribe();
        }
    }, [student]);

    if (!student) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-3xl">
                <DialogHeader>
                    <DialogTitle>Student Ledger: {student.name}</DialogTitle>
                    <DialogDescription>A detailed transaction history for {student.name} ({student.class}).</DialogDescription>
                </DialogHeader>
                <div className="py-4">
                    <Card className="mb-6 bg-muted/50">
                        <CardHeader>
                            <CardTitle className="text-base">Financial Summary</CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-3 gap-4 text-center">
                            <div>
                                <p className="text-sm text-muted-foreground">Total Billed</p>
                                <p className="font-bold text-lg">{formatCurrency(student.totalFee)}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Total Paid</p>
                                <p className="font-bold text-lg text-green-600">{formatCurrency(student.amountPaid)}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Outstanding Balance</p>
                                <p className="font-bold text-lg text-destructive">{formatCurrency(student.balance)}</p>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="w-full overflow-auto rounded-lg border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Description</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Recorded By</TableHead>
                                    <TableHead className="text-right">Amount</TableHead>
                                    <TableHead className="text-right">Balance</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {ledger.map((item) => (
                                    <TableRow key={item.id}>
                                        <TableCell>{String(item.date)}</TableCell>
                                        <TableCell className="font-medium">{item.description}</TableCell>
                                        <TableCell>
                                            <Badge variant={item.type === 'Payment' ? 'default' : 'outline'} className={item.type === 'Payment' ? 'bg-green-100 text-green-800' : ''}>
                                                {item.type}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>{item.recordedBy}</TableCell>
                                        <TableCell className={`text-right ${item.amount < 0 ? 'text-green-600' : 'text-destructive'}`}>
                                            {formatCurrency(item.amount)}
                                        </TableCell>
                                        <TableCell className="text-right font-semibold">{formatCurrency(item.balance)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline"><FileDown className="mr-2 h-4 w-4" />Export Statement (PDF)</Button>
                    <DialogClose asChild><Button>Close</Button></DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

function EditCategoryDialog({ category, open, onOpenChange, onSave }: { category: FeeStructureItem | null, open: boolean, onOpenChange: (open: boolean) => void, onSave: (data: Partial<FeeStructureItem>) => void }) {
    const [amount, setAmount] = React.useState(0);

    React.useEffect(() => {
        if (category) {
            setAmount(category.amount);
        }
    }, [category]);

    if (!category) return null;

    const handleSave = () => {
        onSave({ amount });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Edit Fee Category: {category.category}</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="amount">Amount (KES)</Label>
                        <Input id="amount" type="number" value={amount} onChange={(e) => setAmount(Number(e.target.value))} />
                    </div>
                </div>
                <DialogFooter>
                    <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                    <DialogClose asChild><Button onClick={handleSave}>Save Changes</Button></DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function EditDiscountDialog({ discount, open, onOpenChange, onSave }: { discount: DiscountItem | null, open: boolean, onOpenChange: (open: boolean) => void, onSave: (data: Partial<DiscountItem>) => void }) {
    const [value, setValue] = React.useState('');

    React.useEffect(() => {
        if (discount) {
            setValue(discount.value);
        }
    }, [discount]);

    if (!discount) return null;

    const handleSave = () => {
        onSave({ value });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Edit Discount: {discount.name}</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="value">Value ({discount.type === 'Percentage' ? '%' : 'KES'})</Label>
                        <Input id="value" value={value} onChange={(e) => setValue(e.target.value)} />
                    </div>
                </div>
                <DialogFooter>
                    <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                    <DialogClose asChild><Button onClick={handleSave}>Save Changes</Button></DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}


export default function FeesPage() {
    const [students, setStudents] = React.useState<StudentFee[]>([]);
    const [feeStructure, setFeeStructure] = React.useState<FeeStructureItem[]>([]);
    const [discounts, setDiscounts] = React.useState<DiscountItem[]>([]);
    const [searchTerm, setSearchTerm] = React.useState('');
    const [classFilter, setClassFilter] = React.useState('All Classes');
    const [statusFilter, setStatusFilter] = React.useState<PaymentStatus | 'All Statuses'>('All Statuses');
    const [selectedStudent, setSelectedStudent] = React.useState<StudentFee | null>(null);
    const { toast } = useToast();
    const [invoiceTerm, setInvoiceTerm] = React.useState('term2-2024');
    const [invoiceClass, setInvoiceClass] = React.useState('all');
    const [editingCategory, setEditingCategory] = React.useState<FeeStructureItem | null>(null);
    const [editingDiscount, setEditingDiscount] = React.useState<DiscountItem | null>(null);


    React.useEffect(() => {
        const q = query(collection(firestore, 'students'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setStudents(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as StudentFee)));
        });
        return () => unsubscribe();
    }, []);

    React.useEffect(() => {
        const q = query(collection(firestore, 'feeStructure'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setFeeStructure(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FeeStructureItem)));
        });
        return () => unsubscribe();
    }, []);

    React.useEffect(() => {
        const q = query(collection(firestore, 'discounts'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setDiscounts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DiscountItem)));
        });
        return () => unsubscribe();
    }, []);


    const filteredStudents = students.filter(student => {
        const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesClass = classFilter === 'All Classes' || student.class === classFilter;
        const matchesStatus = statusFilter === 'All Statuses' || student.feeStatus === statusFilter;
        return matchesSearch && matchesClass && matchesStatus;
    });
    
    const sendReminders = (type: 'all' | 'overdue') => {
        const studentsToRemind = filteredStudents.filter(s => {
            if (s.balance <= 0) return false;
            if (type === 'overdue') {
                // This is a placeholder for a real due date check
                return s.feeStatus === 'Overdue';
            }
            return true;
        });

        if (studentsToRemind.length === 0) {
            toast({
                title: 'No Reminders Sent',
                description: `No students with ${type === 'overdue' ? 'overdue' : 'outstanding'} balances found in the current view.`,
            });
            return;
        }

        toast({
            title: 'Reminders Sent (Simulation)',
            description: `Fee reminders would be sent to ${studentsToRemind.length} parent(s).`,
        });
    };
    
    const generateInvoices = async () => {
        toast({
            title: 'Generating Invoices...',
            description: 'This may take a moment. Please do not close this window.',
        });

        const studentsToInvoice = students.filter(s => invoiceClass === 'all' || s.class === invoiceClass);
        const standardFee = feeStructure.reduce((total, item) => total + item.amount, 0);

        try {
            const batch = writeBatch(firestore);
            
            for (const student of studentsToInvoice) {
                const transactionData = {
                    date: Timestamp.fromDate(new Date()),
                    description: `Invoice for ${invoiceTerm.replace('-', ', ')}`,
                    type: 'Charge' as const,
                    amount: standardFee,
                    recordedBy: 'Admin (Bulk)',
                };

                const transactionRef = doc(collection(firestore, `students/${student.id}/transactions`));
                batch.set(transactionRef, transactionData);

                const studentRef = doc(firestore, 'students', student.id);
                const newTotalFee = (student.totalFee || 0) + standardFee;
                const newBalance = (student.balance || 0) + standardFee;
                batch.update(studentRef, { totalFee: newTotalFee, balance: newBalance });
            }

            await batch.commit();

            toast({
                title: 'Invoices Generated Successfully!',
                description: `New invoices have been created for ${studentsToInvoice.length} students.`,
            });
        } catch (error) {
            console.error('Error generating invoices:', error);
            toast({
                variant: 'destructive',
                title: 'Invoice Generation Failed',
                description: 'An error occurred while creating invoices.',
            });
        }
    };
    
    const handleSaveCategory = async (categoryData: Omit<FeeStructureItem, 'id'>) => {
        try {
            await addDoc(collection(firestore, 'feeStructure'), categoryData);
            toast({
                title: 'Fee Category Saved',
                description: 'The new fee category has been added to the fee structure.',
            });
        } catch (error) {
            console.error("Error saving category:", error);
            toast({ title: "Error", description: "Failed to save new category.", variant: "destructive" });
        }
    };

    const handleSaveDiscount = async (discountData: Omit<DiscountItem, 'id'>) => {
        try {
            await addDoc(collection(firestore, 'discounts'), discountData);
            toast({
                title: 'Discount Saved',
                description: 'The new discount has been added and can be applied to student accounts.',
            });
        } catch (error) {
            console.error("Error saving discount:", error);
            toast({ title: "Error", description: "Failed to save new discount.", variant: "destructive" });
        }
    };

    const handleUpdateCategory = async (data: Partial<FeeStructureItem>) => {
        if (!editingCategory) return;
        try {
            const categoryRef = doc(firestore, 'feeStructure', editingCategory.id);
            await updateDoc(categoryRef, data);
            toast({ title: "Category Updated", description: "The fee category has been successfully updated." });
            setEditingCategory(null);
        } catch (error) {
            console.error("Error updating category:", error);
            toast({ title: "Error", description: "Failed to update fee category.", variant: "destructive" });
        }
    };
    
    const handleUpdateDiscount = async (data: Partial<DiscountItem>) => {
        if (!editingDiscount) return;
        try {
            const discountRef = doc(firestore, 'discounts', editingDiscount.id);
            await updateDoc(discountRef, data);
            toast({ title: "Discount Updated", description: "The discount has been successfully updated." });
            setEditingDiscount(null);
        } catch (error) {
            console.error("Error updating discount:", error);
            toast({ title: "Error", description: "Failed to update discount.", variant: "destructive" });
        }
    };

    const handleDeleteItem = async (collectionName: string, id: string, name: string) => {
        if (window.confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) {
            try {
                await deleteDoc(doc(firestore, collectionName, id));
                toast({
                    title: 'Item Deleted',
                    description: `"${name}" has been removed.`,
                    variant: 'destructive',
                });
            } catch (error) {
                console.error("Error deleting item:", error);
                toast({ title: "Error", description: "Failed to delete item.", variant: "destructive" });
            }
        }
    };

    const handleExport = (type: 'PDF' | 'CSV') => {
        if (type === 'CSV') {
            const headers = ['Student Name', 'Class', 'Fee Status', 'Total Fee', 'Amount Paid', 'Balance'];
            const rows = filteredStudents.map(student => 
                [
                    `"${student.name}"`,
                    student.class,
                    student.feeStatus,
                    student.totalFee,
                    student.amountPaid,
                    student.balance
                ].join(',')
            );
            const csvContent = [headers.join(','), ...rows].join('\n');
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement("a");
            if (link.download !== undefined) {
                const url = URL.createObjectURL(blob);
                link.setAttribute("href", url);
                link.setAttribute("download", "student-fees-report.csv");
                link.style.visibility = 'hidden';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }
        } else {
             const doc = new jsPDF();
             doc.text("Student Fees Report", 14, 16);
             (doc as any).autoTable({
                startY: 22,
                head: [['Student Name', 'Class', 'Status', 'Total Fee', 'Paid', 'Balance']],
                body: filteredStudents.map(s => [
                    s.name,
                    s.class,
                    s.feeStatus,
                    formatCurrency(s.totalFee),
                    formatCurrency(s.amountPaid),
                    formatCurrency(s.balance)
                ]),
             });
             doc.save('student-fees-report.pdf');
        }
    };

    const studentsWithBalance = filteredStudents.filter(s => s.balance > 0).length;
    const studentsWithOverdue = filteredStudents.filter(s => s.feeStatus === 'Overdue').length;


    return (
        <Dialog>
            <div className="p-4 sm:p-6 lg:p-8">
                <div className="mb-6">
                    <h1 className="font-headline text-3xl font-bold flex items-center gap-2">
                        <CircleDollarSign className="h-8 w-8 text-primary" />
                        Fees &amp; Payments Management
                    </h1>
                    <p className="text-muted-foreground">Track fee collection, manage student balances, and send reminders.</p>
                </div>

                <Tabs defaultValue="dashboard">
                    <TabsList className="mb-6 grid w-full grid-cols-3 md:w-auto md:inline-flex">
                        <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
                        <TabsTrigger value="records">Student Records</TabsTrigger>
                        <TabsTrigger value="structure">Fee Structure</TabsTrigger>
                    </TabsList>
                    <TabsContent value="dashboard" className="space-y-6">
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Total Collected (Term 2)</CardTitle>
                                    <CircleDollarSign className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">KES 8,200,000</div>
                                    <p className="text-xs text-muted-foreground">out of KES 10,000,000</p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Outstanding Balance</CardTitle>
                                    <CircleDollarSign className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">KES 1,800,000</div>
                                    <p className="text-xs text-muted-foreground">across 150 students</p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Overdue Balances</CardTitle>
                                    <CircleDollarSign className="h-4 w-4 text-destructive" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-destructive">KES 540,000</div>
                                    <p className="text-xs text-muted-foreground">from 45 students</p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Collection Rate</CardTitle>
                                    <Percent className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">82%</div>
                                    <p className="text-xs text-muted-foreground">for the current term</p>
                                </CardContent>
                            </Card>
                        </div>
                        
                        <Card>
                            <CardHeader>
                                <CardTitle>Collection by Class</CardTitle>
                                <CardDescription>Percentage of fees collected per form for the current term.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ChartContainer config={chartConfig} className="h-[200px] w-full">
                                    <BarChart data={collectionData} margin={{ top: 20 }}>
                                        <CartesianGrid vertical={false} />
                                        <XAxis dataKey="name" tickLine={false} tickMargin={10} axisLine={false} />
                                        <YAxis tickFormatter={(value) => `${value}%`} />
                                        <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
                                        <Bar dataKey="collected" fill="var(--color-collected)" radius={8} />
                                    </BarChart>
                                </ChartContainer>
                            </CardContent>
                        </Card>
                    </TabsContent>
                    <TabsContent value="structure">
                        <div className="grid gap-6 lg:grid-cols-2">
                            <Card>
                                <CardHeader>
                                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                    <div className="flex-1">
                                        <CardTitle>Fee Structure Management</CardTitle>
                                        <CardDescription>Define and manage fee categories for different classes and terms.</CardDescription>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Select defaultValue="term2-2024">
                                            <SelectTrigger className="w-full md:w-[180px]">
                                                <SelectValue placeholder="Select term" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="term2-2024">Term 2, 2024</SelectItem>
                                                <SelectItem value="term1-2024">Term 1, 2024</SelectItem>
                                                <SelectItem value="annual-2024">Annual 2024</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <Dialog>
                                            <DialogTrigger asChild>
                                            <Button>
                                                <PlusCircle className="mr-2 h-4 w-4"/>
                                                Add Category
                                            </Button>
                                            </DialogTrigger>
                                            <DialogContent className="sm:max-w-lg">
                                            <DialogHeader>
                                                <DialogTitle>Create New Fee Category</DialogTitle>
                                                <DialogDescription>Add a new item to the school's fee structure for a specific term.</DialogDescription>
                                            </DialogHeader>
                                            <div className="grid gap-6 py-4">
                                                {/* Form content here */}
                                            </div>
                                            <DialogFooter>
                                                <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                                                <DialogClose asChild>
                                                    <Button onClick={() => handleSaveCategory({ category: 'New Item', appliesTo: 'All', amount: 0})}>Save Category</Button>
                                                </DialogClose>
                                            </DialogFooter>
                                            </DialogContent>
                                        </Dialog>
                                    </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="w-full overflow-auto rounded-lg border">
                                    <Table>
                                        <TableHeader>
                                        <TableRow>
                                            <TableHead>Category Name</TableHead>
                                            <TableHead>Applies To</TableHead>
                                            <TableHead className="text-right">Amount (KES)</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                        {feeStructure.map(item => (
                                            <TableRow key={item.id}>
                                            <TableCell className="font-medium">{item.category}</TableCell>
                                            <TableCell><Badge variant="outline">{item.appliesTo}</Badge></TableCell>
                                            <TableCell className="text-right">{formatCurrency(item.amount)}</TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="icon" onClick={() => setEditingCategory(item)}>
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDeleteItem('feeStructure', item.id, item.category)}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                            </TableRow>
                                        ))}
                                        </TableBody>
                                    </Table>
                                    </div>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader>
                                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                        <div className="flex-1">
                                            <CardTitle className="flex items-center gap-2"><HandHelping className="h-5 w-5 text-primary"/>Discounts &amp; Scholarships</CardTitle>
                                            <CardDescription>Manage financial aid, discounts, and scholarships.</CardDescription>
                                        </div>
                                        <Dialog>
                                            <DialogTrigger asChild>
                                                <Button>
                                                    <PlusCircle className="mr-2 h-4 w-4"/>
                                                    Add Discount
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent>
                                                <DialogHeader>
                                                    <DialogTitle>Create New Discount/Scholarship</DialogTitle>
                                                    <DialogDescription>Define a new financial aid type to be applied to student fees.</DialogDescription>
                                                </DialogHeader>
                                                <div className="grid gap-6 py-4">
                                                    {/* Form content here */}
                                                </div>
                                                <DialogFooter>
                                                    <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                                                    <DialogClose asChild>
                                                        <Button onClick={() => handleSaveDiscount({ name: 'New Discount', type: 'Fixed', value: '0', appliesTo: 'All' })}>Save Discount</Button>
                                                    </DialogClose>
                                                </DialogFooter>
                                            </DialogContent>
                                        </Dialog>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="w-full overflow-auto rounded-lg border">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Discount Name</TableHead>
                                                    <TableHead>Type</TableHead>
                                                    <TableHead>Value</TableHead>
                                                    <TableHead className="text-right">Actions</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {discounts.map(item => (
                                                    <TableRow key={item.id}>
                                                        <TableCell className="font-medium">{item.name}</TableCell>
                                                        <TableCell><Badge variant="outline">{item.type}</Badge></TableCell>
                                                        <TableCell>{item.value}</TableCell>
                                                        <TableCell className="text-right">
                                                            <Button variant="ghost" size="icon" onClick={() => setEditingDiscount(item)}>
                                                                <Edit className="h-4 w-4" />
                                                            </Button>
                                                            <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDeleteItem('discounts', item.id, item.name)}>
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-4">For sponsor tracking, please use the upcoming "Sponsorships" module.</p>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>
                    <TabsContent value="records">
                        <Card>
                            <CardHeader>
                                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                    <div>
                                        <CardTitle>Student Payment Records</CardTitle>
                                        <CardDescription>A detailed list of fee payments for all students. Student clearance status is updated automatically when fees are fully paid.</CardDescription>
                                    </div>
                                    <div className="flex w-full flex-col gap-2 md:w-auto md:flex-row">
                                        <Dialog>
                                            <DialogTrigger asChild>
                                                <Button>
                                                    <PlusCircle className="mr-2 h-4 w-4"/>
                                                    New Transaction
                                                </Button>
                                            </DialogTrigger>
                                            <NewTransactionDialog students={students}/>
                                        </Dialog>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="secondary">
                                                    Bulk Actions
                                                    <ChevronDown className="ml-2 h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent>
                                                <DialogTrigger asChild>
                                                    <DropdownMenuItem>
                                                        <Receipt className="mr-2"/>Generate Bulk Invoices
                                                    </DropdownMenuItem>
                                                </DialogTrigger>
                                                <DialogTrigger asChild>
                                                    <DropdownMenuItem>
                                                        <Send className="mr-2"/>Send Reminders
                                                    </DropdownMenuItem>
                                                </DialogTrigger>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem onClick={() => handleExport('PDF')}><FileDown className="mr-2"/>Export Report (PDF)</DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleExport('CSV')}><FileText className="mr-2"/>Export as CSV</DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </div>
                                <div className="mt-4 flex flex-col gap-4 md:flex-row md:items-center">
                                    <div className="relative w-full md:max-w-sm">
                                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                        type="search"
                                        placeholder="Search by student name..."
                                        className="w-full bg-background pl-8"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        />
                                    </div>
                                    <div className="flex w-full flex-col gap-2 md:w-auto md:flex-row md:items-center">
                                        <Select value={classFilter} onValueChange={setClassFilter}>
                                            <SelectTrigger className="w-full md:w-[180px]">
                                                <SelectValue placeholder="Filter by class" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {classes.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                        <Select value={statusFilter} onValueChange={(v: PaymentStatus | 'All Statuses') => setStatusFilter(v)}>
                                            <SelectTrigger className="w-full md:w-[180px]">
                                                <SelectValue placeholder="Filter by status" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {statuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
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
                                                <TableHead>Status</TableHead>
                                                <TableHead className="text-right">Total Fee</TableHead>
                                                <TableHead className="text-right">Amount Paid</TableHead>
                                                <TableHead className="text-right">Balance</TableHead>
                                                <TableHead className="text-right">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {filteredStudents.map(student => (
                                                <TableRow key={student.id}>
                                                    <TableCell>
                                                        <div className="flex items-center gap-3">
                                                            <Avatar>
                                                                <AvatarImage src={student.avatarUrl} alt={student.name} />
                                                                <AvatarFallback>{student.name.charAt(0)}</AvatarFallback>
                                                            </Avatar>
                                                            <span className="font-medium">{student.name}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>{student.class}</TableCell>
                                                    <TableCell>{getStatusBadge(student.feeStatus)}</TableCell>
                                                    <TableCell className="text-right">{formatCurrency(student.totalFee)}</TableCell>
                                                    <TableCell className="text-right">{formatCurrency(student.amountPaid)}</TableCell>
                                                    <TableCell className={`text-right font-semibold ${student.balance > 0 ? 'text-destructive' : ''}`}>{formatCurrency(student.balance)}</TableCell>
                                                    <TableCell className="text-right">
                                                        <DialogTrigger asChild>
                                                            <Button variant="ghost" size="sm" onClick={() => setSelectedStudent(student)}>View Details</Button>
                                                        </DialogTrigger>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                            {filteredStudents.length === 0 && (
                                                <TableRow>
                                                    <TableCell colSpan={7} className="h-24 text-center">
                                                        No students found for the selected filters.
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                            <CardFooter>
                                <div className="text-xs text-muted-foreground">
                                    Showing <strong>{filteredStudents.length}</strong> of <strong>{students.length}</strong> records.
                                </div>
                            </CardFooter>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
            {/* Dialogs for bulk actions */}
            <DialogContent>
                 {/* This seems to be a shared dialog content, let's check which trigger opens it.
                     It seems both "Generate Bulk Invoices" and "Send Reminders" might trigger this.
                     Let's make separate dialogs for them to be cleaner.
                     I'll assume the default content here is for Invoices.
                 */}
                 <DialogHeader>
                    <DialogTitle>Bulk Actions</DialogTitle>
                    <DialogDescription>
                        Perform actions for multiple students at once. Please review carefully before proceeding.
                    </DialogDescription>
                </DialogHeader>

                {/* This is a generic container. I will create specific dialogs for each action */}
                
            </DialogContent>

             <Dialog>
                <DialogContent>
                     <DialogHeader>
                        <DialogTitle>Generate Bulk Invoices</DialogTitle>
                        <DialogDescription>
                            This will create new invoices for all students based on their class and the current fee structure for the selected term.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 grid gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="invoice-term">Select Term</Label>
                            <Select value={invoiceTerm} onValueChange={setInvoiceTerm}>
                                <SelectTrigger id="invoice-term">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="term2-2024">Term 2, 2024</SelectItem>
                                    <SelectItem value="term3-2024">Term 3, 2024 (Upcoming)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="invoice-classes">Select Classes</Label>
                            <Select value={invoiceClass} onValueChange={setInvoiceClass}>
                                <SelectTrigger id="invoice-classes">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Classes</SelectItem>
                                    <SelectItem value="Form 4">Form 4 Only</SelectItem>
                                    <SelectItem value="Form 3">Form 3 Only</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                        <DialogClose asChild>
                            <Button onClick={generateInvoices}>Generate Invoices</Button>
                        </DialogClose>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

             <Dialog>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Send Fee Reminders</DialogTitle>
                        <DialogDescription>
                           This will send a fee reminder notification to the parents/guardians of students with outstanding balances.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 grid gap-4">
                         <div className="space-y-2">
                            <Label>Target Audience</Label>
                            <p className="text-sm text-muted-foreground">
                                Reminders will be sent based on the current filters set on the student records table.
                            </p>
                            <div className="grid grid-cols-2 gap-4 pt-2">
                                <Card className="p-3">
                                    <p className="font-bold text-lg">{studentsWithBalance}</p>
                                    <p className="text-sm text-muted-foreground">Students with any balance</p>
                                </Card>
                                <Card className="p-3">
                                    <p className="font-bold text-lg">{studentsWithOverdue}</p>
                                    <p className="text-sm text-muted-foreground">Students with overdue balance</p>
                                </Card>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                        <div className="flex gap-2">
                            <DialogClose asChild>
                                <Button onClick={() => sendReminders('overdue')} variant="secondary">Send to Overdue ({studentsWithOverdue})</Button>
                            </DialogClose>
                             <DialogClose asChild>
                                <Button onClick={() => sendReminders('all')}>Send to All ({studentsWithBalance})</Button>
                            </DialogClose>
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            
            <StudentLedgerDialog student={selectedStudent} open={!!selectedStudent} onOpenChange={(open) => !open && setSelectedStudent(null)} />
            <EditCategoryDialog category={editingCategory} open={!!editingCategory} onOpenChange={(open) => !open && setEditingCategory(null)} onSave={handleUpdateCategory} />
            <EditDiscountDialog discount={editingDiscount} open={!!editingDiscount} onOpenChange={(open) => !open && setEditingDiscount(null)} onSave={handleUpdateDiscount} />
        </Dialog>
    );
}
