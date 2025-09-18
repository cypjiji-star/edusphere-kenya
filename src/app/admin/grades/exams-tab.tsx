
'use client';

import * as React from 'react';
import { format } from 'date-fns';
import { DateRange } from 'react-day-picker';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  PlusCircle,
  Loader2,
  Settings,
  Edit,
  Archive,
  Search,
  Lock,
  Unlock,
  Send,
  CheckCircle,
  CalendarIcon,
} from 'lucide-react';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { firestore } from '@/lib/firebase';
import {
  collection,
  query,
  onSnapshot,
  orderBy,
  Timestamp,
  addDoc,
  getDocs,
  where,
  doc,
  updateDoc,
} from 'firebase/firestore';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { logAuditEvent } from '@/lib/audit-log.service';
import { useAuth } from '@/context/auth-context';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import type { Exam } from './types';

interface ExamsTabProps {
  schoolId: string;
}

export function ExamsTab({ schoolId }: ExamsTabProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [classes, setClasses] = React.useState<{ id: string, name: string }[]>([]);
  const [allExams, setAllExams] = React.useState<Exam[]>([]);
  const [examSearchTerm, setExamSearchTerm] = React.useState('');
  const [editingExam, setEditingExam] = React.useState<Exam | null>(null);
  
  const currentYear = new Date().getFullYear();
  const academicTerms = Array.from({ length: 2 }, (_, i) => {
    const year = currentYear - 1 + i;
    return [`Term 1, ${year}`, `Term 2, ${year}`, `Term 3, ${year}`];
  }).flat();
  academicTerms.push(...[`Term 1, ${currentYear + 1}`, `Term 2, ${currentYear + 1}`, `Term 3, ${currentYear + 1}`]);
  
  const [isExamDialogOpen, setIsExamDialogOpen] = React.useState(false);
  const [newExamTitle, setNewExamTitle] = React.useState('');
  const [newExamTerm, setNewExamTerm] = React.useState(academicTerms[4]);
  const [newExamClass, setNewExamClass] = React.useState<string>('');
  const [newExamNotes, setNewExamNotes] = React.useState('');
  const [isSavingExam, setIsSavingExam] = React.useState(false);
  const [date, setDate] = React.useState<DateRange | undefined>({
    from: undefined,
    to: undefined,
  });

  const handleTermChange = React.useCallback((value: string) => {
    setNewExamTerm(value);
  }, []);

  const handleClassChange = React.useCallback((value: string) => {
    setNewExamClass(value);
  }, []);

  React.useEffect(() => {
    if (editingExam && editingExam.startDate && editingExam.endDate) {
      setNewExamTitle(editingExam.title);
      setNewExamTerm(editingExam.term);
      setNewExamClass(editingExam.classId || '');
      setDate({
        from: editingExam.startDate.toDate(),
        to: editingExam.endDate.toDate(),
      });
      setNewExamNotes(editingExam.notes || '');
      setIsExamDialogOpen(true);
    } else if (!isExamDialogOpen && !editingExam) {
      setNewExamTitle('');
      setNewExamTerm(academicTerms[4]);
      setNewExamClass('');
      setDate({ from: undefined, to: undefined });
      setNewExamNotes('');
    }
  }, [editingExam, isExamDialogOpen, academicTerms]);

  React.useEffect(() => {
    if (!schoolId) return;

    const unsubExams = onSnapshot(
      query(collection(firestore, `schools/${schoolId}/assessments`), where('status', '!=', 'Archived'), orderBy('status'), orderBy('startDate', 'desc')),
      async (snapshot) => {
        const examsWithProgress: Exam[] = await Promise.all(snapshot.docs.map(async (examDoc) => {
          const exam = { id: examDoc.id, ...examDoc.data() } as Exam;

          const gradesQuery = query(collection(firestore, `schools/${schoolId}/grades`), where('assessmentId', '==', exam.id));
          const studentsQuery = query(collection(firestore, `schools/${schoolId}/students`), where('classId', '==', exam.classId));

          const [gradesSnap, studentsSnap] = await Promise.all([getDocs(gradesQuery), getDocs(studentsQuery)]);

          const totalStudents = studentsSnap.size;
          const enteredGrades = gradesSnap.size;

          const progress = totalStudents > 0 ? Math.round((enteredGrades / totalStudents) * 100) : 0;

          return { ...exam, progress };
        }));

        setAllExams(examsWithProgress);
      }
    );

    const unsubClasses = onSnapshot(collection(firestore, `schools/${schoolId}/classes`), (snapshot) => {
      const classList = snapshot.docs.map(doc => ({
        id: doc.id,
        name: `${doc.data().name || doc.data().className || ''} ${doc.data().stream || ''}`.trim(),
      }));
      setClasses(classList);
    });

    return () => {
      unsubExams();
      unsubClasses();
    };
  }, [schoolId]);

  const handleCreateOrUpdateExam = async () => {
    if (!schoolId || !newExamTitle || !newExamClass || !date?.from || !user) {
      toast({ variant: 'destructive', title: 'Missing Information', description: 'Please fill out the title, class, and date range.' });
      return;
    }
    setIsSavingExam(true);

    const endDate = date.to || date.from;

    const examData = {
      title: newExamTitle,
      term: newExamTerm,
      classId: newExamClass,
      className: classes.find(c => c.id === newExamClass)?.name || 'N/A',
      startDate: Timestamp.fromDate(date.from),
      endDate: Timestamp.fromDate(endDate),
      notes: newExamNotes,
      status: editingExam ? editingExam.status : 'Draft',
    };

    try {
      let description = `New Exam Scheduled: ${examData.title} for ${examData.className}`;

      if (editingExam) {
        const examRef = doc(firestore, `schools/${schoolId}/assessments`, editingExam.id);
        await updateDoc(examRef, examData);
        toast({ title: 'Exam Updated', description: 'The exam schedule has been updated.' });
        description = `Exam Details Updated: ${examData.title}`;
      } else {
        await addDoc(collection(firestore, `schools/${schoolId}/assessments`), examData);
        toast({ title: 'Exam Created', description: 'The new exam has been scheduled.' });
      }

      await logAuditEvent({
        schoolId,
        actionType: 'Academics',
        description,
        user: { id: user.uid, name: user.displayName || 'Admin', role: 'Admin' },
        details: `Term: ${examData.term}, Dates: ${format(date.from, 'LLL dd, y')} - ${format(endDate, 'LLL dd, y')}`,
      });

      setEditingExam(null);
      setIsExamDialogOpen(false);
    } catch (e) {
      console.error(e);
      toast({ variant: 'destructive', title: 'Failed to save exam.' });
    } finally {
      setIsSavingExam(false);
    }
  };

  const filteredExams = allExams.filter(exam =>
    exam.title.toLowerCase().includes(examSearchTerm.toLowerCase()) ||
    exam.term.toLowerCase().includes(examSearchTerm.toLowerCase()) ||
    (exam.className && exam.className.toLowerCase().includes(examSearchTerm.toLowerCase()))
  );

  const getStatusBadgeColor = (status: Exam['status']) => {
    switch (status) {
      case 'Draft': return 'bg-gray-500';
      case 'Active': return 'bg-blue-500';
      case 'Locked': return 'bg-yellow-500';
      case 'Published': return 'bg-green-600';
      default: return 'bg-gray-500';
    }
  };

  const handleUpdateExamStatus = async (exam: Exam, newStatus: Exam['status']) => {
    if (!schoolId || !user) return;
    try {
      const examRef = doc(firestore, `schools/${schoolId}/assessments`, exam.id);
      await updateDoc(examRef, { status: newStatus });

      await logAuditEvent({
        schoolId,
        actionType: 'Academics',
        description: `Exam Status Changed to ${newStatus}`,
        user: { id: user.uid, name: user.displayName || 'Admin', role: 'Admin' },
        details: `Exam: ${exam.title} (${exam.className})`,
      });

      toast({
        title: `Exam Status Updated`,
        description: `The exam is now ${newStatus}.`,
      });
    } catch (e) {
      console.error(e);
      toast({
        title: 'Error',
        description: 'Could not update the exam status.',
        variant: 'destructive',
      });
    }
  };

  const handleArchiveExam = (exam: Exam) => {
    if (window.confirm(`Are you sure you want to archive the exam "${exam.title}"?`)) {
      handleUpdateExamStatus(exam, 'Archived');
    }
  };

  const renderExamActions = (exam: Exam) => {
    switch (exam.status) {
      case 'Draft':
        return <DropdownMenuItem onClick={() => handleUpdateExamStatus(exam, 'Active')}><Unlock className="mr-2 h-4 w-4" /> Activate Grading</DropdownMenuItem>;
      case 'Active':
        return <DropdownMenuItem onClick={() => handleUpdateExamStatus(exam, 'Locked')}><Lock className="mr-2 h-4 w-4" /> Lock Grading</DropdownMenuItem>;
      case 'Locked':
        return <DropdownMenuItem onClick={() => handleUpdateExamStatus(exam, 'Published')}><Send className="mr-2 h-4 w-4" /> Publish Results</DropdownMenuItem>;
      case 'Published':
        return <DropdownMenuItem disabled><CheckCircle className="mr-2 h-4 w-4" /> Published</DropdownMenuItem>;
      default:
        return null;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Exam Management</CardTitle>
        <CardDescription>Create and manage examination schedules for different terms and classes.</CardDescription>
        <div className="flex justify-end pt-4">
             <Dialog open={isExamDialogOpen} onOpenChange={(open) => {
                setIsExamDialogOpen(open);
                if (!open) setEditingExam(null);
                }}>
                <DialogTrigger asChild>
                    <Button>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Create Exam
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-xl">
                    <DialogHeader>
                    <DialogTitle>{editingExam ? 'Edit Exam Details' : 'Create New Exam'}</DialogTitle>
                    <DialogDescription>{editingExam ? 'Update the details for this exam.' : 'Define a new examination schedule for a term.'}</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-6 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="exam-title">Exam Title</Label>
                        <Input id="exam-title" placeholder="e.g., Term 2 Mid-Term Exams" value={newExamTitle} onChange={(e) => setNewExamTitle(e.target.value)} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                        <Label htmlFor="exam-term">Academic Term</Label>
                        <Select value={newExamTerm} onValueChange={handleTermChange}>
                            <SelectTrigger id="exam-term">
                            <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                            {academicTerms.map(term => (
                                <SelectItem key={term} value={term}>{term}</SelectItem>
                            ))}
                            </SelectContent>
                        </Select>
                        </div>
                        <div className="space-y-2">
                        <Label>Classes Involved</Label>
                        <Select value={newExamClass} onValueChange={handleClassChange}>
                            <SelectTrigger>
                            <SelectValue placeholder="Select classes..." />
                            </SelectTrigger>
                            <SelectContent>
                            <SelectItem value="All Classes">All Classes</SelectItem>
                            {classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="date-range">Date Range</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    id="date"
                                    variant={"outline"}
                                    className={cn(
                                        "w-full justify-start text-left font-normal",
                                        !date && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {date?.from ? (
                                        date.to ? (
                                            <>
                                                {format(date.from, "LLL dd, y")} -{" "}
                                                {format(date.to, "LLL dd, y")}
                                            </>
                                        ) : (
                                            format(date.from, "LLL dd, y")
                                        )
                                    ) : (
                                        <span>Pick a date range</span>
                                    )}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    initialFocus
                                    mode="range"
                                    defaultMonth={date?.from}
                                    selected={date}
                                    onSelect={setDate}
                                    numberOfMonths={2}
                                />
                            </PopoverContent>
                        </Popover>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="exam-notes">Notes (Optional)</Label>
                        <Textarea id="exam-notes" placeholder="Add any relevant instructions or notes for teachers." value={newExamNotes} onChange={e => setNewExamNotes(e.target.value)} />
                    </div>
                    </div>
                    <DialogFooter>
                    <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                    <Button onClick={handleCreateOrUpdateExam} disabled={isSavingExam}>
                        {isSavingExam && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {editingExam ? 'Save Changes' : 'Create Exam'}
                    </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search exams..."
              className="pl-8"
              value={examSearchTerm}
              onChange={(e) => setExamSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Exam Title</TableHead>
                <TableHead>Term</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Date Range</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredExams.map((exam) => (
                <TableRow key={exam.id}>
                  <TableCell className="font-medium">{exam.title}</TableCell>
                  <TableCell>{exam.term}</TableCell>
                  <TableCell>{exam.className}</TableCell>
                  <TableCell>
                    {exam.startDate.toDate().toLocaleDateString()} - {exam.endDate.toDate().toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress value={exam.progress} className="w-16" />
                      <span className="text-sm">{exam.progress}%</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusBadgeColor(exam.status)}>
                      {exam.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <Settings className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setEditingExam(exam)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        {renderExamActions(exam)}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleArchiveExam(exam)}>
                          <Archive className="mr-2 h-4 w-4" />
                          Archive
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
              {filteredExams.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    No exams found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
