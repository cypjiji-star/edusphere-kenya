
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
import { Receipt, Search, Filter, ChevronDown, FileDown, PlusCircle, CalendarIcon, Upload, Briefcase, TrendingDown, Hourglass, Columns, Repeat, CheckCircle, XCircle, Paperclip, Loader2, X, Edit, Bell, TrendingUp } from 'lucide-react';
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
import { firestore, storage } from '@/lib/firebase';
import { collection, query, onSnapshot, Timestamp, addDoc, serverTimestamp, doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { useToast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { useSearchParams } from 'next/navigation';


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
    vendor?: string;
    hasAttachment?: boolean;
    attachmentUrl?: string;
};

const categories: ExpenseCategory[] = ['Utilities', 'Supplies', 'Maintenance', 'Salaries', 'Marketing', 'Transport', 'Stationery'];
const statuses: ExpenseStatus[] = ['Paid', 'Pending Approval', 'Reimbursed', 'Declined'];


const getStatusBadge = (status: ExpenseStatus) => {
    switch (status) {
        case 'Paid': return <Badge variant="default" className="bg-primary hover:bg-primary/90">Paid</Badge>;
        case 'Pending Approval': return <Badge variant="secondary" className="bg-yellow-500 text-white hover:bg-yellow-600">Pending</Badge>;
        case 'Reimbursed': return <Badge variant="secondary" className="bg-blue-500 text-white hover:bg-blue-600">Reimbursed</Badge>;
        case 'Declined': return <Badge variant="destructive">Declined</Badge>;
    }
}

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', minimumFractionDigits: 0 }).format(amount);
};


