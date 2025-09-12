
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
import { ShieldCheck, User, Save, PlusCircle, Trash2, Users2, Search } from 'lucide-react';
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

type Role = {
    permissions: string[];
    userCount: number;
    isCore: boolean;
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

const initialRolePermissions: Record<string, Role> = {
  Admin: {
    permissions: initialPermissionStructure.flatMap(cat => cat.permissions.map(p => p.id)),
    userCount: 2,
    isCore: true,
  },
  Principal: {
    permissions: initialPermissionStructure.flatMap(cat => cat.permissions.map(p => p.id)).filter(p => !p.startsWith('users.')),
    userCount: 1,
    isCore: true,
  },
  Teacher: {
    permissions: ['academics.grades.view'],
    userCount: 45,
    isCore: true,
  },
  Student: {
    permissions: [],
    userCount: 852,
    isCore: true,
  },
  Parent: {
    permissions: [],
    userCount: 780,
    isCore: true,
  },
  Security: {
      permissions: [],
      userCount: 4,
      isCore: true,
  }
};


export default function PermissionsPage() {
  const [permissionStructure, setPermissionStructure] = React.useState(initialPermissionStructure);
  const [rolePermissions, setRolePermissions] = React.useState(initialRolePermissions);
  const [newRoleName, setNewRoleName] = React.useState('');
  const [searchTerm, setSearchTerm] = React.useState('');
  const { toast } = useToast();

  const handlePermissionChange = (role: string, permissionId: string, checked: boolean) => {
    setRolePermissions(prev => {
        const currentPermissions = prev[role]?.permissions || [];
        const updatedRole = {
            ...prev[role],
            permissions: checked
                ? [...currentPermissions, permissionId]
                : currentPermissions.filter(id => id !== permissionId)
        };
        return { ...prev, [role]: updatedRole };
    });
  };

  const handleSave = (role: string) => {
    toast({
        title: 'Permissions Saved',
        description: `Permissions for the ${role} role have been updated.`,
    });
  }
  
  const handleCreateRole = () => {
    const trimmedRoleName = newRoleName.trim();
    if (trimmedRoleName && !rolePermissions[trimmedRoleName]) {
        setRolePermissions(prev => ({
            ...prev,
            [trimmedRoleName]: { permissions: [], userCount: 0, isCore: false },
        }));
        setNewRoleName('');
        toast({
            title: 'Role Created',
            description: `The "${trimmedRoleName}" role has been added.`
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
                checked={rolePermissions[role]?.permissions.includes(permission.id)}
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

  const filteredRoles = Object.keys(rolePermissions).filter(role =>
    role.toLowerCase().includes(searchTerm.toLowerCase())
  );


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
        <div className="flex w-full md:w-auto items-center gap-2">
            <div className="relative w-full md:max-w-xs">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    type="search"
                    placeholder="Search roles..."
                    className="w-full bg-background pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <Dialog>
                <DialogTrigger asChild>
                    <Button>
                        <PlusCircle className="mr-2"/>
                        Create Role
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
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredRoles.map(role => {
          const roleData = rolePermissions[role];
          if (!roleData) return null;

          return (
            <Card key={role}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5 text-primary" />
                      {role}
                  </CardTitle>
                  {!roleData.isCore && (
                       <Button variant="ghost" size="icon" onClick={() => handleDeleteRole(role)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                  )}
                </div>
                 <CardDescription className="flex items-center gap-2 pt-1">
                    <Users2 className="h-4 w-4"/>
                    {roleData.userCount} users assigned
                </CardDescription>
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
          );
        })}
      </div>
       {filteredRoles.length === 0 && (
          <div className="text-center text-muted-foreground py-16">
            <p>No roles found matching your search.</p>
          </div>
       )}
    </div>
  );
}
