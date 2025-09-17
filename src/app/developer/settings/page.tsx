
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
import { Settings, Save, Bell, Shield, Book, Clock, Link as LinkIcon, Download, KeyRound, Globe, Languages, Edit, ArrowRight, Database, Archive, Mail, RefreshCcw, LayoutDashboard, Brush, AlertCircle, History, Wand2, Loader2, GitBranch, Webhook, FileClock } from 'lucide-react';
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { firestore } from '@/lib/firebase';
import { doc, onSnapshot, setDoc, collection, query, orderBy, limit, Timestamp } from 'firebase/firestore';
import { seedSchoolData } from '@/lib/seed-database';

type School = {
  id: string;
  name: string;
};

export default function DeveloperSettingsPage() {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = React.useState(true);
    
    // States for all settings
    const [emailProvider, setEmailProvider] = React.useState('sendgrid');
    const [smsProvider, setSmsProvider] = React.useState('africastalking');

    const [dataRetention, setDataRetention] = React.useState('5');
    const [autoBackup, setAutoBackup] = React.useState('daily');
    
    const [passwordMinLength, setPasswordMinLength] = React.useState(8);
    const [passwordRequireUppercase, setPasswordRequireUppercase] = React.useState(true);
    const [passwordRequireNumber, setPasswordRequireNumber] = React.useState(true);
    const [twoFactorAuth, setTwoFactorAuth] = React.useState(false);
    
    const [maintenanceMode, setMaintenanceMode] = React.useState(false);

    // States for seeding
    const [schools, setSchools] = React.useState<School[]>([]);
    const [selectedSchoolToSeed, setSelectedSchoolToSeed] = React.useState<string>('');
    const [isSeeding, setIsSeeding] = React.useState(false);


    React.useEffect(() => {
        setIsLoading(true);
        const settingDocs = ['communication', 'data', 'security', 'maintenance'];
        
        const unsubscribers = settingDocs.map(docId => {
            const docRef = doc(firestore, 'platformSettings', docId);
            return onSnapshot(docRef, (docSnap) => {
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    if (docId === 'communication') {
                        setEmailProvider(data.emailProvider || 'sendgrid');
                        setSmsProvider(data.smsProvider || 'africastalking');
                    } else if (docId === 'data') {
                        setDataRetention(data.dataRetention || '5');
                        setAutoBackup(data.autoBackup || 'daily');
                    } else if (docId === 'security') {
                        setPasswordMinLength(data.passwordMinLength || 8);
                        setPasswordRequireUppercase(data.passwordRequireUppercase ?? true);
                        setPasswordRequireNumber(data.passwordRequireNumber ?? true);
                        setTwoFactorAuth(data.twoFactorAuth ?? false);
                    } else if (docId === 'maintenance') {
                        setMaintenanceMode(data.maintenanceMode ?? false);
                    }
                }
            });
        });

        const unsubSchools = onSnapshot(collection(firestore, 'schools'), (snapshot) => {
            const schoolsData = snapshot.docs.map(doc => ({ id: doc.id, name: doc.data().name }));
            setSchools(schoolsData);
        });
        
        setIsLoading(false);
        return () => {
            unsubscribers.forEach(unsub => unsub());
            unsubSchools();
        }

    }, []);

    const handleSettingChange = async (collection: string, key: string, value: any) => {
        try {
            const docRef = doc(firestore, 'platformSettings', collection);
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

    const handlePasswordPolicySave = async () => {
        await handleSettingChange('security', 'passwordMinLength', passwordMinLength);
        await handleSettingChange('security', 'passwordRequireUppercase', passwordRequireUppercase);
        await handleSettingChange('security', 'passwordRequireNumber', passwordRequireNumber);
        toast({ title: 'Password Policy Updated' });
    }

    const handleSeedDatabase = async () => {
        if (!selectedSchoolToSeed) {
            toast({ title: 'No School Selected', description: 'Please select a school to seed.', variant: 'destructive'});
            return;
        }
        setIsSeeding(true);
        toast({ title: 'Database Seeding Started', description: 'This may take a few moments...' });

        try {
            const result = await seedSchoolData(selectedSchoolToSeed);
            if (result.success) {
                toast({ title: 'Seeding Complete!', description: result.message });
            } else {
                throw new Error(result.message);
            }
        } catch (error: any) {
            toast({ title: 'Seeding Failed', description: error.message, variant: 'destructive'});
        } finally {
            setIsSeeding(false);
        }
    };


    if (isLoading) {
        return (
             <div className="flex h-[80vh] w-full items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
        );
    }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="font-headline text-3xl font-bold flex items-center gap-2">
            <Settings className="h-8 w-8 text-primary"/>
            Platform Settings
        </h1>
        <p className="text-muted-foreground">Manage global settings, integrations, and policies for all schools on the platform.</p>
      </div>

       <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-8">
             <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Database className="h-5 w-5 text-primary"/>Database Seeding</CardTitle>
                    <CardDescription>Populate a selected school with sample data for demonstration and testing purposes. This action is irreversible.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label>Select School to Seed</Label>
                        <Select value={selectedSchoolToSeed} onValueChange={setSelectedSchoolToSeed}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a school..." />
                            </SelectTrigger>
                            <SelectContent>
                                {schools.map(school => (
                                    <SelectItem key={school.id} value={school.id}>{school.name} ({school.id})</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
                <CardFooter>
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="destructive" disabled={!selectedSchoolToSeed || isSeeding}>
                                {isSeeding && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                                Seed Database
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This action will overwrite existing data in the selected school with sample data. This cannot be undone.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={handleSeedDatabase}>Yes, seed the database</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </CardFooter>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Bell className="h-5 w-5 text-primary"/>Global Communication Gateways</CardTitle>
                    <CardDescription>Configure gateways for sending SMS and email notifications across the platform.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">SMS Gateway</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>Provider</Label>
                                <Select value={smsProvider} onValueChange={(v) => {setSmsProvider(v); handleSettingChange('communication', 'smsProvider', v);}}>
                                    <SelectTrigger><SelectValue/></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="africastalking">Africa's Talking</SelectItem>
                                        <SelectItem value="twilio">Twilio</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>API Key</Label>
                                <Input type="password" defaultValue="xxxxxxxxxxxx" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Email Gateway</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>Provider</Label>
                                <Select value={emailProvider} onValueChange={(v) => {setEmailProvider(v); handleSettingChange('communication', 'emailProvider', v);}}>
                                    <SelectTrigger><SelectValue/></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="sendgrid">SendGrid</SelectItem>
                                        <SelectItem value="mailgun">Mailgun</SelectItem>
                                        <SelectItem value="resend">Resend</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                             <div className="space-y-2">
                                <Label>API Key</Label>
                                <Input type="password" defaultValue="xxxxxxxxxxxx" />
                            </div>
                        </CardContent>
                    </Card>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5 text-primary"/>Platform-wide Security</CardTitle>
                    <CardDescription>Manage password policies, registration, and other security settings.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                     <div className="flex items-center justify-between space-x-2 p-3 rounded-lg border">
                        <div>
                            <Label htmlFor="password-policy" className="font-semibold">Global Password Policy</Label>
                            <p className="text-xs text-muted-foreground">Set minimum length and complexity for all user passwords.</p>
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
                                        <Input type="number" value={passwordMinLength} onChange={e => setPasswordMinLength(Number(e.target.value))} className="w-24" />
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <Label>Require Uppercase Letter:</Label>
                                        <Switch checked={passwordRequireUppercase} onCheckedChange={setPasswordRequireUppercase}/>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <Label>Require Number:</Label>
                                        <Switch checked={passwordRequireNumber} onCheckedChange={setPasswordRequireNumber}/>
                                    </div>
                                </div>
                                <DialogFooter>
                                    <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                                    <DialogClose asChild>
                                        <Button onClick={handlePasswordPolicySave}>Save Policy</Button>
                                    </DialogClose>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                     <div className="flex items-center justify-between space-x-2 p-3 rounded-lg border">
                        <div>
                            <Label htmlFor="2fa" className="font-semibold">Force Two-Factor Authentication (2FA)</Label>
                            <p className="text-xs text-muted-foreground">Require 2FA for all admin and teacher roles across all schools.</p>
                        </div>
                        <Switch id="2fa" checked={twoFactorAuth} onCheckedChange={(v) => {setTwoFactorAuth(v); handleSettingChange('security', 'twoFactorAuth', v);}}/>
                    </div>
                     <div className="flex items-center justify-between space-x-2 p-3 rounded-lg border">
                        <div>
                            <Label htmlFor="audit-trail" className="font-semibold">Global Audit Trail</Label>
                            <p className="text-xs text-muted-foreground">Ensure audit trails are enabled for all tenants.</p>
                        </div>
                        <Switch id="audit-trail" checked disabled />
                    </div>
                </CardContent>
            </Card>
        </div>

        <div className="lg:col-span-1 space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle>Data &amp; Maintenance</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="retention-policy" className="font-semibold">Default Data Retention</Label>
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
                         <p className="text-xs text-muted-foreground">Set default for how long logs and financial data are kept.</p>
                    </div>
                    <Separator/>
                    <div className="space-y-4">
                        <Label className="font-semibold">Backup &amp; Restore</Label>
                        <div className="flex items-center justify-between space-x-2 p-3 rounded-lg border">
                            <div>
                                <Label htmlFor="auto-backup" className="font-medium">Automatic Backups</Label>
                                <p className="text-xs text-muted-foreground">Schedule daily or weekly backups for all instances.</p>
                            </div>
                             <Select value={autoBackup} onValueChange={(v) => {setAutoBackup(v); handleSettingChange('data', 'autoBackup', v);}}>
                                <SelectTrigger className="w-28">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="daily">Daily</SelectItem>
                                    <SelectItem value="weekly">Weekly</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                     <Separator/>
                     <div className="space-y-3">
                        <Label className="font-semibold">Platform Status</Label>
                        <div className="flex items-center justify-between space-x-2 p-3 rounded-lg border">
                            <div>
                                <Label htmlFor="maintenance-mode" className="font-medium">Maintenance Mode</Label>
                                <p className="text-xs text-muted-foreground">Temporarily disable access for all non-admins.</p>
                            </div>
                            <Switch 
                                id="maintenance-mode" 
                                checked={maintenanceMode}
                                onCheckedChange={(c) => {setMaintenanceMode(c); handleSettingChange('maintenance', 'maintenanceMode', c);}}
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>
             <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><GitBranch className="h-5 w-5 text-primary"/>Advanced Tools</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Button variant="outline" className="w-full justify-start gap-2" asChild>
                        <Link href="/developer/roles">
                            <Shield className="h-4 w-4" />
                            Global Roles & Permissions
                        </Link>
                    </Button>
                    <Button variant="outline" className="w-full justify-start gap-2" asChild>
                         <Link href="/developer/logs">
                            <FileClock className="h-4 w-4" />
                            Platform Audit Logs
                        </Link>
                    </Button>
                     <Button variant="outline" className="w-full justify-start gap-2" asChild>
                         <Link href="/developer">
                            <LayoutDashboard className="h-4 w-4" />
                           Tenant Management
                        </Link>
                    </Button>
                </CardContent>
            </Card>
        </div>
       </div>
    </div>
  );
}
