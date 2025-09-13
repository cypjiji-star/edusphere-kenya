
'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Megaphone, Send, History, Bell, Calendar as CalendarIcon, Clock, Paperclip, Eye, CheckCircle, Users, ArrowRight, Languages, ChevronDown, FileDown, Archive, Tag } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Form, FormDescription, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import Link from 'next/link';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';


type AnnouncementCategory = 'Urgent' | 'Academic' | 'Event' | 'General';

const announcementCategories: Record<AnnouncementCategory, { label: string; color: string;}> = {
    Urgent: { label: 'Urgent Alert', color: 'bg-red-500 border-red-500 text-white' },
    Academic: { label: 'Academic', color: 'bg-blue-500 border-blue-500 text-white' },
    Event: { label: 'Event', color: 'bg-purple-500 border-purple-500 text-white' },
    General: { label: 'General Info', color: 'bg-gray-500 border-gray-500 text-white' },
};

const initialAnnouncements = [
    {
        id: 'ann-1',
        sender: { name: 'Admin Office', avatarUrl: 'https://picsum.photos/seed/admin/100' },
        content: 'Reminder: The school will be closed on Friday for the public holiday. Classes will resume on Monday.',
        audience: 'All Students, All Parents, All Staff',
        sentAt: '2024-07-18 09:00 AM',
        views: 1250,
        totalRecipients: 1800,
        category: 'General' as AnnouncementCategory,
    },
    {
        id: 'ann-2',
        sender: { name: 'Principal\'s Office', avatarUrl: 'https://picsum.photos/seed/principal/100' },
        content: 'The PTA meeting scheduled for this Saturday has been postponed. A new date will be communicated soon.',
        audience: 'All Parents',
        sentAt: '2024-07-17 02:30 PM',
        views: 600,
        totalRecipients: 780,
        category: 'Event' as AnnouncementCategory,
    },
    {
        id: 'ann-3',
        sender: { name: 'Admin Office', avatarUrl: 'https://picsum.photos/seed/admin/100' },
        content: 'Fee payment deadline for Term 2 is this Friday. Please ensure all outstanding balances are cleared.',
        audience: 'All Parents',
        sentAt: '2024-07-15 11:00 AM',
        views: 750,
        totalRecipients: 780,
        category: 'Urgent' as AnnouncementCategory,
    }
];

const announcementSchema = z.object({
    message: z.string().min(10, 'Message must be at least 10 characters.'),
    audience: z.string({ required_error: 'Please select an audience.' }),
    category: z.string({ required_error: 'Please select a category.' }),
});

type AnnouncementFormValues = z.infer<typeof announcementSchema>;

