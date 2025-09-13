
'use client';

import * as React from 'react';
import {
  MessageCircle,
  Search,
  Send,
  PlusCircle,
  Archive,
  Trash2,
  Paperclip,
  CheckCircle2,
  Languages,
  Users,
  User,
} from 'lucide-react';

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


const initialConversations = [
  {
    id: 'msg-1',
    name: 'Finance Department',
    avatar: 'https://picsum.photos/seed/finance-dept/100',
    icon: Users,
    lastMessage: "The budget proposal for Term 3 has been approved.",
    timestamp: '10:30 AM',
    unread: false,
  },
  {
    id: 'msg-2',
    name: 'Ms. Wanjiku (Teacher)',
    avatar: 'https://picsum.photos/seed/teacher-wanjiku/100',
    icon: User,
    lastMessage: "I've submitted the incident report for John Doe.",
    timestamp: '9:45 AM',
    unread: true,
  },
    {
    id: 'msg-3',
    name: 'All Staff',
    avatar: 'https://picsum.photos/seed/all-staff-group/100',
    icon: Users,
    lastMessage: 'Admin: Please review the updated health and safety...',
    timestamp: 'Yesterday',
    unread: false,
  },
  {
    id: 'msg-4',
    name: 'Admissions Office',
    avatar: 'https://picsum.photos/seed/admissions-office/100',
    icon: Users,
    lastMessage: 'We have 5 new pending student registrations to review.',
    timestamp: 'Yesterday',
    unread: true,
  },
  {
    id: 'msg-5',
    name: 'Mr. Omondi (Parent)',
    avatar: 'https://picsum.photos/seed/parent1/100',
    icon: User,
    lastMessage: 'Good morning, I have a question about the fee structure.',
    timestamp: '2 days ago',
    unread: false,
  },
];

type Message = { sender: 'me' | 'other'; text: string; timestamp: string; read?: boolean; senderName?: string; };

const initialMessages: Record<string, Message[]> = {
    'msg-1': [
        { sender: 'other', text: "The budget proposal for Term 3 has been approved. Please review the attached document.", timestamp: '10:30 AM' },
        { sender: 'me', text: "Excellent news. I will review it and get back to you by end of day.", timestamp: '10:31 AM', read: true },
    ],
    'msg-2': [
        { sender: 'other', text: "I've submitted the incident report for John Doe. He complained of a severe headache and was sent to the nurse.", timestamp: '9:45 AM' },
    ],
    'msg-3': [
        { sender: 'me', senderName: 'Admin', text: "All Staff: Please review the updated health and safety protocols document before the end of the week.", timestamp: 'Yesterday', read: true },
    ],
    'msg-4': [
         { sender: 'other', text: "We have 5 new pending student registrations to review in the system.", timestamp: 'Yesterday' },
         { sender: 'me', text: 'Thank you, I will assign them for review this afternoon.', timestamp: 'Yesterday', read: true },
    ],
    'msg-5': [
        { sender: 'other', text: 'Good morning, I have a question about the fee structure.', timestamp: '2 days ago' },
    ]
};

const newContactOptions = [
    { id: 'contact-1', name: 'Mr. Otieno (Teacher)', avatar: 'https://picsum.photos/seed/teacher-otieno/100', icon: User },
    { id: 'contact-2', name: 'Ms. Njeri (Teacher)', avatar: 'https://picsum.photos/seed/teacher-njeri/100', icon: User },
    { id: 'contact-3', name: 'Mrs. Kamau (Parent)', avatar: 'https://picsum.photos/seed/parent2/100', icon: User },
];


