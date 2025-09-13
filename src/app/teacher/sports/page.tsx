
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

// Mock data for sports teams
const initialSportsTeams = [
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

const mockCoaches = ['Mr. David Otieno', 'Ms. Grace Njeri', 'Mr. Paul Kimani', 'Mr. Ben Carter', 'Ms. Fatuma Ali'];

export default function SportsPage() {
  const [sportsTeams, setSportsTeams] = React.useState(initialSportsTeams);
  const [newTeamName, setNewTeamName] = React.useState('');
  const [newTeamCoach, setNewTeamCoach] = React.useState('');
  const [newTeamIcon, setNewTeamIcon] = React.useState('');
  const { toast } = useToast();

  const handleCreateTeam = () => {
    if (!newTeamName || !newTeamCoach || !newTeamIcon) {
        toast({
            title: 'Missing Information',
            description: 'Please fill out all fields to create a team.',
            variant: 'destructive',
        });
        return;
    }

    const newTeam = {
        id: newTeamName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        name: newTeamName,
        coach: newTeamCoach,
        members: 0,
        icon: newTeamIcon,
    };

    setSportsTeams(prev => [...prev, newTeam]);

    toast({
        title: 'Team Created!',
        description: `${newTeamName} has been successfully created.`,
    });

    // Reset form
    setNewTeamName('');
    setNewTeamCoach('');
    setNewTeamIcon('');
  };

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
          <Dialog>
              <DialogTrigger asChild>
                <Button>
                    <PlusCircle className="mr-2" />
                    Create New Team
                </Button>
              </DialogTrigger>
              <DialogContent>
                 <DialogHeader>
                    <DialogTitle>Create New Team/Club</DialogTitle>
                    <DialogDescription>
                        Set up a new sports team or extracurricular club.
                    </DialogDescription>
                </DialogHeader>
                 <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="team-name">Team/Club Name</Label>
                        <Input id="team-name" placeholder="e.g., Swimming Team" value={newTeamName} onChange={(e) => setNewTeamName(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="team-coach">Coach/Patron</Label>
                        <Select onValueChange={setNewTeamCoach}>
                            <SelectTrigger id="team-coach">
                                <SelectValue placeholder="Select a teacher" />
                            </SelectTrigger>
                            <SelectContent>
                                {mockCoaches.map(coach => (
                                    <SelectItem key={coach} value={coach}>{coach}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="team-icon">Icon (Emoji)</Label>
                        <Input id="team-icon" placeholder="e.g., 🏊" maxLength={2} value={newTeamIcon} onChange={(e) => setNewTeamIcon(e.target.value)}/>
                    </div>
                </div>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="outline">Cancel</Button>
                    </DialogClose>
                    <DialogClose asChild>
                        <Button onClick={handleCreateTeam}>Create Team</Button>
                    </DialogClose>
                </DialogFooter>
              </DialogContent>
          </Dialog>
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
