
'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Send, Sparkles, User, Loader2, MessageSquare } from 'lucide-react';
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
  getDoc,
  getDocs,
} from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { supportChatbot, SupportChatbotInput } from '@/ai/flows/support-chatbot-flow';

type Message = {
  role: 'user' | 'model' | 'admin';
  content: string;
};

const escalationTriggerMessage = "Understood. I'm escalating your request to a human administrator who will get back to you shortly.";

async function getUserDisplayName(schoolId: string, userId: string): Promise<string> {
    const collectionsToSearch = ['admins', 'teachers'];
    for (const collectionName of collectionsToSearch) {
        try {
            const userDocRef = doc(firestore, 'schools', schoolId, collectionName, userId);
            const userDocSnap = await getDoc(userDocRef);
            if (userDocSnap.exists()) {
                return userDocSnap.data().name || 'User';
            }
        } catch (e) {
            console.error(`Could not find user in '${collectionName}' collection`, e);
        }
    }
     try {
        const parentQuery = query(collection(firestore, `schools/${schoolId}/students`), where('parentId', '==', userId));
        const parentSnap = await getDocs(parentQuery);
        if (!parentSnap.empty) {
            return parentSnap.docs[0].data().parentName || 'Parent';
        }
    } catch(e) {
        console.error("Could not find parent user details", e);
    }

    return 'User';
}


export function AiChat() {
  const { user, role } = useAuth();
  const searchParams = useSearchParams();
  const schoolId = searchParams.get('schoolId');
  const [chatId, setChatId] = React.useState<string | null>(null);
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [isEscalated, setIsEscalated] = React.useState(false);
  const [input, setInput] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  const hasAdminReplied = React.useMemo(() => messages.some(m => m.role === 'admin'), [messages]);

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
        setIsEscalated(chatDoc.data().isEscalated || false);
      } else {
        // No existing chat, state is already reset
        setChatId(null);
        setMessages([]);
        setIsEscalated(false);
      }
    });

    return () => unsubscribe();
  }, [user, schoolId]);

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (messageContent: string) => {
    if (!messageContent.trim() || isLoading || !user || !schoolId || !role) return;

    const userMessage: Message = { role: 'user', content: messageContent };
    const newMessages: Message[] = [...messages, userMessage];

    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    let currentChatId = chatId;

    try {
      // Create chat document if it doesn't exist
      if (!currentChatId) {
        const schoolDoc = await getDoc(doc(firestore, 'schools', schoolId));
        const schoolName = schoolDoc.exists() ? schoolDoc.data().name : 'Unknown School';
        const displayName = await getUserDisplayName(schoolId, user.uid);
        const docRef = await addDoc(collection(firestore, `schools/${schoolId}/support-chats`), {
          userId: user.uid,
          userName: `${displayName} (${schoolName})`,
          userAvatar: user.photoURL || '',
          lastMessage: messageContent,
          lastUpdate: serverTimestamp(),
          isEscalated: false,
          messages: newMessages,
        });
        currentChatId = docRef.id;
        setChatId(docRef.id);
      } else {
         await updateDoc(doc(firestore, `schools/${schoolId}/support-chats`, currentChatId), {
            messages: newMessages,
            lastMessage: messageContent,
            lastUpdate: serverTimestamp(),
        });
      }
      
      // If an admin has ever replied, do not call the AI. Just save the user's message for the admin.
      if (hasAdminReplied) {
        setIsLoading(false);
        return;
      }
      
      // Generate AI response if not escalated
      if (!isEscalated) {
        const aiInput: SupportChatbotInput = {
            history: newMessages.filter((m) => m.role === 'user' || m.role === 'model'),
        };
        const result = await supportChatbot(aiInput);

        if (result.response) {
            const modelMessage: Message = { role: 'model', content: result.response };
            const finalMessages = [...newMessages, modelMessage];
            
            const escalate = result.response === escalationTriggerMessage;

            // Update the chat document with AI response
            await updateDoc(doc(firestore, `schools/${schoolId}/support-chats`, currentChatId!), {
            messages: finalMessages,
            lastMessage: result.response,
            lastUpdate: serverTimestamp(),
            isEscalated: escalate,
            });
        }
      }
    } catch (error) {
      console.error('Error in chat:', error);
      // Optionally show an error message to the user
    } finally {
      setIsLoading(false);
    }
  }

  const handleSendMessage = () => {
    sendMessage(input);
  };

  const handleTalkToAdmin = () => {
    // This will trigger the escalation message in the AI flow
    setIsEscalated(true);
    sendMessage("I need to talk to an admin.");
  };

  const canReply = !isEscalated || hasAdminReplied;

  return (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {messages.map((message, index) => {
            const isUser = message.role === 'user';
            const isAdmin = message.role === 'admin';
            const isModel = message.role === 'model';
            
            return (
              <div
                key={index}
                className={cn('flex items-end gap-2', isUser ? 'justify-end' : 'justify-start')}
              >
                {!isUser && (
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>
                      {isAdmin ? 'A' : <Sparkles />}
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
      <div className="border-t p-4 space-y-4">
        {canReply ? (
             <div className="relative">
                <Input
                    placeholder={hasAdminReplied ? "Reply to the admin..." : "Type your message..."}
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
        ) : (
             <div className="text-center text-sm text-muted-foreground p-4 rounded-md bg-muted">
                An administrator will be with you shortly.
            </div>
        )}

        {!hasAdminReplied && (
            <Button
                variant="outline"
                className="w-full"
                onClick={handleTalkToAdmin}
                disabled={isLoading || isEscalated}
            >
                <MessageSquare className="mr-2 h-4 w-4" />
                Talk to an Admin
            </Button>
        )}
      </div>
    </div>
  );
}
