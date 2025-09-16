
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
import { ChevronLeft, ChevronRight, User, Filter, Calendar as CalendarIcon, Clock, MapPin, Paperclip, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { firestore } from '@/lib/firebase';
import { collection, query, onSnapshot, Timestamp, where } from 'firebase/firestore';


type CalendarView = 'month' | 'week' | 'day';

export type CalendarEvent = {
  id: string;
  date: Date;
  title: string;
  type: 'event' | 'holiday' | 'exam' | 'meeting' | 'sports' | 'trip';
  description: string;
  location?: string;
  startTime?: string;
  endTime?: string;
  attachments?: { name: string; size: string }[];
};

type Child = {
    id: string;
    name: string;
};


const eventColors: Record<CalendarEvent['type'], string> = {
  event: 'bg-blue-500 hover:bg-blue-600',
  holiday: 'bg-green-500 hover:bg-green-600',
  exam: 'bg-red-500 hover:bg-red-600',
  meeting: 'bg-purple-500 hover:bg-purple-600',
  sports: 'bg-orange-500 hover:bg-orange-600',
  trip: 'bg-pink-500 hover:bg-pink-600',
};

const eventTypes: CalendarEvent['type'][] = ['exam', 'meeting', 'trip', 'sports', 'holiday', 'event'];


export function FullCalendar({ schoolId }: { schoolId: string }) {
  const [currentDate, setCurrentDate] = React.useState(new Date());
  const [view, setView] = React.useState<CalendarView>('month');
  const [clientReady, setClientReady] = React.useState(false);
  const [events, setEvents] = React.useState<CalendarEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = React.useState<CalendarEvent | null>(null);
  const [childrenData, setChildrenData] = React.useState<Child[]>([]);
  const [selectedChild, setSelectedChild] = React.useState<string | undefined>();
  const [eventTypeFilter, setEventTypeFilter] = React.useState('all');
  const { toast } = useToast();
  const parentId = 'parent-user-id'; // This should be dynamic

  React.useEffect(() => {
    if (!schoolId) return;
    const q = query(collection(firestore, `schools/${schoolId}/students`), where('parentId', '==', parentId));
    const unsubscribe = onSnapshot(q, (snapshot) => {
        const fetchedChildren = snapshot.docs.map(doc => ({ id: doc.id, name: doc.data().name }));
        setChildrenData(fetchedChildren);
        if (!selectedChild && fetchedChildren.length > 0) {
            setSelectedChild(fetchedChildren[0].id);
        }
    });
    return () => unsubscribe();
  }, [schoolId, selectedChild, parentId]);

  React.useEffect(() => {
    if (!schoolId) return;
    setClientReady(true);
    const q = query(collection(firestore, `schools/${schoolId}/calendar-events`));
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
  
  const handleToastAction = (title: string, description: string) => {
    toast({ title, description });
  }

  const filteredEvents = React.useMemo(() => {
    return events.filter(event => {
        const matchesType = eventTypeFilter === 'all' || event.type === eventTypeFilter;
        // In a real app, you would add logic to filter by child's class, etc.
        const matchesChild = selectedChild ? true : false;
        return matchesType && matchesChild;
    });
  }, [events, eventTypeFilter, selectedChild]);


  const renderHeader = () => (
    <div className="flex flex-col space-y-4 md:space-y-0 md:flex-row md:items-center md:justify-between mb-4">
        <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={handlePrev}>
            <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleToday}>Today</Button>
            <Button variant="outline" size="icon" onClick={handleNext}>
            <ChevronRight className="h-4 w-4" />
            </Button>
            <h2 className="text-xl font-semibold ml-4 font-headline">
            {format(currentDate, 'MMMM yyyy')}
            </h2>
        </div>
        <div className="flex flex-col gap-2 md:flex-row md:items-center">
            <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary"/>
                <Select value={selectedChild} onValueChange={setSelectedChild}>
                    <SelectTrigger className="w-full md:w-[180px]">
                        <SelectValue placeholder="Select a child" />
                    </SelectTrigger>
                    <SelectContent>
                        {childrenData.map((child) => (
                            <SelectItem key={child.id} value={child.id}>{child.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
             <div className="flex items-center gap-2">
                <Filter className="h-5 w-5 text-primary"/>
                <Select value={eventTypeFilter} onValueChange={setEventTypeFilter}>
                    <SelectTrigger className="w-full md:w-[150px]">
                        <SelectValue placeholder="Filter by Type" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Events</SelectItem>
                        {eventTypes.map(type => (
                             <SelectItem key={type} value={type} className="capitalize">{type.charAt(0).toUpperCase() + type.slice(1)}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
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
          {weeks.map((weekStart) =>
            eachDayOfInterval({ start: weekStart, end: endOfWeek(weekStart) }).map((day) => {
              const eventsForDay = filteredEvents.filter(e => isSameDay(e.date, day));
              const isTodayFlag = clientReady && isToday(day);
              return (
                <div
                  key={day.toString()}
                  className={cn(
                    'h-24 md:h-32 p-1 md:p-2 border-t border-l flex flex-col',
                    !isSameMonth(day, monthStart) && 'bg-muted/50 text-muted-foreground',
                     isTodayFlag && 'bg-accent/20 relative'
                  )}
                >
                    {isTodayFlag && <div className="absolute top-1 right-1 h-2 w-2 rounded-full bg-primary" />}
                  <span className={cn('font-medium text-xs md:text-sm', isTodayFlag && 'text-primary')}>{format(day, 'd')}</span>
                   <div className="mt-1 space-y-1 overflow-y-auto">
                        {eventsForDay.map(event => (
                          <DialogTrigger key={event.id} asChild>
                            <Badge 
                                onClick={() => setSelectedEvent(event)}
                                className={cn('w-full truncate text-white text-[10px] md:text-xs cursor-pointer', eventColors[event.type])}
                                title={event.title}
                            >
                                {event.title}
                            </Badge>
                           </DialogTrigger>
                        ))}
                   </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  };
  
    const renderWeekView = () => {
        return (
             <div className="text-center text-muted-foreground py-16">
                <p>Week view is not available yet.</p>
            </div>
        )
    };

    const renderDayView = () => {
        return (
             <div className="text-center text-muted-foreground py-16">
                <p>Day view is not available yet.</p>
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
                <Badge className={cn("w-fit text-white", eventColors[selectedEvent.type])}>{selectedEvent.type.charAt(0).toUpperCase() + selectedEvent.type.slice(1)}</Badge>
                <DialogTitle className="font-headline text-2xl">{selectedEvent.title}</DialogTitle>
            </DialogHeader>
            <div className="py-4 space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                        <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                        <span>{format(selectedEvent.date, 'PPP')}</span>
                    </div>
                    {selectedEvent.startTime && (
                        <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span>{selectedEvent.startTime} - {selectedEvent.endTime}</span>
                        </div>
                    )}
                </div>
                {selectedEvent.location && (
                     <div className="flex items-center gap-2 text-sm">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span>{selectedEvent.location}</span>
                    </div>
                )}
                <Separator />
                <div>
                    <h4 className="font-semibold text-primary mb-2">Details</h4>
                    <p className="text-sm text-muted-foreground">{selectedEvent.description}</p>
                </div>
                 {selectedEvent.attachments && selectedEvent.attachments.length > 0 && (
                    <>
                        <Separator />
                        <div>
                            <h4 className="font-semibold text-primary mb-2">Attachments</h4>
                            <div className="space-y-2">
                                {selectedEvent.attachments.map((file, index) => (
                                    <Button key={index} variant="outline" size="sm" className="w-full justify-start" onClick={() => handleToastAction('Downloading Attachment', `Your download for "${file.name}" will start shortly.`)}>
                                        <Paperclip className="mr-2 h-4 w-4"/>
                                        {file.name} ({file.size})
                                    </Button>
                                ))}
                            </div>
                        </div>
                    </>
                 )}
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
                <Button variant="secondary" onClick={() => handleToastAction('RSVP Sent', 'Your response has been noted.')}>
                    <Check className="mr-2 h-4 w-4" />
                    RSVP
                </Button>
                 <Button variant="outline" onClick={() => handleToastAction('Event Added', 'This event has been added to your personal calendar.')}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    Add to my Calendar
                </Button>
            </DialogFooter>
        </DialogContent>
      )}
    </Dialog>
  );
}
