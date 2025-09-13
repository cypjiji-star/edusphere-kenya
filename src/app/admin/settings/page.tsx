
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Settings, Save, Bell, Shield, Book, Clock, Link as LinkIcon, Download, KeyRound, Globe, Languages, Edit, ArrowRight, Database, Archive, Mail, RefreshCcw, LayoutDashboard, Brush, AlertCircle, History, Wand2 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';

const recentChanges = [
    { user: 'Admin User', change: 'Enabled self-registration for parents.', date: '2024-07-28 10:05 AM' },
    { user: 'Principal Jane', change: 'Updated the current academic term to Term 3.', date: '2024-07-27 02:00 PM' },
    { user: 'Admin User', change: 'Set idle session timeout to 15 minutes.', date: '2024-07-26 09:30 AM' },
];

export default function SettingsPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="font-headline text-3xl font-bold flex items-center gap-2">
            <Settings className="h-8 w-8 text-primary"/>
            System Settings
        </h1>
        <p className="text-muted-foreground">Manage global settings for the school portal.</p>
      </div>

       <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle>General Settings</CardTitle>
                    <CardDescription>Global configuration for your school portal.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-4">
                        <Label className="text-base font-semibold">School Identity</Label>
                        <div className="flex items-center justify-between space-x-2 p-3 rounded-lg border">
                            <div>
                                <p className="font-medium">School Name & Motto</p>
                                <p className="text-xs text-muted-foreground">This is managed in the School Profile section.</p>
                            </div>
                            <Button asChild variant="secondary">
                                <Link href="/admin/profile">
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit Profile
                                </Link>
                            </Button>
                        </div>
                    </div>
                     <Separator/>
                    <div className="space-y-4">
                        <Label className="text-base font-semibold flex items-center gap-2">
                           <Globe className="h-5 w-5 text-primary"/> 
                           Localization
                        </Label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="timezone">Default Time Zone</Label>
                                <Select defaultValue="Africa/Nairobi" disabled>
                                    <SelectTrigger id="timezone">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Africa/Nairobi">GMT+3:00 (Nairobi)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="language">Default Language</Label>
                                <Select defaultValue="en-KE" disabled>
                                    <SelectTrigger id="language">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="en-KE">English (Kenya)</SelectItem>
                                        <SelectItem value="sw-KE">Swahili (Kenya)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>
                     <Separator/>
                     <div className="space-y-4">
                        <Label className="text-base font-semibold flex items-center gap-2">
                           <Book className="h-5 w-5 text-primary"/> 
                           Academics
                        </Label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="academic-year">Current Academic Year</Label>
                                <Select defaultValue="2024" disabled>
                                    <SelectTrigger id="academic-year">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="2024">2024</SelectItem>
                                        <SelectItem value="2025">2025</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="current-term">Current Term</Label>
                                <Select defaultValue="term-2" disabled>
                                    <SelectTrigger id="current-term">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="term-1">Term 1</SelectItem>
                                        <SelectItem value="term-2">Term 2</SelectItem>
                                        <SelectItem value="term-3">Term 3</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>
                </CardContent>
                <CardFooter>
                    <Button disabled>
                        <Save className="mr-2 h-4 w-4"/>
                        Save Settings
                    </Button>
                </CardFooter>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5 text-primary"/>User &amp; Access Control</CardTitle>
                    <CardDescription>Manage password policies, registration, and other security settings.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                     <div className="flex items-center justify-between space-x-2 p-3 rounded-lg border">
                        <div>
                            <Label htmlFor="password-policy" className="font-semibold">Password Policy</Label>
                            <p className="text-xs text-muted-foreground">Set minimum length and complexity for user passwords.</p>
                        </div>
                        <Button variant="secondary" disabled>
                            <KeyRound className="mr-2 h-4 w-4"/>
                            Set Policy
                        </Button>
                    </div>
                    <div className="flex items-center justify-between space-x-2 p-3 rounded-lg border">
                        <div>
                            <Label htmlFor="idle-timeout" className="font-semibold">Idle Session Timeout</Label>
                            <p className="text-xs text-muted-foreground">Automatically log out users after a period of inactivity.</p>
                        </div>
                         <Select defaultValue="30" disabled>
                            <SelectTrigger className="w-40">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="15">15 minutes</SelectItem>
                                <SelectItem value="30">30 minutes</SelectItem>
                                <SelectItem value="60">1 hour</SelectItem>
                                <SelectItem value="never">Never</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                     <div className="flex items-center justify-between space-x-2 p-3 rounded-lg border">
                        <div>
                            <Label htmlFor="self-registration" className="font-semibold">Enable Self-Registration</Label>
                            <p className="text-xs text-muted-foreground">Allow new parents and students to create their own accounts.</p>
                        </div>
                        <Switch id="self-registration" disabled />
                    </div>
                     <div className="flex items-center justify-between space-x-2 p-3 rounded-lg border">
                        <div>
                            <Label htmlFor="2fa" className="font-semibold">Two-Factor Authentication (2FA)</Label>
                            <p className="text-xs text-muted-foreground">Require a second verification step for admins and teachers.</p>
                        </div>
                        <Switch id="2fa" disabled />
                    </div>
                </CardContent>
            </Card>
            
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Bell className="h-5 w-5 text-primary"/>Automated Communication</CardTitle>
                    <CardDescription>Manage automated notifications for key system events.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-4 p-3 rounded-lg border">
                        <div className="flex items-center justify-between space-x-2">
                             <div>
                                <Label htmlFor="fee-alerts" className="font-semibold">Automated Fee Reminders</Label>
                                <p className="text-xs text-muted-foreground">Automatically notify parents about outstanding fee balances.</p>
                            </div>
                            <Switch id="fee-alerts" />
                        </div>
                        <Separator/>
                        <div className="space-y-4 pl-2">
                             <div className="grid w-full max-w-sm items-center gap-1.5">
                                <Label htmlFor="reminder-schedule">Sending Schedule</Label>
                                <div className="flex gap-2">
                                     <Select defaultValue="weekly">
                                        <SelectTrigger className="w-[120px]">
                                            <SelectValue/>
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="daily">Daily</SelectItem>
                                            <SelectItem value="weekly">Weekly</SelectItem>
                                        </SelectContent>
                                     </Select>
                                     <Select defaultValue="monday">
                                        <SelectTrigger className="w-[120px]">
                                            <SelectValue/>
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="monday">on Mondays</SelectItem>
                                            <SelectItem value="friday">on Fridays</SelectItem>
                                        </SelectContent>
                                     </Select>
                                </div>
                            </div>
                             <div className="grid w-full max-w-xs items-center gap-1.5">
                                <Label htmlFor="reminder-threshold">Send for balances overdue by</Label>
                                <div className="flex items-center gap-2">
                                <Input type="number" id="reminder-threshold" defaultValue={7} className="w-20" />
                                <span>days or more.</span>
                                </div>
                            </div>
                            <div className="grid w-full items-center gap-1.5">
                                <Label htmlFor="reminder-message">Reminder Message Template</Label>
                                <Textarea id="reminder-message" placeholder="Customize the message sent to parents." defaultValue="Dear Parent, this is a friendly reminder that a fee balance of {balance} for {studentName} is overdue. Please make a payment at your earliest convenience."/>
                                <p className="text-xs text-muted-foreground">Use placeholders like `'{'{studentName}'}'`, `'{'{balance}'}'`, and `'{'{dueDate}'}'`.</p>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center justify-between space-x-2 p-3 rounded-lg border">
                        <div>
                            <Label htmlFor="attendance-alerts" className="font-semibold">Low Attendance Alerts</Label>
                            <p className="text-xs text-muted-foreground">Notify administration when a class has low attendance.</p>
                        </div>
                        <Switch id="attendance-alerts" checked disabled />
                    </div>
                     <div className="flex items-center justify-between space-x-2 p-3 rounded-lg border">
                        <div>
                            <Label htmlFor="system-alerts" className="font-semibold">Critical System Notifications</Label>
                            <p className="text-xs text-muted-foreground">Alerts for storage limits, failed payments, etc.</p>
                        </div>
                        <Switch id="system-alerts" checked disabled />
                    </div>
                    <Separator/>
                     <div className="flex items-center justify-between space-x-2 p-3 rounded-lg border">
                        <div>
                            <Label className="font-semibold">Communication Channels</Label>
                            <p className="text-xs text-muted-foreground">Configure SMS, Email, and Push Notifications.</p>
                        </div>
                        <Button variant="secondary" disabled>
                            <LinkIcon className="mr-2 h-4 w-4"/>
                            Manage
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Wand2 className="h-5 w-5 text-primary"/>AI & Automation</CardTitle>
                    <CardDescription>Manage AI-powered features and integrations.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center justify-between space-x-2 p-3 rounded-lg border">
                        <div>
                            <Label htmlFor="ai-chatbot" className="font-semibold">Enable AI Support Chatbot</Label>
                            <p className="text-xs text-muted-foreground">Provide instant assistance to users via an AI-powered chatbot.</p>
                        </div>
                        <Switch id="ai-chatbot" disabled />
                    </div>
                </CardContent>
            </Card>
        </div>

        <div className="lg:col-span-1 space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle>Data &amp; Storage Management</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-4">
                        <Label className="font-semibold">Storage Usage</Label>
                        <div className="space-y-2">
                           <div className="flex justify-between items-center text-xs text-muted-foreground">
                                <span>Media &amp; Files</span>
                                <span>12.5 GB / 50 GB</span>
                           </div>
                           <Progress value={25} />
                        </div>
                         <div className="space-y-2">
                           <div className="flex justify-between items-center text-xs text-muted-foreground">
                                <span>Database</span>
                                <span>2.1 GB / 10 GB</span>
                           </div>
                           <Progress value={21} />
                        </div>
                    </div>
                    <Separator/>
                     <div className="space-y-2">
                        <Label htmlFor="retention-policy" className="font-semibold">Data Retention Policy</Label>
                        <Select defaultValue="5" disabled>
                            <SelectTrigger id="retention-policy">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="1">1 Year</SelectItem>
                                <SelectItem value="5">5 Years</SelectItem>
                                <SelectItem value="10">10 Years</SelectItem>
                                <SelectItem value="indefinite">Indefinitely</SelectItem>
                            </SelectContent>
                        </Select>
                         <p className="text-xs text-muted-foreground">Set how long logs and attendance data are kept.</p>
                    </div>
                    <Separator/>
                    <div className="space-y-4">
                        <Label className="font-semibold">Backup &amp; Restore</Label>
                        <div className="space-y-2">
                             <Button variant="outline" className="w-full justify-start" disabled>
                                <Download className="mr-2"/>
                                Create Manual Backup
                            </Button>
                        </div>
                        <div className="flex items-center justify-between space-x-2 p-3 rounded-lg border">
                            <div>
                                <Label htmlFor="auto-backup" className="font-medium">Automatic Backups</Label>
                                <p className="text-xs text-muted-foreground">Schedule daily or weekly backups.</p>
                            </div>
                             <Select defaultValue="daily" disabled>
                                <SelectTrigger className="w-28">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="daily">Daily</SelectItem>
                                    <SelectItem value="weekly">Weekly</SelectItem>
                                    <SelectItem value="monthly">Monthly</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                         <Button variant="destructive" className="w-full justify-start" disabled>
                            <RefreshCcw className="mr-2"/>
                            Restore from Backup
                        </Button>
                    </div>
                    <Separator/>
                     <div className="space-y-3">
                        <Label className="font-semibold">Archiving</Label>
                        <Button variant="outline" className="w-full justify-start" disabled>
                            <Archive className="mr-2"/>
                            Archive Old Records
                        </Button>
                    </div>
                </CardContent>
                 <CardFooter>
                    <p className="text-xs text-muted-foreground">Manage data policies and backups.</p>
                 </CardFooter>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><History className="h-5 w-5 text-primary"/>Change History</CardTitle>
                    <CardDescription>A log of recent changes made to system settings.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {recentChanges.map((change, index) => (
                            <div key={index} className="flex items-center justify-between text-sm">
                                <div>
                                    <p className="font-medium">{change.change}</p>
                                    <p className="text-xs text-muted-foreground">By {change.user}</p>
                                </div>
                                <p className="text-xs text-muted-foreground">{change.date}</p>
                            </div>
                        ))}
                    </div>
                </CardContent>
                <CardFooter className="flex-wrap gap-2">
                    <Button asChild variant="secondary">
                        <Link href="/admin/logs">
                            View Full Audit Log
                            <ArrowRight className="ml-2 h-4 w-4"/>
                        </Link>
                    </Button>
                    <Button variant="outline" disabled>
                        Rollback Last Change
                    </Button>
                </CardFooter>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Portal Access</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between space-x-2 p-3 rounded-lg border">
                        <div>
                            <Label htmlFor="maintenance-mode" className="font-medium">Maintenance Mode</Label>
                            <p className="text-xs text-muted-foreground">Temporarily disable access for non-administrators.</p>
                        </div>
                        <Switch id="maintenance-mode" disabled />
                    </div>
                </CardContent>
            </Card>
        </div>
       </div>
    </div>
  );
}
