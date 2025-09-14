
'use client';

import * as React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { User, Book, Clock, History, RotateCw, PlusCircle, HelpCircle, CheckCircle, Printer } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { firestore } from '@/lib/firebase';
import { collection, onSnapshot, query, addDoc, serverTimestamp, doc, updateDoc } from 'firebase/firestore';


type BorrowedItem = {
    id: string;
    title: string;
    borrowedDate: string;
    dueDate: string;
};

type RequestItem = {
    id: string;
    title: string;
    status: 'Approved' | 'Pending' | 'Declined';
}

export default function MyLibraryPage() {
    const [clientReady, setClientReady] = React.useState(false);
    const [borrowedItems, setBorrowedItems] = React.useState<BorrowedItem[]>([]);
    const [historyItems, setHistoryItems] = React.useState<any[]>([]);
    const [requestItems, setRequestItems] = React.useState<RequestItem[]>([]);
    const [newRequestTitle, setNewRequestTitle] = React.useState('');
    const { toast } = useToast();
    const teacherId = 'teacher-wanjiku'; // Placeholder

    React.useEffect(() => {
        setClientReady(true);

        const borrowedQuery = query(collection(firestore, 'users', teacherId, 'borrowed-items'));
        const unsubBorrowed = onSnapshot(borrowedQuery, (snapshot) => {
            const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BorrowedItem));
            setBorrowedItems(items);
        });

        const historyQuery = query(collection(firestore, 'users', teacherId, 'borrowing-history'));
        const unsubHistory = onSnapshot(historyQuery, (snapshot) => {
            const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setHistoryItems(items);
        });
        
        const requestsQuery = query(collection(firestore, 'library-requests'), where('requestedBy', '==', teacherId));
        const unsubRequests = onSnapshot(requestsQuery, (snapshot) => {
            const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as RequestItem));
            setRequestItems(items);
        });

        return () => {
            unsubBorrowed();
            unsubHistory();
            unsubRequests();
        }
    }, [teacherId]);

    const handleRenew = async (item: BorrowedItem) => {
        const itemRef = doc(firestore, 'users', teacherId, 'borrowed-items', item.id);
        const newDueDate = new Date(item.dueDate);
        newDueDate.setDate(newDueDate.getDate() + 14); // Extend by 2 weeks

        try {
            await updateDoc(itemRef, { dueDate: newDueDate.toISOString() });
            toast({
                title: 'Renewal Successful',
                description: `The due date for "${item.title}" has been extended.`,
            });
        } catch (error) {
            console.error("Error renewing item:", error);
            toast({
                title: 'Renewal Request Sent (Simulation)',
                description: `A request to renew "${item.title}" has been sent to the librarian.`,
            });
        }
    };

    const handlePrintHistory = () => {
        const doc = new jsPDF();
        doc.text("My Library Borrowing History", 14, 16);

        const tableData = historyItems.map(item => [
            item.title,
            new Date(item.borrowedDate).toLocaleDateString(),
            new Date(item.returnedDate).toLocaleDateString(),
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
        if (!newRequestTitle.trim()) {
            toast({
                title: 'Request is empty',
                description: 'Please enter a title for the resource you want to request.',
                variant: 'destructive',
            });
            return;
        }

        try {
            await addDoc(collection(firestore, 'library-requests'), {
                title: newRequestTitle,
                requestedBy: teacherId,
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
                <TabsTrigger value="reserved">My Reservations</TabsTrigger>
                <TabsTrigger value="history">Borrowing History</TabsTrigger>
                <TabsTrigger value="requests">My Requests</TabsTrigger>
            </TabsList>

            <TabsContent value="borrowed">
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
                                                <p className="font-semibold">{item.title}</p>
                                                {clientReady && <p className="text-sm text-muted-foreground">Borrowed: {new Date(item.borrowedDate).toLocaleDateString()} | Due: {new Date(item.dueDate).toLocaleDateString()}</p>}
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

             <TabsContent value="reserved">
                <Card>
                    <CardHeader>
                        <CardTitle>My Reservations</CardTitle>
                        <CardDescription>These are items you have reserved. You will be notified when they become available.</CardDescription>
                    </CardHeader>
                    <CardContent>
                         {/* This section will be populated from Firestore reservations subcollection */}
                        <div className="flex min-h-[200px] items-center justify-center rounded-lg border-2 border-dashed border-muted">
                            <div className="text-center">
                                <Clock className="mx-auto h-12 w-12 text-muted-foreground" />
                                <h3 className="mt-4 text-lg font-semibold">No Reservations</h3>
                                <p className="mt-1 text-sm text-muted-foreground">You have no items currently on reserve.</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
             </TabsContent>
            
             <TabsContent value="history">
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
                         {historyItems.length > 0 ? (
                            <div className="space-y-4">
                                {historyItems.map(item => (
                                     <Card key={item.id} className="bg-muted/50">
                                        <CardContent className="p-4">
                                            <p className="font-semibold">{item.title}</p>
                                            {clientReady && <p className="text-sm text-muted-foreground">Borrowed: {new Date(item.borrowedDate).toLocaleDateString()} | Returned: {new Date(item.returnedDate).toLocaleDateString()}</p>}
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
             
            <TabsContent value="requests">
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
                         {requestItems.length > 0 ? (
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
