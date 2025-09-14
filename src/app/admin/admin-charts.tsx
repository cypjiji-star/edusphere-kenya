
'use client';

import * as React from 'react';
import { Pie, PieChart, Cell, BarChart, Bar, CartesianGrid, XAxis } from 'recharts';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart';
import { CircleDollarSign, BarChart3, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Separator } from '@/components/ui/separator';
import { firestore } from '@/lib/firebase';
import { collection, getDocs, onSnapshot, query, where } from 'firebase/firestore';


const feeChartConfig = {
    Collected: { label: 'Collected', color: 'hsl(142.1 76.2% 42.2%)' },
    Outstanding: { label: 'Outstanding', color: 'hsl(47.9 95.8% 53.1%)' },
};

const performanceChartConfig = {
  avgScore: {
    label: 'Avg. Score',
    color: 'hsl(var(--primary))',
  },
};

export function FinanceSnapshot() {
  const [financeData, setFinanceData] = React.useState({ totalCollected: 0, totalBilled: 1 });
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const studentsQuery = query(collection(firestore, 'students'));
    const unsubscribe = onSnapshot(studentsQuery, (snapshot) => {
        let totalBilled = 0;
        let totalPaid = 0;
        snapshot.forEach(doc => {
            totalBilled += doc.data().totalFee || 0;
            totalPaid += doc.data().amountPaid || 0;
        });
        setFinanceData({ totalCollected: totalPaid, totalBilled });
        setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const totalOutstanding = financeData.totalBilled - financeData.totalCollected;
  const collectedPercentage = financeData.totalBilled > 0 ? (financeData.totalCollected / financeData.totalBilled) * 100 : 0;

  const feeData = [
    { status: 'Collected', value: collectedPercentage, fill: 'hsl(142.1 76.2% 42.2%)' },
    { status: 'Outstanding', value: 100 - collectedPercentage, fill: 'hsl(47.9 95.8% 53.1%)' },
  ];
    
  return (
      <Card className="hover:bg-muted/50 transition-colors">
        <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <CircleDollarSign className="h-6 w-6 text-primary"/>
                Finance Snapshot
            </CardTitle>
            <CardDescription>Term 2 Collection Overview</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col md:flex-row items-center gap-6">
          {isLoading ? (
            <div className="w-full h-[200px] flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary"/></div>
          ) : (
            <>
            <div className="flex-1">
                <ChartContainer
                    config={feeChartConfig}
                    className="mx-auto aspect-square h-full max-h-[200px]"
                >
                    <PieChart>
                    <ChartTooltip
                        cursor={false}
                        content={<ChartTooltipContent hideLabel />}
                    />
                    <Pie
                        data={feeData}
                        dataKey="value"
                        nameKey="status"
                        innerRadius={50}
                        strokeWidth={5}
                    >
                        {feeData.map((entry) => (
                        <Cell key={`cell-${entry.status}`} fill={entry.fill} />
                        ))}
                    </Pie>
                    <ChartLegend
                        content={<ChartLegendContent nameKey="status" />}
                        className="-translate-y-2 flex-wrap gap-2 [&>*]:basis-1/2 [&>*]:justify-center"
                    />
                    </PieChart>
                </ChartContainer>
            </div>
            <div className="flex-1 space-y-4 w-full">
                <div className="flex justify-between items-center">
                    <p className="text-sm text-muted-foreground">Total Billed</p>
                    <p className="text-lg font-bold">KES {financeData.totalBilled.toLocaleString()}</p>
                </div>
                <div className="flex justify-between items-center">
                    <p className="text-sm text-muted-foreground">Total Collected</p>
                    <p className="text-lg font-bold text-green-600">+ KES {financeData.totalCollected.toLocaleString()}</p>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                    <p className="text-sm font-semibold">Outstanding</p>
                    <p className={`text-xl font-bold text-destructive`}>
                        KES {totalOutstanding.toLocaleString()}
                    </p>
                </div>
            </div>
            </>
          )}
        </CardContent>
      </Card>
  );
}

export function PerformanceSnapshot() {
  const [performanceData, setPerformanceData] = React.useState<any[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const gradesQuery = query(collection(firestore, 'assessments'));
    const unsubscribe = onSnapshot(gradesQuery, async (snapshot) => {
      // This is a simplified aggregation. Real-world scenarios would use a backend function.
      const subjectScores: Record<string, { total: number, count: number}> = {};
      
      for(const doc of snapshot.docs) {
          const assessment = doc.data();
          const submissionsSnapshot = await getDocs(collection(firestore, 'assessments', doc.id, 'submissions'));
          submissionsSnapshot.forEach(subDoc => {
              const submission = subDoc.data();
              const score = parseInt(submission.grade, 10);
              if (!isNaN(score) && assessment.subject) {
                  if (!subjectScores[assessment.subject]) {
                      subjectScores[assessment.subject] = { total: 0, count: 0 };
                  }
                  subjectScores[assessment.subject].total += score;
                  subjectScores[assessment.subject].count++;
              }
          });
      }

      const aggregatedData = Object.entries(subjectScores).map(([subject, data]) => ({
          subject: subject,
          avgScore: Math.round(data.total / data.count),
      }));

      setPerformanceData(aggregatedData);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-6 w-6 text-primary" />
          Performance Snapshot
        </CardTitle>
        <CardDescription>Average scores by subject across the school.</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
             <div className="w-full h-[200px] flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary"/></div>
        ) : (
            <ChartContainer config={performanceChartConfig} className="h-[200px] w-full">
            <BarChart
                accessibilityLayer
                data={performanceData}
                margin={{
                top: 20,
                right: 20,
                left: 0,
                bottom: 0,
                }}
            >
                <CartesianGrid vertical={false} />
                <XAxis
                dataKey="subject"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
                />
                <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent indicator="dot" />}
                />
                <Bar dataKey="avgScore" fill="var(--color-avgScore)" radius={8} />
            </BarChart>
            </ChartContainer>
        )}
         <div className="mt-4 flex justify-end">
            <Button variant="link" asChild>
                <Link href="/admin/grades">
                    View Detailed Reports
                    <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
            </Button>
        </div>
      </CardContent>
    </Card>
  );
}
