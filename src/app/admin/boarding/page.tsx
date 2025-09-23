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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Bed,
  Search,
  Filter,
  ChevronDown,
  UserCheck,
  Moon,
  Sun,
  Loader2,
} from "lucide-react";
import { firestore } from "@/lib/firebase";
import {
  collection,
  onSnapshot,
  query,
  doc,
  updateDoc,
  where,
} from "firebase/firestore";
import { useSearchParams } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/auth-context";
import { logAuditEvent } from "@/lib/audit-log.service";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type BoardingStatus = "Boarder" | "Day Scholar";

type Student = {
  id: string;
  name: string;
  admissionNumber: string;
  class: string;
  avatarUrl: string;
  boardingStatus: BoardingStatus;
};

export default function BoardingPage() {
  const searchParams = useSearchParams();
  const schoolId = searchParams.get("schoolId");
  const { toast } = useToast();
  const { user: adminUser } = useAuth();

  const [students, setStudents] = React.useState<Student[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [classFilter, setClassFilter] = React.useState("All Classes");
  const [statusFilter, setStatusFilter] = React.useState<
    BoardingStatus | "All"
  >("All");
  const [classes, setClasses] = React.useState<string[]>(["All Classes"]);

  React.useEffect(() => {
    if (!schoolId) {
      setIsLoading(false);
      return;
    }

    const q = query(
      collection(firestore, `schools/${schoolId}/users`),
      where("role", "==", "Student"),
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const studentData = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name,
          admissionNumber: data.admissionNumber,
          class: data.class,
          avatarUrl:
            data.avatarUrl || `https://picsum.photos/seed/${doc.id}/100`,
          boardingStatus: data.boardingStatus || "Day Scholar",
        } as Student;
      });
      setStudents(studentData);

      const uniqueClasses = [...new Set(studentData.map((s) => s.class))];
      setClasses(["All Classes", ...uniqueClasses]);

      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [schoolId]);

  const handleStatusChange = async (
    studentId: string,
    studentName: string,
    newStatus: BoardingStatus,
  ) => {
    if (!schoolId || !adminUser) return;

    try {
      const studentRef = doc(firestore, `schools/${schoolId}/users`, studentId);
      await updateDoc(studentRef, { boardingStatus: newStatus });

      await logAuditEvent({
        schoolId,
        action: "STUDENT_STATUS_UPDATED",
        actionType: "User Management",
        user: {
          id: adminUser.uid,
          name: adminUser.displayName || "Admin",
          role: "Admin",
        },
        details: `Changed boarding status for ${studentName} to ${newStatus}.`,
      });

      toast({
        title: "Status Updated",
        description: `${studentName}'s status has been changed to ${newStatus}.`,
      });
    } catch (error) {
      console.error("Error updating status:", error);
      toast({
        title: "Update Failed",
        description: "Could not update the student's status.",
        variant: "destructive",
      });
    }
  };

  const filteredStudents = students.filter(
    (student) =>
      (student.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.admissionNumber
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase())) &&
      (classFilter === "All Classes" || student.class === classFilter) &&
      (statusFilter === "All" || student.boardingStatus === statusFilter),
  );

  const stats = React.useMemo(() => {
    const boarders = students.filter(
      (s) => s.boardingStatus === "Boarder",
    ).length;
    const dayScholars = students.length - boarders;
    return { total: students.length, boarders, dayScholars };
  }, [students]);

  if (!schoolId) {
    return <div className="p-8">Error: School ID is missing.</div>;
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="font-headline text-3xl font-bold flex items-center gap-2">
          <Bed className="h-8 w-8 text-primary" />
          Boarding & Day Scholars
        </h1>
        <p className="text-muted-foreground">
          Manage the boarding status of all students.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Total Students
            </CardTitle>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Boarders</CardTitle>
            <div className="text-2xl font-bold text-primary">
              {stats.boarders}
            </div>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Day Scholars</CardTitle>
            <div className="text-2xl font-bold">{stats.dayScholars}</div>
          </CardHeader>
        </Card>
      </div>

      <Tabs
        value={statusFilter}
        onValueChange={(value) =>
          setStatusFilter(value as BoardingStatus | "All")
        }
      >
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="relative w-full md:max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search by name or admission no..."
                  className="w-full bg-background pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2">
                <TabsList>
                  <TabsTrigger value="All">All Students</TabsTrigger>
                  <TabsTrigger value="Boarder">Boarders</TabsTrigger>
                  <TabsTrigger value="Day Scholar">Day Scholars</TabsTrigger>
                </TabsList>
                <Select value={classFilter} onValueChange={setClassFilter}>
                  <SelectTrigger className="w-full md:w-[180px]">
                    <SelectValue placeholder="All Classes" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
              </div>
            ) : (
              <div className="w-full overflow-auto rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Class</TableHead>
                      <TableHead className="w-[200px]">
                        Boarding Status
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStudents.map((student) => (
                      <TableRow key={student.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9">
                              <AvatarImage
                                src={student.avatarUrl}
                                alt={student.name}
                              />
                              <AvatarFallback>
                                {student.name?.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium">{student.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>{student.class}</TableCell>
                        <TableCell>
                          <Select
                            value={student.boardingStatus}
                            onValueChange={(value) =>
                              handleStatusChange(
                                student.id,
                                student.name,
                                value as BoardingStatus,
                              )
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Boarder">
                                <Moon className="mr-2 h-4 w-4 inline-block" />
                                Boarder
                              </SelectItem>
                              <SelectItem value="Day Scholar">
                                <Sun className="mr-2 h-4 w-4 inline-block" />
                                Day Scholar
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredStudents.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={3} className="h-24 text-center">
                          No students found for this filter.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
          <CardFooter>
            <div className="text-xs text-muted-foreground">
              Showing <strong>{filteredStudents.length}</strong> of{" "}
              <strong>{students.length}</strong> students.
            </div>
          </CardFooter>
        </Card>
      </Tabs>
    </div>
  );
}
