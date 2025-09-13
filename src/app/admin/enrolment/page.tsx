
'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';

import { cn } from '@/lib/utils';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Calendar } from '@/components/ui/calendar';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  UserPlus,
  CalendarIcon,
  Upload,
  Save,
  Users,
  Mail,
  Phone,
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const enrolmentSchema = z.object({
  studentFirstName: z.string().min(2, 'First name is required.'),
  studentLastName: z.string().min(2, 'Last name is required.'),
  dateOfBirth: z.date({ required_error: 'Date of birth is required.' }),
  gender: z.string({ required_error: 'Please select a gender.' }),
  admissionNumber: z.string().optional(),
  classId: z.string({ required_error: 'Please assign a class.' }),
  admissionYear: z.string({ required_error: 'Please select an admission year.'}),
  parentFirstName: z.string().min(2, 'Parent\'s first name is required.'),
  parentLastName: z.string().min(2, 'Parent\'s last name is required.'),
  parentRelationship: z.string({ required_error: 'Relationship is required.' }),
  parentEmail: z.string().email('Invalid email address.'),
  parentPhone: z.string().min(10, 'A valid phone number is required.'),
  generateInvoice: z.boolean().default(true),
  sendInvite: z.boolean().default(true),
});

type EnrolmentFormValues = z.infer<typeof enrolmentSchema>;

type RecentEnrolment = {
    id: string;
    studentName: string;
    class: string;
    parentName: string;
    date: string;
    status: 'Pending' | 'Approved' | 'Incomplete';
};

const recentEnrolments: RecentEnrolment[] = [
    { id: 'enr-1', studentName: 'Alice Johnson', class: 'Form 1', parentName: 'Mark Johnson', date: '2024-07-28', status: 'Approved' },
    { id: 'enr-2', studentName: 'Brian Omondi', class: 'Form 1', parentName: 'Grace Omondi', date: '2024-07-27', status: 'Pending' },
];

const getStatusBadge = (status: RecentEnrolment['status']) => {
    switch (status) {
        case 'Approved': return <Badge variant="default" className="bg-green-600 hover:bg-green-700 text-white"><CheckCircle className="mr-1 h-3 w-3"/>Approved</Badge>;
        case 'Pending': return <Badge variant="secondary" className="bg-yellow-500 text-white hover:bg-yellow-600"><Clock className="mr-1 h-3 w-3"/>Pending</Badge>;
        case 'Incomplete': return <Badge variant="destructive"><AlertCircle className="mr-1 h-3 w-3"/>Incomplete</Badge>;
    }
}


