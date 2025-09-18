
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
import { Button } from '@/components/ui/button';
import {
  FileText,
  Save,
  Loader2,
} from 'lucide-react';
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
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { firestore, auth } from '@/lib/firebase';
import { collection, query, onSnapshot, orderBy, getDocs, where, getDoc, doc, updateDoc, writeBatch, setDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { useSearchParams } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/auth-context';
import { logAuditEvent } from '@/lib/audit-log.service';


type Exam = {
    id: string;
    title: string;
    classId: string;
    subject: string;
    date: Timestamp;
};

type Student = {
    id: string;
    name: string;
    avatarUrl: string;
};

type Grade = {
    studentId: string;
    grade: string;
};

export default function TeacherGradesPage() {
    const searchParams = useSearchParams();
    const schoolId = searchParams.get('schoolId');
    const { toast } = useToast();
    const { user } = useAuth();
    
    const [exams, setExams] = React.useState<Exam[]>([]);
    const [students, setStudents] = React.useState<Student[]>([]);
    const [grades, setGrades] = React.useState<Record<string, string>>({});
    
    const [selectedClass, setSelectedClass] = React.useState<string>('');
    const [selectedExam, setSelectedExam] = React.useState<string>('');
    const [teacherClasses, setTeacherClasses] = React.useState<{id: string, name: string}[]>([]);
    const [isSaving, setIsSaving] = React.useState(false);

    // Fetch classes taught by the teacher
    React.useEffect(() => {
        if (!schoolId || !user) return;
        const teacherId = user.uid;
        
        const classesQuery = query(collection(firestore, `schools/${schoolId}/classes`), where('teacherId', '==', teacherId));
        const unsubscribe = onSnapshot(classesQuery, (snapshot) => {
            const classesData = snapshot.docs.map(doc => ({ id: doc.id, name: `${doc.data().name} ${doc.data().stream || ''}`.trim() }));
            setTeacherClasses(classesData);
            if (classesData.length > 0 && !selectedClass) {
                setSelectedClass(classesData[0].id);
            }
        });
        return () => unsubscribe();
    }, [schoolId, user, selectedClass]);

    // Fetch exams for the selected class
    React.useEffect(() => {
        if (!schoolId || !selectedClass) return;
        
        const examsQuery = query(collection(firestore, `schools/${schoolId}/exams`), where('classId', '==', selectedClass));
        const unsubscribe = onSnapshot(examsQuery, (snapshot) => {
            const examsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Exam));
            setExams(examsData);
            if (examsData.length > 0 && !selectedExam) {
                setSelectedExam(examsData[0].id);
            }
        });

        return () => unsubscribe();
    }, [schoolId, selectedClass, selectedExam]);

    // Fetch students and existing grades when class and exam change
    React.useEffect(() => {
        if (!schoolId || !selectedClass || !selectedExam) return;

        const fetchStudentsAndGrades = async () => {
            const studentsQuery = query(collection(firestore, `schools/${schoolId}/students`), where('classId', '==', selectedClass), orderBy('name'));
            const studentsSnapshot = await getDocs(studentsQuery);
            const studentData = studentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Student));
            setStudents(studentData);
            
            const studentIds = studentData.map(s => s.id);
            if (studentIds.length === 0) {
                setGrades({});
                return;
            }

            const gradesQuery = query(
                collection(firestore, `schools/${schoolId}/grades`),
                where('assessmentId', '==', selectedExam),
                where('studentId', 'in', studentIds)
            );
            const gradesSnapshot = await getDocs(gradesQuery);
            const gradeData: Record<string, string> = {};
            gradesSnapshot.forEach(doc => {
                gradeData[doc.data().studentId] = doc.data().grade;
            });
            setGrades(gradeData);
        };

        fetchStudentsAndGrades();
    }, [schoolId, selectedClass, selectedExam]);

    const handleGradeChange = (studentId: string, grade: string) => {
        setGrades(prev => ({ ...prev, [studentId]: grade }));
    };

    const handleSaveGrades = async () => {
        if (!schoolId || !user || !selectedExam || !selectedClass) {
            toast({ variant: 'destructive', title: 'Error', description: 'Cannot save grades due to missing information.'});
            return;
        }
        
        setIsSaving(true);
        const batch = writeBatch(firestore);
        const currentExam = exams.find(e => e.id === selectedExam);

        for (const student of students) {
            const grade = grades[student.id];
            if (grade !== undefined) {
                const gradeRef = doc(firestore, `schools/${schoolId}/grades`, `${selectedExam}_${student.id}`);
                batch.set(gradeRef, {
                    studentId: student.id,
                    studentRef: doc(firestore, 'schools', schoolId, 'students', student.id),
                    assessmentId: selectedExam,
                    assessmentTitle: currentExam?.title,
                    subject: currentExam?.subject,
                    grade: grade,
                    classId: selectedClass,
                    teacherId: user.uid,
                    teacherName: user.displayName || 'Teacher',
                    date: serverTimestamp(),
                    status: 'Pending Approval', // Grades may need HOD or admin approval
                }, { merge: true });
            }
        }

        try {
            await batch.commit();
            toast({ title: 'Grades Saved', description: 'Student marks have been submitted for moderation.' });
        } catch (error) {
            console.error(error);
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to save grades.' });
        } finally {
            setIsSaving(false);
        }
    };


    if (!schoolId) {
        return <div className="p-8">Error: School ID is missing from URL.</div>
    }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
       <div className="mb-6">
        <h1 className="font-headline text-3xl font-bold flex items-center gap-2"><FileText className="h-8 w-8 text-primary"/>Grades &amp; Exams</h1>
        <p className="text-muted-foreground">Enter and manage student grades for assessments.</p>
       </div>
        
        <Card>
            <CardHeader>
                <CardTitle>Gradebook</CardTitle>
                <CardDescription>Select a class and exam to enter or view marks.</CardDescription>
                <div className="pt-4 flex flex-col md:flex-row md:items-center gap-4">
                     <Select value={selectedClass} onValueChange={setSelectedClass}>
                        <SelectTrigger className="w-full md:w-[240px]">
                            <SelectValue placeholder="Select a Class"/>
                        </SelectTrigger>
                        <SelectContent>{teacherClasses.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                    </Select>
                    <Select value={selectedExam} onValueChange={setSelectedExam} disabled={exams.length === 0}>
                        <SelectTrigger className="w-full md:w-[240px]">
                            <SelectValue placeholder="Select an Exam"/>
                        </SelectTrigger>
                        <SelectContent>{exams.map(e => <SelectItem key={e.id} value={e.id}>{e.title} - {e.subject}</SelectItem>)}</SelectContent>
                    </Select>
                </div>
            </CardHeader>
            <CardContent>
                <div className="w-full overflow-auto rounded-lg border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Student</TableHead>
                                <TableHead className="w-40 text-center">Score / Grade</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {students.map(student => (
                                <TableRow key={student.id}>
                                    <TableCell>
                                         <div className="flex items-center gap-3">
                                            <Avatar className="h-9 w-9">
                                                <AvatarImage src={student.avatarUrl} alt={student.name} />
                                                <AvatarFallback>{student.name.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                            <span className="font-medium">{student.name}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Input 
                                            className="text-center font-semibold"
                                            placeholder="Enter mark..."
                                            value={grades[student.id] || ''}
                                            onChange={(e) => handleGradeChange(student.id, e.target.value)}
                                        />
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
             <CardFooter className="justify-end">
                <Button onClick={handleSaveGrades} disabled={isSaving}>
                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4"/>}
                    Save Grades
                </Button>
            </CardFooter>
        </Card>
    </div>
  );
}
