
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
  Languages,
  PlusCircle,
  Filter,
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
  writeBatch,
  where,
  getDocs,
  setDoc,
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
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/auth-context';
import { firestore } from '@/lib/firebase';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
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

type Conversation = {
  id: string;
  name: string;
  avatar: string;
  lastMessage: string;
  timestamp: Timestamp;
  unread: boolean;
  participants: string[];
  lastMessageSender?: string;
  userRole?: 'Teacher' | 'Parent';
};

type Message = {
  id?: string;
  sender: string;
  text: string;
  timestamp: Timestamp | null;
  read?: boolean;
  senderName?: string;
  translatedText?: string;
};

export function AdminChatLayout() {
  const searchParams = useSearchParams();
  const schoolId = searchParams.get('schoolId');
  const { user } = useAuth();
  const [conversations, setConversations] = React.useState<Conversation[]>([]);
  const [messages, setMessages] = React.useState<Record<string, Message[]>>({});
  const [selectedConvo, setSelectedConvo] = React.useState<Conversation | null>(null);
  const [message, setMessage] = React.useState("");
  const [searchTerm, setSearchTerm] = React.useState('');
  const [isSending, setIsSending] = React.useState(false);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  
  const [allUsers, setAllUsers] = React.useState<{id: string, name: string, role: string, class?: string}[]>([]);

  const [statusFilter, setStatusFilter] = React.useState('all');
  const [roleFilter, setRoleFilter] = React.useState('all');

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  React.useEffect(() => {
    scrollToBottom();
  }, [messages, selectedConvo]);
  
   React.useEffect(() => {
    if (!schoolId) return;
    
    const fetchUsers = async () => {
      const usersQuery = query(collection(firestore, `schools/${schoolId}/users`));
      const studentsQuery = query(collection(firestore, `schools/${schoolId}/students`));
      const parentsQuery = query(collection(firestore, `schools/${schoolId}/parents`));

      const [usersSnap, studentsSnap, parentsSnap] = await Promise.all([
        getDocs(usersQuery),
        getDocs(studentsQuery),
        getDocs(parentsQuery),
      ]);

      const combinedUsers = [
        ...usersSnap.docs.map(d => ({ id: d.id, ...d.data() })),
        ...studentsSnap.docs.map(d => ({ id: d.id, ...d.data(), role: 'Student' })),
        ...parentsSnap.docs.map(d => ({ id: d.id, ...d.data(), role: 'Parent' })),
      ].map(u => ({ id: u.id, name: u.name, role: u.role, class: u.class }));

      setAllUsers(combinedUsers as {id: string, name: string, role: string, class?: string}[]);
    }
    fetchUsers();
  }, [schoolId]);


  React.useEffect(() => {
    if (!schoolId || !user) return;

    const convosQuery = query(
      collection(firestore, `schools/${schoolId}/conversations`),
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
        setMessages(prev => ({ ...prev, [selectedConvo.id]: convoMessages }));
        
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
    if ((message.trim() === '') || !selectedConvo || !schoolId || !user) return;
    setIsSending(true);

    try {
      const newMessage: Omit<Message, 'id'> & { timestamp: any } = {
        sender: user.uid,
        text: message.trim(),
        timestamp: serverTimestamp(),
        read: false,
        senderName: user.displayName || 'Admin',
      };
      await addDoc(collection(firestore, `schools/${schoolId}/conversations`, selectedConvo.id, 'messages'), newMessage);
      const convoRef = doc(firestore, `schools/${schoolId}/conversations`, selectedConvo.id);
      await updateDoc(convoRef, { lastMessage: message.trim().substring(0, 100), timestamp: serverTimestamp(), lastMessageSender: user.uid });
      setMessage('');
    } catch (error) {
      toast({ variant: 'destructive', title: 'Action Failed' });
    } finally {
      setIsSending(false);
    }
  };
  
  const filteredConversations = conversations.filter(convo => 
    (convo.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
     convo.lastMessage.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (statusFilter === 'all' || convo.unread === (statusFilter === 'unread')) &&
    (roleFilter === 'all' || convo.userRole === roleFilter)
  );
  
  const isSender = (message: Message) => message.sender === user?.uid;

  return (
    <div className="z-10 h-full w-full bg-[#1A1B1F] text-white rounded-lg overflow-hidden">
      <div className="flex h-full">
        <div className="flex flex-col w-full md:w-[320px] border-r border-slate-700/50 bg-slate-900/50">
          <div className="flex-shrink-0 p-4 border-b border-slate-700/50">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold font-headline flex items-center gap-2 text-slate-100"><MessageCircle className="h-6 w-6 text-primary"/>Support Inbox</h2>
            </div>
            <div className="relative mt-4">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input placeholder="Search messages or users..." className="pl-8 bg-slate-800 border-slate-700 text-slate-200" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
             <div className="mt-4 flex gap-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full bg-slate-800 border-slate-700 text-slate-300">
                        <SelectValue placeholder="Filter status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="unread">Unread</SelectItem>
                        <SelectItem value="read">Read</SelectItem>
                    </SelectContent>
                </Select>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                    <SelectTrigger className="w-full bg-slate-800 border-slate-700 text-slate-300">
                        <SelectValue placeholder="Filter role" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Roles</SelectItem>
                        <SelectItem value="Teacher">Teachers</SelectItem>
                        <SelectItem value="Parent">Parents</SelectItem>
                    </SelectContent>
                </Select>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            <div className="p-2 space-y-1">
              {filteredConversations.map((convo) => (
                  <button key={convo.id} className={cn('flex w-full items-start gap-3 rounded-lg p-3 text-left transition-colors hover:bg-slate-800/60', selectedConvo?.id === convo.id && 'bg-slate-800')} onClick={() => setSelectedConvo(convo)}>
                    <Avatar className="h-10 w-10"><AvatarImage src={convo.avatar} alt={convo.name} /><AvatarFallback><User /></AvatarFallback></Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between"><p className="font-semibold truncate text-slate-100">{convo.name}</p><p className="text-xs text-slate-400 whitespace-nowrap">{convo.timestamp?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p></div>
                      <p className="text-sm text-slate-400 truncate">{convo.lastMessageSender === user?.uid ? 'You: ' : ''}{convo.lastMessage}</p>
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
              <div className="flex-shrink-0 p-4 border-b border-slate-700/50 flex items-center justify-between">
                <div className="flex items-center gap-3"><Avatar className="h-10 w-10"><AvatarImage src={selectedConvo.avatar} alt={selectedConvo.name} /><AvatarFallback><User/></AvatarFallback></Avatar><div><p className="font-semibold text-slate-100">{selectedConvo.name}</p></div></div>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {(messages[selectedConvo.id] || []).map((msg, index) => {
                  const isUserSender = isSender(msg);
                  return (
                    <div key={msg.id || index} className={cn("flex items-end gap-2", isUserSender ? 'justify-end' : 'justify-start')}>
                      {!isUserSender && (<Avatar className="h-8 w-8"><AvatarImage src={selectedConvo.avatar}/><AvatarFallback><User/></AvatarFallback></Avatar>)}
                      <div className="group relative max-w-xs lg:max-w-md">
                        <div className={cn("rounded-2xl p-3 text-sm shadow-sm", isUserSender ? 'bg-primary text-primary-foreground rounded-br-none' : 'bg-slate-700 text-slate-200 rounded-bl-none')}>
                           {msg.senderName && <p className="font-semibold text-xs mb-1">{msg.senderName}</p>}
                          <p className="whitespace-pre-wrap">{msg.text}</p>
                          <div className={cn("text-xs mt-2 flex items-center gap-2", isUserSender ? 'text-primary-foreground/70' : 'text-slate-400')}>
                            <span>{msg.timestamp?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            {isUserSender && msg.read && <CheckCircle2 className="h-3 w-3" />}
                          </div>
                        </div>
                      </div>
                      {isUserSender && (<Avatar className="h-8 w-8"><AvatarImage src={user?.photoURL || "https://picsum.photos/seed/admin-avatar/100"} /><AvatarFallback>{user?.displayName?.charAt(0) || 'A'}</AvatarFallback></Avatar>)}
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
              <div className="flex-shrink-0 p-4 border-t border-slate-700/50 space-y-2">
                <div className="relative">
                  <Textarea placeholder="Type a message..." className="pr-12 min-h-[60px] max-h-48 bg-slate-800 border-slate-700 text-slate-200" value={message} onChange={(e) => setMessage(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }} disabled={isSending} />
                  <div className="absolute top-3 right-3 flex items-center gap-1">
                    <Button size="icon" disabled={!message.trim() || isSending} onClick={handleSendMessage}>{isSending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}</Button>
                  </div>
                </div>
              </div>
            </>
          ) : (<div className="flex-col items-center justify-center h-full text-slate-400 hidden md:flex"><MessageCircle className="h-16 w-16" /><p className="mt-4 text-lg font-semibold">Select a conversation</p><p>Your messages will appear here.</p></div>)}
        </div>
      </div>
    </div>
  );
}
