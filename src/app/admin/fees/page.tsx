
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
import { CircleDollarSign, Search, Filter, ChevronDown, Percent, FileDown, Receipt, Send, PlusCircle } from 'lucide-react';
import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis } from 'recharts';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { useToast } from '@/hooks/use-toast';

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

export default function FeesPage() {
    const [searchTerm, setSearchTerm] = React.useState('');
    const [classFilter, setClassFilter] = React.useState('All Classes');
    const [statusFilter, setStatusFilter] = React.useState<PaymentStatus | 'All Statuses'>('All Statuses');
    const { toast } = useToast();

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

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <div className="mb-6">
                <h1 className="font-headline text-3xl font-bold flex items-center gap-2">
                    <CircleDollarSign className="h-8 w-8 text-primary" />
                    Fees & Payments Management
                </h1>
                <p className="text-muted-foreground">Track fee collection, manage student balances, and send reminders.</p>
            </div>

            <div className="grid gap-6 mb-6 md:grid-cols-2 lg:grid-cols-4">
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
            
             <Card className="mb-6">
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

            <Card>
                <CardHeader>
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                            <CardTitle>Student Payment Records</CardTitle>
                            <CardDescription>A detailed list of fee payments for all students.</CardDescription>
                        </div>
                        <div className="flex w-full flex-col gap-2 md:w-auto md:flex-row">
                             <Button disabled>
                                <PlusCircle className="mr-2 h-4 w-4"/>
                                Record Payment
                            </Button>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="secondary">
                                        Bulk Actions
                                        <ChevronDown className="ml-2 h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                    <DropdownMenuItem disabled><Receipt className="mr-2"/>Generate Invoices</DropdownMenuItem>
                                    <DropdownMenuItem onClick={sendReminders}><Send className="mr-2"/>Send Reminders</DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem disabled><FileDown className="mr-2"/>Export Report (PDF)</DropdownMenuItem>
                                    <DropdownMenuItem disabled><FileDown className="mr-2"/>Export as CSV</DropdownMenuItem>
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
                                             <Button variant="ghost" size="sm" disabled>View Details</Button>
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
        </div>
    );
}
