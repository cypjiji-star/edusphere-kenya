
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
import { collection, query, onSnapshot, where, getDocs, doc, getDoc } from 'firebase/firestore';
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
  const currentYear = new Date().getFullYear();
  const academicTerms = Array.from({ length: 2 }, (_, i) => {
      const year = currentYear - i;
      return [`Term 3, ${year}`, `Term 2, ${year}`, `Term 1, ${year}`]
  }).flat();
  
  const [selectedTerm, setSelectedTerm] = React.useState(academicTerms[1]);
  const [compareTerm, setCompareTerm] = React.useState<string | null>(null);
  const [showCompare, setShowCompare] = React.useState(false);

  const [distributionData, setDistributionData] = React.useState<any[]>([]);
  const [subjectPerformanceData, setSubjectPerformanceData] = React.useState<any[]>([]);
  const [classPerformance, setClassPerformance] = React.useState<{ top: string; lowest: string; topAvg: number; lowestAvg: number; }>({ top: 'N/A', lowest: 'N/A', topAvg: 0, lowestAvg: 0 });
  const [isLoading, setIsLoading] = React.useState(true);
  const [examTitle, setExamTitle] = React.useState('');

  React.useEffect(() => {
    if (!schoolId) return;

    const fetchDataForTerm = async (term: string) => {
        const assessmentsQuery = query(collection(firestore, `schools/${schoolId}/assesments`), where('term', '==', term));
        const assessmentsSnapshot = await getDocs(assessmentsQuery);

        const majorExams = assessmentsSnapshot.docs.filter(doc => 
            doc.data().title.toLowerCase().includes('mid-term') || 
            doc.data().title.toLowerCase().includes('end-term')
        );
        
        const examToAnalyze = majorExams.length > 0 ? majorExams[0] : (assessmentsSnapshot.docs.length > 0 ? assessmentsSnapshot.docs[0] : null);

        if (!examToAnalyze) {
             return { submissions: [], title: `No exams found for ${term}`, assessmentDetails: {} };
        }
        
        const assessmentId = examToAnalyze.id;
        const title = examToAnalyze.data().title;

        // Fetch all submissions for that one major exam
        const submissionsQuery = query(collection(firestore, `schools/${schoolId}/submissions`), where('examId', '==', assessmentId));
        const submissionsSnapshot = await getDocs(submissionsQuery);
        
        const assessmentDetails = { [assessmentId]: examToAnalyze.data() };

        return { submissions: submissionsSnapshot.docs.map(doc => doc.data()), title, assessmentDetails };
    }

    const processData = (submissions: any[], assessmentDetails: Record<string, any>) => {
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
        submissions.forEach(submission => {
            const subjectName = submission.subject;
            if (!subjectName) return;

            if (!subjectScores[subjectName]) {
                subjectScores[subjectName] = { total: 0, count: 0 };
            }
            const score = parseInt(submission.grade, 10);
            if (!isNaN(score)) {
                subjectScores[subjectName].total += score;
                subjectScores[subjectName].count++;
            }
        });

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

        return {
            distributionData: Object.entries(gradeCounts).map(([name, students]) => ({ name, students })),
            subjectPerformanceData: performance,
            classPerformance: {
                top: classAvgs[0]?.name || 'N/A',
                topAvg: classAvgs[0]?.avg || 0,
                lowest: classAvgs[classAvgs.length - 1]?.name || 'N/A',
                lowestAvg: classAvgs[classAvgs.length - 1]?.avg || 0,
            }
        };
    }

    const loadData = async () => {
        setIsLoading(true);
        const { submissions, title } = await fetchDataForTerm(selectedTerm);

        if (submissions.length === 0) {
            setDistributionData([]);
            setSubjectPerformanceData([]);
            setClassPerformance({ top: 'N/A', lowest: 'N/A', topAvg: 0, lowestAvg: 0 });
            setExamTitle(title);
            setIsLoading(false);
            return;
        }
        
        setExamTitle(title);
        const processedData = processData(submissions);
        setDistributionData(processedData.distributionData);
        setSubjectPerformanceData(processedData.subjectPerformanceData);
        setClassPerformance(processedData.classPerformance);
        setIsLoading(false);
    }
    
    loadData();

  }, [selectedTerm, schoolId]);
  
  return (
     <div className="grid gap-6">
        <Card>
            <CardHeader>
                 <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <CardTitle>School-Wide Performance Analysis</CardTitle>
                        <CardDescription>
                            Overall grade distribution for: <span className="font-semibold text-primary">{examTitle}</span>
                        </CardDescription>
                    </div>
                     <div className="flex w-full md:w-auto items-center gap-2">
                         <Select value={selectedTerm} onValueChange={setSelectedTerm}>
                            <SelectTrigger className="w-full md:w-auto">
                                <SelectValue placeholder="Select term" />
                            </SelectTrigger>
                            <SelectContent>
                                {academicTerms.map(term => (
                                    <SelectItem key={term} value={term}>{term}</SelectItem>
                                ))}
                            </SelectContent>
                         </Select>
                         <Button variant="outline" onClick={() => setShowCompare(!showCompare)}>Compare</Button>
                         {showCompare && (
                             <Select onValueChange={setCompareTerm}>
                                <SelectTrigger className="w-full md:w-auto">
                                    <SelectValue placeholder="Compare to..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {academicTerms.filter(t => t !== selectedTerm).map(term => (
                                        <SelectItem key={term} value={term}>{term}</SelectItem>
                                    ))}
                                </SelectContent>
                             </Select>
                         )}
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
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-8 text-sm min-w-[400px]">
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
                             {subjectPerformanceData.length === 0 && <div className="text-muted-foreground col-span-full text-center">No subject data for this exam.</div>}
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
                        Generate Full Report
                        <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                </Button>
            </div>
        </div>
    </div>
  );
}
