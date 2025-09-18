
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText } from 'lucide-react';
import { useSearchParams } from 'next/navigation';

export default function AdminGradesPage() {
    const searchParams = useSearchParams();
    const schoolId = searchParams.get('schoolId');
    if (!schoolId) {
        return <div className="p-8">Error: School ID is missing from URL.</div>
    }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
       <div className="mb-6">
        <h1 className="font-headline text-3xl font-bold flex items-center gap-2"><FileText className="h-8 w-8 text-primary"/>Grades & Exams</h1>
        <p className="text-muted-foreground">Manage exams, grades, and academic reports.</p>
       </div>
      <Card>
        <CardHeader>
            <CardTitle>Module Under Construction</CardTitle>
        </CardHeader>
        <CardContent>
            <p className="text-muted-foreground">This module is being created. Please provide your instructions.</p>
        </CardContent>
      </Card>
    </div>
  );
}
