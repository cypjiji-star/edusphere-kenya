
'use server';

import { firestore } from '@/lib/firebase';
import { collection, writeBatch, doc, Timestamp, getDocs, query, where, deleteDoc } from 'firebase/firestore';
import { format } from 'date-fns';

const subjects = [
    { name: 'Mathematics', code: '121', department: 'Mathematics', teachers: [] },
    { name: 'English', code: '101', department: 'Languages', teachers: [] },
    { name: 'Kiswahili', code: '102', department: 'Languages', teachers: [] },
    { name: 'Chemistry', code: '233', department: 'Sciences', teachers: [] },
    { name: 'Biology', code: '231', department: 'Sciences', teachers: [] },
    { name: 'Physics', code: '232', department: 'Sciences', teachers: [] },
    { name: 'History & Government', code: '311', department: 'Humanities', teachers: [] },
    { name: 'Geography', code: '312', department: 'Humanities', teachers: [] },
    { name: 'CRE', code: '313', department: 'Humanities', teachers: [] },
    { name: 'Business Studies', code: '565', department: 'Technical Subjects', teachers: [] },
    { name: 'Computer Science', code: '451', department: 'Technical Subjects', teachers: [] },
    { name: 'Art & Design', code: '442', department: 'Creative Arts', teachers: [] },
];

const classes = [
    { name: 'Form 1', stream: 'North', capacity: 45 },
    { name: 'Form 2', stream: 'South', capacity: 40 },
    { name: 'Form 3', stream: 'East', capacity: 42 },
    { name: 'Form 4', stream: 'West', capacity: 38 },
];

const teachers = [
    { name: 'Mr. Otieno', email: 'otieno@example.com', subjects: ['Mathematics', 'Physics'] },
    { name: 'Ms. Wanjiku', email: 'wanjiku@example.com', subjects: ['Chemistry', 'Biology'] },
    { name: 'Ms. Njeri', email: 'njeri@example.com', subjects: ['English', 'History & Government'] },
    { name: 'Mr. Kamau', email: 'kamau@example.com', subjects: ['Kiswahili', 'Geography'] },
    { name: 'Mrs. Nafula', email: 'nafula@example.com', subjects: ['Business Studies', 'Computer Science'] },
];

const students = [
    { firstName: 'Asha', lastName: 'Mwangi', gender: 'Female' },
    { firstName: 'Brian', lastName: 'Kiprotich', gender: 'Male' },
    { firstName: 'Christine', lastName: 'Achieng', gender: 'Female' },
    { firstName: 'David', lastName: 'Kimani', gender: 'Male' },
    { firstName: 'Esther', lastName: 'Wairimu', gender: 'Female' },
    { firstName: 'Felix', lastName: 'Omondi', gender: 'Male' },
    { firstName: 'Grace', lastName: 'Nanjala', gender: 'Female' },
    { firstName: 'Henry', lastName: 'Mutua', gender: 'Male' },
];

async function clearCollection(collectionPath: string) {
    const q = query(collection(firestore, collectionPath));
    const snapshot = await getDocs(q);
    const batch = writeBatch(firestore);
    snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
    });
    await batch.commit();
}


export async function clearSchoolData(schoolId: string) {
    if (!schoolId) {
        return { success: false, message: 'School ID is required.' };
    }

    try {
        const collectionsToClear = [
            'classes', 'subjects', 'users', 'students', 'parents', 'attendance', 
            'grades', 'assignments', 'incidents', 'lesson-plans', 'teams', 
            'teacher_attendance', 'support-tickets', 'mini_payments', 'leave-applications',
            'library-requests', 'library-resources', 'audit_logs', 'notifications',
            'conversations', 'calendar-events', 'class-assignments', 'expenses'
        ];

        for (const coll of collectionsToClear) {
            await clearCollection(`schools/${schoolId}/${coll}`);
        }

        return { success: true, message: `Successfully cleared data for school ${schoolId}.` };
    } catch (error: any) {
        console.error('Error clearing database:', error);
        return { success: false, message: `An error occurred while clearing data: ${error.message}` };
    }
}


