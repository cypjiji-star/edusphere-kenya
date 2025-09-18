
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
  AlertTriangle,
  Send,
  ArrowLeft,
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
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/auth-context';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { ScrollArea } from '../ui/scroll-area';
import { useSearchParams } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Textarea } from '../ui/textarea';

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

type Conversation = {
  id: string;
  name: string;
  avatar: string;
  lastMessage: string;
  timestamp: Timestamp;
  unread: boolean;
  participants: string[];
  lastMessageSender?: string;
};

type Message = {
  id?: string;
  sender: string;
  text: string;
  timestamp: Timestamp | null;
  read?: boolean;
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
  onMarkAsRead,
  currentUserId,
}: {
  notification: Notification;
  schoolId: string;
  onMarkAsRead: (id: string) => void;
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
        isRead ? 'border-transparent' : 'border-primary',
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
      {!isRead && (
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

function ChatView({ conversation, schoolId, userId, onBack }: { conversation: Conversation; schoolId: string; userId: string; onBack: () => void; }) {
    const [messages, setMessages] = React.useState<Message[]>([]);
    const [reply, setReply] = React.useState('');
    const messagesEndRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        const messagesQuery = query(
            collection(firestore, 'schools', schoolId, 'conversations', conversation.id, 'messages'),
            orderBy('timestamp', 'asc')
        );
        const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
            setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message)));
        });
        return unsubscribe;
    }, [schoolId, conversation.id]);
    
    React.useEffect(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendReply = async () => {
        if (!reply.trim()) return;
        const newReply = reply;
        setReply('');
        
        await addDoc(collection(firestore, 'schools', schoolId, 'conversations', conversation.id, 'messages'), {
            sender: userId,
            text: newReply,
            timestamp: serverTimestamp(),
            read: false,
        });

        await updateDoc(doc(firestore, 'schools', schoolId, 'conversations', conversation.id), {
            lastMessage: newReply,
            timestamp: serverTimestamp(),
            lastMessageSender: userId,
            unread: true,
        });
    };

    return (
        <div className="flex flex-col h-full">
            <header className="p-4 border-b flex items-center gap-4">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onBack}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <Avatar className="h-9 w-9">
                    <AvatarImage src={conversation.avatar} />
                    <AvatarFallback>{conversation.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <h3 className="font-semibold">{conversation.name}</h3>
            </header>
            <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                    {messages.map(msg => (
                        <div key={msg.id} className={cn('flex items-end gap-2', msg.sender === userId ? 'justify-end' : 'justify-start')}>
                            <div className={cn("rounded-lg p-3 text-sm max-w-[80%]", msg.sender === userId ? 'bg-primary text-primary-foreground' : 'bg-muted')}>
                                <p>{msg.text}</p>
                            </div>
                        </div>
                    ))}
                </div>
                <div ref={messagesEndRef} />
            </ScrollArea>
            <div className="p-4 border-t">
                <div className="relative">
                    <Textarea 
                        placeholder="Type a reply..." 
                        value={reply} 
                        onChange={(e) => setReply(e.target.value)} 
                        onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendReply(); } }}
                        className="pr-12"
                    />
                    <Button size="icon" className="absolute right-2 bottom-2 h-8 w-8" onClick={handleSendReply}>
                        <Send className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
}

