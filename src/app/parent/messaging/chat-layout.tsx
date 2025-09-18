'use client';

import * as React from 'react';
import {
  MessageCircle,
  Send,
  Loader2,
  User,
  ShieldCheck,
  Wand2
} from 'lucide-react';
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
  limit,
  getDocs,
} from 'firebase/firestore';
import { useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/auth-context';
import { firestore } from '@/lib/firebase';
import { supportChatbot } from '@/ai/flows/support-chatbot-flow';

const ADMIN_SUPPORT_ID = 'admin_support_user';

type Message = {
  id?: string;
  role: 'user' | 'model';
  content: string;
  timestamp?: Timestamp | null;
  senderName?: string;
  translatedText?: string;
};

export function ParentChatLayout() {
  const searchParams = useSearchParams();
  const schoolId = searchParams.get('schoolId');
  const { user } = useAuth();

  const [messages, setMessages] = React.useState<Message[]>([]);
  const [conversationId, setConversationId] = React.useState<string | null>(null);
  const [chatState, setChatState] = React.useState<'ai' | 'human'>('ai');
  const [input, setInput] = React.useState("");
  const [isSending, setIsSending] = React.useState(false);
  const { toast } = useToast();
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  React.useEffect(() => {
    scrollToBottom();
  }, [messages]);

  React.useEffect(() => {
    if (!schoolId || !user) return;

    const convosQuery = query(
      collection(firestore, `schools/${schoolId}/conversations`),
      where('participants', 'array-contains', user.uid),
      orderBy('timestamp', 'desc'),
      limit(1)
    );
    
    const unsubConvos = onSnapshot(convosQuery, 
      (querySnapshot) => {
        if (!querySnapshot.empty) {
            const convoDoc = querySnapshot.docs[0];
            setConversationId(convoDoc.id);
            setChatState('human');
        }
      },
      (error) => {
        console.error("Error fetching conversations:", error);
      }
    );

    return () => unsubConvos();
  }, [schoolId, user]);

  React.useEffect(() => {
    if (!conversationId || !schoolId || !user) return;

    const messagesQuery = query(
      collection(firestore, `schools/${schoolId}/conversations`, conversationId, 'messages'),
      orderBy('timestamp', 'asc')
    );

    const unsubscribe = onSnapshot(messagesQuery, (querySnapshot) => {
        const convoMessages = querySnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                role: data.sender === user.uid ? 'user' : 'model',
                content: data.text,
                timestamp: data.timestamp,
                senderName: data.senderName
            } as Message;
        });
        setMessages(convoMessages);
    });

    return () => unsubscribe();
  }, [conversationId, schoolId, user]);

  const createConversation = async () => {
    if (!schoolId || !user) return null;
    const newConvoRef = doc(collection(firestore, `schools/${schoolId}/conversations`));
    const newConversation = {
      id: newConvoRef.id,
      name: user.displayName || 'Parent',
      avatar: user.photoURL || `https://picsum.photos/seed/${user.uid}/100`,
      lastMessage: 'Conversation started.',
      timestamp: serverTimestamp(),
      participants: [user.uid, ADMIN_SUPPORT_ID].sort(),
      userRole: 'Parent',
      unread: true,
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
           unread: true,
       });
    }
  };

  const handleSendMessage = async () => {
    if ((input.trim() === '') || !schoolId || !user) return;
    setIsSending(true);

    const userMessage: Message = {
        role: 'user',
        content: input,
        timestamp: Timestamp.now(),
        senderName: user.displayName || 'Parent'
    };

    if (chatState === 'ai') {
        setMessages(prev => [...prev, userMessage]);
        const historyForAI = [...messages, userMessage].map(m => ({ role: m.role, content: m.content }));
        const result = await supportChatbot({ history: historyForAI });
        const aiResponse: Message = {
            role: 'model',
            content: result.response,
            timestamp: Timestamp.now(),
            senderName: 'AI Assistant',
        };
        setMessages(prev => [...prev, aiResponse]);
    } else {
        let currentConvoId = conversationId;
        if (!currentConvoId) {
            currentConvoId = await createConversation();
        }

        if (currentConvoId) {
            await addDoc(collection(firestore, `schools/${schoolId}/conversations`, currentConvoId, 'messages'), {
                sender: user.uid,
                text: input,
                timestamp: serverTimestamp(),
                senderName: user.displayName || 'Parent'
            });

            await updateDoc(doc(firestore, `schools/${schoolId}/conversations`, currentConvoId), {
                lastMessage: input,
                timestamp: serverTimestamp(),
                unread: true,
                lastMessageSender: user.uid,
            });
        }
    }

    setInput('');
    setIsSending(false);
  };
  
  const handleQuickReply = (text: string) => {
    setInput(text);
  }

  const isSender = (message: Message) => message.role === 'user';

  return (
    <div className="flex h-full flex-col">
        <div className="flex-shrink-0 p-4 border-b border-slate-700/50">
            <h2 className="text-xl font-bold font-headline flex items-center gap-2 text-slate-100"><MessageCircle className="h-6 w-6 text-primary"/>Support Chat</h2>
            <p className="text-sm text-slate-400 mt-1">
                {chatState === 'ai' ? 'Chatting with our AI Assistant' : 'Chatting with an Administrator'}
            </p>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, index) => {
                const isUserSender = isSender(msg);
                return (
                <div key={msg.id || index} className={cn("flex items-end gap-2", isUserSender ? 'justify-end' : 'justify-start')}>
                    {!isUserSender && (<Avatar className="h-8 w-8"><AvatarImage /><AvatarFallback><Wand2 /></AvatarFallback></Avatar>)}
                    <div className="group relative max-w-xs lg:max-w-md">
                    <div className={cn("rounded-2xl p-3 text-sm shadow-sm", isUserSender ? 'bg-primary text-primary-foreground rounded-br-none' : 'bg-slate-700 text-slate-200 rounded-bl-none')}>
                        {msg.senderName && <p className="font-semibold text-xs mb-1">{msg.senderName}</p>}
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                        <div className={cn("text-xs mt-2 flex items-center gap-2", isUserSender ? 'text-primary-foreground/70' : 'text-slate-400')}>
                            <span>{msg.timestamp?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                    </div>
                    </div>
                    {isUserSender && (<Avatar className="h-8 w-8"><AvatarImage src={user?.photoURL || ""} /><AvatarFallback><User/></AvatarFallback></Avatar>)}
                </div>
                );
            })}
            <div ref={messagesEndRef} />
        </div>
        
        <div className="px-4 pb-2 h-6">
            {/* Logic to show typing indicator would go here */}
        </div>

        {chatState === 'ai' && (
            <div className="p-2 border-t border-slate-700/50 text-center">
            <Button variant="link" onClick={escalateToHuman}>
                <ShieldCheck className="mr-2 h-4 w-4" /> Speak to an Administrator
            </Button>
            </div>
        )}

        <div className="flex-shrink-0 p-4 border-t border-slate-700/50 space-y-2">
            <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => handleQuickReply('OK, thanks!')}>OK, thanks!</Button>
                <Button variant="outline" size="sm" onClick={() => handleQuickReply('Can you explain further?')}>Explain further</Button>
            </div>
            <div className="relative">
                <Textarea placeholder="Type a message..." className="pr-12 min-h-[60px] max-h-48 bg-slate-800 border-slate-700 text-slate-200" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }} disabled={isSending} />
                <div className="absolute top-3 right-3 flex items-center gap-1">
                <Button size="icon" disabled={!input.trim() || isSending} onClick={handleSendMessage}>{isSending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}</Button>
                </div>
            </div>
        </div>
    </div>
  );
}
