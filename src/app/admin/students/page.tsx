


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
import { Users, PlusCircle, User, Search, ArrowRight, Edit, UserPlus, Trash2, Filter, FileDown, ChevronDown, CheckCircle, Clock, XCircle, KeyRound, AlertTriangle, Upload, Columns, Phone, History, FileText, GraduationCap, Loader2 } from 'lucide-react';
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
import { useToast } from '@/hooks/use-toast';
import { auth, firestore, firebaseConfig } from '@/lib/firebase';
import { initializeApp, deleteApp } from 'firebase/app';
import { collection, onSnapshot, query, doc, updateDoc, deleteDoc, addDoc, serverTimestamp, setDoc, where, writeBatch } from 'firebase/firestore';
import { useSearchParams } from 'next/navigation';
import { createUserWithEmailAndPassword, getAuth } from 'firebase/auth';
import { MultiSelect } from '@/components/ui/multi-select';
import { useAuth } from '@/context/auth-context';
import { logAuditEvent } from '@/lib/audit-log.service';
import { Timestamp } from 'firebase/firestore';
import { deleteUserAction } from '../users/actions';


type UserRole = 'Admin' | 'Teacher' | 'Student' | 'Parent' | string;
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
    lastLogin: Timestamp | 'Never' | null;
    createdAt: Timestamp;
    class?: string;
    parents?: ParentLink[];
};


const statuses: (UserStatus | 'All Statuses')[] = ['All Statuses', 'Active', 'Pending', 'Suspended', 'Transferred', 'Graduated'];
const relationships: ParentRelationship[] = ['Father', 'Mother', 'Guardian'];
const years = Array.from({ length: 10 }, (_, i) => (new Date().getFullYear() - i).toString());

const getStatusBadge = (status: UserStatus) => {
    switch (status) {
        case 'Active': return <Badge variant="default" className="bg-primary hover:bg-primary/90"><CheckCircle className="mr-1 h-3 w-3"/>Active</Badge>;
        case 'Pending': return <Badge variant="secondary" className="bg-yellow-500 text-white hover:bg-yellow-600"><Clock className="mr-1 h-3 w-3"/>Pending</Badge>;
        case 'Suspended': return <Badge variant="destructive"><XCircle className="mr-1 h-3 w-3"/>Suspended</Badge>;
        case 'Transferred': return <Badge variant="outline"><ArrowRight className="mr-1 h-3 w-3"/>Transferred</Badge>;
        case 'Graduated': return <Badge variant="outline" className="border-purple-500 text-purple-500"><GraduationCap className="mr-1 h-3 w-3"/>Graduated</Badge>;
    }
}

