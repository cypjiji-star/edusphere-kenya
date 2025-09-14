
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
import { collection, onSnapshot, addDoc, serverTimestamp, doc, setDoc, writeBatch } from 'firebase/firestore';
import { initialRolePermissions, initialPermissionStructure } from '@/app/admin/permissions/roles-data';
import { periods as defaultPeriods } from '@/app/admin/timetable/timetable-data';


type School = {
  id: string;
  name: string;
  domain: string;
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
  const [subdomain, setSubdomain] = React.useState('');
  const [adminEmail, setAdminEmail] = React.useState('');
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
    if (!schoolName || !subdomain || !adminEmail) {
        toast({ title: 'Missing Information', description: 'Please fill out all fields.', variant: 'destructive' });
        return;
    }
    setIsCreating(true);
    try {
        const batch = writeBatch(firestore);
        
        // 1. Create main school document
        const schoolRef = doc(collection(firestore, 'schools'));
        batch.set(schoolRef, {
            id: schoolRef.id,
            name: schoolName,
            domain: `${subdomain}.school.app`,
            admin: adminEmail,
            status: 'Provisioning',
            logoUrl: `https://picsum.photos/seed/${schoolName}/100`,
            plan: 'Standard Tier',
            createdAt: serverTimestamp(),
        });

        // 2. Add default roles
        Object.entries(initialRolePermissions).forEach(([roleName, roleData]) => {
            const roleRef = doc(firestore, 'schools', schoolRef.id, 'roles', roleName);
            batch.set(roleRef, { permissions: roleData.permissions, isCore: roleData.isCore, userCount: 0 });
        });

        // 3. Add default timetable periods
        const periodsRef = doc(firestore, 'schools', schoolRef.id, 'timetableSettings', 'periods');
        batch.set(periodsRef, { periods: defaultPeriods });

        // 4. Add default fee structure item
        const feeStructureRef = doc(collection(firestore, 'schools', schoolRef.id, 'feeStructure'));
        batch.set(feeStructureRef, {
            category: 'Tuition Fee',
            appliesTo: 'All Students',
            amount: 50000,
        });

        await batch.commit();
        
        toast({
            title: 'School Provisioned!',
            description: `${schoolName} is being set up with default data.`,
        });

        // Simulate status change from Provisioning to Active
        setTimeout(() => {
             updateDoc(schoolRef, { status: 'Active' });
        }, 3000);


        setSchoolName('');
        setSubdomain('');
        setAdminEmail('');
    } catch(e) {
        toast({ title: 'Error', description: 'Could not create school instance.', variant: 'destructive'});
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
                Fill in the details to set up a new school instance.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="school-name">School Name</Label>
                <Input id="school-name" placeholder="e.g., Lakeview International School" value={schoolName} onChange={(e) => setSchoolName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="school-domain">Subdomain</Label>
                <div className="flex items-center gap-2">
                  <Input id="school-domain" placeholder="e.g., lakeview" value={subdomain} onChange={(e) => setSubdomain(e.target.value)} />
                  <span className="text-sm text-muted-foreground">.school.app</span>
                </div>
              </div>
               <div className="space-y-2">
                <Label htmlFor="admin-email">Initial Admin Email</Label>
                <Input id="admin-email" type="email" placeholder="principal@lakeview.ac.ke" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} />
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
                    <CardDescription>{school.domain}</CardDescription>
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