export function AdminChatLayout() {
  const [conversations, setConversations] = React.useState(initialConversations);
  const [selectedConvo, setSelectedConvo] = React.useState(conversations[0]);
  const [message, setMessage] = React.useState("");
  const [messages, setMessages] = React.useState(initialMessages);
  const [searchTerm, setSearchTerm] = React.useState('');
  const { toast } = useToast();

  const handleSendMessage = () => {
    if (message.trim() === '' || !selectedConvo) return;
    
    const newMessage: Message = {
      sender: 'me',
      text: message,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      read: false,
    };

    setMessages(prev => {
        const currentConvoMessages = prev[selectedConvo.id] || [];
        return {
            ...prev,
            [selectedConvo.id]: [...currentConvoMessages, newMessage]
        };
    });
    
    setConversations(prev => prev.map(convo => 
      convo.id === selectedConvo.id ? { ...convo, lastMessage: message } : convo
    ));

    setMessage('');
  };
  
  const handleCreateConversation = (contactId: string) => {
    const contact = newContactOptions.find(c => c.id === contactId);
    if (!contact) return;
    
    // Check if conversation already exists
    const existingConvo = conversations.find(c => c.name === contact.name);
    if (existingConvo) {
        setSelectedConvo(existingConvo);
        return;
    }

    const newConvo = {
        id: `msg-${Date.now()}`,
        name: contact.name,
        avatar: contact.avatar,
        icon: contact.icon,
        lastMessage: 'New conversation started.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        unread: false,
    };
    
    setConversations(prev => [newConvo, ...prev]);
    setSelectedConvo(newConvo);
    setMessages(prev => ({ ...prev, [newConvo.id]: [] }));
    toast({
        title: 'Conversation Started',
        description: `You can now chat with ${contact.name}.`
    });
  }

  const filteredConversations = conversations.filter(convo => 
    convo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    convo.lastMessage.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="z-10 h-full w-full bg-background rounded-lg overflow-hidden">
      <div className="flex h-full">
        <div className="flex flex-col w-full md:w-[320px] border-r">
          <div className="flex-shrink-0 p-4 border-b">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold font-headline flex items-center gap-2"><MessageCircle className="h-6 w-6 text-primary"/>Messenger</h2>
                <Dialog>
                    <DialogTrigger asChild>
                        <Button variant="ghost" size="icon">
                            <PlusCircle className="h-5 w-5" />
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>New Conversation</DialogTitle>
                            <DialogDescription>Select a user to start a new chat.</DialogDescription>
                        </DialogHeader>
                        <div className="py-4">
                           <Label htmlFor="new-chat-recipient">Recipient</Label>
                           <Select onValueChange={handleCreateConversation}>
                                <SelectTrigger id="new-chat-recipient">
                                    <SelectValue placeholder="Select a teacher or parent..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {newContactOptions.map(contact => (
                                        <SelectItem key={contact.id} value={contact.id}>
                                            <div className="flex items-center gap-2">
                                                <Avatar className="h-6 w-6">
                                                    <AvatarImage src={contact.avatar} />
                                                    <AvatarFallback>{contact.name.charAt(0)}</AvatarFallback>
                                                </Avatar>
                                                <span>{contact.name}</span>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                           </Select>
                        </div>
                         <DialogFooter>
                            <DialogClose asChild>
                                <Button variant="outline">Cancel</Button>
                            </DialogClose>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
            <div className="relative mt-4">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search messages or users..." 
                className="pl-8" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            <div className="p-2 space-y-1">
            {filteredConversations.map((convo) => (
                <button
                key={convo.id}
                className={cn(
                  'flex w-full items-start gap-3 rounded-lg p-3 text-left transition-colors hover:bg-muted/50',
                  selectedConvo?.id === convo.id && 'bg-muted'
                )}
                onClick={() => setSelectedConvo(convo)}
              >
                <Avatar className="h-10 w-10">
                    <AvatarImage src={convo.avatar} alt={convo.name} />
                    <AvatarFallback><convo.icon /></AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold truncate">{convo.name}</p>
                    <p className="text-xs text-muted-foreground">{convo.timestamp}</p>
                  </div>
                  <p className="text-sm text-muted-foreground truncate">{convo.lastMessage}</p>
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
                <div className="flex items-center gap-3">
                     <Avatar className="h-10 w-10">
                        <AvatarImage src={selectedConvo.avatar} alt={selectedConvo.name} />
                        <AvatarFallback><selectedConvo.icon /></AvatarFallback>
                    </Avatar>
                    <p className="font-semibold">{selectedConvo.name}</p>
                </div>
                 <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" disabled>
                        <Archive className="h-5 w-5 text-muted-foreground" />
                    </Button>
                    <Button variant="ghost" size="icon" disabled>
                        <Trash2 className="h-5 w-5 text-muted-foreground" />
                    </Button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {(messages[selectedConvo.id] || []).map((msg, index) => (
                    <div key={index} className={cn(
                        "flex items-end gap-2",
                        msg.sender === 'me' ? 'justify-end' : 'justify-start'
                    )}>
                        {msg.sender === 'other' && <Avatar className="h-8 w-8"><AvatarImage src={selectedConvo.avatar}/><AvatarFallback><selectedConvo.icon /></AvatarFallback></Avatar>}
                        <div className="group relative">
                          <div className={cn(
                              "max-w-xs lg:max-w-md rounded-2xl p-3 text-sm shadow-sm",
                              msg.sender === 'me' ? 'bg-primary text-primary-foreground rounded-br-none' : 'bg-secondary rounded-bl-none'
                          )}>
                              <p>{msg.text}</p>
                              <div className={cn("text-xs mt-2 flex items-center gap-2", msg.sender === 'me' ? 'text-primary-foreground/70' : 'text-muted-foreground')}>
                                  <span>{msg.timestamp}</span>
                                  {msg.sender === 'me' && msg.read && <CheckCircle2 className="h-4 w-4" />}
                              </div>
                          </div>
                        </div>
                         {msg.sender === 'me' && <Avatar className="h-8 w-8"><AvatarImage src="https://picsum.photos/seed/admin-avatar/100" /><AvatarFallback>A</AvatarFallback></Avatar>}
                    </div>
                ))}
              </div>
              <div className="flex-shrink-0 p-4 border-t space-y-2">
                <div className="relative">
                  <Textarea
                    placeholder="Type a message..."
                    className="pr-32"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                     onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                  />
                  <div className="absolute top-3 right-3 flex items-center gap-2">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                              size="icon"
                              variant="ghost"
                              disabled
                          >
                              <Paperclip className="h-5 w-5 text-muted-foreground" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Attach file (coming soon)</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <Button
                        size="icon"
                        disabled={!message.trim()}
                        onClick={handleSendMessage}
                    >
                        <Send className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-col items-center justify-center h-full text-muted-foreground hidden md:flex">
              <MessageCircle className="h-16 w-16" />
              <p className="mt-4 text-lg font-semibold">Select a conversation</p>
              <p>Your messages will appear here.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

    
