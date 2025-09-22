

'use client';

import * as React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
  } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Calendar, User, Printer, FileDown, ChevronDown, BookOpen, MapPin, Loader2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { firestore } from '@/lib/firebase';
import { collection, query, onSnapshot, where, doc, getDoc, Timestamp } from 'firebase/firestore';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';


type Child = {
    id: string;
    name: string;
    classId: string; 
};

type Lesson = {
    subject: {
        name: string;
        teacher: string;
    };
    room: string;
};

type TimetableData = Record<string, Record<string, Lesson>>;

type PeriodData = { 
    id: number,
    time: string; 
    isBreak?: boolean; 
    title?: string 
};

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

const subjectDetails: Record<string, { color: string }> = {
    'Mathematics': { color: 'bg-blue-100 text-blue-800 border-blue-200' },
    'English': { color: 'bg-green-100 text-green-800 border-green-200' },
    'Chemistry': { color: 'bg-purple-100 text-purple-800 border-purple-200' },
    'History': { color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
    'Physics': { color: 'bg-orange-100 text-orange-800 border-orange-200' },
    'Geography': { color: 'bg-teal-100 text-teal-800 border-teal-200' },
    'Biology': { color: 'bg-pink-100 text-pink-800 border-pink-200' },
}

export default function ParentTimetablePage() {
    const searchParams = useSearchParams();
    const schoolId = searchParams.get('schoolId');
    const { user } = useAuth();
    const parentId = user?.uid;

    const [childrenData, setChildrenData] = React.useState<Child[]>([]);
    const [selectedChild, setSelectedChild] = React.useState<string | undefined>();
    const [timetableData, setTimetableData] = React.useState<TimetableData>({});
    const [periods, setPeriods] = React.useState<PeriodData[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const { toast } = useToast();
    
    React.useEffect(() => {
        if (!schoolId || !parentId) return;
        const q = query(collection(firestore, `schools/${schoolId}/users`), where('role', '==', 'Student'), where('parentId', '==', parentId));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedChildren = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Child));
            setChildrenData(fetchedChildren);
            if (!selectedChild && fetchedChildren.length > 0) {
                setSelectedChild(fetchedChildren[0].id);
            }
        });
        return () => unsubscribe();
    }, [schoolId, parentId, selectedChild]);

    React.useEffect(() => {
        if (!selectedChild || !schoolId) return;

        const fetchTimetable = async () => {
            setIsLoading(true);
            const child = childrenData.find(c => c.id === selectedChild);
            if (child?.classId) {
                const timetableRef = doc(firestore, 'schools', schoolId, 'timetables', child.classId);
                const timetableSnap = await getDoc(timetableRef);
                if (timetableSnap.exists()) {
                    setTimetableData(timetableSnap.data() as TimetableData);
                } else {
                    setTimetableData({});
                }
            } else {
                setTimetableData({});
            }
            
            const periodsRef = doc(firestore, 'schools', schoolId, 'timetableSettings', 'periods');
            const periodsSnap = await getDoc(periodsRef);
            if(periodsSnap.exists()) {
                setPeriods(periodsSnap.data().periods);
            }

            setIsLoading(false);
        };

        fetchTimetable();
    }, [selectedChild, childrenData, schoolId]);

    const handleExport = (type: 'PDF' | 'Print') => {
        toast({
            title: `Exporting Timetable as ${type}`,
            description: "Your timetable is being prepared.",
        });
        if (type === 'Print') {
            setTimeout(() => window.print(), 1000);
        }
    }
    
    if (!schoolId) {
        return <div className="p-8">Error: School ID is missing.</div>
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <div className="mb-6 p-4 md:p-6 bg-card border rounded-lg">
                <h1 className="font-headline text-3xl font-bold flex items-center gap-2">
                    <Calendar className="h-8 w-8 text-primary" />
                    Weekly Timetable
                </h1>
                <p className="text-muted-foreground">View your child's weekly class schedule.</p>
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
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline">
                                    Export
                                    <ChevronDown className="ml-2 h-4 w-4"/>
                                </Button>
                            </DropdownMenuTrigger>
                             <DropdownMenuContent>
                                <DropdownMenuItem onClick={() => handleExport('Print')}><Printer className="mr-2 h-4 w-4" /> Print Timetable</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleExport('PDF')}><FileDown className="mr-2 h-4 w-4" /> Export as PDF</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                         <div className="h-96 flex items-center justify-center">
                            <Loader2 className="h-10 w-10 animate-spin text-primary"/>
                        </div>
                    ) : (
                        <div className="w-full overflow-auto rounded-lg border">
                            <Table className="min-w-[800px]">
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-32 text-center">Time</TableHead>
                                        {days.map(day => (
                                            <TableHead key={day} className="text-center">{day}</TableHead>
                                        ))}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {periods.map(period => (
                                        <TableRow key={period.id}>
                                            <TableCell className="font-semibold text-center text-primary">{period.time}</TableCell>
                                            {days.map(day => {
                                                const entry = timetableData[day]?.[period.time];
                                                const subject = entry ? (entry as any).subject?.name : null;

                                                return (
                                                    <TableCell key={`${day}-${period.time}`} className="text-center p-1">
                                                        {period.isBreak ? (
                                                            <div className="h-full flex items-center justify-center bg-muted/50 rounded-md p-2">
                                                                <p className="font-semibold text-muted-foreground text-xs">{period.title}</p>
                                                            </div>
                                                        ) : entry ? (
                                                            <Popover>
                                                                <PopoverTrigger asChild>
                                                                    <div className={`p-2 rounded-md cursor-pointer transition-transform hover:scale-105 ${subjectDetails[subject as keyof typeof subjectDetails]?.color || 'bg-gray-100 text-gray-800'}`}>
                                                                        <p className="font-bold text-sm">{subject}</p>
                                                                    </div>
                                                                </PopoverTrigger>
                                                                <PopoverContent className="w-80">
                                                                    <div className="space-y-4">
                                                                        <h4 className="font-medium leading-none flex items-center gap-2">
                                                                            <BookOpen className="h-5 w-5 text-primary" />
                                                                            {subject}
                                                                        </h4>
                                                                        <div className="flex items-center gap-3">
                                                                            <Avatar className="h-9 w-9">
                                                                                <AvatarImage src={`https://picsum.photos/seed/${entry.subject.teacher}/100`} alt={entry.subject.teacher} />
                                                                                <AvatarFallback>{entry.subject.teacher.charAt(0)}</AvatarFallback>
                                                                            </Avatar>
                                                                            <div>
                                                                                <p className="text-sm font-semibold">{entry.subject.teacher}</p>
                                                                                <p className="text-xs text-muted-foreground">Teacher</p>
                                                                            </div>
                                                                        </div>
                                                                        <div className="flex items-center gap-3 text-sm">
                                                                            <MapPin className="h-4 w-4 text-muted-foreground" />
                                                                            <p>{entry.room}</p>
                                                                        </div>
                                                                    </div>
                                                                </PopoverContent>
                                                            </Popover>
                                                        ) : null}
                                                    </TableCell>
                                                )
                                            })}
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
