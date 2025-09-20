
'use client';

import * as React from 'react';
import { format } from 'date-fns';
import { DateRange } from 'react-day-picker';
import { firestore } from '@/lib/firebase';
import { collection, query, onSnapshot, where, Timestamp, getDocs, orderBy, addDoc, serverTimestamp } from 'firebase/firestore';

import { cn } from '@/lib/utils';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Calendar } from '@/components/ui/calendar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  ClipboardCheck,
  CalendarIcon,
  User,
  Percent,
  UserCheck,
  UserX,
  AlertTriangle,
  ChevronDown,
  FileDown,
  Loader2,
} from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';


type AttendanceStatus = 'Present' | 'Absent' | 'Late';
type AttendanceStatusLower = 'present' | 'absent' | 'late';


type AttendanceRecord = {
  id: string;
  studentId: string;
  date: Timestamp;
  status: AttendanceStatus;
  notes?: string;
};

type Child = {
    id: string;
    name: string;
    class: string;
};

const normalizeStatus = (status: string): AttendanceStatus => {
  const lowerStatus = status.toLowerCase();
  if (lowerStatus === 'present') return 'Present';
  if (lowerStatus === 'absent') return 'Absent';
  if (lowerStatus === 'late') return 'Late';
  return 'Present'; // Fallback
};

const getStatusBadge = (status: AttendanceStatus) => {
    switch (status) {
        case 'Present': return <Badge variant="default" className="bg-green-600 hover:bg-green-700">Present</Badge>;
        case 'Absent': return <Badge variant="destructive">Absent</Badge>;
        case 'Late': return <Badge variant="secondary" className="bg-yellow-500 text-white hover:bg-yellow-600">Late</Badge>;
    }
}


