
import { ArrowUp, BookOpen, Calendar, CircleDollarSign, ClipboardCheck, Megaphone, ShieldAlert, Shapes, UserPlus, Users, UserCheck, FileText, AlertTriangle } from 'lucide-react';
import * as React from 'react';

// From src/app/admin/admin-charts.tsx
export const feeData = [
    { status: 'Collected', value: 82, fill: 'hsl(142.1 76.2% 42.2%)' },
    { status: 'Outstanding', value: 18, fill: 'hsl(47.9 95.8% 53.1%)' },
];

export const feeChartConfig = {
    Collected: { label: 'Collected', color: 'hsl(142.1 76.2% 42.2%)' },
    Outstanding: { label: 'Outstanding', color: 'hsl(47.9 95.8% 53.1%)' },
};

export const performanceData = [
  { subject: 'Math', avgScore: 82 },
  { subject: 'Eng', avgScore: 78 },
  { subject: 'Sci', avgScore: 85 },
  { subject: 'Hist', avgScore: 75 },
  { subject: 'Geo', avgScore: 72 },
  { subject: 'Kisw', avgScore: 80 },
];

export const performanceChartConfig = {
  avgScore: {
    label: 'Avg. Score',
    color: 'hsl(var(--primary))',
  },
};
