
'use client';

import * as React from 'react';
import { MessageCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { useAuth } from '@/context/auth-context';
import { useSearchParams } from 'next/navigation';
import { AdminChatLayout } from '@/app/admin/messaging/chat-layout';
import { TeacherChatLayout } from '@/app/teacher/messaging/chat-layout';
import { ParentChatLayout } from '@/app/parent/messaging/chat-layout';
import { cn } from '@/lib/utils';

export function MessagingShortcut() {
  const { user, role } = useAuth();
  const searchParams = useSearchParams();
  const schoolId = searchParams.get('schoolId');
  const [unreadCount, setUnreadCount] = React.useState(0);
  const [isOpen, setIsOpen] = React.useState(false);

  React.useEffect(() => {
    if (!schoolId || !user) return;

    const q = query(
      collection(firestore, `schools/${schoolId}/conversations`),
      where('unread', '==', true)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setUnreadCount(snapshot.size);
    });

    return () => unsubscribe();
  }, [schoolId, user]);

  const renderChatLayout = () => {
    switch (role) {
      case 'admin':
        return <AdminChatLayout />;
      case 'teacher':
        return <TeacherChatLayout />;
      case 'parent':
        return <ParentChatLayout />;
      default:
        return <p>Chat not available for your role.</p>;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="relative rounded-full h-12 w-12 shadow-lg bg-background hover:bg-muted"
        >
          <MessageCircle className="h-6 w-6" />
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 text-xs items-center justify-center bg-primary text-primary-foreground">
                {unreadCount}
              </span>
            </span>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent
        className="p-0 border-0 max-w-md h-[70vh] flex flex-col"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <div className="h-full w-full bg-[#1A1B1F] text-white rounded-lg overflow-hidden">
          {renderChatLayout()}
        </div>
      </DialogContent>
    </Dialog>
  );
}
