
'use client';

import * as React from 'react';
import { DndContext, useDraggable, useDroppable, type DragEndEvent, useSensors, useSensor, PointerSensor, TouchSensor, KeyboardSensor } from '@dnd-kit/core';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
  } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Edit, GripVertical, Plus, Save, Settings, Share, Trash2, AlertTriangle, FileDown, Printer, ChevronDown, Loader2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { firestore } from '@/lib/firebase';
import { doc, getDoc, setDoc, onSnapshot, collection, query, where, addDoc, getDocs } from 'firebase/firestore';
import { useSearchParams } from 'next/navigation';

type DraggableSubjectType = {
    name: string;
    teacher: string;
    color: string;
};

type Period = { id: number; time: string; isBreak?: boolean; title?: string };
type TimetableCellData = { subject: DraggableSubjectType; room: string; className?: string; clash?: { with: string; message: string } | null };
type TimetableData = Record<string, Record<string, TimetableCellData>>;
type AllTimetables = Record<string, TimetableData>;

const subjectColors = [
    'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 'bg-pink-500', 'bg-yellow-500', 'bg-teal-500', 'bg-red-500', 'bg-indigo-500'
];
const getColorForSubject = (subjectName: string) => {
    let hash = 0;
    for (let i = 0; i < subjectName.length; i++) {
        hash = subjectName.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash % subjectColors.length);
    return subjectColors[index];
}

const mockDepartments = ['Sciences', 'Mathematics', 'Languages', 'Humanities', 'Technical Subjects', 'Creative Arts'];


function DraggableSubject({ subject }: { subject: DraggableSubjectType }) {
    const { attributes, listeners, setNodeRef, transform } = useDraggable({
        id: `draggable-${subject.name}`,
        data: { subject },
    });

    const style = transform ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: 100,
    } : undefined;

    return (
        <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
            <div className={cn('p-3 rounded-md text-white flex items-center justify-between cursor-grab active:cursor-grabbing', subject.color)}>
                <div>
                    <p className="font-bold">{subject.name}</p>
                    <p className="text-xs opacity-80">{subject.teacher}</p>
                </div>
                <GripVertical className="h-5 w-5 text-white/50" />
            </div>
        </div>
    )
}

function DroppableCell({ day, periodId, children }: { day: string; periodId: number; children: React.ReactNode }) {
    const { isOver, setNodeRef } = useDroppable({
        id: `${day}-${periodId}`,
    });

    return (
        <td
            ref={setNodeRef}
            className={cn(
                "h-20 md:h-28 p-1 align-top border-r transition-colors",
                isOver && "bg-primary/20"
            )}
        >
            {children}
        </td>
    );
}