export default function AdminAnnouncementsPage() {
  const [isScheduling, setIsScheduling] = React.useState(false);
  const [scheduledDate, setScheduledDate] = React.useState<Date | undefined>();
  const [pastAnnouncements, setPastAnnouncements] = React.useState(initialAnnouncements);

  const form = useForm<AnnouncementFormValues>({
    resolver: zodResolver(announcementSchema),
    defaultValues: {
        message: '',
    }
  });
  const { toast } = useToast();

  const handleTranslate = () => {
    toast({
        title: 'AI Translation Enabled',
        description: 'This is a placeholder for AI translation. In a real app, this would translate the message content.',
    });
  }

  function onSubmit(values: AnnouncementFormValues) {
    const newAnnouncement = {
        id: `ann-${Date.now()}`,
        sender: { name: 'Admin User', avatarUrl: 'https://picsum.photos/seed/admin-avatar/100' },
        content: values.message,
        audience: values.audience,
        sentAt: format(new Date(), 'yyyy-MM-dd h:mm a'),
        views: 0,
        totalRecipients: 1800, // Mock total
        category: values.category as AnnouncementCategory,
    };
    setPastAnnouncements(prev => [newAnnouncement, ...prev]);
    form.reset();
    toast({
        title: 'Announcement Sent!',
        description: 'Your message has been broadcast to the selected audience.',
    });
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
       <div className="mb-6">
        <h1 className="font-headline text-3xl font-bold flex items-center gap-2"><Megaphone className="h-8 w-8 text-primary"/>School-Wide Announcements</h1>
        <p className="text-muted-foreground">Broadcast messages to the entire school community.</p>
       </div>

       <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
            <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Send className="h-6 w-6 text-primary"/>Compose New Announcement</CardTitle>
                    <CardDescription>Draft and send a new broadcast message to selected groups.</CardDescription>
                </CardHeader>
                  <CardContent className="space-y-6">
                      <FormField
                        control={form.control}
                        name="message"
                        render={({ field }) => (
                            <FormItem>
                                <div className="flex items-center justify-between">
                                    <FormLabel>Message</FormLabel>
                                    <Button type="button" variant="outline" size="sm" onClick={handleTranslate}>
                                    <Languages className="mr-2 h-4 w-4" />
                                    Translate with AI
                                    </Button>
                                </div>
                                <FormControl>
                                    <Textarea placeholder="Type your announcement here..." className="min-h-[150px]" {...field} />
                                </FormControl>
                                <FormDescription>
                                    Use the AI to translate your message into multiple languages like Swahili.
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                       />
                      <div className="space-y-2">
                          <Label>File Attachments</Label>
                          <div className="flex items-center justify-center w-full">
                              <Label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted/50 hover:bg-muted">
                                  <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center">
                                      <Paperclip className="w-8 h-8 mb-2 text-muted-foreground" />
                                      <p className="mb-2 text-sm text-muted-foreground">Attach files, images, or newsletters</p>
                                      <p className="text-xs text-muted-foreground">(PDF, JPG, etc.)</p>
                                  </div>
                                  <Input id="dropzone-file" type="file" className="hidden" disabled />
                              </Label>
                          </div>
                          <FormDescription>
                            Attachment feature is coming soon.
                          </FormDescription>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField
                                control={form.control}
                                name="audience"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Audience</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select target groups" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="All Students, Parents & Staff">All Students, Parents & Staff</SelectItem>
                                            <SelectItem value="All Students">All Students</SelectItem>
                                            <SelectItem value="All Parents">All Parents</SelectItem>
                                            <SelectItem value="All Staff">All Staff</SelectItem>
                                            <SelectItem value="specific-classes">Specific Classes (coming soon)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                           <FormField
                                control={form.control}
                                name="category"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Category</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select a category" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {Object.entries(announcementCategories).map(([key, {label}]) => (
                                                <SelectItem key={key} value={key}>{label}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                      </div>
                       <div className="space-y-2">
                              <div className="flex items-center space-x-2 mb-2">
                                  <Switch id="schedule-send" checked={isScheduling} onCheckedChange={setIsScheduling} />
                                  <Label htmlFor="schedule-send">Schedule for later</Label>
                              </div>
                              {isScheduling && (
                                  <Popover>
                                      <PopoverTrigger asChild>
                                      <Button
                                        variant={"outline"}
                                        className={cn(
                                          "w-full justify-start text-left font-normal",
                                          !scheduledDate && "text-muted-foreground"
                                        )}
                                      >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {scheduledDate ? format(scheduledDate, "PPP 'at' h:mm a") : <span>Pick a date and time</span>}
                                      </Button>
                                      </PopoverTrigger>
                                      <PopoverContent className="w-auto p-0">
                                        <Calendar
                                          mode="single"
                                          selected={scheduledDate}
                                          onSelect={setScheduledDate}
                                          initialFocus
                                          disabled={(date) => date < new Date()}
                                        />
                                        <div className="p-3 border-t border-border">
                                          <Input type="time" defaultValue={scheduledDate ? format(scheduledDate, "HH:mm") : format(new Date(), "HH:mm")} className="w-full" />
                                        </div>
                                      </PopoverContent>
                                  </Popover>
                              )}
                          </div>
                        <Separator />
                      <div className="space-y-4">
                          <Alert>
                              <Bell className="h-4 w-4" />
                              <AlertTitle>Notification Channels</AlertTitle>
                              <AlertDescription>
                                  Choose how this announcement will be delivered. Additional charges may apply for SMS.
                              </AlertDescription>
                          </Alert>
                          <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-6">
                              <div className="flex items-center space-x-2">
                                  <Switch id="notify-app" defaultChecked />
                                  <Label htmlFor="notify-app">In-App Notification</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                  <Switch id="notify-email" />
                                  <Label htmlFor="notify-email">Send as Email</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                  <Switch id="notify-sms" />
                                  <Label htmlFor="notify-sms">Send as SMS</Label>
                              </div>
                          </div>
                      </div>
                  </CardContent>
                <CardFooter>
                    <Button type="submit">
                        <Send className="mr-2 h-4 w-4" />
                        {isScheduling ? 'Schedule Announcement' : 'Send Announcement'}
                    </Button>
                </CardFooter>
            </Card>
            </form>
            </Form>
        </div>
        <div className="lg:col-span-1">
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <History className="h-5 w-5 text-primary" />
                            Sent History
                        </CardTitle>
                         <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm" disabled>
                                    Export
                                    <ChevronDown className="ml-2 h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                                <DropdownMenuItem disabled><FileDown className="mr-2 h-4 w-4" />Export as PDF</DropdownMenuItem>
                                <DropdownMenuItem disabled><Archive className="mr-2 h-4 w-4" />Archive All</DropdownMenuItem>
                            </DropdownMenuContent>
                         </DropdownMenu>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    {pastAnnouncements.map((ann) => (
                        <div key={ann.id}>
                            <div className="space-y-3">
                                 <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-9 w-9">
                                            <AvatarImage src={ann.sender.avatarUrl} alt={ann.sender.name} />
                                            <AvatarFallback>{ann.sender.name.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="text-sm font-semibold">{ann.sender.name}</p>
                                            <p className="text-xs text-muted-foreground">To: {ann.audience}</p>
                                        </div>
                                    </div>
                                    <Badge className={cn(announcementCategories[ann.category].color, 'ml-auto')}>
                                        {announcementCategories[ann.category].label}
                                    </Badge>
                                </div>

                                <p className="text-sm leading-relaxed pl-12">{ann.content}</p>
                                
                                <div className="text-xs text-muted-foreground flex items-center justify-end">
                                    <span>{ann.sentAt}</span>
                                </div>

                                <Separator className="my-2"/>
                                 <div className="flex items-center justify-between text-xs text-muted-foreground pl-12">
                                    <div className="flex items-center gap-2" title="Views">
                                        <Eye className="h-4 w-4" />
                                        <span className="font-medium">{ann.totalRecipients > 0 ? Math.round((ann.views / ann.totalRecipients) * 100) : 0}% view rate</span>
                                    </div>
                                    <Button asChild variant="link" size="sm" className="h-auto p-0 text-xs" disabled>
                                        <Link href="#">
                                            View Stats
                                            <ArrowRight className="ml-1 h-3 w-3" />
                                        </Link>
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>
        </div>
       </div>
    </div>
  );
}


    