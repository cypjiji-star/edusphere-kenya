
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
  } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { HeartPulse, Search, Filter, ChevronDown, FileDown, AlertCircle, Users, Stethoscope, Pill, User, Phone, ShieldAlert, Lock, FileText } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';


type IncidentType = 'Health' | 'Discipline' | 'Accident' | 'Other';
type IncidentStatus = 'Reported' | 'Under Review' | 'Resolved' | 'Archived';

type Incident = {
  id: string;
  studentName: string;
  studentAvatar: string;
  class: string;
  type: IncidentType;
  description: string;
  date: string;
  reportedBy: string;
  status: IncidentStatus;
};

const mockIncidents: Incident[] = [
    { id: 'inc-1', studentName: 'Student 1', studentAvatar: 'https://picsum.photos/seed/f4-student1/100', class: 'Form 4', type: 'Health', description: 'Complained of a headache and feeling dizzy during the chemistry lesson.', date: '2024-07-15', reportedBy: 'Ms. Wanjiku', status: 'Under Review' },
    { id: 'inc-2', studentName: 'Student 32', studentAvatar: 'https://picsum.photos/seed/f3-student1/100', class: 'Form 3', type: 'Accident', description: 'Slipped and fell during break time. Minor scrape on the knee.', date: '2024-07-12', reportedBy: 'Mr. Otieno', status: 'Resolved' },
    { id: 'inc-3', studentName: 'Student 60', studentAvatar: 'https://picsum.photos/seed/f2-student1/100', class: 'Form 2', type: 'Discipline', description: 'Skipped afternoon classes.', date: '2024-07-10', reportedBy: 'Mr. Kamau', status: 'Resolved' },
];

const students = [
  { id: 'f4-chem-1', name: 'Student 1', class: 'Form 4' },
  { id: 'f4-chem-2', name: 'Student 2', class: 'Form 4' },
  { id: 'f3-math-1', name: 'Student 32', class: 'Form 3' },
];

const studentHealthRecords = {
    'f4-chem-1': {
        studentName: 'Student 1',
        allergies: ['Peanuts', 'Pollen'],
        conditions: ['Asthma (mild)'],
        emergencyContact: { name: 'Joseph Kariuki', relationship: 'Father', phone: '0722 123 456' }
    },
    'f4-chem-2': {
        studentName: 'Student 2',
        allergies: ['None known'],
        conditions: ['None known'],
        emergencyContact: { name: 'Mary Wambui', relationship: 'Mother', phone: '0722 987 654' }
    },
    'f3-math-1': {
        studentName: 'Student 32',
        allergies: ['Lactose Intolerance'],
        conditions: ['None known'],
        emergencyContact: { name: 'David Omondi', relationship: 'Father', phone: '0711 555 888' }
    }
}

const getStatusBadge = (status: IncidentStatus) => {
    switch (status) {
        case 'Reported': return <Badge variant="secondary">Reported</Badge>;
        case 'Under Review': return <Badge variant="secondary" className="bg-yellow-500 text-white hover:bg-yellow-600">Under Review</Badge>;
        case 'Resolved': return <Badge variant="default" className="bg-green-600 hover:bg-green-700">Resolved</Badge>;
        case 'Archived': return <Badge variant="outline">Archived</Badge>;
    }
}

