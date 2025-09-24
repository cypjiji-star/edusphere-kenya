"use client";

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

type SubmissionStatus = "Graded" | "Handed In" | "Not Handed In";

type Submission = {
  studentId: string;
  studentName: string;
  avatarUrl: string;
  status: SubmissionStatus;
  submittedDate?: string;
  grade?: string;
};

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
  }
};

export default function AssignmentSubmissionsPage({
  params,
}: {
  params: { assignmentId: string };
}) {
  const { assignmentId } = params;
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
  const [clientReady, setClientReady] = React.useState(false);

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
        setAssignmentDetails(docSnap.data());
      }
      // Note: Don't set loading to false here, wait for submissions
    });

    const submissionsQuery = query(
      collection(
        firestore,
        `schools/${schoolId}/assignments/${assignmentId}/submissions`,
      ),
    );
    const unsubSubmissions = onSnapshot(
      submissionsQuery,
      async (submissionsSnap) => {
        const submissionsData = await Promise.all(
          submissionsSnap.docs.map(async (subDoc) => {
            const subData = subDoc.data();
            const studentSnap = await getDoc(subData.studentRef);
            if (studentSnap.exists()) {
              const studentData = studentSnap.data();
              return {
                studentId: studentSnap.id,
                studentName: studentData.name,
                avatarUrl: studentData.avatarUrl,
                status: subData.status,
                grade: subData.grade,
                submittedDate: (subData.submittedDate as Timestamp)
                  ?.toDate()
                  .toISOString(),
              };
            }
            return null;
          }),
        );
        setSubmissions(
          submissionsData.filter((s): s is Submission => s !== null),
        );
        setIsLoading(false);
      },
    );

    return () => {
      unsubAssignment();
      unsubSubmissions();
    };
  }, [assignmentId, schoolId]);

  const filteredSubmissions = submissions.filter(
    (s) =>
      s.studentName.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (statusFilter === "All" || s.status === statusFilter),
  );

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
      <div className="mb-6">
        <Button asChild variant="outline" size="sm">
          <Link href={`/admin/assignments?schoolId=${schoolId}`}>
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
          <div className="w-full overflow-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Handed In On</TableHead>
                  <TableHead>Grade</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSubmissions.length > 0 ? (
                  filteredSubmissions.map((submission) => (
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
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                      No submissions found matching your filters.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
        <CardFooter>
          <div className="text-xs text-muted-foreground">
            Showing <strong>{filteredSubmissions.length}</strong> of{" "}
            <strong>{submissions.length}</strong> submissions.
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
