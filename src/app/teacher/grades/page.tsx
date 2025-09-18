
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
  Filter,
  ChevronDown,
  Edit,
  Plus,
  File,
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
import { firestore, auth } from '@/lib/firebase';
import { collection, query, onSnapshot, orderBy, getDocs, where, getDoc, doc, updateDoc, writeBatch, setDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { useSearchParams } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/auth-context';
import { isPast } from 'date-fns';
import Link from 'next/link';

type Exam = {
    id: string;
    title: string;
    classId: string;
    className: string;
    subject: string;
    date: Timestamp;
    status: 'Open' | 'Pending Approval' | 'Closed';
};

type TeacherClass = {
  id: string;
  name: string;
};

const getStatusBadge = (status: Exam['status']) => {
    switch(status) {
        case 'Open': return <Badge variant="default" className="bg-green-600 hover:bg-green-700">🟢 Open</Badge>;
        case 'Pending Approval': return <Badge variant="secondary" className="bg-yellow-500 text-white hover:bg-yellow-600">🟡 Pending Approval</Badge>;
        case 'Closed': return <Badge variant="destructive" className="bg-red-600">🔴 Closed</Badge>;
    }
}

export default function TeacherGradesPage() {
    const searchParams = useSearchParams();
    const schoolId = searchParams.get('schoolId');
    const { toast } = useToast();
    const { user } = useAuth();
    
    const [exams, setExams] = React.useState<Exam[]>([]);
    const [teacherClasses, setTeacherClasses] = React.useState<TeacherClass[]>([]);
    const [teacherSubjects, setTeacherSubjects] = React.useState<string[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);

    const [classFilter, setClassFilter] = React.useState('all');
    const [subjectFilter, setSubjectFilter] = React.useState('all');
    const [termFilter, setTermFilter] = React.useState('term2-2024');

    // Fetch classes and subjects taught by the teacher
    React.useEffect(() => {
        if (!schoolId || !user) return;
        const teacherId = user.uid;
        
        const classesQuery = query(collection(firestore, `schools/${schoolId}/classes`), where('teacherId', '==', teacherId));
        const unsubClasses = onSnapshot(classesQuery, (snapshot) => {
            const classesData = snapshot.docs.map(doc => ({ id: doc.id, name: `${doc.data().name} ${doc.data().stream || ''}`.trim() }));
            setTeacherClasses(classesData);
        });

        const subjectsQuery = query(collection(firestore, 'schools', schoolId, 'subjects'), where('teachers', 'array-contains', user.displayName));
        const unsubSubjects = onSnapshot(subjectsQuery, (snapshot) => {
            setTeacherSubjects(snapshot.docs.map(doc => doc.data().name));
        });

        return () => {
            unsubClasses();
            unsubSubjects();
        };
    }, [schoolId, user]);

    // Fetch exams based on teacher's classes
    React.useEffect(() => {
        if (!schoolId || teacherClasses.length === 0) {
            setIsLoading(false);
            return;
        }

        const classIds = teacherClasses.map(c => c.id);
        
        setIsLoading(true);
        const examsQuery = query(collection(firestore, `schools/${schoolId}/exams`), where('classId', 'in', classIds));
        const unsubscribe = onSnapshot(examsQuery, (snapshot) => {
            const examsData = snapshot.docs.map(doc => {
                const data = doc.data();
                const isDueDatePast = isPast(data.dueDate?.toDate() || new Date());
                return { 
                    id: doc.id, 
                    ...data,
                    // Simplified status logic
                    status: isDueDatePast ? 'Closed' : 'Open' 
                } as Exam
            });
            setExams(examsData);
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [schoolId, teacherClasses]);

    const filteredExams = exams.filter(exam => {
        const classMatch = classFilter === 'all' || exam.classId === classFilter;
        const subjectMatch = subjectFilter === 'all' || exam.subject === subjectFilter;
        // Term filter logic would be more complex and is mocked for now
        return classMatch && subjectMatch;
    });

    if (!schoolId) {
        return <div className="p-8">Error: School ID is missing from URL.</div>
    }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
       <div className="mb-6">
        <h1 className="font-headline text-3xl font-bold flex items-center gap-2"><FileText className="h-8 w-8 text-primary"/>Grades &amp; Exams</h1>
        <p className="text-muted-foreground">View assigned exams and enter student marks.</p>
       </div>
        
        <Card>
            <CardHeader>
                <CardTitle>My Assigned Exams</CardTitle>
                <CardDescription>A list of all exams for your assigned classes and subjects.</CardDescription>
                <div className="pt-4 flex flex-col md:flex-row md:items-center gap-4">
                    <Select value={classFilter} onValueChange={setClassFilter}>
                        <SelectTrigger className="w-full md:w-[180px]">
                            <SelectValue placeholder="Filter by class..." />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All My Classes</SelectItem>
                            {teacherClasses.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                     <Select value={subjectFilter} onValueChange={setSubjectFilter}>
                        <SelectTrigger className="w-full md:w-[180px]">
                            <SelectValue placeholder="Filter by subject..." />
                        </SelectTrigger>
                        <SelectContent>
                             <SelectItem value="all">All My Subjects</SelectItem>
                            {teacherSubjects.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                        </SelectContent>
                    </Select>
                     <Select value={termFilter} onValueChange={setTermFilter}>
                        <SelectTrigger className="w-full md:w-[180px]">
                            <SelectValue placeholder="Filter by term..." />
                        </SelectTrigger>
                        <SelectContent>
                             <SelectItem value="term2-2024">Term 2, 2024</SelectItem>
                             <SelectItem value="term1-2024">Term 1, 2024</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </CardHeader>
            <CardContent>
                <div className="w-full overflow-auto rounded-lg border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Exam Title</TableHead>
                                <TableHead>Class & Subject</TableHead>
                                <TableHead>Exam Date</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow><TableCell colSpan={5} className="h-24 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto"/></TableCell></TableRow>
                            ) : filteredExams.length > 0 ? (
                                filteredExams.map(exam => (
                                    <TableRow key={exam.id}>
                                        <TableCell className="font-semibold">{exam.title}</TableCell>
                                        <TableCell>
                                            <div className="font-medium">{exam.className}</div>
                                            <div className="text-sm text-muted-foreground">{exam.subject}</div>
                                        </TableCell>
                                        <TableCell>{exam.date.toDate().toLocaleDateString()}</TableCell>
                                        <TableCell>{getStatusBadge(exam.status)}</TableCell>
                                        <TableCell className="text-right space-x-2">
                                            <Button variant="outline" size="sm" disabled={exam.status !== 'Open'}>
                                                <Plus className="mr-2 h-4 w-4"/>
                                                Enter Marks
                                            </Button>
                                            <Button variant="secondary" size="sm" disabled={exam.status === 'Open'}>
                                                <File className="mr-2 h-4 w-4"/>
                                                View Results
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow><TableCell colSpan={5} className="h-24 text-center">No exams found for the selected filters.</TableCell></TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    </div>
  );
}
