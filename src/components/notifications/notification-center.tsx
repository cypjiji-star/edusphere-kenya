
'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Bell,
  Check,
  CheckCheck,
  CircleDollarSign,
  FileText,
  MessageCircle,
  Settings,
  X,
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
} from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/auth-context';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { ScrollArea } from '../ui/scroll-area';
import { useSearchParams } from 'next/navigation';

export type NotificationCategory = 'Academics' | 'Finance' | 'Communication' | 'System';

export type Notification = {
  id: string;
  title: string;
  description: string;
  createdAt: Timestamp;
  read: boolean;
  href: string;
  category: NotificationCategory;
};

const categoryConfig: Record<NotificationCategory, { icon: React.ElementType }> = {
  Academics: { icon: FileText },
  Finance: { icon: CircleDollarSign },
  Communication: { icon: MessageCircle },
  System: { icon: Settings },
};

function NotificationItem({
  notification,
  schoolId,
  onMarkAsRead,
}: {
  notification: Notification;
  schoolId: string;
  onMarkAsRead: (id: string) => void;
}) {
  const Icon = categoryConfig[notification.category]?.icon || Settings;
  return (
    <div
      className={cn(
        'flex items-start gap-4 p-4 rounded-lg transition-colors hover:bg-muted/50',
        !notification.read && 'bg-primary/5'
      )}
    >
      <div className="mt-1">
        <Icon className="h-5 w-5 text-muted-foreground" />
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
      {!notification.read && (
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => onMarkAsRead(notification.id)}
        >
          <Check className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}

export function NotificationCenter() {
  const { user, role } = useAuth();
  const searchParams = useSearchParams();
  const schoolId = searchParams.get('schoolId');
  const [notifications, setNotifications] = React.useState<Notification[]>([]);
  const [activeTab, setActiveTab] = React.useState('all');
  
  const unreadCount = notifications.filter((n) => !n.read).length;

  React.useEffect(() => {
    if (!schoolId || !user) return;
    
    // Admins and teachers see notifications based on role, parents by user ID.
    const audienceField = role === 'parent' ? 'userId' : 'audience';
    const audienceValue = role === 'parent' ? user.uid : role;

    const q = query(
      collection(firestore, 'schools', schoolId, 'notifications'),
      where(audienceField, 'in', [audienceValue, 'all']),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedNotifications = snapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as Notification)
      );
      setNotifications(fetchedNotifications);
    }, (error) => {
        console.error("Error fetching notifications:", error);
    });

    return () => unsubscribe();
  }, [schoolId, user, role]);

  const handleMarkAsRead = async (id: string) => {
    if (!schoolId) return;
    const notificationRef = doc(firestore, 'schools', schoolId, 'notifications', id);
    await updateDoc(notificationRef, { read: true });
  };

  const handleMarkAllRead = async () => {
    if (!schoolId) return;
    const batch = writeBatch(firestore);
    notifications
      .filter((n) => !n.read)
      .forEach((notification) => {
        const notifRef = doc(firestore, 'schools', schoolId, 'notifications', notification.id);
        batch.update(notifRef, { read: true });
      });
    await batch.commit();
  };
  
  const filteredNotifications = notifications.filter(n => activeTab === 'all' || n.category === activeTab);

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="relative rounded-full h-12 w-12 shadow-lg bg-background hover:bg-muted">
          <Bell className="h-6 w-6" />
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 text-xs items-center justify-center bg-primary text-primary-foreground">
                {unreadCount}
              </span>
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md p-0">
        <SheetHeader className="p-6 border-b">
          <SheetTitle className="flex items-center justify-between">
            <span>Notifications</span>
             {unreadCount > 0 && (
                <Button variant="link" size="sm" className="h-auto p-0" onClick={handleMarkAllRead}>
                    <CheckCheck className="mr-2 h-4 w-4"/>
                    Mark all as read
                </Button>
            )}
          </SheetTitle>
        </SheetHeader>
        <div className="h-[calc(100%-4rem)]">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full">
                <TabsList className="m-4">
                    <TabsTrigger value="all">All</TabsTrigger>
                    <TabsTrigger value="Academics">Academics</TabsTrigger>
                    <TabsTrigger value="Finance">Finance</TabsTrigger>
                    <TabsTrigger value="Communication">Comms</TabsTrigger>
                    <TabsTrigger value="System">System</TabsTrigger>
                </TabsList>
                 <ScrollArea className="flex-1">
                    <div className="p-4 pt-0 space-y-2">
                        {filteredNotifications.length > 0 ? (
                            filteredNotifications.map((notification) => (
                                <NotificationItem
                                key={notification.id}
                                notification={notification}
                                schoolId={schoolId!}
                                onMarkAsRead={handleMarkAsRead}
                                />
                            ))
                        ) : (
                             <div className="text-center text-muted-foreground py-16">
                                <p>No notifications in this category.</p>
                            </div>
                        )}
                    </div>
                 </ScrollArea>
            </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  );
}
