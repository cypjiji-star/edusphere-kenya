
'use client';

import * as React from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { MessageSquare, ArrowRight, Loader2, User, Send, X, ArrowLeft, CheckCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { collection, onSnapshot, query, orderBy, limit, Timestamp, doc, updateDoc, arrayUnion, serverTimestamp } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/auth-context';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { AnimatePresence, motion } from 'framer-motion';

type AdminMessage = {
  role: 'user' | 'model' | 'admin';
  content: string;
  senderName?: string;
  timestamp: Timestamp;
};

type Conversation = {
    id: string;
    userName: string;
    lastMessage: string;
    lastUpdate: Timestamp;
    isEscalated: boolean;
    messages: AdminMessage[];
};

export function FloatingChatWidget() {
    const searchParams = useSearchParams();
    const schoolId = searchParams.get('schoolId');
    const { user } = useAuth();
    const [conversations, setConversations] = React.useState<Conversation[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [selectedConversation, setSelectedConversation] = React.useState<Conversation | null>(null);
    const [reply, setReply] = React.useState('');
    const [isSending, setIsSending] = React.useState(false);

    const unreadCount = conversations.filter(c => c.isEscalated).length;

    React.useEffect(() => {
        if (!schoolId) {
            setIsLoading(false);
            return;
        }

        const q = query(
            collection(firestore, `schools/${schoolId}/support-chats`), 
            orderBy('lastUpdate', 'desc'),
            limit(10)
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
        const newAdminMessage = {
          role: 'admin',
          content: reply,
          senderName: user.displayName || 'Admin',
          timestamp: Timestamp.now(),
        };

        try {
            const conversationRef = doc(firestore, 'schools', schoolId, 'support-chats', selectedConversation.id);
            await updateDoc(conversationRef, {
                messages: arrayUnion(newAdminMessage),
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
    
    const messagesEndRef = React.useRef<HTMLDivElement>(null);
    React.useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [selectedConversation?.messages]);

    const AdminMessageBubble = ({ message }: { message: AdminMessage }) => (
      <motion.div 
        className="flex justify-end items-end gap-2 max-w-xs ml-auto"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex flex-col items-end">
          <div className="bg-blue-600 text-white p-3 rounded-2xl rounded-br-none shadow-md">
            <p className="text-sm">{message.content}</p>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
             <span>{message.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
             <CheckCheck className="h-4 w-4 text-blue-400"/>
          </div>
        </div>
        <Avatar className="h-8 w-8">
            <AvatarFallback>{message.senderName?.charAt(0) || 'A'}</AvatarFallback>
        </Avatar>
      </motion.div>
    );
    
    const UserMessageBubble = ({ message, userName }: { message: AdminMessage, userName: string }) => (
        <div className="flex items-end gap-2 max-w-xs">
            <Avatar className="h-8 w-8">
                <AvatarFallback><User/></AvatarFallback>
            </Avatar>
            <div className="flex flex-col items-start">
              <div className="bg-muted p-3 rounded-2xl rounded-bl-none">
                <p className="text-sm">{message.content}</p>
              </div>
              <span className="text-xs text-muted-foreground mt-1">{message.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
        </div>
    );

    return (
        <Popover onOpenChange={() => setSelectedConversation(null)}>
            <PopoverTrigger asChild>
                <Button
                    className="fixed bottom-6 right-6 h-16 w-16 rounded-full shadow-lg"
                    size="icon"
                >
                    <MessageSquare className="h-8 w-8" />
                    {unreadCount > 0 && (
                        <Badge variant="destructive" className="absolute -top-1 -right-1">
                            {unreadCount}
                        </Badge>
                    )}
                    <span className="sr-only">Open Messages</span>
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[350px] mr-4 mb-2 p-0" side="top" align="end">
                <AnimatePresence initial={false}>
                    {selectedConversation ? (
                        <motion.div
                            key="chat-view"
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                            className="h-[500px] flex flex-col"
                        >
                            <div className="p-4 border-b flex items-center gap-2">
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelectedConversation(null)}><ArrowLeft/></Button>
                                <Avatar className="h-9 w-9">
                                    <AvatarFallback><User /></AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="font-semibold">{selectedConversation.userName}</p>
                                    <p className="text-xs text-muted-foreground">Support Chat</p>
                                </div>
                            </div>
                            <ScrollArea className="flex-1">
                                <div className="p-4 space-y-4">
                                {selectedConversation.messages.map((message, index) =>
                                    message.role === 'admin' ? (
                                        <AdminMessageBubble key={index} message={message} />
                                    ) : (
                                        <UserMessageBubble key={index} message={message} userName={selectedConversation.userName} />
                                    )
                                )}
                                 <div ref={messagesEndRef} />
                                </div>
                            </ScrollArea>
                            <div className="p-4 border-t">
                                <div className="relative">
                                    <Input 
                                        placeholder="Reply..." 
                                        className="pr-12"
                                        value={reply}
                                        onChange={(e) => setReply(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                    />
                                    <Button size="icon" className="absolute top-1/2 right-1 -translate-y-1/2 h-8 w-8" onClick={handleSendMessage} disabled={isSending}>
                                        {isSending ? <Loader2 className="h-4 w-4 animate-spin"/> : <Send className="h-4 w-4" />}
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    ) : (
                         <motion.div
                            key="list-view"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                         >
                            <div className="space-y-2 p-4">
                                <h4 className="font-medium leading-none">Recent Conversations</h4>
                                {isLoading ? (
                                    <div className="h-24 flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>
                                ) : conversations.length > 0 ? (
                                    <div className="space-y-1">
                                        {conversations.map(convo => (
                                            <button key={convo.id} onClick={() => setSelectedConversation(convo)} className="w-full text-left p-2 -m-2 rounded-md hover:bg-muted">
                                                <div className={cn("space-y-1", convo.isEscalated && "font-bold")}>
                                                    <div className="flex items-center gap-2">
                                                        <User className="h-4 w-4 text-muted-foreground"/>
                                                        <p className="text-sm truncate">{convo.userName}</p>
                                                        {convo.isEscalated && <Badge variant="destructive" className="h-5">Urgent</Badge>}
                                                    </div>
                                                    <p className="text-xs text-muted-foreground truncate">{convo.lastMessage}</p>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground text-center py-4">No recent messages.</p>
                                )}
                            </div>
                            <Separator />
                            <div className="p-2">
                                <Button asChild className="w-full" variant="secondary">
                                    <Link href={`/admin/messaging?schoolId=${schoolId}`}>
                                        Go to Full Messaging
                                        <ArrowRight className="ml-2 h-4 w-4" />
                                    </Link>
                                </Button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </PopoverContent>
        </Popover>
    );
}

