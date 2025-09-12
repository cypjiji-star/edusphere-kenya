
'use client';

import * as React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShieldCheck, User, Save, PlusCircle, Trash2 } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
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

type Permission = {
  id: string;
  label: string;
};

type PermissionCategory = {
  title: string;
  permissions: Permission[];
};

const permissionStructure: PermissionCategory[] = [
  {
    title: 'User Management',
    permissions: [
      { id: 'users.create', label: 'Create new users' },
      { id: 'users.edit', label: 'Edit user profiles' },
      { id: 'users.delete', label: 'Delete users' },
      { id: 'users.roles', label: 'Change user roles' },
    ],
  },
  {
    title: 'Academics',
    permissions: [
      { id: 'academics.grades.view', label: 'View school-wide grades' },
      { id: 'academics.grades.edit', label: 'Edit all student grades' },
      { id: 'academics.timetable.edit', label: 'Manage school timetable' },
      { id: 'academics.subjects.manage', label: 'Manage classes and subjects' },
    ],
  },
  {
    title: 'Communication',
    permissions: [
      { id: 'comms.announcements.school', label: 'Send school-wide announcements' },
      { id: 'comms.messaging.all', label: 'View all messages' },
    ],
  },
   {
    title: 'Finance',
    permissions: [
      { id: 'finance.fees.manage', label: 'Manage fee structures and payments' },
      { id: 'finance.expenses.manage', label: 'Manage school expenses' },
    ],
  },
];

const rolePermissions: Record<string, string[]> = {
  Admin: permissionStructure.flatMap(cat => cat.permissions.map(p => p.id)),
  Teacher: [
      'academics.grades.view', // Can view grades for their own classes
  ],
  Student: [],
  Parent: [],
  Alumni: [],
};


export default function PermissionsPage() {
    
  const renderPermissions = (role: string) => {
    const isReadOnly = role === 'Admin';
    
    return permissionStructure.map((category, index) => (
      <div key={category.title}>
        <h4 className="font-semibold text-base mb-3">{category.title}</h4>
        <div className="space-y-3">
          {category.permissions.map(permission => (
            <div key={permission.id} className="flex items-center space-x-3">
              <Checkbox
                id={`${role}-${permission.id}`}
                checked={rolePermissions[role]?.includes(permission.id)}
                disabled={isReadOnly}
              />
              <Label htmlFor={`${role}-${permission.id}`} className="text-sm font-normal">
                {permission.label}
              </Label>
            </div>
          ))}
        </div>
        {index < permissionStructure.length - 1 && <Separator className="my-4"/>}
      </div>
    ));
  };


  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6 flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex-1">
          <h1 className="font-headline text-3xl font-bold flex items-center gap-2">
            <ShieldCheck className="h-8 w-8 text-primary" />
            Roles &amp; Permissions
          </h1>
          <p className="text-muted-foreground">Define what each user role can see and do within the portal.</p>
        </div>
        <Dialog>
            <DialogTrigger asChild>
                <Button disabled>
                    <PlusCircle className="mr-2"/>
                    Create New Role
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Create a New Role</DialogTitle>
                    <DialogDescription>Define a custom role and assign specific permissions.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="role-name">Role Name</Label>
                        <Input id="role-name" placeholder="e.g., Librarian, Accountant" />
                    </div>
                </div>
                 <DialogFooter>
                    <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                    <Button>Create Role</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {Object.keys(rolePermissions).map(role => (
          <Card key={role}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5 text-primary" />
                    {role}
                </CardTitle>
                {role !== 'Admin' && (
                     <Button variant="ghost" size="icon" disabled>
                        <Trash2 className="h-4 w-4" />
                    </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {renderPermissions(role)}
            </CardContent>
            {role !== 'Admin' && (
              <CardFooter>
                  <Button disabled>
                      <Save className="mr-2 h-4 w-4"/>
                      Save Permissions
                  </Button>
              </CardFooter>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}

