
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
  Sparkles,
  User,
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
  serverTimestamp,
  addDoc,
} from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/auth-context';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { ScrollArea } from '../ui/scroll-area';
import { useSearchParams } from 'next/navigation';
import { Input } from '../ui/input';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { supportChatbot } from '@/ai/flows/support-chatbot-flow';

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

type Message = {
  role: 'user' | 'model';
  content: string;
};

const aiEscalationMessage = "Understood. I'm escalating your request to a human administrator who will get back to you shortly.";


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

function AiChatTab() {
  const [messages, setMessages] = React.useState<Message[]>([
    { role: 'model', content: 'Hello! I am the EduSphere AI assistant. How can I help you?' }
  ]);
  const [input, setInput] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [isEscalated, setIsEscalated] = React.useState(false);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const searchParams = useSearchParams();
  const schoolId = searchParams.get('schoolId');
  const { user } = useAuth();

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  const handleEscalate = async () => {
    if (!schoolId || !user || isEscalated) return;
    
    setIsLoading(true);
    const escalationMessage: Message = { role: 'model', content: aiEscalationMessage };
    
    try {
        await addDoc(collection(firestore, `schools/${schoolId}/support-chats`), {
            userId: user.uid,
            userName: user.displayName || 'User',
            userAvatar: user.photoURL || `https://picsum.photos/seed/${user.uid}/100`,
            messages: [...messages, escalationMessage],
            isEscalated: true,
            lastMessage: "Conversation escalated to admin.",
            lastUpdate: serverTimestamp()
        });

        setIsEscalated(true);
        setMessages(prev => [...prev, escalationMessage]);

    } catch (error) {
        console.error("Error escalating chat:", error);
    } finally {
        setIsLoading(false);
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
        const result = await supportChatbot({ history: [...messages, userMessage] });
        if (result.response === aiEscalationMessage) {
            await handleEscalate();
        } else {
            const aiMessage: Message = { role: 'model', content: result.response };
            setMessages(prev => [...prev, aiMessage]);
        }
    } catch (error) {
        console.error("Error with AI chatbot:", error);
        const errorMessage: Message = { role: 'model', content: 'Sorry, I encountered an error. Please try again.' };
        setMessages(prev => [...prev, errorMessage]);
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col">
       <ScrollArea className="flex-1">
         <div className="p-4 space-y-4">
            {messages.map((message, index) => (
                <div key={index} className={cn('flex items-end gap-2', message.role === 'user' ? 'justify-end' : 'justify-start')}>
                {message.role === 'model' && (
                    <Avatar className="h-8 w-8">
                        <AvatarFallback><Sparkles /></AvatarFallback>
                    </Avatar>
                )}
                <div className={cn("rounded-lg p-3 text-sm max-w-[80%]", message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted')}>
                    <p>{message.content}</p>
                </div>
                </div>
            ))}
            {isLoading && (
                <div className="flex items-end gap-2 justify-start">
                    <Avatar className="h-8 w-8"><AvatarFallback><Sparkles /></AvatarFallback></Avatar>
                    <div className="rounded-lg p-3 text-sm bg-muted"><Loader2 className="h-5 w-5 animate-spin"/></div>
                </div>
            )}
            {isEscalated && (
                <div className="p-4 bg-yellow-100 dark:bg-yellow-900/50 border border-yellow-500/50 rounded-lg text-center text-sm text-yellow-800 dark:text-yellow-200 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4"/>
                    A human agent has been notified and will respond on the Admin messaging page.
                </div>
            )}
            <div ref={messagesEndRef} />
         </div>
       </ScrollArea>
       <div className="p-4 border-t space-y-2">
          <form onSubmit={handleSendMessage} className="flex w-full items-center gap-2">
              <Input placeholder="Type your message..." value={input} onChange={(e) => setInput(e.target.value)} disabled={isEscalated} />
              <Button type="submit" size="icon" disabled={isLoading || isEscalated}>
                  <Send className="h-4 w-4" />
              </Button>
          </form>
          {!isEscalated && (
            <Button variant="outline" size="sm" className="w-full" onClick={handleEscalate}>
                <User className="mr-2 h-4 w-4" />
                Talk to an Admin
            </Button>
          )}
       </div>
    </div>
  );
}


export function NotificationCenter() {
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
        const audiences = ['all', `${role}`, role === 'parent' ? 'parents-and-students' : ''];
        notifQuery = query(
            notificationsRef,
            or(where('audience', 'in', audiences.filter(a => a)), where('userId', '==', user.uid)),
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
        <Tabs defaultValue="notifications" className="flex flex-col h-full">
            <SheetHeader className="p-6 pb-0">
                <SheetTitle className="flex items-center justify-between">
                    <span>Center</span>
                    {unreadCount > 0 && (
                        <Button variant="link" size="sm" className="h-auto p-0" onClick={handleMarkAllAsRead}>
                            <CheckCheck className="mr-2 h-4 w-4"/>
                            Mark all as read
                        </Button>
                    )}
                </SheetTitle>
                 <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="notifications">
                        <Bell className="mr-2 h-4 w-4" />
                        Notifications
                        {unreadCount > 0 && <span className="ml-2 bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">{unreadCount}</span>}
                    </TabsTrigger>
                    {role !== 'admin' && (
                        <TabsTrigger value="messages">
                            <MessageCircle className="mr-2 h-4 w-4" />
                            AI Support
                        </TabsTrigger>
                    )}
                </TabsList>
            </SheetHeader>
            <TabsContent value="notifications" className="flex-1 mt-0">
                 <ScrollArea className="h-full">
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
            </TabsContent>
            {role !== 'admin' && (
              <TabsContent value="messages" className="flex-1 mt-0 h-full">
                  <AiChatTab />
              </TabsContent>
            )}
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
