
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

// Using a fixed reference date to ensure consistency across server and client renders
const referenceDate = new Date('2024-07-20T00:00:00');

export const MOCK_EVENTS: CalendarEvent[] = [
  { 
    id: '1', 
    date: referenceDate, 
    title: "Form 4 Exams Begin", 
    type: 'exam',
    description: "The Form 4 final examinations for Term 2 will commence. Please ensure students are well-prepared.",
    location: "Examination Hall A & B",
    startTime: "08:00",
    endTime: "16:00"
  },
  { 
    id: '2', 
    date: add(referenceDate, { days: 1 }), 
    title: "PTA Meeting", 
    type: 'meeting',
    description: "Quarterly Parent-Teacher Association meeting to discuss student progress and school development.",
    location: "Main School Hall",
    startTime: "10:00",
    endTime: "12:00",
    attachments: [
        { name: "PTA_Meeting_Agenda.pdf", size: "128 KB" }
    ]
  },
  { 
    id: '3', 
    date: sub(referenceDate, { days: 5 }), 
    title: "Staff Briefing", 
    type: 'meeting',
    description: "Mandatory weekly staff briefing.",
    location: "Staff Room"
  },
  { 
    id: '4', 
    date: add(referenceDate, { days: 12 }), 
    title: "Annual Sports Day", 
    type: 'sports',
    description: "The annual school-wide sports competition. All parents are invited to attend and support the students.",
    location: "School Sports Field"
  },
  { 
    id: '5', 
    date: add(referenceDate, { days: 20 }), 
    title: "Moi Day", 
    type: 'holiday',
    description: "The school will be closed in observance of the public holiday."
  },
  {
    id: '6',
    date: add(referenceDate, { days: 7 }),
    title: 'Geography Trip to Rift Valley',
    type: 'trip',
    description: 'An educational trip for Form 3 Geography students to study the Rift Valley features.',
    location: 'Great Rift Valley Viewpoint'
  }
];
