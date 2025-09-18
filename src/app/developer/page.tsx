

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
import { auth, firestore, firebaseConfig } from '@/lib/firebase';
import { collection, onSnapshot, addDoc, serverTimestamp, doc, setDoc, writeBatch, updateDoc } from 'firebase/firestore';
import { initialRolePermissions } from '@/app/admin/permissions/roles-data';
import { defaultPeriods } from '@/app/teacher/timetable/timetable-data';
import { createUserWithEmailAndPassword, getAuth } from 'firebase/auth';
import { initializeApp, deleteApp } from 'firebase/app';


type School = {
  id: string;
  name: string;
  schoolCode: string;
  admin: string;
  status: 'Active' | 'Provisioning';
  logoUrl: string;
  plan: 'Premium Tier' | 'Standard Tier';
};


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

    const secondaryApp = initializeApp(firebaseConfig, `secondary-creation-${Date.now()}`);
    const secondaryAuth = getAuth(secondaryApp);

    try {
        // Generate a 6-digit numeric school code
        const schoolCode = Math.floor(100000 + Math.random() * 900000).toString();

        // 1. Create the admin user in Firebase Auth using the secondary instance
        const userCredential = await createUserWithEmailAndPassword(secondaryAuth, adminEmail, adminPassword);
        const adminUid = userCredential.user.uid;

        const batch = writeBatch(firestore);
        
        // 2. Create main school document
        const schoolRef = doc(firestore, 'schools', schoolCode); // Use schoolCode as document ID
        batch.set(schoolRef, {
            id: schoolCode,
            name: schoolName,
            schoolCode: schoolCode,
            admin: adminEmail,
            status: 'Provisioning',
            logoUrl: `https://picsum.photos/seed/${schoolName}/100`,
            plan: 'Standard Tier',
            createdAt: serverTimestamp(),
        });

        // 3. Add default roles for the new school
        Object.entries(initialRolePermissions).forEach(([roleName, roleData]) => {
            const roleRef = doc(firestore, 'schools', schoolCode, 'roles', roleName);
            batch.set(roleRef, { permissions: roleData.permissions, isCore: roleData.isCore, userCount: 0 });
        });
        
        // 4. Create the admin's user document in the school's admins subcollection
        const adminUserRef = doc(firestore, 'schools', schoolCode, 'admins', adminUid);
        batch.set(adminUserRef, {
            id: adminUid,
            schoolId: schoolCode,
            name: 'School Admin', // Placeholder name
            email: adminEmail,
            role: 'Admin',
            status: 'Active',
            createdAt: serverTimestamp(),
            lastLogin: serverTimestamp()
        });

        // 5. Add default timetable periods
        const periodsRef = doc(firestore, 'schools', schoolCode, 'timetableSettings', 'periods');
        batch.set(periodsRef, { periods: defaultPeriods });

        // 6. Add default fee structure item
        const feeStructureRef = doc(collection(firestore, 'schools', schoolCode, 'feeStructure'));
        batch.set(feeStructureRef, {
            category: 'School Fees',
            appliesTo: 'All Students',
            amount: 50000,
        });

        await batch.commit();
        
        toast({
            title: 'School Provisioned!',
            description: `${schoolName} is being set up. School Code: ${schoolCode}`,
        });

        // Simulate status change from Provisioning to Active
        setTimeout(() => {
             updateDoc(schoolRef, { status: 'Active' });
        }, 3000);

        setSchoolName('');
        setAdminEmail('');
        setAdminPassword('');

    } catch(e: any) {
        let errorMessage = 'Could not create school instance. Please try again.';
        if (e.code === 'auth/email-already-in-use') {
            errorMessage = 'This email is already in use by another account.';
        } else if (e.code === 'auth/weak-password') {
            errorMessage = 'The password is too weak. Please use at least 6 characters.';
        }
        toast({ title: 'Error', description: errorMessage, variant: 'destructive'});
        console.error(e);
    } finally {
        setIsCreating(false);
        await deleteApp(secondaryApp);
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
                        <AvatarImage src={school.logoUrl} />
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
                        <Link href={`/admin?schoolId=${school.id}`}>
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
