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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  CircleDollarSign,
  Search,
  PlusCircle,
  FileDown,
  Printer,
  ChevronDown,
  Loader2,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Wallet,
} from "lucide-react";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { firestore } from "@/lib/firebase";
import {
  collection,
  query,
  onSnapshot,
  where,
  Timestamp,
  doc,
  updateDoc,
  runTransaction,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/hooks/use-toast";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { Combobox } from "@/components/ui/combobox";

type StudentFeeInfo = {
  id: string;
  name: string;
  className: string;
  totalFee: number;
  amountPaid: number;
  balance: number;
  status: "Paid" | "Partial" | "Overdue";
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    minimumFractionDigits: 0,
  }).format(amount);
};

const getStatusBadge = (status: StudentFeeInfo["status"]) => {
  switch (status) {
    case "Paid":
      return <Badge className="bg-green-600 hover:bg-green-700">Paid</Badge>;
    case "Partial":
      return (
        <Badge className="bg-blue-500 hover:bg-blue-500">Partial Payment</Badge>
      );
    case "Overdue":
      return <Badge variant="destructive">Overdue</Badge>;
  }
};

export default function FeesPage() {
  const searchParams = useSearchParams();
  const schoolId = searchParams.get("schoolId");
  const { user } = useAuth();
  const { toast } = useToast();

  const [students, setStudents] = React.useState<StudentFeeInfo[]>([]);
  const [classes, setClasses] = React.useState<
    { id: string; name: string }[]
  >([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [classFilter, setClassFilter] = React.useState("All Classes");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // State for new payment dialog
  const [selectedStudentId, setSelectedStudentId] = React.useState("");
  const [paymentAmount, setPaymentAmount] = React.useState("");
  const [paymentMethod, setPaymentMethod] = React.useState("");
  const [paymentDate, setPaymentDate] = React.useState<Date | undefined>(
    new Date(),
  );

  React.useEffect(() => {
    if (!schoolId) {
      setIsLoading(false);
      return;
    }

    const studentsQuery = query(
      collection(firestore, `schools/${schoolId}/users`),
      where("role", "==", "Student"),
    );
    const unsubStudents = onSnapshot(studentsQuery, (snapshot) => {
      const studentData: StudentFeeInfo[] = snapshot.docs.map((doc) => {
        const data = doc.data();
        const totalFee = data.totalFee || 0;
        const amountPaid = data.amountPaid || 0;
        const balance = totalFee - amountPaid;
        return {
          id: doc.id,
          name: data.name,
          className: data.class,
          totalFee,
          amountPaid,
          balance,
          status:
            balance <= 0 ? "Paid" : amountPaid > 0 ? "Partial" : "Overdue",
        };
      });
      setStudents(studentData);
      setIsLoading(false);
    });

    const classQuery = query(
      collection(firestore, `schools/${schoolId}/classes`),
    );
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
    return students.filter(
      (s) =>
        (s.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.className?.toLowerCase().includes(searchTerm.toLowerCase())) &&
        (classFilter === "All Classes" || s.className === classFilter),
    );
  }, [students, searchTerm, classFilter]);

  const handleRecordPayment = async () => {
    if (
      !selectedStudentId ||
      !paymentAmount ||
      !paymentMethod ||
      !schoolId ||
      !user
    ) {
      toast({
        title: "Missing Information",
        description: "Please fill out all fields.",
        variant: "destructive",
      });
      return;
    }
    setIsSubmitting(true);
    const amount = Number(paymentAmount);
    const studentRef = doc(
      firestore,
      `schools/${schoolId}/users`,
      selectedStudentId,
    );

    try {
      await runTransaction(firestore, async (transaction) => {
        const studentDoc = await transaction.get(studentRef);
        if (!studentDoc.exists()) {
          throw new Error("Student does not exist!");
        }

        const studentData = studentDoc.data();
        const newAmountPaid = (studentData.amountPaid || 0) + amount;
        const newBalance = (studentData.totalFee || 0) - newAmountPaid;

        transaction.update(studentRef, {
          amountPaid: newAmountPaid,
          balance: newBalance,
        });

        const studentTransactionRef = doc(
          collection(studentRef, "transactions"),
        );
        transaction.set(studentTransactionRef, {
          date: paymentDate
            ? Timestamp.fromDate(paymentDate)
            : serverTimestamp(),
          description: "Fee Payment",
          type: "Payment",
          amount: -amount,
          balance: newBalance,
          recordedBy: user.displayName,
        });
      });
      toast({
        title: "Payment Recorded",
        description: "The student's fee record has been updated.",
      });
      setSelectedStudentId("");
      setPaymentAmount("");
      setPaymentMethod("");
    } catch (error) {
      console.error("Error recording payment:", error);
      toast({
        title: "Error",
        description: "Could not record the payment.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExport = (type: "PDF" | "CSV") => {
    if (type === "PDF") {
      const doc = new jsPDF();
      doc.text("Student Fee Balances", 14, 16);
      const tableData = filteredStudents.map((s) => [
        s.name,
        s.className,
        formatCurrency(s.totalFee),
        formatCurrency(s.amountPaid),
        formatCurrency(s.balance),
      ]);
      (doc as any).autoTable({
        head: [
          [
            "Student Name",
            "Class",
            "Total Billed",
            "Total Paid",
            "Balance",
          ],
        ],
        body: tableData,
        startY: 22,
      });
      doc.save("fee_balances.pdf");
    } else {
      // CSV logic here
    }
    toast({
      title: "Exporting Data",
      description: `Student fee data is being exported as a ${type} file.`,
    });
  };

  const dashboardStats = {
    totalRevenue: students.reduce((sum, s) => sum + s.amountPaid, 0),
    outstandingFees: students.reduce((sum, s) => sum + s.balance, 0),
    fullyPaid: students.filter((s) => s.status === "Paid").length,
    overdue: students.filter((s) => s.status === "Overdue").length,
  };

  if (!schoolId) {
    return <div className="p-8">Error: School ID is missing.</div>;
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="font-headline text-3xl font-bold flex items-center gap-2">
          <CircleDollarSign className="h-8 w-8 text-primary" />
          Fees &amp; Payments
        </h1>
        <p className="text-muted-foreground">
          Manage fee structures, track payments, and view student balances.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(dashboardStats.totalRevenue)}
            </div>
            <p className="text-xs text-muted-foreground">
              Total collected fees
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Outstanding Fees
            </CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {formatCurrency(dashboardStats.outstandingFees)}
            </div>
            <p className="text-xs text-muted-foreground">Across all students</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Fully Paid Students
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboardStats.fullyPaid}
            </div>
            <p className="text-xs text-muted-foreground">
              Students with zero balance
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Overdue Accounts
            </CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {dashboardStats.overdue}
            </div>
            <p className="text-xs text-muted-foreground">
              Students with overdue balances
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle>Student Fee Records</CardTitle>
              <CardDescription>
                A list of all students and their current fee status.
              </CardDescription>
            </div>
            <div className="flex w-full flex-col gap-2 md:w-auto md:flex-row">
              <Dialog>
                <DialogTrigger asChild>
                  <Button>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Record Payment
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Record a New Payment</DialogTitle>
                    <DialogDescription>
                      Log a new fee payment made by a student.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="py-4 space-y-4">
                    <div className="space-y-2">
                      <Label>Student</Label>
                      <Combobox
                        options={students.map((s) => ({
                          value: s.id,
                          label: `${s.name} (${s.className})`,
                        }))}
                        value={selectedStudentId}
                        onValueChange={setSelectedStudentId}
                        placeholder="Search for a student..."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="payment-amount">Amount (KES)</Label>
                      <Input
                        id="payment-amount"
                        type="number"
                        placeholder="e.g. 10000"
                        value={paymentAmount}
                        onChange={(e) => setPaymentAmount(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Payment Method</Label>
                      <Select
                        value={paymentMethod}
                        onValueChange={setPaymentMethod}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select method..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Bank Deposit">
                            Bank Deposit
                          </SelectItem>
                          <SelectItem value="M-PESA">M-PESA</SelectItem>
                          <SelectItem value="Cash">Cash</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button variant="outline">Cancel</Button>
                    </DialogClose>
                    <Button
                      onClick={handleRecordPayment}
                      disabled={isSubmitting}
                    >
                      {isSubmitting && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Record Payment
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    <FileDown className="mr-2 h-4 w-4" />
                    Export
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => handleExport("PDF")}>
                    Export as PDF
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExport("CSV")}>
                    Export as CSV
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          <div className="mt-4 flex flex-col md:flex-row md:items-center gap-4">
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
            <Select value={classFilter} onValueChange={setClassFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Filter by class..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All Classes">All Classes</SelectItem>
                {classes.map((c) => (
                  <SelectItem key={c.id} value={c.name}>
                    {c.name}
                  </SelectItem>
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
                    <TableHead>Class</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell className="font-medium">
                        {student.name}
                      </TableCell>
                      <TableCell>{student.className}</TableCell>
                      <TableCell>{getStatusBadge(student.status)}</TableCell>
                      <TableCell className="text-right font-semibold">
                        {formatCurrency(student.balance)}
                      </TableCell>
                    </TableRow>
                  ))}
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
    </div>
  );
}
