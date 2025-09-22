
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
import { Megaphone, Send, History, Bell, Calendar as CalendarIcon, Clock, Paperclip, Loader2, X, CheckCircle, MoreHorizontal } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from '@/components/ui/form';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { translateText } from '@/ai/flows/translate-text';
import { firestore, storage, auth } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, query, orderBy, onSnapshot, where, Timestamp, limit, startAfter, getDocs, doc, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';


type AnnouncementCategory = 'Urgent' | 'Academic' | 'Event' | 'General';

const announcementCategories: Record<AnnouncementCategory, { label: string; color: string;}> = {
    Urgent: { label: 'Urgent Alert', color: 'bg-red-500 border-red-500 text-white' },
    Academic: { label: 'Academic', color: 'bg-blue-500 border-blue-500 text-white' },
    Event: { label: 'Event', color: 'bg-purple-500 border-purple-500 text-white' },
    General: { label: 'General Info', color: 'bg-gray-500 border-gray-500 text-white' },
};

type Announcement = {
    id: string;
    sender: { id?: string; name: string; avatarUrl: string };
    content: string;
    title: string;
    audience: string;
    sentAt: Timestamp;
    category: AnnouncementCategory;
    attachmentUrl?: string;
    attachmentName?: string;
    readBy?: string[];
};

const announcementSchema = z.object({
    title: z.string().min(5, 'Title must be at least 5 characters long.'),
    message: z.string().min(10, 'Message must be at least 10 characters.'),
    audience: z.string({ required_error: 'Please select an audience.' }),
    category: z.string({ required_error: 'Please select a category.' }),
});

type AnnouncementFormValues = z.infer<typeof announcementSchema>;

