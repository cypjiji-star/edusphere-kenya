
'use client';

import * as React from 'react';
import {
  FileText,
  AlertCircle,
} from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { GradebookTab } from './gradebook-tab';
import { ExamsTab } from './exams-tab';
import { RankingTab } from './ranking-tab';
import { SettingsTab } from './settings-tab';
import { useToast } from '@/hooks/use-toast';

export default function AdminGradesPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  const schoolId = searchParams.get('schoolId');
  const initialTab = searchParams.get('tab') || 'exams';
  const [activeTab, setActiveTab] = React.useState(initialTab);

  // Sync activeTab with URL query parameter
  React.useEffect(() => {
    const tab = searchParams.get('tab') || 'exams';
    setActiveTab(tab);
  }, [searchParams]);

  // Handle tab change and update URL
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    const newParams = new URLSearchParams(searchParams.toString());
    newParams.set('tab', value);
    router.push(`?${newParams.toString()}`);
  };

  if (!schoolId) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-6 w-6 text-destructive" />
              Error
            </CardTitle>
            <CardDescription>School ID is missing from the URL.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Please ensure a valid school ID is provided in the URL query parameters.
            </p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => router.push('/admin')}
              aria-label="Go back to dashboard"
            >
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="font-headline text-3xl font-bold flex items-center gap-2">
            <FileText className="h-8 w-8 text-primary" />
            Grades & Exams Management
          </h1>
          <p className="text-muted-foreground">
            Oversee school-wide examination schedules, grade analysis, and reporting.
          </p>
        </div>
      </div>
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList
          className="grid w-full grid-cols-2 md:grid-cols-4 gap-2"
          aria-label="Grades and Exams Management Tabs"
        >
          <TabsTrigger value="exams" aria-label="Exams tab">
            Exams
          </TabsTrigger>
          <TabsTrigger value="ranking" aria-label="Class Ranking tab">
            Class Ranking
          </TabsTrigger>
          <TabsTrigger value="gradebook" aria-label="Gradebook tab">
            Gradebook
          </TabsTrigger>
          <TabsTrigger value="settings" aria-label="Settings tab">
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="exams" className="mt-4">
          <ExamsTab schoolId={schoolId} />
        </TabsContent>

        <TabsContent value="ranking" className="mt-4">
          <RankingTab schoolId={schoolId} />
        </TabsContent>

        <TabsContent value="gradebook" className="mt-4">
          <GradebookTab schoolId={schoolId} />
        </TabsContent>

        <TabsContent value="settings" className="mt-4">
          <SettingsTab schoolId={schoolId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
