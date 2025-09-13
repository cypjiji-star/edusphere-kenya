
'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MessageCircle, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

const messages = [
  {
    sender: 'Mr. Omondi (Parent)',
    avatarUrl: 'https://picsum.photos/seed/parent1/100',
    preview: 'Good morning, I wanted to check on John\'s progress in Chemistry...',
    time: '9:15 AM',
    unread: true,
  },
  {
    sender: 'Jane Achieng (Student)',
    avatarUrl: 'https://picsum.photos/seed/student3/100',
    preview: 'Hello Ms. Wanjiku, I have a question about the assignment deadline.',
    time: 'Yesterday',
    unread: true,
  },
    {
    sender: 'Admin Office',
    avatarUrl: 'https://picsum.photos/seed/admin/100',
    preview: 'Reminder: Staff meeting today at 3:00 PM in the staff room.',
    time: 'Yesterday',
    unread: false,
  },
];

export function MessagesWidget() {
  const unreadCount = messages.filter(m => m.unread).length;
    
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
          {messages.map((message, index) => (
            <div key={index} className="space-y-3">
              <Link href="/teacher/messaging" className="block hover:bg-muted/50 p-2 rounded-lg">
                <div className="flex items-start gap-3">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={message.avatarUrl} alt={message.sender} />
                    <AvatarFallback>{message.sender.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex justify-between items-center">
                        <p className="font-semibold text-sm">{message.sender}</p>
                        <p className="text-xs text-muted-foreground">{message.time}</p>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">{message.preview}</p>
                  </div>
                   {message.unread && <div className="h-2.5 w-2.5 rounded-full bg-primary mt-1"></div>}
                </div>
              </Link>
              {index < messages.length - 1 && <Separator />}
            </div>
          ))}
          {messages.length === 0 && (
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
