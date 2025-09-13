
'use client';

import * as React from 'react';
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
import { Badge } from '@/components/ui/badge';
import { HeartPulse, User, Phone, Stethoscope, ShieldAlert, FileText, CalendarIcon, AlertCircle, Lock, Clock, MapPin, CheckCircle } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';


const childrenData = [
  { id: 'child-1', name: 'John Doe', class: 'Form 4' },
  { id: 'child-2', name: 'Jane Doe', class: 'Form 1' },
];

const healthData = {
    'child-1': {
        allergies: ['Asthma (mild)'],
        conditions: ['None'],
        emergencyContact: { name: 'Joseph Kariuki', relationship: 'Father', phone: '0722 123 456' },
        lastHealthCheck: '2024-01-15',
        incidents: [
            { id: 'inc-1', date: '2024-07-12', time: '11:15 AM', location: 'Playground', type: 'Accident' as const, description: 'Slipped and fell during break time. Minor scrape on the knee.', reportedBy: 'Mr. Otieno', status: 'Resolved' as const, actionsTaken: 'Cleaned the scrape and applied a plaster. Student returned to class.', followUpNeeded: 'None' },
        ],
        medications: [
            { id: 'med-1', date: '2024-07-12 11:30 AM', medication: 'Antiseptic Wipe & Plaster', dosage: 'N/A', administeredBy: 'Nurse Joy' },
        ]
    },
    'child-2': {
        allergies: ['Peanuts'],
        conditions: ['None'],
        emergencyContact: { name: 'Mr. Omondi', relationship: 'Father', phone: '0712 345 678' },
        lastHealthCheck: '2024-01-20',
        incidents: [
            { id: 'inc-2', date: '2024-06-20', time: '12:45 PM', location: 'Cafeteria', type: 'Health' as const, description: 'Complained of a stomach ache after lunch.', reportedBy: 'Ms. Njeri', status: 'Resolved' as const, actionsTaken: 'Student rested at the nurse\'s office for 30 minutes. Parent was notified via phone call.', followUpNeeded: 'Monitor at home' },
        ],
        medications: []
    }
}

type Incident = (typeof healthData)['child-1']['incidents'][0];

export default function ParentHealthPage() {
    const [selectedChild, setSelectedChild] = React.useState(childrenData[0].id);
    const [clientReady, setClientReady] = React.useState(false);
    const [absenceDate, setAbsenceDate] = React.useState<Date | undefined>(new Date());
    const [selectedIncident, setSelectedIncident] = React.useState<Incident | null>(null);
    const { toast } = useToast();

    React.useEffect(() => {
        setClientReady(true);
    }, []);
    
    const data = healthData[selectedChild as keyof typeof healthData];

    const handleReportAbsence = () => {
        toast({
            title: "Absence Reported",
            description: "The school has been notified of your child's absence.",
        });
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
                                            <Textarea id="absence-reason" placeholder="e.g., Doctor's appointment, feeling unwell..." />
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
                        </div>
                    </CardHeader>
                </Card>

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
                                    {data.allergies.map(allergy => (
                                        <Badge key={allergy} variant={allergy !== "None" ? "destructive" : "secondary"}>{allergy}</Badge>
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
                                    <Badge variant="secondary">{data.conditions.join(', ') || 'None'}</Badge>
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
                            <p><span className="font-medium">{data.emergencyContact.name}</span> ({data.emergencyContact.relationship})</p>
                            <p className="text-muted-foreground">{data.emergencyContact.phone}</p>
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
                                {clientReady && <p className="font-semibold">{new Date(data.lastHealthCheck).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>}
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
                                            {data.incidents.length > 0 ? data.incidents.map(incident => (
                                                <DialogTrigger asChild key={incident.id}>
                                                    <TableRow className="cursor-pointer" onClick={() => setSelectedIncident(incident)}>
                                                        <TableCell className="font-medium">{clientReady ? new Date(incident.date).toLocaleDateString() : ''}</TableCell>
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
                                            {data.medications.length > 0 ? data.medications.map(med => (
                                                <TableRow key={med.id}>
                                                    <TableCell className="font-medium">{med.date}</TableCell>
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
                        <DialogDescription>A detailed summary of the incident reported on {new Date(selectedIncident.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}.</DialogDescription>
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
