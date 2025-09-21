
'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MessageCircle, Send, Loader2, User } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useSearchParams } from 'next/navigation';
import { collection, onSnapshot, query, where, orderBy, Timestamp, addDoc, serverTimestamp, doc, updateDoc, getDoc } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { useAuth } from '@/context/auth-context';

type Message = {
  role: 'teacher' | 'parent';
  content: string;
  timestamp: Timestamp;
};

type Conversation = {
    id: string;
    parentName: string;
    parentId: string;
    studentName: string;
    lastMessage: string;
    lastUpdate: Timestamp;
    unreadByTeacher: boolean;
};

export default function TeacherMessagingPage() {
    const searchParams = useSearchParams();
    const schoolId = searchParams.get('schoolId');
    const { user } = useAuth();
    const [conversations, setConversations] = React.useState<Conversation[]>([]);
    const [selectedConversation, setSelectedConversation] = React.useState<Conversation | null>(null);
    const [messages, setMessages] = React.useState<Message[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [reply, setReply] = React.useState('');
    const [isSending, setIsSending] = React.useState(false);
    const messagesEndRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    React.useEffect(() => {
        if (!schoolId || !user) {
            setIsLoading(false);
            return;
        }

        const q = query(
            collection(firestore, `schools/${schoolId}/conversations`), 
            where('teacherId', '==', user.uid), 
            orderBy('lastUpdate', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const convos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Conversation));
            setConversations(convos);
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [schoolId, user]);

    React.useEffect(() => {
      if (!selectedConversation) {
        setMessages([]);
        return;
      }
      const unsub = onSnapshot(
        doc(firestore, `schools/${schoolId}/conversations`, selectedConversation.id),
        (doc) => {
          setMessages(doc.data()?.messages || []);
        }
      );
      return () => unsub();
    }, [selectedConversation, schoolId]);


    const handleSendMessage = async () => {
        if (!reply.trim() || !selectedConversation || !user || !schoolId) return;
        
        setIsSending(true);
        const newMessage: Message = {
          role: 'teacher',
          content: reply,
          timestamp: Timestamp.now(),
        };

        try {
            const conversationRef = doc(firestore, 'schools', schoolId, 'conversations', selectedConversation.id);
            await updateDoc(conversationRef, {
                messages: [...messages, newMessage],
                lastMessage: reply,
                lastUpdate: serverTimestamp(),
                unreadByParent: true,
                unreadByTeacher: false,
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
                <h1 className="font-headline text-3xl font-bold flex items-center gap-2"><MessageCircle className="h-8 w-8 text-primary"/>Parent-Teacher Messaging</h1>
                <p className="text-muted-foreground">Communicate directly with parents of your students.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 flex-1 min-h-0">
                <Card className="md:col-span-1 lg:col-span-1">
                    <CardHeader>
                        <CardTitle>Conversations</CardTitle>
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
                                        <AvatarFallback><User /></AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 overflow-hidden">
                                        <div className="flex justify-between items-center">
                                            <p className="font-semibold truncate">{convo.parentName}</p>
                                            <p className="text-xs text-muted-foreground">{convo.lastUpdate?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                        </div>
                                        <p className="text-sm text-muted-foreground truncate">{convo.studentName}</p>
                                        <p className="text-sm text-muted-foreground truncate">{convo.lastMessage}</p>
                                    </div>
                                     {convo.unreadByTeacher && <div className="w-2.5 h-2.5 bg-primary rounded-full mt-1.5"></div>}
                                </button>
                            ))}
                             {conversations.length === 0 && (
                                <div className="text-center text-muted-foreground py-16">
                                    <p>No active conversations.</p>
                                </div>
                            )}
                        </ScrollArea>
                    </CardContent>
                </Card>
                <Card className="md:col-span-2 lg:col-span-3 flex flex-col">
                    <CardHeader className="border-b">
                        {selectedConversation ? (
                            <div>
                                <CardTitle>{selectedConversation.parentName}</CardTitle>
                                <CardDescription>Parent of {selectedConversation.studentName}</CardDescription>
                            </div>
                        ) : (
                             <CardTitle>Select a Conversation</CardTitle>
                        )}
                    </CardHeader>
                    <CardContent className="flex-1 p-0">
                        <ScrollArea className="h-[calc(100vh-320px)]">
                            <div className="p-4 space-y-4">
                                {selectedConversation ? (
                                    messages.map((message, index) => (
                                    <div key={index} className={cn('flex items-end gap-2', message.role === 'teacher' ? 'justify-end' : 'justify-start')}>
                                        {message.role === 'parent' && (
                                            <Avatar className="h-8 w-8"><AvatarFallback><User /></AvatarFallback></Avatar>
                                        )}
                                        <div className={cn("rounded-lg p-3 text-sm max-w-[80%]", message.role === 'teacher' ? 'bg-primary text-primary-foreground' : 'bg-muted')}>
                                            <p>{message.content}</p>
                                        </div>
                                    </div>
                                    ))
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
