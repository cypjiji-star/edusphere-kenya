
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
    userCount: number;
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

export const initialRolePermissions: Record<string, Role> = {
  Admin: {
    permissions: initialPermissionStructure.flatMap(cat => cat.permissions.map(p => p.id)),
    userCount: 2,
    isCore: true,
  },
  Principal: {
    permissions: initialPermissionStructure.flatMap(cat => cat.permissions.map(p => p.id)).filter(p => !p.startsWith('users.')),
    userCount: 1,
    isCore: true,
  },
  Teacher: {
    permissions: ['academics.grades.view'],
    userCount: 45,
    isCore: true,
  },
  Student: {
    permissions: [],
    userCount: 852,
    isCore: true,
  },
  Parent: {
    permissions: [],
    userCount: 780,
    isCore: true,
  },
  Security: {
      permissions: [],
      userCount: 4,
      isCore: true,
  }
};
