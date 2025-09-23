"use client";

import * as React from "react";
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
} from "date-fns";
import {
  ChevronLeft,
  ChevronRight,
  Users,
  Printer,
  FileDown,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { firestore } from "@/lib/firebase";
import { collection, query, onSnapshot, Timestamp } from "firebase/firestore";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type CalendarView = "month" | "week" | "day";

type CalendarEvent = {
  id: string;
  date: Date;
  title: string;
  type: "event" | "holiday" | "exam" | "reminder";
  startTime?: string;
  endTime?: string;
};

const eventColors: Record<CalendarEvent["type"], string> = {
  event: "bg-blue-500 hover:bg-blue-600",
  holiday: "bg-green-500 hover:bg-green-600",
  exam: "bg-red-500 hover:bg-red-600",
  reminder: "bg-yellow-500 hover:bg-yellow-600",
};

export function FullCalendar({ schoolId }: { schoolId: string }) {
  const [currentDate, setCurrentDate] = React.useState(new Date());
  const [view, setView] = React.useState<CalendarView>("month");
  const [clientReady, setClientReady] = React.useState(false);
  const [events, setEvents] = React.useState<CalendarEvent[]>([]);

  React.useEffect(() => {
    if (!schoolId) return;
    setClientReady(true);
    const q = query(
      collection(firestore, `schools/${schoolId}/calendar-events`),
    );
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const fetchedEvents = querySnapshot.docs.map((doc) => {
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
    const newDate = sub(currentDate, {
      [view === "month" ? "months" : view === "week" ? "weeks" : "days"]: 1,
    });
    setCurrentDate(newDate);
  };

  const handleNext = () => {
    const newDate = add(currentDate, {
      [view === "month" ? "months" : view === "week" ? "weeks" : "days"]: 1,
    });
    setCurrentDate(newDate);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const renderHeader = () => (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
      <div className="flex items-center gap-2 mb-4 md:mb-0">
        <Button variant="outline" size="icon" onClick={handlePrev}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm" onClick={handleToday}>
          Today
        </Button>
        <Button variant="outline" size="icon" onClick={handleNext}>
          <ChevronRight className="h-4 w-4" />
        </Button>
        <h2 className="text-xl font-semibold ml-4 font-headline">
          {format(currentDate, "MMMM yyyy")}
        </h2>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 bg-muted p-1 rounded-md">
          {(["month", "week", "day"] as CalendarView[]).map((v) => (
            <Button
              key={v}
              variant={view === v ? "default" : "ghost"}
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
            <Button variant="outline">
              Export <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem disabled>
              <Printer className="mr-2 h-4 w-4" /> Print View
            </DropdownMenuItem>
            <DropdownMenuItem disabled>
              <FileDown className="mr-2 h-4 w-4" /> Export as PDF
            </DropdownMenuItem>
            <DropdownMenuItem disabled>
              <FileDown className="mr-2 h-4 w-4" /> Export as iCal (.ics)
            </DropdownMenuItem>
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
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div key={day} className="py-2 text-xs md:text-sm">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {weeks.map((weekStart) =>
            eachDayOfInterval({
              start: weekStart,
              end: endOfWeek(weekStart),
            }).map((day) => {
              const eventsForDay = events.filter((e) => isSameDay(e.date, day));
              const isTodayFlag = clientReady && isToday(day);
              return (
                <div
                  key={day.toString()}
                  className={cn(
                    "h-24 md:h-32 p-1 md:p-2 border-t border-l flex flex-col",
                    !isSameMonth(day, monthStart) &&
                      "bg-muted/50 text-muted-foreground",
                    isTodayFlag && "bg-accent/20 relative",
                  )}
                >
                  {isTodayFlag && (
                    <div className="absolute top-1 right-1 h-2 w-2 rounded-full bg-primary" />
                  )}
                  <span
                    className={cn(
                      "font-medium text-xs md:text-sm",
                      isTodayFlag && "text-primary",
                    )}
                  >
                    {format(day, "d")}
                  </span>
                  <div className="mt-1 space-y-1 overflow-y-auto">
                    {eventsForDay.map((event) => (
                      <Badge
                        key={event.id}
                        className={cn(
                          "w-full truncate text-white text-[10px] md:text-xs",
                          eventColors[event.type],
                        )}
                      >
                        {event.title}
                      </Badge>
                    ))}
                  </div>
                </div>
              );
            }),
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
            {days.map((day) => (
              <div key={day.toString()} className="text-center p-2 border-l">
                <p className="text-sm font-semibold">{format(day, "EEE")}</p>
                <p
                  className={cn(
                    "text-lg font-bold",
                    clientReady && isToday(day) && "text-primary",
                  )}
                >
                  {format(day, "d")}
                </p>
              </div>
            ))}
          </div>
          <div className="col-start-1 col-end-2 row-start-2 flex flex-col text-xs text-center text-muted-foreground">
            {hours.map((hour) => (
              <div
                key={hour}
                className="h-16 border-t flex-shrink-0 -mt-px pt-1 pr-1 text-right"
              >
                {format(parse(hour.toString(), "H", new Date()), "ha")}
              </div>
            ))}
          </div>
          <div className="col-start-2 row-start-2 grid grid-cols-7 relative">
            {days.map((day) => (
              <div key={day.toISOString()} className="border-l relative">
                {hours.map((hour) => (
                  <div key={hour} className="h-16 border-t" />
                ))}
                {events
                  .filter((e) => isSameDay(e.date, day) && e.startTime)
                  .map((event) => {
                    const startHour = parseInt(
                      event.startTime!.split(":")[0],
                      10,
                    );
                    const endHour = parseInt(event.endTime!.split(":")[0], 10);
                    const top = (startHour - 8) * 4; // 4rem per hour (h-16)
                    const height = (endHour - startHour) * 4;
                    return (
                      <div
                        key={event.id}
                        className={cn(
                          "absolute w-[calc(100%-4px)] ml-[2px] p-2 rounded-lg text-white text-xs",
                          eventColors[event.type],
                        )}
                        style={{ top: `${top}rem`, height: `${height}rem` }}
                      >
                        <p className="font-bold">{event.title}</p>
                        <p>
                          {event.startTime} - {event.endTime}
                        </p>
                      </div>
                    );
                  })}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderDayView = () => {
    const eventsForDay = events.filter((e) => isSameDay(e.date, currentDate));

    return (
      <div className="border rounded-lg p-4">
        <div className="space-y-4">
          {eventsForDay.length > 0 ? (
            eventsForDay.map((event) => (
              <div
                key={event.id}
                className="flex items-center gap-4 p-3 rounded-lg bg-muted/50"
              >
                <div className="w-24 text-sm font-semibold text-primary">
                  {event.startTime && event.endTime
                    ? `${event.startTime} - ${event.endTime}`
                    : "All Day"}
                </div>
                <div
                  className={cn(
                    "w-1.5 h-full rounded-full self-stretch",
                    eventColors[event.type],
                  )}
                />
                <div className="flex-1">
                  <p className="font-bold">{event.title}</p>
                  <Badge variant="secondary" className="capitalize">
                    {event.type}
                  </Badge>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center text-muted-foreground py-16">
              <p>No events scheduled for this day.</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div>
      {renderHeader()}
      {view === "month" && renderMonthView()}
      {view === "week" && renderWeekView()}
      {view === "day" && renderDayView()}
    </div>
  );
}
