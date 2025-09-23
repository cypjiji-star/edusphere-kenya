

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
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
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
import { HeartPulse, Search, Filter, ChevronDown, FileDown, AlertCircle, Users, Stethoscope, Pill, User, Phone, ShieldAlert, Lock, FileText, CalendarIcon, Siren, Send, Paperclip, MapPin, X, Loader2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, LabelList } from 'recharts';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { firestore, storage } from '@/lib/firebase';
import { collection, query, onSnapshot, where, doc, getDoc, addDoc, serverTimestamp, orderBy, Timestamp, updateDoc } from 'firebase/firestore';
import { useSearchParams } from 'next/navigation';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useAuth } from '@/context/auth-context';


type IncidentType = 'Health' | 'Discipline' | 'Accident' | 'Bullying' | 'Safety Issue' | 'Other';
type IncidentStatus = 'Reported' | 'Under Review' | 'Resolved' | 'Archived';

type Incident = {
  id: string;
  studentId: string;
  studentName: string;
  studentAvatar: string;
  class: string;
  type: IncidentType;
  description: string;
  date: Timestamp;
  reportedBy: string;
  status: IncidentStatus;
  location?: string;
  attachmentUrl?: string;
  attachmentName?: string;
};

type TeacherStudent = { id: string; name: string; class: string; allergies?: string; medicalConditions?: string; };

const incidentSchema = z.object({
  studentId: z.string({ required_error: 'Please select a student.' }),
  incidentType: z.enum(['Health', 'Discipline', 'Accident', 'Bullying', 'Safety Issue', 'Other']),
  incidentDate: z.date({ required_error: 'An incident date is required.' }),
  incidentTime: z.string().min(1, 'Time is required'),
  location: z.string().optional(),
  description: z.string().min(20, 'Please provide a detailed description (at least 20 characters).'),
  actionsTaken: z.string().min(10, 'Please describe the actions taken.'),
  urgency: z.enum(['Low', 'Medium', 'High', 'Critical']),
});

type IncidentFormValues = z.infer<typeof incidentSchema>;

type HealthRecord = {
    allergies: string[];
    conditions: string[];
    emergencyContact: { name: string; relationship: string; phone: string };
};

type Medication = {
    id: string;
    studentName: string;
    medication: string;
    dosage: string;
    time: Timestamp;
    givenBy: string;
};


const getStatusBadge = (status: IncidentStatus) => {
    switch (status) {
        case 'Reported': return <Badge variant="secondary">Reported</Badge>;
        case 'Under Review': return <Badge variant="secondary" className="bg-yellow-500 text-white hover:bg-yellow-600">Under Review</Badge>;
        case 'Resolved': return <Badge variant="default" className="bg-green-600 hover:bg-green-700">Resolved</Badge>;
        case 'Archived': return <Badge variant="outline">Archived</Badge>;
    }
}

const getUrgencyBadge = (urgency: IncidentFormValues['urgency']) => {
    switch (urgency) {
        case 'Critical': return 'bg-red-700 text-white';
        case 'High': return 'bg-red-500 text-white';
        case 'Medium': return 'bg-yellow-500 text-white';
        case 'Low': return 'bg-blue-500 text-white';
    }
}

const chartConfig = {
  count: {
    label: 'Incidents',
    color: 'hsl(var(--primary))',
  },
} satisfies React.ComponentProps<typeof ChartContainer>['config'];


