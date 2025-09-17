
'use client';

import * as React from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { DateRange } from 'react-day-picker';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface DatePickerProps {
  mode: 'single' | 'range';
  selected: Date | DateRange | undefined;
  onSelect: (date: Date | DateRange | undefined) => void;
  className?: string;
  disabled?: (date: Date) => boolean;
}

export function DatePicker({
  mode,
  selected,
  onSelect,
  className,
  disabled,
}: DatePickerProps) {
  const displayValue = () => {
    if (mode === 'range' && selected && 'from' in selected) {
      if (selected.from) {
        return selected.to
          ? `${format(selected.from, 'LLL dd, y')} - ${format(
              selected.to,
              'LLL dd, y'
            )}`
          : format(selected.from, 'LLL dd, y');
      }
    } else if (mode === 'single' && selected) {
      return format(selected as Date, 'PPP');
    }
    return <span>Pick a date</span>;
  };

  return (
    <div className={cn('grid gap-2', className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={'outline'}
            className={cn(
              'w-full justify-start text-left font-normal',
              !selected && 'text-muted-foreground'
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {displayValue()}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode={mode}
            defaultMonth={
              mode === 'range'
                ? (selected as DateRange | undefined)?.from
                : (selected as Date | undefined)
            }
            selected={selected}
            onSelect={onSelect}
            numberOfMonths={mode === 'range' ? 2 : 1}
            disabled={disabled}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
