
'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertTriangle, Clock, Loader2, LogIn, LogOut } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { firestore } from '@/lib/firebase';
import { doc, onSnapshot, setDoc, Timestamp, updateDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useSearchParams } from 'next/navigation';

type TeacherStatus = 'Present' | 'CheckedOut' | 'Pending' | 'Late' | 'Absent';

type AttendanceDoc = {
    status: TeacherStatus;
    checkInTime?: Timestamp;
    checkOutTime?: Timestamp;
};

export function MyAttendanceWidget() {
  const { user } = useAuth();
  const [status, setStatus] = React.useState<TeacherStatus>('Pending');
  const [checkInTime, setCheckInTime] = React.useState<Timestamp | null>(null);
  const [checkOutTime, setCheckOutTime] = React.useState<Timestamp | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [clientReady, setClientReady] = React.useState(false);
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const schoolId = searchParams.get('schoolId');

  const todayStr = format(new Date(), 'yyyy-MM-dd');

  React.useEffect(() => {
    setClientReady(true);
  }, []);

  React.useEffect(() => {
    if (!user || !schoolId) {
        setIsLoading(false);
        return;
    };
    
    setIsLoading(true);
    const attendanceDocRef = doc(firestore, `schools/${schoolId}/teacher_attendance`, `${user.uid}_${todayStr}`);

    const unsubscribe = onSnapshot(attendanceDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as AttendanceDoc;
        setStatus(data.status || 'Pending');
        setCheckInTime(data.checkInTime || null);
        setCheckOutTime(data.checkOutTime || null);
      } else {
        setStatus('Pending');
        setCheckInTime(null);
        setCheckOutTime(null);
      }
      setIsLoading(false);
    }, (error) => {
        console.error("Error fetching teacher attendance:", error);
        setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user, todayStr, schoolId]);

  const handleCheckIn = async () => {
    if (!user || !schoolId) return;
    setIsLoading(true);
    const attendanceDocRef = doc(firestore, `schools/${schoolId}/teacher_attendance`, `${user.uid}_${todayStr}`);

    try {
        await setDoc(attendanceDocRef, {
            teacherId: user.uid,
            teacherName: user.displayName || 'Teacher',
            date: Timestamp.fromDate(new Date(todayStr)),
            status: 'Present',
            checkInTime: Timestamp.now(),
        }, { merge: true });

        await addDoc(collection(firestore, `schools/${schoolId}/notifications`), {
            title: 'Teacher Check-In',
            description: `${user.displayName || 'A teacher'} has checked in for the day.`,
            createdAt: serverTimestamp(),
            category: 'General',
            href: `/admin/attendance?schoolId=${schoolId}&tab=teacher`,
            audience: 'admin',
        });
        
        toast({
            title: 'Checked In!',
            description: 'Your morning attendance has been recorded.',
        });
    } catch(e) {
        console.error("Error checking in:", e);
        toast({
            variant: 'destructive',
            title: 'Check-in Failed',
            description: 'Could not save your attendance. Please try again.',
        });
    } finally {
        setIsLoading(false);
    }
  };

  const handleCheckOut = async () => {
    if (!user || !schoolId) return;
    setIsLoading(true);
    const attendanceDocRef = doc(firestore, `schools/${schoolId}/teacher_attendance`, `${user.uid}_${todayStr}`);

    try {
        await updateDoc(attendanceDocRef, {
            status: 'CheckedOut',
            checkOutTime: Timestamp.now(),
        });
        
        toast({
            title: 'Checked Out!',
            description: 'Your departure has been recorded. Have a great evening!',
        });
    } catch(e) {
        console.error("Error checking out:", e);
        toast({
            variant: 'destructive',
            title: 'Check-out Failed',
            description: 'Could not save your departure. Please try again.',
        });
    } finally {
        setIsLoading(false);
    }
  };

  const getStatusInfo = (): { icon: React.ElementType; text: string; badgeVariant: 'default' | 'secondary' | 'destructive'; badgeClass: string } => {
    if (status === 'Present' && checkInTime) {
        return { icon: CheckCircle, text: `Checked In at ${format(checkInTime.toDate(), 'h:mm a')}`, badgeVariant: 'default', badgeClass: 'bg-green-600 hover:bg-green-700' };
    }
    if (status === 'CheckedOut') {
         return { icon: CheckCircle, text: 'Attendance Complete', badgeVariant: 'default', badgeClass: 'bg-primary hover:bg-primary' };
    }
    switch (status) {
      case 'Late':
        return { icon: Clock, text: 'You are marked Late', badgeVariant: 'secondary', badgeClass: 'bg-yellow-500 hover:bg-yellow-500' };
      case 'Absent':
        return { icon: AlertTriangle, text: 'You are marked Absent', badgeVariant: 'destructive', badgeClass: '' };
      case 'Pending':
      default:
        return { icon: Clock, text: 'Your attendance is Pending', badgeVariant: 'secondary', badgeClass: 'bg-yellow-500 hover:bg-yellow-500' };
    }
  };
  
  const { icon: Icon, text, badgeVariant, badgeClass } = getStatusInfo();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline text-lg">Today's Status</CardTitle>
        {clientReady && <CardDescription>{format(new Date(), 'eeee, d MMMM yyyy')}</CardDescription>}
      </CardHeader>
      <CardContent className="text-center space-y-4">
        {isLoading ? (
          <div className="flex h-24 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary"/>
          </div>
        ) : (
          <>
            <div>
              <Badge variant={badgeVariant} className={`text-base ${badgeClass}`}>
                <Icon className="mr-2 h-4 w-4" />
                {text}
              </Badge>
            </div>
            {status === 'Pending' && (
              <div>
                <Button size="lg" className="w-full" onClick={handleCheckIn}>
                  <LogIn className="mr-2" />
                  Check-In (AM)
                </Button>
                <p className="text-xs text-muted-foreground mt-2">Geofencing enabled: You must be on-site to check in.</p>
              </div>
            )}
            {status === 'Present' && !checkOutTime && (
              <div>
                <Button size="lg" className="w-full" variant="outline" onClick={handleCheckOut}>
                  <LogOut className="mr-2" />
                  Check-Out (PM)
                </Button>
                <p className="text-xs text-muted-foreground mt-2">Geofencing enabled: You must be on-site to check out.</p>
              </div>
            )}
            {status === 'CheckedOut' && checkOutTime && (
              <p className="text-sm text-muted-foreground">Checked out at {format(checkOutTime.toDate(), 'h:mm a')}.</p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
