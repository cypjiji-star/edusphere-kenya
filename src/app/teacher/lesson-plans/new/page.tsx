
'use client';

import * as React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, BookOpen, Share2, Copy, FileDown, ChevronDown, History, Users, Eye } from 'lucide-react';
import Link from 'next/link';
import { LessonPlanForm } from './lesson-plan-form';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useSearchParams } from 'next/navigation';

const versionHistory = [
    { version: 3, date: '2024-07-28 10:00 AM', author: 'Ms. Wanjiku', summary: 'Added new assessment method.', data: { topic: 'Photosynthesis & Respiration', subject: 'Biology', grade: 'Form 2', date: '2024-07-28', objectives: 'Students will be able to explain the Krebs cycle.', activities: '1. Lecture on Krebs Cycle\n2. Diagram drawing.', assessment: 'Label a diagram of the Krebs cycle.' } },
    { version: 2, date: '2024-07-27 03:20 PM', author: 'Ms. Wanjiku', summary: 'Revised learning activities.', data: { topic: 'Photosynthesis & Respiration', subject: 'Biology', grade: 'Form 2', date: '2024-07-27', objectives: 'Students will understand the light-dependent reactions.', activities: '1. Watch video on light reactions.\n2. Group discussion.', assessment: 'Q&A session.' } },
    { version: 1, date: '2024-07-26 09:00 AM', author: 'Ms. Wanjiku', summary: 'Initial draft created.', data: { topic: 'Photosynthesis', subject: 'Biology', grade: 'Form 2', date: '2024-07-26', objectives: 'Define Photosynthesis.', activities: 'Introductory lecture.', assessment: 'Define the term.' } },
]

export default function NewLessonPlanPage() {
  const searchParams = useSearchParams();
  const lessonPlanId = searchParams.get('id') || undefined;
  const prefilledDate = searchParams.get('date') || undefined;
  const isEditMode = !!lessonPlanId;
  const { toast } = useToast();
  const [activeTab, setActiveTab] = React.useState('editor');
  const [formKey, setFormKey] = React.useState(Date.now()); // Used to force re-render of form

  const handleRestore = (versionData: any) => {
    // In a real app, you might want a more sophisticated state management solution (like Jotai or Zustand)
    // to pass the restored data to the form component. For now, we'll just update a key to remount it
    // and rely on a mock/local storage mechanism if we were to persist this state across tabs.
    // For this demo, we'll just show a toast and switch tabs.
    
    // This is a simplified way to trigger a re-render with new defaults.
    // A more robust solution would use a shared state.
    sessionStorage.setItem('restoredLessonPlan', JSON.stringify(versionData));
    setFormKey(Date.now()); // Update key to force LessonPlanForm to remount and read sessionStorage

    toast({
        title: 'Version Restored',
        description: 'The selected version has been loaded into the editor.',
    });
    setActiveTab('editor');
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
       <div className="mb-6">
        <Button asChild variant="outline" size="sm">
            <Link href="/teacher/lesson-plans">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to All Lesson Plans
            </Link>
        </Button>
      </div>
      <Card>
        <CardHeader className="flex flex-row items-start justify-between">
          <div>
            <CardTitle className="font-headline text-2xl flex items-center gap-2">
              <BookOpen className="h-6 w-6 text-primary"/>
              {isEditMode ? 'Edit Lesson Plan' : 'Lesson Plan Builder'}
            </CardTitle>
            <CardDescription>
              {isEditMode
                ? 'Update the details for your existing lesson plan.'
                : 'Fill in the details below. Use the AI Assistant to help generate content.'}
            </CardDescription>
          </div>
           {isEditMode && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="secondary">
                    Share / Actions
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem>
                    <Share2 className="mr-2" />
                    Share with a colleague
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Copy className="mr-2" />
                    Copy to another class
                  </DropdownMenuItem>
                   <DropdownMenuItem>
                    <FileDown className="mr-2" />
                    Print / Export as PDF
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
        </CardHeader>
        <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                {isEditMode && (
                    <TabsList className="mb-4">
                        <TabsTrigger value="editor">Editor</TabsTrigger>
                        <TabsTrigger value="history">Version History</TabsTrigger>
                        <TabsTrigger value="permissions">Permissions</TabsTrigger>
                    </TabsList>
                )}
                <TabsContent value="editor">
                     <LessonPlanForm key={formKey} lessonPlanId={lessonPlanId} prefilledDate={prefilledDate} />
                </TabsContent>
                <TabsContent value="history">
                    <Card>
                        <CardHeader>
                            <CardTitle>Version History</CardTitle>
                            <CardDescription>Review and restore previous versions of this lesson plan.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {versionHistory.map((version) => (
                                <div key={version.version} className="flex items-start gap-4">
                                    <Avatar>
                                        <AvatarImage src="https://picsum.photos/seed/teacher-avatar/100" />
                                        <AvatarFallback>{version.author.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 space-y-1">
                                        <div className="flex items-center justify-between">
                                            <p className="text-sm font-medium">
                                                Version {version.version}
                                                <span className="font-normal text-muted-foreground"> by {version.author}</span>
                                            </p>
                                            <p className="text-xs text-muted-foreground">{version.date}</p>
                                        </div>
                                        <p className="text-sm text-muted-foreground">{version.summary}</p>
                                    </div>
                                    <Button variant="outline" size="sm" onClick={() => handleRestore(version.data)}>Restore</Button>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </TabsContent>
                 <TabsContent value="permissions">
                    <Card>
                        <CardHeader>
                            <CardTitle>Permissions & Access Control</CardTitle>
                            <CardDescription>Control who can view and edit this lesson plan.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <Label className="text-base font-semibold">Editing Permissions (Collaboration)</Label>
                                 <p className="text-sm text-muted-foreground">Grant editing rights to other teachers to collaborate on this plan.</p>
                                <div className="flex items-center space-x-2 p-3 rounded-md border">
                                    <Users className="h-5 w-5 text-primary"/>
                                    <div className="flex-1">
                                        <p className="font-medium">Allow co-teachers to edit</p>
                                    </div>
                                    <Switch id="edit-perms" />
                                </div>
                            </div>
                            <Separator />
                             <div className="space-y-2">
                                <Label className="text-base font-semibold">Viewing Permissions (Sharing)</Label>
                                <p className="text-sm text-muted-foreground">Shared lesson plans will appear as "read-only" for other teachers unless they are granted editing rights above.</p>
                                <div className="flex items-center space-x-2 p-3 rounded-md border">
                                     <Eye className="h-5 w-5 text-primary"/>
                                     <div className="flex-1">
                                        <p className="font-medium">Share with all Science Department teachers</p>
                                    </div>
                                    <Switch id="view-perms" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
