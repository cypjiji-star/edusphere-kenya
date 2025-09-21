
'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, BookMarked, ClipboardCheck, Percent, Loader2, ArrowRight } from 'lucide-react';
import { TimetableWidget } from './timetable-widget';
import { AbsentStudentsWidget } from './absent-students-widget';
import { MessagesWidget } from './messages-widget';
import { LibraryNoticesWidget } from './library-notices-widget';
import { firestore } from '@/lib/firebase';
import { collection, getDocs, query, where, Timestamp, doc, getDoc, onSnapshot } from 'firebase/firestore';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { MyAttendanceWidget } from './my-attendance-widget';
import { DashboardCharts } from './dashboard-charts';

export default function TeacherDashboard() {
    const searchParams = useSearchParams();
    const schoolId = searchParams.get('schoolId');
    const { user } = useAuth();
    const [schoolName, setSchoolName] = React.useState('');
    const [teacherName, setTeacherName] = React.useState('Teacher');
    const [totalStudents, setTotalStudents] = React.useState(0);
    const [ungradedAssignments, setUngradedAssignments] = React.useState(0);
    const [attendancePercentage, setAttendancePercentage] = React.useState(0);
    const [isLoading, setIsLoading] = React.useState(true);

    React.useEffect(() => {
        if (!schoolId || !user) {
            setIsLoading(false);
            return;
        }
        
        const teacherId = user.uid;
        setIsLoading(true);

        const unsubscribers: (() => void)[] = [];

        try {
            const schoolRef = doc(firestore, 'schools', schoolId);
            unsubscribers.push(onSnapshot(schoolRef, (docSnap) => {
                if(docSnap.exists()) setSchoolName(docSnap.data().name);
            }));
            
            const userDocRef = doc(firestore, `schools/${schoolId}/users`, teacherId);
            unsubscribers.push(onSnapshot(userDocRef, (docSnap) => {
                if (docSnap.exists()) setTeacherName(docSnap.data().name || 'Teacher');
            }));

            const classesQuery = query(collection(firestore, `schools/${schoolId}/classes`), where('teacherId', '==', teacherId));
            unsubscribers.push(onSnapshot(classesQuery, (classesSnapshot) => {
                const classIds = classesSnapshot.docs.map(doc => doc.id);
                if (classIds.length === 0) {
                    setTotalStudents(0);
                    setAttendancePercentage(100);
                    setIsLoading(false);
                    return;
                }

                const studentsQuery = query(collection(firestore, `schools/${schoolId}/students`), where('classId', 'in', classIds));
                const unsubStudents = onSnapshot(studentsQuery, (studentsSnapshot) => {
                    const studentCount = studentsSnapshot.size;
                    const studentIds = studentsSnapshot.docs.map(doc => doc.id);
                    setTotalStudents(studentCount);

                    if (studentCount > 0) {
                        const today = new Date();
                        const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
                        const attendanceQuery = query(
                            collection(firestore, `schools/${schoolId}/attendance`), 
                            where('studentId', 'in', studentIds),
                            where('date', '>=', Timestamp.fromDate(startOfToday))
                        );
                        const unsubAttendance = onSnapshot(attendanceQuery, (attendanceSnapshot) => {
                             const presentCount = attendanceSnapshot.docs.filter(r => ['present', 'late'].includes(r.data().status.toLowerCase())).length;
                             setAttendancePercentage(Math.round((presentCount / studentCount) * 100));
                        });
                        unsubscribers.push(unsubAttendance);
                    } else {
                        setAttendancePercentage(100);
                    }
                    setIsLoading(false);
                });
                 unsubscribers.push(unsubStudents);
            }));
            
            const assignmentsQuery = query(collection(firestore, `schools/${schoolId}/assignments`), where('teacherId', '==', teacherId));
            unsubscribers.push(onSnapshot(assignmentsQuery, (snapshot) => {
                let ungradedCount = 0;
                snapshot.forEach(doc => {
                    const assignment = doc.data();
                    if (assignment.submissions < assignment.totalStudents) ungradedCount++;
                });
                setUngradedAssignments(ungradedCount);
            }));


        } catch (error) {
            console.error("Error setting up dashboard listeners:", error);
            setIsLoading(false);
        }

        return () => unsubscribers.forEach(unsub => unsub());

    }, [schoolId, user]);

    const quickStats = React.useMemo(() => [
        {
            title: "Total Students",
            stat: totalStudents,
            icon: <Users className="h-6 w-6 text-muted-foreground" />,
            href: `/teacher/students?schoolId=${schoolId}`,
        },
        {
            title: "Today's Attendance",
            stat: `${attendancePercentage}%`,
            icon: <ClipboardCheck className="h-6 w-6 text-muted-foreground" />,
            href: `/teacher/attendance?schoolId=${schoolId}`,
        },
        {
            title: "Ungraded Assignments",
            stat: ungradedAssignments,
            icon: <BookMarked className="h-6 w-6 text-muted-foreground" />,
            href: `/teacher/assignments?schoolId=${schoolId}`,
        },
    ], [totalStudents, attendancePercentage, ungradedAssignments, schoolId]);

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="font-headline text-3xl font-bold">Welcome, {teacherName}!</h1>
        <p className="text-muted-foreground">Your dashboard for {schoolName}. Today is {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}.</p>
      </div>

       <div className="mb-8">
          <MyAttendanceWidget />
       </div>

       {isLoading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {Array(3).fill(0).map((_, index) => (
                    <Card key={index}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                             <div className="h-5 w-32 rounded-md bg-muted animate-pulse" />
                             <div className="h-6 w-6 rounded-md bg-muted animate-pulse" />
                        </CardHeader>
                        <CardContent>
                             <div className="h-8 w-16 rounded-md bg-muted animate-pulse" />
                        </CardContent>
                    </Card>
                ))}
            </div>
       ) : (
            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {quickStats.map((stat) => (
                <Link href={stat.href} key={stat.title} aria-label={`View ${stat.title}`}>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                        {stat.icon}
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stat.stat}</div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
       )}

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
            <TimetableWidget />
            {user && <DashboardCharts teacherId={user.uid} teacherName={teacherName} />}
        </div>
        <div className="lg:col-span-1 space-y-8">
            <AbsentStudentsWidget />
            <LibraryNoticesWidget />
            <MessagesWidget />
        </div>
      </div>
    </div>
  );
}
