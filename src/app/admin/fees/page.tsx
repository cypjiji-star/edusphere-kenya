
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
import {
  CircleDollarSign,
  TrendingUp,
  TrendingDown,
  Hourglass,
  Loader2,
  CreditCard,
  Send,
  FileText,
  PlusCircle,
  Users,
  UserX,
  UserCheck,
  Trophy,
  AlertCircle,
  CalendarIcon,
  Printer,
  Mail,
  FileDown,
  ChevronDown,
  Search,
  Edit2,
  Trash2,
  Shield,
} from 'lucide-react';
import { firestore } from '@/lib/firebase';
import {
  collection,
  query,
  onSnapshot,
  where,
  Timestamp,
  orderBy,
  doc,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
  getDocs,
  setDoc,
  runTransaction,
} from 'firebase/firestore';
import { useSearchParams } from 'next/navigation';
import { format, isPast, differenceInDays, formatDistanceToNow, startOfMonth, endOfMonth, eachMonthOfInterval, getMonth, sub } from 'date-fns';
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
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { Calendar } from '@/components/ui/calendar';

const formatCurrency = (amount: number): string => {
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
  classId: string;
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
  notes?: string;
};

type FeeStructureItem = {
  id: string;
  category: string;
  amount: number;
};

type Class = {
  id: string;
  name: string;
};

interface Toast {
  title: string;
  description?: string;
  variant?: 'default' | 'destructive' | 'success' | 'info';
  duration?: number;
}

