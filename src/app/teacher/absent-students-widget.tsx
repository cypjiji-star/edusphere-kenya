
'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { UserX, ArrowRight, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import * as React from 'react';
import { firestore, auth } from '@/lib/firebase';
import { collection, query, where, Timestamp, onSnapshot, getDoc, doc, getDocs } from 'firebase/firestore';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/auth-context';


type AbsentStudent = {
    id: string;
    name: string;
    className: string;
    attendance: 'absent' | 'late';
}

export function AbsentStudentsWidget() {
    const searchParams = useSearchParams();
    const schoolId = searchParams.get('schoolId');
    const [absentStudents, setAbsentStudents] = React.useState<AbsentStudent[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const { user } = useAuth();

    React.useEffect(() => {
        if (!schoolId || !user) {
            setIsLoading(false);
            return;
        }
        const teacherId = user.uid;

        setIsLoading(true);

        const classesQuery = query(collection(firestore, `schools/${schoolId}/classes`), where('teacherId', '==', teacherId));

        const unsubscribe = onSnapshot(classesQuery, async (classesSnapshot) => {
            const classIds = classesSnapshot.docs.map(doc => doc.id);

            if (classIds.length === 0) {
                setAbsentStudents([]);
                setIsLoading(false);
                return;
            }
            
            const today = new Date();
            const startOfToday = new Date(today.setHours(0, 0, 0, 0));

            const attendanceQuery = query(
                collection(firestore, `schools/${schoolId}/attendance`),
                where('classId', 'in', classIds),
                where('date', '>=', Timestamp.fromDate(startOfToday)),
                where('status', 'in', ['absent', 'late'])
            );

            const unsubAttendance = onSnapshot(attendanceQuery, async (attendanceSnapshot) => {
                const absentStudentData: AbsentStudent[] = [];

                for (const attendanceDoc of attendanceSnapshot.docs) {
                    const attendance = attendanceDoc.data();
                    if (attendance.studentId) {
                        const studentDocSnap = await getDoc(doc(firestore, `schools/${schoolId}/students`, attendance.studentId));
                        if (studentDocSnap.exists()) {
                             const studentData = studentDocSnap.data();
                             absentStudentData.push({
                                id: studentData.id,
                                name: studentData.name,
                                className: studentData.class,
                                attendance: attendance.status as 'absent' | 'late',
                            });
                        }
                    }
                }
                setAbsentStudents(absentStudentData);
                setIsLoading(false);
            });
            
            return () => unsubAttendance();
        });

        return () => unsubscribe();
    }, [schoolId, user]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline text-lg flex items-center gap-2">
          <UserX className="h-5 w-5 text-primary" />
          Absent Today
        </CardTitle>
      </CardHeader>
      <CardContent>
         {isLoading ? (
            <div className="flex items-center justify-center h-24">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        ) : (
            <div className="space-y-4">
                {absentStudents.map((student, index) => (
                    <div key={index} className="flex items-center gap-4">
                    <Avatar>
                        <AvatarFallback>{student.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                        <p className="font-semibold text-sm">{student.name}</p>
                        <p className="text-xs text-muted-foreground">{student.className}</p>
                    </div>
                    <Badge variant={student.attendance === 'absent' ? 'destructive' : 'secondary'} className="capitalize">
                        {student.attendance}
                    </Badge>
                    </div>
                ))}
                {absentStudents.length === 0 && (
                    <div className="text-center text-muted-foreground py-4">
                    <p className="font-semibold">Full Attendance!</p>
                    <p className="text-sm">All your students are marked as present today.</p>
                    </div>
                )}
            </div>
        )}
      </CardContent>
      <CardFooter>
        <Button asChild variant="outline" size="sm" className="w-full">
            <Link href={`/teacher/attendance?schoolId=${schoolId}`}>
                View Full Attendance Sheet
                <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

    