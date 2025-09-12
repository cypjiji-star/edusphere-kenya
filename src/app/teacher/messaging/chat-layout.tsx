
'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  MessageCircle,
  Search,
  Send,
  PlusCircle,
  Archive,
  Trash2,
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
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';

const conversations = [
  {
    id: 'msg-1',
    name: 'Mr. Omondi (Parent)',
    avatar: 'https://picsum.photos/seed/parent1/100',
    lastMessage: "Good morning, I wanted to check on John's progress...",
    timestamp: '9:15 AM',
    unread: true,
  },
  {
    id: 'msg-2',
    name: 'Jane Achieng (Student)',
    avatar: 'https://picsum.photos/seed/student3/100',
    lastMessage: 'Hello Ms. Wanjiku, I have a question about the assignment.',
    timestamp: 'Yesterday',
    unread: true,
  },
  {
    id: 'msg-3',
    name: 'Admin Office',
    avatar: 'https://picsum.photos/seed/admin/100',
    lastMessage: 'Reminder: Staff meeting today at 3:00 PM.',
    timestamp: 'Yesterday',
    unread: false,
  },
  {
    id: 'msg-4',
    name: 'Form 4 Parents Group',
    avatar: 'https://picsum.photos/seed/group1/100',
    lastMessage: 'Mr. Kamau: Is the trip confirmed for next week?',
    timestamp: '2 days ago',
    unread: false,
  },
];

const messages = {
    'msg-1': [
        { sender: 'other', text: "Good morning, I wanted to check on John's progress in Chemistry. He mentioned he was finding it a bit challenging.", timestamp: '9:15 AM' },
        { sender: 'me', text: "Good morning Mr. Omondi. John is a bright student and is picking up the concepts. I'll be sure to give him some extra attention during our next practical.", timestamp: '9:17 AM' },
    ],
    'msg-2': [
        { sender: 'other', text: "Hello Ms. Wanjiku, I have a question about the assignment deadline.", timestamp: 'Yesterday' },
    ],
    'msg-3': [
        { sender: 'other', text: "Reminder: Staff meeting today at 3:00 PM in the staff room.", timestamp: 'Yesterday' },
    ],
    'msg-4': [
         { sender: 'other', text: "Mr. Kamau: Is the trip confirmed for next week?", timestamp: '2 days ago' },
    ]
}


export function ChatLayout() {
  const [selectedConvo, setSelectedConvo] = React.useState(conversations[0]);
  const [message, setMessage] = React.useState("");

  return (
    <div className="z-10 h-full w-full bg-background border rounded-lg">
      <div className="flex h-full">
        <div className="hidden md:flex md:flex-col md:w-[320px] border-r">
          <div className="flex-shrink-0 p-4 border-b">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold font-headline">Inbox</h2>
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
            <div className="p-2">
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
                    <AvatarFallback>{convo.name.charAt(0)}</AvatarFallback>
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
                        <AvatarFallback>{selectedConvo.name.charAt(0)}</AvatarFallback>
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
                {(messages[selectedConvo.id as keyof typeof messages] || []).map((msg, index) => (
                    <div key={index} className={cn(
                        "flex items-end gap-2",
                        msg.sender === 'me' ? 'justify-end' : 'justify-start'
                    )}>
                        {msg.sender === 'other' && <Avatar className="h-8 w-8"><AvatarImage src={selectedConvo.avatar}/><AvatarFallback>{selectedConvo.name.charAt(0)}</AvatarFallback></Avatar>}
                        <div className={cn(
                            "max-w-xs lg:max-w-md rounded-2xl p-3 text-sm",
                            msg.sender === 'me' ? 'bg-primary text-primary-foreground rounded-br-none' : 'bg-muted rounded-bl-none'
                        )}>
                            <p>{msg.text}</p>
                            <p className={cn("text-xs mt-2", msg.sender === 'me' ? 'text-primary-foreground/70' : 'text-muted-foreground')}>{msg.timestamp}</p>
                        </div>
                         {msg.sender === 'me' && <Avatar className="h-8 w-8"><AvatarImage src="https://picsum.photos/seed/teacher-avatar/100" /><AvatarFallback>T</AvatarFallback></Avatar>}
                    </div>
                ))}
              </div>
              <div className="flex-shrink-0 p-4 border-t">
                <div className="relative">
                  <Textarea
                    placeholder="Type your message..."
                    className="pr-16"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                     onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        // handle send message
                      }
                    }}
                  />
                  <Button
                    size="icon"
                    className="absolute top-1/2 right-3 -translate-y-1/2"
                    disabled={!message}
                  >
                    <Send className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
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
