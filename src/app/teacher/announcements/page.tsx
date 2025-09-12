

'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { format } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Megaphone, Send, History, Bell, Calendar as CalendarIcon, Clock, Paperclip, Eye, CheckCircle, Users, ArrowRight, Languages } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Form, FormDescription } from '@/components/ui/form';
import Link from 'next/link';

const pastAnnouncements = [
    {
        id: 'ann-1',
        content: 'Reminder: Staff meeting today at 3:00 PM in the staff room. Please be punctual.',
        audience: 'All Staff',
        sentAt: '2024-07-18 09:00 AM',
        views: 28,
        totalRecipients: 30,
        acknowledgements: 15,
    },
    {
        id: 'ann-2',
        content: 'The school will be closed tomorrow for the public holiday. Classes will resume on Friday.',
        audience: 'All Students, All Parents',
        sentAt: '2024-07-17 02:30 PM',
        views: 850,
        totalRecipients: 900,
        acknowledgements: 0, // Not required for this type
    }
];

export default function AnnouncementsPage() {
  const [isScheduling, setIsScheduling] = React.useState(false);
  const [scheduledDate, setScheduledDate] = React.useState<Date | undefined>();
  const form = useForm();

  return (
    <div className="p-4 sm:p-6 lg:p-8">
       <div className="mb-6">
        <h1 className="font-headline text-3xl font-bold flex items-center gap-2"><Megaphone className="h-8 w-8 text-primary"/>Announcements</h1>
        <p className="text-muted-foreground">Broadcast messages to students, parents, and staff.</p>
       </div>

       <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
            <Card>
                <CardHeader>
                    <CardTitle>Compose New Announcement</CardTitle>
                    <CardDescription>Draft and send a new broadcast message.</CardDescription>
                </CardHeader>
                <Form {...form}>
                  <CardContent className="space-y-6">
                      <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label htmlFor="message">Message</Label>
                            <Button variant="outline" size="sm" disabled>
                              <Languages className="mr-2 h-4 w-4" />
                              Translate
                            </Button>
                          </div>
                          <Textarea id="message" placeholder="Type your announcement here..." className="min-h-[150px]" />
                           <FormDescription>
                            The AI can translate your message into multiple languages. This feature is coming soon.
                          </FormDescription>
                      </div>
                      <div className="space-y-2">
                          <Label>File Attachments</Label>
                          <div className="flex items-center justify-center w-full">
                              <Label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted/50 hover:bg-muted">
                                  <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center">
                                      <Paperclip className="w-8 h-8 mb-2 text-muted-foreground" />
                                      <p className="mb-2 text-sm text-muted-foreground">Attach files, images, or videos</p>
                                      <p className="text-xs text-muted-foreground">(PDF, JPG, MP4, etc.)</p>
                                  </div>
                                  <Input id="dropzone-file" type="file" className="hidden" disabled />
                              </Label>
                          </div>
                          <FormDescription>
                            This feature is coming soon.
                          </FormDescription>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                              <Label htmlFor="audience">Audience</Label>
                              <Select disabled>
                                  <SelectTrigger id="audience">
                                      <SelectValue placeholder="Select target groups" />
                                  </SelectTrigger>
                                  <SelectContent>
                                      <SelectItem value="all">All Students, Parents & Staff</SelectItem>
                                      <SelectItem value="all-students">All Students</SelectItem>
                                      <SelectItem value="all-parents">All Parents</SelectItem>
                                      <SelectItem value="all-staff">All Staff</SelectItem>
                                  </SelectContent>
                              </Select>
                              <p className="text-xs text-muted-foreground">Multi-group selection coming soon.</p>
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
                      </div>
                        <Separator />
                      <div className="space-y-4">
                          <Alert>
                              <Bell className="h-4 w-4" />
                              <AlertTitle>Notification Channels</AlertTitle>
                              <AlertDescription>
                                  Choose how this announcement will be delivered.
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
                </Form>
                <CardFooter>
                    <Button>
                        <Send className="mr-2 h-4 w-4" />
                        {isScheduling ? 'Schedule Announcement' : 'Send Announcement'}
                    </Button>
                </CardFooter>
            </Card>
        </div>
        <div className="lg:col-span-1">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <History className="h-5 w-5 text-primary" />
                        Sent History
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    {pastAnnouncements.map((ann, index) => (
                        <div key={ann.id}>
                            <div className="space-y-3">
                                <p className="text-sm leading-relaxed">{ann.content}</p>
                                <div className="text-xs text-muted-foreground flex items-center justify-between">
                                    <span>To: <span className="font-medium">{ann.audience}</span></span>
                                    <span>{ann.sentAt}</span>
                                </div>
                                <Separator className="my-2"/>
                                 <div className="flex items-center justify-between text-xs text-muted-foreground">
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center gap-1.5" title="Views">
                                            <Eye className="h-4 w-4" />
                                            <span className="font-medium">{Math.round((ann.views / ann.totalRecipients) * 100)}% viewed</span>
                                        </div>
                                         {ann.acknowledgements > 0 && (
                                            <div className="flex items-center gap-1.5" title="Acknowledged">
                                                <CheckCircle className="h-4 w-4" />
                                                <span className="font-medium">{ann.acknowledgements} acknowledged</span>
                                            </div>
                                         )}
                                    </div>
                                    <Button asChild variant="link" size="sm" className="h-auto p-0 text-xs">
                                        <Link href="#">
                                            View Details
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
