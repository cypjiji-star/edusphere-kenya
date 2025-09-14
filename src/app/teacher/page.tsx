'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
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

export default function TeacherDashboard() {
    const searchParams = useSearchParams();
    const schoolId = searchParams.get('schoolId');
    const [schoolName, setSchoolName] = React.useState('');
    const [totalStudents, setTotalStudents] = React.useState(0);
    const [ungradedAssignments, setUngradedAssignments] = React.useState(0);
    const [attendancePercentage, setAttendancePercentage] = React.useState(0);
    const [avgScore, setAvgScore] = React.useState(0);
    const [isLoading, setIsLoading] = React.useState(true);
    const [user, setUser] = React.useState(auth.currentUser);
    const teacherId = 'teacher-wanjiku'; // Placeholder for dynamic teacher ID

    React.useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(setUser);
        return () => unsubscribe();
    }, []);

    React.useEffect(() => {
        if (!schoolId) {
            setIsLoading(false);
            return;
        }

        const schoolRef = doc(firestore, 'schools', schoolId);
        getDoc(schoolRef).then(docSnap => {
            if(docSnap.exists()) {
                setSchoolName(docSnap.data().name);
            }
        });

        // Listener for total students
        const studentsQuery = query(collection(firestore, `schools/${schoolId}/students`), where('teacherId', '==', teacherId));
        const unsubStudents = onSnapshot(studentsQuery, (snapshot) => {
            setTotalStudents(snapshot.size);
        });

        // Listener for ungraded assignments
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

        // Listener for attendance
        const today = new Date();
        const startOfToday = new Date(today.setHours(0, 0, 0, 0));
        const attendanceQuery = query(
            collection(firestore, `schools/${schoolId}/attendance`), 
            where('teacherId', '==', teacherId),
            where('date', '>=', Timestamp.fromDate(startOfToday))
        );
        const unsubAttendance = onSnapshot(attendanceQuery, (snapshot) => {
            const attendanceRecords = snapshot.docs.map(d => d.data());
            if (totalStudents > 0) {
                 const presentCount = attendanceRecords.filter(r => r.status === 'present' || r.status === 'late').length;
                 setAttendancePercentage(Math.round((presentCount / totalStudents) * 100));
            } else if (snapshot.size === 0) {
                 setAttendancePercentage(100);
            }
        });

        // Mock average score
        setAvgScore(78);
        setIsLoading(false);

        return () => {
            unsubStudents();
            unsubAssignments();
            unsubAttendance();
        };

    }, [schoolId, totalStudents]);

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
        <h1 className="font-headline text-3xl font-bold">Welcome, {user?.displayName || 'Teacher'}!</h1>
        <p className="text-muted-foreground">Your dashboard for {schoolName}. Today is {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}.</p>
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
