
'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Library, ArrowRight, AlertTriangle, Gift } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { differenceInDays, parseISO } from 'date-fns';
import * as React from 'react';
import { firestore } from '@/lib/firebase';
import { collection, query, where, onSnapshot, orderBy, limit } from 'firebase/firestore';


type BorrowedItem = {
    id: string;
    title: string;
    dueDate: string;
};

type NewResource = {
    id: string;
    title: string;
}

export function LibraryNoticesWidget() {
  const [overdueItems, setOverdueItems] = React.useState<BorrowedItem[]>([]);
  const [newArrivals, setNewArrivals] = React.useState<NewResource[]>([]);
  const teacherId = 'teacher-wanjiku'; // Placeholder

  React.useEffect(() => {
    // Fetch overdue items
    const borrowedQuery = query(collection(firestore, 'users', teacherId, 'borrowed-items'));
    const unsubBorrowed = onSnapshot(borrowedQuery, (snapshot) => {
        const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BorrowedItem));
        const overdue = items.filter(item => {
            const dueDate = parseISO(item.dueDate);
            return differenceInDays(new Date(), dueDate) > 0;
        });
        setOverdueItems(overdue);
    });

    // Fetch new arrivals
    const newArrivalsQuery = query(collection(firestore, 'library-resources'), orderBy('createdAt', 'desc'), limit(2));
    const unsubArrivals = onSnapshot(newArrivalsQuery, (snapshot) => {
        const items = snapshot.docs.map(doc => ({ id: doc.id, title: doc.data().title } as NewResource));
        setNewArrivals(items);
    });

    return () => {
        unsubBorrowed();
        unsubArrivals();
    }
  }, [teacherId]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline text-lg flex items-center gap-2">
          <Library className="h-5 w-5 text-primary" />
          Library Notices
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {overdueItems.length > 0 && (
            <div className="space-y-3">
                {overdueItems.map((item, index) => (
                     <div key={index}>
                        <div className="flex items-start justify-between gap-4">
                            <div className="space-y-1">
                                <p className="font-semibold text-sm">{item.title}</p>
                                <div className="flex items-center gap-2 text-xs text-red-600">
                                    <AlertTriangle className="h-4 w-4" />
                                    <span>Due: {new Date(item.dueDate).toLocaleDateString()}</span>
                                </div>
                            </div>
                            <Button asChild size="sm" variant="secondary">
                                <Link href="/teacher/my-library">Return</Link>
                            </Button>
                        </div>
                     </div>
                ))}
                <Separator />
            </div>
          )}

          {newArrivals.map((item) => (
             <div key={item.id} className="flex items-center gap-3">
                <Gift className="h-5 w-5 text-blue-500" />
                <div className="flex-1">
                    <p className="text-sm text-muted-foreground">New Arrival: <span className="font-semibold text-foreground">{item.title}</span></p>
                </div>
             </div>
          ))}

          {overdueItems.length === 0 && newArrivals.length === 0 && (
            <div className="text-center text-muted-foreground py-4">
              <p>No new library notices.</p>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <Button asChild variant="outline" size="sm" className="w-full">
            <Link href="/teacher/library">
                Go to Library
                <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
