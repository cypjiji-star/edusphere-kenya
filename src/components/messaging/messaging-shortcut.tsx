
'use client';

import * as React from 'react';
import Link from 'next/link';
import { MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { useAuth } from '@/context/auth-context';
import { useSearchParams } from 'next/navigation';

export function MessagingShortcut() {
  const { user, role } = useAuth();
  const searchParams = useSearchParams();
  const schoolId = searchParams.get('schoolId');
  const [unreadCount, setUnreadCount] = React.useState(0);

  React.useEffect(() => {
    if (!schoolId || !user) return;

    const q = query(
      collection(firestore, `schools/${schoolId}/conversations`),
      where('unread', '==', true),
      // This is a simplified query. A more robust solution might need
      // to check if the current user is a participant and not the last sender.
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      // This count might not be perfectly accurate for the specific user
      // without more complex logic, but it's a good indicator.
      setUnreadCount(snapshot.size);
    });

    return () => unsubscribe();
  }, [schoolId, user]);
  
  const getMessagingPath = () => {
    if (!schoolId) return '/';
    switch (role) {
      case 'admin':
        return `/admin/messaging?schoolId=${schoolId}`;
      case 'teacher':
        return `/teacher/messaging?schoolId=${schoolId}`;
      case 'parent':
         return `/parent/messaging?schoolId=${schoolId}`;
      default:
        return '#';
    }
  }

  return (
     <Button asChild variant="outline" size="icon" className="relative rounded-full h-12 w-12 shadow-lg bg-background hover:bg-muted">
        <Link href={getMessagingPath()}>
          <MessageCircle className="h-6 w-6" />
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 text-xs items-center justify-center bg-primary text-primary-foreground">
                {unreadCount}
              </span>
            </span>
          )}
        </Link>
    </Button>
  );
}
