
'use client';

import * as React from 'react';
import {
  MessageCircle,
  Send,
  Paperclip,
  Loader2,
  X,
  Clock,
  Wand2,
  User,
  ShieldCheck,
} from 'lucide-react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage, firestore } from '@/lib/firebase';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp,
  Timestamp,
  doc,
  updateDoc,
  setDoc,
  where,
} from 'firebase/firestore';
import { useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/auth-context';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { supportChatbot } from '@/ai/flows/support-chatbot-flow';

const ADMIN_SUPPORT_ID = 'admin_support_user';

type Message = {
  id?: string;
  role: 'user' | 'model';
  content: string;
  timestamp?: Timestamp | null;
  attachmentUrl?: string;
  scheduledAt?: Timestamp;
};

type Conversation = {
  id: string;
  name: string;
  avatar: string;
  lastMessage: string;
  timestamp: Timestamp;
  participants: string[];
};

export function ParentChatLayout() {
  const searchParams = useSearchParams();
  const schoolId = searchParams.get('schoolId');
  const { user } = useAuth();

  const [messages, setMessages] = React.useState<Message[]>([]);
  const [conversationId, setConversationId] = React.useState<string | null>(null);
  const [chatState, setChatState] = React.useState<'ai' | 'human'>('ai');
  const [input, setInput] = React.useState('');
  const [isSending, setIsSending] = React.useState(false);
  const { toast } = useToast();
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const createConversation = async () => {
    if (!schoolId || !user) return null;
    const newConvoRef = doc(collection(firestore, `schools/${schoolId}/conversations`));
    const newConversation = {
      id: newConvoRef.id,
      name: user.displayName || 'Parent',
      avatar: user.photoURL || `https://picsum.photos/seed/${user.uid}/100`,
      lastMessage: 'Conversation with AI started.',
      timestamp: serverTimestamp(),
      participants: [user.uid, ADMIN_SUPPORT_ID].sort(),
    };
    await setDoc(newConvoRef, newConversation);
    setConversationId(newConvoRef.id);
    return newConvoRef.id;
  };

  const escalateToHuman = async () => {
    if (!schoolId || !user) return;
    setChatState('human');
    toast({
      title: 'Escalating to Admin...',
      description: 'You will now be connected with a human support agent.',
    });

    let currentConvoId = conversationId;
    if (!currentConvoId) {
      currentConvoId = await createConversation();
    }
    
    if (currentConvoId) {
       const convoRef = doc(firestore, `schools/${schoolId}/conversations`, currentConvoId);
       await updateDoc(convoRef, {
           lastMessage: "Escalated to admin.",
           timestamp: serverTimestamp(),
           unread: true, // Make it unread for the admin
       });
    }
  };


  const handleSendMessage = async () => {
    if (input.trim() === '' || !schoolId || !user) return;
    setIsSending(true);
    const userInput = input;
    setInput('');
    
    const userMessage: Message = {
        role: 'user',
        content: userInput,
        timestamp: Timestamp.now(),
    };
    setMessages(prev => [...prev, userMessage]);
    
    if (chatState === 'ai') {
        const result = await supportChatbot({ history: [...messages, userMessage] });
        const aiResponse: Message = {
            role: 'model',
            content: result.response || 'Sorry, I am unable to respond right now.',
            timestamp: Timestamp.now(),
        };
        setMessages(prev => [...prev, aiResponse]);
    } else {
        let currentConvoId = conversationId;
        if (!currentConvoId) {
            currentConvoId = await createConversation();
        }
        if (currentConvoId) {
            const messagesRef = collection(firestore, `schools/${schoolId}/conversations`, currentConvoId, 'messages');
            await addDoc(messagesRef, { sender: user.uid, text: userInput, timestamp: serverTimestamp() });
            await updateDoc(doc(firestore, `schools/${schoolId}/conversations`, currentConvoId), {
                lastMessage: userInput,
                timestamp: serverTimestamp(),
                unread: true,
            });
        }
    }

    setIsSending(false);
  };


  return (
    <div className="z-10 h-full w-full bg-background rounded-lg overflow-hidden flex flex-col">
       <div className="flex-shrink-0 p-4 border-b">
            <h2 className="text-xl font-bold font-headline flex items-center gap-2">
                <MessageCircle className="h-6 w-6 text-primary"/>
                Support Chat
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
                {chatState === 'ai' ? 'Chatting with our AI Assistant' : 'Chatting with an Administrator'}
            </p>
        </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, index) => (
          <div key={index} className={cn("flex items-end gap-2", msg.role === 'user' ? 'justify-end' : 'justify-start')}>
            {msg.role === 'model' && (<Avatar className="h-8 w-8"><AvatarImage /><AvatarFallback><Wand2/></AvatarFallback></Avatar>)}
            <div className="group relative max-w-xs lg:max-w-md">
              <div className={cn("rounded-2xl p-3 text-sm shadow-sm", msg.role === 'user' ? 'bg-primary text-primary-foreground rounded-br-none' : 'bg-secondary rounded-bl-none')}>
                <p className="whitespace-pre-wrap">{msg.content}</p>
                <div className={cn("text-xs mt-2 flex items-center gap-2", msg.role === 'user' ? 'text-primary-foreground/70' : 'text-muted-foreground')}>
                  <span>{msg.timestamp?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
            </div>
             {msg.role === 'user' && (<Avatar className="h-8 w-8"><AvatarImage src={user?.photoURL || ''}/><AvatarFallback><User/></AvatarFallback></Avatar>)}
          </div>
        ))}
        {messages.length === 0 && (
            <div className="text-center text-muted-foreground pt-16">
                <Wand2 className="h-10 w-10 mx-auto mb-2"/>
                <p className="font-semibold">Hello! How can I help you today?</p>
            </div>
        )}
        <div ref={messagesEndRef} />
      </div>

       {chatState === 'ai' && (
          <div className="p-2 border-t text-center">
            <Button variant="link" onClick={escalateToHuman}>
              <ShieldCheck className="mr-2 h-4 w-4" /> Speak to an Administrator
            </Button>
          </div>
        )}

      <div className="flex-shrink-0 p-4 border-t space-y-2">
        <div className="relative">
          <Textarea 
            placeholder="Type your message..." 
            className="pr-12 min-h-[60px] max-h-48" 
            value={input} 
            onChange={(e) => setInput(e.target.value)} 
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }} 
            disabled={isSending} 
          />
          <div className="absolute top-3 right-3 flex items-center gap-1">
            <Button size="icon" disabled={!input.trim() || isSending} onClick={handleSendMessage}>
              {isSending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
