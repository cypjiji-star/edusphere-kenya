

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
import { Building, PlusCircle, ArrowRight, Users, CheckCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { firestore } from '@/lib/firebase';
import { collection, onSnapshot, addDoc, serverTimestamp, doc, setDoc, writeBatch, updateDoc } from 'firebase/firestore';
import { initialRolePermissions } from '@/app/admin/permissions/roles-data';
import { defaultPeriods } from '@/app/admin/timetable/timetable-data';
import { createUserAction } from '../admin/users/actions';


type School = {
  id: string;
  name: string;
  schoolCode: string;
  admin: string;
  status: 'Active' | 'Provisioning';
  plan: 'Premium Tier' | 'Standard Tier';
};

const defaultSubjects = [
    { name: 'Mathematics', code: '121', department: 'Mathematics' },
    { name: 'English', code: '101', department: 'Languages' },
    { name: 'Kiswahili', code: '102', department: 'Languages' },
    { name: 'Chemistry', code: '233', department: 'Sciences' },
    { name: 'Biology', code: '231', department: 'Sciences' },
    { name: 'Physics', code: '232', department: 'Sciences' },
    { name: 'History & Government', code: '311', department: 'Humanities' },
    { name: 'Geography', code: '312', department: 'Humanities' },
    { name: 'CRE', code: '313', department: 'Humanities' },
    { name: 'Computer Studies', code: '451', department: 'Technical Subjects' },
    { name: 'Business Studies', code: '565', department: 'Technical Subjects' },
];


export default function DeveloperDashboard() {
  const [schools, setSchools] = React.useState<School[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isCreating, setIsCreating] = React.useState(false);

  const [schoolName, setSchoolName] = React.useState('');
  const [adminEmail, setAdminEmail] = React.useState('');
  const [adminPassword, setAdminPassword] = React.useState('');
  const { toast } = useToast();

  React.useEffect(() => {
    setIsLoading(true);
    const q = collection(firestore, 'schools');
    const unsubscribe = onSnapshot(q, (snapshot) => {
        const schoolsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as School));
        setSchools(schoolsData);
        setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleCreateSchool = async () => {
    if (!schoolName || !adminEmail || !adminPassword) {
        toast({ title: 'Missing Information', description: 'Please fill out all fields.', variant: 'destructive' });
        return;
    }
    setIsCreating(true);

    try {
        const schoolCode = Math.floor(100000 + Math.random() * 900000).toString();

        const schoolRef = doc(firestore, 'schools', schoolCode); 
        await setDoc(schoolRef, {
            id: schoolCode,
            name: schoolName,
            schoolCode: schoolCode,
            admin: adminEmail,
            status: 'Provisioning',
            plan: 'Standard Tier',
            createdAt: serverTimestamp(),
        });
        
        const adminResult = await createUserAction({
            schoolId: schoolCode,
            email: adminEmail,
            password: adminPassword,
            name: 'School Admin',
            role: 'Admin',
            actor: { id: 'system', name: 'Developer Portal' },
        });

        if (!adminResult.success) {
            throw new Error(adminResult.message || 'Failed to create initial admin user.');
        }

        const batch = writeBatch(firestore);
        
        // Seed initial roles
        Object.entries(initialRolePermissions).forEach(([roleName, roleData]) => {
            const roleRef = doc(firestore, 'schools', schoolCode, 'roles', roleName);
            batch.set(roleRef, { permissions: roleData.permissions, isCore: roleData.isCore, userCount: roleName === 'Admin' ? 1 : 0 });
        });
        
        // Seed default subjects
        defaultSubjects.forEach(subject => {
            const subjectRef = doc(collection(firestore, 'schools', schoolCode, 'subjects'));
            batch.set(subjectRef, { ...subject, createdAt: serverTimestamp() });
        });

        // Seed default library resources
        defaultSubjects.slice(0, 5).forEach(subject => {
            const resourceRef = doc(collection(firestore, 'schools', schoolCode, 'library-resources'));
            batch.set(resourceRef, {
                title: `${subject.name} Form 1 Textbook`,
                author: 'KICD',
                type: 'Textbook',
                subject: subject.name,
                grade: 'Form 1',
                description: `Official textbook for the ${subject.name} curriculum.`,
                totalCopies: 50,
                availableCopies: 50,
                status: 'Available',
                createdAt: serverTimestamp(),
            });
        });

        // Seed default timetable periods
        const periodsRef = doc(firestore, 'schools', schoolCode, 'timetableSettings', 'periods');
        batch.set(periodsRef, { periods: defaultPeriods });
        
        await batch.commit();
        
        toast({
            title: 'School Provisioned!',
            description: `${schoolName} is being set up. School Code: ${schoolCode}`,
        });

        // Finalize provisioning
        await updateDoc(schoolRef, { status: 'Active' });

        setSchoolName('');
        setAdminEmail('');
        setAdminPassword('');

    } catch(e: any) {
        let errorMessage = 'Could not create school instance. Please try again.';
        if (e.code === 'auth/email-already-in-use') {
            errorMessage = 'This email is already in use by another account.';
        } else if (e.code === 'auth/weak-password') {
            errorMessage = 'The password is too weak. Please use at least 6 characters.';
        } else if (e.message) {
            errorMessage = e.message;
        }
        toast({ title: 'Error', description: errorMessage, variant: 'destructive'});
        console.error(e);
    } finally {
        setIsCreating(false);
    }
  };


  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6 flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex-1">
          <h1 className="font-headline text-3xl font-bold flex items-center gap-2">
            <Building className="h-8 w-8 text-primary" />
            School Management
          </h1>
          <p className="text-muted-foreground">Oversee all school instances on the platform.</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Create New School
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Provision New School</DialogTitle>
              <DialogDescription>
                Fill in the details to set up a new school instance and its first administrator.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="school-name">School Name</Label>
                <Input id="school-name" placeholder="e.g., Lakeview International School" value={schoolName} onChange={(e) => setSchoolName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="admin-email">Initial Admin Email</Label>
                <Input id="admin-email" type="email" placeholder="principal@lakeview.ac.ke" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="admin-password">Set Admin Password</Label>
                <Input id="admin-password" type="password" placeholder="Must be at least 6 characters" value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} />
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <DialogClose asChild>
                <Button onClick={handleCreateSchool} disabled={isCreating}>
                    {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                    Create School
                </Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

       {isLoading ? (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {schools.map(school => (
                <Card key={school.id}>
                    <CardHeader>
                    <div className="flex items-center justify-between">
                        <Avatar>
                        <AvatarFallback>{school.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <Badge variant={school.status === 'Active' ? 'default' : 'secondary'} className={school.status === 'Active' ? 'bg-green-600' : ''}>
                        {school.status}
                        </Badge>
                    </div>
                    <CardTitle className="pt-4 font-headline text-xl">{school.name}</CardTitle>
                    <CardDescription>School Code: <span className="font-bold text-foreground">{school.schoolCode}</span></CardDescription>
                    </CardHeader>
                    <CardContent>
                    <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span>Admin: {school.admin}</span>
                        </div>
                        <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-muted-foreground" />
                        <span>Plan: {school.plan}</span>
                        </div>
                    </div>
                    </CardContent>
                    <CardFooter>
                    <Button asChild variant="outline" className="w-full" disabled={school.status !== 'Active'}>
                        <Link href={`/login?schoolCode=${school.schoolCode}`}>
                            Manage School
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                    </Button>
                    </CardFooter>
                </Card>
                ))}
            </div>
        )}
    </div>
  );
}
