
'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { format } from 'date-fns';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
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
import { HeartPulse, User, Phone, Stethoscope, ShieldAlert, FileText, CalendarIcon, AlertCircle, Lock, Clock, MapPin, CheckCircle, FileDown, Loader2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { firestore } from '@/lib/firebase';
import { collection, query, onSnapshot, where, doc, getDoc, addDoc, serverTimestamp, orderBy, Timestamp } from 'firebase/firestore';
import { useSearchParams } from 'next/navigation';


type Child = {
    id: string;
    name: string;
    class: string;
};

type Incident = {
  id: string;
  date: Timestamp;
  time: string;
  location: string;
  type: 'Health' | 'Discipline' | 'Accident' | 'Bullying' | 'Safety Issue' | 'Other';
  description: string;
  reportedBy: string;
  status: 'Reported' | 'Under Review' | 'Resolved' | 'Archived';
  actionsTaken: string;
  followUpNeeded: string;
};

type Medication = {
    id: string;
    date: Timestamp;
    medication: string;
    dosage: string;
    administeredBy: string;
};

type HealthRecord = {
    allergies: string[];
    conditions: string[];
    emergencyContact: { name: string; relationship: string; phone: string };
    lastHealthCheck?: string;
};

export default function ParentHealthPage() {
    const searchParams = useSearchParams();
    const schoolId = searchParams.get('schoolId');
    const [childrenData, setChildrenData] = React.useState<Child[]>([]);
    const [selectedChild, setSelectedChild] = React.useState<string | undefined>();
    const [healthRecord, setHealthRecord] = React.useState<HealthRecord | null>(null);
    const [incidents, setIncidents] = React.useState<Incident[]>([]);
    const [medications, setMedications] = React.useState<Medication[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);

    const [absenceDate, setAbsenceDate] = React.useState<Date | undefined>(new Date());
    const [absenceReason, setAbsenceReason] = React.useState('');
    const [selectedIncident, setSelectedIncident] = React.useState<Incident | null>(null);
    const { toast } = useToast();

    React.useEffect(() => {
        if (!schoolId) return;
        // In a real app, you would filter by parent ID. For now, we fetch a few students.
        const q = query(collection(firestore, 'schools', schoolId, 'students'), where('role', '==', 'Student'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedChildren = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Child));
            setChildrenData(fetchedChildren);
            if (!selectedChild && fetchedChildren.length > 0) {
                setSelectedChild(fetchedChildren[0].id);
            }
        });
        return () => unsubscribe();
    }, [schoolId, selectedChild]);
    
    React.useEffect(() => {
        if (!selectedChild || !schoolId) return;

        setIsLoading(true);
        const childRef = doc(firestore, 'schools', schoolId, 'students', selectedChild);
        const unsubChild = onSnapshot(childRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                setHealthRecord({
                    allergies: data.allergies || ['None known'],
                    conditions: data.medicalConditions ? [data.medicalConditions] : ['None known'],
                    emergencyContact: {
                        name: data.emergencyContactName || 'N/A',
                        relationship: 'Parent/Guardian',
                        phone: data.parentPhone || 'N/A',
                    },
                    lastHealthCheck: data.lastHealthCheck || 'N/A',
                });
            }
            setIsLoading(false);
        });

        const incidentsQuery = query(collection(firestore, 'schools', schoolId, 'incidents'), where('studentId', '==', selectedChild), orderBy('date', 'desc'));
        const unsubIncidents = onSnapshot(incidentsQuery, (snapshot) => {
            setIncidents(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Incident)));
        });

        const medsQuery = query(collection(firestore, 'schools', schoolId, 'medications'), where('studentId', '==', selectedChild), orderBy('date', 'desc'));
        const unsubMeds = onSnapshot(medsQuery, (snapshot) => {
            setMedications(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Medication)));
        });


        return () => {
            unsubChild();
            unsubIncidents();
            unsubMeds();
        };

    }, [selectedChild, schoolId]);

    const handleReportAbsence = async () => {
        if (!selectedChild || !absenceDate || !absenceReason || !schoolId) {
            toast({ title: 'Missing Information', description: 'Please select a date and provide a reason.', variant: 'destructive' });
            return;
        }

        try {
            await addDoc(collection(firestore, 'schools', schoolId, 'absences'), {
                studentId: selectedChild,
                studentName: childrenData.find(c => c.id === selectedChild)?.name,
                date: Timestamp.fromDate(absenceDate),
                reason: absenceReason,
                reportedBy: 'Parent', // In a real app, use parent's ID/name
                reportedAt: serverTimestamp(),
            });

            toast({
                title: "Absence Reported",
                description: "The school has been notified of your child's absence.",
            });
            setAbsenceReason('');
        } catch (error) {
            console.error("Error reporting absence:", error);
            toast({ title: 'Submission Failed', description: 'Could not report absence. Please try again.', variant: 'destructive' });
        }
    }

    const hasNewIncident = incidents.some(inc => inc.status === 'Reported');
    
    const handleDownloadReport = () => {
        toast({
            title: "Downloading Report",
            description: "A comprehensive health report for your child is being generated.",
        });
    }

    if (isLoading) {
      return (
        <div className="p-8 h-full flex items-center justify-center">
            <Loader2 className="h-10 w-10 animate-spin text-primary"/>
        </div>
      )
    }

    if (!schoolId) {
        return <div className="p-8">Error: School ID is missing from URL.</div>
    }

    return (
        <Dialog onOpenChange={(open) => !open && setSelectedIncident(null)}>
            <div className="p-4 sm:p-6 lg:p-8 space-y-6">
                <div className="mb-2">
                    <h1 className="font-headline text-3xl font-bold flex items-center gap-2">
                        <HeartPulse className="h-8 w-8 text-primary" />
                        Health &amp; Incidents
                    </h1>
                    <p className="text-muted-foreground">View health records and incident reports for your child.</p>
                </div>

                <Card>
                    <CardHeader>
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            <div className="flex items-center gap-2">
                                <User className="h-5 w-5 text-primary"/>
                                <Select value={selectedChild} onValueChange={setSelectedChild}>
                                    <SelectTrigger className="w-full md:w-[240px]">
                                    <SelectValue placeholder="Select a child" />
                                    </SelectTrigger>
                                    <SelectContent>
                                    {childrenData.map((child) => (
                                        <SelectItem key={child.id} value={child.id}>{child.name}</SelectItem>
                                    ))}
                                    </SelectContent>
                                </Select>
                            </div>
                             <div className="flex w-full flex-col sm:flex-row md:w-auto items-center gap-2">
                                <Dialog>
                                    <DialogTrigger asChild>
                                        <Button variant="outline" className="w-full md:w-auto">Report an Absence</Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>Report Child's Absence</DialogTitle>
                                            <DialogDescription>
                                                Notify the school about your child's absence. This will be sent to the school office and class teacher.
                                            </DialogDescription>
                                        </DialogHeader>
                                        <div className="grid gap-4 py-4">
                                            <div className="space-y-2">
                                                <Label>Date of Absence</Label>
                                                <Popover>
                                                    <PopoverTrigger asChild>
                                                    <Button
                                                        variant={"outline"}
                                                        className={cn("w-full justify-start text-left font-normal", !absenceDate && "text-muted-foreground")}
                                                    >
                                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                                        {absenceDate ? format(absenceDate, "PPP") : <span>Pick a date</span>}
                                                    </Button>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-auto p-0">
                                                        <Calendar mode="single" selected={absenceDate} onSelect={setAbsenceDate} initialFocus />
                                                    </PopoverContent>
                                                </Popover>
                                            </div>
                                                <div className="space-y-2">
                                                <Label htmlFor="absence-reason">Reason for Absence</Label>
                                                <Textarea id="absence-reason" placeholder="e.g., Doctor's appointment, feeling unwell..." value={absenceReason} onChange={(e) => setAbsenceReason(e.target.value)} />
                                            </div>
                                        </div>
                                        <DialogFooter>
                                            <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                                            <DialogClose asChild>
                                                <Button onClick={handleReportAbsence}>Send Notification</Button>
                                            </DialogClose>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>
                                <Button variant="secondary" className="w-full md:w-auto" onClick={handleDownloadReport}>
                                    <FileDown className="mr-2 h-4 w-4"/>
                                    Download Report
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                </Card>

                {hasNewIncident && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>New Incident Report</AlertTitle>
                        <AlertDescription>
                            A new incident has been logged for {childrenData.find(c => c.id === selectedChild)?.name}. Please review the details in the Incident Log below.
                        </AlertDescription>
                    </Alert>
                )}

                <div className="grid gap-8 lg:grid-cols-3">
                    <div className="lg:col-span-1 space-y-8">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <ShieldAlert className="h-5 w-5 text-red-500" />
                                    Known Allergies
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-x-2">
                                    {healthRecord?.allergies.map(allergy => (
                                        <Badge key={allergy} variant={allergy !== "None" && allergy !== "None known" ? "destructive" : "secondary"}>{allergy}</Badge>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <Stethoscope className="h-5 w-5 text-primary"/>
                                    Ongoing Conditions
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                <div className="space-x-2">
                                    {healthRecord?.conditions.map(condition => (
                                        <Badge key={condition} variant="secondary">{condition}</Badge>
                                    ))}
                                </div>
                                <p className="text-xs text-muted-foreground flex items-center gap-1"><Lock className="h-3 w-3"/> Medical records are confidential.</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <Phone className="h-5 w-5 text-primary"/>
                                    Emergency Contact
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="text-sm">
                            <p><span className="font-medium">{healthRecord?.emergencyContact.name}</span> ({healthRecord?.emergencyContact.relationship})</p>
                            <p className="text-muted-foreground">{healthRecord?.emergencyContact.phone}</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <CalendarIcon className="h-5 w-5 text-primary"/>
                                    Last Health Check
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="text-sm">
                               {healthRecord?.lastHealthCheck && healthRecord.lastHealthCheck !== 'N/A' ? (
                                    <p className="font-semibold">{format(new Date(healthRecord.lastHealthCheck), 'PPP')}</p>
                               ) : (
                                    <p className="font-semibold text-muted-foreground">No date recorded.</p>
                               )}
                            </CardContent>
                        </Card>
                    </div>
                    <div className="lg:col-span-2 space-y-8">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <AlertCircle className="h-5 w-5 text-primary"/>
                                    Incident Log
                                </CardTitle>
                                <CardDescription>Records of any health or safety incidents at school.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="w-full overflow-auto rounded-lg border">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Date</TableHead>
                                                <TableHead>Type</TableHead>
                                                <TableHead>Description</TableHead>
                                                <TableHead>Status</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {incidents.length > 0 ? incidents.map(incident => (
                                                <DialogTrigger asChild key={incident.id}>
                                                    <TableRow className="cursor-pointer" onClick={() => setSelectedIncident(incident)}>
                                                        <TableCell className="font-medium">{incident.date.toDate().toLocaleDateString()}</TableCell>
                                                        <TableCell><Badge variant={incident.type === 'Health' ? 'destructive' : 'secondary'}>{incident.type}</Badge></TableCell>
                                                        <TableCell className="text-muted-foreground max-w-xs truncate">{incident.description}</TableCell>
                                                        <TableCell><Badge variant="outline">{incident.status}</Badge></TableCell>
                                                    </TableRow>
                                                </DialogTrigger>
                                            )) : (
                                                <TableRow>
                                                    <TableCell colSpan={4} className="h-24 text-center">No incidents recorded.</TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <FileText className="h-5 w-5 text-primary"/>
                                    Medication Log
                                </CardTitle>
                                <CardDescription>A log of medications administered at school.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Alert variant="default">
                                    <AlertTitle>Confidentiality Notice</AlertTitle>
                                    <AlertDescription>This log only shows medications administered with prior parental consent. For a full medical history, please consult the school nurse.</AlertDescription>
                                </Alert>
                                <div className="w-full overflow-auto rounded-lg border mt-4">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Date & Time</TableHead>
                                                <TableHead>Medication</TableHead>
                                                <TableHead>Dosage</TableHead>
                                                <TableHead>Administered By</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {medications.length > 0 ? medications.map(med => (
                                                <TableRow key={med.id}>
                                                    <TableCell className="font-medium">{med.date.toDate().toLocaleString()}</TableCell>
                                                    <TableCell>{med.medication}</TableCell>
                                                    <TableCell>{med.dosage}</TableCell>
                                                    <TableCell className="text-muted-foreground">{med.administeredBy}</TableCell>
                                                </TableRow>
                                            )) : (
                                                <TableRow>
                                                    <TableCell colSpan={4} className="h-24 text-center">No medications administered at school.</TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>

            {selectedIncident && (
                <DialogContent className="sm:max-w-xl">
                    <DialogHeader>
                        <DialogTitle>Incident Details</DialogTitle>
                        <DialogDescription>A detailed summary of the incident reported on {selectedIncident.date.toDate().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}.</DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-6">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <p className="font-medium text-muted-foreground flex items-center gap-2"><Clock className="h-4 w-4"/>Time</p>
                                <p>{selectedIncident.time}</p>
                            </div>
                            <div>
                                <p className="font-medium text-muted-foreground flex items-center gap-2"><MapPin className="h-4 w-4"/>Location</p>
                                <p>{selectedIncident.location}</p>
                            </div>
                        </div>
                        <Separator />
                        <div>
                            <h4 className="font-semibold text-primary mb-2">Description of Incident</h4>
                            <p className="text-sm text-muted-foreground">{selectedIncident.description}</p>
                        </div>
                        <Separator />
                        <div>
                            <h4 className="font-semibold text-primary mb-2">Actions Taken by School Staff</h4>
                            <p className="text-sm text-muted-foreground">{selectedIncident.actionsTaken}</p>
                        </div>
                        <Separator />
                        <div>
                            <h4 className="font-semibold text-primary mb-2">Follow-up Needed</h4>
                            <div className="flex items-center gap-2">
                                <CheckCircle className="h-5 w-5 text-green-600" />
                                <p className="text-sm">{selectedIncident.followUpNeeded}</p>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button variant="outline">Close</Button>
                        </DialogClose>
                    </DialogFooter>
                </DialogContent>
            )}
        </Dialog>
    );
}

  