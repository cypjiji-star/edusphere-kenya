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
  Users,
  PlusCircle,
  Search,
  Trash2,
  Edit,
  Loader2,
  Contact2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { firestore } from "@/lib/firebase";
import {
  collection,
  onSnapshot,
  query,
  addDoc,
  doc,
  deleteDoc,
  where,
} from "firebase/firestore";
import { useSearchParams } from "next/navigation";
import { createUserAction, deleteUserAction } from "@/app/developer/actions";
import { useAuth } from "@/context/auth-context";

type NonTeachingStaff = {
  id: string;
  name: string;
  role: string;
  phone?: string;
  status: "Active" | "Inactive";
};

const roles = [
  "Accountant",
  "Librarian",
  "Nurse",
  "Security",
  "Cleaner",
  "Cook",
  "Driver",
  "Secretary",
  "Farm Worker",
  "Other",
];

export default function NonTeachingStaffPage() {
  const searchParams = useSearchParams();
  const schoolId = searchParams.get("schoolId");
  const { user: adminUser } = useAuth();
  const [staff, setStaff] = React.useState<NonTeachingStaff[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // New staff form state
  const [newName, setNewName] = React.useState("");
  const [newRole, setNewRole] = React.useState("");
  const [newPhone, setNewPhone] = React.useState("");

  const { toast } = useToast();

  React.useEffect(() => {
    if (!schoolId) return;

    const staffQuery = query(
      collection(firestore, `schools/${schoolId}/users`),
      where("role", "in", roles),
    );

    const unsubscribe = onSnapshot(staffQuery, (snapshot) => {
      const staffData = snapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() }) as NonTeachingStaff,
      );
      setStaff(staffData);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [schoolId]);

  const handleCreateStaff = async () => {
    if (!newName || !newRole || !schoolId || !adminUser) {
      toast({
        title: "Missing Information",
        description: "Please provide a name and role for the new staff member.",
        variant: "destructive",
      });
      return;
    }
    setIsSubmitting(true);
    try {
      const result = await createUserAction({
        schoolId,
        name: newName,
        role: newRole,
        phone: newPhone,
        actor: { id: adminUser.uid, name: adminUser.displayName || "Admin" },
      });

      if (!result.success) {
        throw new Error(result.message);
      }

      toast({
        title: "Staff Member Added",
        description: `${newName} has been added to the system.`,
      });
      setNewName("");
      setNewRole("");
      setNewPhone("");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Could not create staff member.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteStaff = async (staffMember: NonTeachingStaff) => {
    if (!schoolId) return;
    try {
      await deleteUserAction(staffMember.id, schoolId);
      toast({
        title: "Staff Member Removed",
        description: `${staffMember.name} has been removed.`,
        variant: "destructive",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not remove staff member.",
        variant: "destructive",
      });
    }
  };

  if (!schoolId) {
    return <div className="p-8">Error: School ID is missing.</div>;
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="font-headline text-3xl font-bold flex items-center gap-2">
            <Contact2 className="h-8 w-8 text-primary" />
            Non-Teaching Staff
          </h1>
          <p className="text-muted-foreground">
            Manage support staff profiles and roles.
          </p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Staff Member
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Staff Member</DialogTitle>
            </DialogHeader>
            <div className="py-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="staff-name">Full Name</Label>
                <Input
                  id="staff-name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="staff-role">Role/Job Title</Label>
                <Input
                  id="staff-role"
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="staff-phone">Phone Number</Label>
                <Input
                  id="staff-phone"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <DialogClose asChild>
                <Button onClick={handleCreateStaff} disabled={isSubmitting}>
                  {isSubmitting && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Save
                </Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
          ) : (
            <div className="w-full overflow-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {staff.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell className="font-medium">
                        {member.name}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{member.role}</Badge>
                      </TableCell>
                      <TableCell>{member.phone || "N/A"}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            member.status === "Active"
                              ? "default"
                              : "destructive"
                          }
                          className={
                            member.status === "Active" ? "bg-green-600" : ""
                          }
                        >
                          {member.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteStaff(member)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
