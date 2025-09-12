
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
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Receipt, Search, Filter, ChevronDown, FileDown, PlusCircle, CalendarIcon, Upload, Briefcase, TrendingDown, Hourglass } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';

type ExpenseStatus = 'Paid' | 'Pending Approval' | 'Reimbursed' | 'Declined';

type ExpenseCategory = 'Utilities' | 'Supplies' | 'Maintenance' | 'Salaries' | 'Marketing' | 'Transport' | 'Stationery';

type Expense = {
    id: string;
    date: string;
    category: ExpenseCategory;
    description: string;
    amount: number;
    status: ExpenseStatus;
    submittedBy: string;
};

const mockExpenses: Expense[] = [
    { id: 'exp-1', date: '2024-07-15', category: 'Utilities', description: 'KPLC Electricity Bill', amount: 25000, status: 'Paid', submittedBy: 'Admin Office' },
    { id: 'exp-2', date: '2024-07-12', category: 'Supplies', description: 'Purchase of lab chemicals', amount: 15000, status: 'Pending Approval', submittedBy: 'Ms. Wanjiku' },
    { id: 'exp-3', date: '2024-07-10', category: 'Maintenance', description: 'Repair of school gate', amount: 8000, status: 'Reimbursed', submittedBy: 'Mr. Kamau' },
    { id: 'exp-4', date: '2024-07-05', category: 'Salaries', description: 'July Teacher Salaries', amount: 1200000, status: 'Paid', submittedBy: 'Admin Office' },
    { id: 'exp-5', date: '2024-07-02', category: 'Marketing', description: 'Newspaper Ad for admissions', amount: 30000, status: 'Declined', submittedBy: 'Admin Office' },
    { id: 'exp-6', date: '2024-07-01', category: 'Transport', description: 'Bus fuel for the month', amount: 50000, status: 'Paid', submittedBy: 'Transport Dept.' },
    { id: 'exp-7', date: '2024-06-28', category: 'Stationery', description: 'Bulk purchase of printing paper', amount: 12000, status: 'Paid', submittedBy: 'Admin Office' },
];

const categories: ExpenseCategory[] = ['Utilities', 'Supplies', 'Maintenance', 'Salaries', 'Marketing', 'Transport', 'Stationery'];
const statuses: ExpenseStatus[] = ['Paid', 'Pending Approval', 'Reimbursed', 'Declined'];


const getStatusBadge = (status: ExpenseStatus) => {
    switch (status) {
        case 'Paid': return <Badge variant="default" className="bg-green-600 hover:bg-green-700">Paid</Badge>;
        case 'Pending Approval': return <Badge variant="secondary" className="bg-yellow-500 text-white hover:bg-yellow-600">Pending</Badge>;
        case 'Reimbursed': return <Badge variant="secondary" className="bg-blue-500 text-white hover:bg-blue-600">Reimbursed</Badge>;
        case 'Declined': return <Badge variant="destructive">Declined</Badge>;
    }
}

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', minimumFractionDigits: 0 }).format(amount);
};


