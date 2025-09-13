
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
  Mic,
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

const conversations = [
  {
    id: 'msg-1',
    name: 'Ms. Wanjiku (John\'s Chemistry Teacher)',
    avatar: 'https://picsum.photos/seed/teacher-wanjiku/100',
    icon: User,
    lastMessage: "He's doing very well in class, showing great...",
    timestamp: '10:30 AM',
    unread: false,
  },
  {
    id: 'msg-2',
    name: 'Admin Office',
    avatar: 'https://picsum.photos/seed/admin-office/100',
    icon: Users,
    lastMessage: "Reminder: The school will be closed on Friday.",
    timestamp: '9:45 AM',
    unread: true,
  },
    {
    id: 'msg-3',
    name: 'Finance Department',
    avatar: 'https://picsum.photos/seed/finance-dept/100',
    icon: Users,
    lastMessage: 'Your recent payment has been successfully processed.',
    timestamp: 'Yesterday',
    unread: false,
  },
  {
    id: 'msg-4',
    name: 'Mr. Otieno (Jane\'s Math Teacher)',
    avatar: 'https://picsum.photos/seed/teacher-otieno/100',
    icon: User,
    lastMessage: 'Please remind Jane about the upcoming math contest.',
    timestamp: '2 days ago',
    unread: false,
  },
];

const messages: Record<string, { sender: 'me' | 'other'; text: string; timestamp: string; read?: boolean; senderName?: string; }[]> = {
    'msg-1': [
        { sender: 'me', text: "Good morning Ms. Wanjiku, I just wanted to check in on John's progress in Chemistry this term.", timestamp: '10:25 AM' },
        { sender: 'other', text: "He's doing very well in class, showing great improvement in the practical sessions. I have no concerns.", timestamp: '10:30 AM' },
    ],
    'msg-2': [
        { sender: 'other', text: "Reminder: The school will be closed on Friday for the public holiday. Classes will resume on Monday.", timestamp: '9:45 AM' },
    ],
    'msg-3': [
        { sender: 'other', text: "Dear Parent, your recent fee payment has been successfully processed. Thank you.", timestamp: 'Yesterday', read: true },
    ],
    'msg-4': [
         { sender: 'other', text: "Please remind Jane about the upcoming math contest registration deadline this Friday.", timestamp: '2 days ago' },
    ]
};


export function AdminChatLayout() {
  const [selectedConvo, setSelectedConvo] = React.useState(conversations[0]);
  const [message, setMessage] = React.useState("");

  return (
    <div className="z-10 h-full w-full bg-background rounded-lg overflow-hidden">
      <div className="flex h-full">
        <div className="flex flex-col w-full md:w-[320px] border-r">
          <div className="flex-shrink-0 p-4 border-b">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold font-headline flex items-center gap-2"><MessageCircle className="h-6 w-6 text-primary"/>Messages</h2>
                <Button variant="ghost" size="icon" disabled>
                    <PlusCircle className="h-5 w-5" />
                </Button>
            </div>
            <div className="relative mt-4">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search messages..." className="pl-8" />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            <div className="p-2 space-y-1">
            {conversations.map((convo) => (
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
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {(messages[selectedConvo.id as keyof typeof messages] || []).map((msg, index) => (
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
                         {msg.sender === 'me' && <Avatar className="h-8 w-8"><AvatarImage src="https://picsum.photos/seed/parent1/100" /><AvatarFallback>P</AvatarFallback></Avatar>}
                    </div>
                ))}
              </div>
              <div className="flex-shrink-0 p-4 border-t space-y-2">
                <div className="relative">
                  <Textarea
                    placeholder="Type your message..."
                    className="pr-12"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                     onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        // handle send message
                      }
                    }}
                  />
                  <div className="absolute bottom-2 right-3">
                    <Button
                        size="icon"
                        disabled={!message}
                    >
                        <Send className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
                 <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
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
                         <Tooltip>
                          <TooltipTrigger asChild>
                              <Button
                                  size="icon"
                                  variant="ghost"
                                  disabled
                              >
                                  <Mic className="h-5 w-5 text-muted-foreground" />
                              </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Record voice note (premium)</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
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
