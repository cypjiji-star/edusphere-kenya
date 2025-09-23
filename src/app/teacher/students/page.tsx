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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  Search,
  Filter,
  ChevronDown,
  PlusCircle,
  Edit,
  FileText,
  Phone,
  Mail,
  Loader2,
  TrendingUp,
  BarChart,
  History,
  HeartPulse,
  ShieldAlert,
  CheckCircle,
  XCircle,
  TrendingDown,
  Save,
  Trophy,
} from "lucide-react";
import { firestore } from "@/lib/firebase";
import {
  collection,
  onSnapshot,
  query,
  where,
  Timestamp,
  getDocs,
  orderBy,
  doc,
  updateDoc,
} from "firebase/firestore";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { ClassAnalytics } from "./class-analytics";
import { useAuth } from "@/context/auth-context";

export type Student = {
  id: string;
  name: string;
  admissionNumber: string;
  class: string;
  classId: string;
  gender: "Male" | "Female";
  dateOfBirth: string; // Stored as ISO string
  parentName: string;
  parentContact: string;
  status: "Active" | "Inactive" | "Graduated";
  avatarUrl: string;
  feeStatus: "Paid" | "Partial" | "Overdue";
  overallGrade?: string;
  attendance?: "present" | "absent" | "late" | "unmarked";
};

