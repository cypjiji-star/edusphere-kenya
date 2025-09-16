
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
import { Library, Search, PlusCircle, Book, FileText, Newspaper, Upload, Edit, Trash2, Loader2, Filter, ChevronDown, FileDown, Printer, AlertTriangle, User, Hand, CheckCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { firestore } from '@/lib/firebase';
import { collection, onSnapshot, query, addDoc, serverTimestamp, doc, updateDoc, deleteDoc, writeBatch, getDoc, Timestamp, setDoc, getDocs, runTransaction, where } from 'firebase/firestore';
import { useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import type { Resource, ResourceType, ResourceStatus } from '@/app/teacher/library/types';
import { MultiSelect } from '@/components/ui/multi-select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const resourceTypes: ResourceType[] = ['Textbook', 'Past Paper', 'Curriculum Guide', 'Journal'];
const statuses: ResourceStatus[] = ['Available', 'Out', 'Digital'];

type StudentAssignment = {
    id: string;
    bookTitle: string;
    studentId: string;
    studentName: string;
    teacherId: string;
    teacherName: string;
    assignedDate: Timestamp;
    status: 'Assigned' | 'Returned' | 'Pending Return';
};

const typeIcons: Record<Resource['type'], React.ElementType> = {
  Textbook: Book,
  'Past Paper': FileText,
  'Curriculum Guide': Newspaper,
  Journal: Newspaper,
};

const getStatusBadge = (resource: Resource) => {
    if (resource.type === 'Digital') {
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Digital</Badge>;
    }
    if (resource.availableCopies === 0) {
        const borrower = resource.borrowedBy?.[0]?.teacherName || 'a teacher';
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Out with {borrower}</Badge>;
    }
    return <Badge className="bg-green-100 text-green-800 border-green-200">Available ({resource.availableCopies}/{resource.totalCopies})</Badge>;
}

function CheckOutDialog({ resource, open, onOpenChange, users, onCheckOut }: { resource: Resource | null, open: boolean, onOpenChange: (open: boolean) => void, users: {id: string, name: string}[], onCheckOut: (userId: string, userName: string, quantity: number) => void }) {
    const [quantity, setQuantity] = React.useState(1);
    const [selectedUser, setSelectedUser] = React.useState<string>('');

    React.useEffect(() => {
        setQuantity(1);
        setSelectedUser('');
    }, [open]);

    if (!resource) return null;

    const handleCheckOut = () => {
        if (!selectedUser) {
            alert("Please select a user to check out the book to.");
            return;
        }
        if (quantity > resource.availableCopies) {
            alert("Cannot check out more copies than available.");
            return;
        }
        const user = users.find(u => u.id === selectedUser);
        if(user) {
            onCheckOut(user.id, user.name, quantity);
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Check Out: {resource.title}</DialogTitle>
                    <DialogDescription>
                        Issue this resource to a student or teacher.
                        <span className="font-semibold text-foreground block mt-2">
                           {resource.availableCopies} copies available.
                        </span>
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="checkout-user">Borrower</Label>
                         <Select value={selectedUser} onValueChange={setSelectedUser}>
                            <SelectTrigger id="checkout-user">
                                <SelectValue placeholder="Select a student or teacher..." />
                            </SelectTrigger>
                            <SelectContent>
                                {users.map(user => (
                                    <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="checkout-quantity">Number of Copies</Label>
                        <Input
                            id="checkout-quantity"
                            type="number"
                            min={1}
                            max={resource.availableCopies}
                            value={quantity}
                            onChange={(e) => setQuantity(Number(e.target.value))}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                    <Button onClick={handleCheckOut} disabled={quantity <= 0 || quantity > resource.availableCopies || !selectedUser}>
                        Confirm Check Out
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

function EditResourceDialog({ resource, open, onOpenChange, onSave, onDelete }: { resource: Resource | null, open: boolean, onOpenChange: (open: boolean) => void, onSave: (id: string, data: Partial<Resource>) => void, onDelete: (id: string) => void }) {
    const [title, setTitle] = React.useState('');
    const [author, setAuthor] = React.useState('');
    const [description, setDescription] = React.useState('');
    const [totalCopies, setTotalCopies] = React.useState(0);
    
    React.useEffect(() => {
        if (resource) {
            setTitle(resource.title);
            setAuthor(resource.author);
            setDescription(resource.description);
            setTotalCopies(resource.totalCopies || 0);
        }
    }, [resource]);
    
    if (!resource) return null;

    const handleSave = () => {
        // When increasing total copies, we must also increase available copies
        const diff = totalCopies - (resource.totalCopies || 0);
        const newAvailableCopies = (resource.availableCopies || 0) + diff;

        onSave(resource.id, { title, author, description, totalCopies, availableCopies: newAvailableCopies });
        onOpenChange(false);
    };

    return (
         <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle>Edit Resource: {resource.title}</DialogTitle>
                </DialogHeader>
                 <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="edit-title">Title</Label>
                        <Input id="edit-title" value={title} onChange={(e) => setTitle(e.target.value)} />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="edit-author">Author/Publisher</Label>
                        <Input id="edit-author" value={author} onChange={(e) => setAuthor(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="edit-copies">Total Copies</Label>
                        <Input id="edit-copies" type="number" value={totalCopies} onChange={(e) => setTotalCopies(Number(e.target.value))} />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="edit-desc">Description</Label>
                        <Textarea id="edit-desc" value={description} onChange={(e) => setDescription(e.target.value)} />
                    </div>
                </div>
                <DialogFooter className="justify-between">
                     <Button variant="destructive" onClick={() => { onDelete(resource.id); onOpenChange(false); }}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete Resource
                    </Button>
                    <div>
                        <Button variant="outline" className="mr-2" onClick={() => onOpenChange(false)}>Cancel</Button>
                        <Button onClick={handleSave}>Save Changes</Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export default function AdminLibraryPage() {
    const searchParams = useSearchParams();
    const schoolId = searchParams.get('schoolId');
    const [resources, setResources] = React.useState<Resource[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [searchTerm, setSearchTerm] = React.useState('');
    const [filteredType, setFilteredType] = React.useState('All Types');
    const [filteredSubject, setFilteredSubject] = React.useState('All Subjects');
    const [filteredStatus, setFilteredStatus] = React.useState('All Statuses');
    const [editingResource, setEditingResource] = React.useState<Resource | null>(null);
    const [checkingOutResource, setCheckingOutResource] = React.useState<Resource | null>(null);
    const { toast } = useToast();
    
    // State for new resource dialog
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const [newTitle, setNewTitle] = React.useState('');
    const [newAuthor, setNewAuthor] = React.useState('');
    const [newType, setNewType] = React.useState<ResourceType | undefined>();
    const [newSubject, setNewSubject] = React.useState<string | undefined>();
    const [newGrades, setNewGrades] = React.useState<string[]>([]);
    const [newCopies, setNewCopies] = React.useState('');
    const [newDesc, setNewDesc] = React.useState('');

    const [dbSubjects, setDbSubjects] = React.useState<string[]>([]);
    const [dbGrades, setDbGrades] = React.useState<string[]>([]);
    const [allUsers, setAllUsers] = React.useState<{id: string, name: string}[]>([]);
    
    // State for returns tab
    const [selectedReturnUser, setSelectedReturnUser] = React.useState<string>('');
    const [userBorrowedBooks, setUserBorrowedBooks] = React.useState<{id: string, title: string, quantity: number, bookId: string}[]>([]);
    const [selectedBookToReturn, setSelectedBookToReturn] = React.useState<string>('');
    const [returnQuantity, setReturnQuantity] = React.useState(1);
    const [isReturning, setIsReturning] = React.useState(false);

    // State for student assignments tab
    const [studentAssignments, setStudentAssignments] = React.useState<StudentAssignment[]>([]);
    const [studentMap, setStudentMap] = React.useState<Record<string, { className: string }>>({});


    React.useEffect(() => {
        if (!schoolId) {
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        const q = query(collection(firestore, `schools/${schoolId}/library-resources`));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setResources(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Resource)));
            setIsLoading(false);
        }, (error) => {
            console.error("Failed to fetch library resources: ", error);
            setIsLoading(false);
        });

        const subjectsQuery = query(collection(firestore, `schools/${schoolId}/subjects`));
        const unsubSubjects = onSnapshot(subjectsQuery, (snapshot) => {
            const subjectNames = snapshot.docs.map(doc => doc.data().name);
            setDbSubjects(subjectNames);
        });

        const classesQuery = query(collection(firestore, `schools/${schoolId}/classes`));
        const unsubClasses = onSnapshot(classesQuery, (snapshot) => {
            const gradeNames = snapshot.docs.map(doc => doc.data().name);
            setDbGrades([...new Set(gradeNames)]);
        });

        const usersQuery = query(collection(firestore, `schools/${schoolId}/users`));
        const unsubUsers = onSnapshot(usersQuery, (snapshot) => {
            const userNames = snapshot.docs.map(doc => ({id: doc.id, name: doc.data().name}));
            setAllUsers(userNames);
        });
        
        const fetchStudentsAndAssignments = async () => {
          const studentsQuery = query(collection(firestore, 'schools', schoolId, 'students'));
          const studentsSnap = await getDocs(studentsQuery);
          const studentData: Record<string, { className: string }> = {};
          studentsSnap.forEach(doc => {
            studentData[doc.id] = { className: doc.data().class };
          });
          setStudentMap(studentData);

          const studentAssignmentsQuery = query(collection(firestore, `schools/${schoolId}/student-assignments`));
          const unsubStudentAssignments = onSnapshot(studentAssignmentsQuery, (snapshot) => {
              const assignments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as StudentAssignment));
              setStudentAssignments(assignments);
          });
           return unsubStudentAssignments;
        }

        const unsubAssignmentsPromise = fetchStudentsAndAssignments();


        return () => {
            unsubscribe();
            unsubSubjects();
            unsubClasses();
            unsubUsers();
            unsubAssignmentsPromise.then(unsub => unsub());
        };
    }, [schoolId]);

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

    // Fetch borrowed books for the selected user
    React.useEffect(() => {
        if (!selectedReturnUser || !schoolId) {
            setUserBorrowedBooks([]);
            return;
        }

        const borrowedBooksQuery = query(collection(firestore, 'schools', schoolId, 'users', selectedReturnUser, 'borrowed-items'));
        const unsubscribe = onSnapshot(borrowedBooksQuery, (snapshot) => {
            const books = snapshot.docs.map(doc => ({
                id: doc.id,
                title: doc.data().title,
                quantity: doc.data().quantity || 1,
                bookId: doc.id, // The document ID is the book ID
            }));
            setUserBorrowedBooks(books);
        });

        return () => unsubscribe();
    }, [selectedReturnUser, schoolId]);
    
    const handleProcessReturn = async () => {
        if (!selectedReturnUser || !selectedBookToReturn || returnQuantity <= 0 || !schoolId) {
            toast({ title: 'Invalid return information', variant: 'destructive'});
            return;
        }

        setIsReturning(true);
        const bookToReturn = userBorrowedBooks.find(b => b.id === selectedBookToReturn);

        try {
            await runTransaction(firestore, async (transaction) => {
                if (!bookToReturn) throw new Error("Book to return not found");

                const resourceRef = doc(firestore, 'schools', schoolId, 'library-resources', bookToReturn.bookId);
                const userBorrowedItemRef = doc(firestore, 'schools', schoolId, 'users', selectedReturnUser, 'borrowed-items', bookToReturn.id);
                
                const resourceSnap = await transaction.get(resourceRef);
                const userItemSnap = await transaction.get(userBorrowedItemRef);

                if (!resourceSnap.exists() || !userItemSnap.exists()) {
                    throw new Error("Book or borrowed record not found.");
                }

                const resourceData = resourceSnap.data() as Resource;
                const userItemData = userItemSnap.data() as { quantity: number; title: string; borrowedDate: Timestamp };
                
                if (returnQuantity > userItemData.quantity) {
                    throw new Error("Cannot return more copies than were borrowed.");
                }

                // Update main inventory
                transaction.update(resourceRef, {
                    availableCopies: (resourceData.availableCopies || 0) + returnQuantity
                });
                
                // Update or delete user's borrowed record
                if (returnQuantity === userItemData.quantity) {
                    transaction.delete(userBorrowedItemRef);
                } else {
                    transaction.update(userBorrowedItemRef, {
                        quantity: userItemData.quantity - returnQuantity
                    });
                }
                
                // Add to user's history
                const historyRef = doc(collection(firestore, 'schools', schoolId, 'users', selectedReturnUser, 'borrowing-history'));
                transaction.set(historyRef, {
                    title: userItemData.title,
                    borrowedDate: userItemData.borrowedDate,
                    returnedDate: serverTimestamp(),
                });
            });

            toast({ title: 'Return Processed', description: 'Inventory has been updated.'});
            setSelectedBookToReturn('');
            setReturnQuantity(1);

        } catch (error: any) {
            console.error("Error processing return:", error);
            toast({ title: 'Return Failed', description: error.message, variant: 'destructive'});
        } finally {
            setIsReturning(false);
        }
    };
    
    const handleConfirmReturn = async (assignment: StudentAssignment) => {
        if (!schoolId) return;

        try {
            await runTransaction(firestore, async (transaction) => {
                const assignmentRef = doc(firestore, 'schools', schoolId, 'student-assignments', assignment.id);
                const resourceQuery = query(collection(firestore, `schools/${schoolId}/library-resources`), where('title', '==', assignment.bookTitle));
                const resourceSnapshot = await getDocs(resourceQuery);

                if (resourceSnapshot.empty) {
                    throw new Error(`Book "${assignment.bookTitle}" not found in library.`);
                }
                const resourceDoc = resourceSnapshot.docs[0];
                const resourceRef = resourceDoc.ref;
                const resourceData = resourceDoc.data() as Resource;
                
                // Update assignment status
                transaction.update(assignmentRef, { status: 'Returned' });

                // Update inventory
                transaction.update(resourceRef, { availableCopies: (resourceData.availableCopies || 0) + 1 });

                // Update teacher's borrowed count (optional, but good for consistency)
                const teacherBorrowedItemRef = doc(firestore, `schools/${schoolId}/users/${assignment.teacherId}/borrowed-items`, resourceDoc.id);
                const teacherItemSnap = await transaction.get(teacherBorrowedItemRef);
                if (teacherItemSnap.exists()) {
                    const currentQuantity = teacherItemSnap.data().quantity;
                    if (currentQuantity > 1) {
                        transaction.update(teacherBorrowedItemRef, { quantity: currentQuantity - 1 });
                    } else {
                        transaction.delete(teacherBorrowedItemRef);
                    }
                }
            });

            toast({
                title: 'Return Confirmed',
                description: `${assignment.bookTitle} has been returned to the library inventory.`,
            });
        } catch (error: any) {
            console.error("Error confirming return:", error);
            toast({ title: 'Confirmation Failed', description: error.message, variant: 'destructive' });
        }
    };

    const filteredResources = resources.filter(res => 
        res.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
        (filteredType === 'All Types' || res.type === filteredType) &&
        (filteredSubject === 'All Subjects' || res.subject === filteredSubject) &&
        (filteredStatus === 'All Statuses' || res.status === filteredStatus)
    );
    
    const dashboardStats = React.useMemo(() => {
        const total = resources.reduce((sum, res) => sum + (res.totalCopies || 0), 0);
        const available = resources.reduce((sum, res) => sum + (res.availableCopies || 0), 0);
        const out = total - available;
        const digital = resources.filter(r => r.type === 'Digital').length;
        const overdue = resources.filter(r => r.status === 'Out' && r.dueDate && new Date(r.dueDate) < new Date()).length;
        return { total, available, out, digital, overdue };
    }, [resources]);

    const resetForm = () => {
        setNewTitle('');
        setNewAuthor('');
        setNewType(undefined);
        setNewSubject(undefined);
        setNewGrades([]);
        setNewDesc('');
        setNewCopies('');
    };

    const handleAddResource = async () => {
        if (!schoolId || !newTitle || !newAuthor || !newType || !newSubject || newGrades.length === 0 || !newCopies) {
            toast({ title: "Missing Information", description: "Please fill out all fields.", variant: "destructive" });
            return;
        }
        const numCopies = Number(newCopies);

        setIsSubmitting(true);
        try {
            await addDoc(collection(firestore, `schools/${schoolId}/library-resources`), {
                title: newTitle,
                author: newAuthor,
                type: newType,
                subject: newSubject,
                grade: newGrades,
                description: newDesc,
                totalCopies: numCopies,
                availableCopies: numCopies,
                status: newType === 'Digital' ? 'Digital' : 'Available',
                createdAt: serverTimestamp(),
            });
            toast({ title: "Resource Added", description: `"${newTitle}" has been added to the library.` });
            resetForm();
        } catch (error) {
            console.error("Error adding resource:", error);
            toast({ title: "Failed to add resource", variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const handleUpdateResource = async (id: string, data: Partial<Resource>) => {
        if (!schoolId) return;
        try {
            await updateDoc(doc(firestore, 'schools', schoolId, 'library-resources', id), data);
            toast({ title: "Resource Updated" });
        } catch (error) {
            toast({ title: "Update Failed", variant: "destructive" });
        }
    };
    
    const handleDeleteResource = async (id: string) => {
        if (!schoolId) return;
         if (!window.confirm("Are you sure you want to delete this resource? This cannot be undone.")) return;
        try {
            await deleteDoc(doc(firestore, 'schools', schoolId, 'library-resources', id));
            toast({ title: "Resource Deleted", variant: "destructive" });
        } catch (error) {
            toast({ title: "Deletion Failed", variant: "destructive" });
        }
    };

    const handleCheckOut = async (userId: string, userName: string, quantity: number) => {
        if (!schoolId || !checkingOutResource) return;
        
        const resourceRef = doc(firestore, `schools/${schoolId}/library-resources`, checkingOutResource.id);
        
        try {
            const newAvailableCopies = checkingOutResource.availableCopies - quantity;
            const newStatus = newAvailableCopies > 0 ? 'Available' : 'Out';

            const newBorrowedBy = [
                ...(checkingOutResource.borrowedBy || []), 
                { teacherId: userId, teacherName: userName, quantity: quantity }
            ];

            await updateDoc(resourceRef, { 
                availableCopies: newAvailableCopies,
                status: newStatus,
                borrowedBy: newBorrowedBy
            });

            const borrowedItemRef = doc(firestore, `schools/${schoolId}/users`, userId, 'borrowed-items', checkingOutResource.id);
            const dueDate = new Date();
            dueDate.setDate(dueDate.getDate() + 14); // 2 week loan period

            await setDoc(borrowedItemRef, {
                title: checkingOutResource.title,
                borrowedDate: serverTimestamp(),
                dueDate: Timestamp.fromDate(dueDate),
                quantity: quantity,
            }, { merge: true });

            toast({
                title: 'Item Checked Out',
                description: `${quantity} copies of "${checkingOutResource.title}" have been checked out to ${userName}.`,
            });
            setCheckingOutResource(null);
        } catch (error) {
            console.error("Error checking out item:", error);
            toast({ variant: 'destructive', title: 'Action Failed' });
        }
    };

    if (!schoolId) {
        return <div className="p-8">Error: School ID is missing.</div>
    }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between mb-6">
        <div className="text-left">
          <h1 className="font-headline text-3xl font-bold flex items-center gap-2">
            <Library className="h-8 w-8 text-primary" />
            Library Management
          </h1>
          <p className="text-muted-foreground">Oversee all library resources, borrowing, and inventory.</p>
        </div>
      </div>
      
       <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5 mb-6">
            <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Total Copies</CardTitle><Book className="h-4 w-4 text-muted-foreground"/></CardHeader><CardContent><div className="text-2xl font-bold">{dashboardStats.total}</div></CardContent></Card>
            <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Available Copies</CardTitle><Book className="h-4 w-4 text-muted-foreground"/></CardHeader><CardContent><div className="text-2xl font-bold">{dashboardStats.available}</div></CardContent></Card>
            <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Checked Out</CardTitle><Book className="h-4 w-4 text-muted-foreground"/></CardHeader><CardContent><div className="text-2xl font-bold">{dashboardStats.out}</div></CardContent></Card>
            <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Digital Copies</CardTitle><Book className="h-4 w-4 text-muted-foreground"/></CardHeader><CardContent><div className="text-2xl font-bold">{dashboardStats.digital}</div></CardContent></Card>
            <Card className="border-destructive/50"><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium text-destructive">Overdue</CardTitle><AlertTriangle className="h-4 w-4 text-destructive"/></CardHeader><CardContent><div className="text-2xl font-bold text-destructive">{dashboardStats.overdue}</div></CardContent></Card>
       </div>

        <Tabs defaultValue="inventory">
            <TabsList>
                <TabsTrigger value="inventory">Inventory</TabsTrigger>
                <TabsTrigger value="checkin">Check-in / Returns</TabsTrigger>
                <TabsTrigger value="student_assignments">Student Assignments</TabsTrigger>
            </TabsList>
            <TabsContent value="inventory" className="mt-4">
                 <Card>
                    <CardHeader>
                        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                            <div className="flex w-full items-center gap-2 md:max-w-sm">
                                <div className="relative w-full">
                                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input type="search" placeholder="Search by title, author..." className="w-full bg-background pl-8" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                                </div>
                            </div>
                            <div className="flex w-full flex-col gap-2 md:w-auto md:flex-row md:items-center">
                                <Select value={filteredType} onValueChange={setFilteredType}><SelectTrigger className="w-full md:w-[150px]"><SelectValue /></SelectTrigger><SelectContent>{['All Types', ...resourceTypes].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select>
                                <Select value={filteredSubject} onValueChange={setFilteredSubject}><SelectTrigger className="w-full md:w-[150px]"><SelectValue /></SelectTrigger><SelectContent>{['All Subjects', ...dbSubjects].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select>
                                <Select value={filteredStatus} onValueChange={setFilteredStatus}><SelectTrigger className="w-full md:w-[150px]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="All Statuses">All Statuses</SelectItem>{statuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select>
                            </div>
                            <div className="flex w-full md:w-auto items-center gap-2">
                                <Dialog>
                                    <DialogTrigger asChild><Button><PlusCircle className="mr-2"/>Add Resource</Button></DialogTrigger>
                                    <DialogContent className="sm:max-w-xl">
                                        <DialogHeader><DialogTitle>Add New Library Resource</DialogTitle><DialogDescription>Fill in the details for the new resource.</DialogDescription></DialogHeader>
                                        <div className="grid gap-6 py-4 max-h-[70vh] overflow-y-auto pr-4">
                                            <div className="space-y-2"><Label htmlFor="new-title">Title</Label><Input id="new-title" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} /></div>
                                            <div className="space-y-2"><Label htmlFor="new-author">Author / Publisher</Label><Input id="new-author" value={newAuthor} onChange={(e) => setNewAuthor(e.target.value)} /></div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label htmlFor="new-type">Type</Label>
                                                    <Select value={newType} onValueChange={(v: ResourceType) => setNewType(v)}>
                                                        <SelectTrigger id="new-type"><SelectValue placeholder="Select type..." /></SelectTrigger>
                                                        <SelectContent>{resourceTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="new-subject">Subject</Label>
                                                    <Select value={newSubject} onValueChange={setNewSubject}>
                                                        <SelectTrigger id="new-subject"><SelectValue placeholder="Select subject..." /></SelectTrigger>
                                                        <SelectContent>{dbSubjects.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                                                    </Select>
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Applicable Grades/Forms</Label>
                                                <MultiSelect options={dbGrades.map(g => ({value: g, label: g}))} selected={newGrades} onChange={setNewGrades} placeholder="Select grades..." />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="new-desc">Description</Label>
                                                <Textarea id="new-desc" value={newDesc} onChange={(e) => setNewDesc(e.target.value)} />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="new-copies">Number of Copies</Label>
                                                <Input id="new-copies" type="number" value={newCopies} onChange={(e) => setNewCopies(e.target.value)} placeholder="e.g., 10"/>
                                            </div>
                                        </div>
                                        <DialogFooter><DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose><Button onClick={handleAddResource} disabled={isSubmitting}>{isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Add Resource</Button></DialogFooter>
                                    </DialogContent>
                                </Dialog>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="flex h-64 items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>
                        ) : filteredResources.length > 0 ? (
                            <div className="w-full overflow-auto rounded-lg border">
                                <Table><TableHeader><TableRow><TableHead>Title</TableHead><TableHead>Type</TableHead><TableHead>Subject</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                                    <TableBody>
                                        {filteredResources.map((res) => {
                                            const Icon = typeIcons[res.type];
                                            return (
                                            <TableRow key={res.id}>
                                                <TableCell className="font-medium"><div className="flex items-center gap-3"><Icon className="h-5 w-5 text-primary/80 hidden sm:block" />{res.title}</div></TableCell>
                                                <TableCell>{res.type}</TableCell>
                                                <TableCell>{res.subject}</TableCell>
                                                <TableCell>{getStatusBadge(res)}</TableCell>
                                                <TableCell className="text-right space-x-1">
                                                    <Button variant="outline" size="sm" onClick={() => setCheckingOutResource(res)} disabled={res.availableCopies === 0}><Hand className="mr-2 h-4 w-4"/>Check Out</Button>
                                                    <Button variant="ghost" size="sm" onClick={() => setEditingResource(res)}><Edit className="mr-2 h-4 w-4" />Edit</Button>
                                                </TableCell>
                                            </TableRow>
                                        )})}
                                    </TableBody>
                                </Table>
                            </div>
                        ) : (
                            <div className="flex min-h-[300px] items-center justify-center rounded-lg border-2 border-dashed border-muted">
                                <div className="text-center text-muted-foreground">
                                    <Search className="mx-auto h-12 w-12" />
                                    <h3 className="mt-4 text-lg font-semibold">No Resources Found</h3>
                                    <p className="mt-1 text-sm">Your search or filters returned no results.</p>
                                </div>
                            </div>
                        )}
                    </CardContent>
                 </Card>
            </TabsContent>
            <TabsContent value="checkin" className="mt-4">
                 <Card>
                    <CardHeader>
                        <CardTitle>Process Book Returns</CardTitle>
                        <CardDescription>Select a user and the book they are returning.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Select User (Student or Teacher)</Label>
                                <Select value={selectedReturnUser} onValueChange={setSelectedReturnUser}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Search user by name..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {allUsers.map(user => (
                                            <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Select Book</Label>
                                <Select value={selectedBookToReturn} onValueChange={setSelectedBookToReturn} disabled={!selectedReturnUser || userBorrowedBooks.length === 0}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a book to return..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {userBorrowedBooks.map(book => (
                                            <SelectItem key={book.id} value={book.id}>{book.title} ({book.quantity} borrowed)</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="return-quantity">Quantity to Return</Label>
                            <Input id="return-quantity" type="number" placeholder="1" value={returnQuantity} onChange={e => setReturnQuantity(Number(e.target.value))} />
                        </div>
                         <Button onClick={handleProcessReturn} disabled={!selectedBookToReturn || returnQuantity <= 0 || isReturning}>
                            {isReturning && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                            Process Return
                        </Button>
                    </CardContent>
                 </Card>
            </TabsContent>
            <TabsContent value="student_assignments" className="mt-4">
                <Card>
                    <CardHeader>
                        <CardTitle>Student Book Assignments</CardTitle>
                        <CardDescription>Track books assigned to individual students by teachers, grouped by class.</CardDescription>
                    </CardHeader>
                    <CardContent>
                       <Accordion type="single" collapsible className="w-full">
                           {Object.entries(groupedAssignments).map(([className, books]) => (
                                <AccordionItem key={className} value={className}>
                                    <AccordionTrigger className="text-lg font-semibold">{className}</AccordionTrigger>
                                    <AccordionContent>
                                        <Accordion type="single" collapsible className="w-full pl-4">
                                             {Object.entries(books).map(([bookTitle, assignments]) => (
                                                 <AccordionItem key={bookTitle} value={bookTitle}>
                                                    <AccordionTrigger>{bookTitle} ({assignments.length} copies)</AccordionTrigger>
                                                    <AccordionContent>
                                                         <Table>
                                                            <TableHeader>
                                                                <TableRow>
                                                                    <TableHead>Student</TableHead>
                                                                    <TableHead>Assigned By</TableHead>
                                                                    <TableHead>Date</TableHead>
                                                                    <TableHead className="text-right">Status</TableHead>
                                                                </TableRow>
                                                            </TableHeader>
                                                            <TableBody>
                                                                {assignments.map(assignment => (
                                                                    <TableRow key={assignment.id}>
                                                                        <TableCell>{assignment.studentName}</TableCell>
                                                                        <TableCell>{assignment.teacherName}</TableCell>
                                                                        <TableCell>{assignment.assignedDate.toDate().toLocaleDateString()}</TableCell>
                                                                        <TableCell className="text-right">
                                                                            {assignment.status === 'Assigned' ? (
                                                                                <Badge variant="secondary">Assigned</Badge>
                                                                            ) : assignment.status === 'Pending Return' ? (
                                                                                <Button variant="outline" size="sm" onClick={() => handleConfirmReturn(assignment)}>
                                                                                    <CheckCircle className="mr-2 h-4 w-4 text-orange-500" />
                                                                                    Confirm Return
                                                                                </Button>
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
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
      <EditResourceDialog resource={editingResource} open={!!editingResource} onOpenChange={(open) => !open && setEditingResource(null)} onSave={handleUpdateResource} onDelete={handleDeleteResource} />
      <CheckOutDialog resource={checkingOutResource} open={!!checkingOutResource} users={allUsers} onOpenChange={(open) => !open && setCheckingOutResource(null)} onCheckOut={handleCheckOut} />
    </div>
  );
}
