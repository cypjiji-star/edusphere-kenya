
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
    sentAt: string;
    category: AnnouncementCategory;
    read: boolean;
    attachments?: { name: string; size: string }[];
}

const mockAnnouncements: Announcement[] = [
    {
        id: 'ann-1',
        title: 'PTA Meeting Reminder',
        sender: { name: 'Principal\'s Office', avatarUrl: 'https://picsum.photos/seed/principal/100' },
        content: 'This is a reminder about the Parent-Teacher Association meeting this Saturday at 10 AM in the main hall. Your participation is highly encouraged.',
        audience: 'All Parents',
        sentAt: '2024-07-28 09:00 AM',
        category: 'Event' as AnnouncementCategory,
        read: false,
    },
    {
        id: 'ann-2',
        title: 'School Closure for Public Holiday',
        sender: { name: 'Admin Office', avatarUrl: 'https://picsum.photos/seed/admin/100' },
        content: 'The school will be closed on Friday for the public holiday. Classes will resume on Monday. We wish you a restful weekend.',
        audience: 'All Students, All Parents, All Staff',
        sentAt: '2024-07-27 02:30 PM',
        category: 'General' as AnnouncementCategory,
        read: false,
    },
    {
        id: 'ann-3',
        title: 'Urgent: Fee Payment Deadline',
        sender: { name: 'Admin Office', avatarUrl: 'https://picsum.photos/seed/admin/100' },
        content: 'The fee payment deadline for Term 2 is this Friday. Please ensure all outstanding balances are cleared to avoid any inconveniences.',
        audience: 'All Parents',
        sentAt: '2024-07-26 11:00 AM',
        category: 'Urgent' as AnnouncementCategory,
        read: true,
    },
     {
        id: 'ann-4',
        title: 'Career Guidance Session for Form 4s',
        sender: { name: 'Form 4 Teachers', avatarUrl: 'https://picsum.photos/seed/teachers/100' },
        content: 'A special career guidance session for all Form 4 students and their parents will be held next Wednesday in the auditorium. More details to follow.',
        audience: 'Form 4 Parents, Form 4 Students',
        sentAt: '2024-07-25 04:00 PM',
        category: 'Academic' as AnnouncementCategory,
        read: true,
        attachments: [
            { name: 'Career_Day_Schedule.pdf', size: '256 KB' },
        ],
    }
];

const additionalAnnouncements: Announcement[] = [
    {
        id: 'ann-5',
        title: 'Mid-Term Exam Timetable',
        sender: { name: 'Examinations Office', avatarUrl: 'https://picsum.photos/seed/exams/100' },
        content: 'The Term 2 Mid-Term Examination timetable has been released. Please check the student portal for the detailed schedule for your child\'s class.',
        audience: 'All Students, All Parents',
        sentAt: '2024-07-24 01:00 PM',
        category: 'Academic' as AnnouncementCategory,
        read: true,
    },
    {
        id: 'ann-6',
        title: 'Sports Day Rehearsals',
        sender: { name: 'Sports Department', avatarUrl: 'https://picsum.photos/seed/sports/100' },
        content: 'Please be reminded that sports day rehearsals will be taking place every afternoon this week. Ensure your child has their sports kit.',
        audience: 'All Parents',
        sentAt: '2024-07-23 08:30 AM',
        category: 'Event' as AnnouncementCategory,
        read: true,
    }
]

export default function ParentAnnouncementsPage() {
  const { toast } = useToast();
  const [announcements, setAnnouncements] = React.useState(mockAnnouncements);
  const [filter, setFilter] = React.useState<'All' | 'Read' | 'Unread'>('All');
  const [searchTerm, setSearchTerm] = React.useState('');
  const [isLoadingMore, setIsLoadingMore] = React.useState(false);
  const [hasLoadedMore, setHasLoadedMore] = React.useState(false);

  const handleMarkAsRead = (id: string) => {
    setAnnouncements(prev => prev.map(ann => ann.id === id ? { ...ann, read: true } : ann));
    toast({
        title: 'Marked as Read',
    });
  }
  
  const filteredAnnouncements = announcements.filter(ann => {
      const matchesFilter = filter === 'All' || (filter === 'Read' && ann.read) || (filter === 'Unread' && !ann.read);
      const matchesSearch = searchTerm === '' || ann.content.toLowerCase().includes(searchTerm.toLowerCase()) || ann.sender.name.toLowerCase().includes(searchTerm.toLowerCase()) || ann.title.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesFilter && matchesSearch;
  });

  const handleLoadMore = () => {
    setIsLoadingMore(true);
    setTimeout(() => {
        setAnnouncements(prev => [...prev, ...additionalAnnouncements]);
        setIsLoadingMore(false);
        setHasLoadedMore(true);
        toast({
            title: 'Announcements Loaded',
            description: 'Older announcements have been added to the list.',
        });
    }, 1000);
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
            <CardContent className="space-y-6 pt-6">
                {filteredAnnouncements.length > 0 ? filteredAnnouncements.map((ann) => (
                    <Card key={ann.id} className={cn(!ann.read && 'border-primary/50')}>
                        <CardHeader className="flex flex-row items-start justify-between gap-4">
                            <div className="flex-1">
                                <CardTitle className="font-headline text-xl flex items-center gap-2">
                                    {!ann.read ? <div className="h-2.5 w-2.5 rounded-full bg-primary" /> : <CheckCircle className="h-5 w-5 text-green-500" />}
                                    {ann.title}
                                </CardTitle>
                                <CardDescription>Posted: {ann.sentAt}</CardDescription>
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
                <Button variant="outline" className="w-full" onClick={handleLoadMore} disabled={isLoadingMore || hasLoadedMore}>
                     {isLoadingMore ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        <MoreHorizontal className="mr-2 h-4 w-4" />
                    )}
                    {hasLoadedMore ? 'All announcements loaded' : 'Load More Announcements'}
                </Button>
                <p className="text-xs text-muted-foreground">
                    Showing {filteredAnnouncements.length} of {announcements.length} announcements
                </p>
            </CardFooter>
        </Card>
    </div>
  );
}
