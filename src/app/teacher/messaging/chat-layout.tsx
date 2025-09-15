
'use client';

import * as React from 'react';
import {
  MessageCircle,
  Search,
  Send,
  PlusCircle,
  Trash2,
  Paperclip,
  CheckCircle2,
  Languages,
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
  deleteDoc,
  updateDoc,
  where,
  getDocs,
  writeBatch,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { translateText } from '@/ai/flows/translate-text';
import { useAuth } from '@/context/auth-context';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';

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

type SelectableContact = {
  id: string;
  name: string;
  avatar: string;
  icon: React.ElementType;
  role: string;
}

type TranslationLanguage = {
  code: string;
  name: string;
}

export function TeacherChatLayout() {
  const searchParams = useSearchParams();
  const schoolId = searchParams.get('schoolId');
  const { user } = useAuth();
  const [conversations, setConversations] = React.useState<Conversation[]>([]);
  const [messages, setMessages] = React.useState<Record<string, Message[]>>({});
  const [selectedConvo, setSelectedConvo] = React.useState<Conversation | null>(null);
  const [message, setMessage] = React.useState("");
  const [searchTerm, setSearchTerm] = React.useState('');
  const [isTranslating, setIsTranslating] = React.useState(false);
  const [isSending, setIsSending] = React.useState(false);
  const [attachment, setAttachment] = React.useState<File | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [newContactOptions, setNewContactOptions] = React.useState<SelectableContact[]>([]);
  const [targetLanguage, setTargetLanguage] = React.useState('sw');
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const [scheduledDate, setScheduledDate] = React.useState<Date | undefined>();

  const translationLanguages: TranslationLanguage[] = [
    { code: 'sw', name: 'Swahili' },
    { code: 'en', name: 'English' },
    { code: 'fr', name: 'French' },
    { code: 'es', name: 'Spanish' },
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  React.useEffect(() => {
    scrollToBottom();
  }, [messages, selectedConvo]);

  React.useEffect(() => {
    if (!schoolId || !user) return;

    const convosQuery = query(
      collection(firestore, `schools/${schoolId}/conversations`), 
      where('participants', 'array-contains', user.uid),
      orderBy('timestamp', 'desc')
    );
    
    const unsubConvos = onSnapshot(convosQuery, 
      (querySnapshot) => {
        const convos = querySnapshot.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data() 
        } as Conversation));
        setConversations(convos);
        
        if (!selectedConvo && convos.length > 0) {
          setSelectedConvo(convos[0]);
        }
      },
      (error) => {
        console.error("Error fetching conversations:", error);
      }
    );

    const fetchContacts = async () => {
      if (!user) return;
      const classesQuery = query(collection(firestore, `schools/${schoolId}/classes`), where('teacherId', '==', user.uid));
      const classesSnapshot = await getDocs(classesQuery);
      if (classesSnapshot.empty) return;
      const classIds = classesSnapshot.docs.map(doc => doc.id);
      
      const studentsQuery = query(collection(firestore, `schools/${schoolId}/students`), where('classId', 'in', classIds));
      const studentsSnapshot = await getDocs(studentsQuery);
      if (studentsSnapshot.empty) return;
      
      const parentIds = new Set<string>();
      studentsSnapshot.forEach(doc => { if(doc.data().parentId) { parentIds.add(doc.data().parentId) } });
      if (parentIds.size === 0) return;
      
      const parentsQuery = query(collection(firestore, `schools/${schoolId}/parents`), where('id', 'in', Array.from(parentIds)));
      const parentsSnapshot = await getDocs(parentsQuery);
      
      const parentContacts = parentsSnapshot.docs.map(doc => ({ id: doc.id, name: `${doc.data().name} (Parent)`, avatar: doc.data().avatarUrl || '', icon: User, role: 'Parent' }));
      setNewContactOptions(parentContacts);
    };
    fetchContacts();

    return () => unsubConvos();
  }, [schoolId, user, selectedConvo]);

  React.useEffect(() => {
    if (!selectedConvo || !schoolId || !user) return;

    const messagesQuery = query(
      collection(firestore, `schools/${schoolId}/conversations`, selectedConvo.id, 'messages'),
      orderBy('timestamp', 'asc')
    );

    const unsubscribe = onSnapshot(messagesQuery, (querySnapshot) => {
        const convoMessages = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message));
        setMessages(prev => ({ ...prev, [selectedConvo.id]: convoMessages, }));
        const unreadMessages = convoMessages.filter(msg => msg.sender !== user.uid && !msg.read);
        if (unreadMessages.length > 0) {
          markMessagesAsRead(unreadMessages);
        }
      });

    return () => unsubscribe();
  }, [selectedConvo, schoolId, user]);

  const markMessagesAsRead = async (messagesToMark: Message[]) => {
    if (!schoolId || !selectedConvo || !user) return;
    try {
      const batch = writeBatch(firestore);
      messagesToMark.forEach(msg => {
        if (msg.id) {
          const messageRef = doc(firestore, `schools/${schoolId}/conversations`, selectedConvo.id, 'messages', msg.id);
          batch.update(messageRef, { read: true });
        }
      });
      const convoRef = doc(firestore, `schools/${schoolId}/conversations`, selectedConvo.id);
      batch.update(convoRef, { unread: false });
      await batch.commit();
    } catch (error) { console.error("Error marking messages as read:", error); }
  };

  const handleSendMessage = async () => {
    if ((message.trim() === '' && !attachment) || !selectedConvo || !schoolId || !user) return;
    setIsSending(true);
    let messageText = message.trim();
    let attachmentUrl = '';
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
      await addDoc(collection(firestore, `schools/${schoolId}/conversations`, selectedConvo.id, 'messages'), newMessage);
      if (!scheduledDate) {
        const convoRef = doc(firestore, `schools/${schoolId}/conversations`, selectedConvo.id);
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
  
  const handleCreateConversation = async (contactId: string) => {
    if (!schoolId || !user) return;
    const contact = newContactOptions.find(c => c.id === contactId);
    if (!contact) return;
    try {
      const existingConvoQuery = query(collection(firestore, `schools/${schoolId}/conversations`), where('participants', '==', [user.uid, contactId].sort()));
      const existingConvoSnapshot = await getDocs(existingConvoQuery);
      if (!existingConvoSnapshot.empty) { setSelectedConvo({ id: existingConvoSnapshot.docs[0].id, ...existingConvoSnapshot.docs[0].data() } as Conversation); return; }
      const newConvoData = { name: contact.name, avatar: contact.avatar || `https://picsum.photos/seed/${contact.id}/100`, icon: 'User', lastMessage: 'New conversation started.', timestamp: serverTimestamp(), unread: false, participants: [user.uid, contactId].sort(), lastMessageSender: user.uid };
      const docRef = await addDoc(collection(firestore, `schools/${schoolId}/conversations`), newConvoData);
      setSelectedConvo({ id: docRef.id, ...newConvoData } as Conversation);
    } catch (error) { toast({ variant: 'destructive', title: 'Creation Failed' }); }
  };
  
  const filteredConversations = conversations.filter(convo => convo.name.toLowerCase().includes(searchTerm.toLowerCase()) || convo.lastMessage.toLowerCase().includes(searchTerm.toLowerCase()));
  const isSender = (message: Message) => message.sender === user?.uid;

  return (
    <div className="z-10 h-full w-full bg-background rounded-lg overflow-hidden">
      <div className="flex h-full">
        <div className="flex flex-col w-full md:w-[320px] border-r">
          <div className="flex-shrink-0 p-4 border-b">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold font-headline flex items-center gap-2"><MessageCircle className="h-6 w-6 text-primary"/>Messenger</h2>
              <Dialog>
                <DialogTrigger asChild><Button variant="ghost" size="icon"><PlusCircle className="h-5 w-5" /></Button></DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>New Conversation</DialogTitle><DialogDescription>Select a parent to start a new chat.</DialogDescription></DialogHeader>
                  <div className="py-4">
                    <Label htmlFor="new-chat-recipient">Recipient</Label>
                    <Select onValueChange={handleCreateConversation}>
                      <SelectTrigger id="new-chat-recipient"><SelectValue placeholder="Select a parent..." /></SelectTrigger>
                      <SelectContent>
                        {newContactOptions.map(contact => (
                          <SelectItem key={contact.id} value={contact.id}>
                            <div className="flex items-center gap-2">
                              <Avatar className="h-6 w-6"><AvatarImage src={contact.avatar} /><AvatarFallback>{contact.name.charAt(0)}</AvatarFallback></Avatar>
                              <span>{contact.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <DialogFooter><DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose></DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
            <div className="relative mt-4">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search messages or parents..." className="pl-8" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            <div className="p-2 space-y-1">
              {filteredConversations.map((convo) => (
                <button key={convo.id} className={cn('flex w-full items-start gap-3 rounded-lg p-3 text-left transition-colors hover:bg-muted/50', selectedConvo?.id === convo.id && 'bg-muted')} onClick={() => setSelectedConvo(convo)}>
                  <Avatar className="h-10 w-10"><AvatarImage src={convo.avatar} alt={convo.name} /><AvatarFallback>{convo.name.charAt(0)}</AvatarFallback></Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between"><p className="font-semibold truncate">{convo.name}</p><p className="text-xs text-muted-foreground whitespace-nowrap">{convo.timestamp?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p></div>
                    <p className="text-sm text-muted-foreground truncate">{convo.lastMessageSender === user?.uid ? 'You: ' : ''}{convo.lastMessage}</p>
                  </div>
                  {convo.unread && <div className="h-2.5 w-2.5 rounded-full bg-primary mt-1 self-center"></div>}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="flex flex-col w-full h-full">
          {selectedConvo ? (
            <>
              <div className="flex-shrink-0 p-4 border-b flex items-center justify-between">
                <div className="flex items-center gap-3"><Avatar className="h-10 w-10"><AvatarImage src={selectedConvo.avatar} alt={selectedConvo.name} /><AvatarFallback>{selectedConvo.name.charAt(0)}</AvatarFallback></Avatar><div><p className="font-semibold">{selectedConvo.name}</p></div></div>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {(messages[selectedConvo.id] || []).map((msg, index) => (
                  <div key={msg.id || index} className={cn("flex items-end gap-2", isSender(msg) ? 'justify-end' : 'justify-start')}>
                    {!isSender(msg) && (<Avatar className="h-8 w-8"><AvatarImage src={selectedConvo.avatar}/><AvatarFallback>{selectedConvo.name.charAt(0)}</AvatarFallback></Avatar>)}
                    <div className="group relative max-w-xs lg:max-w-md">
                      <div className={cn("rounded-2xl p-3 text-sm shadow-sm", isSender(msg) ? 'bg-primary text-primary-foreground rounded-br-none' : 'bg-secondary rounded-bl-none')}>
                        <p className="whitespace-pre-wrap">{msg.text}</p>
                        {msg.attachmentUrl && (<a href={msg.attachmentUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center text-sm underline"><Paperclip className="h-3 w-3 mr-1" />View Attachment</a>)}
                        <div className={cn("text-xs mt-2 flex items-center gap-2", isSender(msg) ? 'text-primary-foreground/70' : 'text-muted-foreground')}>
                          <span>{msg.timestamp?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          {isSender(msg) && msg.read && <CheckCircle2 className="h-3 w-3" />}
                        </div>
                      </div>
                    </div>
                    {isSender(msg) && (<Avatar className="h-8 w-8"><AvatarImage src={user?.photoURL || "https://picsum.photos/seed/teacher-avatar/100"} /><AvatarFallback>{user?.displayName?.charAt(0) || 'T'}</AvatarFallback></Avatar>)}
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
              <div className="flex-shrink-0 p-4 border-t space-y-2">
                {attachment && (<div className="flex items-center gap-2 p-2 rounded-md bg-muted text-sm text-muted-foreground"><Paperclip className="h-4 w-4" /><span className="flex-1 truncate">{attachment.name}</span><Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setAttachment(null)}><X className="h-4 w-4" /></Button></div>)}
                {scheduledDate && (<div className="flex items-center gap-2 p-2 rounded-md bg-blue-500/10 text-sm text-blue-800"><Clock className="h-4 w-4" /><span className="flex-1 truncate">Scheduled for: {format(scheduledDate, 'PPP, p')}</span><Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setScheduledDate(undefined)}><X className="h-4 w-4" /></Button></div>)}
                <div className="relative">
                  <Textarea placeholder="Type a message..." className="pr-24 min-h-[60px] max-h-48" value={message} onChange={(e) => setMessage(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }} disabled={isSending} />
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
          ) : (<div className="flex-col items-center justify-center h-full text-muted-foreground hidden md:flex"><MessageCircle className="h-16 w-16" /><p className="mt-4 text-lg font-semibold">Select a conversation</p><p>Your messages will appear here.</p></div>)}
        </div>
      </div>
    </div>
  );
}
