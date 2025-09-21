
'use client';

import * as React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
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
import { FileText, Loader2 } from 'lucide-react';
import { firestore } from '@/lib/firebase';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { useSearchParams } from 'next/navigation';
import { Label } from '@/components/ui/label';

type Student = {
    id: string;
    name: string;
    avatarUrl: string;
    grades: Record<string, string>; // { [subjectName]: grade }
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

export default function AdminGradesPage() {
    const searchParams = useSearchParams();
    const schoolId = searchParams.get('schoolId');

    const [allClasses, setAllClasses] = React.useState<TeacherClass[]>([]);
    const [allSubjects, setAllSubjects] = React.useState<string[]>([]);
    const [studentsWithGrades, setStudentsWithGrades] = React.useState<Student[]>([]);
    
    const [selectedClassId, setSelectedClassId] = React.useState<string>('');
    
    const [isLoading, setIsLoading] = React.useState({
        classes: true,
        subjects: true,
        students: false,
    });

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

        return () => {
            unsubClasses();
            unsubSubjects();
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
            const studentList = studentsSnapshot.docs.map(doc => ({
                id: doc.id,
                name: doc.data().name,
                avatarUrl: doc.data().avatarUrl || `https://picsum.photos/seed/${doc.id}/100`,
                grades: {}
            } as Student));
            
            if (studentList.length > 0) {
                 const studentIds = studentList.map(s => s.id);
                 const gradesQuery = query(collection(firestore, `schools/${schoolId}/grades`), where('studentId', 'in', studentIds));
                 const gradesSnapshot = await getDocs(gradesQuery);
                 const gradesData: GradeRecord[] = gradesSnapshot.docs.map(d => d.data() as GradeRecord);

                 studentList.forEach(student => {
                     gradesData.forEach(grade => {
                         if (grade.studentId === student.id) {
                             student.grades[grade.subject] = grade.grade;
                         }
                     });
                 });
            }
            
            setStudentsWithGrades(studentList);
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


    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <div className="mb-6">
                <h1 className="font-headline text-3xl font-bold flex items-center gap-2">
                    <FileText className="h-8 w-8 text-primary" />
                    Grades & Exams
                </h1>
                <p className="text-muted-foreground">Review student performance across all subjects and classes.</p>
            </div>
            
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
                                        <TableHead>Student</TableHead>
                                        {subjectsInView.map(subject => (
                                            <TableHead key={subject} className="text-center">{subject}</TableHead>
                                        ))}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {studentsWithGrades.length > 0 ? (
                                        studentsWithGrades.map((student) => (
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
                                                {subjectsInView.map(subject => (
                                                    <TableCell key={subject} className="text-center font-semibold">
                                                        {student.grades[subject] || '—'}
                                                    </TableCell>
                                                ))}
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={subjectsInView.length + 1} className="h-24 text-center text-muted-foreground">
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
        </div>
    );
}

