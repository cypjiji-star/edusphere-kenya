
'use client';

import * as React from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { MessageSquare, ArrowRight, Loader2, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { collection, onSnapshot, query, orderBy, limit, Timestamp } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { cn } from '@/lib/utils';

type Conversation = {
    id: string;
    userName: string;
    lastMessage: string;
    lastUpdate: Timestamp;
    isEscalated: boolean;
};

export function FloatingChatWidget() {
    const searchParams = useSearchParams();
    const schoolId = searchParams.get('schoolId');
    const [conversations, setConversations] = React.useState<Conversation[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);

    const unreadCount = conversations.filter(c => c.isEscalated).length;

    React.useEffect(() => {
        if (!schoolId) {
            setIsLoading(false);
            return;
        }

        const q = query(
            collection(firestore, `schools/${schoolId}/support-chats`), 
            orderBy('lastUpdate', 'desc'),
            limit(5) // Only fetch the 5 most recent conversations for the widget
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const convos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Conversation));
            setConversations(convos);
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [schoolId]);

    return (
        <Popover>
            <PopoverTrigger asChild>
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
                    <span className="sr-only">Open Messages</span>
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 mr-4 mb-2" side="top" align="end">
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <h4 className="font-medium leading-none">Recent Conversations</h4>
                        <Link href={`/admin/messaging?schoolId=${schoolId}`} className="text-xs text-primary hover:underline">View all</Link>
                    </div>
                    
                    {isLoading ? (
                        <div className="h-24 flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>
                    ) : conversations.length > 0 ? (
                        <div className="space-y-3">
                            {conversations.map(convo => (
                                <Link key={convo.id} href={`/admin/messaging?schoolId=${schoolId}`} className="block p-2 -m-2 rounded-md hover:bg-muted">
                                    <div className={cn("space-y-1", convo.isEscalated && "font-bold")}>
                                        <div className="flex items-center gap-2">
                                            <User className="h-4 w-4 text-muted-foreground"/>
                                            <p className="text-sm truncate">{convo.userName}</p>
                                        </div>
                                        <p className="text-xs text-muted-foreground truncate">{convo.lastMessage}</p>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground text-center py-4">No recent messages.</p>
                    )}
                    
                    <Separator />
                    <Button asChild className="w-full">
                         <Link href={`/admin/messaging?schoolId=${schoolId}`}>
                            Go to Messaging
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                    </Button>
                </div>
            </PopoverContent>
        </Popover>
    );
}
