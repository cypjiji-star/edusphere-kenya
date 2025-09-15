
'use client';

import * as React from 'react';
import {
  MessageCircle,
  Search,
  Send,
  Paperclip,
  CheckCircle2,
  Users,
  User,
  Loader2,
  X,
  Clock,
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
  writeBatch,
  where,
  getDocs,
} from 'firebase/firestore';
import { useSearchParams } from 'next/navigation';

import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/ui/avatar';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/auth-context';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';

const ADMIN_SUPPORT_ID = 'admin_support_user'; // A known ID for the admin/support account

type Conversation = {
  id: string;
  name: string;
  avatar: string;
  icon: string;
  lastMessage: string;
  timestamp: Timestamp;
  unread: boolean;
  participants: string[];
  lastMessageSender?: string;
};

type Message = { 
  id?: string;
  sender: string;
  text: string; 
  timestamp: Timestamp | null;
  read?: boolean; 
  senderName?: string;
  translatedText?: string;
  attachmentUrl?: string;
  scheduledAt?: Timestamp;
};

export function TeacherChatLayout() {
  const searchParams = useSearchParams();
  const schoolId = searchParams.get('schoolId');
  const { user } = useAuth();
  const [conversation, setConversation] = React.useState<Conversation | null>(null);
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [message, setMessage] = React.useState("");
  const [isSending, setIsSending] = React.useState(false);
  const [attachment, setAttachment] = React.useState<File | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const [scheduledDate, setScheduledDate] = React.useState<Date | undefined>();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  React.useEffect(() => {
    scrollToBottom();
  }, [messages]);

  React.useEffect(() => {
    if (!schoolId || !user) return;

    // Find the conversation between the teacher and the admin support.
    const convosQuery = query(
      collection(firestore, `schools/${schoolId}/conversations`), 
      where('participants', '==', [user.uid, ADMIN_SUPPORT_ID].sort())
    );
    
    const unsubConvos = onSnapshot(convosQuery, 
      (querySnapshot) => {
        if (!querySnapshot.empty) {
          const convoDoc = querySnapshot.docs[0];
          setConversation({ id: convoDoc.id, ...convoDoc.data() } as Conversation);
        } else {
            // No existing conversation, set a placeholder to allow creating one.
            setConversation({
                id: `${user.uid}_${ADMIN_SUPPORT_ID}`, // Temp ID
                name: "Admin Support",
                avatar: "https://picsum.photos/seed/admin-support/100",
                icon: "ShieldCheck",
                lastMessage: "Start a new conversation with support.",
                timestamp: Timestamp.now(),
                unread: false,
                participants: [user.uid, ADMIN_SUPPORT_ID].sort(),
            });
        }
      }
    );

    return () => unsubConvos();
  }, [schoolId, user]);

  React.useEffect(() => {
    if (!conversation || conversation.id.includes('_') || !schoolId || !user) {
        setMessages([]);
        return;
    };

    const messagesQuery = query(
      collection(firestore, `schools/${schoolId}/conversations`, conversation.id, 'messages'),
      orderBy('timestamp', 'asc')
    );

    const unsubscribe = onSnapshot(messagesQuery, (querySnapshot) => {
        const convoMessages = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message));
        setMessages(convoMessages);
        const unreadMessages = convoMessages.filter(msg => msg.sender !== user.uid && !msg.read);
        if (unreadMessages.length > 0) {
          markMessagesAsRead(unreadMessages);
        }
      });

    return () => unsubscribe();
  }, [conversation, schoolId, user]);

  const markMessagesAsRead = async (messagesToMark: Message[]) => {
    if (!schoolId || !conversation || !user) return;
    try {
      const batch = writeBatch(firestore);
      messagesToMark.forEach(msg => {
        if (msg.id) {
          const messageRef = doc(firestore, `schools/${schoolId}/conversations`, conversation.id, 'messages', msg.id);
          batch.update(messageRef, { read: true });
        }
      });
      const convoRef = doc(firestore, `schools/${schoolId}/conversations`, conversation.id);
      batch.update(convoRef, { unread: false });
      await batch.commit();
    } catch (error) { console.error("Error marking messages as read:", error); }
  };

  const handleSendMessage = async () => {
    if ((message.trim() === '' && !attachment) || !conversation || !schoolId || !user) return;
    setIsSending(true);
    let messageText = message.trim();
    let attachmentUrl = '';
    
    // Create conversation if it doesn't exist yet
    let convoRef;
    if (conversation.id.includes('_')) { // It's a temporary ID
        convoRef = doc(collection(firestore, `schools/${schoolId}/conversations`));
        await setDoc(convoRef, {
            ...conversation,
            id: convoRef.id,
            timestamp: serverTimestamp(),
        });
        setConversation({ ...conversation, id: convoRef.id }); // Update state with real ID
    } else {
        convoRef = doc(firestore, `schools/${schoolId}/conversations`, conversation.id);
    }
    
    if (attachment) {
      try {
        const storageRef = ref(storage, `schools/${schoolId}/chat-attachments/${attachment.name}_${Date.now()}`);
        const snapshot = await uploadBytes(storageRef, attachment);
        attachmentUrl = await getDownloadURL(snapshot.ref);
        messageText += messageText ? `\n\n📎 [Attachment](${attachmentUrl})` : `📎 [Attachment](${attachmentUrl})`;
      } catch (error) {
        setIsSending(false);
        toast({ variant: "destructive", title: "Upload Failed", description: "Could not upload your file." });
        return;
      }
    }
    try {
      const newMessage: Omit<Message, 'id'> & { timestamp: any, scheduledAt?: any } = {
        sender: user.uid,
        text: messageText,
        timestamp: scheduledDate ? null : serverTimestamp(),
        read: false,
        senderName: user.displayName || 'Teacher',
        ...(attachmentUrl && { attachmentUrl }),
        ...(scheduledDate && { scheduledAt: Timestamp.fromDate(scheduledDate) }),
      };
      await addDoc(collection(convoRef, 'messages'), newMessage);
      if (!scheduledDate) {
        await updateDoc(convoRef, { lastMessage: messageText.substring(0, 100), timestamp: serverTimestamp(), lastMessageSender: user.uid, unread: true });
      }
      setMessage(''); setAttachment(null); setScheduledDate(undefined);
      toast({ title: scheduledDate ? 'Message Scheduled!' : 'Message Sent!', description: scheduledDate ? `Your message will be sent on ${format(scheduledDate, 'PPP, p')}.` : 'Your message has been delivered.' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Action Failed' });
    } finally {
      setIsSending(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      if (event.target.files[0].size > 5 * 1024 * 1024) { toast({ variant: "destructive", title: "File Too Large", description: "Please select a file smaller than 5MB." }); return; }
      setAttachment(event.target.files[0]);
    }
  };
  
  const handleAttachmentClick = () => { fileInputRef.current?.click(); };
  
  const getIconComponent = (iconName: string) => {
    if (iconName === 'User') return User;
    if (iconName === 'Users') return Users;
    return MessageCircle;
  };
  
  const isSender = (message: Message) => message.sender === user?.uid;

  return (
    <div className="z-10 h-full w-full bg-background rounded-lg overflow-hidden">
      <div className="flex h-full">
        {/* Simplified Sidebar */}
        <div className="flex flex-col w-full md:w-[320px] border-r">
          <div className="flex-shrink-0 p-4 border-b">
            <h2 className="text-xl font-bold font-headline flex items-center gap-2"><MessageCircle className="h-6 w-6 text-primary"/>Support Chat</h2>
            <p className="text-sm text-muted-foreground mt-1">Directly message the school administration.</p>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {conversation && (
                <button className={cn('flex w-full items-start gap-3 rounded-lg p-3 text-left transition-colors bg-muted')}>
                    <Avatar className="h-10 w-10"><AvatarImage src={conversation.avatar} alt={conversation.name} /><AvatarFallback>S</AvatarFallback></Avatar>
                    <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{conversation.name}</p>
                    <p className="text-sm text-muted-foreground truncate">{conversation.lastMessage}</p>
                    </div>
                </button>
            )}
          </div>
        </div>

        {/* Main Chat Window */}
        <div className="flex flex-col w-full h-full">
          {conversation ? (
            <>
              <div className="flex-shrink-0 p-4 border-b flex items-center justify-between">
                <div className="flex items-center gap-3"><Avatar className="h-10 w-10"><AvatarImage src={conversation.avatar} alt={conversation.name} /><AvatarFallback>S</AvatarFallback></Avatar><div><p className="font-semibold">{conversation.name}</p></div></div>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg, index) => {
                  const isUserSender = isSender(msg);
                  return (
                    <div key={msg.id || index} className={cn("flex items-end gap-2", isUserSender ? 'justify-end' : 'justify-start')}>
                      {!isUserSender && (<Avatar className="h-8 w-8"><AvatarImage src={conversation.avatar}/><AvatarFallback>S</AvatarFallback></Avatar>)}
                      <div className="group relative max-w-xs lg:max-w-md">
                        <div className={cn("rounded-2xl p-3 text-sm shadow-sm", isUserSender ? 'bg-primary text-primary-foreground rounded-br-none' : 'bg-secondary rounded-bl-none')}>
                          <p className="whitespace-pre-wrap">{msg.text}</p>
                          {msg.attachmentUrl && (<a href={msg.attachmentUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center text-sm underline"><Paperclip className="h-3 w-3 mr-1" />View Attachment</a>)}
                          <div className={cn("text-xs mt-2 flex items-center gap-2", isUserSender ? 'text-primary-foreground/70' : 'text-muted-foreground')}>
                            <span>{msg.timestamp?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            {isUserSender && msg.read && <CheckCircle2 className="h-3 w-3" />}
                          </div>
                        </div>
                      </div>
                      {isUserSender && (<Avatar className="h-8 w-8"><AvatarImage src={user?.photoURL || "https://picsum.photos/seed/teacher-avatar/100"} /><AvatarFallback>{user?.displayName?.charAt(0) || 'T'}</AvatarFallback></Avatar>)}
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
              <div className="flex-shrink-0 p-4 border-t space-y-2">
                {attachment && (<div className="flex items-center gap-2 p-2 rounded-md bg-muted text-sm text-muted-foreground"><Paperclip className="h-4 w-4" /><span className="flex-1 truncate">{attachment.name}</span><Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setAttachment(null)}><X className="h-4 w-4" /></Button></div>)}
                {scheduledDate && (<div className="flex items-center gap-2 p-2 rounded-md bg-blue-500/10 text-sm text-blue-800"><Clock className="h-4 w-4" /><span className="flex-1 truncate">Scheduled for: {format(scheduledDate, 'PPP, p')}</span><Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setScheduledDate(undefined)}><X className="h-4 w-4" /></Button></div>)}
                <div className="relative">
                  <Textarea placeholder="Type a message to admin support..." className="pr-24 min-h-[60px] max-h-48" value={message} onChange={(e) => setMessage(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }} disabled={isSending} />
                  <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*, .pdf, .doc, .docx, .txt" />
                  <div className="absolute top-3 right-3 flex items-center gap-1">
                    <TooltipProvider>
                      <Tooltip><TooltipTrigger asChild><Button size="icon" variant="ghost" onClick={handleAttachmentClick} disabled={isSending}><Paperclip className="h-5 w-5" /></Button></TooltipTrigger><TooltipContent><p>Attach file (max 5MB)</p></TooltipContent></Tooltip>
                      <Popover><PopoverTrigger asChild><Button size="icon" variant="ghost" disabled={isSending}><Clock className="h-5 w-5"/></Button></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={scheduledDate} onSelect={setScheduledDate} initialFocus disabled={(date) => date < new Date()} /></PopoverContent></Popover>
                    </TooltipProvider>
                    <Button size="icon" disabled={(!message.trim() && !attachment) || isSending} onClick={handleSendMessage}>{isSending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}</Button>
                  </div>
                </div>
              </div>
            </>
          ) : (<div className="flex-col items-center justify-center h-full text-muted-foreground hidden md:flex"><MessageCircle className="h-16 w-16" /><p className="mt-4 text-lg font-semibold">Contact Admin Support</p><p>Your messages to the administration will appear here.</p></div>)}
        </div>
      </div>
    </div>
  );
}