function AnnouncementCard({ announcement }: { announcement: Announcement }) {
    const { toast } = useToast();
    
    const handleAttachmentClick = (attachmentUrl: string, fileName: string) => {
        window.open(attachmentUrl, '_blank');
        toast({
            title: 'Downloading Attachment',
            description: `Your download for "${fileName}" will start shortly.`,
        });
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-start justify-between gap-4">
                <div className="flex-1">
                    <CardTitle className="font-headline text-xl flex items-center gap-2">
                        {announcement.title}
                    </CardTitle>
                    <CardDescription>Posted: {announcement.sentAt?.toDate().toLocaleString()}</CardDescription>
                </div>
                <Badge className={cn('whitespace-nowrap', announcementCategories[announcement.category as AnnouncementCategory]?.color)}>
                    {announcementCategories[announcement.category as AnnouncementCategory]?.label}
                </Badge>
            </CardHeader>
            <CardContent className="space-y-4">
                <p className="text-sm leading-relaxed">{announcement.content}</p>

                {announcement.attachmentUrl && announcement.attachmentName && (
                    <div>
                        <h4 className="font-semibold text-sm mb-2">Attachments</h4>
                        <div className="space-y-2">
                            <Button variant="outline" size="sm" className="w-full justify-start" onClick={() => handleAttachmentClick(announcement.attachmentUrl!, announcement.attachmentName!)}>
                                <Paperclip className="mr-2 h-4 w-4"/>
                                {announcement.attachmentName}
                            </Button>
                        </div>
                    </div>
                )}

                <Separator />
                <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                        <AvatarImage src={announcement.sender.avatarUrl} alt={announcement.sender.name} />
                        <AvatarFallback>{announcement.sender.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                        <p className="text-xs font-semibold">Sent by {announcement.sender.name}</p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

export default function AnnouncementsPage() {
  const searchParams = useSearchParams();
  const schoolId = searchParams.get('schoolId');
  const { user } = useAuth();
  const [isScheduling, setIsScheduling] = React.useState(false);
  const [scheduledDate, setScheduledDate] = React.useState<Date | undefined>();
  const [myAnnouncements, setMyAnnouncements] = React.useState<Announcement[]>([]);
  const [allAnnouncements, setAllAnnouncements] = React.useState<Announcement[]>([]);
  const [isTranslating, setIsTranslating] = React.useState(false);
  const [attachedFile, setAttachedFile] = React.useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [teacherClasses, setTeacherClasses] = React.useState<{id: string, name: string}[]>([]);
  const [isLoadingAll, setIsLoadingAll] = React.useState(true);
  const [lastVisible, setLastVisible] = React.useState<any>(null);
  const [hasMore, setHasMore] = React.useState(true);
  const [isLoadingMore, setIsLoadingMore] = React.useState(false);

  const form = useForm<AnnouncementFormValues>({
    resolver: zodResolver(announcementSchema),
    defaultValues: {
        title: '',
        message: '',
        audience: '',
        category: 'General',
    }
  });
  const { toast } = useToast();

   React.useEffect(() => {
    if (!schoolId || !user) return;

    // Fetch announcements sent by current teacher
    const myQuery = query(collection(firestore, 'schools', schoolId, 'announcements'), where('sender.id', '==', user.uid), orderBy('sentAt', 'desc'));
    const unsubMy = onSnapshot(myQuery, (snapshot) => {
        setMyAnnouncements(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Announcement)));
    });

    // Fetch all announcements initially
    setIsLoadingAll(true);
    const allQuery = query(collection(firestore, `schools/${schoolId}/announcements`), orderBy('sentAt', 'desc'), limit(5));
    const unsubAll = onSnapshot(allQuery, (snapshot) => {
        const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Announcement));
        setAllAnnouncements(fetched);
        setLastVisible(snapshot.docs[snapshot.docs.length - 1]);
        setHasMore(snapshot.docs.length === 5);
        setIsLoadingAll(false);
    });

    // Fetch teacher's classes for the audience dropdown
    const classesQuery = query(collection(firestore, `schools/${schoolId}/classes`), where('teacherId', '==', user.uid));
    const unsubClasses = onSnapshot(classesQuery, (snapshot) => {
        setTeacherClasses(snapshot.docs.map(doc => ({ id: doc.id, name: `${doc.data().name} ${doc.data().stream || ''}`.trim() })));
    });

    return () => {
      unsubMy();
      unsubAll();
      unsubClasses();
    };
  }, [schoolId, user]);

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
        setAllAnnouncements(prev => [...prev, ...newAnnouncements]);
        setLastVisible(documentSnapshots.docs[documentSnapshots.docs.length - 1]);
        setHasMore(newAnnouncements.length === 5);
    } else {
        setHasMore(false);
        toast({ description: 'No more announcements to load.' });
    }
    setIsLoadingMore(false);
  };

  const handleTranslate = async () => {
    const message = form.getValues('message');
    if (!message) {
      toast({ variant: 'destructive', title: 'No Message to Translate' });
      return;
    }
    setIsTranslating(true);
    try {
      const result = await translateText({ text: message, targetLanguage: 'Swahili' });
      if (result && result.translatedText) {
        form.setValue('message', result.translatedText);
        toast({ title: 'Translation Complete' });
      } else { throw new Error('AI did not return translated text.'); }
    } catch(e) {
      console.error(e);
      toast({ variant: 'destructive', title: 'Translation Failed' });
    } finally {
        setIsTranslating(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) setAttachedFile(event.target.files[0]);
  };

  const handleRemoveFile = () => setAttachedFile(null);

  async function onSubmit(values: AnnouncementFormValues) {
    if (!schoolId || !user) {
        toast({ title: 'Error', description: 'Authentication or School ID is missing.', variant: 'destructive'});
        return;
    }
    setIsSubmitting(true);
    let attachmentUrl, attachmentName;

    try {
      if (attachedFile) {
        const storageRef = ref(storage, `schools/${schoolId}/announcements/${Date.now()}_${attachedFile.name}`);
        const uploadTask = await uploadBytes(storageRef, attachedFile);
        attachmentUrl = await getDownloadURL(uploadTask.ref);
        attachmentName = attachedFile.name;
      }
      
      const userDocRef = doc(firestore, 'schools', schoolId, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);
      const teacherName = userDoc.exists() ? userDoc.data().name : user.displayName || 'Teacher';

      const newAnnouncement = {
          title: values.title,
          content: values.message,
          audience: values.audience,
          category: values.category as AnnouncementCategory,
          sender: { id: user.uid, name: teacherName, avatarUrl: user.photoURL || `https://picsum.photos/seed/${user.uid}/100` },
          sentAt: scheduledDate ? Timestamp.fromDate(scheduledDate) : serverTimestamp(),
          readBy: [],
          readCount: 0,
          channels: { app: true, email: false, sms: false },
          ...(attachmentUrl && { attachmentUrl, attachmentName }),
      };

      await addDoc(collection(firestore, 'schools', schoolId, 'announcements'), newAnnouncement);
      
      let notificationAudience = 'all'; // Default
      if (values.audience.includes('Parents')) {
        notificationAudience = 'parent';
      } else if (values.audience.includes('Students')) {
        notificationAudience = 'student';
      }
      
      await addDoc(collection(firestore, `schools/${schoolId}/notifications`), {
          title: `New Announcement: ${values.title}`,
          description: `From ${teacherName}: ${values.message.substring(0, 100)}`,
          createdAt: serverTimestamp(),
          category: 'Communication',
          href: `/parent/announcements?schoolId=${schoolId}`,
          audience: notificationAudience,
      });

      form.reset();
      setAttachedFile(null);
      
      toast({
        title: scheduledDate ? 'Announcement Scheduled!' : 'Announcement Sent!',
        description: scheduledDate
          ? `Your message will be sent on ${format(scheduledDate, 'PPP')} at ${format(scheduledDate, 'h:mm a')}.`
          : 'Your message has been broadcast to the selected audience.',
      });
      setIsScheduling(false);
      setScheduledDate(undefined);
    } catch (error) {
      console.error('Error submitting announcement', error);
      toast({ title: 'Submission Failed', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!schoolId) return <div className="p-8">Error: School ID missing from URL.</div>

  return (
    <div className="md:-m-4 md:p-4">
       <div className="mb-6 p-4 md:p-6 bg-card-border/20 rounded-lg md:bg-transparent md:p-0">
        <h1 className="font-headline text-3xl font-bold flex items-center gap-2"><Megaphone className="h-8 w-8 text-primary"/>Announcements</h1>
        <p className="text-muted-foreground">Broadcast messages to students, parents, and staff.</p>
       </div>
       
       <Tabs defaultValue="all" className="w-full">
            <TabsList>
                <TabsTrigger value="all">All Announcements</TabsTrigger>
                <TabsTrigger value="compose">Compose New</TabsTrigger>
                <TabsTrigger value="history">My History</TabsTrigger>
            </TabsList>
            <TabsContent value="all" className="mt-4">
                <Card>
                    <CardHeader><CardTitle>School-Wide Announcements</CardTitle><CardDescription>A feed of all announcements from teachers and administrators.</CardDescription></CardHeader>
                    <CardContent className="space-y-6">
                    {isLoadingAll ? (
                        <div className="flex justify-center p-16"><Loader2 className="h-8 w-8 animate-spin"/></div>
                    ) : allAnnouncements.length > 0 ? (
                        allAnnouncements.map(ann => <AnnouncementCard key={ann.id} announcement={ann} />)
                    ) : (
                        <p className="text-muted-foreground text-center py-8">No announcements to display.</p>
                    )}
                    </CardContent>
                    {hasMore && (
                      <CardFooter>
                          <Button variant="outline" className="w-full" onClick={handleLoadMore} disabled={isLoadingMore || !hasMore}>
                              {isLoadingMore ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <MoreHorizontal className="mr-2 h-4 w-4" />}
                              {hasMore ? 'Load More' : 'No More Announcements'}
                          </Button>
                      </CardFooter>
                    )}
                </Card>
            </TabsContent>
            <TabsContent value="compose" className="mt-4">
                <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)}>
                <Card>
                    <CardHeader><CardTitle className="flex items-center gap-2"><Send className="h-6 w-6 text-primary"/>Compose New Announcement</CardTitle><CardDescription>Draft and send a new broadcast message.</CardDescription></CardHeader>
                      <CardContent className="space-y-6">
                           <FormField control={form.control} name="title" render={({ field }) => (<FormItem><FormLabel>Title</FormLabel><FormControl><Input placeholder="e.g., Reminder about upcoming CAT" {...field} /></FormControl><FormMessage /></FormItem>)} />
                           <FormField control={form.control} name="message" render={({ field }) => (<FormItem>
                               <div className="flex items-center justify-between"><FormLabel>Message</FormLabel></div>
                               <FormControl><Textarea placeholder="Type your announcement here..." className="min-h-[150px]" {...field} /></FormControl>
                               <FormMessage />
                           </FormItem>)} />
                          <div className="space-y-2">
                              <Label>File Attachments</Label>
                               {attachedFile ? (
                                    <div className="w-full p-4 rounded-lg border bg-muted/50 flex items-center justify-between">
                                      <div className="flex items-center gap-2 text-sm font-medium"><Paperclip className="h-5 w-5 text-primary" /><span className="truncate">{attachedFile.name}</span></div>
                                      <Button variant="ghost" size="icon" onClick={handleRemoveFile} className="h-6 w-6"><X className="h-4 w-4 text-destructive" /></Button>
                                  </div>
                              ) : (
                                <Label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted/50 hover:bg-muted">
                                    <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center"><Paperclip className="w-8 h-8 mb-2 text-muted-foreground" /><p className="mb-2 text-sm text-muted-foreground">Attach files, images, or videos</p></div>
                                    <Input id="dropzone-file" type="file" className="hidden" onChange={handleFileChange} />
                                </Label>
                              )}
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <FormField control={form.control} name="audience" render={({ field }) => (<FormItem><FormLabel>Audience</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl><SelectTrigger><SelectValue placeholder="Select target groups" /></SelectTrigger></FormControl>
                                    <SelectContent>
                                        <SelectItem value="All My Students">All My Students</SelectItem>
                                        {teacherClasses.map(c => (<SelectItem key={c.id} value={c.name}>{c.name} - Students</SelectItem>))}
                                         {teacherClasses.map(c => (<SelectItem key={`${c.id}-parents`} value={`${c.name}-parents`}>{c.name} - Parents</SelectItem>))}
                                    </SelectContent>
                                </Select><FormMessage /></FormItem>)} />
                               <FormField control={form.control} name="category" render={({ field }) => (<FormItem><FormLabel>Category</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl><SelectTrigger><SelectValue placeholder="Select a category" /></SelectTrigger></FormControl>
                                    <SelectContent>{Object.entries(announcementCategories).map(([key, {label}]) => (<SelectItem key={key} value={key}>{label}</SelectItem>))}</SelectContent>
                                </Select><FormMessage /></FormItem>)} />
                          </div>
                           <div className="space-y-2">
                                <div className="flex items-center space-x-2 mb-2"><Switch id="schedule-send" checked={isScheduling} onCheckedChange={setIsScheduling} /><Label htmlFor="schedule-send">Schedule for later</Label></div>
                                  {isScheduling && (<Popover>
                                      <PopoverTrigger asChild><Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !scheduledDate && "text-muted-foreground")}><CalendarIcon className="mr-2 h-4 w-4" />{scheduledDate ? format(scheduledDate, "PPP 'at' h:mm a") : <span>Pick a date and time</span>}</Button></PopoverTrigger>
                                      <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={scheduledDate} onSelect={setScheduledDate} initialFocus disabled={(date) => date < new Date()}/>
                                          <div className="p-3 border-t border-border"><div className="flex items-center gap-2"><Clock className="h-4 w-4 text-muted-foreground"/><Label>Time</Label></div><div className="flex items-center gap-2 mt-2"><Input type="time" defaultValue={scheduledDate ? format(scheduledDate, "HH:mm") : format(new Date(), "HH:mm")} className="w-full" /></div></div>
                                      </PopoverContent>
                                  </Popover>)}
                            </div>
                      </CardContent>
                    <CardFooter>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Send className="mr-2 h-4 w-4" />}
                            {isScheduling ? 'Schedule Announcement' : 'Send Announcement'}
                        </Button>
                    </CardFooter>
                </Card>
                </form>
                </Form>
            </TabsContent>
            <TabsContent value="history" className="mt-4">
                <Card>
                    <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><History className="h-5 w-5 text-primary" />My Sent History</CardTitle></CardHeader>
                    <CardContent className="space-y-6">
                        {myAnnouncements.map((ann) => (<div key={ann.id}><div className="space-y-3"><p className="text-sm font-semibold">{ann.title}</p><p className="text-sm leading-relaxed text-muted-foreground">{ann.content}</p><div className="text-xs text-muted-foreground flex items-center justify-between"><span>To: {ann.audience}</span><span>{ann.sentAt?.toDate().toLocaleString()}</span></div></div><Separator className="mt-4"/></div>))}
                        {myAnnouncements.length === 0 && (<div className="text-center py-8 text-muted-foreground"><p>You haven't sent any announcements yet.</p></div>)}
                    </CardContent>
                </Card>
            </TabsContent>
       </Tabs>
    </div>
  );
}
