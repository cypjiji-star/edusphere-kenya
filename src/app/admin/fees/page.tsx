
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
import { CircleDollarSign, TrendingUp, TrendingDown, Hourglass, Loader2, CreditCard, Send, FileText, PlusCircle, Users, UserX, UserCheck, Trophy, AlertCircle, Calendar, Search } from 'lucide-react';
import { firestore } from '@/lib/firebase';
import { collection, query, onSnapshot, where, Timestamp, orderBy, limit, doc } from 'firebase/firestore';
import { useSearchParams } from 'next/navigation';
import { format, isPast, differenceInDays, formatDistanceToNow } from 'date-fns';
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
import Link from 'next/link';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';

const formatCurrency = (amount: number) => {
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
    class: string;
    avatarUrl: string;
    totalBilled: number;
    totalPaid: number;
    balance: number;
    status: 'Paid' | 'Partial' | 'Overdue';
    admissionNo?: string;
    transactions?: any[];
};


export default function FeesPage() {
  const searchParams = useSearchParams();
  const schoolId = searchParams.get('schoolId');
  const [financials, setFinancials] = React.useState({
    totalBilled: 0,
    totalCollected: 0,
    outstanding: 0,
    todaysCollections: 0,
  });
  const [collectionTrend, setCollectionTrend] = React.useState<any[]>([]);
  const [arrearsData, setArrearsData] = React.useState<any[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [studentsWithFees, setStudentsWithFees] = React.useState<{cleared: number; arrears: number; overdue: number}>({ cleared: 0, arrears: 0, overdue: 0 });
  const [topDebtors, setTopDebtors] = React.useState<any[]>([]);
  const [upcomingDeadline, setUpcomingDeadline] = React.useState<Date | null>(null);

  // New state for student profiles tab
  const [allStudents, setAllStudents] = React.useState<StudentFeeProfile[]>([]);
  const [filteredStudents, setFilteredStudents] = React.useState<StudentFeeProfile[]>([]);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [classFilter, setClassFilter] = React.useState('All Classes');
  const [statusFilter, setStatusFilter] = React.useState('All Statuses');
  const [classes, setClasses] = React.useState<string[]>(['All Classes']);
  const [selectedStudent, setSelectedStudent] = React.useState<StudentFeeProfile | null>(null);


  React.useEffect(() => {
    if (!schoolId) {
        setIsLoading(false);
        return;
    };
    setIsLoading(true);

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
      const classSet = new Set<string>();

      snapshot.forEach(doc => {
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
            name: data.name,
            class: data.class,
            avatarUrl: data.avatarUrl,
            totalBilled: data.totalFee || 0,
            totalPaid: data.amountPaid || 0,
            balance: studentBalance,
            status: status,
            admissionNo: data.admissionNumber,
        });

        if (data.class) classSet.add(data.class);

        if (studentBalance <= 0) {
            clearedCount++;
        } else {
            arrearsCount++;
            if(isPast(dueDate)) {
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
      setFinancials(prev => ({...prev, totalBilled, totalCollected, outstanding }));
      setUpcomingDeadline(nextDeadline);
      
      const collectedPercentage = totalBilled > 0 ? (totalCollected / totalBilled) * 100 : 0;
      setArrearsData([
          { name: 'Collected', value: collectedPercentage, fill: 'hsl(var(--chart-1))' },
          { name: 'Outstanding', value: 100 - collectedPercentage, fill: 'hsl(var(--chart-2))'},
      ]);

      setStudentsWithFees({ cleared: clearedCount, arrears: arrearsCount, overdue: overdueCount });
      setTopDebtors(studentDebtors.sort((a, b) => b.balance - a.balance).slice(0, 5));
      setAllStudents(studentProfiles);
      setFilteredStudents(studentProfiles); // Initially show all
      setClasses(['All Classes', ...Array.from(classSet)]);
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
      snapshot.forEach(doc => {
        todaysTotal += Math.abs(doc.data().amount);
      });
      setFinancials(prev => ({...prev, todaysCollections: todaysTotal}));
    });

    const trends = [ { month: 'Jan', collected: 4500000 }, { month: 'Feb', collected: 4800000 }, { month: 'Mar', collected: 5200000 }, { month: 'Apr', collected: 3900000 }, { month: 'May', collected: 6100000 }, ];
    setCollectionTrend(trends);
    
    setIsLoading(false);

    return () => {
      unsubStudents();
      unsubPayments();
    };
  }, [schoolId]);

  React.useEffect(() => {
    let students = allStudents;
    if (searchTerm) {
        students = students.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.admissionNo?.toLowerCase().includes(searchTerm.toLowerCase()));
    }
    if (classFilter !== 'All Classes') {
        students = students.filter(s => s.class === classFilter);
    }
    if (statusFilter !== 'All Statuses') {
        students = students.filter(s => s.status === statusFilter);
    }
    setFilteredStudents(students);
  }, [searchTerm, classFilter, statusFilter, allStudents]);

  const openStudentDialog = (student: StudentFeeProfile) => {
    // Here you would fetch detailed transactions for the student
    const mockTransactions = [
        { id: '1', date: new Timestamp(1675209600,0), description: 'Term 1 Fees', type: 'Charge', amount: 50000, balance: 50000 },
        { id: '2', date: new Timestamp(1675814400,0), description: 'Bank Deposit', type: 'Payment', amount: -25000, balance: 25000 },
    ];
    setSelectedStudent({ ...student, transactions: mockTransactions });
  }

  if (isLoading) {
    return <div className="p-8 h-full flex items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>
  }
  
  if (!schoolId) {
    return <div className="p-8">Error: School ID is missing from URL.</div>
  }

  return (
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
            <TabsList className="mb-4">
                <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
                <TabsTrigger value="students">Student Accounts</TabsTrigger>
            </TabsList>
            <TabsContent value="dashboard" className="space-y-6">
                 {upcomingDeadline && differenceInDays(upcomingDeadline, new Date()) <= 30 && (
                    <Alert className="mb-6">
                        <Calendar className="h-4 w-4" />
                        <AlertTitle>Upcoming Deadline</AlertTitle>
                        <AlertDescription>
                            A fee payment deadline is approaching on {format(upcomingDeadline, 'PPP')} ({formatDistanceToNow(upcomingDeadline, { addSuffix: true })}).
                        </AlertDescription>
                    </Alert>
                )}

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                    <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Total Expected Fees (Term)</CardTitle><TrendingUp className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{formatCurrency(financials.totalBilled)}</div><p className="text-xs text-muted-foreground">Based on current enrollment</p></CardContent></Card>
                    <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Total Collected (To Date)</CardTitle><TrendingUp className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold text-green-600">{formatCurrency(financials.totalCollected)}</div><p className="text-xs text-muted-foreground">Across all terms and sessions</p></CardContent></Card>
                    <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Total Outstanding Balance</CardTitle><TrendingDown className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold text-destructive">{formatCurrency(financials.outstanding)}</div><p className="text-xs text-muted-foreground">Aggregate of all student arrears</p></CardContent></Card>
                    <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Today's Collections</CardTitle><Hourglass className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{formatCurrency(financials.todaysCollections)}</div><p className="text-xs text-muted-foreground">{format(new Date(), 'PPP')}</p></CardContent></Card>
                </div>

                <Card><CardHeader><CardTitle>Quick Actions</CardTitle></CardHeader><CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4"><Button><CreditCard className="mr-2 h-4 w-4" />Record Payment</Button><Button><Send className="mr-2 h-4 w-4" />Send Reminders</Button><Button><FileText className="mr-2 h-4 w-4" />Generate Report</Button><Button><PlusCircle className="mr-2 h-4 w-4" />New Invoice</Button></CardContent></Card>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium flex items-center gap-2"><UserCheck className="h-4 w-4 text-green-600"/>Students with Cleared Balances</CardTitle></CardHeader><CardContent><div className="text-3xl font-bold text-green-600">{studentsWithFees.cleared}</div><p className="text-xs text-muted-foreground">students have a zero or positive balance.</p></CardContent></Card>
                    <Card className="border-red-500/50"><CardHeader className="pb-2"><CardTitle className="text-sm font-medium flex items-center gap-2 text-destructive"><UserX className="h-4 w-4"/>Students with Overdue Payments</CardTitle></CardHeader><CardContent><div className="text-3xl font-bold text-destructive">{studentsWithFees.overdue}</div><p className="text-xs text-muted-foreground">{studentsWithFees.arrears} total students have some arrears.</p></CardContent></Card>
                    <Card className="lg:col-span-1 md:col-span-2"><CardHeader><CardTitle className="flex items-center gap-2"><Trophy className="h-4 w-4 text-yellow-500"/>Top 5 Highest Balances</CardTitle></CardHeader><CardContent>
                        <Table><TableHeader><TableRow><TableHead>Student</TableHead><TableHead className="text-right">Balance</TableHead></TableRow></TableHeader>
                            <TableBody>
                                {topDebtors.map(student => (
                                    <TableRow key={student.id}><TableCell><div className="flex items-center gap-3"><Avatar className="h-8 w-8"><AvatarImage src={student.avatarUrl} /><AvatarFallback>{student.name.charAt(0)}</AvatarFallback></Avatar><div><div className="font-medium">{student.name}</div><div className="text-xs text-muted-foreground">{student.class}</div></div></div></TableCell><TableCell className="text-right font-semibold text-destructive">{formatCurrency(student.balance)}</TableCell></TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent></Card>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                    <Card><CardHeader><CardTitle>Collection vs. Arrears</CardTitle><CardDescription>A visual breakdown of collected fees against outstanding amounts for the current term.</CardDescription></CardHeader><CardContent><ChartContainer config={arrearsChartConfig} className="mx-auto aspect-square h-[250px]"><PieChart><ChartTooltip content={<ChartTooltipContent nameKey="name" hideLabel />} /><Pie data={arrearsData} dataKey="value" nameKey="name" innerRadius={60} strokeWidth={5}>{arrearsData.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.fill} />))}</Pie><ChartLegend content={<ChartLegendContent nameKey="name" />} className="-translate-y-2 flex-wrap gap-2 [&>*]:basis-1/2 [&>*]:justify-center" /></PieChart></ChartContainer></CardContent></Card>
                    <Card><CardHeader><CardTitle>Monthly Collection Trend</CardTitle><CardDescription>A look at the fee collection performance over the past few months.</CardDescription></CardHeader><CardContent><ChartContainer config={collectionTrendConfig} className="h-[250px] w-full"><BarChart data={collectionTrend}><CartesianGrid vertical={false} /><XAxis dataKey="month" tickLine={false} tickMargin={10} axisLine={false} /><YAxis tickFormatter={(value) => `${value / 1000000}M`} /><ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} /><Bar dataKey="collected" fill="var(--color-collected)" radius={8} /></BarChart></ChartContainer></CardContent></Card>
                </div>
            </TabsContent>
             <TabsContent value="students">
                <Card>
                    <CardHeader>
                        <CardTitle>Student Fee Accounts</CardTitle>
                        <CardDescription>Search for a student to view their detailed fee profile and payment history.</CardDescription>
                        <div className="mt-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            <div className="relative w-full md:max-w-sm">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input placeholder="Search by name or admission no..." className="pl-8" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                            </div>
                            <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
                                <Select value={classFilter} onValueChange={setClassFilter}>
                                    <SelectTrigger className="w-full md:w-[180px]"><SelectValue /></SelectTrigger>
                                    <SelectContent>{classes.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                                </Select>
                                <Select value={statusFilter} onValueChange={setStatusFilter}>
                                    <SelectTrigger className="w-full md:w-[180px]"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="All Statuses">All Statuses</SelectItem>
                                        <SelectItem value="Paid">Paid</SelectItem>
                                        <SelectItem value="Partial">Partial</SelectItem>
                                        <SelectItem value="Overdue">Overdue</SelectItem>
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
                                        <TableHead className="text-right">Balance</TableHead>
                                        <TableHead className="text-center">Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredStudents.map(student => (
                                        <DialogTrigger key={student.id} asChild>
                                            <TableRow className="cursor-pointer" onClick={() => openStudentDialog(student)}>
                                                <TableCell>
                                                    <div className="flex items-center gap-3">
                                                        <Avatar className="h-9 w-9"><AvatarImage src={student.avatarUrl} /><AvatarFallback>{student.name.charAt(0)}</AvatarFallback></Avatar>
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
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
      </div>
      <DialogContent className="sm:max-w-3xl">
        {selectedStudent && (
          <>
            <DialogHeader>
              <div className="flex items-start gap-4">
                <Avatar className="h-16 w-16"><AvatarImage src={selectedStudent.avatarUrl} /><AvatarFallback>{selectedStudent.name.charAt(0)}</AvatarFallback></Avatar>
                <div>
                  <DialogTitle className="text-2xl font-bold">{selectedStudent.name}</DialogTitle>
                  <DialogDescription>{selectedStudent.class} | Admission No: {selectedStudent.admissionNo}</DialogDescription>
                </div>
              </div>
            </DialogHeader>
            <Separator />
            <div className="grid grid-cols-3 gap-4 py-4 text-center">
                <div><p className="text-sm text-muted-foreground">Total Billed</p><p className="font-bold text-lg">{formatCurrency(selectedStudent.totalBilled)}</p></div>
                <div><p className="text-sm text-muted-foreground">Total Paid</p><p className="font-bold text-lg text-green-600">{formatCurrency(selectedStudent.totalPaid)}</p></div>
                <div><p className="text-sm text-muted-foreground">Balance</p><p className="font-bold text-lg text-destructive">{formatCurrency(selectedStudent.balance)}</p></div>
            </div>
            <div className="max-h-[40vh] overflow-y-auto">
                <Table>
                    <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Description</TableHead><TableHead className="text-right">Amount</TableHead><TableHead className="text-right">Balance</TableHead></TableRow></TableHeader>
                    <TableBody>
                        {selectedStudent.transactions?.map(tx => (
                            <TableRow key={tx.id}>
                                <TableCell>{tx.date.toDate().toLocaleDateString()}</TableCell>
                                <TableCell>{tx.description}</TableCell>
                                <TableCell className={`text-right ${tx.amount > 0 ? 'text-destructive' : 'text-green-600'}`}>{formatCurrency(tx.amount)}</TableCell>
                                <TableCell className="text-right font-medium">{formatCurrency(tx.balance)}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