export default function ParentAttendancePage() {
  const searchParams = useSearchParams();
  const schoolId = searchParams.get('schoolId');
  const [childrenData, setChildrenData] = React.useState<Child[]>([]);
  const [attendanceRecords, setAttendanceRecords] = React.useState<AttendanceRecord[]>([]);
  const [selectedChild, setSelectedChild] = React.useState<string | undefined>();
  const [date, setDate] = React.useState<DateRange | undefined>({
    from: new Date(new Date().setDate(new Date().getDate() - 30)),
    to: new Date(),
  });
  const [isLoading, setIsLoading] = React.useState(true);
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [absenceDate, setAbsenceDate] = React.useState<Date | undefined>(new Date());
  const [absenceReason, setAbsenceReason] = React.useState('');
  
  // Fetch children associated with the logged-in parent
  React.useEffect(() => {
    if (!schoolId || !user) {
        setIsLoading(false);
        return;
    };
    const parentId = user.uid;
    setIsLoading(true);
    const q = query(collection(firestore, `schools/${schoolId}/students`), where('parentId', '==', parentId));
    const unsubscribe = onSnapshot(q, (snapshot) => {
        const fetchedChildren = snapshot.docs.map(doc => ({ id: doc.id, name: doc.data().name, class: doc.data().class } as Child));
        setChildrenData(fetchedChildren);
        if (!selectedChild && fetchedChildren.length > 0) {
            setSelectedChild(fetchedChildren[0].id);
        }
        setIsLoading(false);
    }, (error) => {
        console.error("Error fetching children: ", error);
        toast({ title: 'Error', description: 'Could not fetch your children\'s data.', variant: 'destructive'});
        setIsLoading(false);
    });
    return () => unsubscribe();
  }, [schoolId, user, selectedChild, toast]);

  // Fetch attendance records for the selected child
  React.useEffect(() => {
    if (!selectedChild || !schoolId) {
        setAttendanceRecords([]);
        return;
    }
    
    setIsLoading(true);
    const q = query(collection(firestore, `schools/${schoolId}/attendance`), where('studentId', '==', selectedChild), orderBy('date', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const records = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), status: normalizeStatus(doc.data().status) } as AttendanceRecord));
      setAttendanceRecords(records);
      setIsLoading(false);
    }, (error) => {
        console.error("Error fetching attendance: ", error);
        toast({ title: 'Error', description: 'Could not fetch attendance records.', variant: 'destructive'});
        setIsLoading(false);
    });

    return () => unsubscribe();
  }, [selectedChild, schoolId, toast]);


  const filteredRecords = React.useMemo(() => {
    if (!date?.from) return attendanceRecords;
    
    const fromDate = new Date(date.from);
    fromDate.setHours(0, 0, 0, 0);
    const toDate = date.to ? new Date(date.to) : fromDate;
    toDate.setHours(23, 59, 59, 999);
    
    return attendanceRecords.filter(record => {
        const recordDate = record.date.toDate();
        return recordDate >= fromDate && recordDate <= toDate;
    });
  }, [attendanceRecords, date]);
  
  const summaryStats = React.useMemo(() => ({
      present: filteredRecords.filter(r => r.status === 'Present').length,
      absent: filteredRecords.filter(r => r.status === 'Absent').length,
      late: filteredRecords.filter(r => r.status === 'Late').length,
  }), [filteredRecords]);

  const totalRecords = filteredRecords.length;
  const attendanceRate = totalRecords > 0 ? Math.round(((summaryStats.present + summaryStats.late) / totalRecords) * 100) : 100;
  
  const wasAbsentRecently = summaryStats.absent > 0;

  const handleExport = () => {
    toast({
        title: 'Exporting Report',
        description: 'Your attendance report is being generated.',
    });
  };
  
    const handleReportAbsence = async () => {
    if (!selectedChild || !absenceDate || !absenceReason || !schoolId || !user) {
        toast({ title: 'Missing Information', description: 'Please select a date and provide a reason.', variant: 'destructive' });
        return;
    }

    try {
        await addDoc(collection(firestore, 'schools', schoolId, 'absences'), {
            studentId: selectedChild,
            studentName: childrenData.find(c => c.id === selectedChild)?.name,
            date: Timestamp.fromDate(absenceDate),
            reason: absenceReason,
            reportedBy: user.displayName || 'Parent',
            reporterId: user.uid,
            reportedAt: serverTimestamp(),
            status: 'Pending',
        });

        toast({
            title: "Absence Reported",
            description: "The school has been notified of your child's absence.",
        });
        setAbsenceReason('');
    } catch (error) {
        console.error("Error reporting absence:", error);
        toast({ title: 'Submission Failed', description: 'Could not report absence. Please try again.', variant: 'destructive' });
    }
  }


  if (!schoolId) {
    return <div className="p-8">Error: School ID is missing from URL.</div>
  }

  if (!user) {
    return <div className="p-8">Please log in to view attendance.</div>
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="mb-2">
        <h1 className="font-headline text-3xl font-bold flex items-center gap-2">
          <ClipboardCheck className="h-8 w-8 text-primary" />
          Attendance Records
        </h1>
        <p className="text-muted-foreground">View attendance data for your child.</p>
      </div>

       <Card>
            <CardHeader>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <User className="h-5 w-5 text-primary"/>
                        <Select value={selectedChild} onValueChange={setSelectedChild}>
                            <SelectTrigger className="w-full md:w-[240px]">
                                <SelectValue placeholder="Select a child" />
                            </SelectTrigger>
                            <SelectContent>
                                {childrenData.map((child) => (
                                    <SelectItem key={child.id} value={child.id}>{child.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                     <div className="flex w-full flex-col sm:flex-row md:w-auto items-center gap-2">
                        <Popover>
                            <PopoverTrigger asChild>
                            <Button
                                id="date"
                                variant="outline"
                                className={cn('w-full justify-start text-left font-normal md:w-auto lg:min-w-[250px]', !date && 'text-muted-foreground')}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {date?.from ? (
                                date.to ? `${format(date.from, 'LLL dd, y')} - ${format(date.to, 'LLL dd, y')}` : format(date.from, 'LLL dd, y')
                                ) : <span>Pick a date range</span>}
                            </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="end">
                            <Calendar initialFocus mode="range" defaultMonth={date?.from} selected={date} onSelect={setDate} numberOfMonths={2} />
                            </PopoverContent>
                        </Popover>
                         <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="w-full sm:w-auto">
                                    <FileDown className="mr-2 h-4 w-4" />
                                    Export
                                    <ChevronDown className="ml-2 h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                                <DropdownMenuItem onClick={handleExport}>Export as PDF</DropdownMenuItem>
                            </DropdownMenuContent>
                         </DropdownMenu>
                         <Dialog>
                            <DialogTrigger asChild>
                                <Button className="w-full md:w-auto">Report an Absence</Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Report Child's Absence</DialogTitle>
                                    <DialogDescription>
                                        Notify the school about your child's absence. This will be sent to the school office and class teacher.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                    <div className="space-y-2">
                                        <Label>Date of Absence</Label>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                            <Button
                                                variant={"outline"}
                                                className={cn("w-full justify-start text-left font-normal", !absenceDate && "text-muted-foreground")}
                                            >
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {absenceDate ? format(absenceDate, "PPP") : <span>Pick a date</span>}
                                            </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0">
                                                <Calendar mode="single" selected={absenceDate} onSelect={setAbsenceDate} initialFocus />
                                            </PopoverContent>
                                        </Popover>
                                    </div>
                                        <div className="space-y-2">
                                        <Label htmlFor="absence-reason">Reason for Absence</Label>
                                        <Textarea id="absence-reason" placeholder="e.g., Doctor's appointment, feeling unwell..." value={absenceReason} onChange={(e) => setAbsenceReason(e.target.value)} />
                                    </div>
                                </div>
                                <DialogFooter>
                                    <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                                    <DialogClose asChild>
                                        <Button onClick={handleReportAbsence}>Send Notification</Button>
                                    </DialogClose>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>
            </CardHeader>
        </Card>
        
        {wasAbsentRecently && (
            <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Absence Alert</AlertTitle>
                <AlertDescription>
                   {childrenData.find(c => c.id === selectedChild)?.name} was marked absent recently. Please contact the school office if this was unexpected.
                </AlertDescription>
            </Alert>
        )}
      
      {isLoading ? (
        <div className="flex items-center justify-center h-48">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : childrenData.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-muted-foreground">No students linked to your parent account.</CardContent></Card>
      ) : (
        <>
            <div className="grid gap-6 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Overall Attendance</CardTitle>
                        <Percent className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{attendanceRate}%</div>
                        <p className="text-xs text-muted-foreground">{totalRecords} days recorded in period</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Absences</CardTitle>
                        <UserX className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{summaryStats.absent}</div>
                        <p className="text-xs text-muted-foreground">Days marked absent in period</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Late Arrivals</CardTitle>
                        <UserCheck className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{summaryStats.late}</div>
                        <p className="text-xs text-muted-foreground">Days marked late in period</p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Attendance Log</CardTitle>
                    <CardDescription>
                        Daily attendance records for the selected period.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                <div className="w-full overflow-auto rounded-lg border">
                    <Table>
                    <TableHeader>
                        <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Notes from Teacher</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredRecords.length > 0 ? (
                        filteredRecords.map((record) => (
                            <TableRow key={record.id}>
                            <TableCell className="font-medium">{format(record.date.toDate(), 'PPP')}</TableCell>
                            <TableCell>{getStatusBadge(record.status)}</TableCell>
                            <TableCell className="text-muted-foreground">{record.notes || '—'}</TableCell>
                            </TableRow>
                        ))
                        ) : (
                        <TableRow>
                            <TableCell colSpan={3} className="h-24 text-center">
                            No attendance records found for the selected period.
                            </TableCell>
                        </TableRow>
                        )}
                    </TableBody>
                    </Table>
                </div>
                </CardContent>
            </Card>
        </>
      )}
    </div>
  );
}
