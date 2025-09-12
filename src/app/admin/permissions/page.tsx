
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
import { useToast } from '@/hooks/use-toast';

type Permission = {
  id: string;
  label: string;
};

type PermissionCategory = {
  title: string;
  permissions: Permission[];
};

const initialPermissionStructure: PermissionCategory[] = [
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
   {
    title: 'System',
    permissions: [
      { id: 'admin.logs', label: 'View Audit Logs' },
    ],
  },
];

const initialRolePermissions: Record<string, string[]> = {
  Admin: initialPermissionStructure.flatMap(cat => cat.permissions.map(p => p.id)),
  Teacher: [
      'academics.grades.view',
  ],
  Student: [],
  Parent: [],
  Alumni: [],
};


export default function PermissionsPage() {
  const [permissionStructure, setPermissionStructure] = React.useState(initialPermissionStructure);
  const [rolePermissions, setRolePermissions] = React.useState(initialRolePermissions);
  const [newRoleName, setNewRoleName] = React.useState('');
  const { toast } = useToast();

  const handlePermissionChange = (role: string, permissionId: string, checked: boolean) => {
    setRolePermissions(prev => {
        const currentPermissions = prev[role] || [];
        if (checked) {
            return { ...prev, [role]: [...currentPermissions, permissionId] };
        } else {
            return { ...prev, [role]: currentPermissions.filter(id => id !== permissionId) };
        }
    });
  };

  const handleSave = (role: string) => {
    toast({
        title: 'Permissions Saved',
        description: `Permissions for the ${role} role have been updated.`,
    });
  }
  
  const handleCreateRole = () => {
    if (newRoleName.trim() && !rolePermissions[newRoleName.trim()]) {
        setRolePermissions(prev => ({
            ...prev,
            [newRoleName.trim()]: [],
        }));
        setNewRoleName('');
        toast({
            title: 'Role Created',
            description: `The "${newRoleName.trim()}" role has been added.`
        });
    }
  };

  const handleDeleteRole = (roleToDelete: string) => {
      setRolePermissions(prev => {
          const newRoles = { ...prev };
          delete newRoles[roleToDelete];
          return newRoles;
      });
       toast({
            title: 'Role Deleted',
            description: `The "${roleToDelete}" role has been removed.`
        });
  }
    
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
                onCheckedChange={(checked) => handlePermissionChange(role, permission.id, !!checked)}
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
                <Button>
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
                        <Input id="role-name" placeholder="e.g., Librarian, Accountant" value={newRoleName} onChange={(e) => setNewRoleName(e.target.value)} />
                    </div>
                </div>
                 <DialogFooter>
                    <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                    <DialogClose asChild>
                      <Button onClick={handleCreateRole}>Create Role</Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Object.keys(rolePermissions).map(role => (
          <Card key={role}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5 text-primary" />
                    {role}
                </CardTitle>
                {role !== 'Admin' && role !== 'Teacher' && role !== 'Student' && role !== 'Parent' && (
                     <Button variant="ghost" size="icon" onClick={() => handleDeleteRole(role)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {renderPermissions(role)}
            </CardContent>
            {role !== 'Admin' && (
              <CardFooter>
                  <Button onClick={() => handleSave(role)}>
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