export function NotificationCenter() {
  const { user, role } = useAuth();
  const searchParams = useSearchParams();
  const schoolId = searchParams.get('schoolId');
  const [notifications, setNotifications] = React.useState<Notification[]>([]);
  const [conversations, setConversations] = React.useState<Conversation[]>([]);
  const [activeTab, setActiveTab] = React.useState('all');
  const [selectedConversation, setSelectedConversation] = React.useState<Conversation | null>(null);
  
  const unreadNotifications = notifications.filter((n) => !n.readBy?.includes(user?.uid || ''));
  const unreadMessages = conversations.filter(c => c.unread && c.lastMessageSender !== user?.uid).length;
  const unreadCount = unreadNotifications.length + unreadMessages;

  React.useEffect(() => {
    if (!schoolId || !user || !role || role === 'unknown') return;

    // --- Notifications listener ---
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

    // --- Messages listener ---
    const convosQuery = query(collection(firestore, `schools/${schoolId}/conversations`), where('participants', 'array-contains', user.uid), orderBy('timestamp', 'desc'));
    const unsubConvos = onSnapshot(convosQuery, (snapshot) => {
        setConversations(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Conversation)));
    });

    return () => {
        unsubNotifs();
        unsubConvos();
    };
  }, [schoolId, user, role]);

  const handleMarkAsRead = async (id: string) => {
    if (!schoolId || !user) return;
    const notificationRef = doc(firestore, 'schools', schoolId, 'notifications', id);
    await updateDoc(notificationRef, { 
        readBy: arrayUnion(user.uid),
    });
  };

  const handleMarkAllRead = async () => {
    if (!schoolId || !user || unreadNotifications.length === 0) return;
    const batch = writeBatch(firestore);
    unreadNotifications.forEach((notification) => {
        const notifRef = doc(firestore, 'schools', schoolId, 'notifications', notification.id);
        batch.update(notifRef, { readBy: arrayUnion(user.uid) });
    });
    await batch.commit();
  };
  
  const filteredNotifications = notifications.filter(n => activeTab === 'all' || n.category === activeTab);

  if (selectedConversation && schoolId && user) {
      return (
          <Sheet open={true} onOpenChange={(open) => !open && setSelectedConversation(null)}>
               <SheetContent className="w-full sm:max-w-md p-0">
                    <ChatView conversation={selectedConversation} schoolId={schoolId} userId={user.uid} onBack={() => setSelectedConversation(null)} />
               </SheetContent>
          </Sheet>
      )
  }

  return (
    <Sheet onOpenChange={(open) => !open && setSelectedConversation(null)}>
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
      <SheetContent className="w-full sm:max-w-md p-0 flex flex-col">
        <SheetHeader className="p-6 border-b">
          <SheetTitle className="flex items-center justify-between">
            <span>Communications</span>
             {unreadCount > 0 && (
                <Button variant="link" size="sm" className="h-auto p-0" onClick={handleMarkAllRead}>
                    <CheckCheck className="mr-2 h-4 w-4"/>
                    Mark all as read
                </Button>
            )}
          </SheetTitle>
        </SheetHeader>
        <Tabs defaultValue="notifications" className="flex-1 flex flex-col">
            <div className="px-4">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="notifications">
                        Notifications
                        {unreadNotifications.length > 0 && <span className="ml-2 h-2 w-2 rounded-full bg-primary"/>}
                    </TabsTrigger>
                    <TabsTrigger value="messages">
                        Messages
                        {unreadMessages > 0 && <span className="ml-2 h-2 w-2 rounded-full bg-primary"/>}
                    </TabsTrigger>
                </TabsList>
            </div>

            <TabsContent value="notifications" className="flex-1 overflow-hidden">
                <ScrollArea className="h-full">
                    <div className="p-4 pt-2 space-y-2">
                        {notifications.length > 0 ? (
                            notifications.map((notification) => (
                                <NotificationItem
                                key={notification.id}
                                notification={notification}
                                schoolId={schoolId!}
                                onMarkAsRead={handleMarkAsRead}
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
            <TabsContent value="messages" className="flex-1 overflow-hidden">
                 <ScrollArea className="h-full">
                    <div className="p-4 pt-2 space-y-1">
                        {conversations.length > 0 ? conversations.map((convo) => (
                            <button key={convo.id} className="w-full text-left p-2 rounded-lg hover:bg-muted" onClick={() => setSelectedConversation(convo)}>
                                <div className="flex items-start gap-3">
                                    <Avatar className="h-10 w-10">
                                        <AvatarImage src={convo.avatar} />
                                        <AvatarFallback>{convo.name.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 truncate">
                                        <div className="flex justify-between items-center">
                                            <p className="font-semibold text-sm truncate">{convo.name}</p>
                                            <p className="text-xs text-muted-foreground">{convo.timestamp?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                        </div>
                                        <p className={cn("text-sm truncate", convo.unread && convo.lastMessageSender !== user?.uid ? "font-bold text-foreground" : "text-muted-foreground")}>
                                            {convo.lastMessage}
                                        </p>
                                    </div>
                                     {convo.unread && convo.lastMessageSender !== user?.uid && <div className="h-2.5 w-2.5 rounded-full bg-primary mt-1.5 shrink-0"></div>}
                                </div>
                            </button>
                        )) : (
                            <div className="text-center text-muted-foreground py-16">
                                <p>You have no messages.</p>
                            </div>
                        )}
                    </div>
                </ScrollArea>
            </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
