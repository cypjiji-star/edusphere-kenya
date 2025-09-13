
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

const mockStudents: StudentFee[] = [
    { id: 'std-1', name: 'Student 1', avatarUrl: 'https://picsum.photos/seed/f4-student1/100', class: 'Form 4', feeStatus: 'Paid', totalFee: 100000, amountPaid: 100000, balance: 0 },
    { id: 'std-2', name: 'Student 2', avatarUrl: 'https://picsum.photos/seed/f4-student2/100', class: 'Form 4', feeStatus: 'Partial', totalFee: 100000, amountPaid: 75000, balance: 25000 },
    { id: 'std-3', name: 'Student 32', avatarUrl: 'https://picsum.photos/seed/f3-student1/100', class: 'Form 3', feeStatus: 'Overdue', totalFee: 95000, amountPaid: 40000, balance: 55000 },
    { id: 'std-4', name: 'Student 33', avatarUrl: 'https://picsum.photos/seed/f3-student2/100', class: 'Form 3', feeStatus: 'Unpaid', totalFee: 95000, amountPaid: 0, balance: 95000 },
    { id: 'std-5', name: 'Student 60', avatarUrl: 'https://picsum.photos/seed/f2-student1/100', class: 'Form 2', feeStatus: 'Paid', totalFee: 90000, amountPaid: 90000, balance: 0 },
];

const initialFeeStructure = [
    { id: 'fs-1', category: 'Tuition', appliesTo: 'All Students', amount: 50000 },
    { id: 'fs-2', category: 'Boarding', appliesTo: 'Boarders', amount: 35000 },
    { id: 'fs-3', category: 'Transport', appliesTo: 'Day Scholars (Bus)', amount: 10000 },
    { id: 'fs-4', category: 'Activities', appliesTo: 'All Students', amount: 5000 },
    { id: 'fs-5', category: 'Computer Lab Fee', appliesTo: 'Form 3 & 4', amount: 2000 },
];

const initialDiscounts = [
    { id: 'disc-1', name: 'Sibling Discount', type: 'Percentage', value: '10%', appliesTo: 'Per Sibling' },
    { id: 'disc-2', name: 'Academic Scholarship', type: 'Fixed', value: 'KES 20,000', appliesTo: 'Top Performers' },
    { id: 'disc-3', name: 'Staff Discount', type: 'Percentage', value: '50%', appliesTo: 'Children of Staff' },
];

const mockStudentLedger = [
    { id: 't-1', date: '2024-05-15', description: 'Term 2 Invoice', type: 'Charge', amount: 95000, balance: 95000, recordedBy: 'System' },
    { id: 't-2', date: '2024-06-01', description: 'Payment Received via M-PESA', type: 'Payment', amount: -40000, balance: 55000, recordedBy: 'Admin User' },
    { id: 't-3', date: '2024-07-15', description: 'Late Fee Charge', type: 'Charge', amount: 2000, balance: 57000, recordedBy: 'System' },
];


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

