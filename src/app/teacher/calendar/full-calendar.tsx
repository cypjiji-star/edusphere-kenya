
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
  getDay,
  isToday,
  parse,
} from 'date-fns';
import { ChevronLeft, ChevronRight, PlusCircle, Bell, Clock, Users, Printer, FileDown, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger, PopoverClose } from '@/components/ui/popover';
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

type CalendarView = 'month' | 'week' | 'day';

type CalendarEvent = {
  id: string;
  date: Date;
  title: string;
  type: 'event' | 'holiday' | 'exam' | 'reminder';
  startTime?: string;
  endTime?: string;
};

const eventColors: Record<CalendarEvent['type'], string> = {
  event: 'bg-blue-500 hover:bg-blue-600',
  holiday: 'bg-green-500 hover:bg-green-600',
  exam: 'bg-red-500 hover:bg-red-600',
  reminder: 'bg-yellow-500 hover:bg-yellow-600',
};

const MOCK_EVENTS: CalendarEvent[] = [
  { id: '1', date: new Date(), title: "Staff Meeting", type: 'event', startTime: '11:00', endTime: '12:00' },
  { id: '2', date: new Date(), title: "Form 4 Chem Practical", type: 'exam', startTime: '13:00', endTime: '15:00' },
  { id: '3', date: sub(new Date(), { days: 2 }), title: "Grades Due", type: 'reminder' },
  { id: '4', date: add(new Date(), { days: 5 }), title: "Sports Day", type: 'event' },
  { id: '5', date: add(new Date(), { days: 10 }), title: "Mid-term Break", type: 'holiday' },
];


