
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
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
  DialogFooter
} from '@/components/ui/dialog';
import {
  FileText,
  User,
  ChevronDown,
  FileDown,
  BarChart2,
  Trophy,
  ArrowUp,
  ArrowDown,
  MessageCircle,
  Send,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, CartesianGrid, XAxis, YAxis } from 'recharts';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { firestore } from '@/lib/firebase';
import { collection, query, onSnapshot, where, doc, getDoc } from 'firebase/firestore';
import type { DocumentData, Timestamp } from 'firebase/firestore';


type Child = {
    id: string;
    name: string;
    class: string;
};

type GradeData = {
    summary: {
      overall: string;
      rank: string;
      classSize: number;
      trend: 'up' | 'down';
      trendValue: string;
      highest: string;
      lowest: string;
    };
    subjects: SubjectData[];
};

type SubjectData = { 
    id: string;
    name: string; 
    cat1: number; 
    midTerm: number; 
    cat2: number; 
    final: number; 
    average: number; 
    grade: string; 
    comment: string; 
    teacher: string; 
};


const chartConfig = {
  average: { label: 'Average Score', color: 'hsl(var(--primary))' },
};


function CommentDialog({ studentName, subject, open, onOpenChange }: { studentName: string, subject: SubjectData | null, open: boolean, onOpenChange: (open: boolean) => void }) {
    const { toast } = useToast();
    const handleSendReply = () => {
        toast({
            title: 'Reply Sent (Simulation)',
            description: `Your message has been sent to ${subject?.teacher}.`,
        });
        onOpenChange(false);
    }

    if (!subject) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Teacher's Comment: {subject.name}</DialogTitle>
                    <DialogDescription>
                        Comment regarding {studentName}'s performance.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-4">
                    <Card className="bg-muted/50">
                        <CardContent className="p-4">
                             <p className="text-sm italic">"{subject.comment}"</p>
                             <p className="text-xs text-muted-foreground mt-2">- {subject.teacher}</p>
                        </CardContent>
                    </Card>
                     <Separator />
                    <div className="space-y-2">
                        <Label htmlFor="reply-message">Send a Reply</Label>
                        <Textarea id="reply-message" placeholder={`Type your message to ${subject.teacher}...`} />
                    </div>
                </div>
                <DialogFooter>
                    <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                    <Button onClick={handleSendReply}>
                        <Send className="mr-2 h-4 w-4" />
                        Send Reply
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export default function ParentGradesPage() {
  const [childrenData, setChildrenData] = React.useState<Child[]>([]);
  const [gradeData, setGradeData] = React.useState<GradeData | null>(null);
  const [selectedChild, setSelectedChild] = React.useState<string | undefined>();
  const { toast } = useToast();
  const [selectedSubjectComment, setSelectedSubjectComment] = React.useState<SubjectData | null>(null);

  React.useEffect(() => {
    // Fetch children associated with the parent
    const q = query(collection(firestore, 'students'), where('role', '==', 'Student'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
        const fetchedChildren = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Child));
        setChildrenData(fetchedChildren);
        if (!selectedChild && fetchedChildren.length > 0) {
            setSelectedChild(fetchedChildren[0].id);
        }
    });
    return () => unsubscribe();
  }, [selectedChild]);

  React.useEffect(() => {
    if (!selectedChild) return;

    const fetchGradeData = async () => {
        const studentDocRef = doc(firestore, 'students', selectedChild);
        const studentSnap = await getDoc(studentDocRef);

        if (studentSnap.exists()) {
            const studentData = studentSnap.data() as DocumentData;
            // This is a placeholder for fetching real grade data.
            // In a real app, you would fetch grades from a subcollection.
            const mockGradeData: GradeData = {
                summary: {
                    overall: `${studentData.overallGrade || 82}%`,
                    rank: '5th',
                    classSize: 42,
                    trend: 'up',
                    trendValue: '3%',
                    highest: 'Chemistry (91%)',
                    lowest: 'History (72%)',
                },
                subjects: [
                    { id: '1', name: 'Mathematics', cat1: 80, midTerm: 85, cat2: 78, final: 84, average: 82, grade: 'A-', comment: 'Good progress, but needs to work on algebraic expressions.', teacher: 'Mr. Otieno' },
                    { id: '2', name: 'English', cat1: 88, midTerm: 90, cat2: 85, final: 87, average: 88, grade: 'A', comment: 'Excellent work in literature analysis.', teacher: 'Ms. Njeri' },
                    { id: '3', name: 'Kiswahili', cat1: 75, midTerm: 78, cat2: 80, final: 82, average: 79, grade: 'A-', comment: 'Improvement in vocabulary is needed.', teacher: 'Ms. Akinyi' },
                    { id: '4', name: 'Chemistry', cat1: 90, midTerm: 92, cat2: 88, final: 94, average: 91, grade: 'A', comment: 'Outstanding performance in practicals.', teacher: 'Ms. Wanjiku' },
                ]
            };
            setGradeData(mockGradeData);
        }
    };

    fetchGradeData();
  }, [selectedChild]);

  const handleDownload = () => {
    toast({
      title: 'Generating Report Card',
      description: 'Your official report card is being prepared for download.',
    });
  };

  if (!gradeData) {
    return <div className="p-8">Loading grades...</div>
  }

  const chartData = gradeData.subjects.map(s => ({ name: s.name.substring(0, 3).toUpperCase(), average: s.average }));

  return (
    <>
    <CommentDialog 
        studentName={childrenData.find(c => c.id === selectedChild)?.name || ''}
        subject={selectedSubjectComment}
        open={!!selectedSubjectComment}
        onOpenChange={(open) => !open && setSelectedSubjectComment(null)}
    />
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="mb-2">
        <h1 className="font-headline text-3xl font-bold flex items-center gap-2">
          <FileText className="h-8 w-8 text-primary" />
          Grades &amp; Exams
        </h1>
        <p className="text-muted-foreground">View academic performance and report cards.</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              <Select value={selectedChild} onValueChange={setSelectedChild}>
                <SelectTrigger className="w-full md:w-[240px]">
                  <SelectValue placeholder="Select a child" />
                </SelectTrigger>
                <SelectContent>
                  {childrenData.map((child) => (
                    <SelectItem key={child.id} value={child.id}>{child.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex w-full flex-col sm:flex-row md:w-auto items-center gap-2">
                <Select defaultValue="term2-2024">
                    <SelectTrigger className="w-full md:w-auto">
                        <SelectValue placeholder="Select Term" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="term2-2024">Term 2, 2024</SelectItem>
                        <SelectItem value="term1-2024">Term 1, 2024</SelectItem>
                    </SelectContent>
                </Select>
                <Select>
                    <SelectTrigger className="w-full md:w-auto">
                        <SelectValue placeholder="All Exams" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Exams</SelectItem>
                        <SelectItem value="midterm">Mid-Term</SelectItem>
                        <SelectItem value="endterm">End-Term</SelectItem>
                    </SelectContent>
                </Select>
            </div>
          </div>
        </CardHeader>
      </Card>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
            <CardHeader className="pb-2">
                <CardDescription>Overall Average</CardDescription>
                <CardTitle className="text-4xl">{gradeData.summary.overall}</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="text-xs text-muted-foreground flex items-center">
                    {gradeData.summary.trend === 'up' ? <ArrowUp className="h-4 w-4 text-green-500"/> : <ArrowDown className="h-4 w-4 text-red-500"/>}
                    {gradeData.summary.trendValue} vs last term
                </div>
            </CardContent>
        </Card>
        <Card>
            <CardHeader className="pb-2">
                <CardDescription>Class Rank</CardDescription>
                <CardTitle className="text-4xl">{gradeData.summary.rank}</CardTitle>
            </CardHeader>
            <CardContent>
                 <div className="text-xs text-muted-foreground">out of {gradeData.summary.classSize} students</div>
            </CardContent>
        </Card>
        <Card>
            <CardHeader className="pb-2">
                <CardDescription>Highest Score</CardDescription>
                <CardTitle className="text-2xl">{gradeData.summary.highest}</CardTitle>
            </CardHeader>
        </Card>
        <Card>
            <CardHeader className="pb-2">
                <CardDescription>Lowest Score</CardDescription>
                <CardTitle className="text-2xl">{gradeData.summary.lowest}</CardTitle>
            </CardHeader>
        </Card>
      </div>

       <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><BarChart2 className="h-5 w-5 text-primary"/>Performance by Subject</CardTitle>
            </CardHeader>
            <CardContent>
                 <ChartContainer config={chartConfig} className="h-[250px] w-full">
                    <BarChart data={chartData}>
                        <CartesianGrid vertical={false} />
                        <XAxis dataKey="name" tickLine={false} tickMargin={10} axisLine={false} />
                        <YAxis />
                        <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
                        <Bar dataKey="average" fill="var(--color-average)" radius={8} />
                    </BarChart>
                </ChartContainer>
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>Detailed Grade Report</CardTitle>
                <CardDescription>A breakdown of scores for each subject in the current term.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="w-full overflow-auto rounded-lg border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Subject</TableHead>
                                <TableHead className="text-center">CAT 1</TableHead>
                                <TableHead className="text-center">Mid-Term</TableHead>
                                <TableHead className="text-center">CAT 2</TableHead>
                                <TableHead className="text-center">Final Exam</TableHead>
                                <TableHead className="text-center font-bold">Average</TableHead>
                                <TableHead className="text-center font-bold">Grade</TableHead>
                                <TableHead>Teacher's Comment</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {gradeData.subjects.map(subject => (
                                <TableRow key={subject.id}>
                                    <TableCell className="font-medium">{subject.name}</TableCell>
                                    <TableCell className="text-center">{subject.cat1}</TableCell>
                                    <TableCell className="text-center">{subject.midTerm}</TableCell>
                                    <TableCell className="text-center">{subject.cat2}</TableCell>
                                    <TableCell className="text-center">{subject.final}</TableCell>
                                    <TableCell className="text-center font-bold">
                                        <Badge variant="secondary">{subject.average}</Badge>
                                    </TableCell>
                                    <TableCell className="text-center font-bold">
                                         <Badge>{subject.grade}</Badge>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground text-sm">
                                        <div className="flex items-center justify-between">
                                            <span className="truncate">{subject.comment}</span>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => setSelectedSubjectComment(subject)}>
                                                <MessageCircle className="h-4 w-4"/>
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
             <CardFooter>
                 <Button onClick={handleDownload}>
                    <FileDown className="mr-2 h-4 w-4" />
                    Download Official Report Card
                </Button>
            </CardFooter>
        </Card>
    </div>
    </>
  );
}
