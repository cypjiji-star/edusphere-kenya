
'use client';

import * as React from 'react';
import {
  FileText,
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSearchParams } from 'next/navigation';
import { ExamsTab } from './exams-tab';
import { RankingTab } from './ranking-tab';
import { GradebookTab } from './gradebook-tab';
import { SettingsTab } from './settings-tab';


export default function AdminGradesPage() {
  const searchParams = useSearchParams();
  const schoolId = searchParams.get('schoolId');
  const [activeTab, setActiveTab] = React.useState('exams');
  
  if (!schoolId) {
    return <div className="p-8">Error: School ID is missing from URL.</div>
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="font-headline text-3xl font-bold flex items-center gap-2">
            <FileText className="h-8 w-8 text-primary" />
            Grades &amp; Exams Management
          </h1>
          <p className="text-muted-foreground">Oversee school-wide examination schedules, grade analysis, and reporting.</p>
        </div>
      </div>
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="exams">Exams</TabsTrigger>
          <TabsTrigger value="ranking">Class Ranking</TabsTrigger>
          <TabsTrigger value="gradebook">Gradebook</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
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
