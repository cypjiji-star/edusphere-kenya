
'use client';

import * as React from 'react';
import { Pie, PieChart, Cell } from 'recharts';
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
import { CircleDollarSign } from 'lucide-react';


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
