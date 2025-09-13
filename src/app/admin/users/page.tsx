
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
import { Users, PlusCircle, User, Search, ArrowRight, Edit, UserPlus, Trash2, Filter, FileDown, ChevronDown, CheckCircle, Clock, XCircle, KeyRound, AlertTriangle, Upload, Columns, Phone, History, FileText, GraduationCap } from 'lucide-react';
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';


type UserRole = 'Admin' | 'Teacher' | 'Student' | 'Parent';
type UserStatus = 'Active' | 'Pending' | 'Suspended' | 'Transferred' | 'Graduated';
type ParentRelationship = 'Father' | 'Mother' | 'Guardian';

type ParentLink = {
    id: string;
    name: string;
    relationship: ParentRelationship;
    contact: string;
}

type User = {
    id: string;
    name: string;
    email: string;
    avatarUrl: string;
    role: UserRole;
    status: UserStatus;
    lastLogin: string;
    createdAt: string;
    class?: string;
    parents?: ParentLink[];
};

const mockUsers: User[] = [
    { id: 'usr-1', name: 'Admin User', email: 'admin@school.ac.ke', avatarUrl: 'https://picsum.photos/seed/admin-avatar/100', role: 'Admin', status: 'Active', lastLogin: '2024-07-18T10:00:00Z', createdAt: '2024-01-15T09:00:00Z' },
    { id: 'usr-2', name: 'Ms. Wanjiku', email: 'wanjiku@school.ac.ke', avatarUrl: 'https://picsum.photos/seed/teacher-wanjiku/100', role: 'Teacher', status: 'Active', lastLogin: '2024-07-18T09:30:00Z', createdAt: '2024-01-20T11:00:00Z' },
    { id: 'usr-3', name: 'Mr. Otieno', email: 'otieno@school.ac.ke', avatarUrl: 'https://picsum.photos/seed/teacher-otieno/100', role: 'Teacher', status: 'Active', lastLogin: '2024-07-17T14:00:00Z', createdAt: '2024-01-20T11:05:00Z' },
    { id: 'usr-4', name: 'Student 1', email: 'student1@school.ac.ke', avatarUrl: 'https://picsum.photos/seed/f4-student1/100', role: 'Student', status: 'Active', lastLogin: '2024-07-16T11:20:00Z', createdAt: '2024-02-01T10:00:00Z', class: 'Form 4', parents: [{ id: 'usr-5', name: 'Joseph Kariuki', relationship: 'Father', contact: '0722123456' }] },
    { id: 'usr-5', name: 'Joseph Kariuki', email: 'parent1@example.com', avatarUrl: 'https://picsum.photos/seed/parent1/100', role: 'Parent', status: 'Pending', lastLogin: 'Never', createdAt: '2024-02-01T10:01:00Z' },
    { id: 'usr-6', name: 'Student 32', email: 'student32@school.ac.ke', avatarUrl: 'https://picsum.photos/seed/f3-student1/100', role: 'Student', status: 'Suspended', lastLogin: '2024-06-10T08:00:00Z', createdAt: '2024-02-05T14:00:00Z', class: 'Form 3' },
    { id: 'usr-7', name: 'Alumni Student', email: 'alumni.student@school.ac.ke', avatarUrl: 'https://picsum.photos/seed/alumni1/100', role: 'Student', status: 'Graduated', lastLogin: '2023-11-20T08:00:00Z', createdAt: '2020-02-01T10:00:00Z', class: 'Alumni' },
    { id: 'usr-8', name: 'Transferred Student', email: 'transfer.student@school.ac.ke', avatarUrl: 'https://picsum.photos/seed/transfer1/100', role: 'Student', status: 'Transferred', lastLogin: '2024-05-10T08:00:00Z', createdAt: '2022-02-01T10:00:00Z', class: 'Form 2' },
];

const statuses: (UserStatus | 'All Statuses')[] = ['All Statuses', 'Active', 'Pending', 'Suspended', 'Transferred', 'Graduated'];
const roles: UserRole[] = ['Admin', 'Teacher', 'Student', 'Parent'];
const classes = ['All Classes', 'Form 4', 'Form 3', 'Form 2', 'Form 1', 'Alumni'];
const relationships: ParentRelationship[] = ['Father', 'Mother', 'Guardian'];
const years = Array.from({ length: 10 }, (_, i) => (new Date().getFullYear() - i).toString());