export default function AdminHealthPage() {
    const [selectedHealthStudent, setSelectedHealthStudent] = React.useState<keyof typeof studentHealthRecords | null>(null);
    const currentHealthRecord = selectedHealthStudent ? studentHealthRecords[selectedHealthStudent] : null;

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <div className="mb-6">
                <h1 className="font-headline text-3xl font-bold flex items-center gap-2">
                    <HeartPulse className="h-8 w-8 text-primary" />
                    Health &amp; Incident Management
                </h1>
                <p className="text-muted-foreground">Oversee school-wide health records, incidents, and medication logs.</p>
            </div>
            
            <Tabs defaultValue="dashboard">
                <TabsList className="mb-4 grid w-full grid-cols-4 md:w-auto md:inline-flex">
                    <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
                    <TabsTrigger value="log">Incident Log</TabsTrigger>
                    <TabsTrigger value="records">Health Records</TabsTrigger>
                    <TabsTrigger value="medication">Medication</TabsTrigger>
                </TabsList>
                <TabsContent value="dashboard">
                     <Card>
                        <CardHeader>
                            <CardTitle>Health &amp; Safety Dashboard</CardTitle>
                            <CardDescription>A summary of health and incident metrics across the school.</CardDescription>
                        </CardHeader>
                        <CardContent>
                             <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-6">
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium">Active Incidents</CardTitle>
                                        <AlertCircle className="h-4 w-4 text-muted-foreground" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">1</div>
                                        <p className="text-xs text-muted-foreground">Currently under review</p>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium">Students with Allergies</CardTitle>
                                        <Users className="h-4 w-4 text-muted-foreground" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">12</div>
                                        <p className="text-xs text-muted-foreground">Across all classes</p>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium">Ongoing Conditions</CardTitle>
                                        <Stethoscope className="h-4 w-4 text-muted-foreground" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">5</div>
                                        <p className="text-xs text-muted-foreground">e.g., Asthma, Diabetes</p>
                                    </CardContent>
                                </Card>
                                 <Card>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium">Medications Today</CardTitle>
                                        <Pill className="h-4 w-4 text-muted-foreground" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">1</div>
                                        <p className="text-xs text-muted-foreground">1 administered today</p>
                                    </CardContent>
                                </Card>
                            </div>
                        </CardContent>
                     </Card>
                </TabsContent>
                <TabsContent value="log">
                     <Card>
                        <CardHeader>
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                <div>
                                    <CardTitle>School-Wide Incident Log</CardTitle>
                                    <CardDescription>A log of all reported incidents from teachers and staff.</CardDescription>
                                </div>
                                <Button variant="outline" disabled>
                                    <FileDown className="mr-2" />
                                    Export Log
                                </Button>
                            </div>
                            <div className="mt-4 flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
                                <div className="relative w-full md:max-w-sm">
                                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                    type="search"
                                    placeholder="Search by student, class, or keyword..."
                                    className="w-full bg-background pl-8"
                                    />
                                </div>
                                <div className="flex w-full flex-col gap-2 md:w-auto md:flex-row">
                                    <Select>
                                        <SelectTrigger className="w-full md:w-[180px]">
                                            <Filter className="mr-2 h-4 w-4" />
                                            <SelectValue placeholder="Filter by type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Types</SelectItem>
                                            <SelectItem value="Health">Health</SelectItem>
                                            <SelectItem value="Discipline">Discipline</SelectItem>
                                            <SelectItem value="Accident">Accident</SelectItem>
                                        </SelectContent>
                                    </Select>
                                     <Select>
                                        <SelectTrigger className="w-full md:w-[180px]">
                                            <Filter className="mr-2 h-4 w-4" />
                                            <SelectValue placeholder="Filter by status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Statuses</SelectItem>
                                            <SelectItem value="Reported">Reported</SelectItem>
                                            <SelectItem value="Under Review">Under Review</SelectItem>
                                            <SelectItem value="Resolved">Resolved</SelectItem>
                                            <SelectItem value="Archived">Archived</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                             <div className="w-full overflow-auto rounded-lg border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Student</TableHead>
                                            <TableHead>Class</TableHead>
                                            <TableHead>Type</TableHead>
                                            <TableHead>Date</TableHead>
                                            <TableHead>Reported By</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {mockIncidents.map(incident => (
                                            <TableRow key={incident.id}>
                                                <TableCell>
                                                    <div className="flex items-center gap-3">
                                                        <Avatar className="h-8 w-8">
                                                            <AvatarImage src={incident.studentAvatar} alt={incident.studentName} />
                                                            <AvatarFallback>{incident.studentName.charAt(0)}</AvatarFallback>
                                                        </Avatar>
                                                        <span className="font-medium">{incident.studentName}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell><Badge variant={incident.type === 'Health' ? 'destructive' : 'outline'}>{incident.type}</Badge></TableCell>
                                                <TableCell>{incident.date}</TableCell>
                                                <TableCell>{incident.class}</TableCell>
                                                <TableCell>{incident.reportedBy}</TableCell>
                                                <TableCell>{getStatusBadge(incident.status)}</TableCell>
                                                <TableCell className="text-right"><Button variant="ghost" size="sm" disabled>View Details</Button></TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="records">
                     <Card>
                        <CardHeader>
                            <CardTitle>Student Health Records</CardTitle>
                            <CardDescription>Look up important health information for any student in the school. Access is restricted and logged.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="max-w-md mb-6">
                                <Label htmlFor="student-health-select">Select a Student</Label>
                                <Select onValueChange={(value: keyof typeof studentHealthRecords) => setSelectedHealthStudent(value)}>
                                    <SelectTrigger id="student-health-select">
                                        <SelectValue placeholder="Search and select a student..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {students.map((s) => (
                                            <SelectItem key={s.id} value={s.id}>{s.name} ({s.class})</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            {currentHealthRecord ? (
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <User className="h-5 w-5 text-primary" />
                                            {currentHealthRecord.studentName}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        <div>
                                            <h4 className="font-semibold text-sm mb-2 flex items-center gap-2"><ShieldAlert className="h-4 w-4 text-red-500" /> Known Allergies</h4>
                                            <div className="space-x-2">
                                                {currentHealthRecord.allergies.map(allergy => (
                                                    <Badge key={allergy} variant="destructive">{allergy}</Badge>
                                                ))}
                                            </div>
                                        </div>
                                        <Separator />
                                        <div>
                                            <h4 className="font-semibold text-sm mb-2 flex items-center gap-2"><Stethoscope className="h-4 w-4" /> Ongoing Conditions</h4>
                                            <div className="space-x-2">
                                                {currentHealthRecord.conditions.map(condition => (
                                                    <Badge key={condition} variant="secondary">{condition}</Badge>
                                                ))}
                                            </div>
                                        </div>
                                        <Separator />
                                        <div>
                                            <h4 className="font-semibold text-sm mb-2 flex items-center gap-2"><Phone className="h-4 w-4" /> Emergency Contact</h4>
                                            <div className="text-sm">
                                                <p><span className="font-medium">{currentHealthRecord.emergencyContact.name}</span> ({currentHealthRecord.emergencyContact.relationship})</p>
                                                <p className="text-muted-foreground">{currentHealthRecord.emergencyContact.phone}</p>
                                            </div>
                                        </div>
                                        <Separator />
                                        <div>
                                            <h4 className="font-semibold text-sm mb-2 flex items-center gap-2"><FileText className="h-4 w-4" /> Medical History</h4>
                                            <Alert variant="default">
                                                <AlertTitle>No Detailed History</AlertTitle>
                                                <AlertDescription>
                                                    A comprehensive medical or vaccination history has not been provided for this student. For detailed records, please contact the student's guardian.
                                                </AlertDescription>
                                            </Alert>
                                        </div>
                                    </CardContent>
                                </Card>
                            ) : (
                                <div className="flex min-h-[300px] items-center justify-center rounded-lg border-2 border-dashed border-muted">
                                    <div className="text-center text-muted-foreground">
                                        <Stethoscope className="mx-auto h-12 w-12" />
                                        <h3 className="mt-4 text-lg font-semibold">Select a student to view their record.</h3>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="medication">
                      <Card>
                        <CardHeader>
                            <CardTitle>Medication Log</CardTitle>
                            <CardDescription>A log of all medication administered at school. Access is restricted.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Alert variant="destructive">
                                <Lock className="h-4 w-4"/>
                                <AlertTitle>Access Restricted</AlertTitle>
                                <AlertDescription>
                                   Access to the centralized medication log is restricted to the School Nurse and authorized health staff.
                                </AlertDescription>
                            </Alert>
                        </CardContent>
                      </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}

    