export function TimetableBuilder() {
  const searchParams = useSearchParams();
  const schoolId = searchParams.get('schoolId');
  const [view, setView] = React.useState('Class View');
  const [selectedItem, setSelectedItem] = React.useState<string | undefined>();
  const [timetable, setTimetable] = React.useState<TimetableData>({});
  const [allTimetables, setAllTimetables] = React.useState<AllTimetables>({});
  const [periods, setPeriods] = React.useState<Period[]>([]);
  const [allClasses, setAllClasses] = React.useState<{id: string, name: string}[]>([]);
  const [allTeachers, setAllTeachers] = React.useState<string[]>([]);
  const [allRooms, setAllRooms] = React.useState<string[]>([]);
  const [subjects, setSubjects] = React.useState<DraggableSubjectType[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const { toast } = useToast();

  const [newSubjectName, setNewSubjectName] = React.useState('');
  const [newSubjectCode, setNewSubjectCode] = React.useState('');
  const [newSubjectDept, setNewSubjectDept] = React.useState('');
  const [isAddSubjectOpen, setIsAddSubjectOpen] = React.useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(TouchSensor),
    useSensor(KeyboardSensor)
  );

  React.useEffect(() => {
    if (!schoolId) return;

    let unsubTimetables: () => void = () => {};

    const unsubClasses = onSnapshot(collection(firestore, `schools/${schoolId}/classes`), (snapshot) => {
      const classesData = snapshot.docs.map(doc => ({ id: doc.id, name: `${doc.data().name} ${doc.data().stream || ''}`.trim() }));
      setAllClasses(classesData);
      if (!selectedItem && classesData.length > 0) {
        setSelectedItem(classesData[0].id);
      }
    });

    const unsubTeachers = onSnapshot(query(collection(firestore, 'schools', schoolId, 'users'), where('role', '==', 'Teacher')), (snapshot) => {
      setAllTeachers(snapshot.docs.map(doc => doc.data().name));
    });
    setAllRooms(['Science Lab', 'Room 12A', 'Room 10B', 'Staff Room']);

    const unsubPeriods = onSnapshot(doc(firestore, `schools/${schoolId}/timetableSettings`, 'periods'), (docSnap) => {
      if (docSnap.exists()) {
        setPeriods(docSnap.data().periods);
      }
    });

    const unsubSubjects = onSnapshot(collection(firestore, `schools/${schoolId}/subjects`), (snapshot) => {
        const subjectsData = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                name: data.name,
                teacher: data.teachers?.[0] || 'Unassigned',
                color: getColorForSubject(data.name),
            }
        });
        setSubjects(subjectsData);
    });

    setIsLoading(true);
    const timetablesQuery = query(collection(firestore, `schools/${schoolId}/timetables`));
    unsubTimetables = onSnapshot(timetablesQuery, (snapshot) => {
        const fetchedTimetables: AllTimetables = {};
        snapshot.forEach(doc => {
            fetchedTimetables[doc.id] = doc.data() as TimetableData;
        });
        setAllTimetables(fetchedTimetables);
        setIsLoading(false);
    });
    
    return () => {
      unsubClasses();
      unsubPeriods();
      unsubTeachers();
      unsubSubjects();
      unsubTimetables();
    }
  }, [schoolId, selectedItem]);

  React.useEffect(() => {
    if (!selectedItem) return;

    if (view === 'Class View') {
        setTimetable(allTimetables[selectedItem] || {});
    } else {
        const aggregatedTimetable: TimetableData = {};
        Object.keys(allTimetables).forEach(classId => {
            const classTimetable = allTimetables[classId];
            const className = allClasses.find(c => c.id === classId)?.name || classId;
            Object.keys(classTimetable).forEach(day => {
                if (!aggregatedTimetable[day]) {
                    aggregatedTimetable[day] = {};
                }
                Object.keys(classTimetable[day]).forEach(periodTime => {
                    const lesson = classTimetable[day][periodTime];
                    if (!lesson || !lesson.subject) return;
                    let match = false;
                    if (view === 'Teacher View' && lesson.subject.teacher === selectedItem) {
                        match = true;
                    } else if (view === 'Room View' && lesson.room === selectedItem) {
                        match = true;
                    }
                    if (match) {
                        aggregatedTimetable[day][periodTime] = { ...lesson, className };
                    }
                });
            });
        });
        setTimetable(aggregatedTimetable);
    }
}, [selectedItem, allTimetables, view, allClasses]);
  
  const addPeriod = () => {
    const newId = periods.length > 0 ? Math.max(...periods.map(p => p.id)) + 1 : 1;
    setPeriods([...periods, { id: newId, time: '00:00 - 00:00' }]);
  };

  const removePeriod = (id: number) => {
    setPeriods(periods.filter(p => p.id !== id));
  };
  
  const updatePeriod = (id: number, field: string, value: string | boolean) => {
    setPeriods(periods.map(p => p.id === id ? { ...p, [field]: value } : p));
  }


  const renderFilterDropdown = () => {
    let items: {id: string, name: string}[] | string[] = [];
    let placeholder = `Select ${view.split(' ')[0]}`;
    switch(view) {
        case 'Class View':
            items = allClasses;
            break;
        case 'Teacher View':
            items = allTeachers;
            break;
        case 'Room View':
            items = allRooms;
            break;
    }
    
    return (
        <Select value={selectedItem} onValueChange={setSelectedItem}>
            <SelectTrigger className="w-full sm:w-auto">
                <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
                {items.map(item => typeof item === 'string' 
                    ? <SelectItem key={item} value={item}>{item}</SelectItem> 
                    : <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>
                )}
            </SelectContent>
        </Select>
    )
  }

  const checkForClashes = (
    day: string,
    periodTime: string,
    subject: DraggableSubjectType,
    currentTimetableId: string,
    allTimetablesData: AllTimetables
  ) => {
    for (const timetableId in allTimetablesData) {
      if (timetableId === currentTimetableId) continue;
      const otherTimetable = allTimetablesData[timetableId];
      const otherLesson = otherTimetable[day]?.[periodTime];
      if (otherLesson && otherLesson.subject.teacher === subject.teacher) {
        const conflictingClassName = allClasses.find(c => c.id === timetableId)?.name || timetableId;
        return {
          with: conflictingClassName,
          message: `${subject.teacher} is already teaching ${otherLesson.subject.name} in ${conflictingClassName}.`,
        };
      }
    }
    return null;
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { over, active } = event;
    const subject = active.data.current?.subject as DraggableSubjectType | undefined;

    if (over && subject && selectedItem && view === 'Class View') {
        const [day, periodIdStr] = over.id.toString().split('-');
        const periodId = parseInt(periodIdStr, 10);
        const periodTime = periods.find(p => p.id === periodId)?.time;
        if (!periodTime) return;

        const clash = checkForClashes(day, periodTime, subject, selectedItem, allTimetables);

        setTimetable(prev => {
            const newTimetable = { ...prev };
            if (!newTimetable[day]) {
                newTimetable[day] = {};
            }
            newTimetable[day][periodTime] = {
                subject,
                room: 'Room TBD', // Placeholder room
                clash,
            };
            return newTimetable;
        });
    } else if (view !== 'Class View') {
        toast({
            title: 'Read-only View',
            description: `You can only edit timetables in "Class View".`,
            variant: 'destructive'
        });
    }
  }
  
  const handleClearCell = (day: string, periodTime: string) => {
    if (view !== 'Class View') return;
    setTimetable(prev => {
        const newTimetable = { ...prev };
        if (newTimetable[day] && newTimetable[day][periodTime]) {
            delete newTimetable[day][periodTime];
        }
        return newTimetable;
    });
  }

  const handleSave = async () => {
    if (!selectedItem || !schoolId || view !== 'Class View') return;
    try {
        const timetableRef = doc(firestore, `schools/${schoolId}/timetables`, selectedItem);
        // Important: Use the local timetable state to update the global state first
        const updatedAllTimetables = { ...allTimetables, [selectedItem]: timetable };
        // Save the entire updated global state
        await setDoc(timetableRef, updatedAllTimetables[selectedItem], { merge: true });
        // Then set the new global state locally
        setAllTimetables(updatedAllTimetables);
        toast({
            title: 'Timetable Saved',
            description: `The timetable for the selected view has been saved.`,
        });
    } catch (e) {
        console.error(e);
        toast({ variant: 'destructive', title: 'Save Failed' });
    }
  }
  
  const handlePublish = () => {
     toast({
        title: 'Timetable Published',
        description: `The timetable is now live and visible to relevant users.`,
    })
  }
  
  const handleSavePeriods = async () => {
    if (!schoolId) return;
    try {
        await setDoc(doc(firestore, `schools/${schoolId}/timetableSettings`, 'periods'), { periods });
        toast({
            title: 'Periods Saved',
            description: 'The school day periods have been updated for all timetables.',
        });
    } catch(e) {
        console.error(e);
        toast({ variant: 'destructive', title: 'Could not save periods.' });
    }
  };

  const handleExport = (type: string) => {
    toast({
      title: 'Exporting Timetable',
      description: `Your timetable is being exported as a ${type} file.`,
    });
  };

  const handleAddNewSubject = async () => {
    if (!newSubjectName || !newSubjectCode || !newSubjectDept || !schoolId) {
        toast({ title: 'Missing fields', description: 'Please fill out all subject details.', variant: 'destructive'});
        return;
    }
    try {
        await addDoc(collection(firestore, `schools/${schoolId}/subjects`), {
            name: newSubjectName,
            code: newSubjectCode,
            department: newSubjectDept,
            teachers: [],
            classes: [],
        });
        toast({ title: 'Subject Added', description: `${newSubjectName} has been added to the list.`});
        setNewSubjectName('');
        setNewSubjectCode('');
        setNewSubjectDept('');
        setIsAddSubjectOpen(false);
    } catch (error) {
        console.error("Error adding new subject:", error);
        toast({ title: 'Failed to add subject', variant: 'destructive' });
    }
  };

    const currentYear = new Date().getFullYear();
    const academicYears = Array.from({ length: 5 }, (_, i) => (currentYear + i).toString());
  
  if ((!selectedItem && !isLoading && view === 'Class View' && allClasses.length === 0)) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>No Classes Found</CardTitle>
                <CardDescription>Please add a class before creating a timetable.</CardDescription>
            </CardHeader>
             <CardContent>
                <div className="flex h-64 items-center justify-center rounded-lg border-2 border-dashed">
                    <p className="text-muted-foreground">Go to "Classes & Subjects" to get started.</p>
                </div>
            </CardContent>
        </Card>
    );
  }
  
  if (isLoading || !selectedItem) {
     return (
        <Card>
            <CardHeader>
                <CardTitle>Loading Timetable Data...</CardTitle>
                <CardDescription>Please wait while we prepare the timetable builder.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex items-center justify-center h-96">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                </div>
            </CardContent>
        </Card>
    );
  }

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const selectedName = view === 'Class View' 
    ? (allClasses.find(c => c.id === selectedItem)?.name || selectedItem)
    : selectedItem;

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-3">
                <Card>
                    <CardHeader>
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            <div>
                                <CardTitle>Timetable for {selectedName}</CardTitle>
                                <CardDescription>Drag subjects from the right panel and drop them into time slots.</CardDescription>
                            </div>
                            <div className="flex w-full flex-col sm:flex-row sm:flex-wrap md:w-auto items-center gap-2">
                                <Select defaultValue={currentYear.toString()}>
                                    <SelectTrigger className="w-full sm:w-auto">
                                        <SelectValue placeholder="Select year" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {academicYears.map(year => (
                                            <SelectItem key={year} value={year}>{year}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Select value={view} onValueChange={(v) => {
                                    setView(v);
                                    if (v === 'Class View') setSelectedItem(allClasses[0]?.id);
                                    if (v === 'Teacher View') setSelectedItem(allTeachers[0]);
                                    if (v === 'Room View') setSelectedItem(allRooms[0]);
                                }}>
                                    <SelectTrigger className="w-full sm:w-auto">
                                        <SelectValue placeholder="Select view" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {['Class View', 'Teacher View', 'Room View'].map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                {renderFilterDropdown()}
                                <Dialog>
                                    <DialogTrigger asChild>
                                        <Button variant="outline" className="w-full sm:w-auto">
                                            <Settings className="mr-2 h-4 w-4" />
                                            Define Periods
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="sm:max-w-xl">
                                        <DialogHeader>
                                            <DialogTitle>Manage School Day Periods</DialogTitle>
                                            <DialogDescription>Define the time slots for lessons, breaks, and other activities. These will apply to all timetables.</DialogDescription>
                                        </DialogHeader>
                                        <div className="py-4 max-h-[60vh] overflow-y-auto pr-4 space-y-4">
                                            {periods.map((period, index) => {
                                                const [startTime, endTime] = period.time.split(' - ');
                                                return (
                                                <div key={period.id} className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] items-center gap-4 border-b pb-4">
                                                    <div className="space-y-1.5">
                                                        <Label htmlFor={`start-time-${period.id}`}>Start Time</Label>
                                                        <Input id={`start-time-${period.id}`} type="time" value={startTime} onChange={(e) => updatePeriod(period.id, 'time', `${e.target.value} - ${endTime}`)} />
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <Label htmlFor={`end-time-${period.id}`}>End Time</Label>
                                                        <Input id={`end-time-${period.id}`} type="time" value={endTime} onChange={(e) => updatePeriod(period.id, 'time', `${startTime} - ${e.target.value}`)} />
                                                    </div>
                                                    <Button variant="ghost" size="icon" className="self-end text-destructive hover:text-destructive" onClick={() => removePeriod(period.id)}>
                                                        <Trash2 className="h-4 w-4"/>
                                                    </Button>
                                                </div>
                                            )})}
                                        </div>
                                        <DialogFooter className="border-t pt-4 flex-col sm:flex-row gap-2">
                                            <Button variant="outline" className="w-full sm:w-auto" onClick={addPeriod}>
                                                <Plus className="mr-2 h-4 w-4"/>
                                                Add New Period
                                            </Button>
                                            <DialogClose asChild>
                                                <Button variant="secondary" className="w-full sm:w-auto">Cancel</Button>
                                            </DialogClose>
                                            <DialogClose asChild>
                                                <Button className="w-full sm:w-auto" onClick={handleSavePeriods}>Save Periods</Button>
                                            </DialogClose>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="outline" className="w-full sm:w-auto">
                                            Export / Print
                                            <ChevronDown className="ml-2 h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent>
                                        <DropdownMenuItem onClick={() => handleExport('PDF')}>
                                            <FileDown className="mr-2 h-4 w-4"/>
                                            Export as PDF
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleExport('Excel')}>
                                            <FileDown className="mr-2 h-4 w-4"/>
                                            Export as Excel
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem onClick={() => handleExport('Print')}>
                                            <Printer className="mr-2 h-4 w-4"/>
                                            Print View
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? <div className="h-96 flex items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-primary"/></div> :
                        <div className="w-full overflow-auto rounded-lg border">
                            <table className="w-full min-w-[800px]">
                                <thead>
                                    <tr className="border-b bg-muted/50">
                                        <th className="p-2 w-32 font-medium text-muted-foreground border-r text-center">Time</th>
                                        {days.map(day => (
                                            <th key={day} className="p-2 font-medium text-muted-foreground text-center">{day}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {periods.map(period => (
                                        <tr key={period.id} className="border-b">
                                            <td className="p-2 font-semibold text-primary text-sm border-r text-center">{period.time}</td>
                                            {days.map(day => {
                                                const cellData = timetable[day]?.[period.time];
                                                const content = (
                                                    <div className={cn("h-full w-full", cellData?.clash && "relative ring-2 ring-destructive ring-inset rounded-md")}>
                                                        {cellData?.clash && (
                                                            <div className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-0.5 z-10">
                                                                <AlertTriangle className="h-3 w-3" />
                                                            </div>
                                                        )}
                                                        {period.isBreak ? (
                                                            <div className="h-full flex items-center justify-center bg-gray-200 rounded-md">
                                                                <p className="font-semibold text-gray-600">{period.title}</p>
                                                            </div>
                                                        ) : (
                                                            cellData ? (
                                                                <div className={cn('p-2 rounded-md text-white h-full flex flex-col justify-between cursor-pointer', cellData.subject.color)}>
                                                                    <div>
                                                                        <p className="font-bold text-sm">{cellData.subject.name}</p>
                                                                        <p className="text-xs opacity-80">{cellData.subject.teacher}</p>
                                                                        {view !== 'Class View' && <p className="text-xs opacity-80 mt-1">@{cellData.className}</p>}
                                                                    </div>
                                                                    {view === 'Class View' && (
                                                                        <div className="text-right">
                                                                            <Dialog>
                                                                                <DialogTrigger asChild>
                                                                                    <Button variant="ghost" size="icon" className="h-6 w-6 text-white/50 hover:bg-white/20 hover:text-white"><Edit className="h-4 w-4" /></Button>
                                                                                </DialogTrigger>
                                                                                <DialogContent>
                                                                                    <DialogHeader>
                                                                                        <DialogTitle>Edit Lesson</DialogTitle>
                                                                                        <DialogDescription>Change the room for this lesson.</DialogDescription>
                                                                                    </DialogHeader>
                                                                                    <div className="py-4">
                                                                                        <Label htmlFor="room-select">Room</Label>
                                                                                        <Select defaultValue={cellData.room}>
                                                                                            <SelectTrigger id="room-select"><SelectValue/></SelectTrigger>
                                                                                            <SelectContent>{allRooms.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                                                                                        </Select>
                                                                                    </div>
                                                                                    <DialogFooter>
                                                                                        <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                                                                                        <Button disabled>Save</Button>
                                                                                    </DialogFooter>
                                                                                </DialogContent>
                                                                            </Dialog>
                                                                            <Button variant="ghost" size="icon" className="h-6 w-6 text-white/50 hover:bg-white/20 hover:text-white" onClick={() => handleClearCell(day, period.time)}>
                                                                                <Trash2 className="h-4 w-4" />
                                                                            </Button>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            ) : null
                                                        )}
                                                    </div>
                                                );
                                                
                                                const cell = (
                                                    cellData?.clash ? (
                                                        <TooltipProvider>
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>{content}</TooltipTrigger>
                                                                <TooltipContent>
                                                                    <p className="text-destructive">{cellData.clash.message}</p>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        </TooltipProvider>
                                                    ) : (
                                                        content
                                                    )
                                                );
                                                return <DroppableCell key={day} day={day} periodId={period.id}>{cell}</DroppableCell>
                                            })}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        }
                    </CardContent>
                    <CardFooter className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setTimetable({})}>Clear Timetable</Button>
                        <Dialog>
                            <DialogTrigger asChild><Button variant="secondary"><Share className="mr-2 h-4 w-4" />Publish</Button></DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Confirm Publish</DialogTitle>
                                    <DialogDescription>
                                        Are you sure you want to publish this timetable? This will make it visible to all teachers and students in this class.
                                    </DialogDescription>
                                </DialogHeader>
                                <DialogFooter>
                                    <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                                    <DialogClose asChild><Button onClick={handlePublish}>Yes, Publish</Button></DialogClose>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                        <Button onClick={handleSave}>
                            <Save className="mr-2 h-4 w-4" />
                            Save Timetable
                        </Button>
                    </CardFooter>
                </Card>
            </div>
            <div className="lg:col-span-1">
                <Card>
                    <CardHeader>
                        <CardTitle>Available Subjects</CardTitle>
                        <CardDescription>Drag these to the timetable.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {subjects.map(subject => (
                            <DraggableSubject key={subject.name} subject={subject} />
                        ))}
                        <Separator/>
                        <Dialog open={isAddSubjectOpen} onOpenChange={setIsAddSubjectOpen}>
                            <DialogTrigger asChild>
                                <Button variant="secondary" className="w-full">
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add New Subject
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[425px]">
                                <DialogHeader>
                                    <DialogTitle>Add New Subject</DialogTitle>
                                    <DialogDescription>
                                        Define a new subject that can be added to the timetable.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="new-subject-name">Subject Name</Label>
                                        <Input id="new-subject-name" value={newSubjectName} onChange={(e) => setNewSubjectName(e.target.value)} placeholder="e.g., Computer Science" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="new-subject-code">Subject Code</Label>
                                        <Input id="new-subject-code" value={newSubjectCode} onChange={(e) => setNewSubjectCode(e.target.value)} placeholder="e.g., 451" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="new-subject-dept">Department</Label>
                                        <Select onValueChange={setNewSubjectDept} value={newSubjectDept}>
                                            <SelectTrigger id="new-subject-dept">
                                                <SelectValue placeholder="Select a department" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {mockDepartments.map(dept => (
                                                    <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button type="button" onClick={handleAddNewSubject}>Save Subject</Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </CardContent>
                </Card>
            </div>
        </div>
    </DndContext>
  );
}

    