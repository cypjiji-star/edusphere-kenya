
'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
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
import { Receipt, Search, Filter, ChevronDown, FileDown, PlusCircle, CalendarIcon, Upload, Briefcase, TrendingDown, Hourglass, Columns, Repeat, CheckCircle, XCircle, Paperclip } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Form, FormDescription } from '@/components/ui/form';
import { firestore } from '@/lib/firebase';
import { collection, query, onSnapshot, Timestamp } from 'firebase/firestore';

type ExpenseStatus = 'Paid' | 'Pending Approval' | 'Reimbursed' | 'Declined';

type ExpenseCategory = 'Utilities' | 'Supplies' | 'Maintenance' | 'Salaries' | 'Marketing' | 'Transport' | 'Stationery';

type Expense = {
    id: string;
    date: Timestamp;
    category: ExpenseCategory;
    description: string;
    amount: number;
    status: ExpenseStatus;
    submittedBy: string;
    hasAttachment?: boolean;
};

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
    const [expenses, setExpenses] = React.useState<Expense[]>([]);
    const [searchTerm, setSearchTerm] = React.useState('');
    const [categoryFilter, setCategoryFilter] = React.useState('All Categories');
    const [statusFilter, setStatusFilter] = React.useState('All Statuses');
    const [date, setDate] = React.useState<Date | undefined>(new Date());
    const [clientReady, setClientReady] = React.useState(false);
    const form = useForm();

     React.useEffect(() => {
        setClientReady(true);
        const q = query(collection(firestore, 'expenses'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedExpenses = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Expense));
            setExpenses(fetchedExpenses);
        });
        return () => unsubscribe();
    }, []);
    
    const filteredExpenses = expenses.filter(expense => {
        const matchesSearch = expense.description.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = categoryFilter === 'All Categories' || expense.category === categoryFilter;
        const matchesStatus = statusFilter === 'All Statuses' || expense.status === statusFilter;
        return matchesSearch && matchesCategory && matchesStatus;
    });

    const dashboardStats = React.useMemo(() => {
        const thisMonth = new Date().getMonth();
        const thisYear = new Date().getFullYear();

        const monthlyExpenses = expenses.filter(exp => {
            const expDate = exp.date.toDate();
            return expDate.getMonth() === thisMonth && expDate.getFullYear() === thisYear;
        });

        const total = monthlyExpenses.reduce((sum, exp) => sum + exp.amount, 0);
        const pending = expenses
            .filter(exp => exp.status === 'Pending Approval')
            .reduce((sum, exp) => sum + exp.amount, 0);
        
        const categorySpending = monthlyExpenses.reduce((acc, exp) => {
            acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
            return acc;
        }, {} as Record<ExpenseCategory, number>);

        const topCategory = Object.entries(categorySpending).sort(([,a],[,b]) => b-a)[0];

        return {
            total,
            pending,
            topCategoryName: topCategory ? topCategory[0] : 'N/A',
            topCategoryPercentage: topCategory && total > 0 ? Math.round((topCategory[1] / total) * 100) : 0,
        };
    }, [expenses]);

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
                        <div className="text-2xl font-bold">{formatCurrency(dashboardStats.total)}</div>
                        <p className="text-xs text-muted-foreground">+5.2% from last month</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pending Reimbursements</CardTitle>
                        <Hourglass className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(dashboardStats.pending)}</div>
                        <p className="text-xs text-muted-foreground">{expenses.filter(e => e.status === 'Pending Approval').length} pending requests</p>
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
                        <div className="text-2xl font-bold">{dashboardStats.topCategoryName}</div>
                        <p className="text-xs text-muted-foreground">{dashboardStats.topCategoryPercentage}% of total spending</p>
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
                                    <Form {...form}>
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
                                                <Label htmlFor="exp-desc">Description (Notes)</Label>
                                                <Textarea id="exp-desc" placeholder="Provide a brief description of the expense..." />
                                            </div>
                                            <Separator/>
                                            <div className="space-y-4">
                                                <Label>Attach Receipt / Invoice</Label>
                                                <div className="flex items-center justify-center w-full">
                                                    <Label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted/50 hover:bg-muted">
                                                        <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center">
                                                            <Upload className="w-8 h-8 mb-2 text-muted-foreground" />
                                                            <p className="mb-2 text-sm text-muted-foreground">Click to upload or drag and drop</p>
                                                            <p className="text-xs text-muted-foreground">(PDF, JPG, PNG)</p>
                                                        </div>
                                                        <Input id="dropzone-file" type="file" className="hidden" />
                                                    </Label>
                                                </div>
                                                <p className="text-xs text-muted-foreground">You can attach supporting documents like receipts or invoices.</p>
                                            </div>
                                            <Separator/>
                                            <div className="space-y-2">
                                                <div className="flex items-center space-x-2">
                                                    <Switch id="recurring-expense" />
                                                    <Label htmlFor="recurring-expense" className="flex items-center gap-2">
                                                        <Repeat className="h-4 w-4" />
                                                        This is a recurring expense
                                                    </Label>
                                                </div>
                                                <FormDescription>
                                                    Set up automated generation for monthly or termly expenses. (Coming soon)
                                                </FormDescription>
                                            </div>
                                        </div>
                                        <DialogFooter>
                                            <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                                            <Button>Save Expense</Button>
                                        </DialogFooter>
                                    </Form>
                                </DialogContent>
                            </Dialog>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="w-full md:w-auto">
                                    Bulk Actions
                                    <ChevronDown className="ml-2 h-4 w-4" />
                                </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                    <Dialog>
                                        <DialogTrigger asChild>
                                            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                                <Upload className="mr-2 h-4 w-4" />
                                                Import from CSV/Excel...
                                            </DropdownMenuItem>
                                        </DialogTrigger>
                                        <DialogContent className="sm:max-w-2xl">
                                            <Form {...form}>
                                                <DialogHeader>
                                                    <DialogTitle>Import Expenses from CSV/Excel</DialogTitle>
                                                    <DialogDescription>
                                                        Upload a file to bulk add new expenses.
                                                    </DialogDescription>
                                                </DialogHeader>
                                                <div className="grid gap-6 py-4">
                                                    <div className="space-y-2">
                                                        <Label>Step 1: Upload File</Label>
                                                        <div className="flex items-center justify-center w-full">
                                                            <Label htmlFor="dropzone-file-bulk" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted/50 hover:bg-muted">
                                                                <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center">
                                                                    <Upload className="w-8 h-8 mb-2 text-muted-foreground" />
                                                                    <p className="mb-2 text-sm text-muted-foreground">Click to upload or drag and drop</p>
                                                                    <p className="text-xs text-muted-foreground">CSV or Excel (up to 2MB)</p>
                                                                </div>
                                                                <Input id="dropzone-file-bulk" type="file" className="hidden" />
                                                            </Label>
                                                        </div>
                                                    </div>
                                                    <div className="space-y-4">
                                                        <div className="flex items-center gap-2">
                                                            <Columns className="h-5 w-5 text-primary" />
                                                            <h4 className="font-medium">Step 2: Map Columns</h4>
                                                        </div>
                                                        <p className="text-sm text-muted-foreground">Match the columns from your file to the required fields in the system.</p>
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                            <div className="grid grid-cols-[1fr,150px] items-center gap-2">
                                                                <Label>Date</Label>
                                                                <Select defaultValue="col1"><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="col1">Column A</SelectItem></SelectContent></Select>
                                                            </div>
                                                            <div className="grid grid-cols-[1fr,150px] items-center gap-2">
                                                                <Label>Amount</Label>
                                                                <Select defaultValue="col2"><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="col2">Column B</SelectItem></SelectContent></Select>
                                                            </div>
                                                            <div className="grid grid-cols-[1fr,150px] items-center gap-2">
                                                                <Label>Description</Label>
                                                                <Select defaultValue="col3"><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="col3">Column C</SelectItem></SelectContent></Select>
                                                            </div>
                                                            <div className="grid grid-cols-[1fr,150px] items-center gap-2">
                                                                <Label>Category</Label>
                                                                <Select><SelectTrigger><SelectValue placeholder="Assign..."/></SelectTrigger><SelectContent></SelectContent></Select>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <DialogFooter>
                                                    <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                                                    <Button disabled>Process File</Button>
                                                </DialogFooter>
                                            </Form>
                                        </DialogContent>
                                    </Dialog>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem>
                                        <FileDown className="mr-2 h-4 w-4" />
                                        Export as PDF
                                    </DropdownMenuItem>
                                    <DropdownMenuItem>
                                        <FileDown className="mr-2 h-4 w-4" />
                                        Export as CSV
                                    </DropdownMenuItem>
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
                            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                                <SelectTrigger className="w-full md:w-[180px]">
                                    <SelectValue placeholder="Filter by category" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="All Categories">All Categories</SelectItem>
                                    {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                </SelectContent>
                            </Select>
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="w-full md:w-[180px]">
                                    <SelectValue placeholder="Filter by status" />
                                </SelectTrigger>
                                <SelectContent>
                                     <SelectItem value="All Statuses">All Statuses</SelectItem>
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
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredExpenses.map(expense => (
                                    <TableRow key={expense.id}>
                                        <TableCell>{clientReady ? expense.date.toDate().toLocaleDateString() : ''}</TableCell>
                                        <TableCell><Badge variant="outline">{expense.category}</Badge></TableCell>
                                        <TableCell className="font-medium flex items-center gap-2">
                                            {expense.description}
                                            {expense.hasAttachment && <Paperclip className="h-4 w-4 text-muted-foreground" />}
                                        </TableCell>
                                        <TableCell>{expense.submittedBy}</TableCell>
                                        <TableCell>{getStatusBadge(expense.status)}</TableCell>
                                        <TableCell className="text-right font-semibold">{formatCurrency(expense.amount)}</TableCell>
                                        <TableCell className="text-right space-x-2">
                                            {expense.status === 'Pending Approval' ? (
                                                <>
                                                    <Button variant="ghost" size="sm" className="text-green-600 hover:text-green-700">
                                                        <CheckCircle className="mr-2 h-4 w-4" />
                                                        Approve
                                                    </Button>
                                                    <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                                                        <XCircle className="mr-2 h-4 w-4" />
                                                        Decline
                                                    </Button>
                                                </>
                                            ) : (
                                                <Button variant="ghost" size="sm">View Details</Button>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
                <CardFooter>
                    <div className="text-xs text-muted-foreground">
                        Showing <strong>{filteredExpenses.length}</strong> of <strong>{expenses.length}</strong> expense records.
                    </div>
                </CardFooter>
            </Card>
        </div>
    );
}
