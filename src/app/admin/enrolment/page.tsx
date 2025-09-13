
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
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
  Columns,
  HeartPulse,
  X,
  Loader2,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';

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
  allergies: z.string().optional(),
  medicalConditions: z.string().optional(),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
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
    const [bulkEnrolmentFile, setBulkEnrolmentFile] = React.useState<File | null>(null);
    const [profilePhoto, setProfilePhoto] = React.useState<string | null>(null);
    const [admissionDocs, setAdmissionDocs] = React.useState<File[]>([]);
    const [isProcessingFile, setIsProcessingFile] = React.useState(false);
    const [isFileProcessed, setIsFileProcessed] = React.useState(false);


    const form = useForm<EnrolmentFormValues>({
        resolver: zodResolver(enrolmentSchema),
        defaultValues: {
            generateInvoice: true,
            sendInvite: true,
        },
    });
    
    const handleBulkFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            setBulkEnrolmentFile(event.target.files[0]);
            setIsFileProcessed(false);
        }
    };
    
    const handleRemoveBulkFile = () => {
        setBulkEnrolmentFile(null);
        setIsFileProcessed(false);
    };

    const handleProcessFile = () => {
        setIsProcessingFile(true);
        setTimeout(() => {
            setIsProcessingFile(false);
            setIsFileProcessed(true);
            toast({
                title: 'File Processed',
                description: 'Please map the columns from your file to the required fields.',
            });
        }, 1500);
    }

    const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            const file = event.target.files[0];
            setProfilePhoto(URL.createObjectURL(file));
        }
    };

    const handleDocsChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files) {
            setAdmissionDocs(prev => [...prev, ...Array.from(event.target.files!)]);
        }
    };

    const removeAdmissionDoc = (index: number) => {
        setAdmissionDocs(prev => prev.filter((_, i) => i !== index));
    };

    function onSubmit(values: EnrolmentFormValues) {
        console.log(values);
        toast({
            title: 'Enrolment Submitted',
            description: `${values.studentFirstName} ${values.studentLastName} has been successfully submitted for enrolment.`,
        });
        form.reset();
        setProfilePhoto(null);
        setAdmissionDocs([]);
    }
    
    const handleSaveDraft = () => {
        toast({
            title: 'Draft Saved',
            description: 'The student enrolment application has been saved as a draft.',
        });
    }

    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 10 }, (_, i) => (currentYear - i).toString());

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6 flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex-1">
          <h1 className="font-headline text-3xl font-bold flex items-center gap-2">
            <UserPlus className="h-8 w-8 text-primary" />
            Student Enrolment
          </h1>
          <p className="text-muted-foreground">Register new students individually or in bulk.</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline">
              <Upload className="mr-2 h-4 w-4" />
              Bulk Enroll Students
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-2xl">
              <DialogHeader>
                  <DialogTitle>Import Students from CSV/Excel</DialogTitle>
                  <DialogDescription>
                      Upload a file to bulk register new students.
                  </DialogDescription>
              </DialogHeader>
              <div className="grid gap-6 py-4">
                  <div className="space-y-2">
                      <Label>Step 1: Upload File</Label>
                      <div className="flex items-center justify-center w-full">
                          {bulkEnrolmentFile ? (
                               <div className="w-full p-4 rounded-lg border bg-muted/50 flex items-center justify-between">
                                  <div className="flex items-center gap-2 text-sm font-medium">
                                      <FileText className="h-5 w-5 text-primary" />
                                      <span className="truncate">{bulkEnrolmentFile.name}</span>
                                  </div>
                                  <Button variant="ghost" size="icon" onClick={handleRemoveBulkFile} className="h-6 w-6">
                                      <X className="h-4 w-4 text-destructive" />
                                  </Button>
                              </div>
                          ) : (
                              <Label htmlFor="dropzone-file-bulk" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted/50 hover:bg-muted">
                                  <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center">
                                      <Upload className="w-8 h-8 mb-2 text-muted-foreground" />
                                      <p className="mb-2 text-sm text-muted-foreground">Click to upload or drag and drop</p>
                                      <p className="text-xs text-muted-foreground">CSV or Excel (up to 5MB)</p>
                                  </div>
                                  <Input id="dropzone-file-bulk" type="file" className="hidden" onChange={handleBulkFileChange} />
                              </Label>
                          )}
                      </div>
                  </div>
                  <div className={cn("space-y-4", !isFileProcessed && "opacity-50")}>
                      <div className="flex items-center gap-2">
                          <Columns className="h-5 w-5 text-primary" />
                          <h4 className="font-medium">Step 2: Map Columns</h4>
                      </div>
                      <p className="text-sm text-muted-foreground">Match the columns from your file to the required fields in the system.</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="grid grid-cols-[1fr,150px] items-center gap-2">
                              <Label>Full Name</Label>
                              <Select defaultValue="col1" disabled={!isFileProcessed}>
                                  <SelectTrigger><SelectValue/></SelectTrigger>
                                  <SelectContent>
                                      <SelectItem value="col1">Column A</SelectItem>
                                      <SelectItem value="col2">Column B</SelectItem>
                                      <SelectItem value="col3">Column C</SelectItem>
                                  </SelectContent>
                              </Select>
                          </div>
                          <div className="grid grid-cols-[1fr,150px] items-center gap-2">
                              <Label>Admission No.</Label>
                               <Select defaultValue="col2" disabled={!isFileProcessed}>
                                  <SelectTrigger><SelectValue/></SelectTrigger>
                                  <SelectContent>
                                      <SelectItem value="col1">Column A</SelectItem>
                                      <SelectItem value="col2">Column B</SelectItem>
                                      <SelectItem value="col3">Column C</SelectItem>
                                  </SelectContent>
                              </Select>
                          </div>
                          <div className="grid grid-cols-[1fr,150px] items-center gap-2">
                              <Label>Class</Label>
                               <Select defaultValue="col3" disabled={!isFileProcessed}>
                                  <SelectTrigger><SelectValue/></SelectTrigger>
                                  <SelectContent>
                                      <SelectItem value="col1">Column A</SelectItem>
                                      <SelectItem value="col2">Column B</SelectItem>
                                      <SelectItem value="col3">Column C</SelectItem>
                                  </SelectContent>
                              </Select>
                          </div>
                           <div className="grid grid-cols-[1fr,150px] items-center gap-2">
                              <Label>Parent Name</Label>
                               <Select disabled={!isFileProcessed}>
                                  <SelectTrigger><SelectValue placeholder="Select column..."/></SelectTrigger>
                                  <SelectContent>
                                      <SelectItem value="col4">Column D</SelectItem>
                                  </SelectContent>
                              </Select>
                          </div>
                      </div>
                  </div>
              </div>
              <DialogFooter>
                  <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                  <Button onClick={handleProcessFile} disabled={!bulkEnrolmentFile || isProcessingFile}>
                    {isProcessingFile ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/>Processing...</> : 'Process File'}
                  </Button>
              </DialogFooter>
          </DialogContent>
        </Dialog>
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
                                 <FormField control={form.control} name="admissionNumber" render={({ field }) => ( <FormItem><FormLabel>Admission Number</FormLabel><FormControl><Input placeholder="e.g., SCH-1234" {...field} /></FormControl><FormDescription>Leave blank to auto-generate.</FormDescription><FormMessage /></FormItem> )}/>
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
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><HeartPulse className="h-5 w-5 text-primary"/>Health Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <FormField control={form.control} name="allergies" render={({ field }) => ( <FormItem><FormLabel>Known Allergies</FormLabel><FormControl><Textarea placeholder="e.g., Peanuts, Pollen, Lactose Intolerance. If none, write 'None'." {...field} /></FormControl><FormMessage /></FormItem> )}/>
                            <FormField control={form.control} name="medicalConditions" render={({ field }) => ( <FormItem><FormLabel>Ongoing Medical Conditions</FormLabel><FormControl><Textarea placeholder="e.g., Asthma, Diabetes. If none, write 'None'." {...field} /></FormControl><FormMessage /></FormItem> )}/>
                            <Separator />
                            <h4 className="font-medium text-sm">Emergency Contact</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <FormField control={form.control} name="emergencyContactName" render={({ field }) => ( <FormItem><FormLabel>Contact Name</FormLabel><FormControl><Input placeholder="e.g., Jane Doe" {...field} /></FormControl><FormMessage /></FormItem> )}/>
                                <FormField control={form.control} name="emergencyContactPhone" render={({ field }) => ( <FormItem><FormLabel>Contact Phone</FormLabel><FormControl><Input type="tel" placeholder="e.g., 0712345678" {...field} /></FormControl><FormMessage /></FormItem> )}/>
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
                                        <AvatarImage src={profilePhoto || ''} />
                                        <AvatarFallback><UserPlus/></AvatarFallback>
                                    </Avatar>
                                    {profilePhoto ? (
                                        <Button type="button" variant="destructive" className="w-full" onClick={() => setProfilePhoto(null)}>
                                            <X className="mr-2 h-4 w-4" />
                                            Remove Photo
                                        </Button>
                                    ) : (
                                        <Label htmlFor="photo-upload" className="w-full">
                                            <Button type="button" variant="outline" asChild className="w-full">
                                                <span>
                                                    <Upload className="mr-2 h-4 w-4" />
                                                    Upload Photo
                                                </span>
                                            </Button>
                                            <Input id="photo-upload" type="file" className="hidden" accept="image/*" onChange={handlePhotoChange} />
                                        </Label>
                                    )}
                                </div>
                                <FormDescription>Recommended: 400x400px.</FormDescription>
                            </div>
                             <div className="space-y-2">
                                <Label>Admission Documents</Label>
                                {admissionDocs.length > 0 ? (
                                    <div className="space-y-2">
                                        {admissionDocs.map((file, index) => (
                                            <div key={index} className="flex items-center justify-between p-2 rounded-md border text-sm">
                                                <span className="truncate">{file.name}</span>
                                                <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeAdmissionDoc(index)}>
                                                    <X className="h-4 w-4 text-destructive" />
                                                </Button>
                                            </div>
                                        ))}
                                        <Label htmlFor="dropzone-file-docs-more" className="w-full">
                                            <Button type="button" variant="outline" asChild className="w-full">
                                                <span>
                                                    <Upload className="mr-2 h-4 w-4" />
                                                    Add More Files
                                                </span>
                                            </Button>
                                            <Input id="dropzone-file-docs-more" type="file" className="hidden" multiple onChange={handleDocsChange} />
                                        </Label>
                                    </div>
                                ) : (
                                    <Label htmlFor="dropzone-file-docs" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted/50 hover:bg-muted">
                                        <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center">
                                            <Upload className="w-8 h-8 mb-2 text-muted-foreground" />
                                            <p className="mb-2 text-sm text-muted-foreground">Upload Birth Cert, Report Cards</p>
                                            <p className="text-xs text-muted-foreground">(PDF, JPG, PNG)</p>
                                        </div>
                                        <Input id="dropzone-file-docs" type="file" className="hidden" multiple onChange={handleDocsChange} />
                                    </Label>
                                )}
                            </div>
                            <Separator />
                             <FormField control={form.control} name="generateInvoice" render={({ field }) => (<FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm"><div className="space-y-0.5"><FormLabel>Generate Pro-forma Invoice</FormLabel></div><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>)}/>
                             <FormField control={form.control} name="sendInvite" render={({ field }) => (<FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm"><div className="space-y-0.5"><FormLabel>Send Portal Invitation</FormLabel><FormDescription>Sends a welcome email to the parent/guardian with a secure link to set up their portal account.</FormDescription></div><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>)}/>
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
             <CardFooter className="flex justify-end p-0 pt-6 gap-2">
                <Button type="button" variant="secondary" className="w-full md:w-auto" onClick={handleSaveDraft}>
                    Save as Draft
                </Button>
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