export default function StudentEnrolmentPage() {
    const { toast } = useToast();

    const form = useForm<EnrolmentFormValues>({
        resolver: zodResolver(enrolmentSchema),
        defaultValues: {
            generateInvoice: true,
            sendInvite: true,
        },
    });

    function onSubmit(values: EnrolmentFormValues) {
        console.log(values);
        toast({
            title: 'Enrolment Submitted',
            description: `${values.studentFirstName} ${values.studentLastName} has been successfully submitted for enrolment.`,
        });
        form.reset();
    }
    
    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 10 }, (_, i) => (currentYear - i).toString());

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="font-headline text-3xl font-bold flex items-center gap-2">
          <UserPlus className="h-8 w-8 text-primary" />
          Student Enrolment
        </h1>
        <p className="text-muted-foreground">Register a new student and link them to their parent or guardian.</p>
      </div>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                     <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5 text-primary"/>Student Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <FormField control={form.control} name="studentFirstName" render={({ field }) => ( <FormItem><FormLabel>First Name</FormLabel><FormControl><Input placeholder="e.g., Jane" {...field} /></FormControl><FormMessage /></FormItem> )}/>
                                <FormField control={form.control} name="studentLastName" render={({ field }) => ( <FormItem><FormLabel>Last Name</FormLabel><FormControl><Input placeholder="e.g., Doe" {...field} /></FormControl><FormMessage /></FormItem> )}/>
                                <FormField control={form.control} name="dateOfBirth" render={({ field }) => ( <FormItem className="flex flex-col"><FormLabel>Date of Birth</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant={"outline"} className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}><CalendarIcon className="mr-2 h-4 w-4" />{field.value ? format(field.value, "PPP") : <span>Pick a date</span>}</Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={field.value} onSelect={field.onChange} disabled={(date) => date > new Date() || date < new Date("1900-01-01")} initialFocus /></PopoverContent></Popover><FormMessage /></FormItem>)}/>
                                <FormField control={form.control} name="gender" render={({ field }) => ( <FormItem><FormLabel>Gender</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select a gender" /></SelectTrigger></FormControl><SelectContent><SelectItem value="male">Male</SelectItem><SelectItem value="female">Female</SelectItem></SelectContent></Select><FormMessage /></FormItem> )}/>
                                 <FormField control={form.control} name="admissionNumber" render={({ field }) => ( <FormItem><FormLabel>Admission Number</FormLabel><FormControl><Input placeholder="Auto-generated if blank" {...field} /></FormControl><FormMessage /></FormItem> )}/>
                            </div>
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5 text-primary"/>Guardian Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <FormField control={form.control} name="parentFirstName" render={({ field }) => ( <FormItem><FormLabel>First Name</FormLabel><FormControl><Input placeholder="e.g., Mark" {...field} /></FormControl><FormMessage /></FormItem> )}/>
                                <FormField control={form.control} name="parentLastName" render={({ field }) => ( <FormItem><FormLabel>Last Name</FormLabel><FormControl><Input placeholder="e.g., Johnson" {...field} /></FormControl><FormMessage /></FormItem> )}/>
                                <FormField control={form.control} name="parentRelationship" render={({ field }) => ( <FormItem><FormLabel>Relationship to Student</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select a relationship" /></SelectTrigger></FormControl><SelectContent><SelectItem value="father">Father</SelectItem><SelectItem value="mother">Mother</SelectItem><SelectItem value="guardian">Guardian</SelectItem></SelectContent></Select><FormMessage /></FormItem> )}/>
                                <FormField control={form.control} name="parentEmail" render={({ field }) => ( <FormItem><FormLabel>Email Address</FormLabel><FormControl><Input type="email" placeholder="guardian@example.com" {...field} /></FormControl><FormMessage /></FormItem> )}/>
                                <FormField control={form.control} name="parentPhone" render={({ field }) => ( <FormItem><FormLabel>Phone Number</FormLabel><FormControl><Input type="tel" placeholder="e.g., 0712345678" {...field} /></FormControl><FormMessage /></FormItem> )}/>
                            </div>
                        </CardContent>
                    </Card>
                </div>
                <div className="lg:col-span-1 space-y-6">
                     <Card>
                        <CardHeader>
                            <CardTitle>Academic &amp; Administrative</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                             <FormField control={form.control} name="classId" render={({ field }) => ( <FormItem><FormLabel>Assign to Class</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select a class" /></SelectTrigger></FormControl><SelectContent><SelectItem value="f1">Form 1</SelectItem><SelectItem value="f2">Form 2</SelectItem></SelectContent></Select><FormMessage /></FormItem> )}/>
                             <FormField control={form.control} name="admissionYear" render={({ field }) => ( <FormItem><FormLabel>Year of Admission</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select a year" /></SelectTrigger></FormControl><SelectContent>{years.map(year => <SelectItem key={year} value={year}>{year}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem> )}/>
                            <Separator />
                            <div className="space-y-2">
                                <Label>Student Profile Photo</Label>
                                <div className="flex items-center gap-4">
                                     <Avatar className="h-16 w-16">
                                        <AvatarImage src="" />
                                        <AvatarFallback><UserPlus/></AvatarFallback>
                                    </Avatar>
                                    <Button variant="outline" className="w-full" disabled>
                                        <Upload className="mr-2 h-4 w-4" />
                                        Upload Photo
                                    </Button>
                                </div>
                                <FormDescription>Recommended: 400x400px.</FormDescription>
                            </div>
                            <Separator />
                             <FormField control={form.control} name="generateInvoice" render={({ field }) => (<FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm"><div className="space-y-0.5"><FormLabel>Generate Pro-forma Invoice</FormLabel></div><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>)}/>
                             <FormField control={form.control} name="sendInvite" render={({ field }) => (<FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm"><div className="space-y-0.5"><FormLabel>Send Portal Invitation</FormLabel></div><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>)}/>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Recent Enrolments</CardTitle>
                        </CardHeader>
                        <CardContent>
                             <div className="w-full overflow-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Student</TableHead>
                                            <TableHead>Status</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {recentEnrolments.map((enrolment) => (
                                            <TableRow key={enrolment.id}>
                                                <TableCell>
                                                    <div className="font-medium">{enrolment.studentName}</div>
                                                    <div className="text-xs text-muted-foreground">{enrolment.class}</div>
                                                </TableCell>
                                                <TableCell>{getStatusBadge(enrolment.status)}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                             </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
             <CardFooter className="flex justify-end p-0 pt-6">
                <Button type="submit" className="w-full md:w-auto">
                    <Save className="mr-2 h-4 w-4"/>
                    Submit Enrolment Application
                </Button>
            </CardFooter>
        </form>
      </Form>
    </div>
  );
}
