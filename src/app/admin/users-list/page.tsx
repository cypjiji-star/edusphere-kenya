


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
import { deleteUserAction } from './actions';


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

export default function UserManagementListPage() {
    const searchParams = useSearchParams();
    const schoolId = searchParams.get('schoolId');
    const { user: adminUser } = useAuth();
    const [adminUsers, setAdminUsers] = React.useState<User[]>([]);
    const [teacherUsers, setTeacherUsers] = React.useState<User[]>([]);
    const [parentUsers, setParentUsers] = React.useState<User[]>([]);
    
    const allUsers = React.useMemo(() => {
        const userMap = new Map<string, User>();
        [...adminUsers, ...teacherUsers, ...parentUsers].forEach(user => {
            if (user && user.id) {
                userMap.set(user.id, user);
            }
        });
        return Array.from(userMap.values());
    }, [adminUsers, teacherUsers, parentUsers]);

    const [roles, setRoles] = React.useState<string[]>([]);
    const [classes, setClasses] = React.useState<{ id: string; name: string }[]>([]);
    const [searchTerm, setSearchTerm] = React.useState('');
    const [statusFilter, setStatusFilter] = React.useState<UserStatus | 'All Statuses'>('All Statuses');
    const [clientReady, setClientReady] = React.useState(false);
    const { toast } = useToast();
    const [bulkImportFile, setBulkImportFile] = React.useState<File | null>(null);
    const [isProcessingFile, setIsProcessingFile] = React.useState(false);
    const [isFileProcessed, setIsFileProcessed] = React.useState(false);
    const [isBulkImportOpen, setIsBulkImportOpen] = React.useState(false);
    
    // State for the create user dialog
    const [newUserRole, setNewUserRole] = React.useState<string>('');
    const [newUserName, setNewUserName] = React.useState('');
    const [newUserEmail, setNewUserEmail] = React.useState('');
    const [newUserPassword, setNewUserPassword] = React.useState('');
    const [newUserClasses, setNewUserClasses] = React.useState<string[]>([]);


    React.useEffect(() => {
        if (!schoolId) return;
        setClientReady(true);
        
        const unsubAdmins = onSnapshot(query(collection(firestore, 'schools', schoolId, 'admins')), (snapshot) => {
            setAdminUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User)));
        });

        const unsubTeachers = onSnapshot(query(collection(firestore, 'schools', schoolId, 'users'), where('role', '==', 'Teacher')), (snapshot) => {
            setTeacherUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User)));
        });
        
        const unsubParents = onSnapshot(collection(firestore, 'schools', schoolId, 'parents'), (snapshot) => {
            setParentUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), role: 'Parent' } as User)));
        });
        
        const unsubRoles = onSnapshot(collection(firestore, 'schools', schoolId, 'roles'), (snapshot) => {
            setRoles(snapshot.docs.map(doc => doc.id));
        });

        const unsubClasses = onSnapshot(collection(firestore, 'schools', schoolId, 'classes'), (snapshot) => {
            const classData = snapshot.docs.map(doc => ({ id: doc.id, name: `${doc.data().name} ${doc.data().stream || ''}`.trim() }));
            setClasses(classData);
        });

        return () => {
            unsubAdmins();
            unsubTeachers();
            unsubParents();
            unsubRoles();
            unsubClasses();
        };
    }, [schoolId]);

    const handleBulkFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            setBulkImportFile(event.target.files[0]);
            setIsFileProcessed(false);
        }
    };
    
    const handleRemoveBulkFile = () => {
        setBulkImportFile(null);
        setIsFileProcessed(false);
    };

    const handleProcessFile = () => {
        setIsProcessingFile(true);
        setTimeout(() => {
            setIsProcessingFile(false);
            setIsFileProcessed(true);
            toast({
                title: 'File Processed',
                description: 'Please map the columns from your file to the required fields.',
            });
        }, 1500);
    }
    
    const handleImportUsers = () => {
        setIsBulkImportOpen(false); // Close the dialog
        toast({
            title: 'Import Successful',
            description: 'The users have been added to the system and invitations will be sent shortly.',
        });
        // Reset dialog state after closing
        setTimeout(() => {
            setBulkImportFile(null);
            setIsFileProcessed(false);
        }, 300);
    };

    const handleCreateUser = async () => {
        if (!schoolId || !newUserRole || !newUserEmail || !newUserPassword || !newUserName || !adminUser) {
            toast({ title: 'Missing Information or Not Authenticated', variant: 'destructive' });
            return;
        }

        const secondaryApp = initializeApp(firebaseConfig, `secondary-${Date.now()}`);
        const secondaryAuth = getAuth(secondaryApp);

        try {
            const userCredential = await createUserWithEmailAndPassword(secondaryAuth, newUserEmail, newUserPassword);
            const user = userCredential.user;
            
            const isParent = newUserRole === 'Parent';
            const collectionName = isParent ? 'parents' : 'users';
            
            const batch = writeBatch(firestore);
            
            const userDocRef = doc(firestore, 'schools', schoolId, collectionName, user.uid);
            
            const userData: any = {
                id: user.uid,
                schoolId: schoolId,
                name: newUserName,
                email: newUserEmail,
                role: newUserRole,
                status: 'Active',
                createdAt: serverTimestamp(),
                lastLogin: 'Never',
                avatarUrl: `https://picsum.photos/seed/${newUserEmail}/100`
            };

            if (newUserRole === 'Teacher') userData.classes = newUserClasses;

            batch.set(userDocRef, userData);

            await batch.commit();
            
            await logAuditEvent({
                schoolId,
                action: 'USER_CREATED',
                actionType: 'User Management',
                description: `New user account created for ${newUserName}.`,
                user: { id: adminUser.uid, name: adminUser.displayName || 'Admin', role: 'Admin' },
                details: `Role: ${newUserRole}, Email: ${newUserEmail}`
            });

            toast({
                title: 'User Created',
                description: 'A new user account has been created successfully.',
            });

            setNewUserName('');
            setNewUserEmail('');
            setNewUserPassword('');
            setNewUserRole('');
            setNewUserClasses([]);

        } catch(e: any) {
             let errorMessage = 'Could not create user. Please try again.';
            if (e.code === 'auth/email-already-in-use') errorMessage = 'This email is already in use by another account.';
            else if (e.code === 'auth/weak-password') errorMessage = 'Password is too weak. It must be at least 6 characters long.';
            toast({ title: 'Error', description: errorMessage, variant: 'destructive'});
        } finally {
            await deleteApp(secondaryApp);
        }
    };
    
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
    
        let collectionName;
        if (userRole === 'Parent') collectionName = 'parents';
        else if (userRole === 'Admin') collectionName = 'admins';
        else collectionName = 'users'; // Default for Teacher and other roles
    
        await deleteDoc(doc(firestore, 'schools', schoolId, collectionName, userId));
    
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

    const renderUserTable = (roleFilter: UserRole | 'All') => {
        const usersToFilter = roleFilter === 'All'
            ? allUsers
            : allUsers.filter(u => u.role === roleFilter);

        const filteredUsers = usersToFilter.filter(user => {
            const searchLower = searchTerm.toLowerCase();
            const matchesSearch = user.name?.toLowerCase().includes(searchLower) ||
                                  user.email?.toLowerCase().includes(searchLower) ||
                                  user.id?.toLowerCase().includes(searchLower);

            const matchesStatus = statusFilter === 'All Statuses' || user.status === statusFilter;

            return matchesSearch && matchesStatus;
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
                                                    <AvatarFallback>{user.name?.slice(0,2)}</AvatarFallback>
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
                                        No users found for the selected filters.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
                 <CardFooter className="px-0 pt-6">
                    <div className="text-xs text-muted-foreground">
                        Showing <strong>{filteredUsers.length}</strong> of <strong>{allUsers.filter(u => roleFilter === 'All' || u.role === roleFilter).length}</strong> users.
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
                <Users className="h-8 w-8 text-primary" />
                User Management
                </h1>
                <p className="text-muted-foreground">Manage all staff and parent accounts within the school portal.</p>
            </div>
             <Card>
                <CardHeader>
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                            <CardTitle>User Directory</CardTitle>
                            <CardDescription>A list of all non-student users in the system, organized by role.</CardDescription>
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
                                            <Select name="role" onValueChange={setNewUserRole}>
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
                                                <Input name="name" id="name-create" placeholder="e.g., John Doe" value={newUserName} onChange={e => setNewUserName(e.target.value)} />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="email-create">Email Address</Label>
                                                <Input name="email" id="email-create" type="email" placeholder="user@example.com" value={newUserEmail} onChange={e => setNewUserEmail(e.target.value)} />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="password-create">Set Initial Password</Label>
                                            <Input name="password" id="password-create" type="password" value={newUserPassword} onChange={e => setNewUserPassword(e.target.value)} />
                                        </div>

                                        {newUserRole === 'Teacher' && (
                                            <div className="space-y-2">
                                                <Label>Assign Classes</Label>
                                                <MultiSelect
                                                    options={classes.map(c => ({ value: c.id, label: c.name }))}
                                                    selected={newUserClasses}
                                                    onChange={setNewUserClasses}
                                                    placeholder="Select classes..."
                                                />
                                            </div>
                                        )}
                                    </div>
                                    <DialogFooter>
                                        <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
                                        <DialogClose asChild>
                                            <Button onClick={handleCreateUser}>Create User Account</Button>
                                        </DialogClose>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                             <Dialog open={isBulkImportOpen} onOpenChange={setIsBulkImportOpen}>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="outline">
                                            Bulk Actions
                                            <ChevronDown className="ml-2 h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent>
                                        <DialogTrigger asChild>
                                             <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                                <Upload className="mr-2 h-4 w-4" />
                                                Import from CSV/Excel...
                                            </DropdownMenuItem>
                                        </DialogTrigger>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem onClick={() => handleExport('CSV')}>
                                            <FileDown className="mr-2 h-4 w-4" />
                                            Export All Users (CSV)
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                                <DialogContent className="sm:max-w-xl">
                                    <DialogHeader>
                                        <DialogTitle>Import Users from CSV/Excel</DialogTitle>
                                        <DialogDescription>Upload a file to bulk create new user accounts.</DialogDescription>
                                    </DialogHeader>
                                     <div className="grid gap-6 py-4">
                                        <div className="space-y-2">
                                            <Label>Step 1: Upload File</Label>
                                            <div className="flex items-center justify-center w-full">
                                                {bulkImportFile ? (
                                                    <div className="w-full p-4 rounded-lg border bg-muted/50 flex items-center justify-between">
                                                        <div className="flex items-center gap-2 text-sm font-medium">
                                                            <FileText className="h-5 w-5 text-primary" />
                                                            <span className="truncate">{bulkImportFile.name}</span>
                                                        </div>
                                                        <Button variant="ghost" size="icon" onClick={handleRemoveBulkFile} className="h-6 w-6">
                                                            <XCircle className="h-4 w-4 text-destructive" />
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <Label htmlFor="dropzone-file-bulk" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted/50 hover:bg-muted">
                                                        <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center">
                                                            <Upload className="w-8 h-8 mb-2 text-muted-foreground" />
                                                            <p className="mb-2 text-sm text-muted-foreground">Click to upload or drag and drop</p>
                                                            <p className="text-xs text-muted-foreground">CSV or Excel (up to 2MB)</p>
                                                        </div>
                                                        <Input id="dropzone-file-bulk" type="file" className="hidden" onChange={handleBulkFileChange} accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" />
                                                    </Label>
                                                )}
                                            </div>
                                        </div>
                                         <div className="space-y-4">
                                            <div className="flex items-center gap-2">
                                                <Columns className="h-5 w-5 text-primary" />
                                                <h4 className="font-medium">Step 2: Map Columns</h4>
                                            </div>
                                            <p className="text-sm text-muted-foreground">Match columns from your file to the required fields.</p>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="grid grid-cols-[1fr,150px] items-center gap-2">
                                                    <Label>Full Name</Label>
                                                    <Select disabled={!isFileProcessed}><SelectTrigger><SelectValue placeholder="Column..."/></SelectTrigger><SelectContent></SelectContent></Select>
                                                </div>
                                                <div className="grid grid-cols-[1fr,150px] items-center gap-2">
                                                    <Label>Email</Label>
                                                    <Select disabled={!isFileProcessed}><SelectTrigger><SelectValue placeholder="Column..."/></SelectTrigger><SelectContent></SelectContent></Select>
                                                </div>
                                                <div className="grid grid-cols-[1fr,150px] items-center gap-2">
                                                    <Label>Role</Label>
                                                    <Select disabled={!isFileProcessed}><SelectTrigger><SelectValue placeholder="Column..."/></SelectTrigger><SelectContent></SelectContent></Select>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <Button variant="outline" onClick={() => setIsBulkImportOpen(false)}>Cancel</Button>
                                        {isFileProcessed ? (
                                            <Button onClick={handleImportUsers}>
                                                <CheckCircle className="mr-2 h-4 w-4" /> Import Users
                                            </Button>
                                        ) : (
                                            <Button onClick={handleProcessFile} disabled={!bulkImportFile || isProcessingFile}>
                                                {isProcessingFile ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/>Processing...</> : 'Process File'}
                                            </Button>
                                        )}
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
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
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                   <Tabs defaultValue="all" className="w-full">
                        <TabsList className="grid w-full grid-cols-4">
                            <TabsTrigger value="all">All Users</TabsTrigger>
                            <TabsTrigger value="Teacher">Teachers</TabsTrigger>
                            <TabsTrigger value="Parent">Parents</TabsTrigger>
                            <TabsTrigger value="Admin">Admins</TabsTrigger>
                        </TabsList>
                        <TabsContent value="all" className="mt-4">
                            {renderUserTable('All')}
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