const getStatusBadge = (status: UserStatus) => {
    switch (status) {
        case 'Active': return <Badge variant="default" className="bg-green-600 hover:bg-green-700 text-white"><CheckCircle className="mr-1 h-3 w-3"/>Active</Badge>;
        case 'Pending': return <Badge variant="secondary" className="bg-yellow-500 text-white hover:bg-yellow-600"><Clock className="mr-1 h-3 w-3"/>Pending</Badge>;
        case 'Suspended': return <Badge variant="destructive"><XCircle className="mr-1 h-3 w-3"/>Suspended</Badge>;
        case 'Transferred': return <Badge variant="outline"><ArrowRight className="mr-1 h-3 w-3"/>Transferred</Badge>;
        case 'Graduated': return <Badge variant="outline" className="border-purple-500 text-purple-500"><GraduationCap className="mr-1 h-3 w-3"/>Graduated</Badge>;
    }
}

export default function UserManagementPage() {
    const [searchTerm, setSearchTerm] = React.useState('');
    const [statusFilter, setStatusFilter] = React.useState<UserStatus | 'All Statuses'>('All Statuses');
    const [classFilter, setClassFilter] = React.useState('All Classes');
    const [yearFilter, setYearFilter] = React.useState('All Years');
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
            const matchesClass = classFilter === 'All Classes' || user.class === classFilter;
            const matchesYear = yearFilter === 'All Years' || new Date(user.createdAt).getFullYear().toString() === yearFilter;

            return matchesSearch && matchesRole && matchesStatus && (roleFilter !== 'Student' || (matchesClass && matchesYear));
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
                                        <TableCell>
                                            {getStatusBadge(user.status)}
                                        </TableCell>
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
                                                    <div className="grid gap-6 py-4 max-h-[70vh] overflow-y-auto pr-4">
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
                                                            <>
                                                            <div className="grid grid-cols-2 gap-4">
                                                                <div className="space-y-2">
                                                                    <Label htmlFor="class">Class</Label>
                                                                    <Select defaultValue={user.class}>
                                                                        <SelectTrigger id="class">
                                                                            <SelectValue />
                                                                        </SelectTrigger>
                                                                        <SelectContent>
                                                                            {classes.filter(c => c !== 'All Classes').map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                                                        </SelectContent>
                                                                    </Select>
                                                                </div>
                                                                 <div className="space-y-2">
                                                                    <Label htmlFor="admission-year">Year of Admission</Label>
                                                                    <Select defaultValue={new Date(user.createdAt).getFullYear().toString()}>
                                                                        <SelectTrigger id="admission-year">
                                                                            <SelectValue />
                                                                        </SelectTrigger>
                                                                        <SelectContent>
                                                                            {years.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                                                                        </SelectContent>
                                                                    </Select>
                                                                </div>
                                                            </div>
                                                            <Separator />
                                                            <div className="space-y-4">
                                                                <h4 className="font-semibold text-base">Linked Parents/Guardians</h4>
                                                                <div className="space-y-3">
                                                                    {user.parents?.map(parent => (
                                                                        <div key={parent.id} className="flex items-center justify-between p-3 rounded-md border bg-muted/50">
                                                                            <div className="space-y-1">
                                                                                <div className="font-medium flex items-center">{parent.name} <Badge variant="secondary" className="ml-2">{parent.relationship}</Badge></div>
                                                                                <div className="text-sm text-muted-foreground flex items-center gap-2"><Phone className="h-3 w-3"/>{parent.contact}</div>
                                                                            </div>
                                                                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                                                                                <Trash2 className="h-4 w-4"/>
                                                                            </Button>
                                                                        </div>
                                                                    ))}
                                                                    <Card>
                                                                        <CardHeader>
                                                                            <CardTitle className="text-base">Link New Parent/Guardian</CardTitle>
                                                                        </CardHeader>
                                                                        <CardContent className="space-y-4">
                                                                            <div className="space-y-2">
                                                                                <Label>Parent/Guardian Name</Label>
                                                                                <Input placeholder="e.g., Mary Wambui" />
                                                                            </div>
                                                                             <div className="grid grid-cols-2 gap-4">
                                                                                 <div className="space-y-2">
                                                                                    <Label>Relationship</Label>
                                                                                    <Select>
                                                                                        <SelectTrigger><SelectValue placeholder="Select..."/></SelectTrigger>
                                                                                        <SelectContent>
                                                                                            {relationships.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                                                                                        </SelectContent>
                                                                                    </Select>
                                                                                </div>
                                                                                <div className="space-y-2">
                                                                                    <Label>Contact Number</Label>
                                                                                    <Input type="tel" placeholder="e.g., 0712345678" />
                                                                                </div>
                                                                            </div>
                                                                             <Button variant="secondary" size="sm">
                                                                                <PlusCircle className="mr-2 h-4 w-4"/>
                                                                                Add Parent
                                                                            </Button>
                                                                        </CardContent>
                                                                    </Card>
                                                                </div>
                                                            </div>
                                                            </>
                                                        )}
                                                        <Separator />
                                                        <div className="space-y-4">
                                                            <h4 className="font-semibold text-base flex items-center gap-2"><History className="h-4 w-4" />User History</h4>
                                                             <div className="text-sm text-muted-foreground space-y-2">
                                                                <div><strong>Account Created:</strong> {clientReady ? new Date(user.createdAt).toLocaleString() : ''}</div>
                                                                <div><strong>Last Login:</strong> {clientReady && user.lastLogin !== 'Never' ? new Date(user.lastLogin).toLocaleString() : 'Never'}</div>
                                                                 <div><strong>Last Profile Update:</strong> {clientReady ? new Date(user.lastLogin).toLocaleDateString() : ''} by Admin</div>
                                                            </div>
                                                        </div>
                                                        <Separator />
                                                        <div className="space-y-4">
                                                            <h4 className="font-semibold text-base">Administrative Actions</h4>
                                                            <div className="flex flex-col gap-4 sm:flex-row sm:justify-between">
                                                                <Button variant="outline" disabled>
                                                                    <KeyRound className="mr-2 h-4 w-4" />
                                                                    Send Password Reset
                                                                </Button>
                                                                <Button variant="destructive">
                                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                                    Delete User
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <DialogFooter>
                                                        <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
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
                        Showing <strong>{filteredUsers.length}</strong> of <strong>{mockUsers.filter(u => roleFilter === 'All' || u.role === roleFilter).length}</strong> users.
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
                                                <Switch id="send-invite" defaultChecked />
                                                <Label htmlFor="send-invite">Send invitation link with auto-generated password</Label>
                                            </div>
                                            <p className="text-xs text-muted-foreground">The user will be prompted to set a new password on their first login.</p>
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
                                        Bulk Actions
                                        <ChevronDown className="ml-2 h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                    <DropdownMenuItem>
                                        <FileDown className="mr-2 h-4 w-4" />
                                        Export All Users (CSV)
                                    </DropdownMenuItem>
                                    <DropdownMenuItem disabled>
                                        <FileDown className="mr-2 h-4 w-4" />
                                        Export Student List by Class (PDF)
                                    </DropdownMenuItem>
                                    <DropdownMenuItem disabled>
                                        <FileDown className="mr-2 h-4 w-4" />
                                        Export Teacher List (PDF)
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem disabled>
                                        <FileText className="mr-2 h-4 w-4" />
                                        Print Student ID Cards (PDF)
                                    </DropdownMenuItem>
                                     <DropdownMenuItem disabled>
                                        <FileText className="mr-2 h-4 w-4" />
                                        Print Teacher ID Cards (PDF)
                                    </DropdownMenuItem>
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
                         <div className="flex w-full flex-col gap-2 md:w-auto md:flex-row md:flex-wrap">
                             <Select value={statusFilter} onValueChange={(v: UserStatus | 'All Statuses') => setStatusFilter(v)}>
                                <SelectTrigger className="w-full md:w-[150px]">
                                    <SelectValue placeholder="Filter by status" />
                                </SelectTrigger>
                                <SelectContent>
                                    {statuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                </SelectContent>
                             </Select>
                              <Select value={classFilter} onValueChange={setClassFilter}>
                                <SelectTrigger className="w-full md:w-[150px]">
                                    <SelectValue placeholder="Filter by class" />
                                </SelectTrigger>
                                <SelectContent>
                                    {classes.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                </SelectContent>
                             </Select>
                             <Select value={yearFilter} onValueChange={setYearFilter}>
                                <SelectTrigger className="w-full md:w-[150px]">
                                    <SelectValue placeholder="Filter by year" />
                                </SelectTrigger>
                                <SelectContent>
                                     <SelectItem value="All Years">All Years</SelectItem>
                                    {years.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
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
