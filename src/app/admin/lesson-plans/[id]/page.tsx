'use client';

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
import { LessonPlanForm } from '../new/lesson-plan-form';


const versionHistory = [
    { version: 3, date: '2024-07-28 10:00 AM', author: 'Ms. Wanjiku', summary: 'Added new assessment method.' },
    { version: 2, date: '2024-07-27 03:20 PM', author: 'Ms. Wanjiku', summary: 'Revised learning activities.' },
    { version: 1, date: '2024-07-26 09:00 AM', author: 'Ms. Wanjiku', summary: 'Initial draft created.' },
]

export default function EditLessonPlanPage({ params, searchParams }: { params: { id: string }, searchParams: { date?: string, schoolId: string }}) {
  const { id: lessonPlanId } = params;
  const { schoolId, date: prefilledDate } = searchParams;
  const isEditMode = !!lessonPlanId;

  return (
    <div className="p-4 sm:p-6 lg:p-8">
       <div className="mb-6">
        <Button asChild variant="outline" size="sm">
            <Link href={`/admin/lesson-plans?schoolId=${schoolId}`}>
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
                  <DropdownMenuItem disabled>
                    <Share2 className="mr-2" />
                    Share with a colleague
                  </DropdownMenuItem>
                  <DropdownMenuItem disabled>
                    <Copy className="mr-2" />
                    Copy to another class
                  </DropdownMenuItem>
                   <DropdownMenuItem disabled>
                    <FileDown className="mr-2" />
                    Print / Export as PDF
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
        </CardHeader>
        <CardContent>
            <Tabs defaultValue="editor" className="w-full">
                {isEditMode && (
                    <TabsList className="mb-4">
                        <TabsTrigger value="editor">Editor</TabsTrigger>
                        <TabsTrigger value="history">Version History</TabsTrigger>
                        <TabsTrigger value="permissions">Permissions</TabsTrigger>
                    </TabsList>
                )}
                <TabsContent value="editor">
                     <LessonPlanForm lessonPlanId={lessonPlanId} prefilledDate={prefilledDate} schoolId={schoolId} />
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
                                    <Button variant="outline" size="sm" disabled>Restore</Button>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </TabsContent>
                 <TabsContent value="permissions">
                    <Card>
                        <CardHeader>
                            <CardTitle>Permissions & Access Control</CardTitle>
                            <CardDescription>Control who can view and edit this lesson plan. (This is a mock UI, functionality is coming soon).</CardDescription>
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
                                    <Switch id="edit-perms" disabled />
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
                                    <Switch id="view-perms" disabled />
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
