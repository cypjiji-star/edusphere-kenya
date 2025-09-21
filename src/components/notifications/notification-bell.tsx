
'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Bell,
  CheckCheck,
  CircleDollarSign,
  FileText,
  MessageCircle,
  Settings,
  X,
  AlertTriangle,
} from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import {
  collection,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
  doc,
  updateDoc,
  writeBatch,
  Timestamp,
  arrayUnion,
  or,
} from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/auth-context';
import { ScrollArea } from '../ui/scroll-area';
import { useSearchParams } from 'next/navigation';

export type NotificationCategory = 'Academics' | 'Finance' | 'Communication' | 'System' | 'General' | 'Security';

export type Notification = {
  id: string;
  title: string;
  description: string;
  createdAt: Timestamp;
  readBy: string[];
  href: string;
  category: NotificationCategory;
  audience?: 'all' | 'admin' | 'teacher' | 'parent' | 'parents-and-students';
  userId?: string;
};

const categoryConfig: Record<NotificationCategory, { icon: React.ElementType, color: string, priority: number }> = {
  Academics: { icon: FileText, color: 'text-purple-500', priority: 3 },
  Finance: { icon: CircleDollarSign, color: 'text-green-500', priority: 3 },
  Communication: { icon: MessageCircle, color: 'text-blue-500', priority: 4 },
  System: { icon: Settings, color: 'text-orange-500', priority: 2 },
  Security: { icon: AlertTriangle, color: 'text-red-500', priority: 1 },
  General: { icon: Bell, color: 'text-gray-500', priority: 5 },
};

function NotificationItem({
  notification,
  schoolId,
  onDismiss,
  currentUserId,
}: {
  notification: Notification;
  schoolId: string;
  onDismiss: (id: string) => void;
  currentUserId: string;
}) {
  const config = categoryConfig[notification.category] || categoryConfig.General;
  const Icon = config.icon;
  const isRead = notification.readBy?.includes(currentUserId);
  const isUrgent = notification.category === 'Security';

  return (
    <div
      className={cn(
        'flex items-start gap-4 p-4 rounded-lg transition-colors hover:bg-muted/50 border-l-4',
        'border-primary',
        isUrgent && !isRead && 'border-destructive',
        !isRead && 'bg-primary/5',
        isUrgent && 'bg-destructive/5'
      )}
    >
      <div className="mt-1">
        <Icon className={cn('h-5 w-5', isUrgent ? 'text-destructive' : 'text-muted-foreground')} />
      </div>
      <div className="flex-1 space-y-1">
        <Link href={`${notification.href}?schoolId=${schoolId}`}>
          <p className="font-semibold text-sm hover:underline">{notification.title}</p>
          <p className="text-xs text-muted-foreground">
            {notification.description}
          </p>
          <p className="text-xs text-muted-foreground pt-1">
            {notification.createdAt?.toDate().toLocaleString()}
          </p>
        </Link>
      </div>
      <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => onDismiss(notification.id)}
        >
          <X className="h-4 w-4" />
      </Button>
    </div>
  );
}


export function NotificationBell() {
  const { user, role } = useAuth();
  const searchParams = useSearchParams();
  const schoolId = searchParams.get('schoolId');
  const [notifications, setNotifications] = React.useState<Notification[]>([]);
  
  const unreadCount = notifications.filter((n) => !n.readBy?.includes(user?.uid || '')).length;

  React.useEffect(() => {
    if (!schoolId || !user || !role || role === 'unknown') return;

    let notifQuery;
    const notificationsRef = collection(firestore, 'schools', schoolId, 'notifications');
    if (role === 'admin' || role === 'developer') {
      notifQuery = query(notificationsRef, orderBy('createdAt', 'desc'), limit(50));
    } else {
        const audiences = ['all', `${role}`];
        if (role === 'parent' || role === 'student') {
          audiences.push('parents-and-students');
        }

        notifQuery = query(
            notificationsRef,
            or(where('audience', 'in', audiences), where('userId', '==', user.uid)),
            orderBy('createdAt', 'desc'),
            limit(50)
        );
    }
    const unsubNotifs = onSnapshot(notifQuery, (snapshot) => {
      const fetchedNotifications = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Notification));
      setNotifications(fetchedNotifications);
    });

    return () => {
        unsubNotifs();
    };
  }, [schoolId, user, role]);

  const handleMarkAsRead = async (id: string) => {
    if (!schoolId || !user) return;
    const notifRef = doc(firestore, 'schools', schoolId, 'notifications', id);
    await updateDoc(notifRef, {
      readBy: arrayUnion(user.uid),
    });
  };

  const handleMarkAllAsRead = async () => {
    if (!schoolId || !user || unreadCount === 0) return;
    const batch = writeBatch(firestore);
    notifications.forEach((notification) => {
      if (!notification.readBy?.includes(user.uid)) {
        const notifRef = doc(firestore, 'schools', schoolId, 'notifications', notification.id);
        batch.update(notifRef, {
          readBy: arrayUnion(user.uid),
        });
      }
    });
    await batch.commit();
  };

  const sortedNotifications = [...notifications].sort((a, b) => {
    const aIsRead = a.readBy?.includes(user?.uid || '');
    const bIsRead = b.readBy?.includes(user?.uid || '');
    if (aIsRead !== bIsRead) return aIsRead ? 1 : -1;
    
    const aPriority = categoryConfig[a.category]?.priority || 99;
    const bPriority = categoryConfig[b.category]?.priority || 99;
    if (aPriority !== bPriority) return aPriority - bPriority;

    return b.createdAt.seconds - a.createdAt.seconds;
  });

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="relative shrink-0">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md p-0 flex flex-col h-full">
        <SheetHeader className="p-6 pb-2">
            <SheetTitle className="flex items-center justify-between">
                <span>Notifications</span>
                {unreadCount > 0 && (
                    <Button variant="link" size="sm" className="h-auto p-0" onClick={handleMarkAllAsRead}>
                        <CheckCheck className="mr-2 h-4 w-4"/>
                        Mark all as read
                    </Button>
                )}
            </SheetTitle>
        </SheetHeader>
        <ScrollArea className="flex-1">
            <div className="p-4 pt-2 space-y-2">
                {sortedNotifications.length > 0 ? (
                    sortedNotifications.map((notification) => (
                        <NotificationItem
                        key={notification.id}
                        notification={notification}
                        schoolId={schoolId!}
                        onDismiss={handleMarkAsRead}
                        currentUserId={user!.uid}
                        />
                    ))
                ) : (
                    <div className="text-center text-muted-foreground py-16">
                        <p>No new notifications.</p>
                    </div>
                )}
            </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
