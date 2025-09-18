'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, PlusCircle, Upload, BarChart, AlertTriangle } from 'lucide-react';
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
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-6">
            <Card>
                <CardHeader className="pb-2">
                    <CardDescription>Total Exams Created</CardDescription>
                    <CardTitle className="text-4xl">12</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-xs text-muted-foreground">
                        5 this term, 7 past terms
                    </div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="pb-2">
                    <CardDescription>Pending Grading</CardDescription>
                    <CardTitle className="text-4xl text-yellow-500 flex items-center gap-2">
                        <AlertTriangle/>
                        3
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-xs text-muted-foreground">
                        assignments require grading
                    </div>
                </CardContent>
            </Card>
        </div>

        <Card>
            <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <Button size="lg" disabled>
                    <PlusCircle className="mr-2"/>
                    Create Exam
                </Button>
                 <Button size="lg" variant="secondary" disabled>
                    <Upload className="mr-2"/>
                    Upload Marks
                </Button>
                 <Button size="lg" variant="outline" disabled>
                    <BarChart className="mr-2"/>
                    View Reports
                </Button>
            </CardContent>
        </Card>
    </div>
  );
}
