
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
  } from '@/components/ui/select';
import { Users, PlusCircle, User, Search, ArrowRight, Edit, UserPlus, Trash2, Filter, FileDown, ChevronDown, CheckCircle, Clock, XCircle, KeyRound, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';


type UserRole = 'Admin' | 'Teacher' | 'Student' | 'Parent';
type UserStatus = 'Active' | 'Pending' | 'Suspended';

type User = {
    id: string;
    name: string;
    email: string;
    avatarUrl: string;
    role: UserRole;
    status: UserStatus;
    lastLogin: string;
    class?: string;
};

const mockUsers: User[] = [
    { id: 'usr-1', name: 'Admin User', email: 'admin@school.ac.ke', avatarUrl: 'https://picsum.photos/seed/admin-avatar/100', role: 'Admin', status: 'Active', lastLogin: '2024-07-18T10:00:00Z' },
    { id: 'usr-2', name: 'Ms. Wanjiku', email: 'wanjiku@school.ac.ke', avatarUrl: 'https://picsum.photos/seed/teacher-wanjiku/100', role: 'Teacher', status: 'Active', lastLogin: '2024-07-18T09:30:00Z' },
    { id: 'usr-3', name: 'Mr. Otieno', email: 'otieno@school.ac.ke', avatarUrl: 'https://picsum.photos/seed/teacher-otieno/100', role: 'Teacher', status: 'Active', lastLogin: '2024-07-17T14:00:00Z' },
    { id: 'usr-4', name: 'Student 1', email: 'student1@school.ac.ke', avatarUrl: 'https://picsum.photos/seed/f4-student1/100', role: 'Student', status: 'Active', lastLogin: '2024-07-16T11:20:00Z', class: 'Form 4' },
    { id: 'usr-5', name: 'Joseph Kariuki', email: 'parent1@example.com', avatarUrl: 'https://picsum.photos/seed/parent1/100', role: 'Parent', status: 'Pending', lastLogin: 'Never', class: 'Form 4' },
    { id: 'usr-6', name: 'Student 32', email: 'student32@school.ac.ke', avatarUrl: 'https://picsum.photos/seed/f3-student1/100', role: 'Student', status: 'Suspended', lastLogin: '2024-06-10T08:00:00Z', class: 'Form 3' },
];

const statuses: (UserStatus | 'All Statuses')[] = ['All Statuses', 'Active', 'Pending', 'Suspended'];
const roles: UserRole[] = ['Admin', 'Teacher', 'Student', 'Parent'];
const classes = ['Form 4', 'Form 3', 'Form 2', 'Form 1'];

const getStatusBadge = (status: UserStatus) => {
    switch (status) {
        case 'Active': return <Badge variant="default" className="bg-green-600 hover:bg-green-700 text-white"><CheckCircle className="mr-1 h-3 w-3"/>Active</Badge>;
        case 'Pending': return <Badge variant="secondary" className="bg-yellow-500 text-white hover:bg-yellow-600"><Clock className="mr-1 h-3 w-3"/>Pending</Badge>;
        case 'Suspended': return <Badge variant="destructive"><XCircle className="mr-1 h-3 w-3"/>Suspended</Badge>;
    }
}

export default function UserManagementPage() {
    const [searchTerm, setSearchTerm] = React.useState('');
    const [statusFilter, setStatusFilter] = React.useState<UserStatus | 'All Statuses'>('All Statuses');
    const [clientReady, setClientReady] = React.useState(false);
    
    React.useEffect(() => {
        setClientReady(true);
    }, []);

    const renderUserTable = (roleFilter: UserRole | 'All') => {
        const filteredUsers = mockUsers.filter(user => {
            const searchLower = searchTerm.toLowerCase();
            const matchesSearch = user.name.toLowerCase().includes(searchLower) ||
                                  user.email.toLowerCase().includes(searchLower) ||
                                  user.id.toLowerCase().includes(searchLower);

            const matchesRole = roleFilter === 'All' || user.role === roleFilter;
            const matchesStatus = statusFilter === 'All Statuses' || user.status === statusFilter;

            return matchesSearch && matchesRole && matchesStatus;
        });

        return (
            <>
                <div className="w-full overflow-auto rounded-lg border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>User</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Last Login</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredUsers.length > 0 ? (
                                filteredUsers.map((user) => (
                                    <TableRow key={user.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-9 w-9">
                                                    <AvatarImage src={user.avatarUrl} alt={user.name} />
                                                    <AvatarFallback>{user.name.slice(0,2)}</AvatarFallback>
                                                </Avatar>
                                                <span className="font-medium">{user.name}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>{user.email}</TableCell>
                                        <TableCell><Badge variant="outline">{user.role}</Badge></TableCell>
                                        <TableCell>{getStatusBadge(user.status)}</TableCell>
                                        <TableCell>
                                            {clientReady && user.lastLogin !== 'Never' ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Dialog>
                                                <DialogTrigger asChild>
                                                    <Button variant="ghost" size="sm">
                                                        <Edit className="mr-2 h-4 w-4" /> Edit
                                                    </Button>
                                                </DialogTrigger>
                                                <DialogContent className="sm:max-w-xl">
                                                    <DialogHeader>
                                                        <DialogTitle>Edit User: {user.name}</DialogTitle>
                                                        <DialogDescription>Update user details, role, and status.</DialogDescription>
                                                    </DialogHeader>
                                                    <div className="grid gap-6 py-4">
                                                         <div className="grid grid-cols-2 gap-4">
                                                            <div className="space-y-2">
                                                                <Label htmlFor="name">Full Name</Label>
                                                                <Input id="name" defaultValue={user.name} />
                                                            </div>
                                                            <div className="space-y-2">
                                                                <Label htmlFor="email">Email</Label>
                                                                <Input id="email" type="email" defaultValue={user.email} />
                                                            </div>
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-4">
                                                             <div className="space-y-2">
                                                                <Label htmlFor="role">Role</Label>
                                                                <Select defaultValue={user.role}>
                                                                    <SelectTrigger id="role">
                                                                        <SelectValue />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        {roles.map(role => <SelectItem key={role} value={role}>{role}</SelectItem>)}
                                                                    </SelectContent>
                                                                </Select>
                                                            </div>
                                                            <div className="space-y-2">
                                                                <Label htmlFor="status">Account Status</Label>
                                                                <Select defaultValue={user.status}>
                                                                    <SelectTrigger id="status">
                                                                        <SelectValue />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        {statuses.filter(s => s !== 'All Statuses').map(status => <SelectItem key={status} value={status}>{status}</SelectItem>)}
                                                                    </SelectContent>
                                                                </Select>
                                                            </div>
                                                        </div>
                                                        {user.role === 'Student' && (
                                                            <div className="space-y-2">
                                                                <Label htmlFor="class">Class</Label>
                                                                <Select defaultValue={user.class}>
                                                                    <SelectTrigger id="class">
                                                                        <SelectValue />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        {classes.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                                                    </SelectContent>
                                                                </Select>
                                                            </div>
                                                        )}
                                                        <Separator />
                                                        <div className="space-y-4">
                                                            <h4 className="font-semibold text-base">Administrative Actions</h4>
                                                            <div className="flex flex-col gap-4 sm:flex-row sm:justify-between">
                                                                <Button variant="outline" disabled>
                                                                    <KeyRound className="mr-2 h-4 w-4" />
                                                                    Send Password Reset
                                                                </Button>
                                                                <Button variant="destructive" disabled>
                                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                                    Delete User
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <DialogFooter>
                                                        <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                                                        <Button>Save Changes</Button>
                                                    </DialogFooter>
                                                </DialogContent>
                                            </Dialog>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center">
                                        No users found for the selected filters.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
                 <CardFooter className="px-0 pt-6">
                    <div className="text-xs text-muted-foreground">
                        Showing <strong>{filteredUsers.length}</strong> of <strong>{mockUsers.length}</strong> total users.
                    </div>
                </CardFooter>
            </>
        );
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <div className="mb-6">
                <h1 className="font-headline text-3xl font-bold flex items-center gap-2">
                <Users className="h-8 w-8 text-primary" />
                User Management
                </h1>
                <p className="text-muted-foreground">Manage all users within the school portal.</p>
            </div>
             <Card>
                <CardHeader>
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                            <CardTitle>User Directory</CardTitle>
                            <CardDescription>A list of all users in the system, organized by role.</CardDescription>
                        </div>
                        <div className="flex w-full flex-col gap-2 md:w-auto md:flex-row">
                             <Dialog>
                                <DialogTrigger asChild>
                                    <Button>
                                        <PlusCircle className="mr-2 h-4 w-4"/>
                                        Create User
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-xl">
                                    <DialogHeader>
                                        <DialogTitle>Create New User</DialogTitle>
                                        <DialogDescription>
                                            Fill in the details below to create a new user account.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="grid gap-6 py-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="role-create">User Role</Label>
                                            <Select>
                                                <SelectTrigger id="role-create">
                                                    <SelectValue placeholder="Select a role" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {roles.map(role => <SelectItem key={role} value={role}>{role}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                         <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="name-create">Full Name</Label>
                                                <Input id="name-create" placeholder="e.g., John Doe" />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="email-create">Email Address</Label>
                                                <Input id="email-create" type="email" placeholder="user@example.com" />
                                            </div>
                                        </div>
                                        <Separator />
                                        <div className="space-y-2">
                                            <div className="flex items-center space-x-2">
                                                <Switch id="send-invite" defaultChecked disabled />
                                                <Label htmlFor="send-invite">Send invitation link with auto-generated password</Label>
                                            </div>
                                            <p className="text-xs text-muted-foreground">The user will be prompted to set a new password on their first login. This feature is coming soon.</p>
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                                        <Button>Create & Send Invite</Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline">
                                        <FileDown className="mr-2 h-4 w-4"/>
                                        Export
                                        <ChevronDown className="ml-2 h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                    <DropdownMenuItem disabled>Export as PDF</DropdownMenuItem>
                                    <DropdownMenuItem disabled>Export as CSV</DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                     <div className="mt-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div className="relative w-full md:max-w-sm">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                            type="search"
                            placeholder="Search by name, email, or ID..."
                            className="w-full bg-background pl-8"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                         <div className="flex w-full flex-col gap-2 md:w-auto md:flex-row md:items-center">
                             <Select value={statusFilter} onValueChange={(v: UserStatus | 'All Statuses') => setStatusFilter(v)}>
                                <SelectTrigger className="w-full md:w-[180px]">
                                    <SelectValue placeholder="Filter by status" />
                                </SelectTrigger>
                                <SelectContent>
                                    {statuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                </SelectContent>
                             </Select>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                   <Tabs defaultValue="all" className="w-full">
                        <TabsList className="grid w-full grid-cols-5">
                            <TabsTrigger value="all">All Users</TabsTrigger>
                            <TabsTrigger value="Student">Students</TabsTrigger>
                            <TabsTrigger value="Teacher">Teachers</TabsTrigger>
                            <TabsTrigger value="Parent">Parents</TabsTrigger>
                            <TabsTrigger value="Admin">Admins</TabsTrigger>
                        </TabsList>
                        <TabsContent value="all" className="mt-4">
                            {renderUserTable('All')}
                        </TabsContent>
                        <TabsContent value="Student" className="mt-4">
                            {renderUserTable('Student')}
                        </TabsContent>
                        <TabsContent value="Teacher" className="mt-4">
                            {renderUserTable('Teacher')}
                        </TabsContent>
                        <TabsContent value="Parent" className="mt-4">
                            {renderUserTable('Parent')}
                        </TabsContent>
                         <TabsContent value="Admin" className="mt-4">
                            {renderUserTable('Admin')}
                        </TabsContent>
                   </Tabs>
                </CardContent>
             </Card>
        </div>
    );
}