export default function AdminHealthPage() {
    const { toast } = useToast();
    const searchParams = useSearchParams();
    const schoolId = searchParams.get('schoolId');
    const { user } = useAuth();
    const [allStudents, setAllStudents] = React.useState<TeacherStudent[]>([]);
    const [selectedHealthStudent, setSelectedHealthStudent] = React.useState<string | null>(null);
    const [currentHealthRecord, setCurrentHealthRecord] = React.useState<HealthRecord | null>(null);
    const [incidents, setIncidents] = React.useState<Incident[]>([]);
    const [medicationLog, setMedicationLog] = React.useState<Medication[]>([]);
    
    const [selectedIncident, setSelectedIncident] = React.useState<Incident | null>(null);
    const [updatedStatus, setUpdatedStatus] = React.useState<IncidentStatus | undefined>();
    const [searchTerm, setSearchTerm] = React.useState('');
    const [typeFilter, setTypeFilter] = React.useState<IncidentType | 'All Types'>('All Types');
    const [statusFilter, setStatusFilter] = React.useState<IncidentStatus | 'All Statuses'>('All Statuses');
    const [attachedFile, setAttachedFile] = React.useState<File | null>(null);
    const [isSubmitting, setIsSubmitting] = React.useState(false);

    // State for medication form
    const [medStudentId, setMedStudentId] = React.useState('');
    const [medName, setMedName] = React.useState('');
    const [medDosage, setMedDosage] = React.useState('');
    const [medTime, setMedTime] = React.useState(format(new Date(), 'HH:mm'));
    const [isSavingMed, setIsSavingMed] = React.useState(false);


    const form = useForm<IncidentFormValues>({
        resolver: zodResolver(incidentSchema),
        defaultValues: {
            studentId: '',
            incidentType: 'Health',
            incidentTime: format(new Date(), 'HH:mm'),
            urgency: 'Low',
            location: '',
            description: '',
            actionsTaken: '',
        },
    });

    React.useEffect(() => {
        if (!schoolId) return;

        const studentsQuery = query(collection(firestore, `schools/${schoolId}/students`));
        const unsubscribeStudents = onSnapshot(studentsQuery, (snapshot) => {
            const studentsData = snapshot.docs.map(doc => ({ id: doc.id, name: doc.data().name, class: doc.data().class, ...doc.data() }));
            setAllStudents(studentsData);
        });

        const incidentsQuery = query(collection(firestore, `schools/${schoolId}/incidents`), orderBy('date', 'desc'));
        const unsubscribeIncidents = onSnapshot(incidentsQuery, (snapshot) => {
            const incidentsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Incident));
            setIncidents(incidentsData);
        });
        
        const medsQuery = query(collection(firestore, `schools/${schoolId}/medications`), orderBy('time', 'desc'));
        const unsubscribeMeds = onSnapshot(medsQuery, (snapshot) => {
            const medsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Medication));
            setMedicationLog(medsData);
        });

        return () => {
            unsubscribeStudents();
            unsubscribeIncidents();
            unsubscribeMeds();
        }
    }, [schoolId]);

    React.useEffect(() => {
        if (selectedHealthStudent && schoolId) {
            const studentRef = doc(firestore, 'schools', schoolId, 'students', selectedHealthStudent);
            const unsubscribe = onSnapshot(studentRef, (docSnap) => {
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    setCurrentHealthRecord({
                        allergies: data.allergies ? data.allergies.split(',').map((s:string) => s.trim()) : ['None known'],
                        conditions: data.medicalConditions ? data.medicalConditions.split(',').map((s:string) => s.trim()) : ['None known'],
                        emergencyContact: {
                            name: data.emergencyContactName || 'N/A',
                            relationship: data.parentRelationship || 'Guardian',
                            phone: data.parentPhone || 'N/A',
                        }
                    });
                }
            });
            return () => unsubscribe();
        } else {
            setCurrentHealthRecord(null);
        }
    }, [selectedHealthStudent, schoolId]);
    
    React.useEffect(() => {
        if (selectedIncident) {
            setUpdatedStatus(selectedIncident.status);
        }
    }, [selectedIncident]);

    const dashboardData = React.useMemo(() => {
        const today = new Date();
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

        const monthlyIncidents = incidents.filter(i => i.date.toDate() >= startOfMonth);

        const incidentsByType = monthlyIncidents.reduce((acc, incident) => {
            acc[incident.type] = (acc[incident.type] || 0) + 1;
            return acc;
        }, {} as Record<IncidentType, number>);

        const incidentsByLocation = monthlyIncidents.reduce((acc, incident) => {
            if (incident.location) {
                acc[incident.location] = (acc[incident.location] || 0) + 1;
            }
            return acc;
        }, {} as Record<string, number>);

        const studentsWithAllergies = allStudents.filter(s => s.allergies && s.allergies.toLowerCase() !== 'none').length;
        const studentsWithConditions = allStudents.filter(s => s.medicalConditions && s.medicalConditions.toLowerCase() !== 'none').length;

        return {
            activeIncidents: incidents.filter(i => i.status === 'Reported' || i.status === 'Under Review').length,
            studentsWithAllergies,
            studentsWithConditions,
            medicationsToday: medicationLog.filter(m => m.time.toDate().toDateString() === today.toDateString()).length,
            incidentsByTypeData: Object.entries(incidentsByType).map(([name, count]) => ({ name, count })),
            incidentsByLocationData: Object.entries(incidentsByLocation).map(([name, count]) => ({ name, count })),
        };
    }, [incidents, allStudents, medicationLog]);


    async function onSubmit(values: IncidentFormValues) {
        if (!schoolId || !user) return;
        setIsSubmitting(true);
        const student = allStudents.find(s => s.id === values.studentId);
        let attachmentUrl, attachmentName;
        
        try {
            if (attachedFile) {
                const storageRef = ref(storage, `schools/${schoolId}/incident_attachments/${Date.now()}_${attachedFile.name}`);
                await uploadBytes(storageRef, attachedFile);
                attachmentUrl = await getDownloadURL(storageRef);
                attachmentName = attachedFile.name;
            }

            await addDoc(collection(firestore, 'schools', schoolId, 'incidents'), {
                ...values,
                studentId: values.studentId,
                studentName: student?.name || 'Unknown',
                studentAvatar: `https://picsum.photos/seed/${values.studentId}/100`,
                class: student?.class || 'Unknown',
                date: Timestamp.fromDate(values.incidentDate),
                reportedBy: user.displayName || 'Admin',
                reportedById: user.uid,
                status: 'Reported',
                attachmentUrl: attachmentUrl || null,
                attachmentName: attachmentName || null,
            });

            toast({
                title: 'Incident Reported',
                description: 'The incident has been logged and relevant parties have been notified.',
            });
            form.reset();
            setAttachedFile(null);
        } catch (e) {
            console.error("Error submitting incident:", e);
            toast({ variant: 'destructive', title: 'Submission Failed' });
        } finally {
            setIsSubmitting(false);
        }
    }
    
    const handleUpdateIncident = async () => {
        if (!selectedIncident || !updatedStatus || !schoolId) return;

        const incidentRef = doc(firestore, 'schools', schoolId, 'incidents', selectedIncident.id);
        try {
            await updateDoc(incidentRef, { status: updatedStatus });
            toast({
                title: 'Incident Updated',
                description: `The status for incident #${selectedIncident.id.substring(0,6)} has been set to "${updatedStatus}".`
            });
            setSelectedIncident(null);
        } catch (e) {
            console.error("Error updating incident:", e);
            toast({ variant: 'destructive', title: 'Update Failed' });
        }
    };

    const handleExport = () => {
        toast({
            title: 'Exporting Log',
            description: 'Your incident log is being exported.',
        });
    };
    
    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            setAttachedFile(event.target.files[0]);
        }
    };

    const handleRemoveFile = () => {
        setAttachedFile(null);
    };

    const handleSaveMedication = async () => {
        if (!schoolId || !medStudentId || !medName || !medDosage || !user) {
            toast({ title: "Missing Information", variant: "destructive" });
            return;
        }
        setIsSavingMed(true);
        const student = allStudents.find(s => s.id === medStudentId);
        try {
            await addDoc(collection(firestore, 'schools', schoolId, 'medications'), {
                studentId: medStudentId,
                studentName: student?.name || 'Unknown',
                medication: medName,
                dosage: medDosage,
                time: Timestamp.now(),
                givenBy: user.displayName || 'Admin',
            });

            toast({ title: 'Medication Logged', description: `${medName} was successfully logged.` });
            setMedStudentId('');
            setMedName('');
            setMedDosage('');

        } catch (e) {
            console.error("Error logging medication:", e);
            toast({ title: "Logging Failed", variant: "destructive" });
        } finally {
            setIsSavingMed(false);
        }
    };

    const filteredIncidents = incidents.filter(incident => {
        const matchesSearch = incident.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                              incident.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                              incident.reportedBy.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = typeFilter === 'All Types' || incident.type === typeFilter;
        const matchesStatus = statusFilter === 'All Statuses' || incident.status === statusFilter;
        return matchesSearch && matchesType && matchesStatus;
    });

    if (!schoolId) {
        return <div className="p-8">Error: School ID is missing from URL.</div>
    }

    return (
        <Dialog onOpenChange={(open) => !open && setSelectedIncident(null)}>
            <div className="p-4 sm:p-6 lg:p-8">
                <div className="mb-6">
                    <h1 className="font-headline text-3xl font-bold flex items-center gap-2">
                        <HeartPulse className="h-8 w-8 text-primary" />
                        Health &amp; Incident Management
                    </h1>
                    <p className="text-muted-foreground">Oversee school-wide health records, incidents, and medication logs.</p>
                </div>
                
                <Tabs defaultValue="dashboard">
                    <TabsList className="mb-4 grid w-full grid-cols-1 sm:grid-cols-5 md:w-auto md:inline-flex">
                        <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
                        <TabsTrigger value="entry">New Entry</TabsTrigger>
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
                                            <div className="text-2xl font-bold">{dashboardData.activeIncidents}</div>
                                            <p className="text-xs text-muted-foreground">Currently under review</p>
                                        </CardContent>
                                    </Card>
                                    <Card>
                                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                            <CardTitle className="text-sm font-medium">Students with Allergies</CardTitle>
                                            <Users className="h-4 w-4 text-muted-foreground" />
                                        </CardHeader>
                                        <CardContent>
                                            <div className="text-2xl font-bold">{dashboardData.studentsWithAllergies}</div>
                                            <p className="text-xs text-muted-foreground">Across all classes</p>
                                        </CardContent>
                                    </Card>
                                    <Card>
                                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                            <CardTitle className="text-sm font-medium">Ongoing Conditions</CardTitle>
                                            <Stethoscope className="h-4 w-4 text-muted-foreground" />
                                        </CardHeader>
                                        <CardContent>
                                             <div className="text-2xl font-bold">{dashboardData.studentsWithConditions}</div>
                                            <p className="text-xs text-muted-foreground">e.g., Asthma, Diabetes</p>
                                        </CardContent>
                                    </Card>
                                     <Card>
                                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                            <CardTitle className="text-sm font-medium">Medications Today</CardTitle>
                                            <Pill className="h-4 w-4 text-muted-foreground" />
                                        </CardHeader>
                                        <CardContent>
                                            <div className="text-2xl font-bold">{dashboardData.medicationsToday}</div>
                                            <p className="text-xs text-muted-foreground">{dashboardData.medicationsToday} administered today</p>
                                        </CardContent>
                                    </Card>
                                </div>
                                <Separator className="my-6" />
                                <div className="grid gap-6 lg:grid-cols-2">
                                    <Card>
                                        <CardHeader>
                                            <CardTitle>Incidents by Type (This Month)</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <ChartContainer config={chartConfig} className="h-[250px] w-full">
                                                <BarChart data={dashboardData.incidentsByTypeData} layout="vertical" margin={{ left: 10, right: 30 }}>
                                                    <CartesianGrid horizontal={false} />
                                                    <XAxis type="number" hide />
                                                    <YAxis dataKey="name" type="category" tickLine={false} tickMargin={10} axisLine={false} width={80} />
                                                    <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                                                    <Bar dataKey="count" fill="var(--color-count)" radius={4}>
                                                        <LabelList dataKey="count" position="right" offset={8} className="fill-foreground" fontSize={12} />
                                                    </Bar>
                                                </BarChart>
                                            </ChartContainer>
                                        </CardContent>
                                    </Card>
                                    <Card>
                                        <CardHeader>
                                            <CardTitle>Incidents by Location (This Month)</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <ChartContainer config={chartConfig} className="h-[250px] w-full">
                                                <BarChart data={dashboardData.incidentsByLocationData} layout="vertical" margin={{ left: 10, right: 30 }}>
                                                    <CartesianGrid horizontal={false} />
                                                    <XAxis type="number" hide />
                                                    <YAxis dataKey="name" type="category" tickLine={false} tickMargin={10} axisLine={false} width={80} />
                                                    <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                                                    <Bar dataKey="count" fill="var(--color-count)" radius={4}>
                                                        <LabelList dataKey="count" position="right" offset={8} className="fill-foreground" fontSize={12} />
                                                    </Bar>
                                                </BarChart>
                                            </ChartContainer>
                                        </CardContent>
                                    </Card>
                                </div>
                            </CardContent>
                         </Card>
                    </TabsContent>
                     <TabsContent value="entry">
                        <Card className="mt-4">
                            <CardHeader>
                                <CardTitle>Log New Health Entry / Incident</CardTitle>
                                <CardDescription>Use this form for new health reports, injuries, or other incidents.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                 <Form {...form}>
                                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <div className="space-y-6">
                                                <FormField control={form.control} name="studentId" render={({ field }) => ( <FormItem> <FormLabel>Student(s) Involved</FormLabel> <Select onValueChange={field.onChange} defaultValue={field.value}> <FormControl> <SelectTrigger> <SelectValue placeholder="Select a student" /> </SelectTrigger> </FormControl> <SelectContent> {allStudents.map((s) => ( <SelectItem key={s.id} value={s.id}>{s.name} ({s.class})</SelectItem> ))} </SelectContent> </Select> <FormDescription>Multi-student selection coming soon.</FormDescription> <FormMessage /> </FormItem> )}/>
                                                <FormField control={form.control} name="incidentType" render={({ field }) => ( <FormItem> <FormLabel>Type of Entry</FormLabel> <Select onValueChange={field.onChange} defaultValue={field.value}> <FormControl> <SelectTrigger> <SelectValue placeholder="Select a type" /> </SelectTrigger> </FormControl> <SelectContent> <SelectItem value="Health">Health Issue</SelectItem> <SelectItem value="Accident">Accident / Injury</SelectItem> <SelectItem value="Bullying">Bullying</SelectItem> <SelectItem value="Safety Issue">Safety Issue</SelectItem> <SelectItem value="Discipline">Disciplinary Note</SelectItem> <SelectItem value="Other">Other</SelectItem> </SelectContent> </Select> <FormMessage /> </FormItem> )}/>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <FormField control={form.control} name="incidentDate" render={({ field }) => ( <FormItem className="flex flex-col"> <FormLabel>Date of Report</FormLabel> <Popover> <PopoverTrigger asChild> <FormControl> <Button variant={"outline"} className={cn("w-full pl-3 text-left font-normal",!field.value && "text-muted-foreground")}> {field.value ? format(field.value, "PPP") : <span>Pick a date</span>} <CalendarIcon className="ml-auto h-4 w-4 opacity-50" /> </Button> </FormControl> </PopoverTrigger> <PopoverContent className="w-auto p-0" align="start"> <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus /> </PopoverContent> </Popover> <FormMessage /> </FormItem> )}/>
                                                    <FormField control={form.control} name="incidentTime" render={({ field }) => ( <FormItem> <FormLabel>Time</FormLabel> <FormControl> <Input type="time" {...field} /> </FormControl> <FormMessage /> </FormItem> )}/>
                                                </div>
                                                <FormField control={form.control} name="location" render={({ field }) => ( <FormItem> <FormLabel>Location</FormLabel> <FormControl> <Input placeholder="e.g., Science Lab, Playground" {...field} /> </FormControl> <FormMessage /> </FormItem> )}/>
                                                <FormField
                                                  control={form.control}
                                                  name="urgency"
                                                  render={({ field }) => (
                                                    <FormItem>
                                                      <FormLabel>Urgency Level</FormLabel>
                                                      <RadioGroup
                                                        onValueChange={field.onChange}
                                                        defaultValue={field.value}
                                                        className="flex space-x-4"
                                                      >
                                                        {(['Low', 'Medium', 'High', 'Critical'] as const).map(level => (
                                                          <FormItem key={level} className="flex items-center space-x-2 space-y-0">
                                                            <FormControl>
                                                              <RadioGroupItem value={level} id={`urgency-admin-${level}`} />
                                                            </FormControl>
                                                            <Label htmlFor={`urgency-admin-${level}`} className="font-normal">
                                                              <Badge className={cn(getUrgencyBadge(level))}>{level}</Badge>
                                                            </Label>
                                                          </FormItem>
                                                        ))}
                                                      </RadioGroup>
                                                      <FormMessage />
                                                    </FormItem>
                                                  )}
                                                />
                                            </div>
                                            <div className="space-y-6">
                                                <FormField control={form.control} name="description" render={({ field }) => ( <FormItem> <FormLabel>Detailed Description</FormLabel> <FormControl> <Textarea placeholder="Describe the condition, diagnosis, or incident..." className="min-h-[120px]" {...field}/> </FormControl> <FormMessage /> </FormItem> )}/>
                                                <FormField control={form.control} name="actionsTaken" render={({ field }) => ( <FormItem> <FormLabel>Action(s) Taken</FormLabel> <FormControl> <Textarea placeholder="Record any notes, treatment given, or actions taken..." className="min-h-[120px]" {...field}/> </FormControl> <FormMessage /> </FormItem> )}/>
                                                <div className="space-y-2">
                                                    <Label>Attach Document/Photo</Label>
                                                    <div className="flex items-center justify-center w-full">
                                                        {attachedFile ? (
                                                            <div className="w-full p-4 rounded-lg border bg-muted/50 flex items-center justify-between">
                                                                <div className="flex items-center gap-2 text-sm font-medium"> <FileText className="h-5 w-5 text-primary" /> <span className="truncate">{attachedFile.name}</span> </div>
                                                                <Button type="button" variant="ghost" size="icon" onClick={handleRemoveFile}> <X className="h-4 w-4 text-destructive" /> </Button>
                                                            </div>
                                                        ) : (
                                                            <Label htmlFor="dropzone-file-admin" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted/50 hover:bg-muted">
                                                                <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center"> <Paperclip className="w-8 h-8 mb-2 text-muted-foreground" /> <p className="mb-2 text-sm text-muted-foreground">Attach doctor's note, etc. (Optional)</p> </div>
                                                                <Input id="dropzone-file-admin" type="file" className="hidden" onChange={handleFileChange} />
                                                            </Label>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <Separator className="my-8" />
                                        <div className="space-y-4">
                                            <Alert> <Siren className="h-4 w-4" /> <AlertTitle>Follow-up & Notifications</AlertTitle> <AlertDescription> Assign a staff member for follow-up or send immediate notifications. </AlertDescription> </Alert>
                                            <div className="space-y-2"> <Label>Assign for Follow-up (Optional)</Label> <Select> <SelectTrigger> <SelectValue placeholder="Select a teacher or nurse..." /> </SelectTrigger> <SelectContent> <SelectItem value="nurse">School Nurse</SelectItem> <SelectItem value="teacher1">Ms. Wanjiku</SelectItem> </SelectContent> </Select> </div>
                                        </div>
                                        <div className="flex justify-end pt-8"> <Button type="submit" disabled={isSubmitting}> {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Submitting...</> : <><Send className="mr-2 h-4 w-4" />Save Record</>} </Button> </div>
                                    </form>
                                </Form>
                            </CardContent>
                        </Card>
                     </TabsContent>
                    <TabsContent value="log">
                         <Card>
                            <CardHeader>
                                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                    <div> <CardTitle>School-Wide Incident Log</CardTitle> <CardDescription>A log of all reported incidents from teachers and staff.</CardDescription> </div>
                                    <Button variant="outline" onClick={handleExport}> <FileDown className="mr-2" /> Export Log </Button>
                                </div>
                                <div className="mt-4 flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
                                    <div className="relative w-full md:max-w-sm">
                                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input type="search" placeholder="Search by student, class, or keyword..." className="w-full bg-background pl-8" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}/>
                                    </div>
                                    <div className="flex w-full flex-col gap-2 md:w-auto md:flex-row">
                                        <Select value={typeFilter} onValueChange={(v: IncidentType | 'All Types') => setTypeFilter(v)}> <SelectTrigger className="w-full md:w-[180px]"> <Filter className="mr-2 h-4 w-4" /> <SelectValue placeholder="Filter by type" /> </SelectTrigger> <SelectContent> <SelectItem value="All Types">All Types</SelectItem> <SelectItem value="Health">Health</SelectItem> <SelectItem value="Discipline">Discipline</SelectItem> <SelectItem value="Accident">Accident</SelectItem> <SelectItem value="Bullying">Bullying</SelectItem> <SelectItem value="Safety Issue">Safety Issue</SelectItem> <SelectItem value="Other">Other</SelectItem> </SelectContent> </Select>
                                        <Select value={statusFilter} onValueChange={(v: IncidentStatus | 'All Statuses') => setStatusFilter(v)}> <SelectTrigger className="w-full md:w-[180px]"> <Filter className="mr-2 h-4 w-4" /> <SelectValue placeholder="Filter by status" /> </SelectTrigger> <SelectContent> <SelectItem value="All Statuses">All Statuses</SelectItem> <SelectItem value="Reported">Reported</SelectItem> <SelectItem value="Under Review">Under Review</SelectItem> <SelectItem value="Resolved">Resolved</SelectItem> <SelectItem value="Archived">Archived</SelectItem> </SelectContent> </Select>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                 <div className="w-full overflow-auto rounded-lg border">
                                    <Table>
                                        <TableHeader> <TableRow> <TableHead>Student</TableHead> <TableHead>Type</TableHead> <TableHead>Date</TableHead> <TableHead>Class</TableHead> <TableHead>Reported By</TableHead> <TableHead>Status</TableHead> <TableHead className="text-right">Actions</TableHead> </TableRow> </TableHeader>
                                        <TableBody> {filteredIncidents.map(incident => ( <DialogTrigger asChild key={incident.id}> <TableRow className="cursor-pointer" onClick={() => setSelectedIncident(incident)}> <TableCell> <div className="flex items-center gap-3"> <Avatar className="h-8 w-8"> <AvatarImage src={incident.studentAvatar} alt={incident.studentName} /> <AvatarFallback>{incident.studentName.charAt(0)}</AvatarFallback> </Avatar> <span className="font-medium">{incident.studentName}</span> </div> </TableCell> <TableCell><Badge variant={incident.type === 'Health' ? 'destructive' : 'outline'}>{incident.type}</Badge></TableCell> <TableCell>{incident.date.toDate().toLocaleDateString()}</TableCell> <TableCell>{incident.class}</TableCell> <TableCell>{incident.reportedBy}</TableCell> <TableCell>{getStatusBadge(incident.status)}</TableCell> <TableCell className="text-right"><Button variant="ghost" size="sm">View Details</Button></TableCell> </TableRow> </DialogTrigger> ))} </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                    <TabsContent value="records">
                         <Card>
                            <CardHeader> <CardTitle>Student Health Records</CardTitle> <CardDescription>Look up important health information for any student in the school. Records are stored securely for compliance purposes. Access is restricted and logged.</CardDescription> </CardHeader>
                            <CardContent>
                                <div className="max-w-md mb-6">
                                    <Label htmlFor="student-health-select">Select a Student</Label>
                                    <Select onValueChange={(value: string) => setSelectedHealthStudent(value)}>
                                        <SelectTrigger id="student-health-select"> <SelectValue placeholder="Search and select a student..." /> </SelectTrigger>
                                        <SelectContent> {allStudents.map((s) => ( <SelectItem key={s.id} value={s.id}>{s.name} ({s.class})</SelectItem> ))} </SelectContent>
                                    </Select>
                                </div>
                                {currentHealthRecord ? (
                                    <Card>
                                        <CardHeader> <CardTitle className="flex items-center gap-2"> <User className="h-5 w-5 text-primary" /> {allStudents.find(s => s.id === selectedHealthStudent)?.name} </CardTitle> </CardHeader>
                                        <CardContent className="space-y-6">
                                            <div> <h4 className="font-semibold text-sm mb-2 flex items-center gap-2"><ShieldAlert className="h-4 w-4 text-red-500" /> Known Allergies</h4> <div className="space-x-2"> {currentHealthRecord.allergies.map(allergy => ( <Badge key={allergy} variant={allergy !== "None" && allergy !== "None known" ? "destructive" : "secondary"}>{allergy}</Badge> ))} </div> </div>
                                            <Separator />
                                            <div> <h4 className="font-semibold text-sm mb-2 flex items-center gap-2"><Stethoscope className="h-4 w-4" /> Ongoing Conditions</h4> <div className="space-x-2"> {currentHealthRecord.conditions.map(condition => ( <Badge key={condition} variant="secondary">{condition}</Badge> ))} </div> </div>
                                            <Separator />
                                            <div> <h4 className="font-semibold text-sm mb-2 flex items-center gap-2"><Phone className="h-4 w-4" /> Emergency Contact</h4> <div className="text-sm"> <p><span className="font-medium">{currentHealthRecord.emergencyContact.name}</span> ({currentHealthRecord.emergencyContact.relationship})</p> <p className="text-muted-foreground">{currentHealthRecord.emergencyContact.phone}</p> </div> </div>
                                            <Separator />
                                            <div> <h4 className="font-semibold text-sm mb-2 flex items-center gap-2"><FileText className="h-4 w-4" /> Medical History</h4> <Alert variant="default"> <AlertTitle>No Detailed History</AlertTitle> <AlertDescription> A comprehensive medical or vaccination history has not been provided for this student. For detailed records, please contact the student's guardian. </AlertDescription> </Alert> </div>
                                        </CardContent>
                                    </Card>
                                ) : (
                                    <div className="flex min-h-[300px] items-center justify-center rounded-lg border-2 border-dashed border-muted">
                                        <div className="text-center text-muted-foreground"> <Stethoscope className="mx-auto h-12 w-12" /> <h3 className="mt-4 text-lg font-semibold">Select a student to view their record.</h3> </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                    <TabsContent value="medication">
                          <Card>
                            <CardHeader> <CardTitle>Medication Log</CardTitle> <CardDescription>A log of all medication administered at school. Access is restricted.</CardDescription> </CardHeader>
                            <CardContent>
                                <div className="grid gap-8 md:grid-cols-2">
                                    <div className="space-y-6">
                                        <h3 className="font-semibold text-lg">Log New Administration</h3>
                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <Label>Student</Label>
                                                <Select value={medStudentId} onValueChange={setMedStudentId}>
                                                    <SelectTrigger> <SelectValue placeholder="Select a student" /> </SelectTrigger>
                                                    <SelectContent> {allStudents.map((s) => ( <SelectItem key={s.id} value={s.id}>{s.name} ({s.class})</SelectItem> ))} </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-2"> <Label htmlFor="med-name">Medication Name</Label> <Input id="med-name" placeholder="e.g., Paracetamol" value={medName} onChange={(e) => setMedName(e.target.value)} /> </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2"> <Label htmlFor="med-dosage">Dosage</Label> <Input id="med-dosage" placeholder="e.g., 1 tablet, 5ml" value={medDosage} onChange={(e) => setMedDosage(e.target.value)} /> </div>
                                                <div className="space-y-2"> <Label htmlFor="med-time">Time Given</Label> <Input id="med-time" type="time" value={medTime} onChange={(e) => setMedTime(e.target.value)} /> </div>
                                            </div>
                                            <div className="flex items-center space-x-2 pt-4"> <Switch id="med-reminder" disabled /> <Label htmlFor="med-reminder">Set reminder for next dose</Label> </div>
                                            <Button onClick={handleSaveMedication} disabled={isSavingMed}> {isSavingMed && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>} Save Log </Button>
                                        </div>
                                    </div>
                                    <div className="space-y-6">
                                        <h3 className="font-semibold text-lg">Recent Log</h3>
                                        <div className="w-full overflow-auto rounded-lg border">
                                            <Table>
                                                <TableHeader> <TableRow> <TableHead>Student</TableHead> <TableHead>Medication</TableHead> <TableHead>Time</TableHead> </TableRow> </TableHeader>
                                                <TableBody>
                                                    {medicationLog.map(log => ( <TableRow key={log.id}> <TableCell className="font-medium">{log.studentName}</TableCell> <TableCell>{log.medication}</TableCell> <TableCell>{format(log.time.toDate(), 'h:mm a')}</TableCell> </TableRow> ))}
                                                    {medicationLog.length === 0 && ( <TableRow> <TableCell colSpan={3} className="h-24 text-center">No records for today.</TableCell> </TableRow> )}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                          </Card>
                    </TabsContent>
                </Tabs>
            </div>
            {selectedIncident && (
                <DialogContent className="sm:max-w-xl">
                    <DialogHeader> <DialogTitle>Incident Details</DialogTitle> <DialogDescription> Review and manage the incident reported for {selectedIncident.studentName}. </DialogDescription> </DialogHeader>
                    <div className="py-4 space-y-4">
                        <div> <p className="text-sm font-medium text-muted-foreground">Description</p> <p className="text-sm">{selectedIncident.description}</p> </div>
                        {selectedIncident.attachmentUrl && (
                             <div> <p className="text-sm font-medium text-muted-foreground">Attachment</p> <Button asChild variant="link" className="p-0 h-auto"> <a href={selectedIncident.attachmentUrl} target="_blank" rel="noopener noreferrer"><Paperclip className="mr-2 h-4 w-4"/>{selectedIncident.attachmentName || 'View Attachment'}</a></Button></div>
                        )}
                        <Separator/>
                        <div>
                            <h4 className="font-semibold mb-2">Follow-up</h4>
                             <div className="space-y-4">
                                 <div className="space-y-2">
                                     <Label htmlFor="incident-status">Update Status</Label>
                                     <Select value={updatedStatus} onValueChange={(value: IncidentStatus) => setUpdatedStatus(value)}>
                                        <SelectTrigger id="incident-status"> <SelectValue /> </SelectTrigger>
                                        <SelectContent> <SelectItem value="Reported">Reported</SelectItem> <SelectItem value="Under Review">Under Review</SelectItem> <SelectItem value="Resolved">Resolved</SelectItem> <SelectItem value="Archived">Archived</SelectItem> </SelectContent>
                                     </Select>
                                 </div>
                                  <div className="space-y-2"> <Label htmlFor="follow-up-notes">Add Follow-up Notes</Label> <Textarea id="follow-up-notes" placeholder="e.g., Parent contacted, student sent home..." /> </div>
                             </div>
                        </div>
                    </div>
                    <DialogFooter> <DialogClose asChild> <Button variant="outline">Cancel</Button> </DialogClose> <Button onClick={handleUpdateIncident}>Save Changes</Button> </DialogFooter>
                </DialogContent>
            )}
        </Dialog>
    );
}

    
