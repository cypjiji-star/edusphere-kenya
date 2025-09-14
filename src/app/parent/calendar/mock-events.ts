
import { add, sub } from 'date-fns';

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
