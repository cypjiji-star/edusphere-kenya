
'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Send, Sparkles, User, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/auth-context';
import { useSearchParams } from 'next/navigation';
import {
  collection,
  onSnapshot,
  query,
  where,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
  getDocs,
} from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { supportChatbot, SupportChatbotInput } from '@/ai/flows/support-chatbot-flow';

type Message = {
  role: 'user' | 'model';
  content: string;
};

const escalationTriggerMessage = "Understood. I'm escalating your request to a human administrator who will get back to you shortly.";

export function AiChat() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const schoolId = searchParams.get('schoolId');
  const [chatId, setChatId] = React.useState<string | null>(null);
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [input, setInput] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!user || !schoolId) return;

    // Find an existing chat or create a new one
    const q = query(
      collection(firestore, `schools/${schoolId}/support-chats`),
      where('userId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const chatDoc = snapshot.docs[0];
        setChatId(chatDoc.id);
        setMessages(chatDoc.data().messages || []);
      } else {
        // No existing chat, state is already reset
        setChatId(null);
        setMessages([]);
      }
    });

    return () => unsubscribe();
  }, [user, schoolId]);

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading || !user || !schoolId) return;

    const userMessage: Message = { role: 'user', content: input };
    const newMessages: Message[] = [...messages, userMessage];

    setInput('');
    setMessages(newMessages);
    setIsLoading(true);

    let currentChatId = chatId;

    try {
      // Create chat document if it doesn't exist
      if (!currentChatId) {
        const docRef = await addDoc(collection(firestore, `schools/${schoolId}/support-chats`), {
          userId: user.uid,
          userName: user.displayName || 'User',
          userAvatar: user.photoURL || '',
          lastMessage: input,
          lastUpdate: serverTimestamp(),
          isEscalated: false,
          messages: newMessages,
        });
        currentChatId = docRef.id;
        setChatId(docRef.id);
      }

      // Generate AI response
      const aiInput: SupportChatbotInput = {
        history: newMessages.filter((m) => m.role === 'user' || m.role === 'model'),
      };
      const result = await supportChatbot(aiInput);

      if (result.response) {
        const modelMessage: Message = { role: 'model', content: result.response };
        const finalMessages = [...newMessages, modelMessage];

        const isEscalated = result.response === escalationTriggerMessage;

        // Update the chat document
        await updateDoc(doc(firestore, `schools/${schoolId}/support-chats`, currentChatId!), {
          messages: finalMessages,
          lastMessage: result.response,
          lastUpdate: serverTimestamp(),
          isEscalated: isEscalated,
        });
      }
    } catch (error) {
      console.error('Error in chat:', error);
      // Optionally show an error message to the user
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {messages.map((message, index) => {
            const isUser = message.role === 'user';
            return (
              <div
                key={index}
                className={cn('flex items-end gap-2', isUser ? 'justify-end' : 'justify-start')}
              >
                {!isUser && (
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>
                      <Sparkles />
                    </AvatarFallback>
                  </Avatar>
                )}
                <div
                  className={cn(
                    'max-w-[80%] rounded-lg p-3 text-sm shadow-md',
                    isUser
                      ? 'bg-primary text-primary-foreground rounded-br-none'
                      : 'bg-muted rounded-bl-none'
                  )}
                >
                  <p>{message.content}</p>
                </div>
                {isUser && (
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>
                      <User />
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            );
          })}
          {isLoading && (
             <div className="flex items-end gap-2 justify-start">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>
                      <Sparkles />
                    </AvatarFallback>
                  </Avatar>
                  <div className="bg-muted rounded-lg p-3 text-sm max-w-[80%] shadow-md">
                     <Loader2 className="h-5 w-5 animate-spin"/>
                  </div>
              </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>
      <div className="border-t p-4">
        <div className="relative">
          <Input
            placeholder="Type your message..."
            className="pr-12"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            disabled={isLoading}
          />
          <Button
            size="icon"
            className="absolute top-1/2 right-1 -translate-y-1/2 h-8 w-8"
            onClick={handleSendMessage}
            disabled={isLoading || !input.trim()}
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground text-center mt-2">
          Can't find an answer? Type "talk to an admin" to connect with a human.
        </p>
      </div>
    </div>
  );
}
