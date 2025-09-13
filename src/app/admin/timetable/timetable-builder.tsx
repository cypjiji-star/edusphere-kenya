
'use client';

import * as React from 'react';
import { DndContext, useDraggable, useDroppable, type DragEndEvent } from '@dnd-kit/core';
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
import { Edit, GripVertical, Plus, Save, Settings, Share, Trash2, AlertTriangle, FileDown, Printer, ChevronDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
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
import { classes, teachers, rooms, periods as initialPeriods, subjects, mockTimetableData, views, days } from './timetable-data';
import type { Subject } from './timetable-data';
import { useToast } from '@/hooks/use-toast';


function DraggableSubject({ subject }: { subject: Subject }) {
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
                "h-28 p-1 align-top border-r transition-colors",
                isOver && "bg-primary/20"
            )}
        >
            {children}
        </td>
    );
}

export function TimetableBuilder() {
  const [view, setView] = React.useState(views[0]);
  const [selectedItem, setSelectedItem] = React.useState(classes[0]);
  const [timetable, setTimetable] = React.useState(mockTimetableData);
  const [clientReady, setClientReady] = React.useState(false);
  const { toast } = useToast();
  const [periods, setPeriods] = React.useState(initialPeriods);

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


  React.useEffect(() => {
    setClientReady(true);
  }, []);

  const renderFilterDropdown = () => {
    let items: string[] = [];
    switch(view) {
        case 'Class View':
            items = classes;
            break;
        case 'Teacher View':
            items = teachers;
            break;
        case 'Room View':
            items = rooms;
            break;
    }
    
    return (
        <Select value={selectedItem} onValueChange={setSelectedItem}>
            <SelectTrigger className="w-full md:w-auto">
                <SelectValue placeholder={`Select ${view.split(' ')[0]}`} />
            </SelectTrigger>
            <SelectContent>
                {items.map(item => <SelectItem key={item} value={item}>{item}</SelectItem>)}
            </SelectContent>
        </Select>
    )
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { over, active } = event;
    const subject = active.data.current?.subject as Subject | undefined;

    if (over && subject) {
        const [day, periodIdStr] = over.id.toString().split('-');
        const periodId = parseInt(periodIdStr, 10);

        setTimetable(prev => {
            const newTimetable = { ...prev };
            if (!newTimetable[day]) {
                newTimetable[day] = {};
            }
            newTimetable[day][periodId] = {
                subject,
                room: 'Room TBD' // Placeholder room
            };
            return newTimetable;
        });
    }
  }
  
  const handleClearCell = (day: string, periodId: number) => {
    setTimetable(prev => {
        const newTimetable = { ...prev };
        if (newTimetable[day] && newTimetable[day][periodId]) {
            delete newTimetable[day][periodId];
        }
        return newTimetable;
    });
  }

  const handleSave = () => {
    toast({
        title: 'Timetable Saved',
        description: `The timetable for ${selectedItem} has been saved as a draft.`,
    })
  }
  
  const handlePublish = () => {
     toast({
        title: 'Timetable Published',
        description: `The timetable for ${selectedItem} is now live and visible to relevant users.`,
    })
  }
  
  const handleSavePeriods = () => {
    toast({
        title: 'Periods Saved',
        description: 'The school day periods have been updated for all timetables.',
    });
  };

  const handleExport = (type: string) => {
    toast({
      title: 'Exporting Timetable',
      description: `Your timetable is being exported as a ${type} file.`,
    });
  };

  if (!clientReady) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Loading Timetable...</CardTitle>
                <CardDescription>Please wait while the timetable builder is being prepared.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex items-center justify-center h-96">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
                </div>
            </CardContent>
        </Card>
    );
  }

  return (
    <DndContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-3">
                <Card>
                    <CardHeader>
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            <div>
                                <CardTitle>Timetable for {selectedItem}</CardTitle>
                                <CardDescription>Drag subjects from the right panel and drop them into time slots.</CardDescription>
                            </div>
                            <div className="flex w-full flex-wrap md:w-auto items-center gap-2">
                                <Select defaultValue="term2-2024">
                                    <SelectTrigger className="w-full sm:w-auto">
                                        <SelectValue placeholder="Select term" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="term2-2024">Term 2, 2024</SelectItem>
                                        <SelectItem value="term1-2024">Term 1, 2024</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Select value={view} onValueChange={(v) => {
                                    setView(v);
                                    if (v === 'Class View') setSelectedItem(classes[0]);
                                    if (v === 'Teacher View') setSelectedItem(teachers[0]);
                                    if (v === 'Room View') setSelectedItem(rooms[0]);
                                }}>
                                    <SelectTrigger className="w-full sm:w-auto">
                                        <SelectValue placeholder="Select view" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {views.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                {renderFilterDropdown()}
                                <Dialog>
                                    <DialogTrigger asChild>
                                        <Button variant="outline">
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
                                                <div key={period.id} className="grid grid-cols-[1fr_1fr_auto] items-center gap-4 border-b pb-4">
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
                                                    {period.isBreak && (
                                                        <div className="col-span-full grid grid-cols-[1fr_auto] items-center gap-4 pt-2">
                                                            <div className="space-y-1.5">
                                                                <Label htmlFor={`break-title-${period.id}`}>Break Title</Label>
                                                                <Input id={`break-title-${period.id}`} value={period.title} onChange={(e) => updatePeriod(period.id, 'title', e.target.value)} />
                                                            </div>
                                                            <div className="flex items-center space-x-2 self-end pb-1">
                                                                <Switch id={`is-break-${period.id}`} checked={period.isBreak} onCheckedChange={(checked) => updatePeriod(period.id, 'isBreak', checked)} />
                                                                <Label htmlFor={`is-break-${period.id}`}>Is a Break</Label>
                                                            </div>
                                                        </div>
                                                    )}
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
                                        <Button variant="outline">
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
                        <div className="w-full overflow-auto rounded-lg border">
                            <table className="w-full min-w-[800px]">
                                <thead>
                                    <tr className="border-b bg-muted/50">
                                        <th className="p-2 w-32 font-medium text-muted-foreground border-r">Time</th>
                                        {days.map(day => (
                                            <th key={day} className="p-2 font-medium text-muted-foreground">{day}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {periods.map(period => (
                                        <tr key={period.id} className="border-b">
                                            <td className="p-2 font-semibold text-primary text-sm border-r text-center">{period.time}</td>
                                            {days.map(day => {
                                                const cellData = timetable[day]?.[period.id];
                                                const content = (
                                                    <div className={cn("h-full w-full", cellData?.clash && "relative ring-2 ring-destructive ring-inset rounded-md")}>
                                                        {cellData?.clash && (
                                                            <div className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-0.5 z-10">
                                                                <AlertTriangle className="h-3 w-3" />
                                                            </div>
                                                        )}
                                                        {period.isBreak ? (
                                                            period.id === 4 ? <div className="h-full flex items-center justify-center bg-gray-100 rounded-md"><p className="text-xs font-semibold text-gray-500 transform -rotate-90">{period.title}</p></div> :
                                                            <div className="h-full flex items-center justify-center bg-gray-200 rounded-md"><p className="font-semibold text-gray-600">{period.title}</p></div>
                                                        ) : (
                                                            cellData ? (
                                                                <div className={cn('p-2 rounded-md text-white h-full flex flex-col justify-between cursor-pointer', cellData.subject.color)}>
                                                                    <div>
                                                                        <p className="font-bold text-sm">{cellData.subject.name}</p>
                                                                        <p className="text-xs opacity-80">{cellData.subject.teacher}</p>
                                                                        <p className="text-xs opacity-80 mt-1">@{cellData.room}</p>
                                                                    </div>
                                                                    <div className="text-right">
                                                                        <Button variant="ghost" size="icon" className="h-6 w-6 text-white/50 hover:bg-white/20 hover:text-white">
                                                                            <Edit className="h-4 w-4" />
                                                                        </Button>
                                                                        <Button variant="ghost" size="icon" className="h-6 w-6 text-white/50 hover:bg-white/20 hover:text-white" onClick={() => handleClearCell(day, period.id)}>
                                                                            <Trash2 className="h-4 w-4" />
                                                                        </Button>
                                                                    </div>
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
                    </CardContent>
                    <CardFooter className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setTimetable({})}>Clear Timetable</Button>
                        <Button variant="secondary" onClick={handlePublish}>
                            <Share className="mr-2 h-4 w-4" />
                            Publish
                        </Button>
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
                        <Button variant="secondary" className="w-full">
                            <Plus className="mr-2 h-4 w-4" />
                            Add New Subject
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    </DndContext>
  );
}
