
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
  } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { FileText, Loader2, CalendarIcon, PlusCircle, Archive, ArchiveRestore, Send } from 'lucide-react';
import { firestore } from '@/lib/firebase';
import { collection, onSnapshot, query, where, getDocs, Timestamp, orderBy, addDoc, serverTimestamp, doc, updateDoc } from 'firebase/firestore';
import { useSearchParams } from 'next/navigation';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { createExamAction, publishGradesAction } from './actions';

type Student = {
    id: string;
    name: string;
    avatarUrl: string;
    grades: Record<string, string>; // { [subjectName]: grade }
    average?: number;
    rank?: number;
};

type TeacherClass = {
  id: string;
  name: string;
};

type GradeRecord = {
    studentId: string;
    subject: string;
    grade: string;
    examId: string;
}

type Exam = {
    id: string;
    title: string;
    term: string;
    date: Timestamp;
    status: 'Open' | 'Closed';
}

const getCurrentTerm = (): string => {
  const today = new Date();
  const month = today.getMonth(); // 0-11
  const year = today.getFullYear();

  if (month >= 0 && month <= 3) { // Jan - Apr
    return `Term 1, ${year}`;
  } else if (month >= 4 && month <= 7) { // May - Aug
    return `Term 2, ${year}`;
  } else { // Sep - Dec
    return `Term 3, ${year}`;
  }
};

const generateAcademicTerms = () => {
    const currentYear = new Date().getFullYear();
    const terms = [];
    for (let year = currentYear - 1; year <= currentYear + 1; year++) {
        terms.push({ value: `Term 1, ${year}`, label: `Term 1, ${year}` });
        terms.push({ value: `Term 2, ${year}`, label: `Term 2, ${year}` });
        terms.push({ value: `Term 3, ${year}`, label: `Term 3, ${year}` });
    }
    return terms;
};


