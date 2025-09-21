
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
  Send,
  Loader2,
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
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { useToast } from '@/hooks/use-toast';
import { sendQuickReplyAction } from './actions';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AiChat } from '../ai/ai-chat';

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
  chatId?: string; // Add chatId for communication notifications
};

const categoryConfig: Record<NotificationCategory, { icon: React.ElementType, color: string, priority: number }> = {
  Academics: { icon: FileText, color: 'text-purple-500', priority: 3 },
  Finance: { icon: CircleDollarSign, color: 'text-green-500', priority: 3 },
  Communication: { icon: MessageCircle, color: 'text-blue-500', priority: 2 },
  System: { icon: Settings, color: 'text-orange-500', priority: 4 },
  Security: { icon: AlertTriangle, color: 'text-red-500', priority: 1 },
  General: { icon: Bell, color: 'text-gray-500', priority: 5 },
};

function QuickReplyPopover({ schoolId, chatId, actor }: { schoolId: string, chatId: string, actor: { id: string; name: string }}) {
    const [reply, setReply] = React.useState('');
    const [isSending, setIsSending] = React.useState(false);
    const { toast } = useToast();

    const handleSend = async () => {
        if (!reply.trim()) return;
        setIsSending(true);
        const result = await sendQuickReplyAction(schoolId, chatId, reply, actor);
        if (result.success) {
            toast({ title: 'Reply Sent!' });
            setReply('');
        } else {
            toast({ title: 'Error', description: result.message, variant: 'destructive' });
        }
        setIsSending(false);
    };

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="secondary" size="sm" className="h-auto px-2 py-1 text-xs">Quick Reply</Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-2">
                <div className="space-y-2">
                    <Label htmlFor="quick-reply-input" className="sr-only">Reply</Label>
                    <Textarea id="quick-reply-input" placeholder="Type your reply..." className="min-h-[80px] text-sm" value={reply} onChange={(e) => setReply(e.target.value)} />
                    <Button size="sm" className="w-full" onClick={handleSend} disabled={isSending}>
                        {isSending && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                        Send
                    </Button>
                </div>
            </PopoverContent>
        </Popover>
    )
}

function NotificationItem({
  notification,
  schoolId,
  onDismiss,
  currentUserId,
  currentUser,
}: {
  notification: Notification;
  schoolId: string;
  onDismiss: (id: string) => void;
  currentUserId: string;
  currentUser: { id: string, name: string, role: string };
}) {
  const config = categoryConfig[notification.category] || categoryConfig.General;
  const Icon = config.icon;
  const isRead = notification.readBy?.includes(currentUserId);
  const isUrgent = notification.category === 'Security' || notification.category === 'Communication';

  return (
    <div
      className={cn(
        'relative flex items-start gap-4 p-4 rounded-lg transition-colors hover:bg-muted/50 border-l-4',
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
         {currentUser.role === 'admin' && notification.category === 'Communication' && notification.chatId && (
            <div className="pt-2">
                <QuickReplyPopover schoolId={schoolId} chatId={notification.chatId} actor={currentUser} />
            </div>
        )}
      </div>
      <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 h-7 w-7"
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

  const isUserPortal = role === 'parent' || role === 'teacher';

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
         <Tabs defaultValue="notifications" className="flex-1 flex flex-col">
            <SheetHeader className="p-4 border-b">
                <TabsList className={cn("grid w-full", isUserPortal ? "grid-cols-2" : "grid-cols-1")}>
                    <TabsTrigger value="notifications">
                        <Bell className="mr-2 h-4 w-4" />
                        Notifications
                        {unreadCount > 0 && <Badge className="ml-2">{unreadCount}</Badge>}
                    </TabsTrigger>
                    {isUserPortal && <TabsTrigger value="support">Support Chat</TabsTrigger>}
                </TabsList>
            </SheetHeader>
            <TabsContent value="notifications" className="flex-1 min-h-0">
                <div className="flex justify-end p-2 border-b">
                    {unreadCount > 0 && (
                        <Button variant="link" size="sm" className="h-auto p-0" onClick={handleMarkAllAsRead}>
                            <CheckCheck className="mr-2 h-4 w-4"/>
                            Mark all as read
                        </Button>
                    )}
                </div>
                <ScrollArea className="h-full">
                    <div className="p-2 space-y-2">
                        {sortedNotifications.length > 0 ? (
                            sortedNotifications.map((notification) => (
                                <NotificationItem
                                key={notification.id}
                                notification={notification}
                                schoolId={schoolId!}
                                onDismiss={handleMarkAsRead}
                                currentUserId={user!.uid}
                                currentUser={{ id: user!.uid, name: user!.displayName || 'Admin', role: role }}
                                />
                            ))
                        ) : (
                            <div className="text-center text-muted-foreground py-16">
                                <p>No new notifications.</p>
                            </div>
                        )}
                    </div>
                </ScrollArea>
            </TabsContent>
            {isUserPortal && (
                <TabsContent value="support" className="flex-1 min-h-0">
                   <AiChat />
                </TabsContent>
            )}
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
