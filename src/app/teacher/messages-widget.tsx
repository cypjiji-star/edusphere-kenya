
'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MessageCircle, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { conversations } from './messaging/chat-layout';

export function MessagesWidget() {
  const unreadCount = conversations.filter(m => m.unread).length;
    
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline text-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-primary" />
            Recent Messages
          </div>
          {unreadCount > 0 && <Badge variant="default">{unreadCount} Unread</Badge>}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {conversations.slice(0, 3).map((message, index) => (
            <div key={index} className="space-y-3">
              <Link href="/teacher/messaging" className="block hover:bg-muted/50 p-2 rounded-lg">
                <div className="flex items-start gap-3">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={message.avatar} alt={message.name} />
                    <AvatarFallback>{message.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex justify-between items-center">
                        <p className="font-semibold text-sm">{message.name}</p>
                        <p className="text-xs text-muted-foreground">{message.timestamp}</p>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">{message.lastMessage}</p>
                  </div>
                   {message.unread && <div className="h-2.5 w-2.5 rounded-full bg-primary mt-1"></div>}
                </div>
              </Link>
              {index < conversations.slice(0, 3).length - 1 && <Separator />}
            </div>
          ))}
          {conversations.length === 0 && (
            <div className="text-center text-muted-foreground py-4">
              <p className="font-semibold">No new messages</p>
              <p className="text-sm">Your inbox is clear.</p>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <Button asChild variant="outline" size="sm" className="w-full">
            <Link href="/teacher/messaging">
                Open Full Messaging App
                <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
