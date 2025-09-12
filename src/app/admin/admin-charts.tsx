
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
import { CircleDollarSign, BarChart3, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';


const feeData = [
    { status: 'Collected', value: 82, fill: 'hsl(var(--chart-1))' },
    { status: 'Outstanding', value: 18, fill: 'hsl(var(--chart-2))' },
];

const feeChartConfig = {
    Collected: { label: 'Collected', color: 'hsl(var(--chart-1))' },
    Outstanding: { label: 'Outstanding', color: 'hsl(var(--chart-2))' },
} satisfies React.ComponentProps<typeof ChartContainer>["config"];

export function FinanceSnapshot() {
  return (
      <Card>
        <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <CircleDollarSign className="h-6 w-6 text-primary"/>
                Finance Snapshot
            </CardTitle>
            <CardDescription>Term 2 Fee Collection Status</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col md:flex-row items-center gap-6">
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
          <div className="flex-1 space-y-4">
              <div className="text-center md:text-left">
                  <p className="text-xs text-muted-foreground">Total Collected</p>
                  <p className="text-2xl font-bold">KES 8,200,000</p>
              </div>
              <div className="text-center md:text-left">
                  <p className="text-xs text-muted-foreground">Total Outstanding</p>
                  <p className="text-2xl font-bold">KES 1,800,000</p>
              </div>
               <div className="text-center md:text-left pt-2">
                  <p className="text-xs text-red-600 font-semibold">Overdue Balances</p>
                  <p className="text-2xl font-bold text-red-600">KES 540,000</p>
              </div>
          </div>
        </CardContent>
      </Card>
  );
}


const performanceData = [
  { subject: 'Math', avgScore: 82 },
  { subject: 'Eng', avgScore: 78 },
  { subject: 'Sci', avgScore: 85 },
  { subject: 'Hist', avgScore: 75 },
  { subject: 'Geo', avgScore: 72 },
  { subject: 'Kisw', avgScore: 80 },
];

const performanceChartConfig = {
  avgScore: {
    label: 'Avg. Score',
    color: 'hsl(var(--primary))',
  },
};

export function PerformanceSnapshot() {
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
            <Bar dataKey="avgScore" fill="var(--color-avgScore)" radius={8}>
                 {(Bar as any).labelList && <(Bar as any).labelList position="top" offset={8} className="fill-foreground text-xs" />}
            </Bar>
          </BarChart>
        </ChartContainer>
         <div className="mt-4 flex justify-end">
            <Button variant="link" asChild disabled>
                <Link href="#">
                    View Detailed Reports
                    <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
            </Button>
        </div>
      </CardContent>
    </Card>
  );
}