export default function ExpensesPage() {
    const [searchTerm, setSearchTerm] = React.useState('');
    const [date, setDate] = React.useState<Date | undefined>(new Date());
    const [clientReady, setClientReady] = React.useState(false);

    React.useEffect(() => {
        setClientReady(true);
    }, []);

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <div className="mb-6">
                <h1 className="font-headline text-3xl font-bold flex items-center gap-2">
                    <Receipt className="h-8 w-8 text-primary" />
                    Expense Management
                </h1>
                <p className="text-muted-foreground">Track and manage all school expenditures and reimbursements.</p>
            </div>
            
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Expenses (This Month)</CardTitle>
                        <Receipt className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">KES 1,278,000</div>
                        <p className="text-xs text-muted-foreground">+5.2% from last month</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pending Reimbursements</CardTitle>
                        <Hourglass className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">KES 15,000</div>
                        <p className="text-xs text-muted-foreground">1 pending request</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Budget Variance</CardTitle>
                        <TrendingDown className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">- KES 122,000</div>
                        <p className="text-xs text-muted-foreground">Under budget for July</p>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Top Spending Category</CardTitle>
                        <Briefcase className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">Salaries</div>
                        <p className="text-xs text-muted-foreground">93.9% of total spending</p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                     <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                            <CardTitle>Expense Records</CardTitle>
                            <CardDescription>A detailed log of all expenses recorded in the system.</CardDescription>
                        </div>
                        <div className="flex w-full flex-col gap-2 md:w-auto md:flex-row">
                             <Dialog>
                                <DialogTrigger asChild>
                                    <Button>
                                        <PlusCircle className="mr-2 h-4 w-4"/>
                                        Add New Expense
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-xl">
                                    <DialogHeader>
                                        <DialogTitle>Log New Expense</DialogTitle>
                                        <DialogDescription>
                                            Record a new school expenditure or a request for reimbursement.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="grid gap-6 py-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="exp-category">Category</Label>
                                                <Select>
                                                    <SelectTrigger id="exp-category">
                                                        <SelectValue placeholder="Select a category" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="exp-amount">Amount (KES)</Label>
                                                <Input id="exp-amount" type="number" placeholder="e.g., 5000" />
                                            </div>
                                        </div>
                                         <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="exp-date">Date of Expense</Label>
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
                                             <div className="space-y-2">
                                                <Label htmlFor="exp-vendor">Vendor / Payee</Label>
                                                <Input id="exp-vendor" placeholder="e.g., KPLC, Text Book Centre" />
                                            </div>
                                        </div>
                                         <div className="space-y-2">
                                            <Label htmlFor="exp-desc">Description</Label>
                                            <Textarea id="exp-desc" placeholder="Provide a brief description of the expense..." />
                                        </div>
                                        <Separator/>
                                         <div className="space-y-4">
                                            <Label>Attach Receipt / Invoice</Label>
                                            <div className="flex items-center justify-center w-full">
                                                <Label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted/50 hover:bg-muted">
                                                    <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center">
                                                        <Upload className="w-8 h-8 mb-2 text-muted-foreground" />
                                                        <p className="mb-2 text-sm text-muted-foreground">Attach file</p>
                                                        <p className="text-xs text-muted-foreground">(PDF, JPG, PNG)</p>
                                                    </div>
                                                    <Input id="dropzone-file" type="file" className="hidden" disabled/>
                                                </Label>
                                            </div>
                                            <p className="text-xs text-muted-foreground">Receipt scanning feature coming soon.</p>
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                                        <Button disabled>Save Expense</Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="w-full md:w-auto">
                                    <FileDown className="mr-2 h-4 w-4" />
                                    Export
                                    <ChevronDown className="ml-2 h-4 w-4" />
                                </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                    <DropdownMenuItem disabled>Export as PDF</DropdownMenuItem>
                                    <DropdownMenuItem disabled>Export as CSV</DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                    <div className="mt-4 flex flex-col gap-4 md:flex-row md:items-center">
                        <div className="relative w-full md:max-w-sm">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                            type="search"
                            placeholder="Search by description or vendor..."
                            className="w-full bg-background pl-8"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex w-full flex-col gap-2 md:w-auto md:flex-row md:items-center">
                            <Select>
                                <SelectTrigger className="w-full md:w-[180px]">
                                    <SelectValue placeholder="Filter by category" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Categories</SelectItem>
                                    {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                </SelectContent>
                            </Select>
                            <Select>
                                <SelectTrigger className="w-full md:w-[180px]">
                                    <SelectValue placeholder="Filter by status" />
                                </SelectTrigger>
                                <SelectContent>
                                     <SelectItem value="all">All Statuses</SelectItem>
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
                                    <TableHead>Date</TableHead>
                                    <TableHead>Category</TableHead>
                                    <TableHead>Description</TableHead>
                                    <TableHead>Submitted By</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Amount</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {mockExpenses.map(expense => (
                                    <TableRow key={expense.id}>
                                        <TableCell>{clientReady ? new Date(expense.date).toLocaleDateString() : ''}</TableCell>
                                        <TableCell><Badge variant="outline">{expense.category}</Badge></TableCell>
                                        <TableCell className="font-medium">{expense.description}</TableCell>
                                        <TableCell>{expense.submittedBy}</TableCell>
                                        <TableCell>{getStatusBadge(expense.status)}</TableCell>
                                        <TableCell className="text-right font-semibold">{formatCurrency(expense.amount)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
                <CardFooter>
                    <div className="text-xs text-muted-foreground">
                        Showing <strong>{mockExpenses.length}</strong> expense records.
                    </div>
                </CardFooter>
            </Card>
        </div>
    );
}
