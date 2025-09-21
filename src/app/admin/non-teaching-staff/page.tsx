
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
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Users, PlusCircle, User, Search, ArrowRight, Edit, UserPlus, Trash2, Filter, FileDown, ChevronDown, CheckCircle, Clock, XCircle, KeyRound, AlertTriangle, Upload, Columns, Phone, History, FileText, GraduationCap, Loader2, Contact2 } from 'lucide-react';
import { firestore } from '@/lib/firebase';
import { collection, onSnapshot, query, doc, updateDoc, Timestamp, getDocs } from 'firebase/firestore';
import { useSearchParams } from 'next/navigation';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/auth-context';
import { logAuditEvent } from '@/lib/audit-log.service';
import { deleteUserAction, updateUserAuthAction, createUserAction } from '../users/actions';
import { Separator } from '@/components/ui/separator';

type UserRole = 'Cook' | 'Watchman' | 'Cleaner' | 'Farm Worker' | 'Board Member' | 'PTA Member' | 'Matron' | 'Patron' | string;
type UserStatus = 'Active' | 'On Leave' | 'Suspended' | 'Terminated';

type User = {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    status: UserStatus;
    lastLogin: Timestamp | 'Never' | null;
    createdAt: Timestamp;
};

const statuses: (UserStatus | 'All Statuses')[] = ['All Statuses', 'Active', 'On Leave', 'Suspended', 'Terminated'];
const roles: UserRole[] = ['Cook', 'Watchman', 'Cleaner', 'Farm Worker', 'Board Member', 'PTA Member', 'Matron', 'Patron'];

const getStatusBadge = (status: UserStatus) => {
    switch (status) {
        case 'Active': return <Badge variant="default" className="bg-green-600 hover:bg-green-700"><CheckCircle className="mr-1 h-3 w-3"/>Active</Badge>;
        case 'On Leave': return <Badge variant="secondary" className="bg-yellow-500 text-white hover:bg-yellow-600"><Clock className="mr-1 h-3 w-3"/>On Leave</Badge>;
        case 'Suspended': return <Badge variant="destructive" className="bg-orange-600 hover:bg-orange-700"><AlertTriangle className="mr-1 h-3 w-3"/>Suspended</Badge>;
        case 'Terminated': return <Badge variant="destructive"><XCircle className="mr-1 h-3 w-3"/>Terminated</Badge>;
        default: return <Badge variant="outline">{status}</Badge>;
    }
}