type TeacherClass = {
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

const getFeeStatusBadge = (status: Student["feeStatus"]) => {
  switch (status) {
    case "Paid":
      return <Badge className="bg-green-600 hover:bg-green-700">Paid</Badge>;
    case "Partial":
      return <Badge className="bg-blue-500 hover:bg-blue-500">Partial</Badge>;
    case "Overdue":
      return <Badge variant="destructive">Overdue</Badge>;
  }
};

export default function TeacherClassManagementPage() {
  const searchParams = useSearchParams();
  const schoolId = searchParams.get("schoolId");
  const { user } = useAuth();

  const [studentsByClass, setStudentsByClass] = React.useState<
    Record<string, Student[]>
  >({});
  const [teacherClasses, setTeacherClasses] = React.useState<TeacherClass[]>(
    [],
  );
  const [isLoading, setIsLoading] = React.useState(true);
  const [activeClassId, setActiveClassId] = React.useState<string>("");

  const [searchTerm, setSearchTerm] = React.useState("");
  const [selectedStudent, setSelectedStudent] = React.useState<Student | null>(
    null,
  );

  React.useEffect(() => {
    if (!schoolId || !user) {
      setIsLoading(false);
      return;
    }
    const teacherId = user.uid;

    const qClasses = query(
      collection(firestore, `schools/${schoolId}/classes`),
      where("teacherId", "==", teacherId),
    );
    const unsubscribeClasses = onSnapshot(qClasses, async (classSnapshot) => {
      const classesData = classSnapshot.docs.map((doc) => ({
        id: doc.id,
        name: `${doc.data().name} ${doc.data().stream || ""}`.trim(),
      }));
      setTeacherClasses(classesData);

      if (classesData.length > 0) {
        if (!activeClassId) {
          setActiveClassId(classesData[0].id);
        }

        const classIds = classesData.map((c) => c.id);
        const studentQuery = query(
          collection(firestore, `schools/${schoolId}/users`),
          where("role", "==", "Student"),
          where("classId", "in", classIds),
        );

        const [studentsSnapshot, gradesSnapshot, attendanceSnapshot] =
          await Promise.all([
            getDocs(studentQuery),
            getDocs(
              query(
                collection(firestore, `schools/${schoolId}/grades`),
                where("status", "==", "Approved"),
              ),
            ),
            getDocs(
              query(
                collection(firestore, `schools/${schoolId}/attendance`),
                where(
                  "date",
                  ">=",
                  Timestamp.fromDate(new Date(new Date().setHours(0, 0, 0, 0))),
                ),
              ),
            ),
          ]);

        const studentGrades: Record<string, number[]> = {};
        gradesSnapshot.forEach((doc) => {
          const data = doc.data();
          if (!studentGrades[data.studentId]) {
            studentGrades[data.studentId] = [];
          }
          const grade = parseInt(data.grade, 10);
          if (!isNaN(grade)) {
            studentGrades[data.studentId].push(grade);
          }
        });

        const attendanceMap = new Map();
        attendanceSnapshot.forEach((doc) => {
          const data = doc.data();
          attendanceMap.set(data.studentId, data.status);
        });

        const allStudents = studentsSnapshot.docs.map((doc) => {
          const data = doc.data();
          const grades = studentGrades[doc.id] || [];
          const overallGrade =
            grades.length > 0
              ? Math.round(grades.reduce((a, b) => a + b, 0) / grades.length)
              : undefined;
          return {
            id: doc.id,
            name: data.name,
            admissionNumber: data.admissionNumber,
            class: data.class,
            classId: data.classId,
            status: data.status || "Active",
            avatarUrl: data.avatarUrl,
            feeStatus: (data.balance || 0) > 0 ? "Overdue" : "Paid",
            attendance: attendanceMap.get(doc.id) || "unmarked",
            overallGrade: overallGrade ? `${overallGrade}%` : undefined,
          } as Student;
        });

        const groupedByClass: Record<string, Student[]> = {};
        allStudents.forEach((student) => {
          if (!groupedByClass[student.classId]) {
            groupedByClass[student.classId] = [];
          }
          groupedByClass[student.classId].push(student);
        });

        // Rank students within each class
        for (const classId in groupedByClass) {
          groupedByClass[classId].sort((a, b) => {
            const gradeA = a.overallGrade ? parseInt(a.overallGrade, 10) : -1;
            const gradeB = b.overallGrade ? parseInt(b.overallGrade, 10) : -1;
            return gradeB - gradeA;
          });
        }

        setStudentsByClass(groupedByClass);
      }

      setIsLoading(false);
    });

    return () => unsubscribeClasses();
  }, [schoolId, user, activeClassId]);

  const currentStudents =
    (activeClassId ? studentsByClass[activeClassId] : []) || [];
  const filteredStudents = currentStudents.filter(
    (student) =>
      student.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.admissionNumber?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="font-headline text-3xl font-bold flex items-center gap-2">
          <Users className="h-8 w-8 text-primary" />
          Class Management
        </h1>
        <p className="text-muted-foreground">
          View student profiles and performance for your classes.
        </p>
      </div>

      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      ) : teacherClasses.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            You are not assigned to any classes.
          </CardContent>
        </Card>
      ) : (
        <Tabs
          value={activeClassId}
          onValueChange={setActiveClassId}
          className="w-full"
        >
          <TabsList>
            {teacherClasses.map((c) => (
              <TabsTrigger key={c.id} value={c.id}>
                {c.name}
              </TabsTrigger>
            ))}
          </TabsList>
          {teacherClasses.map((c) => (
            <TabsContent key={c.id} value={c.id} className="mt-4">
              <ClassAnalytics students={studentsByClass[c.id] || []} />
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
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="w-full overflow-auto rounded-lg border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12 text-center">
                            Rank
                          </TableHead>
                          <TableHead>Student</TableHead>
                          <TableHead>Admission No.</TableHead>
                          <TableHead className="text-center">
                            Overall Grade
                          </TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredStudents.map((student, index) => (
                          <TableRow key={student.id}>
                            <TableCell className="text-center font-bold text-lg">
                              {index + 1}
                            </TableCell>
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
                                <span className="font-medium">
                                  {student.name}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>{student.admissionNumber}</TableCell>
                            <TableCell className="text-center">
                              <Badge
                                variant={
                                  parseInt(student.overallGrade || "0") >= 50
                                    ? "default"
                                    : "destructive"
                                }
                                className={
                                  parseInt(student.overallGrade || "0") >= 80
                                    ? "bg-green-600"
                                    : ""
                                }
                              >
                                {student.overallGrade || "N/A"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button asChild variant="ghost" size="sm">
                                <Link
                                  href={`/teacher/students/${student.id}?schoolId=${schoolId}`}
                                >
                                  View Profile
                                </Link>
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      )}
    </div>
  );
}