function ReceiptDialog({
  transaction,
  student,
  schoolName,
  open,
  onOpenChange,
}: {
  transaction: Transaction | null;
  student: StudentFeeProfile | null;
  schoolName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { toast } = useToast();

  if (!transaction || !student) return null;

  const printReceipt = () => {
    try {
      const printWindow = window.open('', 'PRINT', 'height=600,width=800');
      const receiptContent = document.getElementById('receipt-content');
      if (printWindow && receiptContent) {
        printWindow.document.write('<html><head><title>Receipt</title>');
        printWindow.document.write(
          '<style>body { font-family: sans-serif; } .receipt-container { width: 100%; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ccc; } h2, h3 { color: #333; } .paid-stamp { border: 3px solid #008000; color: #008000; padding: 10px; font-weight: bold; text-align: center; transform: rotate(-15deg); width: 100px; margin: 20px auto; } </style>'
        );
        printWindow.document.write('</head><body>');
        printWindow.document.write(receiptContent.innerHTML);
        printWindow.document.write('</body></html>');
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
        printWindow.close();
      } else {
        throw new Error('Unable to access receipt content or open print window');
      }
    } catch (e: unknown) {
      console.error('Error printing receipt:', e);
      const errorMessage = e instanceof Error ? e.message : 'Unknown error';
      toast({ title: 'Error', description: `Could not print receipt: ${errorMessage}`, variant: 'destructive' });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl" aria-describedby="receipt-description">
         <DialogHeader>
            <DialogTitle>{schoolName} - Payment Receipt</DialogTitle>
             <VisuallyHidden>
                <DialogDescription id="receipt-description">Official payment receipt for {student.name}</DialogDescription>
            </VisuallyHidden>
         </DialogHeader>
        <div id="receipt-content">
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
          <DialogClose asChild>
            <Button variant="outline" aria-label="Close receipt dialog">
              Close
            </Button>
          </DialogClose>
          <Button onClick={printReceipt} aria-label="Print receipt">
            <Printer className="mr-2 h-4 w-4" />
            Print Receipt
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function StudentProfileDialog({
  selectedStudent,
  schoolName,
  feeStructure,
  totalYearlyFee,
  handleSendStatement,
  selectedTransaction,
  setSelectedTransaction,
}: {
  selectedStudent: StudentFeeProfile | null;
  schoolName: string;
  feeStructure: FeeStructureItem[];
  totalYearlyFee: number;
  handleSendStatement: () => void;
  selectedTransaction: Transaction | null;
  setSelectedTransaction: React.Dispatch<React.SetStateAction<Transaction | null>>;
}) {
  if (!selectedStudent) return null;

  return (
    <DialogContent className="sm:max-w-3xl" aria-describedby="student-profile-description">
      <DialogHeader>
        <DialogTitle>{selectedStudent.name} - Fee Profile</DialogTitle>
        <VisuallyHidden>
            <DialogDescription id="student-profile-description">
            Fee profile and transaction history for {selectedStudent.name}
            </DialogDescription>
        </VisuallyHidden>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={selectedStudent.avatarUrl} />
              <AvatarFallback>{selectedStudent.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-2xl font-bold">{selectedStudent.name}</h2>
              <p className="text-muted-foreground">
                {selectedStudent.class} | Admission No: {selectedStudent.admissionNo}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleSendStatement} aria-label="Send fee statement">
                <Mail className="mr-2 h-4 w-4" />
                Send Statement
            </Button>
             <Button variant="secondary" aria-label="Print fee statement">
                <Printer className="mr-2 h-4 w-4" />
                Print Statement
            </Button>
          </div>
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
          <p className="font-semibold text-primary">{formatCurrency(selectedStudent.totalPaid)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Current Balance</p>
          <p className={`font-semibold text-lg ${selectedStudent.balance > 0 ? 'text-destructive' : 'text-primary'}`}>
            {formatCurrency(selectedStudent.balance)}
          </p>
        </div>
      </div>

      <Accordion type="single" defaultValue="fee-structure" collapsible className="w-full">
        <AccordionItem value="fee-structure">
          <AccordionTrigger className="text-lg font-semibold">Fee Structure</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-primary">Yearly Fees</h4>
                <div className="text-sm mt-2 space-y-1">
                  {feeStructure
                    .map((item) => (
                      <div key={item.id} className="flex justify-between">
                        <span>{item.category}</span>
                        <span className="font-medium">{formatCurrency(item.amount)}</span>
                      </div>
                    ))}
                </div>
              </div>
              <Separator />
              <div className="flex justify-between font-bold text-lg p-2 bg-muted rounded-md">
                <span>Total Yearly Fees:</span>
                <span>{formatCurrency(totalYearlyFee)}</span>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="transaction-ledger">
          <AccordionTrigger className="text-lg font-semibold">Transaction Ledger</AccordionTrigger>
          <AccordionContent>
            <div className="max-h-[30vh] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                    <TableHead className="text-right">Receipt</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedStudent.transactions?.map((tx) => (
                    <TableRow key={tx.id}>
                      <TableCell>{tx.date.toDate().toLocaleDateString()}</TableCell>
                      <TableCell>{tx.description}</TableCell>
                      <TableCell className={`text-right ${tx.amount > 0 ? 'text-destructive' : 'text-primary'}`}>
                        {formatCurrency(tx.amount)}
                      </TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(tx.balance)}</TableCell>
                      <TableCell className="text-right">
                        {tx.type === 'Payment' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedTransaction(tx)}
                            aria-label={`View receipt for ${tx.description}`}
                          >
                            View Receipt
                          </Button>
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
              <CardHeader>
                <CardTitle className="text-base">Add Charge / Credit</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="charge-desc">Description</Label>
                  <Input id="charge-desc" placeholder="e.g., Lost Textbook Fee" aria-label="Charge description" />
                </div>
                <div className="flex items-center gap-4">
                  <div className="space-y-2 flex-1">
                    <Label htmlFor="charge-amount">Amount</Label>
                    <Input
                      id="charge-amount"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="2500"
                      aria-label="Charge amount"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Type</Label>
                    <Select defaultValue="charge">
                      <SelectTrigger className="w-[120px]" aria-label="Select transaction type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="charge">Charge</SelectItem>
                        <SelectItem value="credit">Credit</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button size="sm" disabled aria-label="Add transaction">
                  Add Transaction
                </Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Apply Discount</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="discount-desc">Description</Label>
                  <Input id="discount-desc" placeholder="e.g., Sibling Discount" aria-label="Discount description" />
                </div>
                <div className="flex items-center gap-4">
                  <div className="space-y-2 flex-1">
                    <Label htmlFor="discount-amount">Value</Label>
                    <Input
                      id="discount-amount"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="10"
                      aria-label="Discount value"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Type</Label>
                    <Select defaultValue="percent">
                      <SelectTrigger className="w-[120px]" aria-label="Select discount type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percent">% (Percentage)</SelectItem>
                        <SelectItem value="fixed">KES (Fixed)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button size="sm" disabled aria-label="Apply discount">
                  Apply Discount
                </Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Apply Waiver</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="waiver-amount">Waiver Amount (KES)</Label>
                  <Input
                    id="waiver-amount"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="5000"
                    aria-label="Waiver amount"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="waiver-reason">Reason</Label>
                  <Textarea
                    id="waiver-reason"
                    placeholder="e.g., Staff Dependent, Charity Case"
                    aria-label="Waiver reason"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="waiver-approver">Approved By</Label>
                  <Input
                    id="waiver-approver"
                    placeholder="e.g., Principal Jane Doe"
                    aria-label="Waiver approver"
                  />
                </div>
                <Button size="sm" disabled aria-label="Apply waiver">
                  <Shield className="mr-2 h-4 w-4" />
                  Apply Waiver
                </Button>
              </CardContent>
            </Card>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </DialogContent>
  );
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
  const [studentsWithFees, setStudentsWithFees] = React.useState<{
    cleared: number;
    arrears: number;
    overdue: number;
  }>({ cleared: 0, arrears: 0, overdue: 0 });
  const [topDebtors, setTopDebtors] = React.useState<any[]>([]);
  const [upcomingDeadline, setUpcomingDeadline] = React.useState<Date | null>(null);

  // State for student profiles tab
  const [allStudents, setAllStudents] = React.useState<StudentFeeProfile[]>([]);
  const [filteredStudents, setFilteredStudents] = React.useState<StudentFeeProfile[]>([]);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [classFilter, setClassFilter] = React.useState('All Classes');
  const [statusFilter, setStatusFilter] = React.useState<string>('All Statuses');
  const [classes, setClasses] = React.useState<Class[]>([]);
  const [selectedStudent, setSelectedStudent] = React.useState<StudentFeeProfile | null>(null);
  const [selectedTransaction, setSelectedTransaction] = React.useState<Transaction | null>(null);
  const [schoolName, setSchoolName] = React.useState('');

  // Pagination state
  const [page, setPage] = React.useState(1);
  const studentsPerPage = 10;

  // State for manual payment dialog
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = React.useState(false);
  const [selectedStudentForPayment, setSelectedStudentForPayment] = React.useState('');
  const [paymentAmount, setPaymentAmount] = React.useState('');
  const [paymentMethod, setPaymentMethod] = React.useState('Cash');
  const [paymentDate, setPaymentDate] = React.useState<Date | undefined>(new Date());
  const [paymentNotes, setPaymentNotes] = React.useState('');
  const [isSavingPayment, setIsSavingPayment] = React.useState(false);
  
    // State for new invoice dialog
  const [isInvoiceDialogOpen, setIsInvoiceDialogOpen] = React.useState(false);
  const [newInvoiceStudentId, setNewInvoiceStudentId] = React.useState('');
  const [newInvoiceAmount, setNewInvoiceAmount] = React.useState('');
  const [newInvoiceDescription, setNewInvoiceDescription] = React.useState('');
  const [newInvoiceDueDate, setNewInvoiceDueDate] = React.useState<Date | undefined>(new Date());
  const [isSavingInvoice, setIsSavingInvoice] = React.useState(false);


  // State for Fee Structure tab
  const [feeStructure, setFeeStructure] = React.useState<FeeStructureItem[]>([]);
  const [selectedClassForStructure, setSelectedClassForStructure] = React.useState('');
  const [yearlyDueDate, setYearlyDueDate] = React.useState<Date>(new Date());
  const [newFeeItem, setNewFeeItem] = React.useState<{ category: string; amount: string }>({ category: '', amount: '' });
  const [totalYearlyFee, setTotalYearlyFee] = React.useState(0);
  const [isFeeStructureLoading, setIsFeeStructureLoading] = React.useState(false);

  React.useEffect(() => {
    if (!schoolId) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);

    const schoolRef = doc(firestore, 'schools', schoolId);
    getDoc(schoolRef).then((doc) => {
      if (doc.exists()) {
        setSchoolName(doc.data().name || 'School');
      }
    }).catch((e: unknown) => {
      console.error('Error fetching school name:', e);
      const errorMessage = e instanceof Error ? e.message : 'Unknown error';
      toast({ title: 'Error', description: `Failed to fetch school details: ${errorMessage}`, variant: 'destructive' });
    });

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
      const classMap = new Map<string, string>();

      snapshot.forEach((doc) => {
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
          name: data.name || '',
          classId: data.classId || '',
          class: data.class || '',
          avatarUrl: data.avatarUrl || '',
          totalBilled: data.totalFee || 0,
          totalPaid: data.amountPaid || 0,
          balance: studentBalance,
          status,
          admissionNo: data.admissionNumber,
        });

        if (data.classId && data.class) {
          classMap.set(data.classId, data.class);
        }

        if (studentBalance <= 0) {
          clearedCount++;
        } else {
          arrearsCount++;
          if (isPast(dueDate)) {
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
      setFinancials((prev) => ({ ...prev, totalBilled, totalCollected, outstanding }));
      setUpcomingDeadline(nextDeadline);

      const collectedPercentage = totalBilled > 0 ? (totalCollected / totalBilled) * 100 : 0;
      setArrearsData([
        { name: 'Collected', value: collectedPercentage, fill: 'hsl(var(--chart-1))' },
        { name: 'Outstanding', value: 100 - collectedPercentage, fill: 'hsl(var(--chart-2))' },
      ]);

      setStudentsWithFees({ cleared: clearedCount, arrears: arrearsCount, overdue: overdueCount });
      setTopDebtors(studentDebtors.sort((a, b) => b.balance - a.balance).slice(0, 5));
      setAllStudents(studentProfiles);
      setFilteredStudents(studentProfiles.slice(0, studentsPerPage));
      const classList = Array.from(classMap.entries()).map(([id, name]) => ({ id, name }));
      setClasses([{ id: 'All Classes', name: 'All Classes' }, ...classList]);
      if (!selectedClassForStructure && classList.length > 0) {
        setSelectedClassForStructure(classList[0].id);
      }
    }, (error: unknown) => {
      console.error('Error fetching students:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast({ title: 'Error', description: `Failed to load student data: ${errorMessage}`, variant: 'destructive' });
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
      snapshot.forEach((doc) => {
        todaysTotal += Math.abs(doc.data().amount);
      });
      setFinancials((prev) => ({ ...prev, todaysCollections: todaysTotal }));
    }, (error: unknown) => {
      console.error('Error fetching payments:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast({ title: 'Error', description: `Failed to load payment data: ${errorMessage}`, variant: 'destructive' });
    });

    const transactionsQuery = query(
      collection(firestore, `schools/${schoolId}/transactions`),
      where('type', '==', 'Payment')
    );
    const unsubTransactions = onSnapshot(transactionsQuery, (snapshot) => {
      const monthlyCollections: Record<string, number> = {};
      const months = eachMonthOfInterval({
        start: startOfMonth(sub(new Date(), { months: 5 })),
        end: endOfMonth(new Date()),
      });

      months.forEach((monthStart) => {
        const monthName = format(monthStart, 'MMM');
        monthlyCollections[monthName] = 0;
      });

      snapshot.forEach((doc) => {
        const tx = doc.data();
        const txMonth = getMonth(tx.date.toDate());
        const monthName = format(new Date(2000, txMonth, 1), 'MMM');
        if (monthlyCollections.hasOwnProperty(monthName)) {
          monthlyCollections[monthName] += Math.abs(tx.amount);
        }
      });

      setCollectionTrend(Object.entries(monthlyCollections).map(([month, collected]) => ({ month, collected })));
    }, (error: unknown) => {
      console.error('Error fetching transactions:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast({ title: 'Error', description: `Failed to load transaction data: ${errorMessage}`, variant: 'destructive' });
    });

    setIsLoading(false);

    return () => {
      unsubStudents();
      unsubPayments();
      unsubTransactions();
    };
  }, [schoolId, toast]);

  React.useEffect(() => {
    if (!schoolId || !selectedClassForStructure || selectedClassForStructure === 'All Classes') {
      setFeeStructure([]);
      return;
    }

    setIsFeeStructureLoading(true);
    const structureRef = doc(firestore, `schools/${schoolId}/fee-structures`, selectedClassForStructure);
    const unsubFeeStructure = onSnapshot(structureRef, (docSnap) => {
      if (docSnap.exists()) {
        setFeeStructure(docSnap.data().items || []);
      } else {
        setFeeStructure([]);
      }
      setIsFeeStructureLoading(false);
    }, (error: unknown) => {
      console.error('Error fetching fee structure:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast({ title: 'Error', description: `Failed to load fee structure: ${errorMessage}`, variant: 'destructive' });
      setIsFeeStructureLoading(false);
    });

    return () => unsubFeeStructure();
  }, [schoolId, selectedClassForStructure, toast]);

  React.useEffect(() => {
    let students = allStudents;
    if (searchTerm) {
      students = students.filter(
        (s) => s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.admissionNo?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (classFilter !== 'All Classes') {
      students = students.filter((s) => s.classId === classFilter);
    }
    if (statusFilter !== 'All Statuses') {
      students = students.filter((s) => s.status === statusFilter);
    }
    setFilteredStudents(students.slice((page - 1) * studentsPerPage, page * studentsPerPage));
  }, [searchTerm, classFilter, statusFilter, allStudents, page]);

  React.useEffect(() => {
    const totalFee = feeStructure.reduce((total, item) => total + item.amount, 0);
    setTotalYearlyFee(totalFee);
  }, [feeStructure]);

  const classPerformance = React.useMemo(() => {
    if (classFilter === 'All Classes' || filteredStudents.length === 0) return null;
    const billed = filteredStudents.reduce((acc, s) => acc + s.totalBilled, 0);
    const collected = filteredStudents.reduce((acc, s) => acc + s.totalPaid, 0);
    return {
      billed,
      collected,
      outstanding: billed - collected,
      collectionRate: billed > 0 ? Math.round((collected / billed) * 100) : 0,
    };
  }, [filteredStudents, classFilter]);

  const openStudentDialog = async (student: StudentFeeProfile) => {
    const transactionsQuery = query(
      collection(firestore, `schools/${schoolId}/students/${student.id}/transactions`),
      orderBy('date', 'desc')
    );
    try {
      const transactionsSnapshot = await getDocs(transactionsQuery);
      const transactions = transactionsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Transaction));
      setSelectedStudent({ ...student, transactions });
    } catch (e: unknown) {
      console.error('Error fetching transactions:', e);
      const errorMessage = e instanceof Error ? e.message : 'Unknown error';
      toast({ title: 'Error', description: `Failed to load transaction history: ${errorMessage}`, variant: 'destructive' });
    }
  };

  const handleRecordPayment = async () => {
    if (!schoolId || !selectedStudentForPayment || !paymentAmount || !paymentDate) {
      toast({ title: 'Missing Fields', description: 'Please select a student and enter an amount and date.', variant: 'destructive' });
      return;
    }
    const amount = Number(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({ title: 'Invalid Amount', description: 'Please enter a positive number for the payment amount.', variant: 'destructive' });
      return;
    }
    setIsSavingPayment(true);

    const studentRef = doc(firestore, `schools/${schoolId}/students`, selectedStudentForPayment);

    try {
      await runTransaction(firestore, async (transaction) => {
        const studentDoc = await transaction.get(studentRef);
        if (!studentDoc.exists()) throw new Error('Student not found');

        const currentData = studentDoc.data();
        const newPaid = (currentData.amountPaid || 0) + amount;
        const newBalance = (currentData.totalFee || 0) - newPaid;

        transaction.update(studentRef, {
          amountPaid: newPaid,
          balance: newBalance,
        });

        const studentTransactionRef = doc(collection(studentRef, 'transactions'));
        transaction.set(studentTransactionRef, {
          date: Timestamp.fromDate(paymentDate),
          description: `Payment via ${paymentMethod}`,
          type: 'Payment',
          amount: -amount,
          balance: newBalance,
          notes: paymentNotes,
        });

        const schoolTransactionRef = doc(collection(firestore, `schools/${schoolId}/transactions`));
        transaction.set(schoolTransactionRef, {
          studentId: selectedStudentForPayment,
          studentName: currentData.name,
          class: currentData.class,
          date: Timestamp.fromDate(paymentDate),
          description: `Payment via ${paymentMethod}`,
          type: 'Payment',
          amount: -amount,
          method: paymentMethod,
        });
      });

      toast({
        title: 'Payment Recorded',
        description: `A ${paymentMethod} payment of ${formatCurrency(amount)} has been recorded.`,
      });

      setSelectedStudentForPayment('');
      setPaymentAmount('');
      setPaymentNotes('');
      setIsPaymentDialogOpen(false);
    } catch (e: unknown) {
      console.error('Error recording payment:', e);
      const errorMessage = e instanceof Error ? e.message : 'Unknown error';
      toast({ title: 'Error', description: `Could not record payment: ${errorMessage}`, variant: 'destructive' });
    } finally {
      setIsSavingPayment(false);
    }
  };
  
    const handleCreateInvoice = async () => {
    if (!schoolId || !newInvoiceStudentId || !newInvoiceAmount || !newInvoiceDescription || !newInvoiceDueDate) {
      toast({ title: 'Missing Fields', description: 'Please fill out all invoice details.', variant: 'destructive' });
      return;
    }
    const amount = Number(newInvoiceAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({ title: 'Invalid Amount', description: 'Please enter a positive number for the invoice amount.', variant: 'destructive' });
      return;
    }
    setIsSavingInvoice(true);

    const studentRef = doc(firestore, `schools/${schoolId}/students`, newInvoiceStudentId);

    try {
      await runTransaction(firestore, async (transaction) => {
        const studentDoc = await transaction.get(studentRef);
        if (!studentDoc.exists()) throw new Error('Student not found');

        const currentData = studentDoc.data();
        const newTotalFee = (currentData.totalFee || 0) + amount;
        const newBalance = (currentData.balance || 0) + amount;

        transaction.update(studentRef, {
          totalFee: newTotalFee,
          balance: newBalance,
        });

        const studentTransactionRef = doc(collection(studentRef, 'transactions'));
        transaction.set(studentTransactionRef, {
          date: Timestamp.now(),
          description: newInvoiceDescription,
          type: 'Charge',
          amount: amount,
          balance: newBalance,
          dueDate: Timestamp.fromDate(newInvoiceDueDate),
        });
      });

      toast({
        title: 'Invoice Created',
        description: `An invoice for ${formatCurrency(amount)} has been added to the student's account.`,
      });

      setNewInvoiceStudentId('');
      setNewInvoiceAmount('');
      setNewInvoiceDescription('');
      setIsInvoiceDialogOpen(false);
    } catch (e: unknown) {
      console.error('Error creating invoice:', e);
      const errorMessage = e instanceof Error ? e.message : 'Unknown error';
      toast({ title: 'Error', description: `Could not create invoice: ${errorMessage}`, variant: 'destructive' });
    } finally {
      setIsSavingInvoice(false);
    }
  };

  const handleSaveFeeItem = async () => {
    const { category, amount } = newFeeItem;
    if (!category || !amount || !schoolId || !selectedClassForStructure) {
      toast({ title: 'Missing Information', description: 'Please provide a category and amount.', variant: 'destructive' });
      return;
    }

    const parsedAmount = Number(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      toast({ title: 'Invalid Amount', description: 'Please enter a positive number.', variant: 'destructive' });
      return;
    }

    const newItem: FeeStructureItem = {
      id: doc(collection(firestore, `schools/${schoolId}/fee-structures`)).id,
      category,
      amount: parsedAmount,
    };

    try {
      const structureRef = doc(firestore, `schools/${schoolId}/fee-structures`, selectedClassForStructure);
      const updatedStructure = [...feeStructure, newItem];
      await setDoc(structureRef, { items: updatedStructure }, { merge: true });
      toast({ title: 'New Fee Item Added', description: `${category} added successfully.` });
      setNewFeeItem({ category: '', amount: '' });
    } catch (e: unknown) {
      console.error('Error saving fee item:', e);
      const errorMessage = e instanceof Error ? e.message : 'Unknown error';
      toast({ title: 'Error', description: `Could not save fee item: ${errorMessage}`, variant: 'destructive' });
    }
  };

  const handleDeleteFeeItem = async (itemId: string) => {
    if (!window.confirm('Are you sure you want to delete this fee item?')) return;
    if (!schoolId || !selectedClassForStructure) return;

    try {
      const structureRef = doc(firestore, `schools/${schoolId}/fee-structures`, selectedClassForStructure);
      const updatedStructure = feeStructure.filter((item) => item.id !== itemId);
      await setDoc(structureRef, { items: updatedStructure });
      toast({ title: 'Fee Item Deleted', description: 'Fee item removed successfully.' });
    } catch (e: unknown) {
      console.error('Error deleting fee item:', e);
      const errorMessage = e instanceof Error ? e.message : 'Unknown error';
      toast({ title: 'Error', description: `Could not delete fee item: ${errorMessage}`, variant: 'destructive' });
    }
  };

  const handleSaveClassFees = async () => {
    if (!selectedClassForStructure || !schoolId || totalYearlyFee <= 0) {
        toast({ title: 'Invalid Data', description: 'Please select a class and ensure the total fee is positive.', variant: 'destructive' });
        return;
    }

    try {
        await runTransaction(firestore, async (transaction) => {
            const structureRef = doc(firestore, `schools/${schoolId}/fee-structures`, selectedClassForStructure);
            transaction.set(structureRef, { items: feeStructure }, { merge: true });

            const studentsInClassQuery = query(
                collection(firestore, `schools/${schoolId}/students`),
                where('classId', '==', selectedClassForStructure)
            );
            const studentsSnapshot = await getDocs(studentsInClassQuery);

            const fee = totalYearlyFee;
            const dueDate = yearlyDueDate;

            for (const studentDoc of studentsSnapshot.docs) {
                const studentRef = doc(firestore, `schools/${schoolId}/students`, studentDoc.id);
                const currentStudentSnap = await transaction.get(studentRef); // Read within transaction
                if (!currentStudentSnap.exists()) continue;

                const studentData = currentStudentSnap.data();
                const newTotalFee = (studentData.totalFee || 0) + fee;
                const newBalance = (studentData.balance || 0) + fee;

                transaction.update(studentRef, {
                    totalFee: newTotalFee,
                    balance: newBalance,
                    dueDate: Timestamp.fromDate(dueDate),
                });

                const transactionRef = doc(collection(studentRef, 'transactions'));
                transaction.set(transactionRef, {
                    date: Timestamp.now(),
                    description: `Annual School Fees`,
                    type: 'Charge',
                    amount: fee,
                    balance: newBalance,
                });
            }
        });

        toast({
            title: 'Fees Applied!',
            description: `Annual fee of ${formatCurrency(totalYearlyFee)} has been applied to all students in ${classes.find(c => c.id === selectedClassForStructure)?.name}.`,
        });
    } catch (e: unknown) {
        console.error('Error applying fees:', e);
        const errorMessage = e instanceof Error ? e.message : 'Unknown error';
        toast({ title: 'Error', description: `Failed to apply fees: ${errorMessage}`, variant: 'destructive' });
    }
  };

  const handleSendReminders = () => {
    toast({
      title: 'Sending Reminders...',
      description: `Bulk reminders are being sent to parents with overdue balances.`,
    });
  };

  const handleSendStatement = () => {
    toast({
      title: 'Statement Sent',
      description: `The fee statement for ${selectedStudent?.name} has been sent to their parent.`,
    });
  };

  const handleExport = (format: 'PDF' | 'CSV') => {
    try {
      if (format === 'PDF') {
        const doc = new jsPDF();
        doc.text(`${schoolName} - Student Fee Report`, 14, 16);
        const tableData = filteredStudents.map((s) => [
          s.name,
          s.class,
          formatCurrency(s.balance),
          s.status,
        ]);
        (doc as any).autoTable({
          startY: 22,
          head: [['Student', 'Class', 'Balance', 'Status']],
          body: tableData,
        });
        doc.save('student_fees.pdf');
      } else {
        const headers = ['Name', 'Class', 'Total Billed', 'Total Paid', 'Balance', 'Status'];
        const csvContent = [
          headers.join(','),
          ...filteredStudents.map((s) =>
            [
              `"${s.name.replace(/"/g, '""')}"`,
              `"${s.class.replace(/"/g, '""')}"`,
              s.totalBilled,
              s.totalPaid,
              s.balance,
              s.status,
            ].join(',')
          ),
        ].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', 'student_fees.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
      toast({ title: 'Export Successful', description: `Student fee data has been exported as a ${format} file.` });
    } catch (e: unknown) {
      console.error('Error exporting data:', e);
      const errorMessage = e instanceof Error ? e.message : 'Unknown error';
      toast({ title: 'Error', description: `Could not export data: ${errorMessage}`, variant: 'destructive' });
    }
  };
  
    const handleExportSummary = (format: 'PDF' | 'CSV') => {
     try {
      if (format === 'PDF') {
        const doc = new jsPDF();
        doc.text(`${schoolName} - Financial Summary`, 14, 16);
        (doc as any).autoTable({
          startY: 22,
          body: [
            ['Total Expected Fees (Annual)', formatCurrency(financials.totalBilled)],
            ['Total Collected (To Date)', formatCurrency(financials.totalCollected)],
            ['Total Outstanding Balance', formatCurrency(financials.outstanding)],
            ["Today's Collections", formatCurrency(financials.todaysCollections)],
          ],
        });
        doc.save('financial_summary.pdf');
      } else {
        const headers = ['Metric', 'Amount'];
        const csvContent = [
          headers.join(','),
          `"Total Expected Fees (Annual)",${financials.totalBilled}`,
          `"Total Collected (To Date)",${financials.totalCollected}`,
          `"Total Outstanding Balance",${financials.outstanding}`,
          `"Today's Collections",${financials.todaysCollections}`,
        ].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', 'financial_summary.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
      toast({ title: 'Export Successful', description: `Financial summary has been exported as a ${format} file.` });
    } catch (e: unknown) {
      console.error('Error exporting data:', e);
      const errorMessage = e instanceof Error ? e.message : 'Unknown error';
      toast({ title: 'Error', description: `Could not export data: ${errorMessage}`, variant: 'destructive' });
    }
  };

  const getFeeStatusBadge = (status: StudentFeeProfile['status']) => {
    switch (status) {
      case 'Paid':
        return (
          <Badge variant="default" className="bg-primary hover:bg-primary/90">
            Paid
          </Badge>
        );
      case 'Partial':
        return (
          <Badge variant="secondary" className="bg-blue-500 text-white hover:bg-blue-500">
            Partial
          </Badge>
        );
      case 'Overdue':
        return <Badge variant="destructive">Overdue</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };
  
    const handleBulkPrint = () => {
    toast({
      title: 'Printing Class Report...',
      description: `Generating statements for ${filteredStudents.length} students.`,
    });
    // This is a placeholder for a more complex print generation logic
    setTimeout(() => window.print(), 1000);
  };


  if (isLoading) {
    return (
      <div className="p-8 h-full flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" aria-label="Loading" />
      </div>
    );
  }

  if (!schoolId) {
    return (
      <div className="p-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>School ID is missing from URL.</AlertDescription>
        </Alert>
      </div>
    );
  }

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
                  <CalendarIcon className="h-4 w-4" />
                  <AlertTitle>Upcoming Deadline</AlertTitle>
                  <AlertDescription>
                    A fee payment deadline is approaching on {format(upcomingDeadline, 'PPP')} (
                    {formatDistanceToNow(upcomingDeadline, { addSuffix: true })}.
                  </AlertDescription>
                </Alert>
              )}

              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Expected Fees (Annual)</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(financials.totalBilled)}</div>
                    <p className="text-xs text-muted-foreground">Based on current enrollment</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Collected (To Date)</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-primary">{formatCurrency(financials.totalCollected)}</div>
                    <p className="text-xs text-muted-foreground">Across all terms and sessions</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Outstanding Balance</CardTitle>
                    <TrendingDown className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-destructive">{formatCurrency(financials.outstanding)}</div>
                    <p className="text-xs text-muted-foreground">Aggregate of all student arrears</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Today's Collections</CardTitle>
                    <Hourglass className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(financials.todaysCollections)}</div>
                    <p className="text-xs text-muted-foreground">{format(new Date(), 'PPP')}</p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
                    <DialogTrigger asChild>
                      <Button aria-label="Record payment">
                        <CreditCard className="mr-2 h-4 w-4" />
                        Record Payment
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-lg" aria-describedby="payment-dialog-description">
                      <DialogHeader>
                        <DialogTitle>Record Manual Payment</DialogTitle>
                        <VisuallyHidden>
                            <DialogDescription id="payment-dialog-description">
                            Record a cash, cheque, or bank deposit payment for a student
                            </DialogDescription>
                        </VisuallyHidden>
                        <p className="text-muted-foreground">Record a cash, cheque, or bank deposit payment.</p>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="payment-student">Student</Label>
                          <Select value={selectedStudentForPayment} onValueChange={setSelectedStudentForPayment}>
                            <SelectTrigger id="payment-student" aria-label="Select student">
                              <SelectValue placeholder="Select a student..." />
                            </SelectTrigger>
                            <SelectContent>
                              {allStudents.map((s) => (
                                <SelectItem key={s.id} value={s.id}>
                                  {s.name} ({s.class})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="payment-amount">Amount (KES)</Label>
                            <Input
                              id="payment-amount"
                              type="number"
                              min="0"
                              step="0.01"
                              placeholder="e.g., 10000"
                              value={paymentAmount}
                              onChange={(e) => setPaymentAmount(e.target.value)}
                              aria-label="Payment amount"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="payment-method">Payment Method</Label>
                            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                              <SelectTrigger id="payment-method" aria-label="Select payment method">
                                <SelectValue />
                              </SelectTrigger>
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
                              <Button
                                variant="outline"
                                className={cn('w-full font-normal', !paymentDate && 'text-muted-foreground')}
                                aria-label="Select payment date"
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {paymentDate ? format(paymentDate, 'PPP') : 'Pick a date'}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent>
                              <Calendar mode="single" selected={paymentDate} onSelect={setPaymentDate} />
                            </PopoverContent>
                          </Popover>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="payment-notes">Notes / Reference No.</Label>
                          <Textarea
                            id="payment-notes"
                            placeholder="e.g., Cheque no. 12345, Deposit slip ref..."
                            value={paymentNotes}
                            onChange={(e) => setPaymentNotes(e.target.value)}
                            aria-label="Payment notes"
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <DialogClose asChild>
                          <Button variant="outline">Cancel</Button>
                        </DialogClose>
                        <Button onClick={handleRecordPayment} disabled={isSavingPayment} aria-label="Save payment">
                          {isSavingPayment && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          Save Payment
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                  <Button onClick={handleSendReminders} aria-label="Send reminders">
                    <Send className="mr-2 h-4 w-4" />
                    Send Reminders
                  </Button>
                   <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="secondary" aria-label="Generate report">
                            <FileText className="mr-2 h-4 w-4" />
                            Generate Report
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => handleExportSummary('PDF')}>Export Summary (PDF)</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleExportSummary('CSV')}>Export Summary (CSV)</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
                  <Dialog open={isInvoiceDialogOpen} onOpenChange={setIsInvoiceDialogOpen}>
                    <DialogTrigger asChild>
                         <Button aria-label="Create new invoice">
                            <PlusCircle className="mr-2 h-4 w-4" />
                            New Invoice
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Create New Invoice</DialogTitle>
                            <DialogDescription>Create a one-off charge for a specific student.</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="invoice-student">Student</Label>
                                <Select value={newInvoiceStudentId} onValueChange={setNewInvoiceStudentId}>
                                    <SelectTrigger id="invoice-student"><SelectValue placeholder="Select a student..." /></SelectTrigger>
                                    <SelectContent>
                                    {allStudents.map((s) => (
                                        <SelectItem key={s.id} value={s.id}>{s.name} ({s.class})</SelectItem>
                                    ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="invoice-desc">Description</Label>
                                <Input id="invoice-desc" placeholder="e.g., Replacement ID Card" value={newInvoiceDescription} onChange={(e) => setNewInvoiceDescription(e.target.value)} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="invoice-amount">Amount (KES)</Label>
                                    <Input id="invoice-amount" type="number" min="0" placeholder="500" value={newInvoiceAmount} onChange={(e) => setNewInvoiceAmount(e.target.value)} />
                                </div>
                                 <div className="space-y-2">
                                    <Label>Due Date</Label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                        <Button variant="outline" className={cn('w-full font-normal', !newInvoiceDueDate && 'text-muted-foreground')}>
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {newInvoiceDueDate ? format(newInvoiceDueDate, 'PPP') : 'Pick a date'}
                                        </Button>
                                        </PopoverTrigger>
                                        <PopoverContent><Calendar mode="single" selected={newInvoiceDueDate} onSelect={setNewInvoiceDueDate} /></PopoverContent>
                                    </Popover>
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                            <Button onClick={handleCreateInvoice} disabled={isSavingInvoice}>
                                {isSavingInvoice && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Add Charge to Account
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </CardContent>
              </Card>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <UserCheck className="h-4 w-4 text-primary" />
                      Students with Cleared Balances
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-primary">{studentsWithFees.cleared}</div>
                    <p className="text-xs text-muted-foreground">students have a zero or positive balance.</p>
                  </CardContent>
                </Card>
                <Card className="border-red-500/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2 text-destructive">
                      <UserX className="h-4 w-4" />
                      Students with Overdue Payments
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-destructive">{studentsWithFees.overdue}</div>
                    <p className="text-xs text-muted-foreground">{studentsWithFees.arrears} total students have some arrears.</p>
                  </CardContent>
                </Card>
                <Card className="lg:col-span-1 md:col-span-2">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Trophy className="h-4 w-4 text-yellow-500" />
                      Top 5 Highest Balances
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Student</TableHead>
                          <TableHead className="text-right">Balance</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {topDebtors.map((student) => (
                          <TableRow key={student.id}>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <Avatar className="h-8 w-8">
                                  <AvatarImage src={student.avatarUrl} />
                                  <AvatarFallback>{student.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div>
                                  <div className="font-medium">{student.name}</div>
                                  <div className="text-xs text-muted-foreground">{student.class}</div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-right font-semibold text-destructive">
                              {formatCurrency(student.balance)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Collection vs. Arrears</CardTitle>
                    <CardDescription>A visual breakdown of collected fees against outstanding amounts for the current term.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer config={arrearsChartConfig} className="mx-auto aspect-square h-[250px]">
                      <PieChart>
                        <ChartTooltip content={<ChartTooltipContent nameKey="name" hideLabel />} />
                        <Pie data={arrearsData} dataKey="value" nameKey="name" innerRadius={60} strokeWidth={5}>
                          {arrearsData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Pie>
                        <ChartLegend
                          content={<ChartLegendContent nameKey="name" />}
                          className="-translate-y-2 flex-wrap gap-2 [&>*]:basis-1/2 [&>*]:justify-center"
                        />
                      </PieChart>
                    </ChartContainer>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Monthly Collection Trend</CardTitle>
                    <CardDescription>A look at the fee collection performance over the past few months.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer config={collectionTrendConfig} className="h-[250px] w-full">
                      <BarChart data={collectionTrend}>
                        <CartesianGrid vertical={false} />
                        <XAxis dataKey="month" tickLine={false} tickMargin={10} axisLine={false} />
                        <YAxis tickFormatter={(value) => `${Number(value) / 1000000}M`} />
                        <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
                        <Bar dataKey="collected" fill="var(--color-collected)" radius={8} />
                      </BarChart>
                    </ChartContainer>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            <TabsContent value="students">
              <Card>
                <CardHeader>
                  <CardTitle>Debtors & Student Accounts</CardTitle>
                  <CardDescription>
                    Search for a student to view their detailed fee profile and payment history. Filter by status to see a list of debtors.
                  </CardDescription>
                  <div className="mt-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="relative w-full md:max-w-sm">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search by name or admission no..."
                        className="pl-8"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        aria-label="Search students"
                      />
                    </div>
                    <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
                      <Select value={classFilter} onValueChange={setClassFilter}>
                        <SelectTrigger className="w-full md:w-[180px]" aria-label="Select class filter">
                          <SelectValue placeholder="All Classes" />
                        </SelectTrigger>
                        <SelectContent>
                          {classes.map((c) => (
                            <SelectItem key={c.id} value={c.id}>
                              {c.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select value={statusFilter} onValueChange={(v: string) => setStatusFilter(v)}>
                        <SelectTrigger className="w-full md:w-[180px]" aria-label="Select status filter">
                          <SelectValue placeholder="All Statuses" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="All Statuses">All Statuses</SelectItem>
                          <SelectItem value="Paid">Paid</SelectItem>
                          <SelectItem value="Partial">Partial</SelectItem>
                          <SelectItem value="Overdue">Overdue</SelectItem>
                        </SelectContent>
                      </Select>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" aria-label="Export options">
                            <FileDown className="mr-2 h-4 w-4" />
                            Export / Print
                            <ChevronDown className="ml-2 h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem onClick={() => handleExport('PDF')}>Export as PDF</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleExport('CSV')}>Export as CSV</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={handleBulkPrint}><Printer className="mr-2 h-4 w-4" /> Print Class Report</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {classPerformance && (
                    <Card className="mb-6 bg-muted/50">
                      <CardHeader>
                        <CardTitle className="text-lg">Summary for {classes.find((c) => c.id === classFilter)?.name || classFilter}</CardTitle>
                      </CardHeader>
                      <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                        <div>
                          <p className="text-xs text-muted-foreground">Total Billed</p>
                          <p className="font-bold text-lg">{formatCurrency(classPerformance.billed)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Total Collected</p>
                          <p className="font-bold text-lg text-primary">{formatCurrency(classPerformance.collected)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Outstanding</p>
                          <p className="font-bold text-lg text-destructive">{formatCurrency(classPerformance.outstanding)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Collection Rate</p>
                          <p className="font-bold text-lg text-primary">{classPerformance.collectionRate}%</p>
                        </div>
                      </CardContent>
                    </Card>
                  )}
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
                        {filteredStudents.map((student) => (
                          <DialogTrigger key={student.id} asChild>
                            <TableRow
                              className="cursor-pointer"
                              onClick={() => openStudentDialog(student)}
                              role="button"
                              tabIndex={0}
                              onKeyDown={(e) => e.key === 'Enter' && openStudentDialog(student)}
                            >
                              <TableCell>
                                <div className="flex items-center gap-3">
                                  <Avatar className="h-9 w-9">
                                    <AvatarImage src={student.avatarUrl} />
                                    <AvatarFallback>{student.name.charAt(0)}</AvatarFallback>
                                  </Avatar>
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
                  <div className="flex justify-between items-center mt-4">
                    <Button
                      variant="outline"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      aria-label="Previous page"
                    >
                      Previous
                    </Button>
                    <span>
                      Page {page} of {Math.ceil(allStudents.length / studentsPerPage)}
                    </span>
                    <Button
                      variant="outline"
                      onClick={() => setPage((p) => p + 1)}
                      disabled={page * studentsPerPage >= allStudents.length}
                      aria-label="Next page"
                    >
                      Next
                    </Button>
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
                      <SelectTrigger id="class-structure-select" className="w-full md:w-72 mt-2" aria-label="Select class for fee structure">
                        <SelectValue placeholder="Select a class..." />
                      </SelectTrigger>
                      <SelectContent>
                        {classes.filter((c) => c.id !== 'All Classes').map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {isFeeStructureLoading ? (
                    <div className="flex justify-center">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" aria-label="Loading fee structure" />
                    </div>
                  ) : (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Yearly Fee Structure</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Category</TableHead>
                              <TableHead className="text-right">Amount (KES)</TableHead>
                              <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {feeStructure.map((item) => (
                              <TableRow key={item.id}>
                                <TableCell className="font-medium">{item.category}</TableCell>
                                <TableCell className="text-right">{formatCurrency(item.amount)}</TableCell>
                                <TableCell className="text-right space-x-2">
                                  <Button variant="ghost" size="icon" disabled aria-label="Edit fee item">
                                    <Edit2 className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleDeleteFeeItem(item.id)}
                                    aria-label={`Delete ${item.category} fee item`}
                                  >
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                            <TableRow>
                              <TableCell>
                                <Input
                                  placeholder="New Item"
                                  value={newFeeItem.category}
                                  onChange={(e) => setNewFeeItem((prev) => ({ ...prev, category: e.target.value }))}
                                  aria-label="New fee item category"
                                />
                              </TableCell>
                              <TableCell className="text-right">
                                <Input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  placeholder="Amount"
                                  className="ml-auto text-right w-32"
                                  value={newFeeItem.amount}
                                  onChange={(e) => setNewFeeItem((prev) => ({ ...prev, amount: e.target.value }))}
                                  aria-label="New fee item amount"
                                />
                              </TableCell>
                              <TableCell className="text-right">
                                <Button size="sm" onClick={handleSaveFeeItem} aria-label="Add new fee item">
                                  Add
                                </Button>
                              </TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </CardContent>
                      <CardFooter className="bg-muted/50 p-4 flex justify-between items-center rounded-b-lg">
                        <div className="font-semibold">Total Yearly Fee: {formatCurrency(totalYearlyFee)}</div>
                        <div className="flex items-center gap-2">
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant="outline" className="font-normal w-48 justify-start" aria-label="Select due date">
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {format(yearlyDueDate, 'PPP')}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent>
                              <Calendar mode="single" selected={yearlyDueDate} onSelect={(date) => date && setYearlyDueDate(date)} />
                            </PopoverContent>
                          </Popover>
                          <Button onClick={handleSaveClassFees} aria-label="Apply fees to class">
                            Save & Apply Fees
                          </Button>
                        </div>
                      </CardFooter>
                    </Card>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
          <StudentProfileDialog
            selectedStudent={selectedStudent}
            schoolName={schoolName}
            feeStructure={feeStructure}
            totalYearlyFee={totalYearlyFee}
            handleSendStatement={handleSendStatement}
            selectedTransaction={selectedTransaction}
            setSelectedTransaction={setSelectedTransaction}
          />
          <ReceiptDialog
            transaction={selectedTransaction}
            student={selectedStudent}
            schoolName={schoolName}
            open={!!selectedTransaction}
            onOpenChange={(open) => !open && setSelectedTransaction(null)}
          />
        </div>
      </Dialog>
    </>
  );
}