function NewTransactionDialog() {
    const { toast } = useToast();
    const [transactionType, setTransactionType] = React.useState<TransactionType>('payment');
    const [date, setDate] = React.useState<Date | undefined>(new Date());
    const [studentId, setStudentId] = React.useState<string | undefined>();
    const [amount, setAmount] = React.useState('');
    const [description, setDescription] = React.useState('');

    const handleSaveTransaction = () => {
        toast({
            title: 'Transaction Recorded',
            description: `A new ${transactionType} of ${formatCurrency(Number(amount))} for the selected student has been saved.`,
        });
        // Here you would typically call a server action to save the data
        // and then re-fetch the student list to update the UI.
        setStudentId(undefined);
        setAmount('');
        setDescription('');
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
                            {mockStudents.map(student => (
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
                                {mockStudentLedger.map((item) => (
                                    <TableRow key={item.id}>
                                        <TableCell>{item.date}</TableCell>
                                        <TableCell className="font-medium">{item.description}</TableCell>
                                        <TableCell>
                                            <Badge variant={item.type === 'Payment' ? 'default' : 'outline'} className={item.type === 'Payment' ? 'bg-green-100 text-green-800' : ''}>
                                                {item.type}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>{item.recordedBy}</TableCell>
                                        <TableCell className={`text-right ${item.type === 'Payment' ? 'text-green-600' : 'text-destructive'}`}>
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


export default function FeesPage() {
    const [searchTerm, setSearchTerm] = React.useState('');
    const [classFilter, setClassFilter] = React.useState('All Classes');
    const [statusFilter, setStatusFilter] = React.useState<PaymentStatus | 'All Statuses'>('All Statuses');
    const [selectedStudent, setSelectedStudent] = React.useState<StudentFee | null>(null);
    const { toast } = useToast();
    const [feeStructure, setFeeStructure] = React.useState(initialFeeStructure);
    const [discounts, setDiscounts] = React.useState(initialDiscounts);

    const filteredStudents = mockStudents.filter(student => {
        const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesClass = classFilter === 'All Classes' || student.class === classFilter;
        const matchesStatus = statusFilter === 'All Statuses' || student.feeStatus === statusFilter;
        return matchesSearch && matchesClass && matchesStatus;
    });
    
    const sendReminders = () => {
        toast({
            title: 'Reminders Sent (Simulation)',
            description: 'In a real app, this would trigger SMS/email reminders to selected parents.',
        });
    }
    
    const generateInvoices = () => {
        toast({
            title: 'Invoices Generated (Simulation)',
            description: 'New invoices have been created for the selected students.',
        });
    }
    
    const handleSaveCategory = () => {
        toast({
            title: 'Fee Category Saved',
            description: 'The new fee category has been added to the fee structure.',
        });
    };

    const handleSaveDiscount = () => {
        toast({
            title: 'Discount Saved',
            description: 'The new discount has been added and can be applied to student accounts.',
        });
    };

    const handleEditItem = (itemType: 'category' | 'discount', name: string) => {
        toast({
            title: `Editing ${name}`,
            description: `In a real app, this would open a form to edit this ${itemType}.`,
        });
    };

    const handleDeleteCategory = (id: string, name: string) => {
        setFeeStructure(prev => prev.filter(item => item.id !== id));
        toast({
            title: 'Category Deleted',
            description: `The fee category "${name}" has been removed.`,
            variant: 'destructive',
        });
    };

    const handleDeleteDiscount = (id: string, name: string) => {
        setDiscounts(prev => prev.filter(item => item.id !== id));
        toast({
            title: 'Discount Deleted',
            description: `The discount "${name}" has been removed.`,
            variant: 'destructive',
        });
    };

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
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                        <Label htmlFor="category-term">Term</Label>
                                                        <Select defaultValue="term2-2024">
                                                            <SelectTrigger id="category-term">
                                                                <SelectValue placeholder="Select term" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="term2-2024">Term 2, 2024</SelectItem>
                                                                <SelectItem value="term1-2024">Term 1, 2024</SelectItem>
                                                                <SelectItem value="annual-2024">Annual 2024</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label htmlFor="category-amount">Amount (KES)</Label>
                                                        <Input id="category-amount" type="number" placeholder="e.g., 3000" />
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="category-name">Category Name</Label>
                                                    <Input id="category-name" placeholder="e.g., Swimming Club Fee" />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="category-applies">Applies To</Label>
                                                    <Input id="category-applies" placeholder="e.g., All Students, Boarders, Form 1, Music Club" />
                                                    <p className="text-xs text-muted-foreground">You can specify classes, streams, or custom groups.</p>
                                                </div>
                                                <Separator />
                                                <div className="flex items-center space-x-2">
                                                    <Switch id="optional-fee" />
                                                    <Label htmlFor="optional-fee">Optional Fee (Can be enabled/disabled per student)</Label>
                                                </div>
                                            </div>
                                            <DialogFooter>
                                                <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                                                <DialogClose asChild>
                                                    <Button onClick={handleSaveCategory}>Save Category</Button>
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
                                                <Button variant="ghost" size="icon" onClick={() => handleEditItem('category', item.category)}>
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDeleteCategory(item.id, item.category)}>
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
                                                    <div className="space-y-2">
                                                        <Label htmlFor="discount-name">Name</Label>
                                                        <Input id="discount-name" placeholder="e.g., Sibling Discount" />
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div className="space-y-2">
                                                            <Label htmlFor="discount-type">Type</Label>
                                                            <Select>
                                                                <SelectTrigger id="discount-type">
                                                                    <SelectValue placeholder="Select a type" />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value="percentage">Percentage (%)</SelectItem>
                                                                    <SelectItem value="fixed">Fixed Amount (KES)</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label htmlFor="discount-value">Value</Label>
                                                            <Input id="discount-value" type="number" placeholder="e.g., 10 or 5000" />
                                                        </div>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label htmlFor="discount-applies">Applies To / Criteria</Label>
                                                        <Input id="discount-applies" placeholder="e.g., Has sibling in school, Top 5 in class" />
                                                    </div>
                                                </div>
                                                <DialogFooter>
                                                    <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                                                    <DialogClose asChild>
                                                        <Button onClick={handleSaveDiscount}>Save Discount</Button>
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
                                                            <Button variant="ghost" size="icon" onClick={() => handleEditItem('discount', item.name)}>
                                                                <Edit className="h-4 w-4" />
                                                            </Button>
                                                            <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDeleteDiscount(item.id, item.name)}>
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
                                            <NewTransactionDialog />
                                        </Dialog>
                                        <Dialog>
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
                                                    <DropdownMenuItem onClick={sendReminders}><Send className="mr-2"/>Send Reminders</DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem><FileDown className="mr-2"/>Export Report (PDF)</DropdownMenuItem>
                                                    <DropdownMenuItem><FileText className="mr-2"/>Export as CSV</DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
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
                                                        <Select defaultValue="term2-2024">
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
                                                        <Select defaultValue="all">
                                                            <SelectTrigger id="invoice-classes">
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="all">All Classes</SelectItem>
                                                                <SelectItem value="f4">Form 4 Only</SelectItem>
                                                                <SelectItem value="f3">Form 3 Only</SelectItem>
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
                                    Showing <strong>{filteredStudents.length}</strong> of <strong>{mockStudents.length}</strong> records.
                                </div>
                            </CardFooter>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
            <StudentLedgerDialog student={selectedStudent} open={!!selectedStudent} onOpenChange={(open) => !open && setSelectedStudent(null)} />
        </Dialog>
    );
}
