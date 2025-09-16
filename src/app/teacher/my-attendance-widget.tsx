
'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertTriangle, Clock, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { firestore } from '@/lib/firebase';
import { doc, onSnapshot, setDoc, Timestamp } from 'firebase/firestore';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

type TeacherStatus = 'Present' | 'Pending' | 'Late' | 'Absent';

export function MyAttendanceWidget() {
  const { user } = useAuth();
  const [status, setStatus] = React.useState<TeacherStatus>('Pending');
  const [isLoading, setIsLoading] = React.useState(true);
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const schoolId = searchParams.get('schoolId');

  const todayStr = format(new Date(), 'yyyy-MM-dd');

  React.useEffect(() => {
    if (!user || !schoolId) {
        setIsLoading(false);
        return;
    };
    
    setIsLoading(true);
    const attendanceDocRef = doc(firestore, `schools/${schoolId}/teacher_attendance`, `${user.uid}_${todayStr}`);

    const unsubscribe = onSnapshot(attendanceDocRef, (docSnap) => {
      if (docSnap.exists()) {
        setStatus(docSnap.data().status || 'Pending');
      } else {
        setStatus('Pending');
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
            date: Timestamp.fromDate(new Date()),
            status: 'Present',
            checkInTime: Timestamp.now(),
        }, { merge: true });
        
        toast({
            title: 'Checked In!',
            description: 'Your attendance for today has been marked as Present.',
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

  const getStatusInfo = (): { icon: React.ElementType; text: string; badgeVariant: 'default' | 'secondary' | 'destructive'; badgeClass: string } => {
    switch (status) {
      case 'Present':
        return { icon: CheckCircle, text: 'You are marked Present', badgeVariant: 'default', badgeClass: 'bg-green-600 hover:bg-green-700' };
      case 'Late':
        return { icon: Clock, text: 'You are marked Late', badgeVariant: 'secondary', badgeClass: 'bg-yellow-500 hover:bg-yellow-600' };
      case 'Absent':
        return { icon: AlertTriangle, text: 'You are marked Absent', badgeVariant: 'destructive', badgeClass: '' };
      case 'Pending':
      default:
        return { icon: Clock, text: 'Your attendance is Pending', badgeVariant: 'secondary', badgeClass: 'bg-yellow-500 hover:bg-yellow-600' };
    }
  };
  
  const { icon: Icon, text, badgeVariant, badgeClass } = getStatusInfo();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline text-lg">Today's Status</CardTitle>
        <CardDescription>{format(new Date(), 'eeee, d MMMM yyyy')}</CardDescription>
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
              <Button size="lg" className="w-full" onClick={handleCheckIn}>
                <CheckCircle className="mr-2" />
                Check-In for Today
              </Button>
            )}
            {status === 'Present' && (
              <Button size="lg" className="w-full" variant="outline" disabled>
                Checked In
              </Button>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
