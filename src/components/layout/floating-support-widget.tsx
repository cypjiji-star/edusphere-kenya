
'use client';

import * as React from 'react';
import { useSearchParams } from 'next/navigation';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { MessageSquare, BadgeHelp } from 'lucide-react';
import { AiChat } from '../ai/ai-chat';
import { useAuth } from '@/context/auth-context';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { Badge } from '../ui/badge';

export function FloatingSupportWidget() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const schoolId = searchParams.get('schoolId');
  const [unreadCount, setUnreadCount] = React.useState(0);

  React.useEffect(() => {
    if (!user || !schoolId) return;

    const q = query(
      collection(firestore, `schools/${schoolId}/support-chats`),
      where('userId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const chatData = snapshot.docs[0].data();
        const messages = chatData.messages || [];
        // A simple unread logic: if the last message is not from the user, it's "unread".
        const lastMessage = messages[messages.length - 1];
        if (lastMessage && lastMessage.role !== 'user') {
          setUnreadCount(1);
        } else {
          setUnreadCount(0);
        }
      } else {
        setUnreadCount(0);
      }
    });

    return () => unsubscribe();
  }, [user, schoolId]);

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          className="fixed bottom-6 right-6 h-16 w-16 rounded-full shadow-lg"
          size="icon"
        >
          <MessageSquare className="h-8 w-8" />
          {unreadCount > 0 && (
            <Badge variant="destructive" className="absolute -top-1 -right-1">
              {unreadCount}
            </Badge>
          )}
          <span className="sr-only">Open Support Chat</span>
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md p-0 flex flex-col h-full">
        <SheetHeader className="p-4 border-b">
          <SheetTitle>Support Assistant</SheetTitle>
        </SheetHeader>
        <div className="flex-1 min-h-0">
          <AiChat />
        </div>
      </SheetContent>
    </Sheet>
  );
}
