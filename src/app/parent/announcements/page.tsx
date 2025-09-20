
'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Megaphone, Check, CheckCircle, Filter, Search, Paperclip, MoreHorizontal, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { firestore } from '@/lib/firebase';
import { collection, query, onSnapshot, orderBy, limit, doc, updateDoc, Timestamp, getDocs, startAfter, arrayUnion, increment } from 'firebase/firestore';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/auth-context';

type AnnouncementCategory = 'Urgent' | 'Academic' | 'Event' | 'General';

const announcementCategories: Record<AnnouncementCategory, { label: string; color: string;}> = {
    Urgent: { label: 'Urgent Alert', color: 'bg-red-500 border-red-500 text-white' },
    Academic: { label: 'Academic', color: 'bg-blue-500 border-blue-500 text-white' },
    Event: { label: 'Event', color: 'bg-purple-500 border-purple-500 text-white' },
    General: { label: 'General Info', color: 'bg-gray-500 border-gray-500 text-white' },
};

type Announcement = {
    id: string;
    title: string;
    sender: { name: string; avatarUrl: string };
    content: string;
    audience: string;
    sentAt: Timestamp;
    category: AnnouncementCategory;
    readBy: string[];
    attachmentUrl?: string;
    attachmentName?: string;
}

export default function ParentAnnouncementsPage() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const schoolId = searchParams.get('schoolId');
  const { user } = useAuth();
  const [announcements, setAnnouncements] = React.useState<Announcement[]>([]);
  const [filter, setFilter] = React.useState<'All' | 'Read' | 'Unread'>('All');
  const [searchTerm, setSearchTerm] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(true);
  const [lastVisible, setLastVisible] = React.useState<any>(null);
  const [hasMore, setHasMore] = React.useState(true);
  const [isLoadingMore, setIsLoadingMore] = React.useState(false);
  const currentUserId = user?.uid;

  React.useEffect(() => {
    if (!schoolId) return;

    setIsLoading(true);
    const q = query(
      collection(firestore, `schools/${schoolId}/announcements`), 
      orderBy('sentAt', 'desc'), 
      limit(5)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedAnnouncements = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Announcement));
      setAnnouncements(fetchedAnnouncements);
      setLastVisible(snapshot.docs[snapshot.docs.length - 1]);
      setHasMore(snapshot.docs.length > 0);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching announcements:", error);
      toast({ variant: 'destructive', title: 'Failed to load announcements.' });
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [schoolId, toast]);


  const handleMarkAsRead = async (id: string) => {
    if (!schoolId || !currentUserId) return;

    // Optimistically update the UI
    setAnnouncements(prev => prev.map(ann => 
        ann.id === id ? { ...ann, readBy: [...(ann.readBy || []), currentUserId] } : ann
    ));
    
    const announcementRef = doc(firestore, `schools/${schoolId}/announcements`, id);
    try {
        await updateDoc(announcementRef, { 
            readBy: arrayUnion(currentUserId),
            readCount: increment(1)
        });
        toast({ title: 'Marked as Read' });
    } catch(e) {
        console.error("Error marking as read:", e);
        toast({ variant: 'destructive', title: 'Could not mark as read.' });
        // Revert optimistic update on failure
        setAnnouncements(prev => prev.map(ann => 
            ann.id === id ? { ...ann, readBy: ann.readBy.filter(uid => uid !== currentUserId) } : ann
        ));
    }
  }
  
  const filteredAnnouncements = announcements.filter(ann => {
      const isRead = ann.readBy?.includes(currentUserId || '');
      const matchesFilter = filter === 'All' || (filter === 'Read' && isRead) || (filter === 'Unread' && !isRead);
      const matchesSearch = searchTerm === '' || ann.content.toLowerCase().includes(searchTerm.toLowerCase()) || ann.sender.name.toLowerCase().includes(searchTerm.toLowerCase()) || ann.title.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesFilter && matchesSearch;
  });

  const handleLoadMore = async () => {
    if (!lastVisible || !hasMore || !schoolId) return;
    
    setIsLoadingMore(true);
    const nextQuery = query(
      collection(firestore, `schools/${schoolId}/announcements`),
      orderBy('sentAt', 'desc'),
      startAfter(lastVisible),
      limit(5)
    );
    
    const documentSnapshots = await getDocs(nextQuery);
    const newAnnouncements = documentSnapshots.docs.map(doc => ({ id: doc.id, ...doc.data() } as Announcement));
    
    if (newAnnouncements.length > 0) {
        setAnnouncements(prev => [...prev, ...newAnnouncements]);
        setLastVisible(documentSnapshots.docs[documentSnapshots.docs.length - 1]);
    } else {
        setHasMore(false);
        toast({ description: 'No more announcements to load.' });
    }
    setIsLoadingMore(false);
  };

  const handleAttachmentClick = (attachmentUrl: string, fileName: string) => {
    window.open(attachmentUrl, '_blank');
    toast({
        title: 'Downloading Attachment',
        description: `Your download for "${fileName}" will start shortly.`,
    });
  }

  if (!schoolId) {
    return <div className="p-8">Error: School ID is missing from URL.</div>
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
       <div className="mb-6">
        <h1 className="font-headline text-3xl font-bold flex items-center gap-2"><Megaphone className="h-8 w-8 text-primary"/>Announcements</h1>
        <p className="text-muted-foreground">View school-wide and class-specific announcements.</p>
       </div>
       
       <Card className="mb-6">
           <CardHeader>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="relative w-full md:max-w-sm">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="search"
                            placeholder="Search by keyword..."
                            className="w-full bg-background pl-8"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex w-full md:w-auto items-center gap-2">
                        <Filter className="h-4 w-4 text-muted-foreground"/>
                        <Select value={filter} onValueChange={(value: 'All' | 'Read' | 'Unread') => setFilter(value)}>
                            <SelectTrigger className="w-full md:w-[180px]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="All">All Statuses</SelectItem>
                                <SelectItem value="Read">Read</SelectItem>
                                <SelectItem value="Unread">Unread</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
               </div>
           </CardHeader>
        </Card>

        <Card>
            {isLoading ? (
                <CardContent className="h-96 flex items-center justify-center">
                    <Loader2 className="h-10 w-10 animate-spin text-primary"/>
                </CardContent>
            ) : (
            <>
                <CardContent className="space-y-6 pt-6">
                    {filteredAnnouncements.length > 0 ? filteredAnnouncements.map((ann) => {
                        const isRead = ann.readBy?.includes(currentUserId || '');
                        return (
                        <Card key={ann.id} className={cn(!isRead && 'border-primary/50')}>
                            <CardHeader className="flex flex-row items-start justify-between gap-4">
                                <div className="flex-1">
                                    <CardTitle className="font-headline text-xl flex items-center gap-2">
                                        {!isRead ? <div className="h-2.5 w-2.5 rounded-full bg-primary" /> : <CheckCircle className="h-5 w-5 text-green-500" />}
                                        {ann.title}
                                    </CardTitle>
                                    <CardDescription>Posted: {ann.sentAt.toDate().toLocaleString()}</CardDescription>
                                </div>
                                <Badge className={cn('whitespace-nowrap', announcementCategories[ann.category as AnnouncementCategory]?.color)}>
                                    {announcementCategories[ann.category as AnnouncementCategory]?.label}
                                </Badge>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <p className="text-sm leading-relaxed">{ann.content}</p>

                                {ann.attachmentUrl && ann.attachmentName && (
                                    <div>
                                        <h4 className="font-semibold text-sm mb-2">Attachments</h4>
                                        <div className="space-y-2">
                                            <Button variant="outline" size="sm" className="w-full justify-start" onClick={() => handleAttachmentClick(ann.attachmentUrl!, ann.attachmentName!)}>
                                                <Paperclip className="mr-2 h-4 w-4"/>
                                                {ann.attachmentName}
                                            </Button>
                                        </div>
                                    </div>
                                )}

                                <Separator />
                                <div className="flex items-center gap-3">
                                    <Avatar className="h-8 w-8">
                                        <AvatarImage src={ann.sender.avatarUrl} alt={ann.sender.name} />
                                        <AvatarFallback>{ann.sender.name.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="text-xs font-semibold">Sent by {ann.sender.name}</p>
                                    </div>
                                </div>
                            </CardContent>
                            {!isRead && (
                                <CardFooter>
                                    <Button variant="outline" size="sm" onClick={() => handleMarkAsRead(ann.id)}>
                                        <Check className="mr-2 h-4 w-4"/>
                                        Mark as Read
                                    </Button>
                                </CardFooter>
                            )}
                        </Card>
                    )}) : (
                            <Card>
                                <CardContent className="text-center text-muted-foreground py-16">
                                    <p className="font-semibold">No Announcements Found</p>
                                    <p>Your search or filter returned no results.</p>
                                </CardContent>
                            </Card>
                    )}
                </CardContent>
                <CardFooter className="flex-col items-center gap-4">
                    <Button variant="outline" className="w-full" onClick={handleLoadMore} disabled={isLoadingMore || !hasMore}>
                        {isLoadingMore ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <MoreHorizontal className="mr-2 h-4 w-4" />
                        )}
                        {hasMore ? 'Load More Announcements' : 'All announcements loaded'}
                    </Button>
                    <p className="text-xs text-muted-foreground">
                        Showing {filteredAnnouncements.length} of {announcements.length} announcements
                    </p>
                </CardFooter>
            </>
            )}
        </Card>
    </div>
  );
}
