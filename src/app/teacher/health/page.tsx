
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
import { HeartPulse, Search, CalendarIcon, Siren, Send, Loader2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose, DialogTrigger } from '@/components/ui/dialog';
import { firestore } from '@/lib/firebase';
import { collection, query, onSnapshot, where, doc, getDoc, addDoc, serverTimestamp, orderBy, Timestamp } from 'firebase/firestore';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { User, Phone, Stethoscope, ShieldAlert, FileText, AlertCircle, Lock, Clock, MapPin, CheckCircle, FileDown } from 'lucide-react';


type IncidentType = 'Health' | 'Discipline' | 'Accident' | 'Bullying' | 'Safety Issue' | 'Other';
type IncidentStatus = 'Reported' | 'Under Review' | 'Resolved' | 'Archived';

type Incident = {
  id: string;
  date: Timestamp;
  time?: string;
  location?: string;
  type: 'Health' | 'Discipline' | 'Accident' | 'Bullying' | 'Safety Issue' | 'Other';
  description: string;
  reportedBy: string;
  status: 'Reported' | 'Under Review' | 'Resolved' | 'Archived';
  actionsTaken?: string;
  followUpNeeded?: string;
  studentName: string;
  urgency?: IncidentFormValues['urgency'];
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

export default function TeacherHealthPage() {
    const { toast } = useToast();
    const searchParams = useSearchParams();
    const schoolId = searchParams.get('schoolId');
    const { user } = useAuth();
    
    const [teacherClasses, setTeacherClasses] = React.useState<any[]>([]);
    const [teacherStudents, setTeacherStudents] = React.useState<any[]>([]);
    const [incidents, setIncidents] = React.useState<Incident[]>([]);
    
    const [selectedIncident, setSelectedIncident] = React.useState<Incident | null>(null);
    const [searchTerm, setSearchTerm] = React.useState('');
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const [isLoading, setIsLoading] = React.useState({
      classes: true,
      students: true,
      incidents: true
    });
    const [incidentsPage, setIncidentsPage] = React.useState(1);
    const incidentsPerPage = 10;

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

    const form = useForm<IncidentFormValues>({
        resolver: zodResolver(incidentSchema),
        defaultValues: {
            studentId: '',
            incidentType: 'Health',
            incidentDate: new Date(),
            incidentTime: format(new Date(), 'HH:mm'),
            urgency: 'Low',
            location: '',
            description: '',
            actionsTaken: '',
        },
    });

    // Fetch classes for the current teacher
    React.useEffect(() => {
        if (!schoolId || !user) return;
        
        try {
          setIsLoading(prev => ({...prev, classes: true}));
          const classesQuery = query(collection(firestore, `schools/${schoolId}/classes`), where('teacherId', '==', user.uid));
          const unsubscribe = onSnapshot(classesQuery, 
            (snapshot) => {
                const classesData = snapshot.docs.map(doc => ({ id: doc.id, name: `${doc.data().name} ${doc.data().stream || ''}`.trim() }));
                setTeacherClasses(classesData);
                setIsLoading(prev => ({...prev, classes: false}));
            },
            (error) => {
                console.error("Error fetching classes:", error);
                toast({ 
                  variant: 'destructive', 
                  title: 'Error loading classes' 
                });
                setIsLoading(prev => ({...prev, classes: false}));
            }
          );
          return () => unsubscribe();
        } catch (error) {
          console.error("Error setting up classes query:", error);
          setIsLoading(prev => ({...prev, classes: false}));
        }
    }, [schoolId, user, toast]);
    
    // Fetch students based on teacher's classes
    React.useEffect(() => {
        if (teacherClasses.length === 0 || !schoolId) return;
        
        try {
          setIsLoading(prev => ({...prev, students: true}));
          const classIds = teacherClasses.map(c => c.id);
          const studentsQuery = query(collection(firestore, `schools/${schoolId}/users`), where('role', '==', 'Student'), where('classId', 'in', classIds));
          const unsubscribe = onSnapshot(studentsQuery, 
            (snapshot) => {
                const studentsData = snapshot.docs.map(doc => ({ id: doc.id, name: doc.data().name, class: doc.data().class }));
                setTeacherStudents(studentsData);
                setIsLoading(prev => ({...prev, students: false}));
            },
            (error) => {
                console.error("Error fetching students:", error);
                toast({ 
                  variant: 'destructive', 
                  title: 'Error loading students' 
                });
                setIsLoading(prev => ({...prev, students: false}));
            }
          );
          return () => unsubscribe();
        } catch (error) {
          console.error("Error setting up students query:", error);
          setIsLoading(prev => ({...prev, students: false}));
        }
    }, [teacherClasses, schoolId, toast]);

    // Fetch incidents reported BY the teacher
    React.useEffect(() => {
        if (!schoolId || !user) {
            setIncidents([]);
            setIsLoading(prev => ({...prev, incidents: false}));
            return;
        }
        
        try {
          setIsLoading(prev => ({...prev, incidents: true}));
          const incidentsQuery = query(collection(firestore, `schools/${schoolId}/incidents`), where('reportedById', '==', user.uid), orderBy('date', 'desc'));
          const unsubscribe = onSnapshot(incidentsQuery, 
            (snapshot) => {
                const incidentsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Incident));
                setIncidents(incidentsData);
                setIsLoading(prev => ({...prev, incidents: false}));
            },
            (error) => {
                console.error("Error fetching incidents:", error);
                toast({ 
                  variant: 'destructive', 
                  title: 'Error loading incidents' 
                });
                setIsLoading(prev => ({...prev, incidents: false}));
            }
          );
          return () => unsubscribe();
        } catch (error) {
          console.error("Error setting up incidents query:", error);
          setIsLoading(prev => ({...prev, incidents: false}));
        }
    }, [schoolId, user, toast]);

    const filteredIncidents = React.useMemo(() => 
      incidents.filter(incident => 
        incident.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        incident.description.toLowerCase().includes(searchTerm.toLowerCase())
      ),
      [incidents, searchTerm]
    );

    const paginatedIncidents = React.useMemo(() => 
      filteredIncidents.slice(
        (incidentsPage - 1) * incidentsPerPage,
        incidentsPage * incidentsPerPage
      ),
      [filteredIncidents, incidentsPage]
    );

    const getStatusBadge = (status: IncidentStatus) => {
        switch (status) {
            case 'Reported': return <Badge variant="secondary">Reported</Badge>;
            case 'Under Review': return <Badge className="bg-yellow-500 text-white hover:bg-yellow-600">Under Review</Badge>;
            case 'Resolved': return <Badge variant="default" className="bg-green-600 hover:bg-green-700">Resolved</Badge>;
            case 'Archived': return <Badge variant="outline">Archived</Badge>;
            default: return <Badge variant="secondary">{status}</Badge>;
        }
    }
    
    const getUrgencyBadge = (urgency: IncidentFormValues['urgency']) => {
        switch (urgency) {
            case 'Critical': return 'bg-red-700 text-white';
            case 'High': return 'bg-red-500 text-white';
            case 'Medium': return 'bg-yellow-500 text-white';
            case 'Low': return 'bg-blue-500 text-white';
            default: return 'bg-gray-500 text-white';
        }
    }

    async function onSubmit(values: IncidentFormValues) {
        if (!schoolId || !user) {
          toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Unable to submit - missing school or user information'
          });
          return;
        }
        
        setIsSubmitting(true);
        const student = teacherStudents.find(s => s.id === values.studentId);
        
        try {
            await addDoc(collection(firestore, 'schools', schoolId, 'incidents'), {
                ...values,
                studentId: values.studentId,
                studentName: student?.name || 'Unknown',
                class: student?.class || 'Unknown',
                date: Timestamp.fromDate(values.incidentDate),
                reportedBy: user.displayName || 'Teacher',
                reportedById: user.uid,
                status: 'Reported',
            });
            
            // Notify Admin
            await addDoc(collection(firestore, `schools/${schoolId}/notifications`), {
                title: `New Incident Report: ${values.incidentType}`,
                description: `Incident involving ${student?.name || 'a student'} reported by ${user.displayName || 'a teacher'}.`,
                createdAt: serverTimestamp(),
                category: 'Health',
                href: `/admin/health?schoolId=${schoolId}`,
                audience: 'admin',
            });
            
            // Notify Parent
            const studentDoc = await getDoc(doc(firestore, 'schools', schoolId, 'users', values.studentId));
            const parentId = studentDoc.data()?.parentId;
            if (parentId) {
                 await addDoc(collection(firestore, `schools/${schoolId}/notifications`), {
                    title: `Health & Safety Update for ${student?.name}`,
                    description: `A new incident of type "${values.incidentType}" has been logged for your child. Please check the health portal for details.`,
                    createdAt: serverTimestamp(),
                    category: 'Health',
                    href: `/parent/health?schoolId=${schoolId}`,
                    userId: parentId,
                });
            }

            toast({
                title: 'Incident Reported',
                description: 'The incident has been logged and relevant parties have been notified.',
            });
            form.reset();
        } catch (e) {
            console.error("Error submitting incident:", e);
            toast({ 
              variant: 'destructive', 
              title: 'Submission Failed',
              description: 'There was an error submitting the incident report. Please try again.'
            });
        } finally {
            setIsSubmitting(false);
        }
    }

    if (!schoolId) {
        return <div className="p-8">Error: School ID is missing from URL.</div>
    }

    return (
        <Dialog onOpenChange={(open) => !open && setSelectedIncident(null)}>
            <div className="p-4 sm:p-6 lg:p-8">
                <div className="mb-6 p-4 md:p-6 bg-card border rounded-lg">
                    <h1 className="font-headline text-3xl font-bold flex items-center gap-2">
                        <HeartPulse className="h-8 w-8 text-primary" />
                        Health &amp; Incidents
                    </h1>
                    <p className="text-muted-foreground">Report and track student health issues and other incidents.</p>
                </div>
                
                <Tabs defaultValue="report">
                    <TabsList className="mb-4 grid w-full grid-cols-2 md:w-auto md:inline-flex">
                        <TabsTrigger value="report">New Incident</TabsTrigger>
                        <TabsTrigger value="log">My Incident Log</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="report">
                        <Card className="mt-4">
                            <CardHeader>
                                <CardTitle>Report a New Incident</CardTitle>
                                <CardDescription>Fill out the form below to log a new incident. This will be sent to the administration and optionally to parents.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Form {...form}>
                                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <div className="space-y-6">
                                                <FormField 
                                                  control={form.control} 
                                                  name="studentId" 
                                                  render={({ field }) => ( 
                                                    <FormItem> 
                                                      <FormLabel>Student Involved</FormLabel> 
                                                      <Select onValueChange={field.onChange} defaultValue={field.value}> 
                                                        <FormControl> 
                                                          <SelectTrigger> 
                                                            <SelectValue placeholder="Select a student from your classes" /> 
                                                          </SelectTrigger> 
                                                        </FormControl> 
                                                        <SelectContent> 
                                                          {teacherStudents.map((s) => ( 
                                                            <SelectItem key={s.id} value={s.id}>{s.name} ({s.class})</SelectItem> 
                                                          ))} 
                                                        </SelectContent> 
                                                      </Select> 
                                                      <FormDescription>Multi-student selection coming soon.</FormDescription> 
                                                      <FormMessage /> 
                                                    </FormItem> 
                                                  )}
                                                />
                                                <FormField 
                                                  control={form.control} 
                                                  name="incidentType" 
                                                  render={({ field }) => ( 
                                                    <FormItem> 
                                                      <FormLabel>Type of Incident</FormLabel> 
                                                      <Select onValueChange={field.onChange} defaultValue={field.value}> 
                                                        <FormControl> 
                                                          <SelectTrigger> 
                                                            <SelectValue placeholder="Select a type" /> 
                                                          </SelectTrigger> 
                                                        </FormControl> 
                                                        <SelectContent> 
                                                          <SelectItem value="Health">Health Issue</SelectItem> 
                                                          <SelectItem value="Accident">Accident / Injury</SelectItem> 
                                                          <SelectItem value="Bullying">Bullying</SelectItem> 
                                                          <SelectItem value="Safety Issue">Safety Issue</SelectItem> 
                                                          <SelectItem value="Discipline">Disciplinary Note</SelectItem> 
                                                          <SelectItem value="Other">Other</SelectItem> 
                                                        </SelectContent> 
                                                      </Select> 
                                                      <FormMessage /> 
                                                    </FormItem> 
                                                  )}
                                                />
                                                <div className="grid grid-cols-2 gap-4">
                                                    <FormField 
                                                      control={form.control} 
                                                      name="incidentDate" 
                                                      render={({ field }) => ( 
                                                        <FormItem className="flex flex-col"> 
                                                          <FormLabel>Date of Incident</FormLabel> 
                                                          <Popover> 
                                                            <PopoverTrigger asChild> 
                                                              <FormControl> 
                                                                <Button variant={"outline"} className={cn("w-full pl-3 text-left font-normal",!field.value && "text-muted-foreground")}> 
                                                                  {field.value ? format(field.value, "PPP") : <span>Pick a date</span>} 
                                                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" /> 
                                                                </Button> 
                                                              </FormControl> 
                                                            </PopoverTrigger> 
                                                            <PopoverContent className="w-auto p-0" align="start"> 
                                                              <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus /> 
                                                            </PopoverContent> 
                                                          </Popover> 
                                                          <FormMessage /> 
                                                        </FormItem> 
                                                      )}
                                                    />
                                                    <FormField 
                                                      control={form.control} 
                                                      name="incidentTime" 
                                                      render={({ field }) => ( 
                                                        <FormItem> 
                                                          <FormLabel>Time</FormLabel> 
                                                          <FormControl> 
                                                            <Input type="time" {...field} /> 
                                                          </FormControl> 
                                                          <FormMessage /> 
                                                        </FormItem> 
                                                      )}
                                                    />
                                                </div>
                                                <FormField 
                                                  control={form.control} 
                                                  name="location" 
                                                  render={({ field }) => ( 
                                                    <FormItem> 
                                                      <FormLabel>Location</FormLabel> 
                                                      <FormControl> 
                                                        <Input placeholder="e.g., Science Lab, Playground" {...field} /> 
                                                      </FormControl> 
                                                      <FormMessage /> 
                                                    </FormItem> 
                                                  )}
                                                />
                                                 <FormField
                                                    control={form.control}
                                                    name="urgency"
                                                    render={({ field }) => (
                                                        <FormItem className="space-y-3">
                                                            <FormLabel>Urgency Level</FormLabel>
                                                            <RadioGroup
                                                                onValueChange={field.onChange}
                                                                defaultValue={field.value}
                                                                className="flex space-x-4"
                                                            >
                                                                {(['Low', 'Medium', 'High', 'Critical'] as const).map(level => (
                                                                    <FormItem key={level} className="flex items-center space-x-2 space-y-0">
                                                                        <FormControl>
                                                                            <RadioGroupItem value={level} id={`urgency-teacher-${level}`} />
                                                                        </FormControl>
                                                                        <Label htmlFor={`urgency-teacher-${level}`} className="font-normal">
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
                                                <FormField 
                                                  control={form.control} 
                                                  name="description" 
                                                  render={({ field }) => ( 
                                                    <FormItem> 
                                                      <FormLabel>Detailed Description</FormLabel> 
                                                      <FormControl> 
                                                        <Textarea placeholder="Describe the condition, diagnosis, or incident..." className="min-h-[120px]" {...field}/> 
                                                      </FormControl> 
                                                      <FormMessage /> 
                                                    </FormItem> 
                                                  )}
                                                />
                                                <FormField 
                                                  control={form.control} 
                                                  name="actionsTaken" 
                                                  render={({ field }) => ( 
                                                    <FormItem> 
                                                      <FormLabel>Action(s) Taken</FormLabel> 
                                                      <FormControl> 
                                                        <Textarea placeholder="Record any notes, treatment given, or actions taken..." className="min-h-[120px]" {...field}/> 
                                                      </FormControl> 
                                                      <FormMessage /> 
                                                    </FormItem> 
                                                  )}
                                                />
                                            </div>
                                        </div>
                                        <div className="flex justify-end pt-8"> 
                                          <Button type="submit" disabled={isSubmitting}> 
                                            {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Submitting...</> : <><Send className="mr-2 h-4 w-4" />Submit Report</>} 
                                          </Button> 
                                        </div>
                                    </form>
                                </Form>
                            </CardContent>
                        </Card>
                    </TabsContent>
                    
                    <TabsContent value="log">
                        <Card className="mt-4">
                            <CardHeader>
                                <CardTitle>My Incident Log</CardTitle>
                                <CardDescription>A log of all incidents you have reported.</CardDescription>
                                <div className="mt-4 relative w-full md:max-w-sm">
                                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                      type="search"
                                      placeholder="Search by student or keyword..."
                                      className="w-full bg-background pl-8"
                                      value={searchTerm}
                                      onChange={(e) => setSearchTerm(e.target.value)}
                                      aria-label="Search incidents"
                                    />
                                </div>
                            </CardHeader>
                            <CardContent>
                              {isLoading.incidents ? (
                                <div className="flex justify-center items-center h-40">
                                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                </div>
                              ) : (
                                <>
                                  <div className="w-full overflow-auto rounded-lg border hidden md:block">
                                      <Table>
                                          <TableHeader>
                                            <TableRow>
                                              <TableHead>Student</TableHead>
                                              <TableHead>Type</TableHead>
                                              <TableHead>Date</TableHead>
                                              <TableHead>Status</TableHead>
                                            </TableRow>
                                          </TableHeader>
                                          <TableBody>
                                              {paginatedIncidents.map(incident => (
                                                  <DialogTrigger asChild key={incident.id}>
                                                      <TableRow 
                                                        className="cursor-pointer" 
                                                        onClick={() => setSelectedIncident(incident)}
                                                        role="button"
                                                        aria-label={`View details for incident involving ${incident.studentName}`}
                                                      >
                                                          <TableCell>{incident.studentName}</TableCell>
                                                          <TableCell>
                                                            <Badge variant={incident.type === 'Health' ? 'destructive' : 'outline'}>
                                                              {incident.type}
                                                            </Badge>
                                                          </TableCell>
                                                          <TableCell>{incident.date.toDate().toLocaleDateString()}</TableCell>
                                                          <TableCell>{getStatusBadge(incident.status)}</TableCell>
                                                      </TableRow>
                                                  </DialogTrigger>
                                              ))}
                                              {filteredIncidents.length === 0 && (
                                                  <TableRow>
                                                      <TableCell colSpan={4} className="h-24 text-center">
                                                          {searchTerm ? (
                                                            <div className="text-center py-6">
                                                              <Search className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                                                              <h3 className="font-medium text-lg mb-2">No incidents found</h3>
                                                              <p className="text-muted-foreground">
                                                                Try adjusting your search terms
                                                              </p>
                                                            </div>
                                                          ) : (
                                                            <div className="text-center py-6">
                                                              <Siren className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                                                              <h3 className="font-medium text-lg mb-2">No incidents reported yet</h3>
                                                              <p className="text-muted-foreground">
                                                                You haven't reported any incidents yet
                                                              </p>
                                                            </div>
                                                          )}
                                                      </TableCell>
                                                  </TableRow>
                                              )}
                                          </TableBody>
                                      </Table>
                                  </div>
                                  <div className="grid grid-cols-1 gap-4 md:hidden">
                                  {paginatedIncidents.map(incident => (
                                      <DialogTrigger asChild key={incident.id}>
                                      <Card 
                                        className="cursor-pointer" 
                                        onClick={() => setSelectedIncident(incident)}
                                        role="button"
                                        aria-label={`View details for incident involving ${incident.studentName}`}
                                      >
                                          <CardHeader className="pb-2">
                                            <div className="flex items-center justify-between">
                                                <CardTitle className="text-base">{incident.studentName}</CardTitle>
                                                <div className="flex items-center gap-2">
                                                  <Badge variant={incident.type === 'Health' ? 'destructive' : 'outline'}>
                                                    {incident.type}
                                                  </Badge>
                                                  {getStatusBadge(incident.status)}
                                                </div>
                                            </div>
                                            <p className="text-xs text-muted-foreground">
                                                {incident.date.toDate().toLocaleDateString()}
                                            </p>
                                          </CardHeader>
                                          <CardContent className="pb-3">
                                            <p className="text-sm line-clamp-2 text-muted-foreground">
                                                {incident.description}
                                            </p>
                                          </CardContent>
                                      </Card>
                                      </DialogTrigger>
                                  ))}
                                  {filteredIncidents.length === 0 && (
                                    <div className="text-center py-12">
                                      {searchTerm ? (
                                        <>
                                          <Search className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                                          <h3 className="font-medium text-lg mb-2">No incidents found</h3>
                                          <p className="text-muted-foreground">
                                            Try adjusting your search terms
                                          </p>
                                        </>
                                      ) : (
                                        <>
                                          <Siren className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                                          <h3 className="font-medium text-lg mb-2">No incidents reported yet</h3>
                                          <p className="text-muted-foreground">
                                            You haven't reported any incidents yet
                                          </p>
                                        </>
                                      )}
                                    </div>
                                  )}
                                  </div>

                                  {filteredIncidents.length > incidentsPerPage && (
                                    <div className="flex justify-between items-center mt-6">
                                      <Button 
                                        variant="outline" 
                                        onClick={() => setIncidentsPage(prev => Math.max(1, prev - 1))}
                                        disabled={incidentsPage === 1}
                                      >
                                        Previous
                                      </Button>
                                      <span className="text-sm text-muted-foreground">
                                        Page {incidentsPage} of {Math.ceil(filteredIncidents.length / incidentsPerPage)}
                                      </span>
                                      <Button 
                                        variant="outline" 
                                        onClick={() => setIncidentsPage(prev => Math.min(Math.ceil(filteredIncidents.length / incidentsPerPage), prev + 1))}
                                        disabled={incidentsPage >= Math.ceil(filteredIncidents.length / incidentsPerPage)}
                                      >
                                        Next
                                      </Button>
                                    </div>
                                  )}
                                </>
                              )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>

                {selectedIncident && (
                    <DialogContent className="sm:max-w-xl">
                        <DialogHeader>
                            <DialogTitle>Incident Details</DialogTitle>
                            <DialogDescription>Review the incident you reported for {selectedIncident.studentName}.</DialogDescription>
                        </DialogHeader>
                        <div className="py-4 space-y-4">
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Description</p>
                            <p className="text-sm">{selectedIncident.description}</p>
                          </div>
                          <Separator/>
                          <div>
                            <h4 className="font-semibold mb-2">Status</h4>
                            <p>{getStatusBadge(selectedIncident.status)}</p>
                            <p className="text-xs text-muted-foreground mt-1">This is the current status as determined by the administration.</p>
                          </div>
                        </div>
                        <DialogFooter>
                          <DialogClose asChild>
                            <Button variant="outline">Close</Button>
                          </DialogClose>
                        </DialogFooter>
                    </DialogContent>
                )}
            </div>
        </Dialog>
    );
}

    