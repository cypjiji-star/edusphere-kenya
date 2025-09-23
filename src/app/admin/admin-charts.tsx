"use client";

import * as React from "react";
import {
  Pie,
  PieChart,
  Cell,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import { CircleDollarSign, BarChart3, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import { firestore } from "@/lib/firebase";
import {
  collection,
  onSnapshot,
  query,
  getDocs,
  where,
} from "firebase/firestore";
import { useSearchParams } from "next/navigation";

const feeChartConfig = {
  Collected: { label: "Collected", color: "hsl(142.1 76.2% 42.2%)" },
  Outstanding: { label: "Outstanding", color: "hsl(47.9 95.8% 53.1%)" },
};

const performanceChartConfig = {
  avgScore: {
    label: "Avg. Score",
    color: "hsl(var(--primary))",
  },
};

export function FinanceSnapshot() {
  const searchParams = useSearchParams();
  const schoolId = searchParams.get("schoolId");
  const [financeData, setFinanceData] = React.useState({
    totalCollected: 0,
    totalBilled: 0,
  });
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    if (!schoolId) {
      setIsLoading(false);
      return;
    }

    const studentsQuery = query(
      collection(firestore, `schools/${schoolId}/users`),
      where("role", "==", "Student"),
    );
    const unsubscribeStudents = onSnapshot(
      studentsQuery,
      (snapshot) => {
        let totalBilled = 0;
        let totalCollected = 0;

        snapshot.forEach((doc) => {
          const student = doc.data();
          totalBilled += student.totalFee || 0;
          totalCollected += student.amountPaid || 0;
        });

        setFinanceData({ totalCollected, totalBilled });
        setIsLoading(false);
      },
      (error) => {
        console.error("Error fetching finance data from students:", error);
        setIsLoading(false);
      },
    );

    return () => unsubscribeStudents();
  }, [schoolId]);

  const totalOutstanding = financeData.totalBilled - financeData.totalCollected;
  const collectedPercentage =
    financeData.totalBilled > 0
      ? (financeData.totalCollected / financeData.totalBilled) * 100
      : 0;

  const feeData = [
    {
      status: "Collected",
      value: collectedPercentage,
      fill: "hsl(142.1 76.2% 42.2%)",
    },
    {
      status: "Outstanding",
      value: 100 - collectedPercentage,
      fill: "hsl(47.9 95.8% 53.1%)",
    },
  ];

  return (
    <Card className="hover:bg-muted/50 transition-colors">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CircleDollarSign className="h-6 w-6 text-primary" />
          School Fees Snapshot
        </CardTitle>
        <CardDescription>Yearly School Fee Collection Overview</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col md:flex-row items-center gap-6">
        {isLoading ? (
          <div className="w-full h-[200px] flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
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
                <p className="text-sm text-muted-foreground">
                  Total Expected Fees (This Year)
                </p>
                <p className="text-lg font-bold">
                  KES {financeData.totalBilled.toLocaleString()}
                </p>
              </div>
              <div className="flex justify-between items-center">
                <p className="text-sm text-muted-foreground">
                  Total Collected (This Year)
                </p>
                <p className="text-lg font-bold text-primary">
                  + KES {financeData.totalCollected.toLocaleString()}
                </p>
              </div>
              <Separator />
              <div className="flex justify-between items-center">
                <p className="text-sm font-semibold">Total Outstanding Fees</p>
                <p className={`text-xl font-bold text-destructive`}>
                  KES {totalOutstanding.toLocaleString()}
                </p>
              </div>
            </div>
          </>
        )}
      </CardContent>
      <CardFooter>
        <Button
          variant="outline"
          asChild
          className="w-full text-primary hover:text-primary"
        >
          <Link href={`/admin/fees?schoolId=${schoolId}`}>
            View Details
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

export function PerformanceSnapshot() {
  const searchParams = useSearchParams();
  const schoolId = searchParams.get("schoolId");
  const [performanceData, setPerformanceData] = React.useState<any[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    if (!schoolId) {
      setIsLoading(false);
      return;
    }

    const submissionsQuery = query(
      collection(firestore, `schools/${schoolId}/grades`),
    );
    const unsubscribe = onSnapshot(submissionsQuery, (snapshot) => {
      const subjectScores: Record<string, { total: number; count: number }> =
        {};

      snapshot.forEach((subDoc) => {
        const submission = subDoc.data();
        const score = parseInt(submission.grade, 10);
        if (!isNaN(score) && submission.subject) {
          if (!subjectScores[submission.subject]) {
            subjectScores[submission.subject] = { total: 0, count: 0 };
          }
          subjectScores[submission.subject].total += score;
          subjectScores[submission.subject].count++;
        }
      });

      const aggregatedData = Object.entries(subjectScores).map(
        ([subject, data]) => ({
          subject: subject,
          avgScore: Math.round(data.total / data.count),
        }),
      );

      setPerformanceData(aggregatedData);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [schoolId]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-6 w-6 text-primary" />
          Performance Snapshot
        </CardTitle>
        <CardDescription>
          Average scores by subject across the school.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="w-full h-[200px] flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <ChartContainer
            config={performanceChartConfig}
            className="h-[200px] w-full"
          >
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
      </CardContent>
      <CardFooter>
        <Button
          variant="outline"
          asChild
          className="w-full text-primary hover:text-primary"
        >
          <Link href={`/admin/grades?schoolId=${schoolId}`}>
            View Detailed Reports
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
