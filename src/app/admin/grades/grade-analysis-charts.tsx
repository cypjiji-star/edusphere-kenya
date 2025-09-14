
'use client';

import * as React from 'react';
import { BarChart, Bar, CartesianGrid, XAxis, LabelList } from 'recharts';
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
} from '@/components/ui/chart';
import { TrendingDown, TrendingUp, ArrowRight, BookCopy, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
  } from '@/components/ui/select';
import { firestore } from '@/lib/firebase';
import { collection, query, getDocs } from 'firebase/firestore';
import { useSearchParams } from 'next/navigation';


const distributionChartConfig = {
  students: {
    label: 'Students',
    color: 'hsl(var(--primary))',
  },
};

export function GradeAnalysisCharts() {
  const searchParams = useSearchParams();
  const schoolId = searchParams.get('schoolId');
  const [selectedTerm, setSelectedTerm] = React.useState('Term 1, 2024');
  const [distributionData, setDistributionData] = React.useState<any[]>([]);
  const [subjectPerformanceData, setSubjectPerformanceData] = React.useState<any[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    if (!schoolId) return;

    const fetchData = async () => {
        setIsLoading(true);
        try {
            // Simplified aggregation. A real app would use backend functions for this.
            const submissionsSnapshot = await getDocs(query(collection(firestore, `schools/${schoolId}/submissions`)));
            
            // Grade Distribution
            const gradeCounts: Record<string, number> = { 'A': 0, 'A-': 0, 'B+': 0, 'B': 0, 'B-': 0, 'C+': 0, 'C/C-': 0, 'D/E': 0 };
            submissionsSnapshot.forEach(doc => {
                const grade = doc.data().grade;
                if (grade >= 80) gradeCounts['A']++;
                else if (grade >= 75) gradeCounts['A-']++;
                else if (grade >= 70) gradeCounts['B+']++;
                else if (grade >= 65) gradeCounts['B']++;
                else if (grade >= 60) gradeCounts['B-']++;
                else if (grade >= 55) gradeCounts['C+']++;
                else if (grade >= 45) gradeCounts['C/C-']++;
                else gradeCounts['D/E']++;
            });
            setDistributionData(Object.entries(gradeCounts).map(([name, students]) => ({ name, students })));

            // Subject Performance
            const subjectScores: Record<string, { total: number, count: number }> = {};
            submissionsSnapshot.forEach(doc => {
                const submission = doc.data();
                if (!subjectScores[submission.subject]) {
                    subjectScores[submission.subject] = { total: 0, count: 0 };
                }
                subjectScores[submission.subject].total += parseInt(submission.grade, 10);
                subjectScores[submission.subject].count++;
            });

            const performance = Object.entries(subjectScores).map(([subject, data]) => ({
                subject: subject,
                avg: Math.round(data.total / data.count),
                trend: 'stable', // Trend calculation would require historical data
            }));
            setSubjectPerformanceData(performance);

        } catch (error) {
            console.error("Error fetching analysis data:", error);
        } finally {
            setIsLoading(false);
        }
    };
    fetchData();
  }, [selectedTerm, schoolId]);
  
  return (
     <div className="grid gap-6">
        <Card>
            <CardHeader>
                 <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <CardTitle>School-Wide Performance Analysis</CardTitle>
                        <CardDescription>Overall grade distribution for the selected exam period.</CardDescription>
                    </div>
                     <div className="flex w-full md:w-auto items-center gap-2">
                         <Select value={selectedTerm} onValueChange={setSelectedTerm}>
                            <SelectTrigger className="w-full md:w-auto">
                                <SelectValue placeholder="Select term" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Term 1, 2024">Term 1, 2024</SelectItem>
                                <SelectItem value="Term 2, 2024">Term 2, 2024</SelectItem>
                            </SelectContent>
                         </Select>
                         <Button variant="outline" disabled>Compare</Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                {isLoading ? <div className="h-[250px] w-full flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin"/></div> :
                <ChartContainer config={distributionChartConfig} className="h-[250px] w-full">
                <BarChart
                    accessibilityLayer
                    data={distributionData}
                    margin={{ top: 20 }}
                >
                    <CartesianGrid vertical={false} />
                    <XAxis
                    dataKey="name"
                    tickLine={false}
                    tickMargin={10}
                    axisLine={false}
                    />
                    <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent indicator="dot" />}
                    />
                    <Bar dataKey="students" fill="var(--color-students)" radius={8}>
                        <LabelList
                            position="top"
                            offset={12}
                            className="fill-foreground"
                            fontSize={12}
                        />
                    </Bar>
                </BarChart>
                </ChartContainer>
                }
            </CardContent>
        </Card>
        <div className="grid gap-6 md:grid-cols-3">
             <Card asChild className="md:col-span-2 h-full hover:bg-muted/50 transition-colors">
                <Link href={`/admin/grades?schoolId=${schoolId}`}>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><BookCopy className="h-5 w-5 text-primary"/>Subject Performance</CardTitle>
                        <CardDescription>Average scores by subject and trend from previous exam.</CardDescription>
                    </CardHeader>
                    <CardContent className="w-full overflow-auto">
                        {isLoading ? <div className="h-[150px] w-full flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin"/></div> :
                        <div className="grid grid-cols-3 gap-y-4 gap-x-8 text-sm min-w-[400px]">
                            {subjectPerformanceData.map(item => (
                                <div key={item.subject} className="flex items-center justify-between border-b pb-2">
                                    <span className="font-medium">{item.subject}</span>
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold">{item.avg}%</span>
                                        {item.trend === 'up' && <TrendingUp className="h-4 w-4 text-green-500" />}
                                        {item.trend === 'down' && <TrendingDown className="h-4 w-4 text-red-500" />}
                                    </div>
                                </div>
                            ))}
                        </div>
                        }
                    </CardContent>
                </Link>
             </Card>
             <div className="space-y-6">
                <Card asChild className="hover:bg-muted/50 transition-colors">
                    <Link href={`/admin/grades?schoolId=${schoolId}`}>
                        <CardHeader>
                            <CardTitle>Top Performing Class</CardTitle>
                            <CardDescription>Form 4 (Avg. 82%)</CardDescription>
                        </CardHeader>
                    </Link>
                 </Card>
                 <Card asChild className="hover:bg-muted/50 transition-colors">
                    <Link href={`/admin/grades?schoolId=${schoolId}`}>
                        <CardHeader>
                            <CardTitle>Lowest Performing Class</CardTitle>
                            <CardDescription>Form 1 (Avg. 68%)</CardDescription>
                        </CardHeader>
                    </Link>
                 </Card>
                 <Button asChild variant="outline" className="w-full">
                    <Link href={`/admin/grades?schoolId=${schoolId}`}>
                        Generate Full Report
                        <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                </Button>
            </div>
        </div>
    </div>
  );
}

  