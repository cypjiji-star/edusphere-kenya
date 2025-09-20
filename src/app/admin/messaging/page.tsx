
'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MessageCircle, Send, Loader2, User, Sparkles } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useSearchParams } from 'next/navigation';
import { collection, onSnapshot, query, where, orderBy, Timestamp, addDoc, serverTimestamp, doc, updateDoc } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { useAuth } from '@/context/auth-context';

type Message = {
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
    messages: Message[];
};


export default function MessagingPage() {
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
              setSelectedConversation(updatedConvo || (convos.length > 0 ? convos[0] : null));
            } else if (convos.length > 0) {
               setSelectedConversation(convos[0]);
            }
            
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [schoolId, selectedConversation]);

    const handleSendMessage = async () => {
        if (!reply.trim() || !selectedConversation || !user || !schoolId) return;
        
        setIsSending(true);
        const newAdminMessage: Message = {
          role: 'admin',
          content: reply,
          senderName: user.displayName || 'Admin',
        };
        const newMessages: Message[] = [...selectedConversation.messages, newAdminMessage];

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
    
    if (isLoading) {
        return <div className="flex h-full items-center justify-center p-8"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;
    }


    return (
        <div className="p-4 sm:p-6 lg:p-8 h-full flex flex-col">
            <div className="mb-6">
                <h1 className="font-headline text-3xl font-bold flex items-center gap-2"><MessageCircle className="h-8 w-8 text-primary"/>Support Messaging</h1>
                <p className="text-muted-foreground">Respond to support requests escalated from the AI chatbot.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 flex-1 min-h-0">
                <Card className="md:col-span-1 lg:col-span-1">
                    <CardHeader>
                        <CardTitle>Escalated Chats</CardTitle>
                    </CardHeader>
                    <CardContent className="p-2">
                        <ScrollArea className="h-[calc(100vh-250px)]">
                            {conversations.map(convo => (
                                <button
                                    key={convo.id}
                                    onClick={() => setSelectedConversation(convo)}
                                    className={cn("w-full text-left p-3 rounded-lg flex items-start gap-3", selectedConversation?.id === convo.id ? 'bg-muted' : 'hover:bg-muted/50')}
                                >
                                    <Avatar>
                                        <AvatarImage src={convo.userAvatar}/>
                                        <AvatarFallback><User /></AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 overflow-hidden">
                                        <div className="flex justify-between items-center">
                                            <p className="font-semibold truncate">{convo.userName}</p>
                                            <p className="text-xs text-muted-foreground">{convo.lastUpdate?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                        </div>
                                        <p className="text-sm text-muted-foreground truncate">{convo.lastMessage}</p>
                                    </div>
                                </button>
                            ))}
                        </ScrollArea>
                    </CardContent>
                </Card>
                <Card className="md:col-span-2 lg:col-span-3 flex flex-col">
                    <CardHeader className="border-b">
                        {selectedConversation ? (
                            <div className="flex items-center gap-3">
                                <Avatar>
                                    <AvatarImage src={selectedConversation.userAvatar}/>
                                    <AvatarFallback><User/></AvatarFallback>
                                </Avatar>
                                <div>
                                    <CardTitle>{selectedConversation.userName}</CardTitle>
                                    <CardDescription>Conversation with {selectedConversation.userName}</CardDescription>
                                </div>
                            </div>
                        ) : (
                             <CardTitle>Select a Conversation</CardTitle>
                        )}
                    </CardHeader>
                    <CardContent className="flex-1 p-0">
                        <ScrollArea className="h-[calc(100vh-320px)]">
                            <div className="p-4 space-y-4">
                                {selectedConversation ? (
                                    selectedConversation.messages?.map((message, index) => {
                                        const isAdmin = message.role === 'admin';
                                        const isUser = message.role === 'user';
                                        const isModel = message.role === 'model';
                                        return (
                                        <div key={index} className={cn('flex items-end gap-2', isUser ? 'justify-end' : 'justify-start')}>
                                            {(isModel || isAdmin) && (
                                                <Avatar className="h-8 w-8">
                                                     <AvatarImage src={isAdmin ? user?.photoURL || '' : ''} />
                                                    <AvatarFallback>
                                                        {isModel ? <Sparkles /> : message.senderName?.charAt(0) || 'A'}
                                                    </AvatarFallback>
                                                </Avatar>
                                            )}
                                            <div className={cn('flex flex-col gap-1', isUser ? 'items-end' : 'items-start')}>
                                                {(isAdmin || isUser) && (
                                                    <p className="font-bold text-xs text-muted-foreground px-1">
                                                        {isAdmin ? message.senderName : selectedConversation.userName}
                                                    </p>
                                                )}
                                                <div className={cn("rounded-lg p-3 text-sm max-w-[80%]", 
                                                    isUser ? 'bg-primary text-primary-foreground' : 
                                                    (isAdmin ? 'bg-secondary text-secondary-foreground' : 'bg-muted')
                                                )}>
                                                    <p>{message.content}</p>
                                                </div>
                                            </div>
                                             {isUser && (
                                                <Avatar className="h-8 w-8">
                                                    <AvatarImage src={selectedConversation.userAvatar}/>
                                                    <AvatarFallback><User /></AvatarFallback>
                                                </Avatar>
                                            )}
                                        </div>
                                    )})
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground pt-16">
                                        <MessageCircle className="h-12 w-12 mb-4"/>
                                        <p>Select a conversation to begin.</p>
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>
                        </ScrollArea>
                    </CardContent>
                     {selectedConversation && (
                        <CardFooter className="border-t p-4">
                            <div className="relative w-full flex items-center gap-2">
                                <Input 
                                    placeholder="Type your reply..." 
                                    className="pr-12"
                                    value={reply}
                                    onChange={(e) => setReply(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                />
                                <Button type="submit" size="icon" className="absolute right-1" onClick={handleSendMessage} disabled={isSending}>
                                    {isSending ? <Loader2 className="h-4 w-4 animate-spin"/> : <Send className="h-4 w-4" />}
                                </Button>
                            </div>
                        </CardFooter>
                    )}
                </Card>
            </div>
        </div>
    );
}
