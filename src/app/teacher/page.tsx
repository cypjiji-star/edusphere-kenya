
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
import { Users, BookMarked, ClipboardCheck, Percent, Loader2 } from 'lucide-react';
import { TimetableWidget } from './timetable-widget';
import { PendingTasksWidget } from './pending-tasks-widget';
import { AbsentStudentsWidget } from './absent-students-widget';
import { MessagesWidget } from './messages-widget';
import { DashboardCharts } from './dashboard-charts';
import { LibraryNoticesWidget } from './library-notices-widget';
import { firestore, auth } from '@/lib/firebase';
import { collection, getDocs, query, where, Timestamp, doc, getDoc, onSnapshot } from 'firebase/firestore';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { MyAttendanceWidget } from './my-attendance-widget';

export default function TeacherDashboard() {
    const searchParams = useSearchParams();
    const schoolId = searchParams.get('schoolId');
    const { user } = useAuth();
    const [schoolName, setSchoolName] = React.useState('');
    const [teacherName, setTeacherName] = React.useState('Teacher');
    const [totalStudents, setTotalStudents] = React.useState(0);
    const [ungradedAssignments, setUngradedAssignments] = React.useState(0);
    const [attendancePercentage, setAttendancePercentage] = React.useState(0);
    const [avgScore, setAvgScore] = React.useState(0);
    const [isLoading, setIsLoading] = React.useState(true);

    React.useEffect(() => {
        if (!schoolId || !user) {
            setIsLoading(false);
            return;
        }
        
        const teacherId = user.uid;
        setIsLoading(true);

        const schoolRef = doc(firestore, 'schools', schoolId);
        const unsubSchool = onSnapshot(schoolRef, (docSnap) => {
            if(docSnap.exists()) {
                setSchoolName(docSnap.data().name);
            }
        });
        
        const userDocRef = doc(firestore, `schools/${schoolId}/users`, teacherId);
        const unsubUser = onSnapshot(userDocRef, (docSnap) => {
            if (docSnap.exists()) {
                setTeacherName(docSnap.data().name || 'Teacher');
            }
        });

        const studentsQuery = query(collection(firestore, `schools/${schoolId}/students`), where('teacherId', '==', teacherId));
        const unsubStudents = onSnapshot(studentsQuery, (snapshot) => {
            const studentCount = snapshot.size;
            setTotalStudents(studentCount);

            // Fetch attendance only after we have the student count
            if (studentCount > 0) {
                const today = new Date();
                const startOfToday = new Date(today.setHours(0, 0, 0, 0));
                const attendanceQuery = query(
                    collection(firestore, `schools/${schoolId}/attendance`), 
                    where('teacherId', '==', teacherId),
                    where('date', '>=', Timestamp.fromDate(startOfToday))
                );
                const unsubAttendance = onSnapshot(attendanceQuery, (attSnapshot) => {
                     const presentCount = attSnapshot.docs.filter(r => r.data().status === 'present' || r.data().status === 'late').length;
                     setAttendancePercentage(Math.round((presentCount / studentCount) * 100));
                });
                return () => unsubAttendance(); // Cleanup attendance listener
            } else {
                 setAttendancePercentage(100);
            }
        });
        
        const assignmentsQuery = query(collection(firestore, `schools/${schoolId}/assignments`), where('teacherId', '==', teacherId));
        const unsubAssignments = onSnapshot(assignmentsQuery, (snapshot) => {
            let ungradedCount = 0;
            snapshot.forEach(doc => {
                const assignment = doc.data();
                if (assignment.submissions < assignment.totalStudents) {
                    ungradedCount++;
                }
            });
            setUngradedAssignments(ungradedCount);
        });

        // Mock average score
        setAvgScore(78);
        setIsLoading(false);

        return () => {
            unsubSchool();
            unsubUser();
            unsubStudents();
            unsubAssignments();
        };

    }, [schoolId, user]);

    const quickStats = [
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
        {
            title: "Avg. Last Exam Score",
            stat: `${avgScore}%`,
            icon: <Percent className="h-6 w-6 text-muted-foreground" />,
            href: `/teacher/grades?schoolId=${schoolId}`,
        }
    ];

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
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {Array(4).fill(0).map((_, index) => (
                    <Card key={index}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                             <div className="h-5 w-32 rounded-md bg-muted animate-pulse" />
                        </CardHeader>
                        <CardContent>
                             <div className="h-8 w-16 rounded-md bg-muted animate-pulse" />
                        </CardContent>
                    </Card>
                ))}
            </div>
       ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {quickStats.map((stat) => (
                    <Link href={stat.href} key={stat.title}>
                    <Card className="hover:bg-muted/50 transition-colors">
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

      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-8">
            <TimetableWidget />
            <DashboardCharts />
            <MessagesWidget />
        </div>
        <div className="lg:col-span-1 space-y-8">
            <PendingTasksWidget />
            <AbsentStudentsWidget />
            <LibraryNoticesWidget />
        </div>
      </div>
    </div>
  );
}
