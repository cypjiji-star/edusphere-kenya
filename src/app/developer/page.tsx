'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building, PlusCircle, ArrowRight, Users, CheckCircle } from 'lucide-react';
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

const schools = [
  {
    id: 'school-1',
    name: 'EduSphere High School',
    domain: 'edusphere.school.app',
    admin: 'Admin User',
    status: 'Active' as const,
    logoUrl: 'https://picsum.photos/seed/school-logo/100',
    plan: 'Premium Tier',
  },
  {
    id: 'school-2',
    name: 'Valley View Academy',
    domain: 'valleyview.school.app',
    admin: 'Principal Jane',
    status: 'Active' as const,
    logoUrl: 'https://picsum.photos/seed/school-logo-2/100',
    plan: 'Premium Tier',
  },
  {
    id: 'school-3',
    name: 'Riverside Preparatory',
    domain: 'riverside.school.app',
    admin: 'Mr. John Carter',
    status: 'Provisioning' as const,
    logoUrl: 'https://picsum.photos/seed/school-logo-3/100',
    plan: 'Standard Tier',
  }
];

export default function DeveloperDashboard() {
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
                <Input id="school-name" placeholder="e.g., Lakeview International School" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="school-domain">Subdomain</Label>
                <div className="flex items-center gap-2">
                  <Input id="school-domain" placeholder="e.g., lakeview" />
                  <span className="text-sm text-muted-foreground">.school.app</span>
                </div>
              </div>
               <div className="space-y-2">
                <Label htmlFor="admin-email">Initial Admin Email</Label>
                <Input id="admin-email" type="email" placeholder="principal@lakeview.ac.ke" />
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button disabled>Create School</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

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
              <Button asChild variant="outline" className="w-full">
                <Link href={`/admin`}>
                  Manage School
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
