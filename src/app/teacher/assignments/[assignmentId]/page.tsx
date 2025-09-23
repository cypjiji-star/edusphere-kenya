"use client";

export const dynamic = 'force-dynamic';
export const dynamicParams = false;

import * as React from "react";
import Link from "next/link";
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
  ArrowLeft,
  Search,
  CheckCircle,
  Clock,
  FileDown,
  Filter,
  ChevronDown,
  Printer,
  Loader2,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { GradingDialog } from "./grading-dialog";
import type { Submission, SubmissionStatus } from "./types";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { firestore } from "@/lib/firebase";
import {
  doc,
  getDoc,
  onSnapshot,
  collection,
  query,
  where,
  Timestamp,
} from "firebase/firestore";
import type { DocumentData } from "firebase/firestore";
import { useSearchParams } from "next/navigation";

const getStatusBadge = (status: Submission["status"]) => {
  switch (status) {
    case "Graded":
      return (
        <Badge variant="default" className="bg-green-600 hover:bg-green-700">
          <CheckCircle className="mr-1 h-3 w-3" />
          Graded
        </Badge>
      );
    case "Not Handed In":
      return (
        <Badge variant="destructive">
          <Clock className="mr-1 h-3 w-3" />
          Not Handed In
        </Badge>
      );
    case "Handed In":
      return (
        <Badge
          variant="secondary"
          className="bg-blue-500 text-white hover:bg-blue-500"
        >
          <Clock className="mr-1 h-3 w-3" />
          Handed In
        </Badge>
      );
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

export default function AssignmentSubmissionsPage({
  params,
}: {
  params: { assignmentId: string };
}) {
  const { assignmentId } = params;
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const schoolId = searchParams.get("schoolId");

  const [assignmentDetails, setAssignmentDetails] =
    React.useState<DocumentData | null>(null);
  const [submissions, setSubmissions] = React.useState<Submission[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  const [searchTerm, setSearchTerm] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<
    SubmissionStatus | "All"
  >("All");
  const [gradingStudent, setGradingStudent] = React.useState<Submission | null>(
    null,
  );
  const [clientReady, setClientReady] = React.useState(false);
  const [page, setPage] = React.useState(1);
  const submissionsPerPage = 10;

  React.useEffect(() => {
    if (!assignmentId || !schoolId) return;

    setClientReady(true);
    setIsLoading(true);

    const assignmentRef = doc(
      firestore,
      `schools/${schoolId}/assignments`,
      assignmentId,
    );
    const unsubAssignment = onSnapshot(assignmentRef, (docSnap) => {
      if (docSnap.exists()) {
        const assignmentData = docSnap.data();
        setAssignmentDetails(assignmentData);

        // Fetch students and then listen for submissions
        const studentsQuery = query(
          collection(firestore, `schools/${schoolId}/users`),
          where("role", "==", "Student"),
          where("classId", "==", assignmentData.classId),
        );
        onSnapshot(studentsQuery, (studentsSnap) => {
          const studentList: Submission[] = studentsSnap.docs.map((doc) => {
            const data = doc.data();
            return {
              studentId: doc.id,
              studentName: data.name,
              avatarUrl: data.avatarUrl,
              status: "Not Handed In",
            };
          });

          const submissionsQuery = query(
            collection(
              firestore,
              `schools/${schoolId}/assignments`,
              assignmentId,
              "submissions",
            ),
          );
          const unsubSubmissions = onSnapshot(
            submissionsQuery,
            (submissionsSnap) => {
              const submissionsMap = new Map();
              submissionsSnap.forEach((subDoc) => {
                const subData = subDoc.data();
                submissionsMap.set(subData.studentRef.id, {
                  status: subData.status,
                  grade: subData.grade,
                  feedback: subData.feedback,
                  submittedDate: (subData.submittedDate as Timestamp)
                    ?.toDate()
                    .toISOString(),
                  submissionId: subDoc.id,
                });
              });

              const mergedSubmissions = studentList.map((student) => {
                const submissionData = submissionsMap.get(student.studentId);
                return submissionData
                  ? { ...student, ...submissionData }
                  : student;
              });

              setSubmissions(mergedSubmissions);
              setIsLoading(false);
            },
          );

          return () => unsubSubmissions();
        });
      } else {
        toast({ variant: "destructive", title: "Assignment not found." });
        setIsLoading(false);
      }
    });

    return () => unsubAssignment();
  }, [assignmentId, schoolId, toast]);

  const handleGradeSave = (
    studentId: string,
    grade: string,
    status: "Approved" | "Pending Approval",
  ) => {
    setSubmissions((prev) =>
      prev.map((s) =>
        s.studentId === studentId ? { ...s, grade, status: "Graded" } : s,
      ),
    );
    toast({
      title: "Grade Saved!",
      description: `The grade for the submission has been saved and is now ${status === "Pending Approval" ? "pending approval" : "approved"}.`,
    });
  };

  const filteredSubmissions = submissions.filter(
    (s) =>
      s.studentName.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (statusFilter === "All" || s.status === statusFilter),
  );

  const paginatedSubmissions = React.useMemo(() => {
    const startIndex = (page - 1) * submissionsPerPage;
    return filteredSubmissions.slice(
      startIndex,
      startIndex + submissionsPerPage,
    );
  }, [filteredSubmissions, page, submissionsPerPage]);

  const totalPages = Math.ceil(filteredSubmissions.length / submissionsPerPage);

  if (isLoading || !assignmentDetails) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  const formattedDueDate = assignmentDetails.dueDate
    ? new Date(assignmentDetails.dueDate.toDate()).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "N/A";

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <GradingDialog
        student={gradingStudent}
        assignmentId={assignmentId}
        open={!!gradingStudent}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            setGradingStudent(null);
          }
        }}
        onGradeSave={handleGradeSave}
      />

      <div className="mb-6">
        <Button asChild variant="outline" size="sm">
          <Link href={`/teacher/assignments?schoolId=${schoolId}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to All Assignments
          </Link>
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-2xl">
            {assignmentDetails.title}
          </CardTitle>
          <CardDescription>
            {assignmentDetails.className} - Due:{" "}
            {clientReady ? formattedDueDate : ""}
          </CardDescription>
          <div className="mt-4 flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
            <div className="relative w-full md:max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search by student name..."
                className="w-full bg-background pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex w-full flex-col gap-2 md:w-auto md:flex-row md:items-center">
              <Select
                value={statusFilter}
                onValueChange={(value: SubmissionStatus | "All") =>
                  setStatusFilter(value)
                }
              >
                <SelectTrigger className="w-full md:w-auto">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Statuses</SelectItem>
                  <SelectItem value="Graded">Graded</SelectItem>
                  <SelectItem value="Handed In">Handed In</SelectItem>
                  <SelectItem value="Not Handed In">Not Handed In</SelectItem>
                </SelectContent>
              </Select>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="secondary" className="w-full md:w-auto">
                    Export
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem disabled>
                    <FileDown className="mr-2" />
                    Download Grades (PDF)
                  </DropdownMenuItem>
                  <DropdownMenuItem disabled>
                    <FileDown className="mr-2" />
                    Download Grades (Excel)
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem disabled>
                    <Printer className="mr-2" />
                    Print View
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Desktop Table */}
          <div className="w-full overflow-auto rounded-lg border hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Handed In On</TableHead>
                  <TableHead>Grade</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedSubmissions.length > 0 ? (
                  paginatedSubmissions.map((submission) => (
                    <TableRow key={submission.studentId}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage
                              src={submission.avatarUrl}
                              alt={submission.studentName}
                            />
                            <AvatarFallback>
                              {submission.studentName.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">
                            {submission.studentName}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(submission.status)}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {clientReady && submission.submittedDate
                          ? new Date(
                              submission.submittedDate,
                            ).toLocaleDateString()
                          : "—"}
                      </TableCell>
                      <TableCell>
                        {submission.grade ? (
                          <Badge variant="outline">{submission.grade}</Badge>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={submission.status === "Not Handed In"}
                          onClick={() => setGradingStudent(submission)}
                        >
                          {submission.grade ? "View/Edit Grade" : "Enter Grade"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      No students found matching your filters.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          {/* Mobile Cards */}
          <div className="grid gap-4 md:hidden">
            {paginatedSubmissions.length > 0 ? (
              paginatedSubmissions.map((submission) => (
                <Card key={submission.studentId} className="w-full">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage
                            src={submission.avatarUrl}
                            alt={submission.studentName}
                          />
                          <AvatarFallback>
                            {submission.studentName.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">
                          {submission.studentName}
                        </span>
                      </div>
                      {getStatusBadge(submission.status)}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Separator />
                    <div className="flex justify-between items-center text-sm">
                      <span className="font-medium text-muted-foreground">
                        Handed In:
                      </span>
                      <span>
                        {clientReady && submission.submittedDate
                          ? new Date(
                              submission.submittedDate,
                            ).toLocaleDateString()
                          : "—"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="font-medium text-muted-foreground">
                        Grade:
                      </span>
                      {submission.grade ? (
                        <Badge variant="outline">{submission.grade}</Badge>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      disabled={submission.status === "Not Handed In"}
                      onClick={() => setGradingStudent(submission)}
                    >
                      {submission.grade ? "View/Edit Grade" : "Enter Grade"}
                    </Button>
                  </CardFooter>
                </Card>
              ))
            ) : (
              <div className="text-center p-8 text-muted-foreground">
                No students found matching your filters.
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter>
          <div className="text-xs text-muted-foreground">
            Showing <strong>{paginatedSubmissions.length}</strong> of{" "}
            <strong>{filteredSubmissions.length}</strong> submissions.
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
