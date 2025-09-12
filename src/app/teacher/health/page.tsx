
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
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { HeartPulse, CalendarIcon, Send, ShieldAlert, Heart, Siren, Search, Filter, Stethoscope, User, Phone, FileText, Paperclip } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';


const incidentSchema = z.object({
  studentId: z.string({ required_error: 'Please select a student.' }),
  incidentType: z.enum(['Health', 'Discipline', 'Accident', 'Other']),
  incidentDate: z.date({ required_error: 'An incident date is required.' }),
  incidentTime: z.string().min(1, 'Time is required'),
  description: z.string().min(20, 'Please provide a detailed description (at least 20 characters).'),
  actionsTaken: z.string().min(10, 'Please describe the actions taken.'),
  urgency: z.enum(['Low', 'Medium', 'High', 'Critical']),
  notifyParents: z.boolean().default(false),
  notifyAdmin: z.boolean().default(true),
});

type IncidentFormValues = z.infer<typeof incidentSchema>;

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

const incidentLog = [
    { id: 'inc-1', studentName: 'Student 1', studentAvatar: 'https://picsum.photos/seed/f4-student1/100', type: 'Health', description: 'Complained of a headache and feeling dizzy during the chemistry lesson.', date: '2024-07-15', status: 'Reported' },
    { id: 'inc-2', studentName: 'Student 32', studentAvatar: 'https://picsum.photos/seed/f3-student1/100', type: 'Accident', description: 'Slipped and fell during break time. Minor scrape on the knee.', date: '2024-07-12', status: 'Resolved' },
];

const getUrgencyBadge = (urgency: IncidentFormValues['urgency']) => {
    switch (urgency) {
        case 'Critical': return 'bg-red-700 text-white';
        case 'High': return 'bg-red-500 text-white';
        case 'Medium': return 'bg-yellow-500 text-white';
        case 'Low': return 'bg-blue-500 text-white';
    }
}

