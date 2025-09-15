
'use client';

import * as React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  FileText,
  PlusCircle,
  Trophy,
  Loader2,
  Printer,
  CalendarIcon,
  Settings,
  BarChart2,
  Trophy as TrophyIcon,
  TrendingDown,
  ArrowLeft
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ReportGenerator } from './report-generator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { DateRange } from 'react-day-picker';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { firestore } from '@/lib/firebase';
import { 
  collection, 
  query, 
  onSnapshot, 
  orderBy, 
  Timestamp, 
  addDoc, 
  getDocs, 
  where, 
  DocumentData,
  doc,
  getDoc
} from 'firebase/firestore';
import { useSearchParams } from 'next/navigation';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { GradeAnalysisCharts } from './grade-analysis-charts';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';


type GradeStatus = 'Graded' | 'Pending';

export type Exam = {
  id: string;
  title: string;
  term: string;
  class: string;
  startDate: Timestamp;
  endDate: Timestamp;
  status: string;
  classId?: string;
};

type StudentGrade = {
  id: string;
  studentName: string;
  avatarUrl: string;
  grade: string;
  overall: number;
  rollNumber?: string;
  grades?: { subject: string, grade: string | number }[];
};

type GradingScaleItem = {
  grade: string;
  min: number;
  max: number;
}

const initialGradingScale: GradingScaleItem[] = [
  { grade: 'A', min: 80, max: 100 },
  { grade: 'A-', min: 75, max: 79 },
  { grade: 'B+', min: 70, max: 74 },
  { grade: 'B', min: 65, max: 69 },
  { grade: 'B-', min: 60, max: 64 },
  { grade: 'C+', min: 55, max: 59 },
  { grade: 'C', min: 50, max: 54 },
  { grade: 'C-', min: 45, max: 49 },
  { grade: 'D+', min: 40, max: 44 },
  { grade: 'D', min: 35, max: 39 },
  { grade: 'D-', min: 30, max: 34 },
  { grade: 'E', min: 0, max: 29 },
]