export async function seedSchoolData(schoolId: string) {
    if (!schoolId) {
        return { success: false, message: 'School ID is required.' };
    }

    const batch = writeBatch(firestore);

    try {
        // Clear existing data (optional, but recommended for a clean seed)
        const collectionsToClear = ['classes', 'subjects', 'users', 'students', 'parents', 'attendance', 'grades'];
        for (const coll of collectionsToClear) {
            const snapshot = await getDocs(collection(firestore, 'schools', schoolId, coll));
            snapshot.docs.forEach(doc => batch.delete(doc.ref));
        }
        await batch.commit(); // Commit deletions first
        
        const newBatch = writeBatch(firestore);
        
        // 1. Seed Teachers
        const teacherIds: { [key: string]: string } = {};
        for (const teacher of teachers) {
            const teacherRef = doc(collection(firestore, 'schools', schoolId, 'users'));
            teacherIds[teacher.name] = teacherRef.id;
            newBatch.set(teacherRef, {
                id: teacherRef.id,
                name: teacher.name,
                email: teacher.email,
                role: 'Teacher',
                status: 'Active',
                createdAt: Timestamp.now(),
                avatarUrl: `https://picsum.photos/seed/${teacher.name}/100`,
            });
        }

        // 2. Seed Subjects and assign teachers
        for (const subject of subjects) {
            const assignedTeachers = teachers
                .filter(t => t.subjects.includes(subject.name))
                .map(t => t.name);
            const subjectRef = doc(collection(firestore, 'schools', schoolId, 'subjects'));
            newBatch.set(subjectRef, { ...subject, teachers: assignedTeachers });
        }

        // 3. Seed Classes
        const classIds: { [key: string]: string } = {};
        for (let i = 0; i < classes.length; i++) {
            const classData = classes[i];
            const teacherName = teachers[i % teachers.length].name;
            const teacherId = teacherIds[teacherName];
            const classRef = doc(collection(firestore, 'schools', schoolId, 'classes'));
            classIds[classData.name] = classRef.id;
            newBatch.set(classRef, {
                ...classData,
                teacherId: teacherId,
                classTeacher: { name: teacherName, avatarUrl: `https://picsum.photos/seed/${teacherName}/100` },
                studentCount: students.length, // Assign all students to each class for simplicity
            });
        }

        // 4. Seed Students and Parents
        for (let i = 0; i < students.length; i++) {
            const studentData = students[i];
            const className = classes[i % classes.length].name;
            const classId = classIds[className];

            // Create Parent
            const parentRef = doc(collection(firestore, 'schools', schoolId, 'parents'));
            const parentName = `Mr. & Mrs. ${studentData.lastName}`;
            newBatch.set(parentRef, {
                id: parentRef.id,
                name: parentName,
                email: `${studentData.lastName.toLowerCase()}.parent@example.com`,
                role: 'Parent',
                status: 'Active',
            });

            // Create Student
            const studentRef = doc(collection(firestore, 'schools', schoolId, 'students'));
            const studentFullName = `${studentData.firstName} ${studentData.lastName}`;
            newBatch.set(studentRef, {
                id: studentRef.id,
                name: studentFullName,
                firstName: studentData.firstName,
                lastName: studentData.lastName,
                gender: studentData.gender,
                class: className,
                classId: classId,
                admissionNumber: `ADM-${schoolId.substring(0,2)}${1000 + i}`,
                parentId: parentRef.id,
                parentName,
                avatarUrl: `https://picsum.photos/seed/${studentFullName}/100`,
                status: 'Active',
                totalFee: 50000,
                amountPaid: Math.floor(Math.random() * 50000),
                createdAt: Timestamp.now(),
            });

            // Seed Attendance and Grades
            const attendanceDate = new Date();
            attendanceDate.setHours(0,0,0,0);
            const attendanceRef = doc(firestore, `schools/${schoolId}/attendance`, `${studentRef.id}_${format(attendanceDate, 'yyyy-MM-dd')}`);
            newBatch.set(attendanceRef, {
                studentId: studentRef.id,
                studentName: studentFullName,
                classId: classId,
                className: className,
                date: Timestamp.fromDate(attendanceDate),
                status: Math.random() > 0.1 ? 'present' : 'absent',
                teacherId: teacherIds[teachers[i % teachers.length].name],
                teacher: teachers[i % teachers.length].name,
            });
            
            const gradeRef = doc(collection(firestore, `schools/${schoolId}/grades`));
            newBatch.set(gradeRef, {
                 studentId: studentRef.id,
                 assessmentId: 'mid-term-1',
                 classId: classId,
                 subject: 'Mathematics',
                 grade: Math.floor(40 + Math.random() * 60).toString(),
                 teacherName: 'Mr. Otieno',
                 date: Timestamp.now(),
            });
        }

        await newBatch.commit();
        return { success: true, message: `Successfully seeded school ${schoolId} with sample data.` };

    } catch (error: any) {
        console.error('Error seeding database:', error);
        return { success: false, message: `An error occurred: ${error.message}` };
    }
}
