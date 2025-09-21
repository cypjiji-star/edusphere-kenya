
'use client';

import * as React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/context/auth-context';
import { useSearchParams } from 'next/navigation';
import { firestore } from '@/lib/firebase';
import { doc, onSnapshot, setDoc, updateDoc, arrayUnion, serverTimestamp, getDoc, addDoc, collection } from 'firebase/firestore';
import { cn } from '@/lib/utils';
import { supportChatbot } from '@/ai/flows/support-chatbot-flow';
import { MessageCircle, Send, Loader2, Sparkles, User, AlertTriangle } from 'lucide-react';

type AiMessage = {
  role: 'user' | 'model';
  content: string;
};

type AdminMessage = {
  role: 'user' | 'model' | 'admin';
  content: string;
  senderName?: string;
};

const aiEscalationMessage = "Understood. I'm escalating your request to a human administrator who will get back to you shortly.";

export function AiChat() {
  const [messages, setMessages] = React.useState<AdminMessage[]>([
    { role: 'model', content: 'Hello! How can I help you today?' }
  ]);
  const [input, setInput] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [isEscalated, setIsEscalated] = React.useState(false);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const searchParams = useSearchParams();
  const schoolId = searchParams.get('schoolId');
  const { user, role } = useAuth();
  
  const hasAdminReplied = messages.some(m => m.role === 'admin');
  const isChatActive = !isEscalated || hasAdminReplied;

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
    const escalationMessage: AdminMessage = { role: 'model', content: aiEscalationMessage };
    
    try {
        const userDocRef = doc(firestore, 'schools', schoolId, 'users', user.uid);
        const userDocSnap = await getDoc(userDocRef);
        const userData = userDocSnap.exists() ? userDocSnap.data() : { name: user.displayName, role };

        const chatDocRef = doc(firestore, `schools/${schoolId}/support-chats`, user.uid);
        await setDoc(chatDocRef, {
            userName: userData.name || user.displayName || 'User',
            userId: user.uid,
            messages: arrayUnion(escalationMessage),
            isEscalated: true,
            lastMessage: "Conversation escalated to admin.",
            lastUpdate: serverTimestamp()
        }, { merge: true });

        // Create a notification for the admin
        await addDoc(collection(firestore, 'schools', schoolId, 'notifications'), {
            title: 'Support Chat Escalated',
            description: `A chat with ${userData.name || user.displayName} requires your attention.`,
            createdAt: serverTimestamp(),
            category: 'Communication',
            href: `/admin/messaging?chatId=${user.uid}`,
            chatId: user.uid,
            audience: 'admin'
        });


    } catch (error) {
        console.error("Error escalating chat:", error);
    } finally {
        setIsLoading(false);
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !schoolId || !user) return;

    const userMessage: AdminMessage = { role: 'user', content: input };
    const currentMessages = [...messages, userMessage];
    setMessages(currentMessages);
    setInput('');
    setIsLoading(true);
    
    const chatDocRef = doc(firestore, `schools/${schoolId}/support-chats`, user.uid);

    if (!isEscalated) { // Talk to AI
        const chatSnap = await getDoc(chatDocRef);
        if (!chatSnap.exists()) {
             const userDocRef = doc(firestore, 'schools', schoolId, 'users', user.uid);
             const userDocSnap = await getDoc(userDocRef);
             const userData = userDocSnap.exists() ? userDocSnap.data() : { name: user.displayName, role };

             await setDoc(chatDocRef, {
                userName: userData.name || user.displayName || 'User',
                userId: user.uid,
                messages: currentMessages,
                lastMessage: input,
                lastUpdate: serverTimestamp()
            }, { merge: true });
        } else {
            await updateDoc(chatDocRef, {
                messages: currentMessages,
                lastMessage: input,
                lastUpdate: serverTimestamp()
            });
        }
        
        try {
            const result = await supportChatbot({ history: currentMessages as AiMessage[] });
            if (result.response === aiEscalationMessage) {
                await handleEscalate();
            } else {
                const aiMessage: AdminMessage = { role: 'model', content: result.response };
                await updateDoc(chatDocRef, {
                    messages: arrayUnion(aiMessage),
                    lastMessage: result.response,
                    lastUpdate: serverTimestamp()
                });
            }
        } catch (error) {
            console.error("Error with AI chatbot:", error);
            const errorMessage: AdminMessage = { role: 'model', content: 'Sorry, I encountered an error. Please try again.' };
            await updateDoc(chatDocRef, {
                messages: arrayUnion(errorMessage),
                lastMessage: errorMessage.content,
                lastUpdate: serverTimestamp()
            });
        } finally {
            setIsLoading(false);
        }
    } else { // Talk to Admin
        await updateDoc(chatDocRef, {
            messages: currentMessages,
            lastMessage: input,
            lastUpdate: serverTimestamp()
        });
        setIsLoading(false);
    }
  };

  return (
    <Card className="h-full flex flex-col">
        <CardHeader>
            <CardTitle className="flex items-center gap-2"><MessageCircle className="h-6 w-6 text-primary"/>Support Chat</CardTitle>
            <CardDescription>Get instant help from our AI assistant or connect with an administrator.</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 p-0">
             <ScrollArea className="h-full">
                <div className="p-4 space-y-4">
                    {messages.map((message, index) => {
                         const isAdmin = message.role === 'admin';
                         const isUser = message.role === 'user';
                         const isModel = message.role === 'model';
                        return (
                        <div key={index} className={cn('flex items-end gap-2', isUser ? 'justify-end' : 'justify-start')}>
                            {(isModel || isAdmin) && (
                                <Avatar className="h-8 w-8">
                                    <AvatarFallback>
                                        {isModel ? <Sparkles /> : message.senderName?.charAt(0) || 'A'}
                                    </AvatarFallback>
                                </Avatar>
                            )}
                            <div className={cn('flex flex-col gap-1', isUser ? 'items-end' : 'items-start')}>
                                {(isAdmin || isUser) && (
                                    <p className="font-bold text-xs text-muted-foreground px-1">
                                        {isAdmin ? message.senderName : user?.displayName}
                                    </p>
                                )}
                                <div className={cn("rounded-lg p-3 text-sm max-w-[80%]", 
                                     isUser ? 'bg-primary text-primary-foreground' : 
                                     (isAdmin ? 'bg-secondary text-secondary-foreground' : 'bg-muted'))}>
                                    <p>{message.content}</p>
                                </div>
                            </div>
                        </div>
                    )})}
                    {isLoading && (
                        <div className="flex items-end gap-2 justify-start">
                            <Avatar className="h-8 w-8"><AvatarFallback><Sparkles /></AvatarFallback></Avatar>
                            <div className="rounded-lg p-3 text-sm bg-muted"><Loader2 className="h-5 w-5 animate-spin"/></div>
                        </div>
                    )}
                    {isEscalated && !hasAdminReplied && (
                        <div className="p-4 bg-yellow-100 dark:bg-yellow-900/50 border border-yellow-500/50 rounded-lg text-center text-sm text-yellow-800 dark:text-yellow-200 flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4"/>
                            Waiting for an admin to join the chat...
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
            </ScrollArea>
        </CardContent>
        <CardFooter className="border-t p-4">
            <div className="flex flex-col w-full gap-2">
                <form onSubmit={handleSendMessage} className="flex w-full items-center gap-2">
                    <Input placeholder="Type your message..." value={input} onChange={(e) => setInput(e.target.value)} disabled={!isChatActive} />
                    <Button type="submit" size="icon" disabled={isLoading || !isChatActive}>
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
        </CardFooter>
    </Card>
  );
}
