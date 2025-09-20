
export type Permission = {
  id: string;
  label: string;
};

export type PermissionCategory = {
  title: string;
  permissions: Permission[];
};

export type Role = {
    permissions: string[];
    isCore: boolean;
};

export const initialPermissionStructure: PermissionCategory[] = [
  {
    title: 'User Management',
    permissions: [
      { id: 'users.create', label: 'Create new users' },
      { id: 'users.edit', label: 'Edit user profiles' },
      { id: 'users.delete', label: 'Delete users' },
      { id: 'users.roles', label: 'Change user roles' },
    ],
  },
  {
    title: 'Academics',
    permissions: [
      { id: 'academics.grades.view', label: 'View school-wide grades' },
      { id: 'academics.grades.edit', label: 'Edit all student grades' },
      { id: 'academics.timetable.edit', label: 'Manage school timetable' },
      { id: 'academics.subjects.manage', label: 'Manage classes and subjects' },
    ],
  },
  {
    title: 'Communication',
    permissions: [
      { id: 'comms.announcements.school', label: 'Send school-wide announcements' },
      { id: 'comms.messaging.all', label: 'View all messages' },
    ],
  },
   {
    title: 'Finance',
    permissions: [
      { id: 'finance.fees.manage', label: 'Manage fee structures and payments' },
      { id: 'finance.expenses.manage', label: 'Manage school expenses' },
    ],
  },
   {
    title: 'System',
    permissions: [
      { id: 'admin.logs', label: 'View Audit Logs' },
    ],
  },
];

// This initial data is used to bootstrap roles for a new school.
// The actual role data will be read from Firestore.
export const initialRolePermissions: Record<string, Role> = {
  Admin: {
    permissions: initialPermissionStructure.flatMap(cat => cat.permissions.map(p => p.id)),
    isCore: true,
  },
  Teacher: {
    permissions: ['academics.grades.view'],
    isCore: true,
  },
  Student: {
    permissions: [],
    isCore: true,
  },
  Parent: {
    permissions: [],
    isCore: true,
  },
};
