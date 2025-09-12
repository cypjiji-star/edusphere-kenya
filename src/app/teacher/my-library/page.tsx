
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
import { User, Book, Clock, History, RotateCw, PlusCircle, HelpCircle, CheckCircle, Printer } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

type BorrowedItem = {
    id: string;
    title: string;
    borrowedDate: string;
    dueDate: string;
};

const borrowedItems: BorrowedItem[] = [
    { id: 'borrow-1', title: 'The River and The Source Novel', borrowedDate: '2024-07-16', dueDate: '2024-07-30' },
];

const reservedItems: any[] = [];
const historyItems: any[] = [
     { id: 'hist-1', title: 'Physics for Secondary Schools F1', borrowedDate: '2024-06-10', returnedDate: '2024-06-24' },
];

const requestItems = [
    { id: 'req-1', title: 'A Brief History of Time by Stephen Hawking', status: 'Approved' },
    { id: 'req-2', title: 'Updated KCSE Revision Guides (2024)', status: 'Pending' },
]

export default function MyLibraryPage() {
    const [clientReady, setClientReady] = React.useState(false);

    React.useEffect(() => {
        setClientReady(true);
    }, []);
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
                                            <Button variant="outline" size="sm" disabled>
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
                         {reservedItems.length > 0 ? (
                            <div className="space-y-4">
                                {/* Reserved items would be listed here */}
                            </div>
                        ) : (
                            <div className="flex min-h-[200px] items-center justify-center rounded-lg border-2 border-dashed border-muted">
                                <div className="text-center">
                                    <Clock className="mx-auto h-12 w-12 text-muted-foreground" />
                                    <h3 className="mt-4 text-lg font-semibold">No Reservations</h3>
                                    <p className="mt-1 text-sm text-muted-foreground">You have no items currently on reserve.</p>
                                </div>
                            </div>
                        )}
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
                        <Button variant="outline" disabled>
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
                        <Button disabled>
                            <PlusCircle className="mr-2 h-4 w-4"/>
                            Make New Request
                        </Button>
                    </CardHeader>
                    <CardContent>
                         {requestItems.length > 0 ? (
                            <div className="space-y-4">
                                {requestItems.map(item => (
                                     <Card key={item.id}>
                                        <CardContent className="p-4 flex items-center justify-between">
                                            <p className="font-semibold">{item.title}</p>
                                            <Badge variant={item.status === 'Approved' ? 'default' : 'secondary'}>
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
