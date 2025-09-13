
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
import { HeartPulse, User, Phone, Stethoscope, ShieldAlert, FileText, CalendarIcon, AlertCircle } from 'lucide-react';
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
        incidents: [
            { id: 'inc-1', date: '2024-07-12', type: 'Accident', description: 'Slipped and fell during break time. Minor scrape on the knee.', reportedBy: 'Mr. Otieno', status: 'Resolved' },
        ],
        medications: [
            { id: 'med-1', date: '2024-07-12 11:30 AM', medication: 'Antiseptic Wipe & Plaster', dosage: 'N/A', administeredBy: 'Nurse Joy' },
        ]
    },
    'child-2': {
        allergies: ['Peanuts'],
        conditions: ['None'],
        emergencyContact: { name: 'Mr. Omondi', relationship: 'Father', phone: '0712 345 678' },
        incidents: [
            { id: 'inc-2', date: '2024-06-20', type: 'Health', description: 'Complained of a stomach ache after lunch.', reportedBy: 'Ms. Njeri', status: 'Resolved' },
        ],
        medications: []
    }
}

export default function ParentHealthPage() {
    const [selectedChild, setSelectedChild] = React.useState(childrenData[0].id);
    const [clientReady, setClientReady] = React.useState(false);
    const [absenceDate, setAbsenceDate] = React.useState<Date | undefined>(new Date());
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
                    </div>
                </CardHeader>
            </Card>

            <div className="grid gap-8 lg:grid-cols-3">
                <div className="lg:col-span-1 space-y-8">
                     <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <Stethoscope className="h-5 w-5 text-primary"/>
                                Health Summary
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div>
                                <h4 className="font-semibold text-sm mb-2 flex items-center gap-2"><ShieldAlert className="h-4 w-4 text-red-500" /> Known Allergies</h4>
                                <div className="space-x-2">
                                    {data.allergies.map(allergy => (
                                        <Badge key={allergy} variant={allergy !== "None" ? "destructive" : "secondary"}>{allergy}</Badge>
                                    ))}
                                </div>
                            </div>
                            <Separator />
                            <div>
                                <h4 className="font-semibold text-sm mb-2 flex items-center gap-2"><HeartPulse className="h-4 w-4" /> Ongoing Conditions</h4>
                                <div className="space-x-2">
                                    <Badge variant="secondary">{data.conditions.join(', ') || 'None'}</Badge>
                                </div>
                            </div>
                            <Separator />
                             <div>
                                <h4 className="font-semibold text-sm mb-2 flex items-center gap-2"><Phone className="h-4 w-4" /> Emergency Contact</h4>
                                <div className="text-sm">
                                    <p><span className="font-medium">{data.emergencyContact.name}</span> ({data.emergencyContact.relationship})</p>
                                    <p className="text-muted-foreground">{data.emergencyContact.phone}</p>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Dialog>
                                <DialogTrigger asChild>
                                    <Button variant="outline" className="w-full">Report an Absence</Button>
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
                        </CardFooter>
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
                                            <TableRow key={incident.id}>
                                                <TableCell className="font-medium">{clientReady ? new Date(incident.date).toLocaleDateString() : ''}</TableCell>
                                                <TableCell><Badge variant={incident.type === 'Health' ? 'destructive' : 'secondary'}>{incident.type}</Badge></TableCell>
                                                <TableCell className="text-muted-foreground">{incident.description}</TableCell>
                                                <TableCell><Badge variant="outline">{incident.status}</Badge></TableCell>
                                            </TableRow>
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
    );
}
