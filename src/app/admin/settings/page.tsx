
'use client';

import * as React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Settings, Save, Bell, Shield, Book, Clock, Link as LinkIcon, Download, KeyRound, Globe, Languages, Edit, ArrowRight, Database, Archive, Mail, RefreshCcw, LayoutDashboard, Brush, AlertCircle, History, Wand2, Loader2 } from 'lucide-react';
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
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { firestore } from '@/lib/firebase';
import { doc, onSnapshot, setDoc, collection, query, orderBy, limit, Timestamp } from 'firebase/firestore';
import { useSearchParams } from 'next/navigation';


const formatTimeAgo = (timestamp: Timestamp | undefined) => {
    if (!timestamp) return '';
    const now = new Date();
    const then = timestamp.toDate();
    const seconds = Math.floor((now.getTime() - then.getTime()) / 1000);

    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
}

export default function SettingsPage() {
    const searchParams = useSearchParams();
    const schoolId = searchParams.get('schoolId');
    const { toast } = useToast();
    const [isLoading, setIsLoading] = React.useState(true);
    
    // States for all settings
    const [feeAlertsEnabled, setFeeAlertsEnabled] = React.useState(true);
    const [reminderSchedule, setReminderSchedule] = React.useState('weekly');
    const [reminderDay, setReminderDay] = React.useState('monday');
    const [reminderThreshold, setReminderThreshold] = React.useState(7);
    const [reminderMessage, setReminderMessage] = React.useState("Dear Parent, this is a friendly reminder that a fee balance of {balance} for {studentName} is overdue. Please make a payment at your earliest convenience.");
    
    const [timezone, setTimezone] = React.useState('Africa/Nairobi');
    const [language, setLanguage] = React.useState('en-KE');
    const [academicYear, setAcademicYear] = React.useState('2024');
    const [currentTerm, setCurrentTerm] = React.useState('term-2');
    
    const [dataRetention, setDataRetention] = React.useState('5');
    const [autoBackup, setAutoBackup] = React.useState('daily');
    
    const [idleTimeout, setIdleTimeout] = React.useState('30');
    const [selfRegistration, setSelfRegistration] = React.useState(false);
    const [twoFactorAuth, setTwoFactorAuth] = React.useState(false);
    
    const [maintenanceMode, setMaintenanceMode] = React.useState(false);
    const [aiChatbot, setAiChatbot] = React.useState(false);
    
    const [recentChanges, setRecentChanges] = React.useState<any[]>([]);

    const settingUpdaters: Record<string, React.Dispatch<React.SetStateAction<any>>> = {
        notifications: (data: any) => {
            setFeeAlertsEnabled(data.feeAlertsEnabled ?? true);
            setReminderSchedule(data.reminderSchedule ?? 'weekly');
            setReminderDay(data.reminderDay ?? 'monday');
            setReminderThreshold(data.reminderThreshold ?? 7);
            setReminderMessage(data.reminderMessage ?? "Dear Parent, this is a friendly reminder that a fee balance of {balance} for {studentName} is overdue. Please make a payment at your earliest convenience.");
            setAttendanceAlerts(data.attendanceAlerts ?? true);
            setSystemAlerts(data.systemAlerts ?? true);
        },
        general: (data: any) => {
            setTimezone(data.timezone ?? 'Africa/Nairobi');
            setLanguage(data.language ?? 'en-KE');
            setAcademicYear(data.academicYear ?? '2024');
            setCurrentTerm(data.currentTerm ?? 'term-2');
        },
        data: (data: any) => {
            setDataRetention(data.dataRetention ?? '5');
            setAutoBackup(data.autoBackup ?? 'daily');
        },
        security: (data: any) => {
            setIdleTimeout(data.idleTimeout ?? '30');
            setSelfRegistration(data.selfRegistration ?? false);
            setTwoFactorAuth(data.twoFactorAuth ?? false);
        },
        maintenance: (data: any) => {
            setMaintenanceMode(data.maintenanceMode ?? false);
        },
        ai: (data: any) => {
            setAiChatbot(data.aiChatbot ?? false);
        }
    };
    
     React.useEffect(() => {
        if (!schoolId) {
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        const settingDocs = ['notifications', 'general', 'data', 'security', 'maintenance', 'ai'];
        
        const unsubscribers = settingDocs.map(docId => {
            const docRef = doc(firestore, 'schools', schoolId, 'settings', docId);
            return onSnapshot(docRef, (docSnap) => {
                if (docSnap.exists()) {
                    settingUpdaters[docId]?.(docSnap.data());
                }
            });
        });
        
        const changesQuery = query(collection(firestore, 'schools', schoolId, 'notifications'), orderBy('createdAt', 'desc'), limit(3));
        const unsubChanges = onSnapshot(changesQuery, (snapshot) => {
            const changes = snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    change: data.description,
                    user: 'System', // This could be enhanced to store the user who made the change
                    date: formatTimeAgo(data.createdAt),
                }
            });
            setRecentChanges(changes);
        });

        setIsLoading(false);
        return () => {
            unsubscribers.forEach(unsub => unsub());
            unsubChanges();
        }

    }, [schoolId]);

    const handleSettingChange = async (collectionName: string, key: string, value: any) => {
        if (!schoolId) return;
        try {
            const docRef = doc(firestore, 'schools', schoolId, 'settings', collectionName);
            await setDoc(docRef, { [key]: value }, { merge: true });
            toast({
                title: 'Setting Saved',
                description: `Your change has been saved.`,
            });
        } catch (error) {
            console.error(`Failed to save setting ${key}:`, error);
            toast({
                title: 'Save Failed',
                variant: 'destructive',
            });
        }
    };

    const handleSaveSettings = async () => {
       await handleSettingChange('notifications', 'reminderMessage', reminderMessage);
       toast({
           title: 'Communication Settings Saved',
           description: 'Your changes to the automated communication have been saved.',
       });
    };

    const handleCreateBackup = () => {
        toast({
            title: 'Backup Started',
            description: 'A manual backup of your data is being created. You will be notified upon completion.',
        });
    };

    const handleRestoreBackup = () => {
        toast({
            title: 'Action Required',
            description: 'Restoring from a backup is a critical action. Please contact support to proceed.',
            variant: 'destructive',
        });
    };

    const handleArchive = () => {
        toast({
            title: 'Archiving Started',
            description: 'Older records are being archived based on your retention policy.',
        });
    };
    
    const handleRollback = () => {
        toast({
            title: 'Rollback Simulated',
            description: 'In a real application, this would revert the last profile change.'
        });
    };
    
    if (isLoading) {
        return (
             <div className="flex h-[80vh] w-full items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
        );
    }
    
    if (!schoolId) {
      return <div className="p-8">Error: School ID is missing.</div>;
    }

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
                                <p className="font-medium">School Name, Motto & Branding</p>
                                <p className="text-xs text-muted-foreground">This is managed in the School Profile section.</p>
                            </div>
                            <Button asChild variant="secondary">
                                <Link href={`/admin/profile?schoolId=${schoolId}`}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Manage Profile
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
                                <Select value={timezone} onValueChange={(v) => {setTimezone(v); handleSettingChange('general', 'timezone', v);}}>
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
                                <Select value={language} onValueChange={(v) => {setLanguage(v); handleSettingChange('general', 'language', v);}}>
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
                                <Select value={academicYear} onValueChange={(v) => {setAcademicYear(v); handleSettingChange('general', 'academicYear', v);}}>
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
                                <Select value={currentTerm} onValueChange={(v) => {setCurrentTerm(v); handleSettingChange('general', 'currentTerm', v);}}>
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
                        <Dialog>
                            <DialogTrigger asChild>
                                <Button variant="secondary">
                                    <KeyRound className="mr-2 h-4 w-4"/>
                                    Set Policy
                                </Button>
                            </DialogTrigger>
                             <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Password Policy</DialogTitle>
                                    <DialogDescription>Define password requirements for all users.</DialogDescription>
                                </DialogHeader>
                                <div className="py-4 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <Label>Minimum Length:</Label>
                                        <Input type="number" defaultValue="8" className="w-24" />
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <Label>Require Uppercase Letter:</Label>
                                        <Switch defaultChecked />
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <Label>Require Number:</Label>
                                        <Switch defaultChecked />
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <Label>Require Special Character:</Label>
                                        <Switch />
                                    </div>
                                </div>
                                <DialogFooter>
                                    <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                                    <DialogClose asChild>
                                        <Button onClick={() => toast({ title: 'Password Policy Updated' })}>Save Policy</Button>
                                    </DialogClose>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                    <div className="flex items-center justify-between space-x-2 p-3 rounded-lg border">
                        <div>
                            <Label htmlFor="idle-timeout" className="font-semibold">Idle Session Timeout</Label>
                            <p className="text-xs text-muted-foreground">Automatically log out users after a period of inactivity.</p>
                        </div>
                         <Select value={idleTimeout} onValueChange={(v) => {setIdleTimeout(v); handleSettingChange('security', 'idleTimeout', v);}}>
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
                        <Switch id="self-registration" checked={selfRegistration} onCheckedChange={(c) => {setSelfRegistration(c); handleSettingChange('security', 'selfRegistration', c);}} />
                    </div>
                     <div className="flex items-center justify-between space-x-2 p-3 rounded-lg border">
                        <div>
                            <Label htmlFor="2fa" className="font-semibold">Two-Factor Authentication (2FA)</Label>
                            <p className="text-xs text-muted-foreground">Require a second verification step for admins and teachers.</p>
                        </div>
                        <Switch id="2fa" checked={twoFactorAuth} onCheckedChange={(c) => {setTwoFactorAuth(c); handleSettingChange('security', 'twoFactorAuth', c);}} />
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
                            <Switch id="fee-alerts" checked={feeAlertsEnabled} onCheckedChange={(c) => {setFeeAlertsEnabled(c); handleSettingChange('notifications', 'feeAlertsEnabled', c);}}/>
                        </div>
                        <div className={!feeAlertsEnabled ? 'opacity-50' : ''}>
                            <Separator/>
                            <div className="space-y-4 pl-2 pt-4">
                                <div className="grid w-full max-w-sm items-center gap-1.5">
                                    <Label htmlFor="reminder-schedule">Sending Schedule</Label>
                                    <div className="flex gap-2">
                                        <Select value={reminderSchedule} onValueChange={(v) => {setReminderSchedule(v); handleSettingChange('notifications', 'reminderSchedule', v);}} disabled={!feeAlertsEnabled}>
                                            <SelectTrigger className="w-[120px]">
                                                <SelectValue/>
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="daily">Daily</SelectItem>
                                                <SelectItem value="weekly">Weekly</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <Select value={reminderDay} onValueChange={(v) => {setReminderDay(v); handleSettingChange('notifications', 'reminderDay', v);}} disabled={!feeAlertsEnabled || reminderSchedule !== 'weekly'}>
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
                                    <Input type="number" id="reminder-threshold" value={reminderThreshold} onChange={(e) => {setReminderThreshold(Number(e.target.value)); handleSettingChange('notifications', 'reminderThreshold', Number(e.target.value));}} className="w-20" disabled={!feeAlertsEnabled} />
                                    <span>days or more.</span>
                                    </div>
                                </div>
                                <div className="grid w-full items-center gap-1.5">
                                    <Label htmlFor="reminder-message">Reminder Message Template</Label>
                                    <Textarea id="reminder-message" placeholder="Customize the message sent to parents." value={reminderMessage} onChange={(e) => setReminderMessage(e.target.value)} disabled={!feeAlertsEnabled}/>
                                    <p className="text-xs text-muted-foreground">Use placeholders like `'{'{studentName}'}'`, `'{'{balance}'}'`, and `'{'{dueDate}'}'`.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center justify-between space-x-2 p-3 rounded-lg border">
                        <div>
                            <Label htmlFor="attendance-alerts" className="font-semibold">Low Attendance Alerts</Label>
                            <p className="text-xs text-muted-foreground">Notify administration when a class has low attendance.</p>
                        </div>
                        <Switch id="attendance-alerts" checked={attendanceAlerts} onCheckedChange={(c) => {setAttendanceAlerts(c); handleSettingChange('notifications', 'attendanceAlerts', c);}}/>
                    </div>
                     <div className="flex items-center justify-between space-x-2 p-3 rounded-lg border">
                        <div>
                            <Label htmlFor="system-alerts" className="font-semibold">Critical System Notifications</Label>
                            <p className="text-xs text-muted-foreground">Alerts for storage limits, failed payments, etc.</p>
                        </div>
                        <Switch id="system-alerts" checked={systemAlerts} onCheckedChange={(c) => {setSystemAlerts(c); handleSettingChange('notifications', 'systemAlerts', c);}}/>
                    </div>
                    <Separator/>
                     <div className="flex items-center justify-between space-x-2 p-3 rounded-lg border">
                        <div>
                            <Label className="font-semibold">Communication Channels</Label>
                            <p className="text-xs text-muted-foreground">Configure SMS, Email, and Payment gateways.</p>
                        </div>
                         <Dialog>
                            <DialogTrigger asChild>
                                <Button variant="secondary">
                                    <LinkIcon className="mr-2 h-4 w-4"/>
                                    Manage Gateways
                                </Button>
                            </DialogTrigger>
                             <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Communication & Payment Gateways</DialogTitle>
                                    <DialogDescription>Manage gateways for sending SMS, email, and processing payments.</DialogDescription>
                                </DialogHeader>
                                <div className="py-4 space-y-4">
                                     <Card>
                                        <CardHeader>
                                            <CardTitle className="text-base">SMS Gateway</CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <div className="space-y-2">
                                                <Label>Provider</Label>
                                                <Select defaultValue="africastalking">
                                                    <SelectTrigger><SelectValue/></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="africastalking">Africa's Talking</SelectItem>
                                                        <SelectItem value="twilio">Twilio</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label>API Key</Label>
                                                <Input type="password" placeholder="Enter your SMS API key..." />
                                            </div>
                                        </CardContent>
                                     </Card>
                                     <Card>
                                        <CardHeader>
                                            <CardTitle className="text-base">M-Pesa Paybill/Till</CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <div className="space-y-2">
                                                <Label>Paybill/Till Number</Label>
                                                <Input placeholder="e.g., 888888" />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>API Consumer Key</Label>
                                                <Input type="password" placeholder="Enter your M-Pesa Consumer Key..." />
                                            </div>
                                             <div className="space-y-2">
                                                <Label>API Consumer Secret</Label>
                                                <Input type="password" placeholder="Enter your M-Pesa Consumer Secret..." />
                                            </div>
                                        </CardContent>
                                     </Card>
                                </div>
                                <DialogFooter>
                                    <DialogClose asChild>
                                        <Button variant="outline">Cancel</Button>
                                    </DialogClose>
                                    <DialogClose asChild>
                                        <Button onClick={() => toast({title: 'Gateways Saved'})}>Save Gateway Settings</Button>
                                    </DialogClose>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                </CardContent>
                 <CardFooter>
                    <Button onClick={handleSaveSettings}>
                        <Save className="mr-2 h-4 w-4"/>
                        Save All Communication Settings
                    </Button>
                </CardFooter>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Wand2 className="h-5 w-5 text-primary"/>AI &amp; Automation</CardTitle>
                    <CardDescription>Manage AI-powered features and integrations.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center justify-between space-x-2 p-3 rounded-lg border">
                        <div>
                            <Label htmlFor="ai-chatbot" className="font-semibold">Enable AI Support Chatbot</Label>
                            <p className="text-xs text-muted-foreground">Provide instant assistance to users via an AI-powered chatbot.</p>
                        </div>
                        <Switch id="ai-chatbot" checked={aiChatbot} onCheckedChange={(c) => {setAiChatbot(c); handleSettingChange('ai', 'aiChatbot', c);}} />
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
                        <Select value={dataRetention} onValueChange={(v) => {setDataRetention(v); handleSettingChange('data', 'dataRetention', v);}}>
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
                             <Button variant="outline" className="w-full justify-start" onClick={handleCreateBackup}>
                                <Download className="mr-2"/>
                                Create Manual Backup
                            </Button>
                        </div>
                        <div className="flex items-center justify-between space-x-2 p-3 rounded-lg border">
                            <div>
                                <Label htmlFor="auto-backup" className="font-medium">Automatic Backups</Label>
                                <p className="text-xs text-muted-foreground">Schedule daily or weekly backups.</p>
                            </div>
                             <Select value={autoBackup} onValueChange={(v) => {setAutoBackup(v); handleSettingChange('data', 'autoBackup', v);}}>
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
                         <Button variant="destructive" className="w-full justify-start" onClick={handleRestoreBackup}>
                            <RefreshCcw className="mr-2"/>
                            Restore from Backup
                        </Button>
                    </div>
                    <Separator/>
                     <div className="space-y-3">
                        <Label className="font-semibold">Archiving</Label>
                        <Button variant="outline" className="w-full justify-start" onClick={handleArchive}>
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
                        <Link href={`/admin/logs?schoolId=${schoolId}`}>
                            View Full Audit Log
                            <ArrowRight className="ml-2 h-4 w-4"/>
                        </Link>
                    </Button>
                    <Button variant="outline" onClick={handleRollback}>
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
                        <Switch 
                            id="maintenance-mode" 
                            checked={maintenanceMode}
                            onCheckedChange={(c) => {setMaintenanceMode(c); handleSettingChange('maintenance', 'maintenanceMode', c);}}
                        />
                    </div>
                </CardContent>
            </Card>
        </div>
       </div>
    </div>
  );
}
