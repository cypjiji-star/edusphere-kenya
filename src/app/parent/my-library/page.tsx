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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  User,
  Book,
  Clock,
  History,
  RotateCw,
  PlusCircle,
  HelpCircle,
  CheckCircle,
  Printer,
  Users,
  Loader2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { firestore } from "@/lib/firebase";
import {
  collection,
  onSnapshot,
  query,
  addDoc,
  serverTimestamp,
  doc,
  updateDoc,
  where,
  Timestamp,
  getDocs,
  runTransaction,
  deleteDoc,
  getDoc,
} from "firebase/firestore";
import { useSearchParams } from "next/navigation";
import { Separator } from "@/components/ui/separator";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useAuth } from "@/context/auth-context";
import { Combobox } from "@/components/ui/combobox";

type BorrowedItem = {
  id: string;
  title: string;
  borrowedDate: Timestamp;
  dueDate: Timestamp;
  quantity: number;
};

type HistoryItem = {
  id: string;
  title: string;
  borrowedDate: Timestamp;
  returnedDate: Timestamp;
};

type RequestItem = {
  id: string;
  title: string;
  status: "Approved" | "Pending" | "Declined";
};

type StudentAssignment = {
  id: string;
  bookId: string;
  bookTitle: string;
  studentId: string;
  studentName: string;
  teacherId: string;
  teacherName: string;
  assignedDate: Timestamp;
  status: "Assigned" | "Returned" | "Pending Return";
};

type TeacherStudent = {
  id: string;
  name: string;
  classId: string;
  className: string;
};

type TeacherClass = {
  id: string;
  name: string;
};

type Child = {
    id: string;
    name: string;
    class: string;
    classId: string;
}

