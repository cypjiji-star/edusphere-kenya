
'use client';

import * as React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, PieChart, Pie, Cell } from 'recharts';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart';
import { CircleDollarSign, TrendingUp, TrendingDown, Hourglass, Loader2, CreditCard, Send, FileText, PlusCircle, Users, UserX, UserCheck, Trophy } from 'lucide-react';
import { firestore } from '@/lib/firebase';
import { collection, query, onSnapshot, where, Timestamp, orderBy, limit } from 'firebase/firestore';
import { useSearchParams } from 'next/navigation';
import { format, isPast } from 'date-fns';
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
  const [studentsWithFees, setStudentsWithFees] = React.useState<{cleared: number, arrears: number, overdue: number}>({ cleared: 0, arrears: 0, overdue: 0 });
  const [topDebtors, setTopDebtors] = React.useState<any[]>([]);


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

      snapshot.forEach(doc => {
        const data = doc.data();
        const studentBalance = (data.totalFee || 0) - (data.amountPaid || 0);
        const dueDate = data.dueDate instanceof Timestamp ? data.dueDate.toDate() : (data.dueDate ? new Date(data.dueDate) : new Date());

        totalBilled += data.totalFee || 0;
        totalCollected += data.amountPaid || 0;

        if (studentBalance <= 0) {
            clearedCount++;
        } else {
            arrearsCount++;
            if(isPast(dueDate)) {
                overdueCount++;
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
      
      const collectedPercentage = totalBilled > 0 ? (totalCollected / totalBilled) * 100 : 0;
      setArrearsData([
          { name: 'Collected', value: collectedPercentage, fill: 'hsl(var(--chart-1))' },
          { name: 'Outstanding', value: 100 - collectedPercentage, fill: 'hsl(var(--chart-2))'},
      ]);

      setStudentsWithFees({ cleared: clearedCount, arrears: arrearsCount, overdue: overdueCount });
      setTopDebtors(studentDebtors.sort((a, b) => b.balance - a.balance).slice(0, 5));
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

    // Mock for collection trends
    const trends = [
        { month: 'Jan', collected: 4500000 },
        { month: 'Feb', collected: 4800000 },
        { month: 'Mar', collected: 5200000 },
        { month: 'Apr', collected: 3900000 },
        { month: 'May', collected: 6100000 },
    ];
    setCollectionTrend(trends);
    
    setIsLoading(false);

    return () => {
      unsubStudents();
      unsubPayments();
    };
  }, [schoolId]);

  if (isLoading) {
    return <div className="p-8 h-full flex items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>
  }
  
  if (!schoolId) {
    return <div className="p-8">Error: School ID is missing from URL.</div>
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="font-headline text-3xl font-bold flex items-center gap-2">
          <CircleDollarSign className="h-8 w-8 text-primary" />
          Financial Snapshot
        </h1>
        <p className="text-muted-foreground">An overview of the school's fee collection status.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expected Fees (Term)</CardTitle>
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
            <div className="text-2xl font-bold text-green-600">{formatCurrency(financials.totalCollected)}</div>
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

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Button>
            <CreditCard className="mr-2 h-4 w-4" />
            Record Payment
          </Button>
          <Button>
            <Send className="mr-2 h-4 w-4" />
            Send Reminders
          </Button>
          <Button>
            <FileText className="mr-2 h-4 w-4" />
            Generate Report
          </Button>
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            New Invoice
          </Button>
        </CardContent>
      </Card>
       <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2"><UserCheck className="h-4 w-4 text-green-600"/>Students with Cleared Balances</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{studentsWithFees.cleared}</div>
            <p className="text-xs text-muted-foreground">students have a zero or positive balance.</p>
          </CardContent>
        </Card>
        <Card className="border-red-500/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-destructive"><UserX className="h-4 w-4"/>Students with Overdue Payments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-destructive">{studentsWithFees.overdue}</div>
            <p className="text-xs text-muted-foreground">{studentsWithFees.arrears} total students have some arrears.</p>
          </CardContent>
        </Card>
        <Card className="lg:col-span-1 md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Trophy className="h-4 w-4 text-yellow-500"/>Top 5 Highest Balances</CardTitle>
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
                    {topDebtors.map(student => (
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
                            <TableCell className="text-right font-semibold text-destructive">{formatCurrency(student.balance)}</TableCell>
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
                    <XAxis
                      dataKey="month"
                      tickLine={false}
                      tickMargin={10}
                      axisLine={false}
                    />
                    <YAxis tickFormatter={(value) => `${value / 1000000}M`} />
                    <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
                    <Bar dataKey="collected" fill="var(--color-collected)" radius={8} />
                  </BarChart>
                </ChartContainer>
            </CardContent>
          </Card>
      </div>
    </div>
  );
}
