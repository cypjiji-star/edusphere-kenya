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
import { Progress } from '@/components/ui/progress'; // Added missing import
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
  const [isLoading, setIsLoading] = React.useState(true);
  const [isLoadingClasses, setIsLoadingClasses] = React.useState(true);
  
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
  
  // Fixed date initialization
  const [date, setDate] = React.useState<DateRange | undefined>({
    from: new Date(),
    to: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Default to one week from now
  });

  const handleTermChange = React.useCallback((value: string) => {
    setNewExamTerm(value);
  }, []);

  const handleClassChange = React.useCallback((value: string) => {
    setNewExamClass(value);
  }, []);

  // Improved useEffect with proper cleanup
  React.useEffect(() => {
    if (!schoolId) return;

    let unsubscribeExams: () => void = () => {};
    let unsubscribeClasses: () => void = () => {};

    const setupListeners = async () => {
      try {
        // Setup exams listener
        const examsQuery = query(
          collection(firestore, `schools/${schoolId}/assessments`), 
          where('status', '!=', 'Archived'), 
          orderBy('status'), 
          orderBy('startDate', 'desc')
        );

        unsubscribeExams = onSnapshot(
          examsQuery,
          async (snapshot) => {
            try {
              const examsWithProgress: Exam[] = await Promise.all(
                snapshot.docs.map(async (examDoc) => {
                  const exam = { id: examDoc.id, ...examDoc.data() } as Exam;

                  const [gradesSnap, studentsSnap] = await Promise.all([
                    getDocs(query(collection(firestore, `schools/${schoolId}/grades`), where('assessmentId', '==', exam.id))),
                    getDocs(query(collection(firestore, `schools/${schoolId}/students`), where('classId', '==', exam.classId)))
                  ]);

                  const totalStudents = studentsSnap.size;
                  const enteredGrades = gradesSnap.size;
                  const progress = totalStudents > 0 ? Math.round((enteredGrades / totalStudents) * 100) : 0;

                  return { ...exam, progress };
                })
              );

              setAllExams(examsWithProgress);
              setIsLoading(false);
            } catch (error) {
              console.error('Error processing exams:', error);
              toast({ variant: 'destructive', title: 'Error loading exams' });
              setIsLoading(false);
            }
          },
          (error) => {
            console.error('Error listening to exams:', error);
            toast({ variant: 'destructive', title: 'Error loading exams' });
            setIsLoading(false);
          }
        );

        // Setup classes listener
        unsubscribeClasses = onSnapshot(
          collection(firestore, `schools/${schoolId}/classes`),
          (snapshot) => {
            try {
              const classList = snapshot.docs.map(doc => ({
                id: doc.id,
                name: `${doc.data().name || doc.data().className || ''} ${doc.data().stream || ''}`.trim(),
              }));
              setClasses(classList);
              setIsLoadingClasses(false);
            } catch (error) {
              console.error('Error processing classes:', error);
              toast({ variant: 'destructive', title: 'Error loading classes' });
              setIsLoadingClasses(false);
            }
          },
          (error) => {
            console.error('Error listening to classes:', error);
            toast({ variant: 'destructive', title: 'Error loading classes' });
            setIsLoadingClasses(false);
          }
        );

      } catch (error) {
        console.error('Error setting up listeners:', error);
        toast({ variant: 'destructive', title: 'Error initializing data' });
        setIsLoading(false);
        setIsLoadingClasses(false);
      }
    };

    setupListeners();

    return () => {
      unsubscribeExams();
      unsubscribeClasses();
    };
  }, [schoolId, toast]);

  // Improved exam editing effect
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
    }
  }, [editingExam]);

  // Reset form when dialog closes
  React.useEffect(() => {
    if (!isExamDialogOpen && !editingExam) {
      setNewExamTitle('');
      setNewExamTerm(academicTerms[4]);
      setNewExamClass('');
      setDate({ 
        from: new Date(), 
        to: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) 
      });
      setNewExamNotes('');
    }
  }, [isExamDialogOpen, editingExam, academicTerms]);

  const handleCreateOrUpdateExam = async () => {
    if (!schoolId || !newExamTitle || !newExamClass || !date?.from || !user) {
      toast({ 
        variant: 'destructive', 
        title: 'Missing Information', 
        description: 'Please fill out the title, class, and date range.' 
      });
      return;
    }

    setIsSavingExam(true);
    const endDate = date.to || date.from;

    try {
      const examData = {
        title: newExamTitle,
        term: newExamTerm,
        classId: newExamClass,
        className: classes.find(c => c.id === newExamClass)?.name || 'N/A',
        startDate: Timestamp.fromDate(date.from),
        endDate: Timestamp.fromDate(endDate),
        notes: newExamNotes,
        status: editingExam ? editingExam.status : 'Draft',
        updatedAt: Timestamp.now(),
        ...(editingExam ? {} : { createdAt: Timestamp.now() })
      };

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

    } catch (error) {
      console.error('Error saving exam:', error);
      toast({ 
        variant: 'destructive', 
        title: 'Failed to save exam',
        description: 'Please try again or contact support if the problem persists.'
      });
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
      await updateDoc(examRef, { 
        status: newStatus,
        updatedAt: Timestamp.now()
      });

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
    } catch (error) {
      console.error('Error updating exam status:', error);
      toast({
        title: 'Error',
        description: 'Could not update the exam status.',
        variant: 'destructive',
      });
    }
  };

  const handleArchiveExam = async (exam: Exam) => {
    if (window.confirm(`Are you sure you want to archive the exam "${exam.title}"?`)) {
      try {
        await handleUpdateExamStatus(exam, 'Archived');
      } catch (error) {
        console.error('Error archiving exam:', error);
      }
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

  if (isLoading || isLoadingClasses) {
    return (
      <Card>
        <CardContent className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading exams...</span>
        </CardContent>
      </Card>
    );
  }

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
                  <Label htmlFor="exam-title">Exam Title *</Label>
                  <Input 
                    id="exam-title" 
                    placeholder="e.g., Term 2 Mid-Term Exams" 
                    value={newExamTitle} 
                    onChange={(e) => setNewExamTitle(e.target.value)} 
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="exam-term">Academic Term *</Label>
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
                    <Label>Class *</Label>
                    <Select value={newExamClass} onValueChange={handleClassChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select class..." />
                      </SelectTrigger>
                      <SelectContent>
                        {classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date-range">Date Range *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        id="date"
                        variant="outline"
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
                        disabled={(date) => date < new Date()} // Prevent selecting past dates
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="exam-notes">Notes (Optional)</Label>
                  <Textarea 
                    id="exam-notes" 
                    placeholder="Add any relevant instructions or notes for teachers." 
                    value={newExamNotes} 
                    onChange={e => setNewExamNotes(e.target.value)} 
                  />
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DialogClose>
                <Button 
                  onClick={handleCreateOrUpdateExam} 
                  disabled={isSavingExam || !newExamTitle || !newExamClass || !date?.from}
                >
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
              placeholder="Search exams by title, term, or class..."
              className="pl-8"
              value={examSearchTerm}
              onChange={(e) => setExamSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        {filteredExams.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            {examSearchTerm ? 'No exams match your search' : 'No exams found. Create your first exam to get started.'}
          </div>
        ) : (
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
                          <DropdownMenuItem 
                            onClick={() => handleArchiveExam(exam)}
                            className="text-red-600"
                          >
                            <Archive className="mr-2 h-4 w-4" />
                            Archive
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}