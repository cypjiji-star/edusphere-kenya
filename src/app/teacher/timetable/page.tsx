

'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Calendar, PlusCircle } from 'lucide-react';
import { TimetableBuilder } from '@/app/admin/timetable/timetable-builder';
import { Button } from '@/components/ui/button';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import * as React from 'react';
import { useToast } from '@/hooks/use-toast';
import { useSearchParams } from 'next/navigation';
import { firestore } from '@/lib/firebase';
import { doc, setDoc } from 'firebase/firestore';

export default function TimetablePage() {
    const currentYear = new Date().getFullYear();
    const academicYears = Array.from({ length: 5 }, (_, i) => (currentYear + i).toString());
    const searchParams = useSearchParams();
    const schoolId = searchParams.get('schoolId');
    const { toast } = useToast();
    const [timetableName, setTimetableName] = React.useState('');
    const [academicYear, setAcademicYear] = React.useState(currentYear.toString());

    const handleCreateTimetable = async () => {
        if (!schoolId || !timetableName || !academicYear) {
            toast({ title: "Missing Information", description: "Please provide a name and year.", variant: "destructive" });
            return;
        }

        try {
            const timetableId = `${timetableName.replace(/\s+/g, '-')}-${academicYear}`;
            const timetableRef = doc(firestore, 'schools', schoolId, 'timetables', timetableId);
            await setDoc(timetableRef, { name: timetableName, year: academicYear, createdAt: new Date() });
            toast({ title: "Timetable Created", description: `You can now manage "${timetableName}".` });
            setTimetableName('');
        } catch (e) {
            console.error("Error creating timetable:", e);
            toast({ title: "Creation Failed", variant: "destructive" });
        }
    };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6 flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="font-headline text-3xl font-bold flex items-center gap-2">
              <Calendar className="h-8 w-8 text-primary"/>
              Timetable Management
          </h1>
          <p className="text-muted-foreground">Create and manage school-wide class and teacher timetables.</p>
        </div>
        <Dialog>
            <DialogTrigger asChild>
                <Button>
                    <PlusCircle className="mr-2"/>
                    Create New Timetable
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Create New Timetable</DialogTitle>
                    <DialogDescription>
                        Define a new timetable for a specific academic year.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="timetable-name">Timetable Name</Label>
                        <Input id="timetable-name" placeholder="e.g., 2024 Master Timetable" value={timetableName} onChange={e => setTimetableName(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="academic-year">Academic Year</Label>
                         <Select value={academicYear} onValueChange={setAcademicYear}>
                            <SelectTrigger id="academic-year">
                                <SelectValue placeholder="Select year" />
                            </SelectTrigger>
                            <SelectContent>
                                {academicYears.map(year => (
                                    <SelectItem key={year} value={year}>{year}</SelectItem>
                                ))}
                            </SelectContent>
                         </Select>
                    </div>
                </div>
                <DialogFooter>
                    <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                    <DialogClose asChild>
                        <Button onClick={handleCreateTimetable}>Create Timetable</Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
      </div>

      <TimetableBuilder />
    </div>
  );
}
