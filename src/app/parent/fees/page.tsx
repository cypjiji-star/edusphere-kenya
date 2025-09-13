
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


const childrenData = [
  { id: 'child-1', name: 'John Doe', class: 'Form 4' },
  { id: 'child-2', name: 'Jane Doe', class: 'Form 1' },
];

const feeData = {
  'child-1': {
    summary: {
      totalBilled: 105000,
      totalPaid: 80000,
      balance: 25000,
      dueDate: '2024-08-15',
      status: 'Partial' as const,
    },
    ledger: [
        { id: 't-1', date: '2024-05-15', description: 'Term 2 Invoice', type: 'Charge', charge: 105000, payment: 0, balance: 105000 },
        { id: 't-2', date: '2024-06-01', description: 'Payment Received via M-PESA', type: 'Payment', charge: 0, payment: 40000, balance: 65000 },
        { id: 't-3', date: '2024-07-10', description: 'Payment Received via Bank', type: 'Payment', charge: 0, payment: 40000, balance: 25000 },
    ],
  },
  'child-2': {
    summary: {
      totalBilled: 105000,
      totalPaid: 105000,
      balance: 0,
      dueDate: '2024-08-15',
      status: 'Paid' as const,
    },
    ledger: [
        { id: 't-4', date: '2024-05-15', description: 'Term 2 Invoice', type: 'Charge', charge: 105000, payment: 0, balance: 105000 },
        { id: 't-5', date: '2024-05-20', description: 'Full Payment via Bank Transfer', type: 'Payment', charge: 0, payment: 105000, balance: 0 },
    ],
  }
};

const historyData = {
    'child-1': {
        totalPaid: 450000,
        payments: [
            { id: 'ph-1', term: 'Term 1, 2024', date: '2024-01-20', amount: 105000, method: 'Bank Transfer' },
            { id: 'ph-2', term: 'Term 3, 2023', date: '2023-09-15', amount: 100000, method: 'M-PESA' },
            { id: 'ph-3', term: 'Term 2, 2023', date: '2023-05-18', amount: 100000, method: 'M-PESA' },
        ]
    },
    'child-2': {
        totalPaid: 105000,
        payments: []
    }
}


const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', minimumFractionDigits: 0 }).format(amount);
};

const getFeeStatusBadge = (status: 'Paid' | 'Partial' | 'Overdue') => {
    switch(status) {
        case 'Paid': return <Badge className="bg-green-600 hover:bg-green-700">Paid</Badge>;
        case 'Partial': return <Badge className="bg-blue-500 hover:bg-blue-600">Partial Payment</Badge>;
        case 'Overdue': return <Badge variant="destructive">Overdue</Badge>;
    }
}


