
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
  setDoc,
} from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/auth-context';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { ScrollArea } from '../ui/scroll-area';
import { useSearchParams } from 'next/navigation';
import { Input } from '../ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
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

type AiMessage = {
  role: 'user' | 'model';
  content: string;
};

type AdminMessage = {
  role: 'user' | 'model' | 'admin';
  content: string;
  senderName?: string;
};

type Conversation = {
    id: string;
    userName: string;
    userAvatar: string;
    userId: string;
    lastMessage: string;
    lastUpdate: Timestamp;
    isEscalated: boolean;
    messages: AdminMessage[];
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

function AdminMessagesTab() {
    const searchParams = useSearchParams();
    const schoolId = searchParams.get('schoolId');
    const { user } = useAuth();
    const [conversations, setConversations] = React.useState<Conversation[]>([]);
    const [selectedConversation, setSelectedConversation] = React.useState<Conversation | null>(null);
    const [isLoading, setIsLoading] = React.useState(true);
    const [reply, setReply] = React.useState('');
    const [isSending, setIsSending] = React.useState(false);
    const messagesEndRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [selectedConversation?.messages]);

    React.useEffect(() => {
        if (!schoolId) {
            setIsLoading(false);
            return;
        }

        const q = query(
            collection(firestore, `schools/${schoolId}/support-chats`),
            where('isEscalated', '==', true),
            orderBy('lastUpdate', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const convos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Conversation));
            setConversations(convos);

            if (selectedConversation) {
              const updatedConvo = convos.find(c => c.id === selectedConversation.id);
              setSelectedConversation(updatedConvo || null);
            }
            
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [schoolId, selectedConversation]);

    const handleSendMessage = async () => {
        if (!reply.trim() || !selectedConversation || !user || !schoolId) return;
        
        setIsSending(true);
        const newAdminMessage: AdminMessage = {
          role: 'admin',
          content: reply,
          senderName: user.displayName || 'Admin',
        };
        const newMessages: AdminMessage[] = [...selectedConversation.messages, newAdminMessage];

        try {
            const conversationRef = doc(firestore, 'schools', schoolId, 'support-chats', selectedConversation.id);
            await updateDoc(conversationRef, {
                messages: newMessages,
                lastMessage: reply,
                lastUpdate: serverTimestamp(),
            });
            setReply('');
        } catch (error) {
            console.error("Error sending reply:", error);
        } finally {
            setIsSending(false);
        }
    };
    
    return (
        <div className="h-full flex flex-col">
            {!selectedConversation ? (
                <ScrollArea className="flex-1">
                    <div className="p-2 space-y-1">
                        {isLoading ? (
                            <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin"/></div>
                        ) : conversations.length > 0 ? (
                             conversations.map(convo => (
                                <button
                                    key={convo.id}
                                    onClick={() => setSelectedConversation(convo)}
                                    className="w-full text-left p-3 rounded-lg flex items-start gap-3 hover:bg-muted/50"
                                >
                                    <Avatar>
                                        <AvatarImage src={convo.userAvatar}/>
                                        <AvatarFallback><User /></AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 overflow-hidden">
                                        <div className="flex justify-between items-center">
                                            <p className="font-semibold truncate text-sm">{convo.userName}</p>
                                            <p className="text-xs text-muted-foreground">{convo.lastUpdate?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                        </div>
                                        <p className="text-sm text-muted-foreground truncate">{convo.lastMessage}</p>
                                    </div>
                                </button>
                            ))
                        ) : (
                            <div className="text-center py-16 text-muted-foreground">
                                <p>No escalated chats.</p>
                            </div>
                        )}
                    </div>
                </ScrollArea>
            ) : (
            <>
                <div className="p-4 border-b">
                    <Button variant="link" onClick={() => setSelectedConversation(null)} className="p-0 h-auto text-sm">
                        &larr; Back to all chats
                    </Button>
                </div>
                 <ScrollArea className="flex-1">
                    <div className="p-4 space-y-4">
                        {selectedConversation.messages?.map((message, index) => {
                            const isAdmin = message.role === 'admin';
                            const isUser = message.role === 'user';
                            const isModel = message.role === 'model';
                            return (
                            <div key={index} className={cn('flex items-end gap-2', isUser ? 'justify-end' : 'justify-start')}>
                                {(isModel || isAdmin) && (
                                    <Avatar className="h-8 w-8">
                                        <AvatarFallback>
                                            {isModel ? <Sparkles /> : user?.displayName?.charAt(0)}
                                        </AvatarFallback>
                                    </Avatar>
                                )}
                                <div className={cn("rounded-lg p-3 text-sm max-w-[80%]", 
                                    isUser ? 'bg-primary text-primary-foreground' : 
                                    (isAdmin ? 'bg-secondary text-secondary-foreground' : 'bg-muted')
                                )}>
                                    <p>{message.content}</p>
                                </div>
                            </div>
                        )})}
                        <div ref={messagesEndRef} />
                    </div>
                </ScrollArea>
                 <div className="p-4 border-t">
                    <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="flex w-full items-center gap-2">
                        <Input placeholder="Type your reply..." value={reply} onChange={(e) => setReply(e.target.value)} />
                        <Button type="submit" size="icon" disabled={isSending}>
                            <Send className="h-4 w-4" />
                        </Button>
                    </form>
                </div>
            </>
            )}
        </div>
    )
}

function AiChatTab() {
  const [messages, setMessages] = React.useState<AiMessage[]>([
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

  React.useEffect(() => {
    if (!schoolId || !user) return;

    const chatDocRef = doc(firestore, `schools/${schoolId}/support-chats`, user.uid);
    const unsubscribe = onSnapshot(chatDocRef, (docSnap) => {
        if (docSnap.exists()) {
            const data = docSnap.data();
            setMessages(data.messages || []);
            setIsEscalated(data.isEscalated || false);
        }
    });
    return () => unsubscribe();
  }, [schoolId, user]);
  
  const handleEscalate = async () => {
    if (!schoolId || !user || isEscalated) return;
    
    setIsLoading(true);
    const escalationMessage: AiMessage = { role: 'model', content: aiEscalationMessage };
    
    try {
        const chatDocRef = doc(firestore, `schools/${schoolId}/support-chats`, user.uid);
        await setDoc(chatDocRef, {
            userId: user.uid,
            userName: user.displayName || "User",
            userAvatar: user.photoURL || `https://picsum.photos/seed/${user.uid}/100`,
            messages: arrayUnion(escalationMessage),
            isEscalated: true,
            lastMessage: "Conversation escalated to admin.",
            lastUpdate: serverTimestamp()
        }, { merge: true });

    } catch (error) {
        console.error("Error escalating chat:", error);
    } finally {
        setIsLoading(false);
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !schoolId || !user) return;

    const userMessage: AiMessage = { role: 'user', content: input };
    const currentMessages = [...messages, userMessage];
    setMessages(currentMessages);
    setInput('');
    setIsLoading(true);
    
    const chatDocRef = doc(firestore, 'schools', schoolId, 'support-chats', user.uid);
    await setDoc(chatDocRef, {
        userId: user.uid,
        userName: user.displayName || 'User',
        userAvatar: user.photoURL || `https://picsum.photos/seed/${user.uid}/100`,
        messages: currentMessages,
        lastMessage: input,
        lastUpdate: serverTimestamp()
    }, { merge: true });


    try {
        const result = await supportChatbot({ history: currentMessages });
        if (result.response === aiEscalationMessage) {
            await handleEscalate();
        } else {
            const aiMessage: AiMessage = { role: 'model', content: result.response };
            await updateDoc(chatDocRef, {
                messages: arrayUnion(aiMessage),
                lastMessage: result.response,
                lastUpdate: serverTimestamp()
            });
        }
    } catch (error) {
        console.error("Error with AI chatbot:", error);
        const errorMessage: AiMessage = { role: 'model', content: 'Sorry, I encountered an error. Please try again.' };
         await updateDoc(chatDocRef, {
            messages: arrayUnion(errorMessage),
            lastMessage: errorMessage.content,
            lastUpdate: serverTimestamp()
        });
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
                    <TabsTrigger value="messages">
                        <MessageCircle className="mr-2 h-4 w-4" />
                        {role === 'admin' ? 'Messages' : 'AI Support'}
                    </TabsTrigger>
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
              <TabsContent value="messages" className="flex-1 mt-0 h-full">
                  {role === 'admin' ? <AdminMessagesTab /> : <AiChatTab />}
              </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
