
'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { UserX, ArrowRight, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import * as React from 'react';
import { firestore } from '@/lib/firebase';
import { collection, query, where, getDocs, Timestamp, collectionGroup } from 'firebase/firestore';


type AbsentStudent = {
    id: string;
    name: string;
    avatarUrl: string;
    className: string;
    attendance: 'absent' | 'late';
}

export function AbsentStudentsWidget() {
    const [absentStudents, setAbsentStudents] = React.useState<AbsentStudent[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);

    React.useEffect(() => {
        const fetchAbsentStudents = async () => {
            setIsLoading(true);
            const today = new Date();
            const startOfToday = new Date(today.setHours(0, 0, 0, 0));
            const teacherId = 'teacher-wanjiku'; // Replace with actual logged-in teacher ID

            try {
                // First get all classes taught by this teacher
                const classesQuery = query(collection(firestore, 'classes'), where('teacherId', '==', teacherId));
                const classesSnapshot = await getDocs(classesQuery);
                const classIds = classesSnapshot.docs.map(doc => doc.id);

                if (classIds.length === 0) {
                    setIsLoading(false);
                    return;
                }

                // Query attendance subcollections for all students who belong to this teacher's classes
                const attendanceQuery = query(
                    collectionGroup(firestore, 'attendance'),
                    where('date', '>=', Timestamp.fromDate(startOfToday)),
                    where('status', 'in', ['absent', 'late'])
                );

                const attendanceSnapshot = await getDocs(attendanceQuery);
                const absentStudentData: AbsentStudent[] = [];

                for (const doc of attendanceSnapshot.docs) {
                    const attendance = doc.data();
                    const studentDoc = await getDocs(query(collection(firestore, 'students'), where('id', '==', attendance.studentId)));

                    if (!studentDoc.empty) {
                        const studentData = studentDoc.docs[0].data();
                        if (classIds.includes(studentData.classId)) {
                             absentStudentData.push({
                                id: studentData.id,
                                name: studentData.name,
                                avatarUrl: studentData.avatarUrl,
                                className: studentData.class,
                                attendance: attendance.status as 'absent' | 'late',
                            });
                        }
                    }
                }

                setAbsentStudents(absentStudentData);
            } catch (error) {
                console.error("Error fetching absent students:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchAbsentStudents();
    }, []);

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
                        <AvatarImage src={student.avatarUrl} alt={student.name} />
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
                    <p className="text-sm">All students are marked as present today.</p>
                    </div>
                )}
            </div>
        )}
      </CardContent>
      <CardFooter>
        <Button asChild variant="outline" size="sm" className="w-full">
            <Link href="/teacher/attendance">
                View Full Attendance Sheet
                <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
