
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
import { Badge } from "@/components/ui/badge";
import {
  GraduationCap,
  Search,
  Loader2,
} from "lucide-react";
import { firestore } from "@/lib/firebase";
import {
  collection,
  query,
  onSnapshot,
  where,
  orderBy,
} from "firebase/firestore";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { NiceError } from "@/components/ui/nice-error";

type Student = {
  id: string;
  name: string;
  admissionNumber: string;
  class: string;
  classId: string;
  avatarUrl: string;
  status: "Active" | "Inactive" | "Graduated";
};

type Class = {
  id: string;
  name: string;
};

const getStatusBadge = (status: Student["status"]) => {
  switch (status) {
    case "Active":
      return <Badge>Active</Badge>;
    case "Inactive":
      return <Badge variant="secondary">Inactive</Badge>;
    case "Graduated":
      return <Badge variant="outline">Graduated</Badge>;
  }
};

export default function StudentManagementPage() {
  const searchParams = useSearchParams();
  const schoolId = searchParams.get("schoolId");
  const [students, setStudents] = React.useState<Student[]>([]);
  const [classes, setClasses] = React.useState<Class[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [classFilter, setClassFilter] = React.useState("All Classes");
  const [page, setPage] = React.useState(1);
  const studentsPerPage = 15;

  React.useEffect(() => {
    if (!schoolId) {
      setIsLoading(false);
      return;
    }

    const studentsQuery = query(
      collection(firestore, `schools/${schoolId}/users`),
      where("role", "==", "Student"),
      orderBy("name")
    );
    const unsubStudents = onSnapshot(studentsQuery, (snapshot) => {
      const studentData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Student[];
      setStudents(studentData);
      setIsLoading(false);
    });

    const classQuery = query(collection(firestore, `schools/${schoolId}/classes`));
    const unsubClasses = onSnapshot(classQuery, (snapshot) => {
      const classList = snapshot.docs.map((doc) => ({
        id: doc.id,
        name: `${doc.data().name} ${doc.data().stream || ""}`.trim(),
      }));
      setClasses(classList);
    });

    return () => {
      unsubStudents();
      unsubClasses();
    };
  }, [schoolId]);

  const filteredStudents = React.useMemo(() => {
    let filtered = students;
    if (searchTerm) {
      filtered = filtered.filter(
        (s) =>
          s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (s.admissionNumber && s.admissionNumber.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    if (classFilter !== "All Classes") {
        filtered = filtered.filter((s) => s.classId === classFilter);
    }
    return filtered;
  }, [students, searchTerm, classFilter, classes]);

  const paginatedStudents = React.useMemo(() => {
    const startIndex = (page - 1) * studentsPerPage;
    return filteredStudents.slice(startIndex, startIndex + studentsPerPage);
  }, [filteredStudents, page]);

  const totalPages = Math.ceil(filteredStudents.length / studentsPerPage);

  if (!schoolId) {
    return <NiceError title="School ID Missing" description="The school identifier is missing from the URL. Please access this page through your school's portal." />;
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="font-headline text-3xl font-bold flex items-center gap-2">
          <GraduationCap className="h-8 w-8 text-primary" />
          Student Management
        </h1>
        <p className="text-muted-foreground">
          View and manage all student records in the school.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="relative w-full md:max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or admission no..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={classFilter} onValueChange={setClassFilter}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Filter by class..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All Classes">All Classes</SelectItem>
                {classes.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
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
                    <TableHead>Admission No.</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedStudents.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            <AvatarImage src={student.avatarUrl} alt={student.name} />
                            <AvatarFallback>{student.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{student.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>{student.admissionNumber}</TableCell>
                      <TableCell>{student.class}</TableCell>
                      <TableCell>{getStatusBadge(student.status)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
        <CardFooter>
          <div className="text-xs text-muted-foreground">
            Showing <strong>{paginatedStudents.length}</strong> of{" "}
            <strong>{filteredStudents.length}</strong> students.
          </div>
          {totalPages > 1 && (
             <div className="ml-auto flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <span className="text-sm">
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Next
                </Button>
            </div>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
