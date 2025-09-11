

import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, User, Phone, Users, History, FileText } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

// Mock data fetching - in a real app, this would be an API call.
const getStudentData = (studentId: string) => {
    // This is a simplified mock data fetch. A real implementation would be more robust.
    const name = studentId.replace(/-(.)*$/, '').replace(/-/g, ' ');
    const studentName = name.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    
    return {
        id: studentId,
        name: studentName,
        rollNumber: 'F4-001',
        class: 'Form 4 - Chemistry',
        avatarUrl: `https://picsum.photos/seed/${studentId}/100`,
        overallGrade: '78%',
        dateOfBirth: '2008-05-12',
        studentContact: '0712 345 678',
        guardian: {
            name: 'Joseph Kariuki',
            relationship: 'Father',
            contact: '0722 123 456',
        },
    }
}


export default function StudentProfilePage({ params }: { params: { studentId: string } }) {
  const student = getStudentData(params.studentId);

  if (!student) {
    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold">Student not found</h1>
            <Button asChild variant="link">
                <Link href="/teacher/students">
                    <ArrowLeft className="mr-2"/> Back to Class Management
                </Link>
            </Button>
        </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <Button asChild variant="outline" size="sm">
            <Link href="/teacher/students">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Class View
            </Link>
        </Button>
      </div>
      <div className="grid gap-8 md:grid-cols-3">
        <div className="md:col-span-1 space-y-8">
            <Card>
                <CardContent className="p-6 text-center">
                    <Avatar className="h-24 w-24 mx-auto mb-4">
                        <AvatarImage src={student.avatarUrl} alt={student.name} />
                        <AvatarFallback>{student.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <h2 className="font-headline text-2xl font-bold">{student.name}</h2>
                    <p className="text-muted-foreground">{student.rollNumber} | {student.class}</p>
                    <div className="mt-4 flex justify-center gap-2">
                         <Badge variant="secondary">Overall Grade: {student.overallGrade}</Badge>
                    </div>
                </CardContent>
            </Card>
             <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <History className="h-5 w-5 text-primary"/>
                        Attendance History
                    </CardTitle>
                </CardHeader>
                 <CardContent>
                    <div className="flex min-h-[150px] items-center justify-center rounded-lg border-2 border-dashed border-muted">
                        <div className="text-center p-4">
                            <h3 className="mt-2 text-sm font-medium text-muted-foreground">Attendance Data Unavailable</h3>
                            <p className="mt-1 text-sm text-muted-foreground">Full history will be shown here.</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
        <div className="md:col-span-2">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <User className="h-5 w-5 text-primary"/>
                        Student Information
                    </CardTitle>
                    <CardDescription>
                        Basic personal and contact details for {student.name}.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                       <div>
                           <p className="font-medium text-muted-foreground">Date of Birth</p>
                           <p>{new Date(student.dateOfBirth).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric'})}</p>
                       </div>
                       <div>
                           <p className="font-medium text-muted-foreground">Student Phone</p>
                           <p>{student.studentContact}</p>
                       </div>
                   </div>
                   <Separator />
                   <div>
                        <h4 className="font-semibold text-base mb-3 flex items-center gap-2">
                            <Users className="h-5 w-5 text-primary/80"/>
                            Guardian Information
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                            <div>
                                <p className="font-medium text-muted-foreground">Guardian Name</p>
                                <p>{student.guardian.name}</p>
                            </div>
                            <div>
                                <p className="font-medium text-muted-foreground">Relationship</p>
                                <p>{student.guardian.relationship}</p>
                            </div>
                             <div>
                                <p className="font-medium text-muted-foreground">Guardian Contact</p>
                                <p className="flex items-center gap-2">
                                    <Phone className="h-4 w-4"/>
                                    {student.guardian.contact}
                                </p>
                            </div>
                        </div>
                   </div>
                </CardContent>
                <CardFooter>
                    <Button disabled>
                        <FileText className="mr-2"/>
                        View Full Academic Profile
                    </Button>
                </CardFooter>
            </Card>
        </div>
      </div>
    </div>
  );
}
