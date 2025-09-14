
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
import { Megaphone, Send, History, Bell, Calendar as CalendarIcon, Clock, Paperclip, Eye, CheckCircle, Users, ArrowRight, Languages, ChevronDown, FileDown, Archive, Tag, Loader2, X } from 'lucide-react';
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
import { translateText } from '@/ai/flows/translate-text';
import { firestore, storage } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, query, orderBy, onSnapshot, where, Timestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

type AnnouncementCategory = 'Urgent' | 'Academic' | 'Event' | 'General';

const announcementCategories: Record<AnnouncementCategory, { label: string; color: string;}> = {
    Urgent: { label: 'Urgent Alert', color: 'bg-red-500 border-red-500 text-white' },
    Academic: { label: 'Academic', color: 'bg-blue-500 border-blue-500 text-white' },
    Event: { label: 'Event', color: 'bg-purple-500 border-purple-500 text-white' },
    General: { label: 'General Info', color: 'bg-gray-500 border-gray-500 text-white' },
};

type Announcement = {
    id: string;
    sender: { name: string; avatarUrl: string };
    content: string;
    title: string;
    audience: string;
    sentAt: Timestamp;
    category: AnnouncementCategory;
};

const announcementSchema = z.object({
    title: z.string().min(5, 'Title must be at least 5 characters long.'),
    message: z.string().min(10, 'Message must be at least 10 characters.'),
    audience: z.string({ required_error: 'Please select an audience.' }),
    category: z.nativeEnum(Object.keys(announcementCategories) as [AnnouncementCategory]),
});

type AnnouncementFormValues = z.infer<typeof announcementSchema>;

