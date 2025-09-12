
'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Library, ArrowRight, AlertTriangle, Gift } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

const overdueItems = [
  {
    title: 'The River and The Source Novel',
    dueDate: '2 days ago',
    href: '/teacher/my-library'
  },
];

const newArrivals = [
    {
        title: 'New KCSE Chemistry Revision Papers (2024 Edition)',
        href: '/teacher/library'
    }
]

export function LibraryNoticesWidget() {
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
                                    <span>Overdue - Due {item.dueDate}</span>
                                </div>
                            </div>
                            <Button asChild size="sm" variant="secondary">
                                <Link href={item.href}>Return</Link>
                            </Button>
                        </div>
                     </div>
                ))}
                <Separator />
            </div>
          )}

          {newArrivals.map((item, index) => (
             <div key={index} className="flex items-center gap-3">
                <Gift className="h-5 w-5 text-blue-500" />
                <div className="flex-1">
                    <p className="text-sm font-medium text-muted-foreground">New Arrival: <span className="font-semibold text-foreground">{item.title}</span></p>
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