export default function MyLibraryPage() {
  const searchParams = useSearchParams();
  const schoolId = searchParams.get("schoolId");
  const [clientReady, setClientReady] = React.useState(false);
  const [borrowedItems, setBorrowedItems] = React.useState<BorrowedItem[]>([]);
  const [historyItems, setHistoryItems] = React.useState<HistoryItem[]>([]);
  const [requestItems, setRequestItems] = React.useState<RequestItem[]>([]);
  const [studentAssignments, setStudentAssignments] = React.useState<
    StudentAssignment[]
  >([]);
  const [newRequestTitle, setNewRequestTitle] = React.useState("");
  const { toast } = useToast();
  const { user } = useAuth();
  const [isHistoryLoading, setIsHistoryLoading] = React.useState(true);
  const [isRequestsLoading, setIsRequestsLoading] = React.useState(true);
  const [isAssignmentsLoading, setIsAssignmentsLoading] = React.useState(true);

  const [childrenData, setChildrenData] = React.useState<Child[]>([]);
  const [selectedChild, setSelectedChild] = React.useState<string | undefined>();
  const [studentMap, setStudentMap] = React.useState<
    Record<string, { className: string }>
  >({});
  
  const parentId = user?.uid;

  React.useEffect(() => {
    setClientReady(true);
    if (!schoolId || !user) return;
    const teacherId = user.uid;

    const borrowedQuery = query(
      collection(
        firestore,
        `schools/${schoolId}/users/${teacherId}/borrowed-items`,
      ),
    );
    const unsubBorrowed = onSnapshot(borrowedQuery, (snapshot) => {
      const items = snapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() }) as BorrowedItem,
      );
      setBorrowedItems(items);
    });

    setIsHistoryLoading(true);
    const historyQuery = query(
      collection(
        firestore,
        `schools/${schoolId}/users/${teacherId}/borrowing-history`,
      ),
    );
    const unsubHistory = onSnapshot(historyQuery, (snapshot) => {
      const items = snapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() }) as HistoryItem,
      );
      setHistoryItems(items);
      setIsHistoryLoading(false);
    });

    setIsRequestsLoading(true);
    const requestsQuery = query(
      collection(firestore, `schools/${schoolId}/library-requests`),
      where("requestedBy", "==", teacherId),
    );
    const unsubRequests = onSnapshot(requestsQuery, (snapshot) => {
      const items = snapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() }) as RequestItem,
      );
      setRequestItems(items);
      setIsRequestsLoading(false);
    });

    if (parentId) {
      const childrenQuery = query(
        collection(firestore, `schools/${schoolId}/users`),
        where("parentId", "==", parentId),
      );
      const unsubChildren = onSnapshot(childrenQuery, (snapshot) => {
        const children = snapshot.docs.map(doc => ({id: doc.id, ...doc.data()}) as Child);
        setChildrenData(children);
        if (children.length > 0 && !selectedChild) {
            setSelectedChild(children[0].id)
        }
      });
      return () => unsubChildren();
    }


    return () => {
      unsubBorrowed();
      unsubHistory();
      unsubRequests();
    };
  }, [schoolId, user, parentId, selectedChild]);


  React.useEffect(() => {
    if(!selectedChild) return;

    setIsAssignmentsLoading(true);
    const assignmentsQuery = query(
      collection(firestore, `schools/${schoolId}/student-assignments`),
      where("studentId", "==", selectedChild),
    );
    const unsubAssignments = onSnapshot(assignmentsQuery, (snapshot) => {
      const assignments = snapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() }) as StudentAssignment,
      );
      setStudentAssignments(assignments);
      setIsAssignmentsLoading(false);
    });

    return () => unsubAssignments();

  }, [schoolId, selectedChild]);


  const groupedAssignments = React.useMemo(() => {
    const byClass: Record<string, Record<string, StudentAssignment[]>> = {};
    studentAssignments.forEach((assignment) => {
      const studentInfo = studentMap[assignment.studentId];
      const className = studentInfo ? studentInfo.className : "Unknown Class";

      if (!byClass[className]) {
        byClass[className] = {};
      }
      if (!byClass[className][assignment.bookTitle]) {
        byClass[className][assignment.bookTitle] = [];
      }
      byClass[className][assignment.bookTitle].push(assignment);
    });
    return byClass;
  }, [studentAssignments, studentMap]);


  const handlePrintHistory = () => {
    const doc = new jsPDF();
    doc.text("My Library Borrowing History", 14, 16);

    const tableData = historyItems.map((item) => [
      item.title,
      item.borrowedDate.toDate().toLocaleDateString(),
      item.returnedDate.toDate().toLocaleDateString(),
    ]);

    (doc as any).autoTable({
      startY: 22,
      head: [["Title", "Borrowed Date", "Returned Date"]],
      body: tableData,
    });

    doc.save("my-library-history.pdf");

    toast({
      title: "History Exported",
      description: "Your borrowing history has been downloaded as a PDF.",
    });
  };

  const handleNewRequest = async () => {
    if (!newRequestTitle.trim() || !schoolId || !user) {
      toast({
        title: "Request is empty or user is not logged in.",
        variant: "destructive",
      });
      return;
    }

    try {
      await addDoc(
        collection(firestore, `schools/${schoolId}/library-requests`),
        {
          title: newRequestTitle,
          requestedBy: user.uid,
          status: "Pending",
          requestedAt: serverTimestamp(),
        },
      );

      setNewRequestTitle("");
      toast({
        title: "Request Submitted",
        description: "Your request has been sent to the librarian for review.",
      });
    } catch (error) {
      console.error("Error submitting request:", error);
      toast({ variant: "destructive", title: "Submission Failed" });
    }
  };


  if (!schoolId) {
    return <div className="p-8">Error: School ID is missing.</div>;
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="font-headline text-3xl font-bold flex items-center gap-2">
          <User className="h-8 w-8 text-primary" />
          My Library
        </h1>
        <p className="text-muted-foreground">
          View your child's library activity, including borrowed books and assignments.
        </p>
      </div>

    <div className="flex items-center gap-2 mb-6">
        <User className="h-5 w-5 text-primary" />
        <Select value={selectedChild} onValueChange={setSelectedChild}>
            <SelectTrigger className="w-full md:w-[240px]">
            <SelectValue placeholder="Select a child" />
            </SelectTrigger>
            <SelectContent>
            {childrenData.map((child) => (
                <SelectItem key={child.id} value={child.id}>
                {child.name}
                </SelectItem>
            ))}
            </SelectContent>
        </Select>
    </div>

      <Tabs defaultValue="assignments" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="assignments">Student Assignments</TabsTrigger>
          <TabsTrigger value="requests">My Requests</TabsTrigger>
        </TabsList>

        <TabsContent value="assignments" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Assigned Books</CardTitle>
              <CardDescription>
                Books assigned to your child by their teachers.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isAssignmentsLoading ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : studentAssignments.length > 0 ? (
                <div className="w-full overflow-auto rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Book Title</TableHead>
                        <TableHead>Assigned By</TableHead>
                        <TableHead>Date Assigned</TableHead>
                        <TableHead className="text-right">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {studentAssignments.map((assignment) => (
                        <TableRow key={assignment.id}>
                          <TableCell>{assignment.bookTitle}</TableCell>
                          <TableCell>{assignment.teacherName}</TableCell>
                          <TableCell>
                            {clientReady
                              ? assignment.assignedDate
                                  ?.toDate()
                                  .toLocaleDateString()
                              : ""}
                          </TableCell>
                          <TableCell className="text-right">
                          <Badge
                            variant={
                              assignment.status === "Assigned"
                                ? "secondary"
                                : "default"
                            }
                            className={
                              assignment.status === "Returned"
                                ? "bg-green-600"
                                : ""
                            }
                          >
                            {assignment.status}
                          </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                 <div className="text-center text-muted-foreground py-8">
                    <p>No books have been assigned to your child yet.</p>
                  </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="requests" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>My Resource Requests</CardTitle>
                <CardDescription>
                  Request new books or materials for the library.
                </CardDescription>
              </div>
              <Dialog>
                <DialogTrigger asChild>
                  <Button>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Make New Request
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Request New Library Resource</DialogTitle>
                    <DialogDescription>
                      Enter the title of the book or resource you would like to
                      request for the library.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="request-title">
                        Title & Author/Publisher
                      </Label>
                      <Input
                        id="request-title"
                        placeholder="e.g., Sapiens by Yuval Noah Harari"
                        value={newRequestTitle}
                        onChange={(e) => setNewRequestTitle(e.target.value)}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button variant="outline">Cancel</Button>
                    </DialogClose>
                    <DialogClose asChild>
                      <Button onClick={handleNewRequest}>Submit Request</Button>
                    </DialogClose>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {isRequestsLoading ? (
                <div className="flex h-40 items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : requestItems.length > 0 ? (
                <div className="space-y-4">
                  {requestItems.map((item) => (
                    <Card key={item.id}>
                      <CardContent className="p-4 flex items-center justify-between">
                        <p className="font-semibold">{item.title}</p>
                        <Badge
                          variant={
                            item.status === "Approved" ? "default" : "secondary"
                          }
                          className={
                            item.status === "Approved" ? "bg-green-600" : ""
                          }
                        >
                          {item.status === "Approved" ? (
                            <CheckCircle className="mr-2 h-4 w-4" />
                          ) : (
                            <HelpCircle className="mr-2 h-4 w-4" />
                          )}
                          {item.status}
                        </Badge>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="flex min-h-[200px] items-center justify-center rounded-lg border-2 border-dashed border-muted">
                  <div className="text-center">
                    <HelpCircle className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-4 text-lg font-semibold">
                      No Active Requests
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      You have not made any resource requests.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
