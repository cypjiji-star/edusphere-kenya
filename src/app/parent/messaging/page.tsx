
'use client';

import * as React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  MessageCircle,
  Send,
  User,
  Users,
  Search,
  Sparkles,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { cn } from '@/lib/utils';
import { supportChatbot } from '@/ai/flows/support-chatbot-flow';
import { Timestamp }from 'firebase/firestore';

type Message = {
  role: 'user' | 'model';
  content: string;
};

const aiEscalationMessage = "Understood. I'm escalating your request to a human administrator who will get back to you shortly.";


export default function MessagingPage() {
  const searchParams = useSearchParams();
  const schoolId = searchParams.get('schoolId');
  const { user } = useAuth();
  
  const [messages, setMessages] = React.useState<Message[]>([
    { role: 'model', content: 'Hello! I am the EduSphere AI assistant. How can I help you today?' }
  ]);
  const [input, setInput] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [isEscalated, setIsEscalated] = React.useState(false);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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
            setIsEscalated(true);
        }

        const aiMessage: Message = { role: 'model', content: result.response };
        setMessages(prev => [...prev, aiMessage]);

    } catch (error) {
        console.error("Error with AI chatbot:", error);
        const errorMessage: Message = { role: 'model', content: 'Sorry, I encountered an error. Please try again.' };
        setMessages(prev => [...prev, errorMessage]);
    } finally {
        setIsLoading(false);
    }
  };


  return (
    <div className="p-4 sm:p-6 lg:p-8 h-full flex flex-col">
       <div className="mb-6">
        <h1 className="font-headline text-3xl font-bold flex items-center gap-2"><MessageCircle className="h-8 w-8 text-primary"/>Messaging</h1>
        <p className="text-muted-foreground">Communicate with teachers, staff, and our support team.</p>
       </div>
       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1">
            <div className="lg:col-span-1 hidden lg:block">
                <Card className="h-full">
                    <CardHeader>
                        <CardTitle>Conversations</CardTitle>
                        <div className="relative mt-2">
                           <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                           <Input placeholder="Search..." className="pl-8" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            <button className="w-full text-left p-3 rounded-lg bg-muted">
                                <div className="flex items-center gap-3">
                                    <Avatar>
                                        <AvatarFallback><Sparkles /></AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="font-semibold">AI Support Assistant</p>
                                        <p className="text-xs text-muted-foreground truncate">Active now</p>
                                    </div>
                                    <Badge className="ml-auto">1</Badge>
                                </div>
                            </button>
                        </div>
                    </CardContent>
                </Card>
            </div>
            <div className="lg:col-span-2 flex flex-col">
                 <Card className="flex-1 flex flex-col">
                    <CardHeader className="flex-row items-center gap-3">
                         <Avatar>
                            <AvatarFallback><Sparkles /></AvatarFallback>
                        </Avatar>
                        <div>
                            <CardTitle>AI Support Assistant</CardTitle>
                            <CardDescription>Ask me anything about the portal!</CardDescription>
                        </div>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
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
                                A human agent has been notified and will join this chat shortly.
                            </div>
                         )}
                        <div ref={messagesEndRef} />
                    </CardContent>
                    <CardFooter className="border-t pt-4">
                        <form onSubmit={handleSendMessage} className="flex w-full items-center gap-2">
                            <Input placeholder="Type your message..." value={input} onChange={(e) => setInput(e.target.value)} disabled={isEscalated} />
                            <Button type="submit" size="icon" disabled={isLoading || isEscalated}>
                                <Send className="h-4 w-4" />
                            </Button>
                        </form>
                    </CardFooter>
                </Card>
            </div>
       </div>
    </div>
  );
}
