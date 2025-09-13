
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
} from 'date-fns';
import { ChevronLeft, ChevronRight, User, Filter, Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MOCK_EVENTS, CalendarEvent } from './mock-events';

type CalendarView = 'month' | 'week' | 'day';

const eventColors: Record<CalendarEvent['type'], string> = {
  event: 'bg-blue-500 hover:bg-blue-600',
  holiday: 'bg-green-500 hover:bg-green-600',
  exam: 'bg-red-500 hover:bg-red-600',
  meeting: 'bg-purple-500 hover:bg-purple-600',
  sports: 'bg-orange-500 hover:bg-orange-600',
  trip: 'bg-pink-500 hover:bg-pink-600',
};


const childrenData = [
  { id: 'child-1', name: 'John Doe', class: 'Form 4' },
  { id: 'child-2', name: 'Jane Doe', class: 'Form 1' },
];

const eventTypes: CalendarEvent['type'][] = ['exam', 'meeting', 'trip', 'sports', 'holiday', 'event'];


export function FullCalendar() {
  const [currentDate, setCurrentDate] = React.useState(MOCK_EVENTS[0]?.date || new Date());
  const [view, setView] = React.useState<CalendarView>('month');
  const [clientReady, setClientReady] = React.useState(false);

  React.useEffect(() => {
    setClientReady(true);
    setCurrentDate(new Date());
  }, []);

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
                <Select defaultValue={childrenData[0].id}>
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
                <Select>
                    <SelectTrigger className="w-full md:w-[150px]">
                        <SelectValue placeholder="Filter by Type" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Events</SelectItem>
                        {eventTypes.map(type => (
                             <SelectItem key={type} value={type} className="capitalize">{type}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <div className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5 text-primary"/>
                <Select defaultValue="month">
                    <SelectTrigger className="w-full md:w-[150px]">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="week">This Week</SelectItem>
                        <SelectItem value="month">This Month</SelectItem>
                        <SelectItem value="custom">Custom Range</SelectItem>
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
              const eventsForDay = MOCK_EVENTS.filter(e => isSameDay(e.date, day));
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
    <div>
      {renderHeader()}
      {view === 'month' && renderMonthView()}
      {view === 'week' && renderWeekView()}
      {view === 'day' && renderDayView()}
    </div>
  );
}
