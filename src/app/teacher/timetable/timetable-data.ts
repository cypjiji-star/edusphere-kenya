export type Period = {
  id: number;
  time: string;
  isBreak?: boolean;
  title?: string;
};

export const defaultPeriods: Period[] = [
  { id: 1, time: "08:00 - 08:40" },
  { id: 2, time: "08:40 - 09:20" },
  { id: 3, time: "09:20 - 10:00" },
  { id: 4, time: "10:00 - 10:40" },
  { id: 5, time: "10:40 - 11:10", isBreak: true, title: "Short Break" },
  { id: 6, time: "11:10 - 11:50" },
  { id: 7, time: "11:50 - 12:30" },
  { id: 8, time: "12:30 - 13:10" },
  { id: 9, time: "13:10 - 14:00", isBreak: true, title: "Lunch Break" },
  { id: 10, time: "14:00 - 14:40" },
  { id: 11, time: "14:40 - 15:20" },
  { id: 12, time: "15:20 - 16:00" },
];
