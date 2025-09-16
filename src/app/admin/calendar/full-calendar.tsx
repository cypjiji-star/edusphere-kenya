
'use client';

import * as React from 'react';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  add,
  sub,
  eachWeekOfInterval,
  isToday,
  parse,
} from 'date-fns';
import { ChevronLeft, ChevronRight, PlusCircle, Bell, Clock, Users, Printer, FileDown, ChevronDown, MapPin, Edit, Trash2, Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import { firestore } from '@/lib/firebase';
import { collection, query, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { Calendar } from '@/components/ui/calendar';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { useSearchParams } from 'next/navigation';


type CalendarView = 'month' | 'week' | 'day';

type CalendarEvent = {
  id: string;
  date: Date;
  title: string;
  type: 'event' | 'holiday' | 'exam' | 'meeting';
  description: string;
  location?: string;
  startTime?: string;
  endTime?: string;
};

const eventColors: Record<CalendarEvent['type'], string> = {
  event: 'bg-blue-500 hover:bg-blue-600',
  holiday: 'bg-green-500 hover:bg-green-600',
  exam: 'bg-red-500 hover:bg-red-600',
  meeting: 'bg-purple-500 hover:bg-purple-600',
};


export function FullCalendar() {
  const searchParams = useSearchParams();
  const schoolId = searchParams.get('schoolId');
  const [currentDate, setCurrentDate] = React.useState(new Date());
  const [view, setView] = React.useState<CalendarView>('month');
  const [events, setEvents] = React.useState<CalendarEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = React.useState<CalendarEvent | null>(null);

  const [newEventTitle, setNewEventTitle] = React.useState('');
  const [newEventDate, setNewEventDate] = React.useState<Date | undefined>(new Date());
  const [newEventStartTime, setNewEventStartTime] = React.useState('10:00');
  const [newEventEndTime, setNewEventEndTime] = React.useState('11:00');
  const [newEventType, setNewEventType] = React.useState<CalendarEvent['type']>('event');
  const [newEventDescription, setNewEventDescription] = React.useState('');
  const [newEventLocation, setNewEventLocation] = React.useState('');
  const [isAddEventPopoverOpen, setIsAddEventPopoverOpen] = React.useState(false);
  const [notifyStaff, setNotifyStaff] = React.useState(true);
  const [notifyParents, setNotifyParents] = React.useState(false);
  const { toast } = useToast();
  const [editingEvent, setEditingEvent] = React.useState<CalendarEvent | null>(null);

  React.useEffect(() => {
    if (!schoolId) return;
    const q = query(collection(firestore, 'schools', schoolId, 'calendar-events'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const fetchedEvents = querySnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                date: (data.date as Timestamp).toDate(),
            } as CalendarEvent;
        });
        setEvents(fetchedEvents);
    });
    return () => unsubscribe();
  }, [schoolId]);


  const handlePrev = () => {
    const newDate = sub(currentDate, { [view === 'month' ? 'months' : view === 'week' ? 'weeks' : 'days']: 1 });
    setCurrentDate(newDate);
  };

  const handleNext = () => {
    const newDate = add(currentDate, { [view === 'month' ? 'months' : view === 'week' ? 'weeks' : 'days']: 1 });
    setCurrentDate(newDate);
  };
  
  const handleToday = () => {
    setCurrentDate(new Date());
  }
  
  const resetForm = () => {
    setNewEventTitle('');
    setNewEventDate(new Date());
    setNewEventStartTime('10:00');
    setNewEventEndTime('11:00');
    setNewEventType('event');
    setNewEventDescription('');
    setNewEventLocation('');
    setNotifyStaff(true);
    setNotifyParents(false);
    setEditingEvent(null);
  };

  const handleAddOrUpdateEvent = async () => {
    if (!newEventTitle || !newEventDate || !schoolId) {
      toast({
        title: 'Error',
        description: 'Event title, date, and school ID are required.',
        variant: 'destructive',
      });
      return;
    }
  
    const eventData = {
        title: newEventTitle,
        date: newEventDate,
        type: newEventType,
        startTime: newEventStartTime,
        endTime: newEventEndTime,
        description: newEventDescription,
        location: newEventLocation,
    };

    if (editingEvent) {
      // Update existing event
      const eventRef = doc(firestore, 'schools', schoolId, 'calendar-events', editingEvent.id);
      await updateDoc(eventRef, eventData);
      toast({
        title: 'Event Updated',
        description: `"${newEventTitle}" has been updated.`,
      });
    } else {
      // Add new event
      await addDoc(collection(firestore, 'schools', schoolId, 'calendar-events'), {
          ...eventData,
          createdAt: serverTimestamp(),
      });
      toast({
        title: 'Event Added',
        description: `"${newEventTitle}" has been added to the calendar.`,
      });
    }

    if (notifyStaff || notifyParents) {
        let notificationMessage = '';
        if (notifyStaff && notifyParents) {
            notificationMessage = 'Notifications sent to All Staff and All Parents.';
        } else if (notifyStaff) {
            notificationMessage = 'Notification sent to All Staff.';
        } else if (notifyParents) {
            notificationMessage = 'Notification sent to All Parents.';
        }
        toast({
            title: 'Notifications Sent',
            description: notificationMessage,
        });
    }

    resetForm();
    setIsAddEventPopoverOpen(false);
  };
  
  const handleEditClick = (event: CalendarEvent) => {
    setEditingEvent(event);
    setNewEventTitle(event.title);
    setNewEventDate(event.date);
    setNewEventType(event.type);
    setNewEventStartTime(event.startTime || '10:00');
    setNewEventEndTime(event.endTime || '11:00');
    setNewEventDescription(event.description || '');
    setNewEventLocation(event.location || '');
    setSelectedEvent(null);
    setIsAddEventPopoverOpen(true);
  };

  const handleExport = (type: 'PDF' | 'iCal') => {
    if (type === 'PDF') {
      const doc = new jsPDF();
      doc.text("School Calendar Events", 14, 16);
      
      const tableData = events.map(event => [
        format(event.date, 'PPP'),
        event.title,
        event.type,
        event.startTime ? `${event.startTime} - ${event.endTime}` : 'All Day',
        event.location || 'N/A',
      ]);

      (doc as any).autoTable({
          startY: 22,
          head: [['Date', 'Title', 'Type', 'Time', 'Location']],
          body: tableData,
      });
      
      doc.save("school-calendar.pdf");

      toast({
          title: 'Export Successful',
          description: 'Your calendar has been downloaded as a PDF.',
      });
    } else {
        toast({
            title: `Exporting Calendar as ${type}`,
            description: `Your calendar is being prepared for export. This feature is coming soon.`,
        });
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!schoolId) return;
    await deleteDoc(doc(firestore, 'schools', schoolId, 'calendar-events', eventId));
    setSelectedEvent(null);
    toast({
        title: "Event Deleted",
        description: "The event has been removed from the calendar.",
        variant: "destructive",
    })
  };

  const renderHeader = () => (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
      <div className="flex items-center gap-2 mb-4 md:mb-0">
        <Button variant="outline" size="icon" onClick={handlePrev}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm" onClick={handleToday}>Today</Button>
        <Button variant="outline" size="icon" onClick={handleNext}>
          <ChevronRight className="h-4 w-4" />
        </Button>
        <h2 className="text-xl font-semibold ml-4 font-headline">
          {format(currentDate, view === 'month' ? 'MMMM yyyy' : view === 'week' ? 'MMMM yyyy' : 'PPP')}
        </h2>
      </div>
       <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 bg-muted p-1 rounded-md">
            {(['month', 'week', 'day'] as CalendarView[]).map(v => (
            <Button
                key={v}
                variant={view === v ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setView(v)}
                className="capitalize"
            >
                {v}
            </Button>
            ))}
        </div>
         <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline">Export <ChevronDown className="ml-2 h-4 w-4" /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
                <DropdownMenuItem onClick={() => window.print()}><Printer className="mr-2 h-4 w-4" /> Print View</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport('PDF')}><FileDown className="mr-2 h-4 w-4" /> Export as PDF</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport('iCal')}><FileDown className="mr-2 h-4 w-4" /> Export as iCal (.ics)</DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
        <Popover open={isAddEventPopoverOpen} onOpenChange={(open) => {
            setIsAddEventPopoverOpen(open);
            if (!open) resetForm();
        }}>
            <PopoverTrigger asChild>
                <Button><PlusCircle className="mr-2"/> Add Event</Button>
            </PopoverTrigger>
             <PopoverContent className="w-[90vw] md:w-96 p-0">
                <div className="p-4 max-h-[80vh] overflow-y-auto">
                    <div className="grid gap-4">
                        <div className="space-y-1">
                            <h4 className="font-medium leading-none">{editingEvent ? 'Edit Event' : 'Add New Event'}</h4>
                            <p className="text-sm text-muted-foreground">
                            {editingEvent ? 'Update the details for this event.' : 'Fill in the details to add a new event.'}
                            </p>
                        </div>
                        <div className="grid gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="event-title">Title</Label>
                            <Input id="event-title" placeholder="e.g., Parent-Teacher Meeting" value={newEventTitle} onChange={(e) => setNewEventTitle(e.target.value)} />
                        </div>
                        <div className="grid gap-2">
                            <Label>Date</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" className="font-normal w-full justify-start">
                                        <CalendarIcon className="mr-2 h-4 w-4"/>
                                        {newEventDate ? format(newEventDate, 'PPP') : 'Pick a date'}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent>
                                    <Calendar mode="single" selected={newEventDate} onSelect={setNewEventDate} initialFocus/>
                                </PopoverContent>
                            </Popover>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="start-time">Start Time</Label>
                                <Input id="start-time" type="time" value={newEventStartTime} onChange={(e) => setNewEventStartTime(e.target.value)} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="end-time">End Time</Label>
                                <Input id="end-time" type="time" value={newEventEndTime} onChange={(e) => setNewEventEndTime(e.target.value)} />
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="event-type">Event Type</Label>
                            <Select value={newEventType} onValueChange={(value: CalendarEvent['type']) => setNewEventType(value)}>
                                <SelectTrigger id="event-type">
                                    <SelectValue placeholder="Select a type" />
                                </SelectTrigger>
                                <SelectContent>
                                    {Object.entries(eventColors).map(([type, colorClass]) => (
                                        <SelectItem key={type} value={type}>
                                            <div className="flex items-center gap-2">
                                                <div className={cn("w-2 h-2 rounded-full", colorClass)} />
                                                <span className="capitalize">{type}</span>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                            <div className="grid gap-2">
                                <Label htmlFor="event-description">Description</Label>
                                <Textarea id="event-description" placeholder="Event details..." value={newEventDescription} onChange={(e) => setNewEventDescription(e.target.value)} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="event-location">Location</Label>
                                <Input id="event-location" placeholder="e.g., Main Hall" value={newEventLocation} onChange={(e) => setNewEventLocation(e.target.value)} />
                            </div>

                        <Separator />

                        <div className="space-y-3">
                            <h4 className="font-medium leading-none flex items-center gap-2"><Bell className="h-4 w-4 text-primary" /> Notifications</h4>
                            <p className="text-xs text-muted-foreground">Notify relevant groups about this event.</p>
                            <div className="flex flex-col space-y-2 pt-2">
                                    <div className="flex items-center space-x-2">
                                    <Switch id="notify-staff" checked={notifyStaff} onCheckedChange={setNotifyStaff}/>
                                    <Label htmlFor="notify-staff">All Staff</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Switch id="notify-parents" checked={notifyParents} onCheckedChange={setNotifyParents} />
                                    <Label htmlFor="notify-parents">All Parents</Label>
                                </div>
                            </div>
                        </div>
                        </div>
                    </div>
                </div>
                <div className="p-4 border-t">
                    <Button onClick={handleAddOrUpdateEvent} className="w-full">
                        <PlusCircle className="mr-2 h-4 w-4"/>
                        {editingEvent ? 'Save Changes' : 'Add to Calendar'}
                    </Button>
                </div>
            </PopoverContent>
        </Popover>
      </div>
    </div>
  );

  const renderMonthView = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const weeks = eachWeekOfInterval({ start: monthStart, end: monthEnd });

    return (
      <div className="border rounded-lg">
        <div className="grid grid-cols-7 text-center font-semibold text-sm text-muted-foreground border-b">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="py-2 text-xs md:text-sm">{day}</div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {weeks.map((weekStart, weekIndex) =>
            eachDayOfInterval({ start: weekStart, end: endOfWeek(weekStart) }).map((day, dayIndex) => {
              const eventsForDay = events.filter(e => isSameDay(e.date, day));
              return (
                <DialogTrigger key={day.toString()} asChild>
                    <div
                      onClick={() => eventsForDay.length > 0 && setSelectedEvent(eventsForDay[0])}
                      className={cn(
                        'h-24 md:h-32 p-1 md:p-2 border-t border-l flex flex-col',
                        !isSameMonth(day, monthStart) && 'bg-muted/50 text-muted-foreground',
                        isToday(day) && 'bg-accent/20 relative',
                        eventsForDay.length > 0 && 'cursor-pointer hover:bg-muted/50'
                      )}
                    >
                        {isToday(day) && <div className="absolute top-1 right-1 h-2 w-2 rounded-full bg-primary" />}
                      <span className={cn('font-medium text-xs md:text-sm', isToday(day) && 'text-primary')}>{format(day, 'd')}</span>
                       <div className="mt-1 space-y-1 overflow-y-auto">
                            {eventsForDay.map(event => (
                                <Badge 
                                    key={event.id}
                                    className={cn('w-full truncate text-white text-[10px] md:text-xs', eventColors[event.type])}
                                    title={event.title}
                                >
                                    {event.title}
                                </Badge>
                            ))}
                       </div>
                    </div>
                </DialogTrigger>
              );
            })
          )}
        </div>
      </div>
    );
  };
  
    const renderWeekView = () => {
        const weekStart = startOfWeek(currentDate);
        const weekEnd = endOfWeek(currentDate);
        const days = eachDayOfInterval({ start: weekStart, end: weekEnd });
        const hours = Array.from({ length: 12 }, (_, i) => i + 8); // 8am to 7pm

        return (
             <div className="border rounded-lg overflow-x-auto">
                <div className="grid grid-cols-[60px_1fr] h-full min-w-[800px]">
                    <div className="col-start-2 grid grid-cols-7 border-b">
                         {days.map(day => (
                            <div key={day.toString()} className="text-center p-2 border-l">
                                <p className="text-sm font-semibold">{format(day, 'EEE')}</p>
                                <p className={cn("text-lg font-bold", isToday(day) && "text-primary")}>{format(day, 'd')}</p>
                            </div>
                        ))}
                    </div>
                    <div className="col-start-1 col-end-2 row-start-2 flex flex-col text-xs text-center text-muted-foreground">
                        {hours.map(hour => (
                            <div key={hour} className="h-16 border-t flex-shrink-0 -mt-px pt-1 pr-1 text-right">
                                {format(parse(hour.toString(), 'H', new Date()), 'ha')}
                            </div>
                        ))}
                    </div>
                    <div className="col-start-2 row-start-2 grid grid-cols-7 relative">
                        {days.map(day => (
                            <div key={day.toISOString()} className="border-l relative">
                                {hours.map(hour => (
                                     <div key={hour} className="h-16 border-t" />
                                ))}
                                {events.filter(e => isSameDay(e.date, day) && e.startTime).map(event => {
                                    const startHour = parseInt(event.startTime!.split(':')[0], 10);
                                    const endHour = parseInt(event.endTime!.split(':')[0], 10);
                                    const top = (startHour - 8) * 4; // 4rem per hour (h-16)
                                    const height = (endHour - startHour) * 4;
                                     return (
                                        <DialogTrigger key={event.id} asChild>
                                            <div
                                                onClick={() => setSelectedEvent(event)}
                                                className={cn("absolute w-[calc(100%-4px)] ml-[2px] p-2 rounded-lg text-white text-xs cursor-pointer", eventColors[event.type])}
                                                style={{ top: `${top}rem`, height: `${height}rem`}}
                                            >
                                                <p className="font-bold">{event.title}</p>
                                                <p>{event.startTime} - {event.endTime}</p>
                                            </div>
                                        </DialogTrigger>
                                     )
                                })}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        )
    };

    const renderDayView = () => {
         const eventsForDay = events.filter(e => isSameDay(e.date, currentDate));

        return (
             <div className="border rounded-lg p-4">
                 <div className="space-y-4">
                    {eventsForDay.length > 0 ? eventsForDay.map(event => (
                        <DialogTrigger key={event.id} asChild>
                            <div onClick={() => setSelectedEvent(event)} className="flex items-center gap-4 p-3 rounded-lg bg-muted/50 cursor-pointer hover:bg-muted">
                                <div className="w-24 text-sm font-semibold text-primary">
                                    {event.startTime && event.endTime ? `${event.startTime} - ${event.endTime}` : 'All Day'}
                                </div>
                                <div className={cn("w-1.5 h-full rounded-full self-stretch", eventColors[event.type])} />
                                <div className="flex-1">
                                    <p className="font-bold">{event.title}</p>
                                    <Badge variant="secondary" className="capitalize">{event.type}</Badge>
                                </div>
                            </div>
                        </DialogTrigger>
                    )) : (
                         <div className="text-center text-muted-foreground py-16">
                            <p>No events scheduled for this day.</p>
                        </div>
                    )}
                 </div>
            </div>
        )
    };
  

  return (
    <Dialog onOpenChange={(open) => !open && setSelectedEvent(null)}>
      {renderHeader()}
      {view === 'month' && renderMonthView()}
      {view === 'week' && renderWeekView()}
      {view === 'day' && renderDayView()}

       {selectedEvent && (
        <DialogContent className="sm:max-w-xl">
            <DialogHeader>
                <DialogTitle className="font-headline text-2xl">{selectedEvent.title}</DialogTitle>
                <DialogDescription>
                    <Badge className={cn("text-white", eventColors[selectedEvent.type])}>{selectedEvent.type}</Badge>
                </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4">
                 <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>{selectedEvent.startTime ? `${selectedEvent.startTime} - ${selectedEvent.endTime}` : 'All Day'}</span>
                    </div>
                    {selectedEvent.location && (
                        <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <span>{selectedEvent.location}</span>
                        </div>
                    )}
                </div>
                <Separator/>
                <p className="text-sm text-muted-foreground">{selectedEvent.description}</p>
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
                <Button variant="outline" onClick={() => handleEditClick(selectedEvent)}>
                    <Edit className="mr-2 h-4 w-4"/>
                    Edit Event
                </Button>
                <Button variant="destructive" onClick={() => handleDeleteEvent(selectedEvent.id)}>
                    <Trash2 className="mr-2 h-4 w-4"/>
                    Delete Event
                </Button>
            </DialogFooter>
        </DialogContent>
      )}
    </Dialog>
  );
}
    