export default function NonTeachingStaffPage() {
    const searchParams = useSearchParams();
    const schoolId = searchParams.get('schoolId');
    const { user: adminUser } = useAuth();
    const [staff, setStaff] = React.useState<User[]>([]);
    
    const [searchTerm, setSearchTerm] = React.useState('');
    const [statusFilter, setStatusFilter] = React.useState<UserStatus | 'All Statuses'>('All Statuses');
    const [roleFilter, setRoleFilter] = React.useState<UserRole | 'All Staff'>('All Staff');
    const { toast } = useToast();
    const [userToDelete, setUserToDelete] = React.useState<{ id: string, name: string, role: string } | null>(null);
    const [editingUser, setEditingUser] = React.useState<User | null>(null);
    const [isSaving, setIsSaving] = React.useState(false);
    const [isLoading, setIsLoading] = React.useState(true);
    
    // State for the create user dialog
    const [newUserRole, setNewUserRole] = React.useState<string>('');
    const [newUserName, setNewUserName] = React.useState('');
    const [newUserEmail, setNewUserEmail] = React.useState('');
    const [newUserPassword, setNewUserPassword] = React.useState('');

    React.useEffect(() => {
        if (!schoolId) {
            setIsLoading(false);
            return;
        }
        setIsLoading(true);

        const q = query(collection(firestore, `schools/${schoolId}/non_teaching_staff`));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const usersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
            setStaff(usersData);
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [schoolId]);
    
    const handleCreateUser = async () => {
        if (!schoolId || !newUserRole || !newUserEmail || !newUserPassword || !newUserName || !adminUser) {
            toast({ title: 'Missing Information or Not Authenticated', variant: 'destructive' });
            return;
        }

        setIsSaving(true);
        try {
            const result = await createUserAction({
                schoolId,
                email: newUserEmail,
                password: newUserPassword,
                name: newUserName,
                role: newUserRole,
                actor: {
                    id: adminUser.uid,
                    name: adminUser.displayName || 'Admin'
                },
            });

            if (result.success) {
                toast({
                    title: 'User Created',
                    description: 'A new user account has been created successfully.',
                });
                setNewUserName('');
                setNewUserEmail('');
                setNewUserPassword('');
                setNewUserRole('');
            } else {
                throw new Error(result.message);
            }
        } catch(e: any) {
            toast({ title: 'Error', description: e.message || 'Could not create user.', variant: 'destructive'});
        } finally {
            setIsSaving(false);
        }
    };
    
    const handleSaveChanges = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingUser || !schoolId) return;

        const formData = new FormData(e.target as HTMLFormElement);
        const updatedData: Partial<User> = {
            name: formData.get('name') as string,
            email: formData.get('email') as string,
            role: formData.get('role') as string,
            status: formData.get('status') as UserStatus,
        };

        setIsSaving(true);
        let authUpdates: { email?: string } = {};
        if (updatedData.email && updatedData.email !== editingUser.email) {
            authUpdates.email = updatedData.email;
        }

        try {
            if (Object.keys(authUpdates).length > 0) {
                const authResult = await updateUserAuthAction(editingUser.id, authUpdates);
                if (!authResult.success) throw new Error(authResult.message);
            }

            const userRef = doc(firestore, 'schools', schoolId, 'non_teaching_staff', editingUser.id);
            await updateDoc(userRef, updatedData);

            toast({ title: 'User Updated', description: 'The user details have been saved successfully.' });
            setEditingUser(null);
        } catch (e: any) {
            toast({ title: 'Error', description: e.message || 'Could not update user.', variant: 'destructive'});
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteUser = async () => {
      if (!userToDelete || !schoolId || !adminUser) return;
      try {
        const result = await deleteUserAction(userToDelete.id, schoolId, userToDelete.role);
        if (!result.success) throw new Error(result.message);

        await logAuditEvent({
          schoolId,
          action: 'USER_DELETED',
          actionType: 'Security',
          description: `User account for ${userToDelete.name} permanently deleted.`,
          user: { id: adminUser.uid, name: adminUser.displayName || 'Admin', role: 'Admin' },
          details: `Deleted User ID: ${userToDelete.id}, Role: ${userToDelete.role}`,
        });
    
        toast({ title: 'User Deleted', variant: 'destructive' });
      } catch (e: any) {
        toast({ title: 'Deletion Failed', description: e.message, variant: 'destructive' });
      } finally {
          setUserToDelete(null);
      }
    };
    
    const uniqueRoles = ['All Staff', ...Array.from(new Set(staff.map(s => s.role)))];

    const filteredStaff = staff.filter(user => {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch = user.name?.toLowerCase().includes(searchLower) || user.email?.toLowerCase().includes(searchLower);
        const matchesStatus = statusFilter === 'All Statuses' || user.status === statusFilter;
        const matchesRole = roleFilter === 'All Staff' || user.role === roleFilter;
        return matchesSearch && matchesStatus && matchesRole;
    });

    if (!schoolId) {
        return <div className="p-8">Error: School ID is missing.</div>
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <AlertDialog open={!!userToDelete} onOpenChange={() => setUserToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>This will permanently delete the user <span className="font-bold">{userToDelete?.name}</span>. This action cannot be undone.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteUser}>Delete User</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
                <DialogContent className="sm:max-w-xl">
                    <DialogHeader>
                        <DialogTitle>Edit User: {editingUser?.name}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSaveChanges}>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2"><Label htmlFor="name">Full Name</Label><Input id="name" name="name" defaultValue={editingUser?.name} /></div>
                                <div className="space-y-2"><Label htmlFor="email">Email</Label><Input id="email" name="email" type="email" defaultValue={editingUser?.email} /></div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2"><Label htmlFor="role">Role</Label><Select name="role" defaultValue={editingUser?.role}><SelectTrigger id="role"><SelectValue /></SelectTrigger><SelectContent>{roles.map(role => <SelectItem key={role} value={role}>{role}</SelectItem>)}</SelectContent></Select></div>
                                <div className="space-y-2"><Label htmlFor="status">Account Status</Label><Select name="status" defaultValue={editingUser?.status}><SelectTrigger id="status"><SelectValue /></SelectTrigger><SelectContent>{statuses.filter(s => s !== 'All Statuses').map(status => <SelectItem key={status} value={status}>{status}</SelectItem>)}</SelectContent></Select></div>
                            </div>
                        </div>
                        <DialogFooter><DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose><Button type="submit" disabled={isSaving}>{isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}Save Changes</Button></DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <div className="mb-6">
                <h1 className="font-headline text-3xl font-bold flex items-center gap-2"><Contact2 className="h-8 w-8 text-primary" />Non-Teaching Staff</h1>
                <p className="text-muted-foreground">Manage all support staff, board members, and other non-academic personnel.</p>
            </div>
             <Card>
                <CardHeader>
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div className="relative w-full md:max-w-sm">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input type="search" placeholder="Search by name or email..." className="w-full bg-background pl-8" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                        </div>
                        <div className="flex w-full flex-col gap-2 md:w-auto md:flex-row">
                             <Select value={statusFilter} onValueChange={(v: UserStatus | 'All Statuses') => setStatusFilter(v)}><SelectTrigger className="w-full md:w-[160px]"><SelectValue placeholder="All Statuses"/></SelectTrigger><SelectContent>{statuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select>
                             <Dialog>
                                <DialogTrigger asChild><Button><PlusCircle className="mr-2 h-4 w-4"/>Create User</Button></DialogTrigger>
                                <DialogContent className="sm:max-w-xl">
                                    <DialogHeader><DialogTitle>Create New Staff Member</DialogTitle></DialogHeader>
                                    <div className="grid gap-4 py-4">
                                        <div className="space-y-2"><Label htmlFor="role-create">User Role</Label><Select name="role" onValueChange={setNewUserRole}><SelectTrigger id="role-create"><SelectValue placeholder="Select a role" /></SelectTrigger><SelectContent>{roles.map(role => <SelectItem key={role} value={role}>{role}</SelectItem>)}</SelectContent></Select></div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2"><Label htmlFor="name-create">Full Name</Label><Input name="name" id="name-create" value={newUserName} onChange={e => setNewUserName(e.target.value)} /></div>
                                            <div className="space-y-2"><Label htmlFor="email-create">Email Address</Label><Input name="email" id="email-create" type="email" value={newUserEmail} onChange={e => setNewUserEmail(e.target.value)} /></div>
                                        </div>
                                        <div className="space-y-2"><Label htmlFor="password-create">Set Initial Password</Label><Input name="password" id="password-create" type="password" value={newUserPassword} onChange={e => setNewUserPassword(e.target.value)} /></div>
                                    </div>
                                    <DialogFooter><DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose><DialogClose asChild><Button onClick={handleCreateUser} disabled={isSaving}>{isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}Create User</Button></DialogClose></DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Tabs value={roleFilter} onValueChange={(value) => setRoleFilter(value as UserRole | 'All Staff')}>
                        <TabsList className="mb-4">
                            {uniqueRoles.map(role => (
                                <TabsTrigger key={role} value={role}>{role}</TabsTrigger>
                            ))}
                        </TabsList>
                         <div className="w-full overflow-auto rounded-lg border">
                            <Table>
                                <TableHeader><TableRow><TableHead>User</TableHead><TableHead>Email</TableHead><TableHead>Role</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                                <TableBody>
                                    {isLoading ? (
                                        <TableRow><TableCell colSpan={5} className="h-24 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></TableCell></TableRow>
                                    ) : filteredStaff.length > 0 ? (
                                        filteredStaff.map((user) => (
                                            <TableRow key={user.id}>
                                                <TableCell><div className="flex items-center gap-3"><Avatar className="h-9 w-9"><AvatarFallback>{user.name?.slice(0,2)}</AvatarFallback></Avatar><span className="font-medium">{user.name}</span></div></TableCell>
                                                <TableCell>{user.email}</TableCell>
                                                <TableCell><Badge variant="outline">{user.role}</Badge></TableCell>
                                                <TableCell>{getStatusBadge(user.status)}</TableCell>
                                                <TableCell className="text-right"><Button variant="ghost" size="sm" onClick={() => setEditingUser(user)}><Edit className="mr-2 h-4 w-4" /> Edit</Button></TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow><TableCell colSpan={5} className="h-24 text-center">No staff found for the selected filters.</TableCell></TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </Tabs>
                </CardContent>
                 <CardFooter>
                    <div className="text-xs text-muted-foreground">Showing <strong>{filteredStaff.length}</strong> of <strong>{staff.length}</strong> staff members.</div>
                 </CardFooter>
             </Card>
        </div>
    );
}
