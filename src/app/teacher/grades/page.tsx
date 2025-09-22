

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
import { FileText, Loader2, Save } from 'lucide-react';
import { firestore } from '@/lib/firebase';
import { collection, onSnapshot, query, where, getDocs, Timestamp, orderBy } from 'firebase/firestore';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import { saveGradesAction } from './actions';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { light } from '@/lib/haptic';

type Student = {
    id: string;
    name: string;
    avatarUrl: string;
    grades?: Record<string, { grade: string, status: string }>; 
    average?: number;
    rank?: number;
};

type Subject = {
    id: string;
    name: string;
};

type TeacherClass = {
  id: string;
  name: string;
};

type Exam = {
    id: string;
    title: string;
    date: Timestamp;
};

type GradeRecord = {
    studentId: string;
    subject: string;
    grade: string;
    examId: string;
    status: string;
}

export default function TeacherGradesPage() {
    const searchParams = useSearchParams();
    const schoolId = searchParams.get('schoolId');
    const { user } = useAuth();
    const { toast } = useToast();

    const [allClasses, setAllClasses] = React.useState<TeacherClass[]>([]);
    const [allSubjects, setAllSubjects] = React.useState<Subject[]>([]);
    const [studentsInClass, setStudentsInClass] = React.useState<Student[]>([]);
    const [grades, setGrades] = React.useState<Record<string, string>>({});
    const [openExams, setOpenExams] = React.useState<Exam[]>([]);
    
    // State for grade entry
    const [entryExamId, setEntryExamId] = React.useState<string>('');
    const [entryClassId, setEntryClassId] = React.useState<string>('');
    const [entrySubject, setEntrySubject] = React.useState<string>('');
    
    // State for rankings view
    const [rankingExamId, setRankingExamId] = React.useState<string>('');
    const [rankingClassId, setRankingClassId] = React.useState<string>('');
    const [rankedStudents, setRankedStudents] = React.useState<Student[]>([]);
    const [rankingSubjects, setRankingSubjects] = React.useState<string[]>([]);
    
    const [isLoading, setIsLoading] = React.useState({
        classes: true,
        subjects: true,
        students: false,
        exams: true,
        rankings: false,
    });
    const [isSaving, setIsSaving] = React.useState(false);

    React.useEffect(() => {
        if (!schoolId || !user) return;

        const examsQuery = query(collection(firestore, `schools/${schoolId}/exams`), where('status', '==', 'Open'));
        const unsubExams = onSnapshot(examsQuery, (snapshot) => {
            setOpenExams(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Exam)));
            setIsLoading(prev => ({ ...prev, exams: false }));
        });

        const classesQuery = query(collection(firestore, `schools/${schoolId}/classes`), where('teacherId', '==', user.uid));
        const unsubClasses = onSnapshot(classesQuery, (snapshot) => {
            const classesData = snapshot.docs.map(doc => ({ id: doc.id, name: `${doc.data().name} ${doc.data().stream || ''}`.trim() }));
            setAllClasses(classesData);
            setIsLoading(prev => ({ ...prev, classes: false }));
        });

        const subjectsQuery = query(collection(firestore, `schools/${schoolId}/subjects`));
        const unsubSubjects = onSnapshot(subjectsQuery, (snapshot) => {
            const subjectsData = snapshot.docs.map(doc => ({ id: doc.id, name: doc.data().name }));
            setAllSubjects(subjectsData);
            setIsLoading(prev => ({ ...prev, subjects: false }));
        });

        return () => {
            unsubExams();
            unsubClasses();
            unsubSubjects();
        };
    }, [schoolId, user]);

    // Fetch students for grade entry
    React.useEffect(() => {
        if (!entryClassId || !schoolId) {
            setStudentsInClass([]);
            return;
        }

        setIsLoading(prev => ({ ...prev, students: true }));
        const studentsQuery = query(collection(firestore, `schools/${schoolId}/students`), where('classId', '==', entryClassId), orderBy('name'));
        const unsubscribe = onSnapshot(studentsQuery, (snapshot) => {
            const studentsData = snapshot.docs.map(doc => ({
                id: doc.id,
                name: doc.data().name,
                avatarUrl: doc.data().avatarUrl || `https://picsum.photos/seed/${doc.id}/100`,
            } as Student));
            setStudentsInClass(studentsData);
            setGrades({}); 
            setIsLoading(prev => ({ ...prev, students: false }));
        });

        return () => unsubscribe();
    }, [entryClassId, schoolId]);

    // Effect to reset grades when context changes
    React.useEffect(() => {
        setGrades({});
    }, [entryClassId, entrySubject, entryExamId]);
    
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
                        const studentGrades: Record<string, { grade: string, status: string }> = {};
                         gradesData.forEach(grade => {
                             if (grade.studentId === student.id) {
                                 studentGrades[grade.subject] = { grade: grade.grade, status: grade.status };
                                 subjectsInView.add(grade.subject);
                             }
                         });

                        const numericGrades = Object.values(studentGrades).map(g => parseInt(g.grade, 10)).filter(g => !isNaN(g));
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


    const handleGradeChange = (studentId: string, grade: string) => {
        setGrades(prev => ({ ...prev, [studentId]: grade }));
    };

    const handleSaveGrades = async () => {
        if (!entryClassId || !entrySubject || Object.keys(grades).length === 0 || !user || !entryExamId) {
            toast({ title: 'Missing Information', description: 'Please select an exam, class, subject, and enter at least one grade.', variant: 'destructive' });
            return;
        }
        setIsSaving(true);
        
        const gradeDataForAction = Object.entries(grades).reduce((acc, [studentId, grade]) => {
          const student = studentsInClass.find(s => s.id === studentId);
          if (student) {
            acc[studentId] = { grade, studentName: student.name };
          }
          return acc;
        }, {} as { [studentId: string]: { grade: string; studentName: string } });

        const result = await saveGradesAction(schoolId!, entryClassId, entrySubject, entryExamId, gradeDataForAction, { id: user.uid, name: user.displayName || 'Teacher' });

        if (result.success) {
            toast({ title: 'Grades Saved', description: result.message });
            setGrades({});
        } else {
            toast({ title: 'Error', description: result.message, variant: 'destructive' });
        }
        setIsSaving(false);
    };

    const isGradeEntryReady = entryClassId && entrySubject && entryExamId;

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <div className="mb-6">
                <h1 className="font-headline text-3xl font-bold flex items-center gap-2">
                    <FileText className="h-8 w-8 text-primary" />
                    Grade Entry
                </h1>
                <p className="text-muted-foreground">Select an exam, class, and subject to enter student results.</p>
            </div>
            
            <Tabs defaultValue="entry">
                 <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="entry">Grade Entry</TabsTrigger>
                    <TabsTrigger value="rankings">Class Rankings</TabsTrigger>
                </TabsList>
                <TabsContent value="entry" className="mt-4">
                    <Card>
                        <CardHeader>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label>1. Select Exam</Label>
                                    <Select value={entryExamId} onValueChange={setEntryExamId} disabled={isLoading.exams}>
                                        <SelectTrigger><SelectValue placeholder="Select an active exam..." /></SelectTrigger>
                                        <SelectContent>
                                            {openExams.map(exam => <SelectItem key={exam.id} value={exam.id}>{exam.title}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>2. Select Class</Label>
                                    <Select value={entryClassId} onValueChange={setEntryClassId} disabled={!entryExamId || isLoading.classes}>
                                        <SelectTrigger><SelectValue placeholder="Select a class..." /></SelectTrigger>
                                        <SelectContent>
                                            {allClasses.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>3. Select Subject</Label>
                                    <Select value={entrySubject} onValueChange={setEntrySubject} disabled={!entryClassId || isLoading.subjects}>
                                        <SelectTrigger><SelectValue placeholder="Select a subject..." /></SelectTrigger>
                                        <SelectContent>
                                            {allSubjects.map(s => <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
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
                                                <TableHead>Student Name</TableHead>
                                                <TableHead className="w-[150px]">Grade / Score</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {studentsInClass.length > 0 ? (
                                                studentsInClass.map((student) => (
                                                    <TableRow key={student.id}>
                                                        <TableCell>
                                                            <div className="flex items-center gap-3">
                                                                <Avatar className="h-9 w-9">
                                                                    <AvatarImage src={student.avatarUrl} alt={student.name} />
                                                                    <AvatarFallback>{student.name?.charAt(0)}</AvatarFallback>
                                                                </Avatar>
                                                                <span className="font-medium">{student.name}</span>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Input
                                                                placeholder="Enter grade"
                                                                disabled={!isGradeEntryReady}
                                                                value={grades[student.id] || ''}
                                                                onChange={(e) => handleGradeChange(student.id, e.target.value)}
                                                            />
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            ) : (
                                                <TableRow>
                                                    <TableCell colSpan={2} className="h-24 text-center text-muted-foreground">
                                                        {!entryExamId ? 'Select an exam to begin.' : !entryClassId ? 'Select a class to view students.' : 'No students found in this class.'}
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}
                        </CardContent>
                        {isGradeEntryReady && studentsInClass.length > 0 && (
                            <CardFooter className="justify-end">
                                <Button onClick={() => {light(); handleSaveGrades()}} disabled={isSaving}>
                                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4"/>}
                                    Save Grades
                                </Button>
                            </CardFooter>
                        )}
                    </Card>
                </TabsContent>
                <TabsContent value="rankings" className="mt-4">
                    <Card>
                        <CardHeader>
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
                                                                    <AvatarImage src={student.avatarUrl} alt={student.name} />
                                                                    <AvatarFallback>{student.name?.charAt(0)}</AvatarFallback>
                                                                </Avatar>
                                                                {student.name}
                                                            </div>
                                                        </TableCell>
                                                        {rankingSubjects.map(subject => (
                                                            <TableCell key={subject} className="text-center font-semibold">
                                                                {student.grades?.[subject]?.grade || '—'}
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
            </Tabs>
        </div>
    );
}

    
