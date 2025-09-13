
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
import { Settings, Save, Bell, Shield, Book, Clock, Link as LinkIcon, Download, KeyRound, Globe, Languages, Edit, ArrowRight } from 'lucide-react';
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
                    <CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5 text-primary"/>User & Access Control</CardTitle>
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
                        <Switch id="self-registration" checked disabled />
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
        </div>

        <div className="lg:col-span-1 space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle>Data Management</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Button variant="outline" className="w-full justify-start" disabled>
                        <Download className="mr-2"/>
                        Export All School Data
                    </Button>
                     <Button variant="outline" className="w-full justify-start" disabled>
                        <Download className="mr-2"/>
                        Download System Backup
                    </Button>
                </CardContent>
                 <CardFooter>
                    <p className="text-xs text-muted-foreground">Use these actions for archival purposes. Backups are created automatically every 24 hours.</p>
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
