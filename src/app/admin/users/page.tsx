
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
import { Users, PlusCircle, User, Search, ArrowRight, Edit, UserPlus, Trash2, Filter, FileDown, ChevronDown, CheckCircle, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

type UserRole = 'Admin' | 'Teacher' | 'Student' | 'Parent';
type UserStatus = 'Active' | 'Pending' | 'Inactive';

type User = {
    id: string;
    name: string;
    email: string;
    avatarUrl: string;
    role: UserRole;
    status: UserStatus;
    lastLogin: string;
};

const mockUsers: User[] = [
    { id: 'usr-1', name: 'Admin User', email: 'admin@school.ac.ke', avatarUrl: 'https://picsum.photos/seed/admin-avatar/100', role: 'Admin', status: 'Active', lastLogin: '2024-07-18T10:00:00Z' },
    { id: 'usr-2', name: 'Ms. Wanjiku', email: 'wanjiku@school.ac.ke', avatarUrl: 'https://picsum.photos/seed/teacher-wanjiku/100', role: 'Teacher', status: 'Active', lastLogin: '2024-07-18T09:30:00Z' },
    { id: 'usr-3', name: 'Mr. Otieno', email: 'otieno@school.ac.ke', avatarUrl: 'https://picsum.photos/seed/teacher-otieno/100', role: 'Teacher', status: 'Active', lastLogin: '2024-07-17T14:00:00Z' },
    { id: 'usr-4', name: 'Student 1', email: 'student1@school.ac.ke', avatarUrl: 'https://picsum.photos/seed/f4-student1/100', role: 'Student', status: 'Active', lastLogin: '2024-07-16T11:20:00Z' },
    { id: 'usr-5', name: 'Joseph Kariuki', email: 'parent1@example.com', avatarUrl: 'https://picsum.photos/seed/parent1/100', role: 'Parent', status: 'Pending', lastLogin: 'Never' },
    { id: 'usr-6', name: 'Student 32', email: 'student32@school.ac.ke', avatarUrl: 'https://picsum.photos/seed/f3-student1/100', role: 'Student', status: 'Inactive', lastLogin: '2024-06-10T08:00:00Z' },
];

const roles: (UserRole | 'All Roles')[] = ['All Roles', 'Admin', 'Teacher', 'Student', 'Parent'];
const statuses: (UserStatus | 'All Statuses')[] = ['All Statuses', 'Active', 'Pending', 'Inactive'];

const getStatusBadge = (status: UserStatus) => {
    switch (status) {
        case 'Active': return <Badge variant="default" className="bg-green-600 hover:bg-green-700 text-white"><CheckCircle className="mr-1 h-3 w-3"/>Active</Badge>;
        case 'Pending': return <Badge variant="secondary" className="bg-yellow-500 text-white hover:bg-yellow-600"><Clock className="mr-1 h-3 w-3"/>Pending</Badge>;
        case 'Inactive': return <Badge variant="destructive" className="bg-gray-500 text-white hover:bg-gray-600">Inactive</Badge>;
    }
}


export default function UserManagementPage() {
    const [searchTerm, setSearchTerm] = React.useState('');
    const [roleFilter, setRoleFilter] = React.useState<UserRole | 'All Roles'>('All Roles');
    const [statusFilter, setStatusFilter] = React.useState<UserStatus | 'All Statuses'>('All Statuses');
    const [clientReady, setClientReady] = React.useState(false);

    React.useEffect(() => {
        setClientReady(true);
    }, []);

    const filteredUsers = mockUsers.filter(user => 
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
        (roleFilter === 'All Roles' || user.role === roleFilter) &&
        (statusFilter === 'All Statuses' || user.status === statusFilter)
    );

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
                            <CardTitle>All Users</CardTitle>
                            <CardDescription>A list of all users in the system.</CardDescription>
                        </div>
                        <div className="flex w-full flex-col gap-2 md:w-auto md:flex-row">
                            <Button disabled>
                                <PlusCircle className="mr-2 h-4 w-4"/>
                                Create User
                            </Button>
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
                            placeholder="Search by name..."
                            className="w-full bg-background pl-8"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                         <div className="flex w-full flex-col gap-2 md:w-auto md:flex-row md:items-center">
                             <Select value={roleFilter} onValueChange={(v: UserRole | 'All Roles') => setRoleFilter(v)}>
                                <SelectTrigger className="w-full md:w-[180px]">
                                    <SelectValue placeholder="Filter by role" />
                                </SelectTrigger>
                                <SelectContent>
                                    {roles.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                                </SelectContent>
                             </Select>
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
                                                <Button variant="ghost" size="sm" disabled>
                                                    <Edit className="mr-2 h-4 w-4" /> Edit
                                                </Button>
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
                </CardContent>
                <CardFooter>
                    <div className="text-xs text-muted-foreground">
                        Showing <strong>{filteredUsers.length}</strong> of <strong>{mockUsers.length}</strong> total users.
                    </div>
                </CardFooter>
             </Card>
        </div>
    );
}

