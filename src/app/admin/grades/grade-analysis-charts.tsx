
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
import { TrendingDown, TrendingUp, ArrowRight, BookCopy, Loader2, FileText, BarChart2, AlertCircle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { firestore } from '@/lib/firebase';
import { collection, query, onSnapshot, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { useSearchParams } from 'next/navigation';
import type { Exam } from './page';


const distributionChartConfig = {
  students: {
    label: 'Students',
    color: 'hsl(var(--primary))',
  },
};

interface GradeAnalysisChartsProps {
    exam: Exam | null;
    onBack: () => void;
}

export function GradeAnalysisCharts({ exam, onBack }: GradeAnalysisChartsProps) {
  const searchParams = useSearchParams();
  const schoolId = searchParams.get('schoolId');
  
  const [distributionData, setDistributionData] = React.useState<any[]>([]);
  const [subjectPerformanceData, setSubjectPerformanceData] = React.useState<any[]>([]);
  const [classPerformance, setClassPerformance] = React.useState<{ top: string; lowest: string; topAvg: number; lowestAvg: number; }>({ top: 'N/A', lowest: 'N/A', topAvg: 0, lowestAvg: 0 });
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    if (!schoolId || !exam) {
        setIsLoading(false);
        return;
    }

    const fetchDataForExam = async () => {
        setIsLoading(true);
        // Fetch all submissions for the selected exam
        const submissionsQuery = query(collection(firestore, `schools/${schoolId}/submissions`), where('examId', '==', exam.id));
        const submissionsSnapshot = await getDocs(submissionsQuery);
        const submissions = submissionsSnapshot.docs.map(doc => doc.data());
        
        if (submissions.length === 0) {
            setDistributionData([]);
            setSubjectPerformanceData([]);
            setClassPerformance({ top: 'N/A', lowest: 'N/A', topAvg: 0, lowestAvg: 0 });
            setIsLoading(false);
            return;
        }

        // Process data
        // Grade Distribution
        const gradeCounts: Record<string, number> = { 'A': 0, 'A-': 0, 'B+': 0, 'B': 0, 'B-': 0, 'C+': 0, 'C/C-': 0, 'D/E': 0 };
        submissions.forEach(submission => {
            const grade = parseInt(submission.grade, 10);
            if (isNaN(grade)) return;
            if (grade >= 80) gradeCounts['A']++;
            else if (grade >= 75) gradeCounts['A-']++;
            else if (grade >= 70) gradeCounts['B+']++;
            else if (grade >= 65) gradeCounts['B']++;
            else if (grade >= 60) gradeCounts['B-']++;
            else if (grade >= 55) gradeCounts['C+']++;
            else if (grade >= 45) gradeCounts['C/C-']++;
            else gradeCounts['D/E']++;
        });

        // Subject Performance
        const subjectScores: Record<string, { total: number, count: number }> = {};
        for (const submission of submissions) {
          const assessmentDoc = await getDoc(doc(firestore, `schools/${schoolId}/assesments`, submission.examId));
          if (!assessmentDoc.exists()) continue;

          const assessmentData = assessmentDoc.data();
          const subjectName = assessmentData.title.split(' ')[0] || 'Unknown'; // Simplified subject extraction

          if (!subjectScores[subjectName]) {
            subjectScores[subjectName] = { total: 0, count: 0 };
          }
          const score = parseInt(submission.grade, 10);
          if (!isNaN(score)) {
            subjectScores[subjectName].total += score;
            subjectScores[subjectName].count++;
          }
        }

        const performance = Object.entries(subjectScores).map(([subject, data]) => ({
            subject: subject,
            avg: data.count > 0 ? Math.round(data.total / data.count) : 0,
            trend: 'stable',
        }));
        
        // Class Performance
        const classScores: Record<string, { total: number, count: number }> = {};
        submissions.forEach(submission => {
            if (!classScores[submission.class]) {
                classScores[submission.class] = { total: 0, count: 0 };
            }
            const score = parseInt(submission.grade, 10);
            if(!isNaN(score)) {
                 classScores[submission.class].total += score;
                 classScores[submission.class].count++;
            }
        });
        const classAvgs = Object.entries(classScores).map(([className, data]) => ({
            name: className,
            avg: data.count > 0 ? Math.round(data.total / data.count) : 0,
        })).sort((a,b) => b.avg - a.avg);

        setDistributionData(Object.entries(gradeCounts).map(([name, students]) => ({ name, students })));
        setSubjectPerformanceData(performance);
        setClassPerformance({
            top: classAvgs[0]?.name || 'N/A',
            topAvg: classAvgs[0]?.avg || 0,
            lowest: classAvgs[classAvgs.length - 1]?.name || 'N/A',
            lowestAvg: classAvgs[classAvgs.length - 1]?.avg || 0,
        });
        setIsLoading(false);
    }
    
    fetchDataForExam();

  }, [exam, schoolId]);

  if (!exam) {
    return (
        <Card className="min-h-[600px]">
            <CardHeader>
                <CardTitle>Grade Analysis</CardTitle>
                <CardDescription>Select an exam from the "Exam Schedules" tab to see an analysis.</CardDescription>
            </CardHeader>
            <CardContent className="flex h-full items-center justify-center">
                 <div className="text-center text-muted-foreground">
                    <BarChart2 className="h-16 w-16 mx-auto mb-4"/>
                    <p className="font-semibold">No Exam Selected</p>
                </div>
            </CardContent>
        </Card>
    )
  }
  
  return (
     <div className="grid gap-6">
        <Card>
            <CardHeader>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <Button variant="outline" size="sm" onClick={onBack}>
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Schedules
                        </Button>
                        <CardTitle className="mt-4">School-Wide Performance Analysis</CardTitle>
                        <CardDescription>
                            Overall grade distribution for: <span className="font-semibold text-primary">{exam.title}</span>
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                {isLoading ? <div className="h-[250px] w-full flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin"/></div> :
                 distributionData.reduce((sum, item) => sum + item.students, 0) > 0 ? (
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
                 ) : (
                    <div className="h-[250px] w-full flex flex-col items-center justify-center text-center text-muted-foreground bg-muted/50 rounded-lg">
                        <AlertCircle className="h-8 w-8 mb-2" />
                        <p className="font-semibold">No Grades Found</p>
                        <p className="text-sm">There are no submitted grades to analyze for this exam yet.</p>
                    </div>
                 )
                }
            </CardContent>
        </Card>
        <div className="grid gap-6 md:grid-cols-3">
             <Card asChild className="md:col-span-2 h-full hover:bg-muted/50 transition-colors">
                <Link href={`/admin/grades?schoolId=${schoolId}`}>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><BookCopy className="h-5 w-5 text-primary"/>Subject Performance</CardTitle>
                        <CardDescription>Average scores by subject.</CardDescription>
                    </CardHeader>
                    <CardContent className="w-full overflow-auto">
                        {isLoading ? <div className="h-[150px] w-full flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin"/></div> :
                        subjectPerformanceData.length > 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-8 text-sm min-w-[400px]">
                            {subjectPerformanceData.map(item => (
                                <div key={item.subject} className="flex items-center justify-between border-b pb-2">
                                    <span className="font-medium">{item.subject}</span>
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold">{item.avg}%</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                        ) : (
                            <div className="text-muted-foreground text-center py-8">No subject data for this exam.</div>
                        )
                        }
                    </CardContent>
                </Link>
             </Card>
             <div className="space-y-6">
                <Card asChild className="hover:bg-muted/50 transition-colors">
                    <Link href={`/admin/grades?schoolId=${schoolId}`}>
                        <CardHeader>
                            <CardTitle>Top Performing Class</CardTitle>
                            <CardDescription>{classPerformance.top} (Avg. {classPerformance.topAvg}%)</CardDescription>
                        </CardHeader>
                    </Link>
                 </Card>
                 <Card asChild className="hover:bg-muted/50 transition-colors">
                    <Link href={`/admin/grades?schoolId=${schoolId}`}>
                        <CardHeader>
                            <CardTitle>Lowest Performing Class</CardTitle>
                            <CardDescription>{classPerformance.lowest} (Avg. {classPerformance.lowestAvg}%)</CardDescription>
                        </CardHeader>
                    </Link>
                 </Card>
                 <Button asChild variant="outline" className="w-full">
                    <Link href={`/admin/grades?schoolId=${schoolId}`}>
                        Go to Full Report Generator
                        <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                </Button>
            </div>
        </div>
    </div>
  );
}