export function FullCalendar() {
  const [currentDate, setCurrentDate] = React.useState(new Date());
  const [view, setView] = React.useState<CalendarView>('month');

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
        <Popover>
            <PopoverTrigger asChild>
                <Button><PlusCircle className="mr-2"/> Add Event</Button>
            </PopoverTrigger>
             <PopoverContent className="w-96">
                <div className="grid gap-4">
                    <div className="space-y-1">
                        <h4 className="font-medium leading-none">Add New Event</h4>
                        <p className="text-sm text-muted-foreground">
                        Fill in the details to add a new event to the calendar.
                        </p>
                    </div>
                    <div className="grid gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="event-title">Title</Label>
                        <Input id="event-title" placeholder="e.g., Parent-Teacher Meeting" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="start-time">Start Time</Label>
                            <Input id="start-time" type="time" defaultValue="10:00" />
                        </div>
                         <div className="grid gap-2">
                            <Label htmlFor="end-time">End Time</Label>
                            <Input id="end-time" type="time" defaultValue="11:00" />
                        </div>
                      </div>
                       <div className="grid grid-cols-2 gap-4">
                          <div className="grid gap-2">
                            <Label htmlFor="event-type">Event Type</Label>
                            <Select>
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
                            <Label htmlFor="audience">Audience</Label>
                             <Select disabled>
                                <SelectTrigger id="audience">
                                    <SelectValue placeholder="Select audience" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Staff & Students</SelectItem>
                                    <SelectItem value="staff">Teachers Only</SelectItem>
                                    <SelectItem value="f4">Form 4 Students</SelectItem>
                                    <SelectItem value="parents">All Parents</SelectItem>
                                </SelectContent>
                              </Select>
                          </div>
                      </div>
                      <p className="text-xs text-muted-foreground -mt-2">Audience selection coming soon.</p>


                      <Separator />

                      <div className="space-y-3">
                         <h4 className="font-medium leading-none flex items-center gap-2"><Bell className="h-4 w-4 text-primary" /> Reminders & Notifications</h4>
                          <div className="grid gap-2">
                            <Label htmlFor="reminder">Reminder</Label>
                             <Select defaultValue="30" disabled>
                                <SelectTrigger id="reminder">
                                    <SelectValue placeholder="Set a reminder" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">None</SelectItem>
                                    <SelectItem value="5">5 minutes before</SelectItem>
                                    <SelectItem value="15">15 minutes before</SelectItem>
                                    <SelectItem value="30">30 minutes before</SelectItem>
                                    <SelectItem value="60">1 hour before</SelectItem>
                                    <SelectItem value="1440">1 day before</SelectItem>
                                </SelectContent>
                              </Select>
                          </div>
                          <div className="flex flex-col space-y-2 pt-2">
                              <Label>Notify via (coming soon)</Label>
                               <div className="flex items-center space-x-2">
                                  <Switch id="notify-app" defaultChecked disabled />
                                  <Label htmlFor="notify-app">In-App Notification</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                  <Switch id="notify-email" disabled />
                                  <Label htmlFor="notify-email">Email</Label>
                              </div>
                          </div>
                      </div>

                      <Button disabled className="w-full">
                        <PlusCircle className="mr-2 h-4 w-4"/>
                        Add to Calendar
                      </Button>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline">Export <ChevronDown className="ml-2 h-4 w-4" /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
                <DropdownMenuItem disabled><Printer className="mr-2 h-4 w-4" /> Print View</DropdownMenuItem>
                <DropdownMenuItem disabled><FileDown className="mr-2 h-4 w-4" /> Export as PDF</DropdownMenuItem>
                <DropdownMenuItem disabled><FileDown className="mr-2 h-4 w-4" /> Export as iCal (.ics)</DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
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
              const eventsForDay = MOCK_EVENTS.filter(e => isSameDay(e.date, day));
              return (
                <div
                  key={day.toString()}
                  className={cn(
                    'h-24 md:h-32 p-1 md:p-2 border-t border-l flex flex-col',
                    !isSameMonth(day, monthStart) && 'bg-muted/50 text-muted-foreground',
                     isToday(day) && 'bg-accent/20 relative'
                  )}
                >
                    {isToday(day) && <div className="absolute top-1 right-1 h-2 w-2 rounded-full bg-primary" />}
                  <span className={cn('font-medium text-xs md:text-sm', isToday(day) && 'text-primary')}>{format(day, 'd')}</span>
                   <div className="mt-1 space-y-1 overflow-y-auto">
                        {eventsForDay.map(event => (
                            <Badge key={event.id} className={cn('w-full truncate text-white text-[10px] md:text-xs', eventColors[event.type])}>
                                {event.title}
                            </Badge>
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
        const weekStart = startOfWeek(currentDate);
        const weekEnd = endOfWeek(currentDate);
        const days = eachDayOfInterval({ start: weekStart, end: weekEnd });
        const hours = Array.from({ length: 12 }, (_, i) => i + 8); // 8am to 7pm

        return (
             <div className="border rounded-lg overflow-hidden">
                <div className="grid grid-cols-[60px_1fr] h-full">
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
                    <div className="col-start-2 row-start-2 grid grid-cols-7 relative overflow-x-auto">
                        {days.map(day => (
                            <div key={day.toISOString()} className="border-l relative">
                                {hours.map(hour => (
                                     <div key={hour} className="h-16 border-t" />
                                ))}
                                {MOCK_EVENTS.filter(e => isSameDay(e.date, day) && e.startTime).map(event => {
                                    const startHour = parseInt(event.startTime!.split(':')[0], 10);
                                    const endHour = parseInt(event.endTime!.split(':')[0], 10);
                                    const top = (startHour - 8) * 4; // 4rem per hour (h-16)
                                    const height = (endHour - startHour) * 4;
                                     return (
                                        <div
                                            key={event.id}
                                            className={cn("absolute w-[calc(100%-4px)] ml-[2px] p-2 rounded-lg text-white text-xs", eventColors[event.type])}
                                            style={{ top: `${top}rem`, height: `${height}rem`}}
                                        >
                                            <p className="font-bold">{event.title}</p>
                                            <p>{event.startTime} - {event.endTime}</p>
                                        </div>
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
         const hours = Array.from({ length: 12 }, (_, i) => i + 8); // 8am to 7pm
         const eventsForDay = MOCK_EVENTS.filter(e => isSameDay(e.date, currentDate));

        return (
             <div className="border rounded-lg p-4">
                 <div className="space-y-4">
                    {eventsForDay.length > 0 ? eventsForDay.map(event => (
                        <div key={event.id} className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
                            <div className="w-24 text-sm font-semibold text-primary">
                                {event.startTime && event.endTime ? `${event.startTime} - ${event.endTime}` : 'All Day'}
                            </div>
                            <div className={cn("w-2 h-full rounded-full self-stretch", eventColors[event.type])} />
                             <div className="flex-1">
                                <p className="font-bold">{event.title}</p>
                                <Badge variant="secondary" className="capitalize">{event.type}</Badge>
                            </div>
                        </div>
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
    <div>
      {renderHeader()}
      {view === 'month' && renderMonthView()}
      {view === 'week' && renderWeekView()}
      {view === 'day' && renderDayView()}
    </div>
  );
}

