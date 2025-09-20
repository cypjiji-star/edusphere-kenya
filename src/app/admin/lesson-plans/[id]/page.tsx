
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, BookOpen, Share2, Copy, FileDown, ChevronDown, History, Users, Eye, Trash2 } from 'lucide-react';
import Link from 'next/link';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { LessonPlanForm } from '../new/lesson-plan-form';
import * as React from 'react';
import { firestore } from '@/lib/firebase';
import { collection, doc, onSnapshot, orderBy, query, Timestamp, deleteDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';


type VersionHistoryItem = {
    id: string;
    version: number;
    date: Timestamp;
    author: string;
    summary: string;
    data: any;
};

export default function EditLessonPlanPage({ params, searchParams }: { params: { id: string }, searchParams: { date?: string, schoolId: string }}) {
  const { id: lessonPlanId } = params;
  const { schoolId, date: prefilledDate } = searchParams;
  const isEditMode = !!lessonPlanId && lessonPlanId !== 'new';
  const [versionHistory, setVersionHistory] = React.useState<VersionHistoryItem[]>([]);
  const { toast } = useToast();
  const [activeTab, setActiveTab] = React.useState('editor');
  const [formKey, setFormKey] = React.useState(Date.now()); // Used to force re-render of form
  const router = useRouter();

  React.useEffect(() => {
    if (!isEditMode || !schoolId) return;

    const historyQuery = query(
        collection(firestore, `schools/${schoolId}/lesson-plans/${lessonPlanId}/history`),
        orderBy('date', 'desc')
    );

    const unsubscribe = onSnapshot(historyQuery, (snapshot) => {
        const historyData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as VersionHistoryItem));
        setVersionHistory(historyData);
    });

    return () => unsubscribe();
  }, [lessonPlanId, schoolId, isEditMode]);

  const handleRestore = (version: VersionHistoryItem) => {
    // We'll use session storage to pass the data to the form component
    // This is a simple way to trigger a re-render with new default values
    if (typeof window !== 'undefined') {
        sessionStorage.setItem('restoredLessonPlan', JSON.stringify(version.data));
    }
    setFormKey(Date.now()); // Force re-render of LessonPlanForm
    toast({
        title: `Version ${version.version} Restored`,
        description: 'The selected version has been loaded into the editor. Review and save to make it the current version.',
    });
    setActiveTab('editor');
  };
  
  const handleDelete = async () => {
    if (!isEditMode || !schoolId || !lessonPlanId) return;

    try {
      await deleteDoc(doc(firestore, 'schools', schoolId, 'lesson-plans', lessonPlanId));
      toast({
        title: 'Lesson Plan Deleted',
        description: 'The lesson plan has been permanently removed.',
        variant: 'destructive',
      });
      router.push(`/admin/lesson-plans?schoolId=${schoolId}`);
    } catch (error) {
      console.error('Error deleting lesson plan:', error);
      toast({
        title: 'Error',
        description: 'Could not delete the lesson plan. Please try again.',
        variant: 'destructive',
      });
    }
  };


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
                  <DropdownMenuSeparator />
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                       <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:bg-destructive/10 focus:text-destructive">
                          <Trash2 className="mr-2" />
                          Delete Lesson Plan
                      </DropdownMenuItem>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently delete this lesson plan and all of its version history.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
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
                     <LessonPlanForm key={formKey} lessonPlanId={lessonPlanId} prefilledDate={prefilledDate} schoolId={schoolId} />
                </TabsContent>
                <TabsContent value="history">
                    <Card>
                        <CardHeader>
                            <CardTitle>Version History</CardTitle>
                            <CardDescription>Review and restore previous versions of this lesson plan.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {versionHistory.map((version) => (
                                <div key={version.id} className="flex items-start gap-4">
                                    <Avatar>
                                        <AvatarImage src={`https://picsum.photos/seed/${version.author}/100`} />
                                        <AvatarFallback>{version.author.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 space-y-1">
                                        <div className="flex items-center justify-between">
                                            <p className="text-sm font-medium">
                                                Version {version.version}
                                                <span className="font-normal text-muted-foreground"> by {version.author}</span>
                                            </p>
                                            <p className="text-xs text-muted-foreground">{version.date.toDate().toLocaleString()}</p>
                                        </div>
                                        <p className="text-sm text-muted-foreground">{version.summary}</p>
                                    </div>
                                    <Button variant="outline" size="sm" onClick={() => handleRestore(version)}>Restore</Button>
                                </div>
                            ))}
                            {versionHistory.length === 0 && (
                                <p className="text-sm text-muted-foreground text-center py-8">No version history found.</p>
                            )}
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
