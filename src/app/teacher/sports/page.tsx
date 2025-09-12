
'use client';

import * as React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, Users, ArrowRight, Trophy } from 'lucide-react';
import Link from 'next/link';

// Mock data for sports teams
const sportsTeams = [
  {
    id: 'boys-football',
    name: 'Football (Boys)',
    coach: 'Mr. David Otieno',
    members: 22,
    icon: '⚽',
  },
  {
    id: 'girls-volleyball',
    name: 'Volleyball (Girls)',
    coach: 'Ms. Grace Njeri',
    members: 16,
    icon: '🏐',
  },
  {
    id: 'athletics-club',
    name: 'Athletics Club (Mixed)',
    coach: 'Mr. Paul Kimani',
    members: 35,
    icon: '🏃',
  },
  {
    id: 'basketball-team',
    name: 'Basketball Team',
    coach: 'Mr. Ben Carter',
    members: 18,
    icon: '🏀',
  },
  {
    id: 'chess-club',
    name: 'Chess Club',
    coach: 'Ms. Fatuma Ali',
    members: 25,
    icon: '♟️',
  },
];

export default function SportsPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between mb-6">
          <div className="text-left">
            <h1 className="font-headline text-3xl font-bold flex items-center gap-2">
              <Trophy className="h-8 w-8 text-primary" />
              Sports &amp; Clubs
            </h1>
            <p className="text-muted-foreground">Manage school teams, clubs, and student participation.</p>
          </div>
          <Button disabled className="w-full md:w-auto">
            <PlusCircle className="mr-2" />
            Create New Team
          </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {sportsTeams.map((team) => (
          <Card key={team.id} className="flex flex-col">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="text-5xl">{team.icon}</div>
              </div>
              <CardTitle className="font-headline text-xl pt-2">{team.name}</CardTitle>
              <CardDescription>Coached by {team.coach}</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
              <div className="flex items-center text-sm text-muted-foreground">
                <Users className="mr-2 h-4 w-4" />
                <span>{team.members} members</span>
              </div>
            </CardContent>
            <CardFooter>
               <Button asChild variant="default" className="w-full">
                  <Link href={`/teacher/sports/${team.id}`}>
                      Manage Team
                      <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