export default function AnnouncementsPage() {
  const [isScheduling, setIsScheduling] = React.useState(false);
  const [scheduledDate, setScheduledDate] = React.useState<Date | undefined>();
  const [pastAnnouncements, setPastAnnouncements] = React.useState<Announcement[]>([]);
  const [isTranslating, setIsTranslating] = React.useState(false);
  const [attachedFile, setAttachedFile] = React.useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<AnnouncementFormValues>({
    resolver: zodResolver(announcementSchema),
    defaultValues: {
        title: '',
        message: '',
    }
  });
  const { toast } = useToast();

   React.useEffect(() => {
    const q = query(collection(firestore, 'announcements'), where('sender.name', '==', 'Ms. Wanjiku'), orderBy('sentAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
        const fetchedAnnouncements = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Announcement));
        setPastAnnouncements(fetchedAnnouncements);
    });
    return () => unsubscribe();
  }, []);

  const handleTranslate = async () => {
    const message = form.getValues('message');
    if (!message) {
      toast({
        variant: 'destructive',
        title: 'No Message to Translate',
        description: 'Please type a message before using the AI translation.',
      });
      return;
    }
    
    setIsTranslating(true);
    try {
      const result = await translateText({ text: message, targetLanguage: 'Swahili' });
      if (result && result.translatedText) {
        form.setValue('message', result.translatedText);
        toast({
          title: 'Translation Complete',
          description: 'The message has been translated to Swahili.',
        });
      } else {
         throw new Error('AI did not return translated text.');
      }
    } catch(e) {
      console.error(e);
      toast({
        variant: 'destructive',
        title: 'Translation Failed',
        description: 'The AI could not translate the message.',
      });
    } finally {
        setIsTranslating(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setAttachedFile(event.target.files[0]);
    }
  };

  const handleRemoveFile = () => {
    setAttachedFile(null);
  };

  async function onSubmit(values: AnnouncementFormValues) {
    setIsSubmitting(true);
    let attachmentUrl, attachmentName;

    try {
      if (attachedFile) {
        const storageRef = ref(storage, `announcements/${Date.now()}_${attachedFile.name}`);
        const uploadTask = await uploadBytes(storageRef, attachedFile);
        attachmentUrl = await getDownloadURL(uploadTask.ref);
        attachmentName = attachedFile.name;
      }
      
      const newAnnouncement = {
          title: values.title,
          content: values.message,
          audience: values.audience,
          category: values.category,
          sender: { name: 'Ms. Wanjiku', avatarUrl: 'https://picsum.photos/seed/teacher-avatar/100' },
          sentAt: scheduledDate ? Timestamp.fromDate(scheduledDate) : serverTimestamp(),
          readBy: [],
          readCount: 0,
          channels: { app: true, email: false, sms: false }, // Default channels for teacher
          ...(attachmentUrl && { attachmentUrl, attachmentName }),
      };

      await addDoc(collection(firestore, 'announcements'), newAnnouncement);
      
      form.reset();
      setAttachedFile(null);
      
      if (isScheduling && scheduledDate) {
          toast({
              title: 'Announcement Scheduled!',
              description: `Your message will be sent on ${format(scheduledDate, 'PPP')} at ${format(scheduledDate, 'h:mm a')}.`,
          });
      } else {
          toast({
              title: 'Announcement Sent!',
              description: 'Your message has been broadcast to the selected audience.',
          });
      }
      setIsScheduling(false);
      setScheduledDate(undefined);
    } catch (error) {
      console.error('Error submitting announcement', error);
      toast({ title: 'Submission Failed', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
       <div className="mb-6">
        <h1 className="font-headline text-3xl font-bold flex items-center gap-2"><Megaphone className="h-8 w-8 text-primary"/>Announcements</h1>
        <p className="text-muted-foreground">Broadcast messages to students, parents, and staff.</p>
       </div>

       <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
            <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Send className="h-6 w-6 text-primary"/>Compose New Announcement</CardTitle>
                    <CardDescription>Draft and send a new broadcast message.</CardDescription>
                </CardHeader>
                  <CardContent className="space-y-6">
                       <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Title</FormLabel>
                                <FormControl>
                                    <Input placeholder="e.g., Reminder about upcoming CAT" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                       />
                      <FormField
                        control={form.control}
                        name="message"
                        render={({ field }) => (
                            <FormItem>
                                <div className="flex items-center justify-between">
                                    <FormLabel>Message</FormLabel>
                                    <Button type="button" variant="outline" size="sm" onClick={handleTranslate} disabled={isTranslating}>
                                    {isTranslating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Languages className="mr-2 h-4 w-4" />}
                                    Translate with AI
                                    </Button>
                                </div>
                                <FormControl>
                                    <Textarea placeholder="Type your announcement here..." className="min-h-[150px]" {...field} />
                                </FormControl>
                                <FormDescription>
                                    The AI can translate your message into multiple languages.
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                       />
                      <div className="space-y-2">
                          <Label>File Attachments</Label>
                           {attachedFile ? (
                                <div className="w-full p-4 rounded-lg border bg-muted/50 flex items-center justify-between">
                                  <div className="flex items-center gap-2 text-sm font-medium">
                                      <Paperclip className="h-5 w-5 text-primary" />
                                      <span className="truncate">{attachedFile.name}</span>
                                  </div>
                                  <Button variant="ghost" size="icon" onClick={handleRemoveFile} className="h-6 w-6">
                                      <X className="h-4 w-4 text-destructive" />
                                  </Button>
                              </div>
                          ) : (
                            <Label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted/50 hover:bg-muted">
                                <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center">
                                    <Paperclip className="w-8 h-8 mb-2 text-muted-foreground" />
                                    <p className="mb-2 text-sm text-muted-foreground">Attach files, images, or videos</p>
                                    <p className="text-xs text-muted-foreground">(PDF, JPG, MP4, etc.)</p>
                                </div>
                                <Input id="dropzone-file" type="file" className="hidden" onChange={handleFileChange} />
                            </Label>
                          )}
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
                                            <SelectItem value="All My Students">All My Students</SelectItem>
                                            <SelectItem value="form-4-chem">Form 4 - Chemistry Students</SelectItem>
                                            <SelectItem value="form-4-chem-parents">Form 4 - Chemistry Parents</SelectItem>
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
                                                <SelectItem key={key} value={key as AnnouncementCategory}>{label}</SelectItem>
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
                                          <div className="flex items-center gap-2">
                                            <Clock className="h-4 w-4 text-muted-foreground"/>
                                            <Label>Time</Label>
                                          </div>
                                          <div className="flex items-center gap-2 mt-2">
                                              <Input type="time" defaultValue={scheduledDate ? format(scheduledDate, "HH:mm") : format(new Date(), "HH:mm")} className="w-full" />
                                          </div>
                                        </div>
                                      </PopoverContent>
                                  </Popover>
                              )}
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
        </div>
        <div className="lg:col-span-1">
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <History className="h-5 w-5 text-primary" />
                            My Sent History
                        </CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    {pastAnnouncements.map((ann) => (
                        <div key={ann.id}>
                            <div className="space-y-3">
                                <p className="text-sm font-semibold">{ann.title}</p>
                                <p className="text-sm leading-relaxed text-muted-foreground">{ann.content}</p>
                                <div className="text-xs text-muted-foreground flex items-center justify-between">
                                    <span>To: {ann.audience}</span>
                                    <span>{ann.sentAt?.toDate().toLocaleString()}</span>
                                </div>
                            </div>
                             <Separator className="mt-4"/>
                        </div>
                    ))}
                    {pastAnnouncements.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground">
                            <p>You haven't sent any announcements yet.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
       </div>
    </div>
  );
}

