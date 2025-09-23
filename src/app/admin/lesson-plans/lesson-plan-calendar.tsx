"use client";

import * as React from "react";
import Link from "next/link";
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
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

type LessonPlan = {
  id: string;
  topic: string;
  date: string;
  teacher: { name: string };
};

interface LessonPlanCalendarProps {
  lessonPlans: LessonPlan[];
}

const statusColors: Record<string, string> = {
  "Mr. Otieno": "bg-blue-500",
  "Ms. Njeri": "bg-purple-500",
  "Ms. Wanjiku": "bg-green-600",
  "Mr. Kamau": "bg-yellow-500",
};

export function LessonPlanCalendar({ lessonPlans }: LessonPlanCalendarProps) {
  const [currentDate, setCurrentDate] = React.useState(new Date());

  const handlePrevMonth = () => setCurrentDate(sub(currentDate, { months: 1 }));
  const handleNextMonth = () => setCurrentDate(add(currentDate, { months: 1 }));
  const handleToday = () => setCurrentDate(new Date());

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const weeks = eachWeekOfInterval({ start: monthStart, end: monthEnd });

  const renderHeader = () => (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" onClick={handlePrevMonth}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm" onClick={handleToday}>
          Today
        </Button>
        <Button variant="outline" size="icon" onClick={handleNextMonth}>
          <ChevronRight className="h-4 w-4" />
        </Button>
        <h2 className="text-xl font-semibold ml-4 font-headline">
          {format(currentDate, "MMMM yyyy")}
        </h2>
      </div>
    </div>
  );

  return (
    <div>
      {renderHeader()}
      <div className="border rounded-lg">
        <div className="grid grid-cols-7 text-center font-semibold text-sm text-muted-foreground border-b">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div key={day} className="py-2 text-xs">
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
              const plansForDay = lessonPlans.filter((p) =>
                isSameDay(new Date(p.date), day),
              );
              return (
                <div
                  key={day.toString()}
                  className={cn(
                    "h-28 md:h-40 p-1 md:p-2 border-t border-l flex flex-col",
                    !isSameMonth(day, monthStart) &&
                      "bg-muted/50 text-muted-foreground",
                    isToday(day) && "bg-accent/20",
                  )}
                >
                  <span
                    className={cn(
                      "font-medium text-xs",
                      isToday(day) && "text-primary",
                    )}
                  >
                    {format(day, "d")}
                  </span>
                  <div className="mt-1 space-y-1 overflow-y-auto">
                    {plansForDay.map((plan) => (
                      <Link
                        key={plan.id}
                        href={`/admin/lesson-plans/${plan.id}`}
                      >
                        <Badge
                          className={cn(
                            "w-full truncate text-white cursor-pointer text-[10px] md:text-xs",
                            statusColors[plan.teacher.name] || "bg-gray-500",
                          )}
                          title={`${plan.topic} - ${plan.teacher.name}`}
                        >
                          {plan.topic}
                        </Badge>
                      </Link>
                    ))}
                    {/* Add logic here to highlight days with missing plans */}
                  </div>
                </div>
              );
            }),
          )}
        </div>
      </div>
    </div>
  );
}
