
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
import { differenceInDays, isPast } from 'date-fns';
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
import { collection, query, onSnapshot, where, doc, getDoc, Timestamp, writeBatch, addDoc, orderBy } from 'firebase/firestore';
import type { DocumentData } from 'firebase/firestore';
import { useSearchParams } from 'next/navigation';

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
    recordedBy: string;
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
    const [childrenData, setChildrenData] = React.useState<Child[]>([]);
    const [selectedChild, setSelectedChild] = React.useState<string | undefined>();
    const [feeSummary, setFeeSummary] = React.useState<FeeSummary | null>(null);
    const [ledger, setLedger] = React.useState<Transaction[]>([]);
    const [paymentHistory, setPaymentHistory] = React.useState<PaymentHistory[]>([]);
    const [clientReady, setClientReady] = React.useState(false);
    const [isMpesaDialogOpen, setIsMpesaDialogOpen] = React.useState(false);
    const [isProcessingPayment, setIsProcessingPayment] = React.useState(false);
    const [mpesaPhoneNumber, setMpesaPhoneNumber] = React.useState('0722123456');
    const [paymentAmount, setPaymentAmount] = React.useState(0);
    const { toast } = useToast();
    const parentId = 'parent-user-id'; // This should be dynamic based on logged-in user

    React.useEffect(() => {
        if (!schoolId) return;
        setClientReady(true);
        // In a real app, filter by parent ID. For now, we fetch a few students.
        const q = query(collection(firestore, `schools/${schoolId}/students`), where('parentId', '==', parentId));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedChildren = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Child));
            setChildrenData(fetchedChildren);
            if (!selectedChild && fetchedChildren.length > 0) {
                setSelectedChild(fetchedChildren[0].id);
            }
        });
        return () => unsubscribe();
    }, [schoolId, selectedChild, parentId]);

    React.useEffect(() => {
        if (!selectedChild || !schoolId) return;

        const studentDocRef = doc(firestore, `schools/${schoolId}/students`, selectedChild);
        const unsubStudent = onSnapshot(studentDocRef, (studentSnap) => {
            if (studentSnap.exists()) {
                const studentData = studentSnap.data() as DocumentData;
                 const summary: FeeSummary = {
                    totalBilled: studentData.totalFee || 0,
                    totalPaid: studentData.amountPaid || 0,
                    balance: studentData.balance || 0,
                    dueDate: studentData.dueDate || new Date().toISOString(),
                    status: studentData.balance <= 0 ? 'Paid' : 'Partial',
                };
                setFeeSummary(summary);
                setPaymentAmount(summary.balance);
            }
        });
        
        const transactionsQuery = query(collection(firestore, `schools/${schoolId}/students`, selectedChild, 'transactions'), orderBy('date', 'desc'));
        const unsubTransactions = onSnapshot(transactionsQuery, (snapshot) => {
            const fetchedLedger = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction));
            setLedger(fetchedLedger);
            
            const fetchedHistory = fetchedLedger
                .filter(t => t.type === 'Payment')
                .map(t => ({
                    id: t.id,
                    term: 'Term 2, 2024', // This would be dynamic in a real app
                    date: t.date.toDate().toLocaleDateString('en-GB'),
                    amount: Math.abs(t.amount),
                    method: 'M-PESA', // This would also be dynamic
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
    
    const isOverdue = isPast(new Date(feeSummary.dueDate)) && feeSummary.balance > 0;

    const handleCardPayment = () => {
        toast({
            title: 'Simulating Payment',
            description: 'Redirecting to secure card payment gateway...',
        });
    };

    const handleMpesaPayment = async () => {
        if (!selectedChild || paymentAmount <= 0 || !schoolId) {
            toast({ variant: 'destructive', title: 'Invalid amount or missing information.' });
            return;
        }

        setIsProcessingPayment(true);
        
        const studentRef = doc(firestore, `schools/${schoolId}/students`, selectedChild);

        try {
            const studentDoc = await getDoc(studentRef);
            if (!studentDoc.exists()) throw new Error("Student not found");
            const studentData = studentDoc.data();
            
            const newAmountPaid = (studentData.amountPaid || 0) + paymentAmount;
            const newBalance = (studentData.balance || 0) - paymentAmount;

            const batch = writeBatch(firestore);
            
            batch.update(studentRef, {
                amountPaid: newAmountPaid,
                balance: newBalance,
                feeStatus: newBalance <= 0 ? 'Paid' : 'Partial'
            });

            const transactionRef = doc(collection(firestore, `schools/${schoolId}/students`, selectedChild, 'transactions'));
            batch.set(transactionRef, {
                date: Timestamp.now(),
                description: 'M-PESA Payment via Parent Portal',
                type: 'Payment',
                amount: -paymentAmount,
                balance: newBalance,
                recordedBy: 'Parent Portal',
            });

            await batch.commit();

            toast({
                title: 'Payment Successful',
                description: `A payment of ${formatCurrency(paymentAmount)} has been processed.`,
            });
        } catch (error) {
            console.error("Error processing payment:", error);
            toast({ variant: 'destructive', title: 'Payment Failed', description: 'Could not process payment. Please try again.' });
        } finally {
            setIsProcessingPayment(false);
            setIsMpesaDialogOpen(false);
        }
    };
    
    const finalStatus = isOverdue ? 'Overdue' : feeSummary.status;

    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-6">
            <div className="mb-2">
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

            {feeSummary.balance > 0 && isOverdue && (
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
                                            {ledger.map(item => (<TableRow key={item.id}><TableCell>{item.date.toDate().toLocaleDateString('en-GB')}</TableCell><TableCell className="font-medium">{item.description}</TableCell><TableCell className="text-right text-destructive">{item.amount > 0 ? formatCurrency(item.amount) : '—'}</TableCell><TableCell className="text-right text-green-600">{item.amount < 0 ? formatCurrency(Math.abs(item.amount)) : '—'}</TableCell><TableCell className="text-right font-semibold">{formatCurrency(item.balance)}</TableCell></TableRow>))}
                                            {ledger.length === 0 && (<TableRow><TableCell colSpan={5} className="h-24 text-center">No transactions for this term yet.</TableCell></TableRow>)}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader><CardTitle>Payment Options</CardTitle><CardDescription>Select your preferred payment method.</CardDescription></CardHeader>
                            <CardContent className="space-y-6">
                                <Dialog open={isMpesaDialogOpen} onOpenChange={setIsMpesaDialogOpen}>
                                    <DialogTrigger asChild><Button className="w-full" disabled={feeSummary.balance <= 0}><div className="h-5 w-5 bg-contain bg-no-repeat bg-center mr-2" style={{ backgroundImage: "url('https://upload.wikimedia.org/wikipedia/commons/1/15/M-PESA_LOGO-01.svg')" }}/>Pay with M-Pesa</Button></DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader><DialogTitle>M-Pesa Express Payment</DialogTitle><DialogDescription>Enter your M-Pesa registered phone number to receive a payment prompt.</DialogDescription></DialogHeader>
                                        <div className="py-4 space-y-4"><div className="space-y-2"><Label htmlFor="phone-number">Phone Number</Label><Input id="phone-number" value={mpesaPhoneNumber} onChange={(e) => setMpesaPhoneNumber(e.target.value)} /></div><div className="space-y-2"><Label htmlFor="amount">Amount to Pay (KES)</Label><Input id="amount" type="number" value={paymentAmount} onChange={(e) => setPaymentAmount(Number(e.target.value))}/></div></div>
                                        <DialogFooter><DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose><Button onClick={handleMpesaPayment} disabled={isProcessingPayment}>{isProcessingPayment ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Processing...</>) : 'Confirm Payment'}</Button></DialogFooter>
                                    </DialogContent>
                                </Dialog>
                                <Separator />
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

    