export default function AdminGradesPage() {
    const searchParams = useSearchParams();
    const schoolId = searchParams.get('schoolId');
    const { toast } = useToast();

    const [allClasses, setAllClasses] = React.useState<TeacherClass[]>([]);
    const [allSubjects, setAllSubjects] = React.useState<string[]>([]);
    const [rankedStudents, setRankedStudents] = React.useState<Student[]>([]);
    const [rankingSubjects, setRankingSubjects] = React.useState<string[]>([]);
    const [openExams, setOpenExams] = React.useState<Exam[]>([]);
    const [archivedExams, setArchivedExams] = React.useState<Exam[]>([]);
    
    const [rankingExamId, setRankingExamId] = React.useState<string>('');
    const [rankingClassId, setRankingClassId] = React.useState<string>('');
    
    const [isLoading, setIsLoading] = React.useState({
        classes: true,
        subjects: true,
        rankings: false,
        exams: true,
    });
    
    // Form state for creating exams
    const [examDate, setExamDate] = React.useState<Date | undefined>(new Date());
    const [examTerm, setExamTerm] = React.useState<string>(getCurrentTerm());
    const [isCreatingExam, setIsCreatingExam] = React.useState(false);
    const formRef = React.useRef<HTMLFormElement>(null);


    // Fetch all classes and subjects
    React.useEffect(() => {
        if (!schoolId) return;

        const classesQuery = query(collection(firestore, `schools/${schoolId}/classes`));
        const unsubClasses = onSnapshot(classesQuery, (snapshot) => {
            const classesData = snapshot.docs.map(doc => ({ id: doc.id, name: `${doc.data().name} ${doc.data().stream || ''}`.trim() }));
            setAllClasses(classesData);
            setIsLoading(prev => ({ ...prev, classes: false }));
        });

        const subjectsQuery = query(collection(firestore, `schools/${schoolId}/subjects`));
        const unsubSubjects = onSnapshot(subjectsQuery, (snapshot) => {
            const subjectsData = snapshot.docs.map(doc => doc.data().name);
            setAllSubjects(subjectsData);
            setIsLoading(prev => ({ ...prev, subjects: false }));
        });

        const openExamsQuery = query(collection(firestore, `schools/${schoolId}/exams`), where('status', '==', 'Open'), orderBy('date', 'desc'));
        const unsubOpenExams = onSnapshot(openExamsQuery, (snapshot) => {
            setOpenExams(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Exam)));
            setIsLoading(prev => ({ ...prev, exams: false }));
        });

        const archivedExamsQuery = query(collection(firestore, `schools/${schoolId}/exams`), where('status', '==', 'Closed'), orderBy('date', 'desc'));
        const unsubArchivedExams = onSnapshot(archivedExamsQuery, (snapshot) => {
            setArchivedExams(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Exam)));
        });

        return () => {
            unsubClasses();
            unsubSubjects();
            unsubOpenExams();
            unsubArchivedExams();
        };
    }, [schoolId]);

    // Fetch and compute rankings
    React.useEffect(() => {
        if (!rankingClassId || !schoolId || !rankingExamId) {
            setRankedStudents([]);
            return;
        }
        
        setIsLoading(prev => ({ ...prev, rankings: true }));
        
        const studentsQuery = query(collection(firestore, `schools/${schoolId}/students`), where('classId', '==', rankingClassId), orderBy('name'));
        const unsubStudents = onSnapshot(studentsQuery, (studentsSnapshot) => {
            const studentList: Student[] = studentsSnapshot.docs.map(doc => ({
                id: doc.id,
                name: doc.data().name,
                avatarUrl: doc.data().avatarUrl || `https://picsum.photos/seed/${doc.id}/100`,
                grades: {},
            }));
            
            if (studentList.length > 0) {
                 const studentIds = studentList.map(s => s.id);
                 const gradesQuery = query(collection(firestore, `schools/${schoolId}/grades`), where('studentId', 'in', studentIds), where('examId', '==', rankingExamId));
                 
                 const unsubGrades = onSnapshot(gradesQuery, (gradesSnapshot) => {
                     const gradesData: GradeRecord[] = gradesSnapshot.docs.map(d => d.data() as GradeRecord);
                     const subjectsInView = new Set<string>();
                     
                     const studentsWithGradesData = studentList.map(student => {
                        const studentGrades: Record<string, string> = {};
                         gradesData.forEach(grade => {
                             if (grade.studentId === student.id) {
                                 studentGrades[grade.subject] = grade.grade;
                                 subjectsInView.add(grade.subject);
                             }
                         });

                        const numericGrades = Object.values(studentGrades).map(g => parseInt(g, 10)).filter(g => !isNaN(g));
                        const average = numericGrades.length > 0 ? Math.round(numericGrades.reduce((a, b) => a + b, 0) / numericGrades.length) : 0;
                         
                         return { ...student, grades: studentGrades, average };
                     });

                    studentsWithGradesData.sort((a, b) => (b.average || 0) - (a.average || 0));
                    
                    const finalRankedList = studentsWithGradesData.map((student, index) => ({
                        ...student,
                        rank: index + 1
                    }));

                    setRankedStudents(finalRankedList);
                    setRankingSubjects(Array.from(subjectsInView).sort());
                 });
                 
                 setIsLoading(prev => ({ ...prev, rankings: false }));
                 return () => unsubGrades();
            } else {
                setRankedStudents([]);
                setRankingSubjects([]);
                setIsLoading(prev => ({ ...prev, rankings: false }));
            }
        });

        return () => unsubStudents();
    }, [rankingClassId, schoolId, rankingExamId]);
    
    async function handleCreateExam(formData: FormData) {
        setIsCreatingExam(true);
        const result = await createExamAction(schoolId!, formData);
        if (result.success) {
            toast({
                title: "Exam Created",
                description: result.message,
            });
            formRef.current?.reset();
            setExamDate(new Date());
        } else {
            toast({
                title: "Error",
                description: result.message,
                variant: "destructive",
            });
        }
        setIsCreatingExam(false);
    }
    
    const handleExamStatusChange = async (examId: string, status: 'Open' | 'Closed') => {
        if (!schoolId) return;
        const examRef = doc(firestore, 'schools', schoolId, 'exams', examId);
        try {
            await updateDoc(examRef, { status });
            toast({
                title: `Exam ${status}`,
                description: `The exam has been moved to ${status === 'Closed' ? 'archives' : 'active list'}.`
            });
        } catch(e) {
            toast({ title: 'Error updating exam status.', variant: 'destructive'});
        }
    }
    
    const handlePublish = async (examId: string) => {
        if (!schoolId) return;
        const result = await publishGradesAction(schoolId, examId);
        if(result.success) {
            toast({
                title: 'Results Published',
                description: result.message,
            });
        } else {
            toast({
                title: 'Error',
                description: result.message,
                variant: 'destructive',
            });
        }
    }


    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <div className="mb-6">
                <h1 className="font-headline text-3xl font-bold flex items-center gap-2">
                    <FileText className="h-8 w-8 text-primary" />
                    Grades & Exams
                </h1>
                <p className="text-muted-foreground">Review student performance and manage examination periods.</p>
            </div>

            <Tabs defaultValue="rankings">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="rankings">Class Rankings</TabsTrigger>
                    <TabsTrigger value="exams">Manage Exams</TabsTrigger>
                    <TabsTrigger value="archives">Exam Archives</TabsTrigger>
                </TabsList>
                <TabsContent value="rankings" className="mt-4">
                    <Card>
                        <CardHeader>
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Select an Exam to View Rankings</Label>
                                        <Select value={rankingExamId} onValueChange={setRankingExamId} disabled={isLoading.exams}>
                                            <SelectTrigger><SelectValue placeholder="Select an exam..." /></SelectTrigger>
                                            <SelectContent>
                                                {openExams.map(exam => <SelectItem key={exam.id} value={exam.id}>{exam.title}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Select a Class</Label>
                                        <Select value={rankingClassId} onValueChange={setRankingClassId} disabled={!rankingExamId || isLoading.classes}>
                                            <SelectTrigger><SelectValue placeholder="Select a class..." /></SelectTrigger>
                                            <SelectContent>
                                                {allClasses.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {isLoading.rankings ? (
                                <div className="flex h-64 items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>
                            ) : (
                                <>
                                {!rankingExamId ? (
                                     <div className="text-center py-16 text-muted-foreground">Please select an active exam to view class rankings.</div>
                                ) : !rankingClassId ? (
                                    <div className="text-center py-16 text-muted-foreground">Please select a class to view its results for the chosen exam.</div>
                                ) : (
                                <div className="w-full overflow-auto rounded-lg border">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Rank</TableHead>
                                                <TableHead>Student</TableHead>
                                                {rankingSubjects.map(subject => (
                                                    <TableHead key={subject} className="text-center">{subject}</TableHead>
                                                ))}
                                                <TableHead className="text-right font-bold">Average</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {rankedStudents.length > 0 ? (
                                                rankedStudents.map((student) => (
                                                    <TableRow key={student.id}>
                                                        <TableCell className="font-bold text-lg text-center">{student.rank}</TableCell>
                                                        <TableCell className="font-medium">
                                                            <div className="flex items-center gap-2">
                                                                <Avatar className="h-9 w-9">
                                                                    <AvatarFallback>{student.name?.charAt(0)}</AvatarFallback>
                                                                </Avatar>
                                                                {student.name}
                                                            </div>
                                                        </TableCell>
                                                        {rankingSubjects.map(subject => (
                                                            <TableCell key={subject} className="text-center font-semibold">
                                                                {student.grades?.[subject] || '—'}
                                                            </TableCell>
                                                        ))}
                                                        <TableCell className="text-right font-extrabold text-primary">{student.average?.toFixed(1)}%</TableCell>
                                                    </TableRow>
                                                ))
                                            ) : (
                                                <TableRow>
                                                    <TableCell colSpan={rankingSubjects.length + 3} className="h-24 text-center text-muted-foreground">
                                                        No grades entered for this class and exam combination yet.
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                                )}
                                </>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="exams" className="mt-4">
                     <div className="grid gap-6 md:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>Create New Exam</CardTitle>
                                <CardDescription>Define a new examination period for the school.</CardDescription>
                            </CardHeader>
                             <form ref={formRef} action={handleCreateExam}>
                                <CardContent className="space-y-4">
                                     <div className="space-y-2">
                                        <Label htmlFor="exam-title">Exam Title</Label>
                                        <Input id="exam-title" name="title" placeholder="e.g., End of Term 2 Exams" required/>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="exam-term">Academic Term</Label>
                                        <Select name="term" value={examTerm} onValueChange={setExamTerm}>
                                            <SelectTrigger id="exam-term"><SelectValue/></SelectTrigger>
                                            <SelectContent>
                                                {generateAcademicTerms().map(term => <SelectItem key={term.value} value={term.label}>{term.label}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Date</Label>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                            <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !examDate && "text-muted-foreground")}>
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {examDate ? format(examDate, "PPP") : <span>Pick a date</span>}
                                            </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={examDate} onSelect={setExamDate} initialFocus/></PopoverContent>
                                        </Popover>
                                        <Input type="hidden" name="date" value={examDate?.toISOString()} />
                                    </div>
                                </CardContent>
                                <CardFooter>
                                    <Button type="submit" disabled={isCreatingExam}>
                                        {isCreatingExam && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                                        <PlusCircle className="mr-2 h-4 w-4"/>
                                        Create Exam
                                    </Button>
                                </CardFooter>
                             </form>
                        </Card>
                        <Card>
                             <CardHeader>
                                <CardTitle>Active Exams</CardTitle>
                                <CardDescription>A log of all open examination periods.</CardDescription>
                             </CardHeader>
                             <CardContent>
                                {isLoading.exams ? <div className="flex justify-center"><Loader2 className="h-6 w-6 animate-spin"/></div> :
                                    <Table>
                                        <TableHeader><TableRow><TableHead>Title</TableHead><TableHead>Date</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                                        <TableBody>
                                            {openExams.map(exam => (
                                                <TableRow key={exam.id}>
                                                    <TableCell className="font-medium">{exam.title}</TableCell>
                                                    <TableCell>{exam.date.toDate().toLocaleDateString()}</TableCell>
                                                    <TableCell className="text-right space-x-1">
                                                         <Button variant="secondary" size="sm" onClick={() => handlePublish(exam.id)}>
                                                            <Send className="mr-2 h-4 w-4" /> Publish
                                                        </Button>
                                                        <Button variant="outline" size="sm" onClick={() => handleExamStatusChange(exam.id, 'Closed')}>
                                                            <Archive className="mr-2 h-4 w-4" /> Close
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                            {openExams.length === 0 && <TableRow><TableCell colSpan={3} className="text-center h-24">No open exams.</TableCell></TableRow>}
                                        </TableBody>
                                    </Table>
                                }
                             </CardContent>
                        </Card>
                     </div>
                </TabsContent>
                 <TabsContent value="archives" className="mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Archived Exams</CardTitle>
                            <CardDescription>A historical record of all closed examination periods.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {isLoading.exams ? <div className="flex justify-center"><Loader2 className="h-6 w-6 animate-spin"/></div> :
                                <Table>
                                    <TableHeader><TableRow><TableHead>Title</TableHead><TableHead>Term</TableHead><TableHead>Date</TableHead><TableHead>Action</TableHead></TableRow></TableHeader>
                                    <TableBody>
                                        {archivedExams.map(exam => (
                                            <TableRow key={exam.id}>
                                                <TableCell className="font-medium">{exam.title}</TableCell>
                                                <TableCell>{exam.term}</TableCell>
                                                <TableCell>{exam.date.toDate().toLocaleDateString()}</TableCell>
                                                 <TableCell>
                                                    <Button variant="ghost" size="sm" onClick={() => handleExamStatusChange(exam.id, 'Open')}>
                                                        <ArchiveRestore className="mr-2 h-4 w-4" /> Re-open
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        {archivedExams.length === 0 && <TableRow><TableCell colSpan={4} className="text-center h-24">No archived exams.</TableCell></TableRow>}
                                    </TableBody>
                                </Table>
                            }
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
