
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
import { Megaphone, Check, CheckCircle, Filter, Search } from 'lucide-react';
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


const mockAnnouncements = [
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
    }
];

export default function ParentAnnouncementsPage() {
  const { toast } = useToast();
  const [announcements, setAnnouncements] = React.useState(mockAnnouncements);
  const [filter, setFilter] = React.useState<'All' | 'Read' | 'Unread'>('All');
  const [searchTerm, setSearchTerm] = React.useState('');

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

  return (
    <div className="p-4 sm:p-6 lg:p-8">
       <div className="mb-6">
        <h1 className="font-headline text-3xl font-bold flex items-center gap-2"><Megaphone className="h-8 w-8 text-primary"/>Announcements</h1>
        <p className="text-muted-foreground">View school-wide and class-specific announcements.</p>
       </div>
       
       <Card>
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
            <CardContent className="space-y-6">
                {filteredAnnouncements.length > 0 ? filteredAnnouncements.map((ann, index) => (
                    <div key={ann.id}>
                        <div className="flex items-start gap-4">
                           <div className="mt-1 flex-shrink-0">
                                {ann.read ? (
                                    <CheckCircle className="h-5 w-5 text-green-500" />
                                ) : (
                                    <div className="h-5 w-5 flex items-center justify-center">
                                        <div className="h-2.5 w-2.5 rounded-full bg-primary animate-pulse"></div>
                                    </div>
                                )}
                           </div>
                           <div className="flex-1 space-y-4">
                               <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2">
                                    <div>
                                        <h2 className="font-semibold text-lg">{ann.title}</h2>
                                        <p className="text-xs text-muted-foreground">Posted: {ann.sentAt}</p>
                                    </div>
                                    <Badge className={cn('whitespace-nowrap', announcementCategories[ann.category].color)}>
                                        {announcementCategories[ann.category].label}
                                    </Badge>
                                </div>
                                <p className="text-sm leading-relaxed">{ann.content}</p>
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
                           </div>
                        </div>
                        <div className="flex justify-end mt-4">
                            {!ann.read && (
                                <Button variant="outline" size="sm" onClick={() => handleMarkAsRead(ann.id)}>
                                    <Check className="mr-2 h-4 w-4"/>
                                    Mark as Read
                                </Button>
                            )}
                        </div>
                        {index < filteredAnnouncements.length - 1 && <Separator className="mt-6" />}
                    </div>
                )) : (
                     <div className="text-center text-muted-foreground py-16">
                        <p className="font-semibold">No Announcements Found</p>
                        <p>Your search or filter returned no results.</p>
                    </div>
                )}
            </CardContent>
       </Card>
    </div>
  );
}
