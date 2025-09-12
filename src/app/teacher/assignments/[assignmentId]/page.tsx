
'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Search, CheckCircle, Clock, FileDown, Filter } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { GradingDialog } from './grading-dialog';
import type { Submission } from './types';
import { useToast } from '@/hooks/use-toast';

// Mock Data
const assignmentDetails = {
    id: '1',
    title: 'Form 4 Chemistry - Acid-Base Titration Lab Report',
    className: 'Form 4 - Chemistry',
    dueDate: '2024-07-22',
};

const initialSubmissions: Submission[] = [
  { studentId: 'f4-chem-1', studentName: 'Student 1', avatarUrl: 'https://picsum.photos/seed/f4-student1/100', status: 'Submitted', submittedDate: '2024-07-21', grade: 'A' },
  { studentId: 'f4-chem-2', studentName: 'Student 2', avatarUrl: 'https://picsum.photos/seed/f4-student2/100', status: 'Submitted', submittedDate: '2024-07-22', grade: 'B+' },
  { studentId: 'f4-chem-3', studentName: 'Student 3', avatarUrl: 'https://picsum.photos/seed/f4-student3/100', status: 'Not Submitted' },
  { studentId: 'f4-chem-4', studentName: 'Student 4', avatarUrl: 'https://picsum.photos/seed/f4-student4/100', status: 'Late', submittedDate: '2024-07-23', grade: 'C' },
  { studentId: 'f4-chem-5', studentName: 'Student 5', avatarUrl: 'https://picsum.photos/seed/f4-student5/100', status: 'Submitted', submittedDate: '2024-07-22', grade: undefined },
  { studentId: 'f4-chem-6', studentName: 'Student 6', avatarUrl: 'https://picsum.photos/seed/f4-student6/100', status: 'Not Submitted' },
];

const getStatusBadge = (status: Submission['status']) => {
    switch(status) {
        case 'Submitted': return <Badge variant="default" className="bg-green-600 hover:bg-green-700"><CheckCircle className="mr-1 h-3 w-3"/>Submitted</Badge>;
        case 'Not Submitted': return <Badge variant="destructive"><Clock className="mr-1 h-3 w-3"/>Not Submitted</Badge>;
        case 'Late': return <Badge variant="secondary" className="bg-yellow-500 text-white hover:bg-yellow-600"><Clock className="mr-1 h-3 w-3"/>Late</Badge>;
    }
}


export default function AssignmentSubmissionsPage({ params }: { params: { assignmentId: string } }) {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [submissions, setSubmissions] = React.useState(initialSubmissions);
  const [gradingStudent, setGradingStudent] = React.useState<Submission | null>(null);
  const { toast } = useToast();

  const handleGradeSave = (studentId: string, grade: string) => {
    setSubmissions(prev => 
      prev.map(s => s.studentId === studentId ? { ...s, grade } : s)
    );
    toast({
      title: 'Grade Saved!',
      description: `The grade for the submission has been successfully saved.`,
    });
  };

  const filteredSubmissions = submissions.filter(s => 
    s.studentName.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <GradingDialog
        student={gradingStudent}
        assignmentId={params.assignmentId}
        open={!!gradingStudent}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            setGradingStudent(null);
          }
        }}
        onGradeSave={handleGradeSave}
      />

       <div className="mb-6">
        <Button asChild variant="outline" size="sm">
            <Link href="/teacher/assignments">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to All Assignments
            </Link>
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-2xl">{assignmentDetails.title}</CardTitle>
          <CardDescription>{assignmentDetails.className} - Due: {new Date(assignmentDetails.dueDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</CardDescription>
           <div className="mt-4 flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
              <div className="relative w-full md:max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search by student name..."
                  className="w-full bg-background pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex w-full flex-col gap-2 md:w-auto md:flex-row">
                 <Button variant="outline" disabled>
                    <Filter className="mr-2" />
                    Filter by Status
                </Button>
                <Button variant="secondary" disabled>
                    <FileDown className="mr-2" />
                    Download All
                </Button>
              </div>
            </div>
        </CardHeader>
        <CardContent>
           <div className="w-full overflow-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Submitted On</TableHead>
                    <TableHead>Grade</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSubmissions.length > 0 ? (
                    filteredSubmissions.map(submission => (
                      <TableRow key={submission.studentId}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarImage src={submission.avatarUrl} alt={submission.studentName} />
                              <AvatarFallback>{submission.studentName.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <span className="font-medium">{submission.studentName}</span>
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(submission.status)}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {submission.submittedDate ? new Date(submission.submittedDate).toLocaleDateString() : '—'}
                        </TableCell>
                        <TableCell>
                          {submission.grade ? <Badge variant="outline">{submission.grade}</Badge> : <span className="text-muted-foreground">—</span>}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            disabled={submission.status === 'Not Submitted'}
                            onClick={() => setGradingStudent(submission)}
                          >
                            {submission.grade ? 'View/Edit Grade' : 'View & Grade'}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center">
                        No submissions found matching your search.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
