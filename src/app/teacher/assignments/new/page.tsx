
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
import { AssignmentForm } from './assignment-form';
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
import { firestore } from '@/lib/firebase';
import { collection, doc, onSnapshot, orderBy, query, Timestamp } from 'firebase/firestore';
import * as React from 'react';


type VersionHistoryItem = {
    id: string;
    version: number;
    date: Timestamp;
    author: string;
    summary: string;
    data: any;
};

export default function NewLessonPlanPage() {
  const searchParams = useSearchParams();
  const schoolId = searchParams.get('schoolId');
  const lessonPlanId = searchParams.get('id') || undefined;
  const prefilledDate = searchParams.get('date') || undefined;
  const isEditMode = !!lessonPlanId;
  const [versionHistory, setVersionHistory] = React.useState<VersionHistoryItem[]>([]);
  const { toast } = useToast();
  const [activeTab, setActiveTab] = React.useState('editor');
  const [formKey, setFormKey] = React.useState(Date.now()); // Used to force re-render of form

  React.useEffect(() => {
    if (!isEditMode || !schoolId || !lessonPlanId) return;

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

  return (
    <div className="p-4 sm:p-6 lg:p-8">
       <div className="mb-6">
        <Button asChild variant="outline" size="sm">
            <Link href={`/teacher/assignments?schoolId=${schoolId}`}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Assignments
            </Link>
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-2xl">Create New Assignment</CardTitle>
          <CardDescription>Fill in the details below to create a new assignment for your class.</CardDescription>
        </CardHeader>
        <CardContent>
          <AssignmentForm />
        </CardContent>
      </Card>
    </div>
  );
}
