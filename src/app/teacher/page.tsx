import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, BookMarked, Sparkles, ArrowRight } from 'lucide-react';

const dashboardCards = [
  {
    title: 'Manage Students',
    description: 'View student profiles, track progress, and manage information.',
    icon: <Users className="h-8 w-8 text-primary" />,
    href: '/teacher/students',
    cta: 'View Students',
  },
  {
    title: 'Create & Grade Assignments',
    description: 'Design, distribute, and grade assignments for your classes.',
    icon: <BookMarked className="h-8 w-8 text-primary" />,
    href: '/teacher/assignments',
    cta: 'Manage Assignments',
  },
  {
    title: 'AI Learning Tools',
    description: 'Generate personalized learning paths to help students excel.',
    icon: <Sparkles className="h-8 w-8 text-primary" />,
    href: '/learning-path',
    cta: 'Generate Path',
  },
];

export default function TeacherDashboard() {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="font-headline text-3xl font-bold">Welcome, Ms. Wanjiku!</h1>
        <p className="text-muted-foreground">Here's a quick overview of your classroom.</p>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {dashboardCards.map((card) => (
          <Card key={card.title} className="flex flex-col">
            <CardHeader className="flex flex-row items-start gap-4 space-y-0 pb-4">
              <div className="flex-shrink-0">{card.icon}</div>
              <div className="flex-1">
                <CardTitle className="font-headline text-xl">{card.title}</CardTitle>
                <CardDescription>{card.description}</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="flex-grow flex items-end">
              <Button asChild className="w-full">
                <Link href={card.href}>
                  {card.cta}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