export default function StudentManagementPage() {
    const searchParams = useSearchParams();
    const schoolId = searchParams.get('schoolId');
    const { user: adminUser } = useAuth();
    const [studentUsers, setStudentUsers] = React.useState<User[]>([]);
    
    const [roles, setRoles] = React.useState<string[]>([]);
    const [classes, setClasses] = React.useState<{ id: string; name: string }[]>([]);
    const [searchTerm, setSearchTerm] = React.useState('');
    const [statusFilter, setStatusFilter] = React.useState<UserStatus | 'All Statuses'>('All Statuses');
    const [classFilter, setClassFilter] = React.useState('All Classes');
    const [yearFilter, setYearFilter] = React.useState('All Years');
    const [clientReady, setClientReady] = React.useState(false);
    const { toast } = useToast();

    React.useEffect(() => {
        if (!schoolId) return;
        setClientReady(true);
        
        const unsubStudents = onSnapshot(collection(firestore, 'schools', schoolId, 'students'), (snapshot) => {
            setStudentUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), role: 'Student' } as User)));
        });
        
        const unsubClasses = onSnapshot(collection(firestore, 'schools', schoolId, 'classes'), (snapshot) => {
            const classData = snapshot.docs.map(doc => ({ id: doc.id, name: `${doc.data().name} ${doc.data().stream || ''}`.trim() }));
            setClasses(classData);
        });

        return () => {
            unsubStudents();
            unsubClasses();
        };
    }, [schoolId]);

    const handleExport = (type: string) => {
        toast({
            title: 'Exporting Users',
            description: `The user list is being exported as a ${type} file.`,
        });
    };
    
    const handleSaveChanges = async (userId: string, updatedData: Partial<User>) => {
        if (!schoolId) return;
        const userRef = doc(firestore, 'schools', schoolId, 'users', userId);
        try {
            await updateDoc(userRef, updatedData);
            toast({ title: 'User Updated', description: 'The user details have been saved successfully.' });
        } catch (e) {
            toast({ title: 'Error', description: 'Could not update user.', variant: 'destructive'});
        }
    };

    const handleSendPasswordReset = () => {
        toast({ title: 'Password Reset Sent', description: 'A password reset link has been sent to the user\'s email.' });
    };

    const handleDeleteUser = async (userId: string, userName: string, userRole: string) => {
      if (!schoolId || !adminUser) return;
      if (!window.confirm(`Are you sure you want to permanently delete the user "${userName}"? This will remove their login access and all associated data. This action cannot be undone.`)) {
        return;
      }
    
      try {
        const authResult = await deleteUserAction(userId);
        if (!authResult.success && !authResult.message?.includes('user-not-found')) {
          throw new Error(authResult.message);
        }
    
        await deleteDoc(doc(firestore, 'schools', schoolId, 'students', userId));
    
        await logAuditEvent({
          schoolId,
          action: 'USER_DELETED',
          actionType: 'Security',
          description: `User account for ${userName} permanently deleted.`,
          user: { id: adminUser.uid, name: adminUser.displayName || 'Admin', role: 'Admin' },
          details: `Deleted User ID: ${userId}, Role: ${userRole}`,
        });
    
        toast({
          title: 'User Deleted',
          description: `The user account for ${userName} has been permanently deleted.`,
          variant: 'destructive',
        });
      } catch (e: any) {
        console.error("Error deleting user:", e);
        toast({
          title: 'Deletion Failed',
          description: e.message || 'Could not delete the user account. Please check the logs or contact support.',
          variant: 'destructive',
        });
      }
    };

    const renderStudentTable = () => {
        const filteredUsers = studentUsers.filter(user => {
            const searchLower = searchTerm.toLowerCase();
            const matchesSearch = user.name?.toLowerCase().includes(searchLower) ||
                                  user.email?.toLowerCase().includes(searchLower) ||
                                  user.id?.toLowerCase().includes(searchLower);

            const matchesStatus = statusFilter === 'All Statuses' || user.status === statusFilter;
            const matchesClass = classFilter === 'All Classes' || user.class === classFilter;
            const creationDate = user.createdAt instanceof Timestamp ? user.createdAt.toDate() : user.createdAt ? new Date(user.createdAt) : null;
            const matchesYear = yearFilter === 'All Years' || (creationDate && creationDate.getFullYear().toString() === yearFilter);

            return matchesSearch && matchesStatus && matchesClass && matchesYear;
        });

        return (
            <>
                <div className="w-full overflow-auto rounded-lg border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Student</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Class</TableHead>
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
                                                    <AvatarFallback>{user.name?.slice(0,2)}</AvatarFallback>
                                                </Avatar>
                                                <span className="font-medium">{user.name}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>{user.email}</TableCell>
                                        <TableCell><Badge variant="outline">{user.class}</Badge></TableCell>
                                        <TableCell>
                                            {getStatusBadge(user.status)}
                                        </TableCell>
                                        <TableCell>
                                            {user.lastLogin && user.lastLogin !== 'Never' ? (user.lastLogin as Timestamp).toDate().toLocaleDateString() : 'Never'}
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
                                                                <Input id="role" defaultValue={user.role} disabled />
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
                                                        
                                                        <Separator />
                                                        <div className="space-y-4">
                                                            <h4 className="font-semibold text-base flex items-center gap-2"><History className="h-4 w-4" />User History</h4>
                                                             <div className="text-sm text-muted-foreground space-y-2">
                                                                <div><strong>Account Created:</strong> {user.createdAt ? (user.createdAt as Timestamp).toDate().toLocaleString() : ''}</div>
                                                                <div><strong>Last Login:</strong> {user.lastLogin && user.lastLogin !== 'Never' && (user.lastLogin as Timestamp).toDate ? (user.lastLogin as Timestamp).toDate().toLocaleString() : 'Never'}</div>
                                                                 <div><strong>Last Profile Update:</strong> {user.lastLogin && user.lastLogin !== 'Never' && (user.lastLogin as Timestamp).toDate ? (user.lastLogin as Timestamp).toDate().toLocaleDateString() : 'Never'} by Admin</div>
                                                            </div>
                                                        </div>
                                                        <Separator />
                                                        <div className="space-y-4">
                                                            <h4 className="font-semibold text-base">Administrative Actions</h4>
                                                            <div className="flex flex-col gap-4 sm:flex-row sm:justify-between">
                                                                <Button variant="outline" onClick={handleSendPasswordReset}>
                                                                    <KeyRound className="mr-2 h-4 w-4" />
                                                                    Send Password Reset
                                                                </Button>
                                                                <DialogClose asChild>
                                                                    <Button variant="destructive" onClick={() => handleDeleteUser(user.id, user.name, user.role)}>
                                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                                        Delete User
                                                                    </Button>
                                                                </DialogClose>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <DialogFooter>
                                                        <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
                                                        <DialogClose asChild>
                                                            <Button onClick={() => handleSaveChanges(user.id, {})}>Save Changes</Button>
                                                        </DialogClose>
                                                    </DialogFooter>
                                                </DialogContent>
                                            </Dialog>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center">
                                        No students found for the selected filters.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
                 <CardFooter className="px-0 pt-6">
                    <div className="text-xs text-muted-foreground">
                        Showing <strong>{filteredUsers.length}</strong> of <strong>{studentUsers.length}</strong> students.
                    </div>
                </CardFooter>
            </>
        );
    }

  if (!schoolId) {
    return <div className="p-8">Error: School ID is missing. Please access this page through the developer dashboard.</div>
  }

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <div className="mb-6">
                <h1 className="font-headline text-3xl font-bold flex items-center gap-2">
                <GraduationCap className="h-8 w-8 text-primary" />
                Student Management
                </h1>
                <p className="text-muted-foreground">Manage all students in the school.</p>
            </div>
             <Card>
                <CardHeader>
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                            <CardTitle>Student Directory</CardTitle>
                            <CardDescription>A list of all students in the school.</CardDescription>
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
                                    <SelectItem value="All Classes">All Classes</SelectItem>
                                    {classes.map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}
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
                   {renderStudentTable()}
                </CardContent>
             </Card>
        </div>
    );
}
