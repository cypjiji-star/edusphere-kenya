
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
import { collection, query, onSnapshot, orderBy, limit, doc, updateDoc, Timestamp, getDocs, startAfter, collectionGroup } from 'firebase/firestore';


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
    read: boolean;
    attachments?: { name: string; size: string }[];
}

export default function ParentAnnouncementsPage() {
  const { toast } = useToast();
  const [announcements, setAnnouncements] = React.useState<Announcement[]>([]);
  const [filter, setFilter] = React.useState<'All' | 'Read' | 'Unread'>('All');
  const [searchTerm, setSearchTerm] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(true);
  const [lastVisible, setLastVisible] = React.useState<any>(null);
  const [hasMore, setHasMore] = React.useState(true);
  const [isLoadingMore, setIsLoadingMore] = React.useState(false);

  React.useEffect(() => {
    setIsLoading(true);
    const q = query(
      collection(firestore, 'announcements'), 
      orderBy('sentAt', 'desc'), 
      limit(5)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedAnnouncements = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Announcement));
      setAnnouncements(fetchedAnnouncements);
      setLastVisible(snapshot.docs[snapshot.docs.length - 1]);
      setHasMore(!snapshot.empty);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching announcements:", error);
      toast({ variant: 'destructive', title: 'Failed to load announcements.' });
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [toast]);


  const handleMarkAsRead = async (id: string) => {
    const announcementRef = doc(firestore, 'announcements', id);
    try {
        await updateDoc(announcementRef, { read: true });
        toast({ title: 'Marked as Read' });
    } catch(e) {
        console.error("Error marking as read:", e);
        toast({ variant: 'destructive', title: 'Could not mark as read.' });
    }
  }
  
  const filteredAnnouncements = announcements.filter(ann => {
      const matchesFilter = filter === 'All' || (filter === 'Read' && ann.read) || (filter === 'Unread' && !ann.read);
      const matchesSearch = searchTerm === '' || ann.content.toLowerCase().includes(searchTerm.toLowerCase()) || ann.sender.name.toLowerCase().includes(searchTerm.toLowerCase()) || ann.title.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesFilter && matchesSearch;
  });

  const handleLoadMore = async () => {
    if (!lastVisible || !hasMore) return;
    
    setIsLoadingMore(true);
    const nextQuery = query(
      collection(firestore, 'announcements'),
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

  const handleAttachmentClick = (fileName: string) => {
    toast({
        title: 'Downloading Attachment',
        description: `Your download for "${fileName}" will start shortly.`,
    });
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
                    {filteredAnnouncements.length > 0 ? filteredAnnouncements.map((ann) => (
                        <Card key={ann.id} className={cn(!ann.read && 'border-primary/50')}>
                            <CardHeader className="flex flex-row items-start justify-between gap-4">
                                <div className="flex-1">
                                    <CardTitle className="font-headline text-xl flex items-center gap-2">
                                        {!ann.read ? <div className="h-2.5 w-2.5 rounded-full bg-primary" /> : <CheckCircle className="h-5 w-5 text-green-500" />}
                                        {ann.title}
                                    </CardTitle>
                                    <CardDescription>Posted: {ann.sentAt.toDate().toLocaleString()}</CardDescription>
                                </div>
                                <Badge className={cn('whitespace-nowrap', announcementCategories[ann.category].color)}>
                                    {announcementCategories[ann.category].label}
                                </Badge>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <p className="text-sm leading-relaxed">{ann.content}</p>

                                {ann.attachments && ann.attachments.length > 0 && (
                                    <div>
                                        <h4 className="font-semibold text-sm mb-2">Attachments</h4>
                                        <div className="space-y-2">
                                            {ann.attachments.map((file, index) => (
                                                <Button key={index} variant="outline" size="sm" className="w-full justify-start" onClick={() => handleAttachmentClick(file.name)}>
                                                    <Paperclip className="mr-2 h-4 w-4"/>
                                                    {file.name} ({file.size})
                                                </Button>
                                            ))}
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
                            {!ann.read && (
                                <CardFooter>
                                    <Button variant="outline" size="sm" onClick={() => handleMarkAsRead(ann.id)}>
                                        <Check className="mr-2 h-4 w-4"/>
                                        Mark as Read
                                    </Button>
                                </CardFooter>
                            )}
                        </Card>
                    )) : (
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

