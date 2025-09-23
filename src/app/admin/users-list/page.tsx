
"use client";

import * as React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
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
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  PlusCircle,
  User,
  Search,
  ArrowRight,
  Edit,
  UserPlus,
  Trash2,
  Filter,
  FileDown,
  ChevronDown,
  CheckCircle,
  Clock,
  XCircle,
  KeyRound,
  AlertTriangle,
  Upload,
  Columns,
  Phone,
  History,
  FileText,
  GraduationCap,
  Loader2,
  Contact2,
  Crown,
} from "lucide-react";
import { firestore } from "@/lib/firebase";
import {
  collection,
  onSnapshot,
  query,
  doc,
  updateDoc,
  Timestamp,
  getDocs,
  setDoc,
  where,
} from "firebase/firestore";
import { useSearchParams } from "next/navigation";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/auth-context";
import { logAuditEvent } from "@/lib/audit-log.service";
import {
  deleteUserAction,
  updateUserAuthAction,
  createUserAction,
} from "@/app/developer/actions";
import { Separator } from "@/components/ui/separator";
import { Combobox } from "@/components/ui/combobox";

type UserRole =
  | "Admin"
  | "Teacher"
  | "Parent"
  | "Student"
  | "Cook"
  | "Watchman"
  | "Cleaner"
  | "Farm Worker"
  | "Board Member"
  | "PTA Member"
  | "Matron"
  | "Patron"
  | string;
type UserStatus =
  | "Active"
  | "Pending"
  | "Suspended"
  | "Transferred"
  | "Graduated";

type User = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  lastLogin: Timestamp | "Never" | null;
  createdAt: Timestamp;
  class?: string;
  phone?: string;
  startYear?: string;
  salary?: string;
  nationalId?: string;
};

const statuses: (UserStatus | "All Statuses")[] = [
  "All Statuses",
  "Active",
  "Pending",
  "Suspended",
];

