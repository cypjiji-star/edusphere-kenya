

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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { User, Book, Clock, History, RotateCw, PlusCircle, HelpCircle, CheckCircle, Printer, Users, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { firestore } from '@/lib/firebase';
import { collection, onSnapshot, query, addDoc, serverTimestamp, doc, updateDoc, where, Timestamp, getDocs, runTransaction, deleteDoc, getDoc } from 'firebase/firestore';
import { useSearchParams } from 'next/navigation';
import { Separator } from '@/components/ui/separator';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useAuth } from '@/context/auth-context';
import { Combobox } from '@/components/ui/combobox';


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
    status: 'Approved' | 'Pending' | 'Declined';
}

type StudentAssignment = {
    id: string;
    bookId: string;
    bookTitle: string;
    studentId: string;
    studentName: string;
    teacherId: string;
    teacherName: string;
    assignedDate: Timestamp;
    status: 'Assigned' | 'Returned' | 'Pending Return';
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


export default function MyLibraryPage() {
    const searchParams = useSearchParams();
    const schoolId = searchParams.get('schoolId');
    const [clientReady, setClientReady] = React.useState(false);
    const [borrowedItems, setBorrowedItems] = React.useState<BorrowedItem[]>([]);
    const [historyItems, setHistoryItems] = React.useState<HistoryItem[]>([]);
    const [requestItems, setRequestItems] = React.useState<RequestItem[]>([]);
    const [studentAssignments, setStudentAssignments] = React.useState<StudentAssignment[]>([]);
    const [newRequestTitle, setNewRequestTitle] = React.useState('');
    const { toast } = useToast();
    const { user } = useAuth();
    const [isHistoryLoading, setIsHistoryLoading] = React.useState(true);
    const [isRequestsLoading, setIsRequestsLoading] = React.useState(true);
    const [isAssignmentsLoading, setIsAssignmentsLoading] = React.useState(true);

    const [teacherClasses, setTeacherClasses] = React.useState<TeacherClass[]>([]);
    const [allTeacherStudents, setAllTeacherStudents] = React.useState<TeacherStudent[]>([]);
    const [selectedClassForAssignment, setSelectedClassForAssignment] = React.useState<string>('');
    const [filteredStudentsForAssignment, setFilteredStudentsForAssignment] = React.useState<TeacherStudent[]>([]);
    const [selectedBookForAssignment, setSelectedBookForAssignment] = React.useState('');
    const [selectedStudentForAssignment, setSelectedStudentForAssignment] = React.useState('');
    const [studentMap, setStudentMap] = React.useState<Record<string, { className: string }>>({});

    React.useEffect(() => {
        if (!schoolId || !user) return;
        const teacherId = user.uid;

        setClientReady(true);

        const borrowedQuery = query(collection(firestore, `schools/${schoolId}/users/${teacherId}/borrowed-items`));
        const unsubBorrowed = onSnapshot(borrowedQuery, (snapshot) => {
            const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BorrowedItem));
            setBorrowedItems(items);
        });

        setIsHistoryLoading(true);
        const historyQuery = query(collection(firestore, `schools/${schoolId}/users/${teacherId}/borrowing-history`));
        const unsubHistory = onSnapshot(historyQuery, (snapshot) => {
            const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as HistoryItem));
            setHistoryItems(items);
            setIsHistoryLoading(false);
        });
        
        setIsRequestsLoading(true);
        const requestsQuery = query(collection(firestore, `schools/${schoolId}/library-requests`), where('requestedBy', '==', teacherId));
        const unsubRequests = onSnapshot(requestsQuery, (snapshot) => {
            const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as RequestItem));
            setRequestItems(items);
            setIsRequestsLoading(false);
        });

        const assignmentsQuery = query(collection(firestore, `schools/${schoolId}/student-assignments`), where('teacherId', '==', teacherId));
        const unsubAssignments = onSnapshot(assignmentsQuery, (snapshot) => {
            const assignments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as StudentAssignment));
            setStudentAssignments(assignments);
            setIsAssignmentsLoading(false);
        });

        // Fetch classes taught by the teacher
        const classesQuery = query(collection(firestore, `schools/${schoolId}/classes`), where('teacherId', '==', teacherId));
        const unsubClasses = onSnapshot(classesQuery, (snapshot) => {
            const classesData = snapshot.docs.map(doc => ({
                id: doc.id,
                name: `${doc.data().name} ${doc.data().stream || ''}`.trim()
            }));
            setTeacherClasses(classesData);
            if (classesData.length > 0 && !selectedClassForAssignment) {
                setSelectedClassForAssignment(classesData[0].id);
            }
        });
        
        return () => {
            unsubBorrowed();
            unsubHistory();
            unsubRequests();
            unsubAssignments();
            unsubClasses();
        }
    }, [schoolId, user, selectedClassForAssignment]);
    
     // Fetch all students from the teacher's classes
    React.useEffect(() => {
        if (teacherClasses.length === 0 || !schoolId) return;
        const classIds = teacherClasses.map(c => c.id);
        if(classIds.length === 0) return;

        const studentsQuery = query(collection(firestore, `schools/${schoolId}/users`), where('role', '==', 'Student'), where('classId', 'in', classIds));
        const unsubStudents = onSnapshot(studentsQuery, (snapshot) => {
            const students = snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    name: data.name,
                    classId: data.classId,
                    className: data.class,
                }
            });
            setAllTeacherStudents(students);
             const studentClassMap: Record<string, { className: string }> = {};
            students.forEach(student => {
                studentClassMap[student.id] = { className: student.className };
            });
            setStudentMap(studentClassMap);
        });
        return () => unsubStudents();
    }, [teacherClasses, schoolId]);

    const groupedAssignments = React.useMemo(() => {
        const byClass: Record<string, Record<string, StudentAssignment[]>> = {};
        studentAssignments.forEach(assignment => {
            const studentInfo = studentMap[assignment.studentId];
            const className = studentInfo ? studentInfo.className : 'Unknown Class';
            
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

    // Filter students when class selection changes
    React.useEffect(() => {
        if (selectedClassForAssignment) {
            setFilteredStudentsForAssignment(
                allTeacherStudents.filter(s => s.classId === selectedClassForAssignment)
            );
            setSelectedStudentForAssignment(''); // Reset student selection
        } else {
            setFilteredStudentsForAssignment([]);
        }
    }, [selectedClassForAssignment, allTeacherStudents]);

    const handleRenew = async (item: BorrowedItem) => {
        if (!schoolId || !user) return;
        const itemRef = doc(firestore, 'schools', schoolId, 'users', user.uid, 'borrowed-items', item.id);
        const newDueDate = new Date(item.dueDate.toDate());
        newDueDate.setDate(newDueDate.getDate() + 14); // Extend by 2 weeks

        try {
            await updateDoc(itemRef, { dueDate: Timestamp.fromDate(newDueDate) });
            toast({
                title: 'Renewal Successful',
                description: `The due date for "${item.title}" has been extended.`,
            });
        } catch (error) {
            console.error("Error renewing item:", error);
            toast({
                variant: 'destructive',
                title: 'Renewal Failed',
                description: 'Could not update the due date. Please contact the librarian.',
            });
        }
    };

    const handlePrintHistory = () => {
        const doc = new jsPDF();
        doc.text("My Library Borrowing History", 14, 16);

        const tableData = historyItems.map(item => [
            item.title,
            item.borrowedDate.toDate().toLocaleDateString(),
            item.returnedDate.toDate().toLocaleDateString(),
        ]);

        (doc as any).autoTable({
            startY: 22,
            head: [['Title', 'Borrowed Date', 'Returned Date']],
            body: tableData,
        });

        doc.save("my-library-history.pdf");

        toast({
            title: 'History Exported',
            description: 'Your borrowing history has been downloaded as a PDF.',
        });
    };
    
    const handleNewRequest = async () => {
        if (!newRequestTitle.trim() || !schoolId || !user) {
            toast({
                title: 'Request is empty or user is not logged in.',
                variant: 'destructive',
            });
            return;
        }

        try {
            await addDoc(collection(firestore, `schools/${schoolId}/library-requests`), {
                title: newRequestTitle,
                requestedBy: user.uid,
                status: 'Pending',
                requestedAt: serverTimestamp(),
            });

            setNewRequestTitle('');
            toast({
                title: 'Request Submitted',
                description: 'Your request has been sent to the librarian for review.',
            });
        } catch (error) {
            console.error("Error submitting request:", error);
            toast({ variant: 'destructive', title: 'Submission Failed' });
        }
    };

    const handleAssignBook = async () => {
        if (!selectedBookForAssignment || !selectedStudentForAssignment || !schoolId || !user) {
            toast({ variant: 'destructive', title: 'Please select a book and a student.' });
            return;
        }

        const book = borrowedItems.find(b => b.id === selectedBookForAssignment);
        const student = allTeacherStudents.find(s => s.id === selectedStudentForAssignment);

        if (!book || !student) return;
        if (book.quantity < 1) {
            toast({ variant: 'destructive', title: 'No copies available', description: `You have no available copies of "${book.title}" to assign.`});
            return;
        }
        
        try {
            await runTransaction(firestore, async (transaction) => {
                const teacherBorrowedItemRef = doc(firestore, 'schools', schoolId, 'users', user.uid, 'borrowed-items', book.id);

                // Create the new student assignment
                const newAssignmentRef = doc(collection(firestore, `schools/${schoolId}/student-assignments`));
                transaction.set(newAssignmentRef, {
                    bookId: book.id,
                    bookTitle: book.title,
                    studentId: student.id,
                    studentName: student.name,
                    teacherId: user.uid,
                    teacherName: user.displayName || 'Teacher',
                    assignedDate: serverTimestamp(),
                    status: 'Assigned',
                });
                
                // Decrement the teacher's count of the book by exactly one
                const borrowedItemSnap = await transaction.get(teacherBorrowedItemRef);
                const currentQuantity = borrowedItemSnap.exists() ? borrowedItemSnap.data().quantity : 0;
                transaction.update(teacherBorrowedItemRef, {
                    quantity: currentQuantity - 1
                });
            });
            
            // Send notification to parent
            const studentDoc = await getDoc(doc(firestore, `schools/${schoolId}/users`, student.id));
            if(studentDoc.exists()) {
                const parentId = studentDoc.data().parentId;
                if(parentId) {
                    await addDoc(collection(firestore, `schools/${schoolId}/notifications`), {
                        title: 'New Book Assigned',
                        description: `Your child, ${student.name}, has been assigned the textbook "${book.title}".`,
                        createdAt: serverTimestamp(),
                        category: 'Academics',
                        href: `/parent/library?schoolId=${schoolId}`, // Placeholder link
                        userId: parentId,
                    });
                }
            }


            toast({
                title: 'Book Assigned',
                description: `"${book.title}" has been assigned to ${student.name}.`,
            });

            setSelectedBookForAssignment('');
            setSelectedStudentForAssignment('');

        } catch (error) {
            console.error("Error assigning book:", error);
            toast({ variant: 'destructive', title: 'Assignment Failed' });
        }
    };

    const handleConfirmReturn = async (assignment: StudentAssignment) => {
        if (!schoolId || !user) return;

        try {
            await runTransaction(firestore, async (transaction) => {
                const assignmentRef = doc(firestore, 'schools', schoolId, 'student-assignments', assignment.id);
                const teacherBorrowedItemRef = doc(firestore, `schools/${schoolId}/users/${assignment.teacherId}/borrowed-items`, assignment.bookId);
                
                const borrowedItemSnap = await transaction.get(teacherBorrowedItemRef);
                
                // Instead of deleting, update status to "Returned" to keep a record.
                transaction.update(assignmentRef, { status: 'Returned' });
                
                // Increment the teacher's book count
                if (borrowedItemSnap.exists()) {
                    transaction.update(teacherBorrowedItemRef, {
                        quantity: (borrowedItemSnap.data().quantity || 0) + 1
                    });
                } else {
                    // If the teacher's record was deleted for some reason, recreate it
                    transaction.set(teacherBorrowedItemRef, {
                        title: assignment.bookTitle,
                        quantity: 1,
                        // Other fields might be missing but quantity is most important here
                    });
                }
            });

            toast({
                title: 'Return Confirmed',
                description: `${assignment.bookTitle} has been returned and added back to your available copies.`,
            });
        } catch (error: any) {
            console.error("Error confirming return:", error);
            toast({ title: 'Confirmation Failed', description: error.message, variant: 'destructive' });
        }
    };
    
    if (!schoolId) {
        return <div className="p-8">Error: School ID is missing.</div>
    }


  return (
    <div className="p-4 sm:p-6 lg:p-8">
       <div className="mb-6">
          <h1 className="font-headline text-3xl font-bold flex items-center gap-2">
            <User className="h-8 w-8 text-primary" />
            My Library
          </h1>
          <p className="text-muted-foreground">Manage your borrowed books, reservations, and view your borrowing history.</p>
        </div>

        <Tabs defaultValue="borrowed" className="w-full">
            <TabsList className="grid w-full grid-cols-4 md:w-auto md:inline-flex">
                <TabsTrigger value="borrowed">Currently Borrowed</TabsTrigger>
                <TabsTrigger value="assignments">Student Assignments</TabsTrigger>
                <TabsTrigger value="history">Borrowing History</TabsTrigger>
                <TabsTrigger value="requests">My Requests</TabsTrigger>
            </TabsList>

            <TabsContent value="borrowed" className="mt-4">
                <Card>
                    <CardHeader>
                        <CardTitle>Currently Borrowed Items</CardTitle>
                        <CardDescription>These are the items you have checked out from the library.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {borrowedItems.length > 0 ? (
                            <div className="space-y-4">
                                {borrowedItems.map(item => (
                                    <Card key={item.id}>
                                        <CardContent className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                            <div>
                                                <div className="font-semibold">{item.title} <Badge variant="secondary">{item.quantity} copies</Badge></div>
                                                {clientReady && <p className="text-sm text-muted-foreground">Borrowed: {item.borrowedDate.toDate().toLocaleDateString()} | Due: {item.dueDate.toDate().toLocaleDateString()}</p>}
                                            </div>
                                            <Button variant="outline" size="sm" onClick={() => handleRenew(item)}>
                                                <RotateCw className="mr-2 h-4 w-4" />
                                                Renew
                                            </Button>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        ) : (
                             <div className="flex min-h-[200px] items-center justify-center rounded-lg border-2 border-dashed border-muted">
                                <div className="text-center">
                                    <Book className="mx-auto h-12 w-12 text-muted-foreground" />
                                    <h3 className="mt-4 text-lg font-semibold">No Borrowed Items</h3>
                                    <p className="mt-1 text-sm text-muted-foreground">You have not borrowed any items from the library.</p>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="assignments" className="mt-4">
                <Card>
                    <CardHeader>
                        <CardTitle>Assign Books to Students</CardTitle>
                        <CardDescription>Distribute the books you have borrowed to students in your class.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                         <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border rounded-lg">
                            <div className="space-y-2">
                                <Label>Select Class</Label>
                                <Combobox
                                    options={teacherClasses.map(c => ({ value: c.id, label: c.name }))}
                                    value={selectedClassForAssignment}
                                    onValueChange={setSelectedClassForAssignment}
                                    placeholder="Select a class..."
                                    emptyMessage="No classes found."
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Select Student</Label>
                                <Combobox
                                    options={filteredStudentsForAssignment.map(student => ({ value: student.id, label: student.name }))}
                                    value={selectedStudentForAssignment}
                                    onValueChange={setSelectedStudentForAssignment}
                                    placeholder="Select a student..."
                                    emptyMessage="No students in this class."
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Select Book</Label>
                                <Combobox
                                    options={borrowedItems.map(item => ({ value: item.id, label: `${item.title} (${item.quantity} available)` }))}
                                    value={selectedBookForAssignment}
                                    onValueChange={setSelectedBookForAssignment}
                                    placeholder="Select a borrowed book..."
                                    emptyMessage="No borrowed books."
                                />
                            </div>
                            <Button onClick={handleAssignBook} className="self-end" disabled={!selectedBookForAssignment || !selectedStudentForAssignment}>
                                <Users className="mr-2 h-4 w-4" />
                                Assign to Student
                            </Button>
                        </div>
                        
                        <Separator />

                        <div>
                            <h3 className="font-semibold mb-2">Current Assignments</h3>
                             {isAssignmentsLoading ? (
                                <div className="flex items-center justify-center p-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
                            ) : Object.keys(groupedAssignments).length > 0 ? (
                                <Accordion type="single" collapsible className="w-full">
                                    {Object.entries(groupedAssignments).map(([className, books]) => (
                                        <AccordionItem key={className} value={className}>
                                            <AccordionTrigger className="text-lg font-semibold">{className}</AccordionTrigger>
                                            <AccordionContent>
                                                <Accordion type="single" collapsible className="w-full pl-4">
                                                    {Object.entries(books).map(([bookTitle, assignments]) => (
                                                        <AccordionItem key={bookTitle} value={bookTitle}>
                                                            <AccordionTrigger>{bookTitle} ({assignments.length} copies assigned)</AccordionTrigger>
                                                            <AccordionContent>
                                                                <Table>
                                                                    <TableHeader><TableRow><TableHead>Student</TableHead><TableHead>Date Assigned</TableHead><TableHead className="text-right">Status</TableHead></TableRow></TableHeader>
                                                                    <TableBody>
                                                                        {assignments.map(assignment => (
                                                                            <TableRow key={assignment.id}>
                                                                                <TableCell>{assignment.studentName}</TableCell>
                                                                                <TableCell>{clientReady ? assignment.assignedDate?.toDate().toLocaleDateString() : ''}</TableCell>
                                                                                <TableCell className="text-right">
                                                                                    {assignment.status === 'Assigned' ? (
                                                                                        <Button variant="outline" size="sm" onClick={() => handleConfirmReturn(assignment)}>Confirm Return</Button>
                                                                                    ) : (
                                                                                        <Badge variant="default" className="bg-green-600">Returned</Badge>
                                                                                    )}
                                                                                </TableCell>
                                                                            </TableRow>
                                                                        ))}
                                                                    </TableBody>
                                                                </Table>
                                                            </AccordionContent>
                                                        </AccordionItem>
                                                    ))}
                                                </Accordion>
                                            </AccordionContent>
                                        </AccordionItem>
                                    ))}
                                </Accordion>
                            ) : (
                                <div className="text-center text-muted-foreground py-8">
                                    <p>No books have been assigned to students yet.</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>

             <TabsContent value="history" className="mt-4">
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>Borrowing History</CardTitle>
                            <CardDescription>A log of all the items you have previously borrowed.</CardDescription>
                        </div>
                        <Button variant="outline" onClick={handlePrintHistory}>
                            <Printer className="mr-2 h-4 w-4" />
                            Print History
                        </Button>
                    </CardHeader>
                    <CardContent>
                         {isHistoryLoading ? (
                            <div className="flex h-40 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
                         ) : historyItems.length > 0 ? (
                            <div className="space-y-4">
                                {historyItems.map(item => (
                                     <Card key={item.id} className="bg-muted/50">
                                        <CardContent className="p-4">
                                            <div className="font-semibold">{item.title}</div>
                                            {clientReady && item.borrowedDate && item.returnedDate && <p className="text-sm text-muted-foreground">Borrowed: {item.borrowedDate.toDate().toLocaleDateString()} | Returned: {item.returnedDate.toDate().toLocaleDateString()}</p>}
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        ) : (
                            <div className="flex min-h-[200px] items-center justify-center rounded-lg border-2 border-dashed border-muted">
                                <div className="text-center">
                                    <History className="mx-auto h-12 w-12 text-muted-foreground" />
                                    <h3 className="mt-4 text-lg font-semibold">No History</h3>
                                    <p className="mt-1 text-sm text-muted-foreground">Your borrowing history is empty.</p>
                                </div>
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
                            <CardDescription>Request new books or materials for the library.</CardDescription>
                        </div>
                        <Dialog>
                            <DialogTrigger asChild>
                                <Button>
                                    <PlusCircle className="mr-2 h-4 w-4"/>
                                    Make New Request
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Request New Library Resource</DialogTitle>
                                    <DialogDescription>
                                        Enter the title of the book or resource you would like to request for the library.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="request-title">Title & Author/Publisher</Label>
                                        <Input id="request-title" placeholder="e.g., Sapiens by Yuval Noah Harari" value={newRequestTitle} onChange={(e) => setNewRequestTitle(e.target.value)} />
                                    </div>
                                </div>
                                <DialogFooter>
                                    <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                                    <DialogClose asChild><Button onClick={handleNewRequest}>Submit Request</Button></DialogClose>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </CardHeader>
                    <CardContent>
                        {isRequestsLoading ? (
                             <div className="flex h-40 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
                        ) : requestItems.length > 0 ? (
                            <div className="space-y-4">
                                {requestItems.map(item => (
                                     <Card key={item.id}>
                                        <CardContent className="p-4 flex items-center justify-between">
                                            <p className="font-semibold">{item.title}</p>
                                            <Badge variant={item.status === 'Approved' ? 'default' : 'secondary'} className={item.status === 'Approved' ? 'bg-green-600' : ''}>
                                                {item.status === 'Approved' ? <CheckCircle className="mr-2 h-4 w-4"/> : <HelpCircle className="mr-2 h-4 w-4"/>}
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
                                    <h3 className="mt-4 text-lg font-semibold">No Active Requests</h3>
                                    <p className="mt-1 text-sm text-muted-foreground">You have not made any resource requests.</p>
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
