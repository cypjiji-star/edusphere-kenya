
'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Calendar,
  ArrowRight,
  PlusCircle,
  Bell,
  Clock,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { upcomingEvents, eventTypeColors } from './dashboard-data';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
  } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { Calendar as CalendarPicker } from '@/components/ui/calendar';
import { format } from 'date-fns';

export function CalendarWidget() {
  const [scheduledDate, setScheduledDate] = React.useState<Date | undefined>(
    new Date()
  );

  return (
    <Dialog>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="font-headline text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Upcoming Events
            </CardTitle>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm">
                <PlusCircle className="mr-2 h-4 w-4" />
                Quick Add
              </Button>
            </DialogTrigger>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {upcomingEvents.map((event, index) => (
              <div key={index}>
                <div className="flex items-center gap-4">
                  <div className="flex flex-col items-center justify-center w-14 text-center bg-muted/50 rounded-md p-2">
                    <span className="text-sm font-bold uppercase text-primary">
                      {event.day}
                    </span>
                    <span className="text-xl font-bold">{event.date}</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm">{event.title}</p>
                    <Badge
                      className={`mt-1 text-white ${eventTypeColors[event.type]}`}
                    >
                      {event.type}
                    </Badge>
                  </div>
                </div>
                {index < upcomingEvents.length - 1 && (
                  <Separator className="mt-4" />
                )}
              </div>
            ))}
            {upcomingEvents.length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                <p>No upcoming events scheduled.</p>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter>
          <Button asChild variant="outline" size="sm" className="w-full">
            <Link href="/admin/calendar">
              View Full Calendar
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </CardFooter>
      </Card>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Add New Event</DialogTitle>
          <DialogDescription>
            Quickly add a new event to the school calendar.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="event-title">Title</Label>
                    <Input id="event-title" placeholder="e.g., Parent-Teacher Meeting" />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="event-type">Event Type</Label>
                    <Select>
                        <SelectTrigger id="event-type">
                            <SelectValue placeholder="Select a type" />
                        </SelectTrigger>
                        <SelectContent>
                            {Object.entries(eventTypeColors).map(([type]) => (
                                <SelectItem key={type} value={type}>
                                    <div className="flex items-center gap-2">
                                        <div className={cn("w-2 h-2 rounded-full", eventTypeColors[type as keyof typeof eventTypeColors])} />
                                        <span className="capitalize">{type}</span>
                                    </div>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>Date</Label>
                     <Popover>
                        <PopoverTrigger asChild>
                        <Button
                            variant={"outline"}
                            className={cn(
                            "w-full justify-start text-left font-normal",
                            !scheduledDate && "text-muted-foreground"
                            )}
                        >
                            <Calendar className="mr-2 h-4 w-4" />
                            {scheduledDate ? format(scheduledDate, "PPP") : <span>Pick a date</span>}
                        </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                        <CalendarPicker
                            mode="single"
                            selected={scheduledDate}
                            onSelect={setScheduledDate}
                            initialFocus
                        />
                        </PopoverContent>
                    </Popover>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="start-time">Time (Optional)</Label>
                    <Input id="start-time" type="time" />
                </div>
            </div>
             <div className="space-y-2">
                <Label htmlFor="event-description">Description (Optional)</Label>
                <Textarea id="event-description" placeholder="Add a brief description..." />
            </div>

            <Separator />

            <div className="space-y-3">
                <h4 className="font-medium leading-none flex items-center gap-2"><Bell className="h-4 w-4 text-primary" /> Notifications</h4>
                <p className="text-xs text-muted-foreground">Notify relevant groups about this event. (Feature coming soon).</p>
                <div className="flex flex-col space-y-2 pt-2">
                        <div className="flex items-center space-x-2">
                        <Switch id="notify-staff" disabled />
                        <Label htmlFor="notify-staff">All Staff</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Switch id="notify-parents" disabled />
                        <Label htmlFor="notify-parents">All Parents</Label>
                    </div>
                </div>
            </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button disabled>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add to Calendar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