export default function AdminGradesPage() {
  const searchParams = useSearchParams();
  const schoolId = searchParams.get('schoolId');
  const [date, setDate] = React.useState<DateRange | undefined>();
  const [gradingScale, setGradingScale] = React.useState<GradingScaleItem[]>(initialGradingScale);
  const { toast } = useToast();
  const [classes, setClasses] = React.useState<{id: string, name: string}[]>([]);
  const [activeTab, setActiveTab] = React.useState('ranking');
  const [studentsForRanking, setStudentsForRanking] = React.useState<StudentGrade[]>([]);
  const [selectedClassForRanking, setSelectedClassForRanking] = React.useState<string>('');
  const [selectedStudentForDetails, setSelectedStudentForDetails] = React.useState<StudentGrade | null>(null);
  
  const currentYear = new Date().getFullYear();
  const academicTerms = Array.from({ length: 2 }, (_, i) => {
    const year = currentYear - 1 + i;
    return [`Term 1, ${year}`, `Term 2, ${year}`, `Term 3, ${year}`];
  }).flat();
  academicTerms.push(...[`Term 1, ${currentYear + 1}`, `Term 2, ${currentYear + 1}`, `Term 3, ${currentYear + 1}`]);

  // State for the create exam dialog
  const [newExamTitle, setNewExamTitle] = React.useState('');
  const [newExamTerm, setNewExamTerm] = React.useState(academicTerms[4]);
  const [newExamClass, setNewExamClass] = React.useState<string>('');
  const [newExamNotes, setNewExamNotes] = React.useState('');
  const [isSavingExam, setIsSavingExam] = React.useState(false);

  React.useEffect(() => {
    if (!schoolId) return;
    
    // Fetch unique classes from the grades collection
    const gradesQuery = query(collection(firestore, `schools/${schoolId}/grades`));
    const unsubClasses = onSnapshot(gradesQuery, (snapshot) => {
        const uniqueClasses: Record<string, string> = {};
        snapshot.docs.forEach(doc => {
            const data = doc.data();
            if (data.classId && data.className) {
                uniqueClasses[data.classId] = data.className;
            }
        });
        const classList = Object.entries(uniqueClasses).map(([id, name]) => ({ id, name }));
        setClasses(classList);
      if (classList.length > 0 && !selectedClassForRanking) {
          setSelectedClassForRanking(classList[0].id);
      }
    });
    
    return () => unsubClasses();
  }, [schoolId, selectedClassForRanking]);
  
  React.useEffect(() => {
    if (!selectedClassForRanking || !schoolId) return;

    const fetchStudentGradesForRanking = async () => {
      try {
        const gradesQuery = query(
          collection(firestore, `schools/${schoolId}/grades`), 
          where('classId', '==', selectedClassForRanking)
        );
        const gradesSnapshot = await getDocs(gradesQuery);
        const gradesData = gradesSnapshot.docs.map(doc => doc.data());

        const allStudentGrades: Record<string, { total: number, count: number, name?: string, avatar?: string, rollNumber?: string, grades: { subject: string, grade: string }[] }> = {};

        for (const gradeData of gradesData) {
          const studentId = gradeData.studentId;
          if (!allStudentGrades[studentId]) {
              allStudentGrades[studentId] = { total: 0, count: 0, grades: [] };
          }
          const gradeValue = parseInt(gradeData.grade, 10) || 0;
          allStudentGrades[studentId].total += gradeValue;
          allStudentGrades[studentId].count++;
          allStudentGrades[studentId].grades.push({ subject: gradeData.subject, grade: gradeData.grade });
        }
        
        const studentDetailsPromises = Object.keys(allStudentGrades).map(async (studentId) => {
            const studentDoc = await getDoc(doc(firestore, `schools/${schoolId}/students`, studentId));
            if (studentDoc.exists()) {
                const studentData = studentDoc.data();
                allStudentGrades[studentId].name = studentData.name;
                allStudentGrades[studentId].avatar = studentData.avatarUrl;
                allStudentGrades[studentId].rollNumber = studentData.rollNumber;
            }
        });

        await Promise.all(studentDetailsPromises);
        
        const rankedStudents = Object.entries(allStudentGrades).map(([id, data]) => ({
          id,
          studentName: data.name || "Unknown Student",
          avatarUrl: data.avatar || "",
          rollNumber: data.rollNumber || "",
          grade: '',
          overall: data.count > 0 ? Math.round(data.total / data.count) : 0,
          grades: data.grades,
        })).sort((a, b) => (b.overall || 0) - (a.overall || 0));

        setStudentsForRanking(rankedStudents);
      } catch (error) {
        console.error('Error fetching student grades for ranking:', error);
        toast({ variant: 'destructive', title: 'Failed to fetch ranking data' });
      }
    };
    
    fetchStudentGradesForRanking();
  }, [selectedClassForRanking, schoolId, toast]);

  const handleGradingScaleChange = (index: number, field: 'min' | 'max', value: number) => {
    const newScale = [...gradingScale];
    newScale[index][field] = value;
    setGradingScale(newScale);
  };

  const addGradingRow = () => {
    setGradingScale([...gradingScale, { grade: 'New', min: 0, max: 0 }]);
  };
  
  const handleSaveScale = () => {
    toast({
      title: 'Grading Scale Saved',
      description: 'The new grading scale has been applied school-wide.',
    });
  }
  
  const handleCreateExam = async () => {
    if (!schoolId || !newExamTitle || !newExamClass || !date?.from) {
      toast({ variant: 'destructive', title: 'Missing Information', description: 'Please fill out the title, class, and date range.' });
      return;
    }
    setIsSavingExam(true);
    try {
      await addDoc(collection(firestore, `schools/${schoolId}/assessments`), {
        title: newExamTitle,
        term: newExamTerm,
        classId: newExamClass,
        className: classes.find(c => c.id === newExamClass)?.name || 'N/A',
        startDate: Timestamp.fromDate(date.from),
        endDate: Timestamp.fromDate(date.to || date.from),
        notes: newExamNotes,
        status: 'Scheduled',
      });
      toast({ title: 'Exam Created', description: 'The new exam has been scheduled.' });
      setNewExamTitle('');
      setNewExamClass('');
      setDate(undefined);
      setNewExamNotes('');
    } catch (e) {
      console.error(e);
      toast({ variant: 'destructive', title: 'Failed to create exam.' });
    } finally {
      setIsSavingExam(false);
    }
  };
  
  const handlePrintRanking = () => {
    const doc = new jsPDF();
    const className = classes.find(c => c.id === selectedClassForRanking)?.name;
    doc.text(`Class Ranking for ${className || 'Selected Class'}`, 14, 16);
    
    const tableData = studentsForRanking.map((student, index) => [
      index + 1,
      student.studentName,
      `${student.overall}%`,
    ]);

    (doc as any).autoTable({
      startY: 22,
      head: [['Rank', 'Student Name', 'Overall Grade']],
      body: tableData,
    });
    
    doc.save("class-ranking.pdf");

    toast({
      title: 'Export Successful',
      description: 'The class ranking has been downloaded as a PDF.',
    });
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <Dialog onOpenChange={(open) => !open && setSelectedStudentForDetails(null)}>
        <Dialog>
          <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
                <h1 className="font-headline text-3xl font-bold flex items-center gap-2">
                    <FileText className="h-8 w-8 text-primary" />
                    Grades &amp; Exams Management
                </h1>
                <p className="text-muted-foreground">Oversee school-wide examination schedules, grade analysis, and reporting.</p>
            </div>
            <DialogTrigger asChild>
              <Button>
                  <PlusCircle className="mr-2 h-4 w-4"/>
                  Create Exam
              </Button>
            </DialogTrigger>
          </div>
          <DialogContent className="sm:max-w-xl">
            <DialogHeader>
                <DialogTitle>Exam Details</DialogTitle>
                <DialogDescription>Define a new examination schedule for a term.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-6 py-4">
                <div className="space-y-2">
                <Label htmlFor="exam-title">Exam Title</Label>
                <Input id="exam-title" placeholder="e.g., Term 2 Mid-Term Exams" value={newExamTitle} onChange={(e) => setNewExamTitle(e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="exam-term">Academic Term</Label>
                    <Select value={newExamTerm} onValueChange={setNewExamTerm}>
                    <SelectTrigger id="exam-term">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {academicTerms.map(term => (
                        <SelectItem key={term} value={term}>{term}</SelectItem>
                        ))}
                    </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label>Classes Involved</Label>
                    <Select value={newExamClass} onValueChange={setNewExamClass}>
                    <SelectTrigger>
                        <SelectValue placeholder="Select classes..." />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="All Classes">All Classes</SelectItem>
                        {classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                    </Select>
                </div>
                </div>
                <div className="space-y-2">
                <Label htmlFor="date-range">Date Range</Label>
                <Popover>
                    <PopoverTrigger asChild>
                    <Button
                        id="date-range"
                        variant="outline"
                        className={cn('w-full justify-start text-left font-normal', !date && 'text-muted-foreground')}
                    >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date?.from ? (
                        date.to ? `${format(date.from, 'LLL dd, y')} - ${format(date.to, 'LLL dd, y')}` : format(date.from, 'LLL dd, y')
                        ) : <span>Pick a date range</span>}
                    </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                    <Calendar initialFocus mode="range" defaultMonth={date?.from} selected={date} onSelect={setDate} numberOfMonths={2} />
                    </PopoverContent>
                </Popover>
                </div>
                <div className="space-y-2">
                <Label htmlFor="exam-notes">Notes (Optional)</Label>
                <Textarea id="exam-notes" placeholder="Add any relevant instructions or notes for teachers." value={newExamNotes} onChange={e => setNewExamNotes(e.target.value)} />
                </div>
            </div>
            <DialogFooter>
                <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                <Button onClick={handleCreateExam} disabled={isSavingExam}>
                {isSavingExam && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                Save Exam
                </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 md:w-auto md:inline-flex mb-6">
            <TabsTrigger value="ranking">Class Ranking</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
            <TabsTrigger value="settings">Settings &amp; Policies</TabsTrigger>
          </TabsList>

          <TabsContent value="ranking">
          <Card>
              <CardHeader>
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div>
                          <CardTitle className="flex items-center gap-2"><Trophy className="h-5 w-5 text-primary"/>Class Ranking</CardTitle>
                          <CardDescription>Student ranking based on overall performance for the selected exam.</CardDescription>
                      </div>
                      <div className="flex w-full md:w-auto items-center gap-2">
                           <Select value={selectedClassForRanking} onValueChange={setSelectedClassForRanking}>
                              <SelectTrigger className="w-full md:w-[240px]">
                                  <SelectValue placeholder="Select a class" />
                              </SelectTrigger>
                              <SelectContent>
                                  {classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                              </SelectContent>
                          </Select>
                          <Button variant="outline" onClick={handlePrintRanking}>
                              <Printer className="mr-2 h-4 w-4"/>
                              Print Ranking
                          </Button>
                      </div>
                  </div>
              </CardHeader>
              <CardContent>
                  {studentsForRanking.length > 0 ? (
                      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                          {studentsForRanking.map((student, index) => (
                              <DialogTrigger key={student.id} asChild>
                                  <Card className="flex items-center p-4 gap-4 cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => setSelectedStudentForDetails(student)}>
                                      <div className="flex items-center justify-center font-bold text-lg h-10 w-10 rounded-full bg-muted">{index + 1}</div>
                                      <Avatar className="h-12 w-12">
                                          <AvatarImage src={student.avatarUrl} />
                                          <AvatarFallback>{student.studentName.charAt(0)}</AvatarFallback>
                                      </Avatar>
                                      <div className="flex-1">
                                          <p className="font-semibold">{student.studentName}</p>
                                          <p className="text-sm text-muted-foreground">Overall: <span className="font-bold text-foreground">{student.overall}%</span></p>
                                      </div>
                                  </Card>
                              </DialogTrigger>
                          ))}
                      </div>
                  ) : (
                      <div className="text-center text-muted-foreground py-16">
                          <p>No ranking data available for this class yet.</p>
                      </div>
                  )}
              </CardContent>
          </Card>
          </TabsContent>
          <TabsContent value="reports">
            <ReportGenerator />
          </TabsContent>
          <TabsContent value="settings">
             <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Settings className="h-5 w-5 text-primary"/>Grading Policies</CardTitle>
                    <CardDescription>Define the grading scale and other report card settings.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                             <h4 className="font-semibold text-base">Grading Scale</h4>
                             <div className="space-y-2">
                                {gradingScale.map((item, index) => (
                                <div key={index} className="grid grid-cols-[80px_1fr_1fr] items-center gap-2">
                                    <Input defaultValue={item.grade} className="font-bold"/>
                                    <Input type="number" defaultValue={item.min} onChange={(e) => handleGradingScaleChange(index, 'min', Number(e.target.value))} />
                                    <Input type="number" defaultValue={item.max} onChange={(e) => handleGradingScaleChange(index, 'max', Number(e.target.value))} />
                                </div>
                                ))}
                             </div>
                        </div>
                         <div className="space-y-4">
                            <h4 className="font-semibold text-base">Report Card Settings</h4>
                         </div>
                    </div>
                </CardContent>
             </Card>
          </TabsContent>
        </Tabs>
        
        <DialogContent className="sm:max-w-md">
            {selectedStudentForDetails && (
                <>
                    <DialogHeader>
                        <DialogTitle>{selectedStudentForDetails.studentName}</DialogTitle>
                        <DialogDescription>Overall Average: <span className="font-bold text-primary">{selectedStudentForDetails.overall}%</span></DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <h4 className="mb-4 font-semibold">Scores by Subject</h4>
                        <div className="w-full overflow-auto rounded-lg border">
                           <Table>
                               <TableHeader>
                                   <TableRow>
                                       <TableHead>Subject</TableHead>
                                       <TableHead className="text-right">Score</TableHead>
                                   </TableRow>
                               </TableHeader>
                               <TableBody>
                                   {selectedStudentForDetails.grades?.map((gradeInfo, index) => (
                                       <TableRow key={index}>
                                           <TableCell className="font-medium">{gradeInfo.subject}</TableCell>
                                           <TableCell className="text-right">{gradeInfo.grade}%</TableCell>
                                       </TableRow>
                                   ))}
                               </TableBody>
                           </Table>
                        </div>
                    </div>
                </>
            )}
        </DialogContent>

      </Dialog>
    </div>
  );
}
