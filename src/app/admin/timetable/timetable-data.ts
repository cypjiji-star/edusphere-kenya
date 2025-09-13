

export const classes = ['Form 4', 'Form 3', 'Form 2', 'Form 1'];
export const teachers = ['Ms. Wanjiku', 'Mr. Otieno', 'Ms. Njeri', 'Mr. Kamau'];
export const rooms = ['Science Lab', 'Room 12A', 'Room 10B', 'Staff Room'];
export const views = ['Class View', 'Teacher View', 'Room View'];

export const periods = [
    { id: 1, time: '08:00 - 09:00' },
    { id: 2, time: '09:00 - 10:00' },
    { id: 3, time: '10:00 - 11:00' },
    { id: 4, time: '11:00 - 11:30', isBreak: true, title: 'Short Break' },
    { id: 5, time: '11:30 - 12:30' },
    { id: 6, time: '12:30 - 13:30' },
    { id: 7, time: '13:30 - 14:30', isBreak: true, title: 'Lunch Break' },
    { id: 8, time: '14:30 - 15:30' },
    { id: 9, time: '15:30 - 16:30' },
];

export const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

export const subjects = [
    { name: 'Mathematics', teacher: 'Mr. Otieno', color: 'bg-blue-500' },
    { name: 'English', teacher: 'Ms. Njeri', color: 'bg-green-500' },
    { name: 'Chemistry', teacher: 'Ms. Wanjiku', color: 'bg-purple-500' },
    { name: 'Physics', teacher: 'Mr. Kamau', color: 'bg-orange-500' },
    { name: 'Biology', teacher: 'Ms. Wanjiku', color: 'bg-pink-500' },
    { name: 'History', teacher: 'Mr. Kamau', color: 'bg-yellow-500' },
    { name: 'Geography', teacher: 'Mr. Otieno', color: 'bg-teal-500' },
];

export type Subject = typeof subjects[number];

export const mockTimetableData: Record<string, Record<number, { subject: Subject, room: string, clash?: { type: 'teacher' | 'room', message: string } }>> = {
    Monday: {
        1: { subject: subjects[0], room: 'Room 12A' }, // Math - Mr. Otieno
        2: { subject: subjects[2], room: 'Science Lab' }, // Chemistry - Ms. Wanjiku
    },
    Tuesday: {
        3: { subject: subjects[1], room: 'Room 10B' }, // English - Ms. Njeri
    },
    Wednesday: {
        5: { subject: subjects[3], room: 'Room 12A' }, // Physics - Mr. Kamau
        6: { subject: subjects[4], room: 'Science Lab' }, // Biology - Ms. Wanjiku
    },
    Thursday: {
        2: { subject: subjects[2], room: 'Room 10B', clash: { type: 'teacher', message: 'Clash: Ms. Wanjiku is double-booked.' } }, // Chemistry - Ms. Wanjiku (TEACHER CLASH)
        3: { subject: subjects[4], room: 'Science Lab' },
    },
    Friday: {
        8: { subject: subjects[0], room: 'Room 12A' }, // Math - Mr. Otieno
        9: { subject: subjects[6], room: 'Room 12A', clash: { type: 'room', message: 'Clash: Room 12A is double-booked.' } },
    }
}
