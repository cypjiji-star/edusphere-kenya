
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Calendar, PlusCircle } from 'lucide-react';
import { TimetableBuilder } from './timetable-builder';
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

export default function TimetablePage() {
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
                        Define a new timetable for a specific academic term.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="timetable-name">Timetable Name</Label>
                        <Input id="timetable-name" placeholder="e.g., Term 2 Master Timetable" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="academic-term">Academic Term</Label>
                         <Select defaultValue="term2-2024">
                            <SelectTrigger id="academic-term">
                                <SelectValue placeholder="Select term" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="term2-2024">Term 2, 2024</SelectItem>
                                <SelectItem value="term3-2024">Term 3, 2024 (Upcoming)</SelectItem>
                            </SelectContent>
                         </Select>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="timetable-status">Status</Label>
                         <Select defaultValue="draft">
                            <SelectTrigger id="timetable-status">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="draft">Draft</SelectItem>
                                <SelectItem value="published">Published</SelectItem>
                            </SelectContent>
                         </Select>
                    </div>
                </div>
                <DialogFooter>
                    <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                    <Button>Create Timetable</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
      </div>

      <TimetableBuilder />
    </div>
  );
}
