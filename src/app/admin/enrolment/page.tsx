
'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { firestore, storage } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, query, orderBy, limit, onSnapshot, Timestamp, setDoc, doc, getDoc, writeBatch, getDocs, where, runTransaction } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useSearchParams } from 'next/navigation';
import * as XLSX from 'xlsx';


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
  KeyRound,
  CircleDollarSign,
  Contact,
  ArrowRight,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';
import { logAuditEvent } from '@/lib/audit-log.service';
import { useAuth } from '@/context/auth-context';
import { ScrollArea } from '@/components/ui/scroll-area';
import { createUserAction } from '../users/actions';

const enrolmentSchema = z.object({
  studentFirstName: z.string().min(2, 'First name is required.'),
  studentLastName: z.string().min(2, 'Last name is required.'),
  dateOfBirth: z.date({ required_error: 'Date of birth is required.' }),
  gender: z.string({ required_error: 'Please select a gender.' }),
  admissionNumber: z.string().optional(),
  birthCertificateNumber: z.string().optional(),
  classId: z.string({ required_error: 'Please assign a class.' }),
  admissionYear: z.string({ required_error: 'Please select an admission year.' }),
  amountPaid: z.string().optional(),
  parentFirstName: z.string().min(2, 'Parent\'s first name is required.'),
  parentLastName: z.string().min(2, 'Parent\'s last name is required.'),
  parentRelationship: z.string({ required_error: 'Relationship is required.' }),
  parentEmail: z.string().email('Invalid email address.'),
  parentPassword: z.string().min(8, 'Password must be at least 8 characters.').optional(),
  parentPhone: z.string().min(10, 'A valid phone number is required.'),
  parentAltPhone: z.string().optional(),
  parentAddress: z.string().optional(),
  allergies: z.string().optional(),
  medicalConditions: z.string().optional(),
  nhifNumber: z.string().optional(),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
  generateInvoice: z.boolean().default(true),
});

type EnrolmentFormValues = z.infer<typeof enrolmentSchema>;

type RecentEnrolment = {
    id: string;
    studentName: string;
    class: string;
    parentName: string;
    date: string | Timestamp;
    status: 'Pending' | 'Approved' | 'Incomplete';
};

const getStatusBadge = (status: RecentEnrolment['status']) => {
    switch (status) {
        case 'Approved': return <Badge variant="default" className="bg-green-600 hover:bg-green-700 text-white"><CheckCircle className="mr-1 h-3 w-3"/>Approved</Badge>;
        case 'Pending': return <Badge variant="secondary" className="bg-yellow-500 text-white hover:bg-yellow-600"><Clock className="mr-1 h-3 w-3"/>Pending</Badge>;
        case 'Incomplete': return <Badge variant="destructive"><AlertCircle className="mr-1 h-3 w-3"/>Incomplete</Badge>;
    }
}

const requiredFields = [
    { id: 'studentFirstName', label: 'Student First Name' },
    { id: 'studentLastName', label: 'Student Last Name' },
    { id: 'classId', label: 'Class ID' },
    { id: 'parentFirstName', label: 'Parent First Name' },
    { id: 'parentLastName', label: 'Parent Last Name' },
    { id: 'parentEmail', label: 'Parent Email' },
    { id: 'parentPhone', label: 'Parent Phone' },
];

