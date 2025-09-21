

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
import { FileText, Loader2, CalendarIcon, PlusCircle } from 'lucide-react';
import { firestore } from '@/lib/firebase';
import { collection, onSnapshot, query, where, getDocs, Timestamp, orderBy, addDoc, serverTimestamp } from 'firebase/firestore';
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
import { createExamAction } from './actions';

type Student = {
    id: string;
    name: string;
    avatarUrl: string;
    grades: Record<string, string>; // { [subjectName]: grade }
    average: number;
    rank: number;
};

type TeacherClass = {
  id: string;
  name: string;
};

type GradeRecord = {
    studentId: string;
    subject: string;
    grade: string;
}

type Exam = {
    id: string;
    title: string;
    term: string;
    date: Timestamp;
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
        terms.push({ value: `term1-${year}`, label: `Term 1, ${year}` });
        terms.push({ value: `term2-${year}`, label: `Term 2, ${year}` });
        terms.push({ value: `term3-${year}`, label: `Term 3, ${year}` });
    }
    return terms;
};


export default function AdminGradesPage() {
    const searchParams = useSearchParams();
    const schoolId = searchParams.get('schoolId');
    const { toast } = useToast();

    const [allClasses, setAllClasses] = React.useState<TeacherClass[]>([]);
    const [allSubjects, setAllSubjects] = React.useState<string[]>([]);
    const [studentsWithGrades, setStudentsWithGrades] = React.useState<Student[]>([]);
    const [exams, setExams] = React.useState<Exam[]>([]);
    
    const [selectedClassId, setSelectedClassId] = React.useState<string>('');
    
    const [isLoading, setIsLoading] = React.useState({
        classes: true,
        subjects: true,
        students: false,
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
            if (classesData.length > 0 && !selectedClassId) {
                setSelectedClassId(classesData[0].id);
            }
            setIsLoading(prev => ({ ...prev, classes: false }));
        });

        const subjectsQuery = query(collection(firestore, `schools/${schoolId}/subjects`));
        const unsubSubjects = onSnapshot(subjectsQuery, (snapshot) => {
            const subjectsData = snapshot.docs.map(doc => doc.data().name);
            setAllSubjects(subjectsData);
            setIsLoading(prev => ({ ...prev, subjects: false }));
        });

        const examsQuery = query(collection(firestore, `schools/${schoolId}/exams`), orderBy('date', 'desc'));
        const unsubExams = onSnapshot(examsQuery, (snapshot) => {
            setExams(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Exam)));
            setIsLoading(prev => ({ ...prev, exams: false }));
        });

        return () => {
            unsubClasses();
            unsubSubjects();
            unsubExams();
        };
    }, [schoolId, selectedClassId]);

    // Fetch students and their grades when a class is selected
    React.useEffect(() => {
        if (!selectedClassId || !schoolId) {
            setStudentsWithGrades([]);
            return;
        }

        setIsLoading(prev => ({ ...prev, students: true }));

        const studentsQuery = query(collection(firestore, `schools/${schoolId}/students`), where('classId', '==', selectedClassId));
        const unsubStudents = onSnapshot(studentsQuery, async (studentsSnapshot) => {
            const studentList: Omit<Student, 'average' | 'rank' | 'grades'>[] = studentsSnapshot.docs.map(doc => ({
                id: doc.id,
                name: doc.data().name,
                avatarUrl: doc.data().avatarUrl || `https://picsum.photos/seed/${doc.id}/100`,
            }));
            
            if (studentList.length > 0) {
                 const studentIds = studentList.map(s => s.id);
                 const gradesQuery = query(collection(firestore, `schools/${schoolId}/grades`), where('studentId', 'in', studentIds));
                 const gradesSnapshot = await getDocs(gradesQuery);
                 const gradesData: GradeRecord[] = gradesSnapshot.docs.map(d => d.data() as GradeRecord);
                 
                 const studentsWithGradesData = studentList.map(student => {
                    const studentGrades: Record<string, string> = {};
                     gradesData.forEach(grade => {
                         if (grade.studentId === student.id) {
                             studentGrades[grade.subject] = grade.grade;
                         }
                     });

                    const numericGrades = Object.values(studentGrades).map(g => parseInt(g, 10)).filter(g => !isNaN(g));
                    const average = numericGrades.length > 0 ? Math.round(numericGrades.reduce((a, b) => a + b, 0) / numericGrades.length) : 0;
                     
                     return { ...student, grades: studentGrades, average };
                 });

                studentsWithGradesData.sort((a, b) => b.average - a.average);
                
                const finalRankedList = studentsWithGradesData.map((student, index) => ({
                    ...student,
                    rank: index + 1
                }));

                setStudentsWithGrades(finalRankedList as Student[]);

            } else {
                setStudentsWithGrades([]);
            }
            
            setIsLoading(prev => ({ ...prev, students: false }));
        });

        return () => unsubStudents();
    }, [selectedClassId, schoolId]);
    
    const subjectsInView = React.useMemo(() => {
        const subjects = new Set<string>();
        studentsWithGrades.forEach(student => {
            Object.keys(student.grades).forEach(subject => subjects.add(subject));
        });
        return Array.from(subjects).sort();
    }, [studentsWithGrades]);
    
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
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="rankings">Class Rankings</TabsTrigger>
                    <TabsTrigger value="exams">Manage Exams</TabsTrigger>
                </TabsList>
                <TabsContent value="rankings" className="mt-4">
                    <Card>
                        <CardHeader>
                            <div className="space-y-2">
                                <Label>Select a Class to View Results</Label>
                                <Select value={selectedClassId} onValueChange={setSelectedClassId} disabled={isLoading.classes}>
                                    <SelectTrigger className="w-full md:w-72">
                                        <SelectValue placeholder="Select a class..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {allClasses.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {isLoading.students ? (
                                <div className="flex h-64 items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>
                            ) : (
                                <div className="w-full overflow-auto rounded-lg border">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Rank</TableHead>
                                                <TableHead>Student</TableHead>
                                                {subjectsInView.map(subject => (
                                                    <TableHead key={subject} className="text-center">{subject}</TableHead>
                                                ))}
                                                <TableHead className="text-right font-bold">Average</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {studentsWithGrades.length > 0 ? (
                                                studentsWithGrades.map((student) => (
                                                    <TableRow key={student.id}>
                                                        <TableCell className="font-bold text-lg text-center">{student.rank}</TableCell>
                                                        <TableCell className="font-medium">
                                                            <div className="flex items-center gap-2">
                                                                <Avatar className="h-9 w-9">
                                                                    <AvatarImage src={student.avatarUrl} />
                                                                    <AvatarFallback>{student.name?.charAt(0)}</AvatarFallback>
                                                                </Avatar>
                                                                {student.name}
                                                            </div>
                                                        </TableCell>
                                                        {subjectsInView.map(subject => (
                                                            <TableCell key={subject} className="text-center font-semibold">
                                                                {student.grades[subject] || '—'}
                                                            </TableCell>
                                                        ))}
                                                        <TableCell className="text-right font-extrabold text-primary">{student.average.toFixed(1)}%</TableCell>
                                                    </TableRow>
                                                ))
                                            ) : (
                                                <TableRow>
                                                    <TableCell colSpan={subjectsInView.length + 3} className="h-24 text-center text-muted-foreground">
                                                        {selectedClassId ? 'No students or grades recorded for this class.' : 'Please select a class to view results.'}
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
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
                                <CardTitle>Existing Exams</CardTitle>
                                <CardDescription>A log of all examination periods created.</CardDescription>
                             </CardHeader>
                             <CardContent>
                                {isLoading.exams ? <div className="flex justify-center"><Loader2 className="h-6 w-6 animate-spin"/></div> :
                                    <Table>
                                        <TableHeader><TableRow><TableHead>Title</TableHead><TableHead>Date</TableHead></TableRow></TableHeader>
                                        <TableBody>
                                            {exams.map(exam => (
                                                <TableRow key={exam.id}>
                                                    <TableCell className="font-medium">{exam.title}</TableCell>
                                                    <TableCell>{exam.date.toDate().toLocaleDateString()}</TableCell>
                                                </TableRow>
                                            ))}
                                            {exams.length === 0 && <TableRow><TableCell colSpan={2} className="text-center h-24">No exams created yet.</TableCell></TableRow>}
                                        </TableBody>
                                    </Table>
                                }
                             </CardContent>
                        </Card>
                     </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}

