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
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { FileText, Loader2, Save } from 'lucide-react';
import { firestore } from '@/lib/firebase';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import { saveGradesAction } from './actions';

type Student = {
    id: string;
    name: string;
    avatarUrl: string;
};

type Subject = {
    id: string;
    name: string;
};

type TeacherClass = {
  id: string;
  name: string;
};

export default function TeacherGradesPage() {
    const searchParams = useSearchParams();
    const schoolId = searchParams.get('schoolId');
    const { user } = useAuth();
    const { toast } = useToast();

    const [allClasses, setAllClasses] = React.useState<TeacherClass[]>([]);
    const [allSubjects, setAllSubjects] = React.useState<Subject[]>([]);
    const [studentsInClass, setStudentsInClass] = React.useState<Student[]>([]);
    const [grades, setGrades] = React.useState<Record<string, string>>({});
    
    const [selectedClassId, setSelectedClassId] = React.useState<string>('');
    const [selectedSubject, setSelectedSubject] = React.useState<string>('');
    
    const [isLoading, setIsLoading] = React.useState({
        classes: true,
        subjects: true,
        students: false,
    });
    const [isSaving, setIsSaving] = React.useState(false);

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
            const subjectsData = snapshot.docs.map(doc => ({ id: doc.id, name: doc.data().name }));
            setAllSubjects(subjectsData);
            setIsLoading(prev => ({ ...prev, subjects: false }));
        });

        return () => {
            unsubClasses();
            unsubSubjects();
        };
    }, [schoolId]);

    // Fetch students when a class is selected
    React.useEffect(() => {
        if (!selectedClassId || !schoolId) {
            setStudentsInClass([]);
            return;
        }

        setIsLoading(prev => ({ ...prev, students: true }));
        const studentsQuery = query(collection(firestore, `schools/${schoolId}/students`), where('classId', '==', selectedClassId));
        const unsubscribe = onSnapshot(studentsQuery, (snapshot) => {
            const studentsData = snapshot.docs.map(doc => ({
                id: doc.id,
                name: doc.data().name,
                avatarUrl: doc.data().avatarUrl || `https://picsum.photos/seed/${doc.id}/100`,
            } as Student));
            setStudentsInClass(studentsData);
            setGrades({}); // Reset grades when class changes
            setIsLoading(prev => ({ ...prev, students: false }));
        });

        return () => unsubscribe();
    }, [selectedClassId, schoolId]);

    const handleGradeChange = (studentId: string, grade: string) => {
        setGrades(prev => ({ ...prev, [studentId]: grade }));
    };

    const handleSaveGrades = async () => {
        if (!selectedClassId || !selectedSubject || Object.keys(grades).length === 0 || !user) {
            toast({ title: 'Missing Information', description: 'Please select a class, subject, and enter at least one grade.', variant: 'destructive' });
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

        const result = await saveGradesAction(schoolId!, selectedClassId, selectedSubject, gradeDataForAction, { id: user.uid, name: user.displayName || 'Teacher' });

        if (result.success) {
            toast({ title: 'Grades Saved', description: result.message });
            setGrades({}); // Clear inputs after saving
        } else {
            toast({ title: 'Error', description: result.message, variant: 'destructive' });
        }
        setIsSaving(false);
    };

    const isGradeEntryReady = selectedClassId && selectedSubject;

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <div className="mb-6">
                <h1 className="font-headline text-3xl font-bold flex items-center gap-2">
                    <FileText className="h-8 w-8 text-primary" />
                    Grade Entry
                </h1>
                <p className="text-muted-foreground">Select a class and subject to enter student results.</p>
            </div>
            
            <Card>
                <CardHeader>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <div className="space-y-2">
                            <Label>Select Class</Label>
                             <Select value={selectedClassId} onValueChange={setSelectedClassId} disabled={isLoading.classes}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a class..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {allClasses.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Select Subject</Label>
                            <Select value={selectedSubject} onValueChange={setSelectedSubject} disabled={isLoading.subjects}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a subject..." />
                                </SelectTrigger>
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
                                                {selectedClassId ? 'No students in this class.' : 'Please select a class to view students.'}
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
                        <Button onClick={handleSaveGrades} disabled={isSaving}>
                            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4"/>}
                            Save Grades
                        </Button>
                    </CardFooter>
                )}
            </Card>
        </div>
    );
}