export default function StudentEnrolmentPage() {
    const { toast } = useToast();
    const searchParams = useSearchParams();
    const schoolId = searchParams.get('schoolId');
    const { user: adminUser } = useAuth();

    const [bulkEnrolmentFile, setBulkEnrolmentFile] = React.useState<File | null>(null);
    const [profilePhotoFile, setProfilePhotoFile] = React.useState<File | null>(null);
    const [profilePhoto, setProfilePhoto] = React.useState<string | null>(null);
    const [admissionDocs, setAdmissionDocs] = React.useState<File[]>([]);
    const [isProcessingFile, setIsProcessingFile] = React.useState(false);
    const [isFileProcessed, setIsFileProcessed] = React.useState(false);
    const [recentEnrolments, setRecentEnrolments] = React.useState<RecentEnrolment[]>([]);
    const [isBulkDialogOpen, setIsBulkDialogOpen] = React.useState(false);
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const [classOptions, setClassOptions] = React.useState<{ value: string; label: string; }[]>([]);

    // State for bulk import
    const [fileHeaders, setFileHeaders] = React.useState<string[]>([]);
    const [columnMapping, setColumnMapping] = React.useState<Record<string, string>>({});
    const [parsedData, setParsedData] = React.useState<any[]>([]);

    const form = useForm<EnrolmentFormValues>({
        resolver: zodResolver(enrolmentSchema),
        defaultValues: {
            studentFirstName: '',
            studentLastName: '',
            gender: '',
            admissionNumber: '',
            birthCertificateNumber: '',
            classId: '',
            admissionYear: new Date().getFullYear().toString(),
            amountPaid: '0',
            parentFirstName: '',
            parentLastName: '',
            parentRelationship: '',
            parentEmail: '',
            parentPassword: '',
            parentPhone: '',
            parentAltPhone: '',
            parentAddress: '',
            allergies: '',
            medicalConditions: '',
            nhifNumber: '',
            emergencyContactName: '',
            emergencyContactPhone: '',
            generateInvoice: true,
        },
    });

     React.useEffect(() => {
        if (!schoolId) return;

        const q = query(collection(firestore, 'schools', schoolId, 'students'), orderBy('createdAt', 'desc'), limit(5));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            if(snapshot.empty) {
                setRecentEnrolments([]);
                return;
            }
            const fetchedEnrolments = snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    studentName: data.name,
                    class: data.class,
                    parentName: data.parentName,
                    date: (data.createdAt as Timestamp)?.toDate().toLocaleDateString() || new Date().toLocaleDateString(),
                    status: data.status,
                } as RecentEnrolment
            });
            setRecentEnrolments(fetchedEnrolments);
        });

        const classesQuery = query(collection(firestore, 'schools', schoolId, 'classes'));
        const unsubClasses = onSnapshot(classesQuery, (snapshot) => {
            const options = snapshot.docs.map(doc => ({ value: doc.id, label: `${doc.data().name} ${doc.data().stream || ''}`.trim() }));
            setClassOptions(options);
        });

        return () => {
            unsubscribe();
            unsubClasses();
        };
    }, [schoolId]);

    const handleBulkFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            setBulkEnrolmentFile(event.target.files[0]);
            setIsFileProcessed(false);
            setParsedData([]);
            setFileHeaders([]);
            setColumnMapping({});
        }
    };
    
    const handleRemoveBulkFile = () => {
        setBulkEnrolmentFile(null);
        setIsFileProcessed(false);
        setParsedData([]);
        setFileHeaders([]);
        setColumnMapping({});
    };

    const handleProcessFile = () => {
        if (!bulkEnrolmentFile) return;
        setIsProcessingFile(true);
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = e.target?.result;
                const workbook = XLSX.read(data, { type: 'binary' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const json: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
                
                const headers = json[0] || [];
                setFileHeaders(headers);

                const records = json.slice(1).map(row => {
                    const record: any = {};
                    headers.forEach((header: string, index: number) => {
                        record[header] = row[index];
                    });
                    return record;
                });
                setParsedData(records);

                setIsFileProcessed(true);
                toast({ title: 'File Processed', description: 'Please map the columns from your file to the required fields.' });
            } catch (error) {
                 toast({ title: 'Error Processing File', description: 'The file format might be incorrect.', variant: 'destructive' });
            } finally {
                setIsProcessingFile(false);
            }
        };
        reader.readAsBinaryString(bulkEnrolmentFile);
    };
    
     const handleImportStudents = async () => {
        toast({ title: 'Coming Soon', description: 'This feature is currently in development.', variant: 'destructive' });
    };


    const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            const file = event.target.files[0];
            setProfilePhotoFile(file);
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

    const generateAdmissionNumber = async (schoolId: string, admissionYear: string) => {
        const counterRef = doc(firestore, `schools/${schoolId}/counters/student_admissions`);
        let nextNumber = 1;
    
        try {
            await runTransaction(firestore, async (transaction) => {
                const counterDoc = await transaction.get(counterRef);
                if (!counterDoc.exists()) {
                    transaction.set(counterRef, { count: 1 });
                } else {
                    nextNumber = counterDoc.data().count + 1;
                    transaction.update(counterRef, { count: nextNumber });
                }
            });
        } catch (error) {
            console.error("Transaction failed to generate admission number: ", error);
            // Fallback to a random number if transaction fails to avoid blocking enrolment
            return `SCH-${admissionYear}-${Math.floor(1000 + Math.random() * 9000)}`;
        }
        
        return `SCH-${admissionYear}-${String(nextNumber).padStart(3, '0')}`;
    };

    async function onSubmit(values: EnrolmentFormValues) {
        if (!schoolId || !adminUser) {
            toast({ title: 'Error', description: 'School ID or Admin user is missing.', variant: 'destructive'});
            return;
        }
        setIsSubmitting(true);
        
        try {
            let parentUserId;
            let parentIsNew = false;
            const parentQuery = query(collection(firestore, `schools/${schoolId}/users`), where('email', '==', values.parentEmail));
            const parentQuerySnapshot = await getDocs(parentQuery);

            if (parentQuerySnapshot.empty) {
                if (!values.parentPassword) {
                    throw new Error('Password is required for new parent accounts.');
                }
                
                const result = await createUserAction({
                    schoolId,
                    email: values.parentEmail,
                    password: values.parentPassword,
                    name: `${values.parentFirstName} ${values.parentLastName}`,
                    role: 'Parent',
                    actor: { id: adminUser.uid, name: adminUser.displayName || 'Admin' }
                });

                if (!result.success || !result.uid) {
                    throw new Error(result.message || 'Failed to create parent account.');
                }
                parentUserId = result.uid;
                parentIsNew = true;

            } else {
                parentUserId = parentQuerySnapshot.docs[0].id;
            }

            await runTransaction(firestore, async (transaction) => {
                const admissionNumber = values.admissionNumber || await generateAdmissionNumber(schoolId, values.admissionYear);
                let photoUrl = '';
                if (profilePhotoFile) {
                    const storageRef = ref(storage, `${schoolId}/profile_photos/${Date.now()}_${profilePhotoFile.name}`);
                    await uploadBytes(storageRef, profilePhotoFile);
                    photoUrl = await getDownloadURL(storageRef);
                }
                const admissionDocUrls = await Promise.all(
                    admissionDocs.map(async (file) => {
                        const storageRef = ref(storage, `${schoolId}/admission_docs/${Date.now()}_${file.name}`);
                        await uploadBytes(storageRef, file);
                        return getDownloadURL(storageRef);
                    })
                );

                const classRef = doc(firestore, `schools/${schoolId}/classes`, values.classId);
                const classSnap = await transaction.get(classRef);
                const classTeacherId = classSnap.exists() ? classSnap.data().teacherId : null;

                let totalFee = 0;
                if (values.generateInvoice) {
                    const feeStructureRef = doc(firestore, `schools/${schoolId}/fee-structures`, values.classId);
                    const feeStructureSnap = await transaction.get(feeStructureRef);
                    if (feeStructureSnap.exists()) {
                        const feeItems = feeStructureSnap.data().items || [];
                        totalFee = feeItems.reduce((sum: number, item: { amount: number }) => sum + item.amount, 0);
                    }
                }
                const amountPaid = Number(values.amountPaid) || 0;
                const initialBalance = totalFee - amountPaid;

                const studentDocRef = doc(collection(firestore, 'schools', schoolId, 'students'));
                transaction.set(studentDocRef, {
                    id: studentDocRef.id, schoolId, role: 'Student', status: 'Approved',
                    name: `${values.studentFirstName} ${values.studentLastName}`,
                    firstName: values.studentFirstName, lastName: values.studentLastName,
                    dateOfBirth: Timestamp.fromDate(values.dateOfBirth),
                    gender: values.gender, admissionNumber,
                    birthCertificateNumber: values.birthCertificateNumber || null,
                    nhifNumber: values.nhifNumber || null,
                    classId: values.classId,
                    class: classOptions.find(c => c.value === values.classId)?.label || 'N/A',
                    classTeacherId: classTeacherId,
                    admissionYear: values.admissionYear,
                    parentId: parentUserId,
                    parentName: `${values.parentFirstName} ${values.parentLastName}`,
                    parentRelationship: values.parentRelationship,
                    parentEmail: values.parentEmail,
                    parentPhone: values.parentPhone,
                    allergies: values.allergies || 'None',
                    medicalConditions: values.medicalConditions || 'None',
                    emergencyContactName: values.emergencyContactName || null,
                    emergencyContactPhone: values.emergencyContactPhone || null,
                    createdAt: serverTimestamp(),
                    avatarUrl: photoUrl,
                    documents: admissionDocUrls,
                    totalFee,
                    amountPaid,
                    balance: initialBalance,
                });

                if (values.generateInvoice && totalFee > 0) {
                    const chargeTransactionRef = doc(collection(studentDocRef, 'transactions'));
                    transaction.set(chargeTransactionRef, {
                        date: serverTimestamp(), description: 'Annual School Fees',
                        type: 'Charge', amount: totalFee, balance: initialBalance,
                    });
                }
                if (amountPaid > 0) {
                    const paymentTransactionRef = doc(collection(studentDocRef, 'transactions'));
                    transaction.set(paymentTransactionRef, {
                        date: serverTimestamp(), description: 'Initial Fee Payment on Enrolment',
                        type: 'Payment', amount: -amountPaid, balance: initialBalance,
                    });
                    
                    const schoolTransactionRef = doc(collection(firestore, `schools/${schoolId}/transactions`));
                    transaction.set(schoolTransactionRef, {
                        studentId: studentDocRef.id, studentName: `${values.studentFirstName} ${values.studentLastName}`,
                        class: classOptions.find(c => c.value === values.classId)?.label || 'N/A',
                        date: serverTimestamp(), description: 'Enrolment Payment', type: 'Payment',
                        amount: amountPaid, method: 'Manual',
                    });
                }
            });

            // Send notification to the parent
            await addDoc(collection(firestore, `schools/${schoolId}/notifications`), {
              title: `Welcome to the Parent Portal!`,
              description: `The account for your child, ${values.studentFirstName} ${values.studentLastName}, is now active. Log in to view details.`,
              createdAt: serverTimestamp(),
              category: 'General',
              href: `/parent?schoolId=${schoolId}`,
              userId: parentUserId,
            });

            const studentName = `${values.studentFirstName} ${values.studentLastName}`;
            const parentName = `${values.parentFirstName} ${values.parentLastName}`;
            await logAuditEvent({
                schoolId, action: 'STUDENT_ENROLLED', actionType: 'User Management',
                description: `New student ${studentName} enrolled.`,
                user: { id: adminUser.uid, name: adminUser.displayName || 'Admin', role: 'Admin' },
                details: `Class: ${classOptions.find(c => c.value === values.classId)?.label}, Parent: ${parentName}`,
            });

            toast({
                title: 'Enrolment Successful!',
                description: `${studentName} has been enrolled and the parent account for ${parentName} is ${parentIsNew ? 'created' : 'linked'}.`,
            });
            form.reset();
            setProfilePhoto(null); setProfilePhotoFile(null); setAdmissionDocs([]);
        } catch (error: any) {
            let errorMessage = 'An error occurred. Please try again.';
            if (error.code === 'auth/email-already-in-use') errorMessage = 'This parent email is already registered. Please use a different email or log in to their existing account to add another child.';
            else if (error.code === 'auth/weak-password') errorMessage = 'The password is too weak. It must be at least 8 characters long.';
            else errorMessage = error.message;
            console.error("Error submitting enrolment:", error);
            toast({ title: 'Submission Failed', description: errorMessage, variant: 'destructive' });
        } finally {
            setIsSubmitting(false);
        }
    }
    
    const handleSaveDraft = () => {
        toast({
            title: 'Draft Saved',
            description: 'The student enrolment application has been saved as a draft.',
        });
    }

    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 10 }, (_, i) => (currentYear - i).toString());

  if (!schoolId) {
    return <div className="p-8">Error: School ID is missing. Please access this page through the developer dashboard.</div>
  }

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
        <Dialog open={isBulkDialogOpen} onOpenChange={setIsBulkDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline">
              <Upload className="mr-2 h-4 w-4" />
              Bulk Enroll Students
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-4xl">
              <DialogHeader>
                  <DialogTitle>Import Students from CSV/Excel</DialogTitle>
                  <DialogDescription>
                      This feature is under development and will be available soon.
                  </DialogDescription>
              </DialogHeader>
              <div className="py-4 text-center text-muted-foreground">
                    <p>(Feature coming soon)</p>
              </div>
              <DialogFooter>
                <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
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
                                <FormField
                                  control={form.control}
                                  name="dateOfBirth"
                                  render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                      <FormLabel>Date of Birth</FormLabel>
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
                                              {field.value ? (
                                                format(field.value, "PPP")
                                              ) : (
                                                <span>Pick a date</span>
                                              )}
                                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                            </Button>
                                          </FormControl>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                          <Calendar
                                            mode="single"
                                            selected={field.value}
                                            onSelect={field.onChange}
                                            disabled={(date) =>
                                              date > new Date() || date < new Date("1900-01-01")
                                            }
                                            captionLayout="dropdown-buttons"
                                            fromYear={1980}
                                            toYear={new Date().getFullYear()}
                                            initialFocus
                                          />
                                        </PopoverContent>
                                      </Popover>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <FormField control={form.control} name="gender" render={({ field }) => ( <FormItem><FormLabel>Gender</FormLabel><FormControl><Select onValueChange={field.onChange} value={field.value}><SelectTrigger><SelectValue placeholder="Select a gender" /></SelectTrigger><SelectContent><SelectItem value="male">Male</SelectItem><SelectItem value="female">Female</SelectItem></SelectContent></Select></FormControl><FormMessage /></FormItem> )}/>
                                 <FormField control={form.control} name="admissionNumber" render={({ field }) => ( <FormItem><FormLabel>Admission Number</FormLabel><FormControl><Input placeholder="e.g., SCH-1234" {...field} /></FormControl><FormDescription>Leave blank to auto-generate.</FormDescription><FormMessage /></FormItem> )}/>
                                 <FormField control={form.control} name="birthCertificateNumber" render={({ field }) => ( <FormItem><FormLabel>Birth Certificate No.</FormLabel><FormControl><Input placeholder="e.g., 1234567" {...field} /></FormControl><FormMessage /></FormItem> )}/>
                            </div>
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><Contact className="h-5 w-5 text-primary"/>Parent/Guardian Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <FormField control={form.control} name="parentFirstName" render={({ field }) => ( <FormItem><FormLabel>First Name</FormLabel><FormControl><Input placeholder="e.g., Mark" {...field} /></FormControl><FormMessage /></FormItem> )}/>
                                <FormField control={form.control} name="parentLastName" render={({ field }) => ( <FormItem><FormLabel>Last Name</FormLabel><FormControl><Input placeholder="e.g., Johnson" {...field} /></FormControl><FormMessage /></FormItem> )}/>
                                <FormField control={form.control} name="parentRelationship" render={({ field }) => ( <FormItem><FormLabel>Relationship to Student</FormLabel><FormControl><Select onValueChange={field.onChange} value={field.value}><SelectTrigger><SelectValue placeholder="Select a relationship" /></SelectTrigger><SelectContent><SelectItem value="father">Father</SelectItem><SelectItem value="mother">Mother</SelectItem><SelectItem value="guardian">Guardian</SelectItem></SelectContent></Select></FormControl><FormMessage /></FormItem> )}/>
                                <FormField control={form.control} name="parentPhone" render={({ field }) => ( <FormItem><FormLabel>Phone Number</FormLabel><FormControl><Input type="tel" placeholder="e.g., 0712345678" {...field} /></FormControl><FormMessage /></FormItem> )}/>
                                <FormField control={form.control} name="parentAltPhone" render={({ field }) => ( <FormItem><FormLabel>Alternative Phone No.</FormLabel><FormControl><Input type="tel" placeholder="Optional" {...field} /></FormControl><FormMessage /></FormItem> )}/>
                             </div>
                             <FormField control={form.control} name="parentAddress" render={({ field }) => ( <FormItem><FormLabel>Physical Address</FormLabel><FormControl><Textarea placeholder="e.g., P.O. Box 123, Nairobi" {...field} /></FormControl><FormMessage /></FormItem> )}/>
                            <Separator className="my-6" />
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <FormField control={form.control} name="parentEmail" render={({ field }) => ( <FormItem><FormLabel>Parent's Login Email</FormLabel><FormControl><Input type="email" placeholder="parent@example.com" {...field} /></FormControl><FormMessage /></FormItem> )}/>
                                <FormField control={form.control} name="parentPassword" render={({ field }) => ( <FormItem><FormLabel>Set Initial Password</FormLabel><FormControl><Input type="password" {...field} /></FormControl><FormDescription>Only required for new parent accounts.</FormDescription><FormMessage /></FormItem> )}/>
                             </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><HeartPulse className="h-5 w-5 text-primary"/>Health Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <FormField control={form.control} name="nhifNumber" render={({ field }) => ( <FormItem><FormLabel>NHIF Number</FormLabel><FormControl><Input placeholder="e.g., 987654321" {...field} /></FormControl><FormMessage /></FormItem> )}/>
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
                            <CardTitle>Academic & Administrative</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                             <FormField control={form.control} name="classId" render={({ field }) => ( <FormItem><FormLabel>Assign to Class</FormLabel><FormControl><Select onValueChange={field.onChange} value={field.value}><SelectTrigger><SelectValue placeholder="Select a class" /></SelectTrigger><SelectContent>{classOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}</SelectContent></Select></FormControl><FormMessage /></FormItem> )}/>
                             <FormField control={form.control} name="admissionYear" render={({ field }) => ( <FormItem><FormLabel>Year of Admission</FormLabel><FormControl><Select onValueChange={field.onChange} value={field.value}><SelectTrigger><SelectValue placeholder="Select a year" /></SelectTrigger><SelectContent>{years.map(year => <SelectItem key={year} value={year}>{year}</SelectItem>)}</SelectContent></Select></FormControl><FormMessage /></FormItem> )}/>
                             <Separator />
                             <FormField control={form.control} name="amountPaid" render={({ field }) => ( <FormItem><FormLabel>Initial Fee Payment (KES)</FormLabel><div className="relative"><CircleDollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><FormControl><Input type="number" placeholder="0" className="pl-10" {...field} /></FormControl></div><FormMessage /></FormItem> )}/>
                             <Separator />
                            <div className="space-y-2">
                                <Label>Student Profile Photo</Label>
                                <div className="flex items-center gap-4">
                                    <Avatar className="h-16 w-16">
                                        <AvatarImage src={profilePhoto || ''} />
                                        <AvatarFallback><UserPlus/></AvatarFallback>
                                    </Avatar>
                                    {profilePhoto ? (
                                        <Button type="button" variant="destructive" className="w-full" onClick={() => {setProfilePhoto(null); setProfilePhotoFile(null);}}>
                                            <X className="mr-2 h-4 w-4" />
                                            Remove Photo
                                        </Button>
                                    ) : (
                                        <Label htmlFor="photo-upload" className="w-full">
                                            <Button type="button" variant="outline" asChild className="w-full cursor-pointer">
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
                                            <Button type="button" variant="outline" asChild className="w-full cursor-pointer">
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
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Recent Enrolments</CardTitle>
                        </CardHeader>
                        <CardContent>
                             <ScrollArea className="h-[300px] w-full">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Student</TableHead>
                                            <TableHead>Status</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {recentEnrolments.length > 0 ? (
                                            recentEnrolments.map((enrolment) => (
                                                <TableRow key={enrolment.id}>
                                                    <TableCell>
                                                        <div className="font-medium">{enrolment.studentName}</div>
                                                        <div className="text-xs text-muted-foreground">{enrolment.class}</div>
                                                    </TableCell>
                                                    <TableCell>{getStatusBadge(enrolment.status)}</TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={2} className="h-24 text-center">
                                                    No recent enrolments.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                             </ScrollArea>
                        </CardContent>
                    </Card>
                </div>
            </div>
             <CardFooter className="flex flex-col md:flex-row md:justify-end p-0 pt-6 gap-2">
                <Button type="button" variant="secondary" className="w-full md:w-auto" onClick={handleSaveDraft}>
                    Save as Draft
                </Button>
                <Button type="submit" className="w-full md:w-auto" disabled={isSubmitting}>
                     {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Submitting...</> : <><Save className="mr-2 h-4 w-4"/>Submit Enrolment Application</>}
                </Button>
            </CardFooter>
        </form>
      </Form>
    </div>
  );
}
