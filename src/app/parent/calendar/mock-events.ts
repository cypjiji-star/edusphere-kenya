
import { add, sub } from 'date-fns';

export type CalendarEvent = {
  id: string;
  date: Date;
  title: string;
  type: 'event' | 'holiday' | 'exam' | 'meeting' | 'sports' | 'trip';
  startTime?: string;
  endTime?: string;
};

// Using a fixed reference date to ensure consistency across server and client renders
const referenceDate = new Date('2024-07-20T00:00:00');

export const MOCK_EVENTS: CalendarEvent[] = [
  { id: '1', date: referenceDate, title: "Form 4 Exams Begin", type: 'exam' },
  { id: '2', date: add(referenceDate, { days: 1 }), title: "PTA Meeting", type: 'meeting' },
  { id: '3', date: sub(referenceDate, { days: 5 }), title: "Staff Briefing", type: 'meeting' },
  { id: '4', date: add(referenceDate, { days: 12 }), title: "Annual Sports Day", type: 'sports' },
  { id: '5', date: add(referenceDate, { days: 20 }), title: "Moi Day", type: 'holiday' },
];
