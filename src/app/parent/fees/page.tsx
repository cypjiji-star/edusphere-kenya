
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
import { CircleDollarSign, User, ChevronDown, FileDown, Printer, CreditCard } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

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
    const [clientReady, setClientReady] = React.useState(false);

    React.useEffect(() => {
        setClientReady(true);
    }, []);

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
                        <div className="flex w-full flex-col sm:flex-row md:w-auto items-center gap-2">
                            <Select defaultValue="term2-2024">
                                <SelectTrigger className="w-full md:w-auto">
                                    <SelectValue placeholder="Select Term" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="term2-2024">Term 2, 2024</SelectItem>
                                    <SelectItem value="term1-2024">Term 1, 2024</SelectItem>
                                </SelectContent>
                            </Select>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" className="w-full sm:w-auto" disabled>
                                        <FileDown className="mr-2 h-4 w-4" />
                                        Export
                                        <ChevronDown className="ml-2 h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                    <DropdownMenuItem disabled><Printer className="mr-2"/> Print Statement</DropdownMenuItem>
                                    <DropdownMenuItem disabled><FileDown className="mr-2"/> Export as PDF</DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                </CardHeader>
            </Card>

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
                        <CardTitle className="text-2xl">{getFeeStatusBadge(data.summary.status)}</CardTitle>
                    </CardHeader>
                </Card>
            </div>
            
            <div className="grid gap-6 lg:grid-cols-3">
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Fee Statement</CardTitle>
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
                                                    <Button variant="outline" size="sm" disabled>
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
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Button className="w-full" disabled>
                            <CreditCard className="mr-2 h-4 w-4"/>
                            Pay Online Now
                        </Button>
                        <Separator />
                        <div className="space-y-2">
                            <h4 className="font-semibold text-sm">Pay via M-PESA</h4>
                            <p className="text-sm">Paybill: <span className="font-bold">123456</span></p>
                            <p className="text-sm">Account: <span className="font-bold">{selectedChild === 'child-1' ? '1234' : '5678'}</span></p>
                        </div>
                         <Separator />
                        <div className="space-y-2">
                            <h4 className="font-semibold text-sm">Pay via Bank</h4>
                            <p className="text-sm">Bank: <span className="font-bold">Kenya Commercial Bank</span></p>
                            <p className="text-sm">Account: <span className="font-bold">1122334455</span></p>
                            <p className="text-sm">Branch: <span className="font-bold">University Way</span></p>
                        </div>
                    </CardContent>
                    <CardFooter>
                        <p className="text-xs text-muted-foreground">Online payments are processed securely. Feature coming soon.</p>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
}