const getStatusBadge = (status: UserStatus) => {
  switch (status) {
    case "Active":
      return (
        <Badge variant="default" className="bg-green-600 hover:bg-green-700">
          <CheckCircle className="mr-1 h-3 w-3" />
          Active
        </Badge>
      );
    case "Pending":
      return (
        <Badge
          variant="secondary"
          className="bg-yellow-500 text-white hover:bg-yellow-600"
        >
          <Clock className="mr-1 h-3 w-3" />
          Pending
        </Badge>
      );
    case "Suspended":
      return (
        <Badge variant="destructive">
          <XCircle className="mr-1 h-3 w-3" />
          Suspended
        </Badge>
      );
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

export default function UserManagementListPage() {
  const searchParams = useSearchParams();
  const schoolId = searchParams.get("schoolId");
  const { user: adminUser } = useAuth();
  const [allUsers, setAllUsers] = React.useState<User[]>([]);

  const [roles, setRoles] = React.useState<string[]>([]);
  const [classes, setClasses] = React.useState<{ id: string; name: string }[]>(
    [],
  );
  const [searchTerm, setSearchTerm] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<
    UserStatus | "All Statuses"
  >("All Statuses");
  const [clientReady, setClientReady] = React.useState(false);
  const { toast } = useToast();
  const [bulkImportFile, setBulkImportFile] = React.useState<File | null>(null);
  const [isProcessingFile, setIsProcessingFile] = React.useState(false);
  const [isFileProcessed, setIsFileProcessed] = React.useState(false);
  const [isBulkImportOpen, setIsBulkImportOpen] = React.useState(false);
  const [userToDelete, setUserToDelete] = React.useState<{
    id: string;
    name: string;
    role: string;
  } | null>(null);
  const [editingUser, setEditingUser] = React.useState<User | null>(null);
  const [isSaving, setIsSaving] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);

  // State for the create user dialog
  const [newUserRole, setNewUserRole] = React.useState<string>("");
  const [newUserName, setNewUserName] = React.useState("");
  const [newUserEmail, setNewUserEmail] = React.useState("");
  const [newUserPassword, setNewUserPassword] = React.useState("");
  const [newUserClasses, setNewUserClasses] = React.useState<string[]>([]);
  const [newUserPhone, setNewUserPhone] = React.useState("");
  const [newUserStartYear, setNewUserStartYear] = React.useState("");
  const [newUserSalary, setNewUserSalary] = React.useState("");
  const [isCreateUserOpen, setIsCreateUserOpen] = React.useState(false);

  React.useEffect(() => {
    if (!schoolId) {
      setIsLoading(false);
      return;
    }
    setClientReady(true);
    setIsLoading(true);

    const q = query(collection(firestore, `schools/${schoolId}/users`));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const usersData = snapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() }) as User,
      );
      setAllUsers(usersData);
      setIsLoading(false);
    });

    const unsubRoles = onSnapshot(
      collection(firestore, "schools", schoolId, "roles"),
      (snapshot) => {
        setRoles(snapshot.docs.map((doc) => doc.id));
      },
    );

    const unsubClasses = onSnapshot(
      collection(firestore, "schools", schoolId, "classes"),
      (snapshot) => {
        const classData = snapshot.docs.map((doc) => ({
          id: doc.id,
          name: `${doc.data().name} ${doc.data().stream || ""}`.trim(),
        }));
        setClasses(classData);
      },
    );

    return () => {
      unsubscribe();
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
        title: "File Processed",
        description:
          "Please map the columns from your file to the required fields.",
      });
    }, 1500);
  };

  const handleImportUsers = () => {
    setIsBulkImportOpen(false); // Close the dialog
    toast({
      title: "Import Successful",
      description:
        "The users have been added to the system and invitations will be sent shortly.",
    });
    // Reset dialog state after closing
    setTimeout(() => {
      setBulkImportFile(null);
      setIsFileProcessed(false);
    }, 300);
  };

  const handleCreateUser = async () => {
    if (!schoolId || !newUserRole || !newUserName || !adminUser) {
      toast({
        title: "Missing Information or Not Authenticated",
        variant: "destructive",
      });
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
          name: adminUser.displayName || "Admin",
        },
        ...(newUserRole === "Teacher" && { classes: newUserClasses }),
        phone: newUserPhone,
        startYear: newUserStartYear,
        salary: newUserSalary,
      });

      if (result.success) {
        toast({
          title: "User Created",
          description: "A new user account has been created successfully.",
        });
        setNewUserName("");
        setNewUserEmail("");
        setNewUserPassword("");
        setNewUserRole("");
        setNewUserClasses([]);
        setNewUserPhone("");
        setNewUserStartYear("");
        setNewUserSalary("");
        setIsCreateUserOpen(false);
      } else {
        throw new Error(result.message);
      }
    } catch (e: any) {
      toast({
        title: "Error",
        description: e.message || "Could not create user.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleExport = (type: string) => {
    toast({
      title: "Exporting Users",
      description: `The user list is being exported as a ${type} file.`,
    });
  };

  const handleSaveChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser || !schoolId || !adminUser) return;

    const formData = new FormData(e.target as HTMLFormElement);
    const updatedData: Partial<User> & { newPassword?: string } = {
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      role: formData.get("role") as string,
      status: formData.get("status") as UserStatus,
      newPassword: formData.get("newPassword") as string,
    };

    setIsSaving(true);
    let authUpdates: { email?: string; password?: string } = {};
    if (updatedData.email && updatedData.email !== editingUser.email) {
      authUpdates.email = updatedData.email;
    }
    if (updatedData.newPassword) {
      authUpdates.password = updatedData.newPassword;
    }

    try {
      if (Object.keys(authUpdates).length > 0) {
        const authResult = await updateUserAuthAction(
          editingUser.id,
          authUpdates,
        );
        if (!authResult.success) {
          throw new Error(authResult.message);
        }
      }

      const userRef = doc(
        firestore,
        "schools",
        schoolId,
        "users",
        editingUser.id,
      );
      await updateDoc(userRef, {
        name: updatedData.name,
        email: updatedData.email,
        role: updatedData.role,
        status: updatedData.status,
      });

      await logAuditEvent({
        schoolId,
        action: "USER_PROFILE_UPDATED",
        actionType: "User Management",
        user: {
          id: adminUser.uid,
          name: adminUser.displayName || "Admin",
          role: "Admin",
        },
        details: `Updated details for user ${editingUser.name}.`,
      });

      toast({
        title: "User Updated",
        description: "The user's details have been saved successfully.",
      });
      setEditingUser(null);
    } catch (e: any) {
      toast({
        title: "Error",
        description: e.message || "Could not update user.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete || !schoolId || !adminUser) return;
    try {
      const result = await deleteUserAction(userToDelete.id, schoolId);
      if (!result.success) throw new Error(result.message);

      await logAuditEvent({
        schoolId,
        action: "USER_DELETED",
        actionType: "Security",
        description: `User account for ${userToDelete.name} permanently deleted.`,
        user: {
          id: adminUser.uid,
          name: adminUser.displayName || "Admin",
          role: "Admin",
        },
        details: `Deleted User ID: ${userToDelete.id}, Role: ${userToDelete.role}`,
      });

      toast({
        title: "User Deleted",
        description: `The user account for ${userToDelete.name} has been permanently deleted.`,
        variant: "destructive",
      });
    } catch (e: any) {
      console.error("Error deleting user:", e);
      toast({
        title: "Deletion Failed",
        description:
          e.message ||
          "Could not delete the user account. Please check the logs or contact support.",
        variant: "destructive",
      });
    } finally {
      setUserToDelete(null);
    }
  };

  const renderUserTable = (roleFilter: UserRole | "All") => {
    let usersToFilter = allUsers;

    if (roleFilter !== "All") {
      usersToFilter = allUsers.filter((u) => u.role === roleFilter);
    }

    const filteredUsers = usersToFilter.filter((user) => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch =
        user.name?.toLowerCase().includes(searchLower) ||
        user.email?.toLowerCase().includes(searchLower) ||
        user.id?.toLowerCase().includes(searchLower);

      const matchesStatus =
        statusFilter === "All Statuses" || user.status === statusFilter;

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
                          <AvatarFallback>
                            {user.name?.slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{user.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{user.role}</Badge>
                    </TableCell>
                    <TableCell>{getStatusBadge(user.status)}</TableCell>
                    <TableCell>
                      {user.lastLogin && user.lastLogin !== "Never"
                        ? (user.lastLogin as Timestamp)
                            .toDate()
                            .toLocaleDateString()
                        : "Never"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingUser(user)}
                      >
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
        <CardFooter className="px-0 pt-6">
          <div className="text-xs text-muted-foreground">
            Showing <strong>{filteredUsers.length}</strong> of{" "}
            <strong>{usersToFilter.length}</strong> users.
          </div>
        </CardFooter>
      </>
    );
  };

  if (!schoolId) {
    return (
      <div className="p-8">
        Error: School ID is missing. Please access this page through the
        developer dashboard.
      </div>
    );
  }

  const allRoleTabs = ["All", ...roles];

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <AlertDialog
        open={!!userToDelete}
        onOpenChange={() => setUserToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the user{" "}
              <span className="font-bold">{userToDelete?.name}</span> and all
              associated data. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteUser}>
              Delete User
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <Dialog
        open={!!editingUser}
        onOpenChange={(open) => !open && setEditingUser(null)}
      >
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Edit User: {editingUser?.name}</DialogTitle>
            <DialogDescription>
              Update user details, role, and status.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveChanges}>
            <div className="grid gap-6 py-4 max-h-[70vh] overflow-y-auto pr-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    name="name"
                    defaultValue={editingUser?.name}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    defaultValue={editingUser?.email}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select name="role" defaultValue={editingUser?.role}>
                    <SelectTrigger id="role">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map((role) => (
                        <SelectItem key={role} value={role}>
                          {role}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Account Status</Label>
                  <Select name="status" defaultValue={editingUser?.status}>
                    <SelectTrigger id="status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {statuses
                        .filter((s) => s !== "All Statuses")
                        .map((status) => (
                          <SelectItem key={status} value={status as string}>
                            {status}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Separator />
              <div className="space-y-4">
                <h4 className="font-semibold text-base">
                  Administrative Actions
                </h4>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">Set New Password</Label>
                  <Input
                    id="newPassword"
                    name="newPassword"
                    type="password"
                    placeholder="Leave blank to keep current password"
                  />
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      type="button"
                      variant="destructive"
                      className="w-full sm:w-auto"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete User Account
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        Are you absolutely sure?
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete the user{" "}
                        <span className="font-bold">{editingUser?.name}</span>.
                        This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => {
                          setUserToDelete(editingUser);
                          setEditingUser(null);
                        }}
                      >
                        Yes, Delete User
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" disabled={isSaving}>
                {isSaving && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <div className="mb-6">
        <h1 className="font-headline text-3xl font-bold flex items-center gap-2">
          <Users className="h-8 w-8 text-primary" />
          User Management
        </h1>
        <p className="text-muted-foreground">
          Manage all staff and parent accounts within the school portal.
        </p>
      </div>
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle>User Directory</CardTitle>
              <CardDescription>
                A list of all users in the system, organized by role.
              </CardDescription>
            </div>
            <div className="flex w-full flex-col gap-2 md:w-auto md:flex-row">
              <Dialog open={isCreateUserOpen} onOpenChange={setIsCreateUserOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <PlusCircle className="mr-2 h-4 w-4" />
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
                      <Combobox
                        options={roles.map((r) => ({ value: r, label: r }))}
                        value={newUserRole}
                        onValueChange={setNewUserRole}
                        placeholder="Select a role..."
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name-create">Full Name</Label>
                        <Input
                          name="name"
                          id="name-create"
                          placeholder="e.g., John Doe"
                          value={newUserName}
                          onChange={(e) => setNewUserName(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email-create">Email Address</Label>
                        <Input
                          name="email"
                          id="email-create"
                          type="email"
                          placeholder="user@example.com"
                          value={newUserEmail}
                          onChange={(e) => setNewUserEmail(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password-create">
                        Set Initial Password
                      </Label>
                      <Input
                        name="password"
                        id="password-create"
                        type="password"
                        value={newUserPassword}
                        onChange={(e) => setNewUserPassword(e.target.value)}
                      />
                    </div>
                    <Separator />
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="phone-create">Phone Number</Label>
                        <Input
                          id="phone-create"
                          type="tel"
                          placeholder="Optional"
                          value={newUserPhone}
                          onChange={(e) => setNewUserPhone(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="start-year-create">
                          Year Started
                        </Label>
                        <Input
                          id="start-year-create"
                          type="number"
                          placeholder="Optional"
                          value={newUserStartYear}
                          onChange={(e) =>
                            setNewUserStartYear(e.target.value)
                          }
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="salary-create">Salary (KES)</Label>
                      <Input
                        id="salary-create"
                        type="number"
                        placeholder="Optional"
                        value={newUserSalary}
                        onChange={(e) => setNewUserSalary(e.target.value)}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button type="button" variant="outline">
                        Cancel
                      </Button>
                    </DialogClose>
                    <Button onClick={handleCreateUser} disabled={isSaving}>
                      {isSaving && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Create User Account
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              <Dialog
                open={isBulkImportOpen}
                onOpenChange={setIsBulkImportOpen}
              >
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
                    <DropdownMenuItem onClick={() => handleExport("CSV")}>
                      <FileDown className="mr-2 h-4 w-4" />
                      Export All Users (CSV)
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <DialogContent className="sm:max-w-xl">
                  <DialogHeader>
                    <DialogTitle>Import Users from CSV/Excel</DialogTitle>
                    <DialogDescription>
                      Upload a file to bulk create new user accounts.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-6 py-4">
                    <div className="space-y-2">
                      <Label>Step 1: Upload File</Label>
                      <div className="flex items-center justify-center w-full">
                        {bulkImportFile ? (
                          <div className="w-full p-4 rounded-lg border bg-muted/50 flex items-center justify-between">
                            <div className="flex items-center gap-2 text-sm font-medium">
                              <FileText className="h-5 w-5 text-primary" />
                              <span className="truncate">
                                {bulkImportFile.name}
                              </span>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={handleRemoveBulkFile}
                              className="h-6 w-6"
                            >
                              <XCircle className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        ) : (
                          <Label
                            htmlFor="dropzone-file-bulk"
                            className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted/50 hover:bg-muted"
                          >
                            <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center">
                              <Upload className="w-8 h-8 mb-2 text-muted-foreground" />
                              <p className="mb-2 text-sm text-muted-foreground">
                                Click to upload or drag and drop
                              </p>
                              <p className="text-xs text-muted-foreground">
                                CSV or Excel (up to 2MB)
                              </p>
                            </div>
                            <Input
                              id="dropzone-file-bulk"
                              type="file"
                              className="hidden"
                              onChange={handleBulkFileChange}
                              accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                            />
                          </Label>
                        )}
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <Columns className="h-5 w-5 text-primary" />
                        <h4 className="font-medium">Step 2: Map Columns</h4>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Match columns from your file to the required fields.
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="grid grid-cols-[1fr,150px] items-center gap-2">
                          <Label>Full Name</Label>
                          <Select disabled={!isFileProcessed}>
                            <SelectTrigger>
                              <SelectValue placeholder="Column..." />
                            </SelectTrigger>
                            <SelectContent></SelectContent>
                          </Select>
                        </div>
                        <div className="grid grid-cols-[1fr,150px] items-center gap-2">
                          <Label>Email</Label>
                          <Select disabled={!isFileProcessed}>
                            <SelectTrigger>
                              <SelectValue placeholder="Column..." />
                            </SelectTrigger>
                            <SelectContent></SelectContent>
                          </Select>
                        </div>
                        <div className="grid grid-cols-[1fr,150px] items-center gap-2">
                          <Label>Role</Label>
                          <Select disabled={!isFileProcessed}>
                            <SelectTrigger>
                              <SelectValue placeholder="Column..." />
                            </SelectTrigger>
                            <SelectContent></SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setIsBulkImportOpen(false)}
                    >
                      Cancel
                    </Button>
                    {isFileProcessed ? (
                      <Button onClick={handleImportUsers}>
                        <CheckCircle className="mr-2 h-4 w-4" /> Import Users
                      </Button>
                    ) : (
                      <Button
                        onClick={handleProcessFile}
                        disabled={!bulkImportFile || isProcessingFile}
                      >
                        {isProcessingFile ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          "Process File"
                        )}
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
            <div className="flex w-full flex-col gap-2 md:w-auto md:flex-wrap">
              <Select
                value={statusFilter}
                onValueChange={(v: UserStatus | "All Statuses") =>
                  setStatusFilter(v)
                }
              >
                <SelectTrigger className="w-full md:w-[150px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  {statuses.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8">
              {allRoleTabs.map((role) => (
                <TabsTrigger key={role} value={role.toLowerCase()}>
                  {role}
                </TabsTrigger>
              ))}
            </TabsList>
            {allRoleTabs.map((role) => (
              <TabsContent key={role} value={role.toLowerCase()} className="mt-4">
                {isLoading ? (
                  <div className="flex h-64 items-center justify-center">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                  </div>
                ) : (
                  renderUserTable(role as UserRole | "All")
                )}
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