export default function HealthPage() {
  const { toast } = useToast();
  const [selectedHealthStudent, setSelectedHealthStudent] = React.useState<keyof typeof studentHealthRecords | null>(null);

  const form = useForm<IncidentFormValues>({
    resolver: zodResolver(incidentSchema),
    defaultValues: {
      incidentType: 'Health',
      incidentTime: format(new Date(), 'HH:mm'),
      urgency: 'Low',
      notifyParents: false,
      notifyAdmin: true,
    },
  });

  function onSubmit(values: IncidentFormValues) {
    console.log(values);
    toast({
      title: 'Incident Reported',
      description: 'The incident has been logged and notifications have been sent.',
    });
    form.reset();
  }
  
  const currentHealthRecord = selectedHealthStudent ? studentHealthRecords[selectedHealthStudent] : null;

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="font-headline text-3xl font-bold flex items-center gap-2">
          <HeartPulse className="h-8 w-8 text-primary" />
          Health &amp; Incidents
        </h1>
        <p className="text-muted-foreground">Report and track student health issues and other incidents.</p>
      </div>
      
      <Tabs defaultValue="report">
        <TabsList className="grid w-full grid-cols-3 md:w-auto md:inline-flex">
            <TabsTrigger value="report">New Incident</TabsTrigger>
            <TabsTrigger value="log">Incident Log</TabsTrigger>
            <TabsTrigger value="records">Health Records</TabsTrigger>
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
                                            <FormLabel>Student</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select a student" />
                                                </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                {students.map((s) => (
                                                    <SelectItem key={s.id} value={s.id}>{s.name} ({s.class})</SelectItem>
                                                ))}
                                                </SelectContent>
                                            </Select>
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
                                                    <SelectItem value="Discipline">Disciplinary Issue</SelectItem>
                                                    <SelectItem value="Accident">Accident / Injury</SelectItem>
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
                                                        <Button
                                                        variant={"outline"}
                                                        className={cn(
                                                            "w-full pl-3 text-left font-normal",
                                                            !field.value && "text-muted-foreground"
                                                        )}
                                                        >
                                                        {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                        </Button>
                                                    </FormControl>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-auto p-0" align="start">
                                                    <Calendar
                                                        mode="single"
                                                        selected={field.value}
                                                        onSelect={field.onChange}
                                                        disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                                                        initialFocus
                                                    />
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
                                                    <FormLabel>Time of Incident</FormLabel>
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
                                        name="urgency"
                                        render={({ field }) => (
                                            <FormItem>
                                            <FormLabel>Urgency Level</FormLabel>
                                            <FormControl>
                                                <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex space-x-4">
                                                    {(['Low', 'Medium', 'High', 'Critical'] as const).map(level => (
                                                         <FormItem key={level} className="flex items-center space-x-2 space-y-0">
                                                            <FormControl>
                                                                <RadioGroupItem value={level} id={`urgency-${level}`} />
                                                            </FormControl>
                                                            <FormLabel htmlFor={`urgency-${level}`} className="font-normal">
                                                                <Badge className={cn(getUrgencyBadge(level))}>{level}</Badge>
                                                            </FormLabel>
                                                        </FormItem>
                                                    ))}
                                                </RadioGroup>
                                            </FormControl>
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
                                            <Textarea
                                                placeholder="Describe the incident, including what happened, who was involved, and any symptoms observed..."
                                                className="min-h-[150px]"
                                                {...field}
                                            />
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
                                            <FormLabel>Actions Taken</FormLabel>
                                            <FormControl>
                                            <Textarea
                                                placeholder="Describe the immediate actions you took, e.g., 'Student was sent to the school nurse', 'First aid was administered'..."
                                                className="min-h-[100px]"
                                                {...field}
                                            />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                        )}
                                    />
                                     <div className="space-y-2">
                                        <Label>File Attachments (e.g., doctor's note, photo)</Label>
                                        <div className="flex items-center justify-center w-full">
                                            <Label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted/50 hover:bg-muted">
                                                <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center">
                                                    <Paperclip className="w-8 h-8 mb-2 text-muted-foreground" />
                                                    <p className="mb-2 text-sm text-muted-foreground">Attach files</p>
                                                    <p className="text-xs text-muted-foreground">(Feature coming soon)</p>
                                                </div>
                                                <Input id="dropzone-file" type="file" className="hidden" disabled />
                                            </Label>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <Separator className="my-8" />

                            <div className="space-y-4 rounded-lg border p-4">
                                <h4 className="font-medium">Notification Settings</h4>
                                <FormField
                                    control={form.control}
                                    name="notifyAdmin"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-row items-center justify-between">
                                        <div className="space-y-0.5">
                                            <FormLabel>Notify Administration</FormLabel>
                                            <FormDescription>
                                            A report will be sent to the school admin office.
                                            </FormDescription>
                                        </div>
                                        <FormControl>
                                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                                        </FormControl>
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="notifyParents"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-row items-center justify-between">
                                        <div className="space-y-0.5">
                                            <FormLabel>Notify Parents/Guardians</FormLabel>
                                            <FormDescription>
                                            An SMS/Email will be sent to the student's primary contact.
                                            </FormDescription>
                                        </div>
                                        <FormControl>
                                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                                        </FormControl>
                                        </FormItem>
                                    )}
                                />
                            </div>
                            
                            <div className="flex justify-end pt-8">
                                <Button type="submit">
                                    <Send className="mr-2 h-4 w-4" />
                                    Submit Incident Report
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
                    <CardTitle>Incident Log</CardTitle>
                    <CardDescription>A log of all reported incidents for your classes.</CardDescription>
                     <div className="mt-4 flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
                        <div className="relative w-full md:max-w-sm">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                            type="search"
                            placeholder="Search by student name..."
                            className="w-full bg-background pl-8"
                            />
                        </div>
                         <div className="flex w-full flex-col gap-2 md:w-auto md:flex-row md:items-center">
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
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="w-full overflow-auto rounded-lg border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Student</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Description</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {incidentLog.map(incident => (
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
                                        <TableCell>
                                            <Badge variant={incident.type === 'Health' ? 'destructive' : incident.type === 'Accident' ? 'secondary' : 'default'}>{incident.type}</Badge>
                                        </TableCell>
                                        <TableCell className="max-w-xs truncate">{incident.description}</TableCell>
                                        <TableCell>{incident.date}</TableCell>
                                        <TableCell>
                                             <Badge variant="outline">{incident.status}</Badge>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
             </Card>
        </TabsContent>
         <TabsContent value="records">
            <Card className="mt-4">
                <CardHeader>
                    <CardTitle>Student Health Records</CardTitle>
                    <CardDescription>Look up important health information for a student.</CardDescription>
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
                                            A comprehensive medical or vaccination history has not been provided for this student. For detailed records, please contact the school administration or the student's guardian.
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
      </Tabs>
    </div>
  );
}
