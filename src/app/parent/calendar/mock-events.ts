
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
const getReferenceDate = () => {
    // A function to prevent this from being evaluated at build time,
    // ensuring it's relative to the user's "now" but consistent.
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
};

const referenceDate = getReferenceDate();

export const MOCK_EVENTS: CalendarEvent[] = [
  { id: '1', date: referenceDate, title: "Form 4 Exams Begin", type: 'exam' },
  { id: '2', date: add(referenceDate, { days: 1 }), title: "PTA Meeting", type: 'meeting' },
  { id: '3', date: sub(referenceDate, { days: 5 }), title: "Staff Briefing", type: 'meeting' },
  { id: '4', date: add(referenceDate, { days: 12 }), title: "Annual Sports Day", type: 'sports' },
  { id: '5', date: add(referenceDate, { days: 20 }), title: "Moi Day", type: 'holiday' },
];