export default function ParentFeesPage() {
    const [selectedChild, setSelectedChild] = React.useState(childrenData[0].id);
    const data = feeData[selectedChild as keyof typeof feeData];
    const paymentHistory = historyData[selectedChild as keyof typeof historyData];
    const [clientReady, setClientReady] = React.useState(false);
    const [isMpesaDialogOpen, setIsMpesaDialogOpen] = React.useState(false);
    const [isProcessingPayment, setIsProcessingPayment] = React.useState(false);
    const [mpesaPhoneNumber, setMpesaPhoneNumber] = React.useState('0722123456');
    const [paymentAmount, setPaymentAmount] = React.useState(data.summary.balance);
    const { toast } = useToast();

    React.useEffect(() => {
        setClientReady(true);
        setPaymentAmount(data.summary.balance);
    }, [selectedChild, data.summary.balance]);

    const daysUntilDue = clientReady ? differenceInDays(new Date(data.summary.dueDate), new Date()) : 0;
    const isOverdue = clientReady ? !isFuture(new Date(data.summary.dueDate)) && data.summary.balance > 0 : false;

    const handleCardPayment = () => {
        toast({
            title: 'Simulating Payment',
            description: 'Redirecting to secure card payment gateway...',
        });
    };

    const handleMpesaPayment = () => {
        setIsProcessingPayment(true);
        setTimeout(() => {
            setIsProcessingPayment(false);
            setIsMpesaDialogOpen(false);
            toast({
                title: 'Payment Successful',
                description: `A payment of ${formatCurrency(paymentAmount)} has been processed.`,
            });
        }, 2500);
    };
    
    const finalStatus = isOverdue ? 'Overdue' : data.summary.status;

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

            {data.summary.balance > 0 && (
                <Alert variant={isOverdue ? "destructive" : "default"}>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>
                        {isOverdue
                        ? 'Fee Balance Overdue'
                        : `Upcoming Payment Due`}
                    </AlertTitle>
                    <AlertDescription>
                        {isOverdue
                        ? 'The fee balance for this term is overdue. Please make a payment as soon as possible.'
                        : `The outstanding fee balance is due in ${daysUntilDue} days.`}
                    </AlertDescription>
                </Alert>
            )}

            <Tabs defaultValue="statement">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="statement">Current Term Statement</TabsTrigger>
                    <TabsTrigger value="history">Overall Payment History</TabsTrigger>
                </TabsList>
                <TabsContent value="statement" className="mt-6">
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                        <Card>
                            <CardHeader className="pb-2">
                                <CardDescription>Outstanding Balance</CardDescription>
                                <CardTitle className={`text-4xl ${data.summary.balance > 0 ? 'text-destructive' : 'text-green-600'}`}>{formatCurrency(data.summary.balance)}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-xs text-muted-foreground">
                                    Due: {clientReady ? new Date(data.summary.dueDate).toLocaleDateString('en-GB') : ''}
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2">
                                <CardDescription>Total Billed (Term 2)</CardDescription>
                                <CardTitle className="text-2xl">{formatCurrency(data.summary.totalBilled)}</CardTitle>
                            </CardHeader>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2">
                                <CardDescription>Total Paid (Term 2)</CardDescription>
                                <CardTitle className="text-2xl">{formatCurrency(data.summary.totalPaid)}</CardTitle>
                            </CardHeader>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2">
                                <CardDescription>Payment Status</CardDescription>
                                <CardTitle className="text-2xl">{getFeeStatusBadge(finalStatus)}</CardTitle>
                            </CardHeader>
                        </Card>
                    </div>
                    
                    <div className="grid gap-6 lg:grid-cols-3 mt-6">
                        <Card className="lg:col-span-2">
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <CardTitle>Fee Statement (Term 2, 2024)</CardTitle>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="outline" className="w-full sm:w-auto">
                                                <FileDown className="mr-2 h-4 w-4" />
                                                Export
                                                <ChevronDown className="ml-2 h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent>
                                            <DropdownMenuItem><Printer className="mr-2"/> Print Statement</DropdownMenuItem>
                                            <DropdownMenuItem><FileDown className="mr-2"/> Export as PDF</DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                                <CardDescription>A detailed transaction history for the current term.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="w-full overflow-auto rounded-lg border">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                            <TableHead>Date</TableHead>
                                            <TableHead>Description</TableHead>
                                            <TableHead className="text-right">Charges (KES)</TableHead>
                                            <TableHead className="text-right">Payments (KES)</TableHead>
                                            <TableHead className="text-right">Balance (KES)</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {data.ledger.map(item => (
                                                <TableRow key={item.id}>
                                                    <TableCell>{clientReady ? new Date(item.date).toLocaleDateString('en-GB') : ''}</TableCell>
                                                    <TableCell className="font-medium">{item.description}</TableCell>
                                                    <TableCell className="text-right text-destructive">
                                                        {item.charge > 0 ? formatCurrency(item.charge) : '—'}
                                                    </TableCell>
                                                    <TableCell className="text-right text-green-600">
                                                        {item.payment > 0 ? formatCurrency(item.payment) : '—'}
                                                    </TableCell>
                                                    <TableCell className="text-right font-semibold">{formatCurrency(item.balance)}</TableCell>
                                                    <TableCell className="text-right">
                                                        {item.type === 'Payment' && (
                                                            <Button variant="outline" size="sm">
                                                                <FileDown className="mr-2 h-3 w-3" />
                                                                Receipt
                                                            </Button>
                                                        )}
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
                                <CardTitle>Payment Options</CardTitle>
                                <CardDescription>Select your preferred payment method.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <Dialog open={isMpesaDialogOpen} onOpenChange={setIsMpesaDialogOpen}>
                                    <DialogTrigger asChild>
                                         <Button className="w-full" disabled={data.summary.balance <= 0}>
                                            <div className="h-5 w-5 bg-contain bg-no-repeat bg-center mr-2" style={{ backgroundImage: "url('https://upload.wikimedia.org/wikipedia/commons/1/15/M-PESA_LOGO-01.svg')" }}/>
                                            Pay with M-Pesa
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>M-Pesa Express Payment</DialogTitle>
                                            <DialogDescription>
                                                Enter your M-Pesa registered phone number to receive a payment prompt.
                                            </DialogDescription>
                                        </DialogHeader>
                                        <div className="py-4 space-y-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="phone-number">Phone Number</Label>
                                                <Input id="phone-number" value={mpesaPhoneNumber} onChange={(e) => setMpesaPhoneNumber(e.target.value)} />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="amount">Amount to Pay (KES)</Label>
                                                <Input id="amount" type="number" value={paymentAmount} onChange={(e) => setPaymentAmount(Number(e.target.value))}/>
                                            </div>
                                        </div>
                                        <DialogFooter>
                                            <DialogClose asChild>
                                                <Button variant="outline">Cancel</Button>
                                            </DialogClose>
                                            <Button onClick={handleMpesaPayment} disabled={isProcessingPayment}>
                                                {isProcessingPayment ? (
                                                    <>
                                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                        Processing...
                                                    </>
                                                ) : 'Confirm Payment'}
                                            </Button>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>

                                <Separator />
                                <div className="space-y-4">
                                    <h4 className="font-semibold text-sm">Pay with Card</h4>
                                    <Button className="w-full" variant="outline" onClick={handleCardPayment} disabled={data.summary.balance <= 0}>
                                        <CreditCard className="mr-2 h-4 w-4"/>
                                        Visa / Mastercard
                                    </Button>
                                </div>
                                <Separator />
                                <div className="space-y-4">
                                    <h4 className="font-semibold text-sm">Bank Transfer</h4>
                                    <div className="text-xs space-y-1 text-muted-foreground bg-muted/50 p-3 rounded-md">
                                        <p>Bank: <span className="font-bold">Kenya Commercial Bank</span></p>
                                        <p>Account: <span className="font-bold">1122334455</span></p>
                                        <p>Branch: <span className="font-bold">University Way</span></p>
                                        <p>Account Name: <span className="font-bold">EduSphere High School</span></p>
                                    </div>
                                    <Button className="w-full" variant="outline" disabled>
                                        <Upload className="mr-2 h-4 w-4"/>
                                        Upload Proof of Payment
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
                <TabsContent value="history" className="mt-6">
                     <Card>
                        <CardHeader>
                            <CardTitle>Overall Payment History</CardTitle>
                            <CardDescription>A record of all payments made for {childrenData.find(c => c.id === selectedChild)?.name}.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Card className="mb-6 bg-muted/50">
                                <CardHeader>
                                    <CardDescription>Total Amount Paid to Date</CardDescription>
                                    <CardTitle className="text-3xl">{formatCurrency(paymentHistory.totalPaid)}</CardTitle>
                                </CardHeader>
                            </Card>
                            <div className="w-full overflow-auto rounded-lg border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Term</TableHead>
                                            <TableHead>Payment Date</TableHead>
                                            <TableHead>Method</TableHead>
                                            <TableHead className="text-right">Amount (KES)</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {paymentHistory.payments.map(item => (
                                            <TableRow key={item.id}>
                                                <TableCell className="font-medium">{item.term}</TableCell>
                                                <TableCell>{clientReady ? new Date(item.date).toLocaleDateString('en-GB') : ''}</TableCell>
                                                <TableCell><Badge variant="outline">{item.method}</Badge></TableCell>
                                                <TableCell className="text-right font-semibold">{formatCurrency(item.amount)}</TableCell>
                                            </TableRow>
                                        ))}
                                        {paymentHistory.payments.length === 0 && (
                                            <TableRow>
                                                <TableCell colSpan={4} className="h-24 text-center">
                                                    No payment history for previous terms found.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
