
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
import { collection, onSnapshot, query, where, getDocs, Timestamp, orderBy, addDoc, serverTimestamp, doc, updateDoc } from 'firebase/firestore';
import { useSearchParams } from 'next/navigation';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/auth-context';
import { saveGradesAction } from './actions';

type Student = {
    id: string;
    name: string;
    avatarUrl: string;
};

type TeacherClass = {
  id: string;
  name: string;
};

type Subject = {
    id: string;
    name: string;
};

type Exam = {
    id: string;
    title: string;
    term: string;
    date: Timestamp;
    status: 'Open' | 'Closed';
}

export default function TeacherGradesPage() {
    const searchParams = useSearchParams();
    const schoolId = searchParams.get('schoolId');
    const { user } = useAuth();
    const { toast } = useToast();

    const [allClasses, setAllClasses] = React.useState<TeacherClass[]>([]);
    const [allSubjects, setAllSubjects] = React.useState<Subject[]>([]);
    const [students, setStudents] = React.useState<Student[]>([]);
    const [openExams, setOpenExams] = React.useState<Exam[]>([]);
    
    const [selectedClassId, setSelectedClassId] = React.useState<string>('');
    const [selectedSubject, setSelectedSubject] = React.useState<string>('');
    const [selectedExamId, setSelectedExamId] = React.useState<string>('');

    const [grades, setGrades] = React.useState<Record<string, { grade: string, studentName: string }>>({});
    
    const [isLoading, setIsLoading] = React.useState({
        classes: true,
        subjects: true,
        students: false,
        exams: true,
    });
    const [isSaving, setIsSaving] = React.useState(false);


    // Fetch teacher's classes and subjects
    React.useEffect(() => {
        if (!schoolId || !user) return;
        const teacherId = user.uid;
        const teacherName = user.displayName;

        const classesQuery = query(collection(firestore, `schools/${schoolId}/classes`), where('teacherId', '==', teacherId));
        const unsubClasses = onSnapshot(classesQuery, (snapshot) => {
            const classesData = snapshot.docs.map(doc => ({ id: doc.id, name: `${doc.data().name} ${doc.data().stream || ''}`.trim() }));
            setAllClasses(classesData);
            setIsLoading(prev => ({ ...prev, classes: false }));
        });

        const subjectsQuery = query(collection(firestore, `schools/${schoolId}/subjects`), where('teachers', 'array-contains', teacherName));
        const unsubSubjects = onSnapshot(subjectsQuery, (snapshot) => {
            setAllSubjects(snapshot.docs.map(doc => ({ id: doc.id, name: doc.data().name } as Subject)));
            setIsLoading(prev => ({ ...prev, subjects: false }));
        });

        const openExamsQuery = query(collection(firestore, `schools/${schoolId}/exams`), where('status', '==', 'Open'), orderBy('date', 'desc'));
        const unsubOpenExams = onSnapshot(openExamsQuery, (snapshot) => {
            setOpenExams(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Exam)));
            setIsLoading(prev => ({ ...prev, exams: false }));
        });

        return () => {
            unsubClasses();
            unsubSubjects();
            unsubOpenExams();
        };
    }, [schoolId, user]);

    // Fetch students when a class is selected
    React.useEffect(() => {
        if (!selectedClassId || !schoolId) {
            setStudents([]);
            return;
        }
        
        setIsLoading(prev => ({ ...prev, students: true }));
        const studentsQuery = query(collection(firestore, `schools/${schoolId}/users`), where('role', '==', 'Student'), where('classId', '==', selectedClassId), orderBy('name'));
        const unsubStudents = onSnapshot(studentsQuery, (snapshot) => {
            setStudents(snapshot.docs.map(doc => ({
                id: doc.id,
                name: doc.data().name,
                avatarUrl: doc.data().avatarUrl || `https://picsum.photos/seed/${doc.id}/100`,
            } as Student)));
            setIsLoading(prev => ({ ...prev, students: false }));
        });

        return () => unsubStudents();
    }, [selectedClassId, schoolId]);

    const handleGradeChange = (studentId: string, studentName: string, grade: string) => {
        setGrades(prev => ({
            ...prev,
            [studentId]: { grade, studentName }
        }));
    };

    const handleSaveGrades = async () => {
        if (!selectedClassId || !selectedSubject || !selectedExamId || Object.keys(grades).length === 0 || !user) {
            toast({ title: 'Missing Information', description: 'Please select a class, subject, exam, and enter at least one grade.', variant: 'destructive'});
            return;
        }

        setIsSaving(true);
        const result = await saveGradesAction(schoolId!, selectedClassId, selectedSubject, selectedExamId, grades, { id: user.uid, name: user.displayName || 'Teacher' });

        if (result.success) {
            toast({ title: 'Grades Submitted', description: result.message });
            setGrades({}); // Clear form after successful save
        } else {
            toast({ title: 'Error', description: result.message, variant: 'destructive' });
        }
        setIsSaving(false);
    }

    const canShowTable = selectedClassId && selectedSubject && selectedExamId;

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <div className="mb-6">
                <h1 className="font-headline text-3xl font-bold flex items-center gap-2">
                    <FileText className="h-8 w-8 text-primary" />
                    Grade Entry
                </h1>
                <p className="text-muted-foreground">Enter student grades for a specific class, subject, and exam.</p>
            </div>
            
            <Card>
                <CardHeader>
                    <CardTitle>Select Details</CardTitle>
                    <CardDescription>Choose a class, subject, and exam to begin entering grades.</CardDescription>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
                        <div className="space-y-2">
                            <Label>Class</Label>
                            <Select value={selectedClassId} onValueChange={setSelectedClassId} disabled={isLoading.classes}>
                                <SelectTrigger><SelectValue placeholder="Select a class..." /></SelectTrigger>
                                <SelectContent>
                                    {allClasses.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Subject</Label>
                             <Select value={selectedSubject} onValueChange={setSelectedSubject} disabled={isLoading.subjects}>
                                <SelectTrigger><SelectValue placeholder="Select a subject..." /></SelectTrigger>
                                <SelectContent>
                                    {allSubjects.map(s => <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Exam</Label>
                             <Select value={selectedExamId} onValueChange={setSelectedExamId} disabled={isLoading.exams}>
                                <SelectTrigger><SelectValue placeholder="Select an exam..." /></SelectTrigger>
                                <SelectContent>
                                    {openExams.map(exam => <SelectItem key={exam.id} value={exam.id}>{exam.title}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardHeader>
                {canShowTable && (
                <>
                <CardContent>
                    {isLoading.students ? (
                        <div className="flex h-64 items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>
                    ) : (
                        <div className="w-full overflow-auto rounded-lg border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Student</TableHead>
                                        <TableHead className="w-48">Grade/Score (%)</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {students.length > 0 ? (
                                        students.map((student) => (
                                            <TableRow key={student.id}>
                                                <TableCell className="font-medium">
                                                    <div className="flex items-center gap-2">
                                                        <Avatar className="h-9 w-9">
                                                            <AvatarImage src={student.avatarUrl} />
                                                            <AvatarFallback>{student.name?.charAt(0)}</AvatarFallback>
                                                        </Avatar>
                                                        {student.name}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Input 
                                                        type="number" 
                                                        placeholder="Enter grade" 
                                                        max="100" 
                                                        min="0"
                                                        value={grades[student.id]?.grade || ''}
                                                        onChange={(e) => handleGradeChange(student.id, student.name, e.target.value)}
                                                    />
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={2} className="h-24 text-center text-muted-foreground">
                                                No students found in this class.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
                <CardFooter className="flex justify-end">
                    <Button onClick={handleSaveGrades} disabled={isSaving}>
                        {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4" />}
                        Save Grades
                    </Button>
                </CardFooter>
                </>
                )}
            </Card>
        </div>
    );
}
