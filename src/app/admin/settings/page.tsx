
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
import { Settings, Save, Bell, Shield, Book, Clock, Link as LinkIcon, Download, KeyRound } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

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
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center justify-between space-x-2 p-3 rounded-lg border">
                        <div>
                            <Label htmlFor="maintenance-mode" className="font-semibold">Maintenance Mode</Label>
                            <p className="text-xs text-muted-foreground">Temporarily disable access for non-administrators.</p>
                        </div>
                        <Switch id="maintenance-mode" disabled />
                    </div>
                     <div className="flex items-center justify-between space-x-2 p-3 rounded-lg border">
                        <div>
                            <Label htmlFor="registration-status" className="font-semibold">Open Registrations</Label>
                            <p className="text-xs text-muted-foreground">Allow new parents and students to register.</p>
                        </div>
                        <Switch id="registration-status" checked disabled />
                    </div>
                </CardContent>
            </Card>

             <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><LinkIcon className="h-5 w-5 text-primary"/>Third-Party Integrations</CardTitle>
                    <CardDescription>Connect EduSphere to other services you use.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between p-4 rounded-lg border">
                        <div className='flex items-center gap-4'>
                             <div className="h-10 w-10 bg-green-700 text-white flex items-center justify-center rounded-md font-bold text-lg">Q</div>
                            <div>
                                <h3 className="font-semibold">QuickBooks</h3>
                                <p className="text-sm text-muted-foreground">Sync fee payments and expenses with QuickBooks.</p>
                            </div>
                        </div>
                        <Button variant="secondary" disabled>Connect</Button>
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
        </div>

       </div>
    </div>
  );
}