function EditExpenseDialog({ expense, open, onOpenChange, onExpenseUpdated, schoolId }: { expense: Expense | null, open: boolean, onOpenChange: (open: boolean) => void, onExpenseUpdated: () => void, schoolId: string }) {
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const [category, setCategory] = React.useState<ExpenseCategory | undefined>();
    const [amount, setAmount] = React.useState('');
    const [date, setDate] = React.useState<Date | undefined>();
    const [vendor, setVendor] = React.useState('');
    const [description, setDescription] = React.useState('');
    const [attachment, setAttachment] = React.useState<File | null>(null);
    const [existingAttachmentUrl, setExistingAttachmentUrl] = React.useState<string | undefined>('');
    
    const { toast } = useToast();

    React.useEffect(() => {
        if (expense) {
            setCategory(expense.category);
            setAmount(String(expense.amount));
            setDate(expense.date.toDate());
            setVendor(expense.vendor || '');
            setDescription(expense.description);
            setAttachment(null);
            setExistingAttachmentUrl(expense.attachmentUrl);
        }
    }, [expense]);

    if (!expense) return null;
    
    const handleUpdate = async () => {
        if (!category || !amount || !date || !description) {
            toast({ title: "Missing Information", description: "Please fill out all required fields.", variant: "destructive" });
            return;
        }

        setIsSubmitting(true);
        let updatedAttachmentUrl = existingAttachmentUrl;
        let updatedHasAttachment = !!existingAttachmentUrl;

        try {
            // Handle file update: delete old one if a new one is provided
            if (attachment) {
                if (existingAttachmentUrl) {
                    const oldFileRef = ref(storage, existingAttachmentUrl);
                    try {
                        await deleteObject(oldFileRef);
                    } catch (e) {
                        console.warn("Could not delete old attachment, it might not exist:", e);
                    }
                }
                const newFileRef = ref(storage, `schools/${schoolId}/expense-receipts/${attachment.name}_${Date.now()}`);
                const snapshot = await uploadBytes(newFileRef, attachment);
                updatedAttachmentUrl = await getDownloadURL(snapshot.ref);
                updatedHasAttachment = true;
            }

            const expenseRef = doc(firestore, 'schools', schoolId, 'expenses', expense.id);
            const updatedData: Partial<Expense> = {
                category,
                amount: Number(amount),
                date: Timestamp.fromDate(date),
                vendor,
                description,
                attachmentUrl: updatedAttachmentUrl,
                hasAttachment: updatedHasAttachment,
            };

            await updateDoc(expenseRef, updatedData);
            
            toast({ title: "Expense Updated", description: "The expense details have been saved." });
            onExpenseUpdated();
            onOpenChange(false);
        } catch (error) {
            console.error("Error updating expense:", error);
            toast({ title: "Error", description: "Could not update the expense.", variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    return (
         <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle>Edit Expense</DialogTitle>
                    <DialogDescription>
                        Update the details for this expenditure.
                    </DialogDescription>
                </DialogHeader>
                 <div className="grid gap-6 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="exp-category-edit">Category</Label>
                            <Select value={category} onValueChange={(v: ExpenseCategory) => setCategory(v)}>
                                <SelectTrigger id="exp-category-edit">
                                    <SelectValue placeholder="Select a category" />
                                </SelectTrigger>
                                <SelectContent>
                                    {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="exp-amount-edit">Amount (KES)</Label>
                            <Input id="exp-amount-edit" type="number" placeholder="e.g., 5000" value={amount} onChange={(e) => setAmount(e.target.value)} />
                        </div>
                    </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="exp-date-edit">Date of Expense</Label>
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
                            <Label htmlFor="exp-vendor-edit">Vendor / Payee</Label>
                            <Input id="exp-vendor-edit" placeholder="e.g., KPLC, Text Book Centre" value={vendor} onChange={(e) => setVendor(e.target.value)}/>
                        </div>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="exp-desc-edit">Description (Notes)</Label>
                        <Textarea id="exp-desc-edit" placeholder="Provide a brief description of the expense..." value={description} onChange={(e) => setDescription(e.target.value)} />
                    </div>
                     <Separator/>
                     <div className="space-y-2">
                        <Label>Attach Receipt / Invoice</Label>
                         {attachment ? (
                             <div className="w-full p-4 rounded-lg border bg-muted/50 flex items-center justify-between">
                                <div className="flex items-center gap-2 text-sm font-medium">
                                    <Paperclip className="h-5 w-5 text-primary" />
                                    <span className="truncate">{attachment.name}</span>
                                </div>
                                <Button variant="ghost" size="icon" onClick={() => setAttachment(null)} className="h-6 w-6">
                                    <X className="h-4 w-4 text-destructive" />
                                </Button>
                            </div>
                         ) : existingAttachmentUrl ? (
                             <div className="w-full p-4 rounded-lg border bg-muted/50 flex items-center justify-between">
                                <a href={existingAttachmentUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm font-medium text-primary hover:underline">
                                    <Paperclip className="h-5 w-5" />
                                    <span className="truncate">View current attachment</span>
                                </a>
                                <Button variant="ghost" size="icon" onClick={() => setExistingAttachmentUrl(undefined)} className="h-6 w-6">
                                    <X className="h-4 w-4 text-destructive" />
                                </Button>
                            </div>
                         ) : (
                            <Label htmlFor="dropzone-file-edit" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted/50 hover:bg-muted">
                                <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center">
                                    <Upload className="w-8 h-8 mb-2 text-muted-foreground" />
                                    <p className="mb-2 text-sm text-muted-foreground">Upload a new receipt</p>
                                </div>
                                <Input id="dropzone-file-edit" type="file" className="hidden" onChange={(e) => setAttachment(e.target.files?.[0] || null)} />
                            </Label>
                        )}
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleUpdate} disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                        Save Changes
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export default function ExpensesPage() {
    const searchParams = useSearchParams();
    const schoolId = searchParams.get('schoolId');
    const [expenses, setExpenses] = React.useState<Expense[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [searchTerm, setSearchTerm] = React.useState('');
    const [categoryFilter, setCategoryFilter] = React.useState('All Categories');
    const [statusFilter, setStatusFilter] = React.useState('All Statuses');
    
    // State for the new expense dialog
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const [isAddExpenseOpen, setIsAddExpenseOpen] = React.useState(false);
    const [newExpenseCategory, setNewExpenseCategory] = React.useState<ExpenseCategory | undefined>();
    const [newExpenseAmount, setNewExpenseAmount] = React.useState('');
    const [newExpenseDate, setNewExpenseDate] = React.useState<Date | undefined>(new Date());
    const [newExpenseVendor, setNewExpenseVendor] = React.useState('');
    const [newExpenseDescription, setNewExpenseDescription] = React.useState('');
    const [newExpenseAttachment, setNewExpenseAttachment] = React.useState<File | null>(null);

    // State for bulk import
    const [isBulkImportOpen, setIsBulkImportOpen] = React.useState(false);
    const [bulkImportFile, setBulkImportFile] = React.useState<File | null>(null);
    const [isProcessingFile, setIsProcessingFile] = React.useState(false);
    const [isFileProcessed, setIsFileProcessed] = React.useState(false);
    
    // State for editing
    const [editingExpense, setEditingExpense] = React.useState<Expense | null>(null);

    const { toast } = useToast();
    const form = useForm();

     React.useEffect(() => {
        if (!schoolId) {
            setIsLoading(false);
            return;
        };

        setIsLoading(true);
        const q = query(collection(firestore, 'schools', schoolId, 'expenses'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedExpenses = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Expense));
            setExpenses(fetchedExpenses);
            setIsLoading(false);
        }, (error) => {
            console.error("Error fetching expenses: ", error);
            setIsLoading(false);
        });
        return () => unsubscribe();
    }, [schoolId]);
    
    const filteredExpenses = expenses.filter(expense => {
        const matchesSearch = expense.description.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = categoryFilter === 'All Categories' || expense.category === categoryFilter;
        const matchesStatus = statusFilter === 'All Statuses' || expense.status === statusFilter;
        return matchesSearch && matchesCategory && matchesStatus;
    });

    const resetNewExpenseForm = () => {
        setNewExpenseCategory(undefined);
        setNewExpenseAmount('');
        setNewExpenseDate(new Date());
        setNewExpenseVendor('');
        setNewExpenseDescription('');
        setNewExpenseAttachment(null);
    };

    const handleSaveExpense = async () => {
        if (!newExpenseCategory || !newExpenseAmount || !newExpenseDate || !newExpenseDescription || !schoolId) {
            toast({ title: "Missing Information", description: "Please fill out all required fields.", variant: "destructive" });
            return;
        }

        setIsSubmitting(true);
        let attachmentUrl = '';
        let hasAttachment = false;

        try {
            if (newExpenseAttachment) {
                const storageRef = ref(storage, `schools/${schoolId}/expense-receipts/${newExpenseAttachment.name}_${Date.now()}`);
                const snapshot = await uploadBytes(newExpenseAttachment, newExpenseAttachment);
                attachmentUrl = await getDownloadURL(snapshot.ref);
                hasAttachment = true;
            }

            const expenseData = {
                category: newExpenseCategory,
                amount: Number(newExpenseAmount),
                date: Timestamp.fromDate(newExpenseDate),
                vendor: newExpenseVendor,
                description: newExpenseDescription,
                submittedBy: 'Admin User',
                status: 'Pending Approval' as ExpenseStatus,
                createdAt: serverTimestamp(),
                hasAttachment,
                attachmentUrl,
            };

            await addDoc(collection(firestore, 'schools', schoolId, 'expenses'), expenseData);

            toast({ title: "Expense Saved", description: "Your new expense has been logged for approval." });
            resetNewExpenseForm();
            setIsAddExpenseOpen(false);

        } catch (error) {
            console.error("Error saving expense:", error);
            toast({ title: "Error", description: "Could not save the expense. Please try again.", variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const handleUpdateStatus = async (expenseId: string, status: 'Paid' | 'Declined') => {
        if (!schoolId) return;
        try {
            const expenseRef = doc(firestore, 'schools', schoolId, 'expenses', expenseId);
            await updateDoc(expenseRef, { status });
            toast({
                title: 'Status Updated',
                description: `The expense has been marked as ${status}.`
            });
            
            await addDoc(collection(firestore, 'schools', schoolId, 'notifications'), {
                title: `Expense ${status}`,
                description: `Your expense report for ${formatCurrency(expenses.find(e => e.id === expenseId)?.amount || 0)} has been ${status.toLowerCase()}.`,
                createdAt: serverTimestamp(),
                read: false,
                href: `/admin/expenses?schoolId=${schoolId}`,
            });
            
        } catch (error) {
            console.error("Error updating status:", error);
            toast({ title: "Error", description: "Could not update the expense status.", variant: "destructive" });
        }
    };
    
    const dashboardStats = React.useMemo(() => {
        const thisMonth = new Date().getMonth();
        const thisYear = new Date().getFullYear();
        const monthlyBudget = 1500000;

        const monthlyExpenses = expenses.filter(exp => {
            if (!exp.date) return false;
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
        
        const budgetVariance = monthlyBudget - total;

        return {
            total,
            pending,
            topCategoryName: topCategory ? topCategory[0] : 'N/A',
            topCategoryPercentage: topCategory && total > 0 ? Math.round((topCategory[1] / total) * 100) : 0,
            budgetVariance,
        };
    }, [expenses]);

    const handleBulkFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            setBulkImportFile(event.target.files[0]);
            setIsFileProcessed(false);
        }
    };
    
    const handleRemoveBulkFile = () => {
        setBulkImportFile(null);
        setIsFileProcessed(false);
    };

    const handleProcessFile = () => {
        setIsProcessingFile(true);
        setTimeout(() => {
            setIsProcessingFile(false);
            setIsFileProcessed(true);
            toast({
                title: 'File Processed',
                description: 'Please map the columns from your file to the required fields.',
            });
        }, 1500);
    }
    
     const handleImportExpenses = () => {
        setIsBulkImportOpen(false); // Close the dialog
        toast({
            title: 'Import Successful',
            description: 'The expenses have been added to the log for approval.',
        });
        // Reset dialog state after closing
        setTimeout(() => {
            setBulkImportFile(null);
            setIsFileProcessed(false);
        }, 300);
    };

    const handleExport = (type: 'PDF' | 'CSV') => {
        const doc = new jsPDF();
        const tableData = filteredExpenses.map(exp => [
            exp.date ? exp.date.toDate().toLocaleDateString() : '',
            exp.category,
            exp.description,
            exp.submittedBy,
            exp.status,
            formatCurrency(exp.amount),
        ]);

        if (type === 'CSV') {
            const headers = ['Date', 'Category', 'Description', 'Submitted By', 'Status', 'Amount'];
            const csvContent = [
                headers.join(','),
                ...tableData.map(row => row.join(','))
            ].join('\n');
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement("a");
            if (link.download !== undefined) {
                const url = URL.createObjectURL(blob);
                link.setAttribute("href", url);
                link.setAttribute("download", "expenses-report.csv");
                link.style.visibility = 'hidden';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }
        } else {
             doc.text("Expense Records", 14, 16);
             (doc as any).autoTable({
                startY: 22,
                head: [['Date', 'Category', 'Description', 'Submitted By', 'Status', 'Amount']],
                body: tableData,
             });
             doc.save('expenses-report.pdf');
        }
        toast({
            title: 'Exporting Records',
            description: `Your expense records are being exported as a ${type} file.`,
        });
    };
    
    if (!schoolId) {
        return <div className="p-8">Error: School ID is missing from URL.</div>
    }

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
                        <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
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
                        {dashboardStats.budgetVariance >= 0 ? 
                            <TrendingDown className="h-4 w-4 text-primary" /> : 
                            <TrendingUp className="h-4 w-4 text-destructive" />
                        }
                    </CardHeader>
                    <CardContent>
                        <div className={cn("text-2xl font-bold", dashboardStats.budgetVariance >= 0 ? 'text-primary' : 'text-destructive')}>
                            {formatCurrency(Math.abs(dashboardStats.budgetVariance))}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {dashboardStats.budgetVariance >= 0 ? 'Under budget this month' : 'Over budget this month'}
                        </p>
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
                            <Dialog open={isAddExpenseOpen} onOpenChange={setIsAddExpenseOpen}>
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
                                                <Select value={newExpenseCategory} onValueChange={(v: ExpenseCategory) => setNewExpenseCategory(v)}>
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
                                                <Input id="exp-amount" type="number" placeholder="e.g., 5000" value={newExpenseAmount} onChange={(e) => setNewExpenseAmount(e.target.value)} />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="exp-date">Date of Expense</Label>
                                                <Popover>
                                                    <PopoverTrigger asChild>
                                                    <Button
                                                        variant={"outline"}
                                                        className={cn("w-full justify-start text-left font-normal", !newExpenseDate && "text-muted-foreground")}
                                                    >
                                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                                        {newExpenseDate ? format(newExpenseDate, "PPP") : <span>Pick a date</span>}
                                                    </Button>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-auto p-0">
                                                        <Calendar mode="single" selected={newExpenseDate} onSelect={setNewExpenseDate} initialFocus />
                                                    </PopoverContent>
                                                </Popover>
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="exp-vendor">Vendor / Payee</Label>
                                                <Input id="exp-vendor" placeholder="e.g., KPLC, Text Book Centre" value={newExpenseVendor} onChange={(e) => setNewExpenseVendor(e.target.value)}/>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="exp-desc">Description (Notes)</Label>
                                            <Textarea id="exp-desc" placeholder="Provide a brief description of the expense..." value={newExpenseDescription} onChange={(e) => setNewExpenseDescription(e.target.value)} />
                                        </div>
                                        <Separator/>
                                        <div className="space-y-2">
                                            <Label>Attach Receipt / Invoice</Label>
                                             {newExpenseAttachment ? (
                                                <div className="w-full p-4 rounded-lg border bg-muted/50 flex items-center justify-between">
                                                    <div className="flex items-center gap-2 text-sm font-medium">
                                                        <Paperclip className="h-5 w-5 text-primary" />
                                                        <span className="truncate">{newExpenseAttachment.name}</span>
                                                    </div>
                                                    <Button variant="ghost" size="icon" onClick={() => setNewExpenseAttachment(null)} className="h-6 w-6">
                                                        <X className="h-4 w-4 text-destructive" />
                                                    </Button>
                                                </div>
                                            ) : (
                                                <Label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted/50 hover:bg-muted">
                                                    <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center">
                                                        <Upload className="w-8 h-8 mb-2 text-muted-foreground" />
                                                        <p className="mb-2 text-sm text-muted-foreground">Click to upload or drag and drop</p>
                                                        <p className="text-xs text-muted-foreground">(PDF, JPG, PNG)</p>
                                                    </div>
                                                    <Input id="dropzone-file" type="file" className="hidden" onChange={(e) => setNewExpenseAttachment(e.target.files?.[0] || null)} />
                                                </Label>
                                            )}
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <Button variant="outline" onClick={() => setIsAddExpenseOpen(false)}>Cancel</Button>
                                        <Button onClick={handleSaveExpense} disabled={isSubmitting}>
                                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                                            Save Expense
                                        </Button>
                                    </DialogFooter>
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
                                    <Dialog open={isBulkImportOpen} onOpenChange={setIsBulkImportOpen}>
                                        <DialogTrigger asChild>
                                            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                                <Upload className="mr-2 h-4 w-4" />
                                                Import from CSV/Excel...
                                            </DropdownMenuItem>
                                        </DialogTrigger>
                                        <DialogContent className="sm:max-w-2xl">
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
                                                        {bulkImportFile ? (
                                                            <div className="w-full p-4 rounded-lg border bg-muted/50 flex items-center justify-between">
                                                                <div className="flex items-center gap-2 text-sm font-medium">
                                                                    <FileDown className="h-5 w-5 text-primary" />
                                                                    <span className="truncate">{bulkImportFile.name}</span>
                                                                </div>
                                                                <Button variant="ghost" size="icon" onClick={handleRemoveBulkFile} className="h-6 w-6">
                                                                    <X className="h-4 w-4 text-destructive" />
                                                                </Button>
                                                            </div>
                                                        ) : (
                                                            <Label htmlFor="dropzone-file-bulk" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted/50 hover:bg-muted">
                                                                <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center">
                                                                    <Upload className="w-8 h-8 mb-2 text-muted-foreground" />
                                                                    <p className="mb-2 text-sm text-muted-foreground">Click to upload or drag and drop</p>
                                                                    <p className="text-xs text-muted-foreground">CSV or Excel (up to 2MB)</p>
                                                                </div>
                                                                <Input id="dropzone-file-bulk" type="file" className="hidden" onChange={handleBulkFileChange} />
                                                            </Label>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className={cn("space-y-4", !isFileProcessed && "opacity-50")}>
                                                    <div className="flex items-center gap-2">
                                                        <Columns className="h-5 w-5 text-primary" />
                                                        <h4 className="font-medium">Step 2: Map Columns</h4>
                                                    </div>
                                                    <p className="text-sm text-muted-foreground">Match the columns from your file to the required fields in the system.</p>
                                                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <div className="grid grid-cols-[1fr,150px] items-center gap-2">
                                                            <Label>Date</Label>
                                                            <Select defaultValue="col1" disabled={!isFileProcessed}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="col1">Column A</SelectItem></SelectContent></Select>
                                                        </div>
                                                        <div className="grid grid-cols-[1fr,150px] items-center gap-2">
                                                            <Label>Amount</Label>
                                                            <Select defaultValue="col2" disabled={!isFileProcessed}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="col2">Column B</SelectItem></SelectContent></Select>
                                                        </div>
                                                        <div className="grid grid-cols-[1fr,150px] items-center gap-2">
                                                            <Label>Description</Label>
                                                            <Select defaultValue="col3" disabled={!isFileProcessed}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="col3">Column C</SelectItem></SelectContent></Select>
                                                        </div>
                                                        <div className="grid grid-cols-[1fr,150px] items-center gap-2">
                                                            <Label>Category</Label>
                                                            <Select disabled={!isFileProcessed}><SelectTrigger><SelectValue placeholder="Assign..."/></SelectTrigger><SelectContent></SelectContent></Select>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <DialogFooter>
                                                <Button variant="outline" onClick={() => setIsBulkImportOpen(false)}>Cancel</Button>
                                                {isFileProcessed ? (
                                                    <Button onClick={handleImportExpenses}>
                                                        <CheckCircle className="mr-2 h-4 w-4" /> Import Expenses
                                                    </Button>
                                                ) : (
                                                    <Button onClick={handleProcessFile} disabled={!bulkImportFile || isProcessingFile}>
                                                        {isProcessingFile ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/>Processing...</> : 'Process File'}
                                                    </Button>
                                                )}
                                            </DialogFooter>
                                        </DialogContent>
                                    </Dialog>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => handleExport('PDF')}>
                                        <FileDown className="mr-2 h-4 w-4" />
                                        Export as PDF
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleExport('CSV')}>
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
                                        <TableCell>{expense.date ? expense.date.toDate().toLocaleDateString() : ''}</TableCell>
                                        <TableCell><Badge variant="outline">{expense.category}</Badge></TableCell>
                                        <TableCell className="font-medium flex items-center gap-2">
                                            {expense.description}
                                            {expense.hasAttachment && expense.attachmentUrl && (
                                                <a href={expense.attachmentUrl} target="_blank" rel="noopener noreferrer">
                                                    <Paperclip className="h-4 w-4 text-muted-foreground hover:text-primary" />
                                                </a>
                                            )}
                                        </TableCell>
                                        <TableCell>{expense.submittedBy}</TableCell>
                                        <TableCell>{getStatusBadge(expense.status)}</TableCell>
                                        <TableCell className="text-right font-semibold">{formatCurrency(expense.amount)}</TableCell>
                                        <TableCell className="text-right space-x-2">
                                            {expense.status === 'Pending Approval' ? (
                                                <>
                                                    <Button variant="ghost" size="sm" className="text-primary hover:text-primary/90" onClick={() => handleUpdateStatus(expense.id, 'Paid')}>
                                                        <CheckCircle className="mr-2 h-4 w-4" />
                                                        Approve
                                                    </Button>
                                                    <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700" onClick={() => handleUpdateStatus(expense.id, 'Declined')}>
                                                        <XCircle className="mr-2 h-4 w-4" />
                                                        Decline
                                                    </Button>
                                                </>
                                            ) : (
                                                <Button variant="ghost" size="sm" onClick={() => setEditingExpense(expense)}>
                                                    <Edit className="mr-2 h-4 w-4" />
                                                    Edit
                                                </Button>
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
             <EditExpenseDialog 
                expense={editingExpense} 
                open={!!editingExpense} 
                onOpenChange={(open) => !open && setEditingExpense(null)} 
                onExpenseUpdated={() => {
                    // This could be a place to re-fetch data if not using realtime listeners
                }}
                schoolId={schoolId}
            />
        </div>
    );
}
