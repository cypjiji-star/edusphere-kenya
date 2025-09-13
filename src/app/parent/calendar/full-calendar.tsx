
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
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

type CalendarView = 'month' | 'week' | 'day';

type CalendarEvent = {
  id: string;
  date: Date;
  title: string;
  type: 'event' | 'holiday' | 'exam' | 'meeting';
};

const eventColors: Record<CalendarEvent['type'], string> = {
  event: 'bg-blue-500 hover:bg-blue-600',
  holiday: 'bg-green-500 hover:bg-green-600',
  exam: 'bg-red-500 hover:bg-red-600',
  meeting: 'bg-purple-500 hover:bg-purple-600',
};

const MOCK_EVENTS: CalendarEvent[] = [
  { id: '1', date: new Date(), title: "Form 4 Exams Begin", type: 'exam' },
  { id: '2', date: add(new Date(), { days: 1 }), title: "PTA Meeting", type: 'meeting' },
  { id: '3', date: sub(new Date(), { days: 5 }), title: "Staff Briefing", type: 'meeting' },
  { id: '4', date: add(new Date(), { days: 12 }), title: "Annual Sports Day", type: 'event' },
  { id: '5', date: add(new Date(), { days: 20 }), title: "Moi Day", type: 'holiday' },
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
          {format(currentDate, 'MMMM yyyy')}
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

    