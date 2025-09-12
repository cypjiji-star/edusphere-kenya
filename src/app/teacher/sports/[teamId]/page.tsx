
'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
  } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, UserPlus, Shield, Star, Trash2, Search, CalendarPlus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';


// Mock Data
const teams: Record<string, { name: string; coach: string }> = {
    'boys-football': { name: 'Football (Boys)', coach: 'Mr. David Otieno' },
    'girls-volleyball': { name: 'Volleyball (Girls)', coach: 'Ms. Grace Njeri' },
    'athletics-club': { name: 'Athletics Club (Mixed)', coach: 'Mr. Paul Kimani' },
    'basketball-team': { name: 'Basketball Team', coach: 'Mr. Ben Carter' },
    'chess-club': { name: 'Chess Club', coach: 'Ms. Fatuma Ali' },
};

type StudentMember = {
    id: string;
    name: string;
    class: string;
    avatarUrl: string;
    role: 'Member' | 'Captain' | 'Vice-Captain' | 'Treasurer';
};

const studentMembers: Record<string, StudentMember[]> = {
    'boys-football': Array.from({ length: 22 }, (_, i) => ({
        id: `student-${i + 1}`,
        name: `Player ${i + 1}`,
        class: `Form ${2 + (i % 3)}`,
        avatarUrl: `https://picsum.photos/seed/bf-player${i + 1}/100`,
        role: i === 0 ? 'Captain' : i === 1 ? 'Vice-Captain' : 'Member',
    })),
    'girls-volleyball': Array.from({ length: 16 }, (_, i) => ({
        id: `student-v-${i + 1}`,
        name: `Player ${i + 1}`,
        class: `Form ${1 + (i % 4)}`,
        avatarUrl: `https://picsum.photos/seed/gv-player${i + 1}/100`,
        role: i === 0 ? 'Captain' : 'Member',
    })),
};

const ROLES: StudentMember['role'][] = ['Member', 'Captain', 'Vice-Captain', 'Treasurer'];

const upcomingEvents = [
    {
        id: 'evt-1',
        type: 'Match',
        title: 'Friendly vs. Highway Secondary',
        date: '2024-07-25',
        time: '15:00',
    },
    {
        id: 'evt-2',
        type: 'Practice',
        title: 'Team Practice',
        date: '2024-07-27',
        time: '16:00',
    },
    {
        id: 'evt-3',
        type: 'Tournament',
        title: 'County Level Tournament - Day 1',
        date: '2024-08-02',
        time: '09:00',
    }
]

export default function TeamDetailsPage({ params }: { params: { teamId: string } }) {
  const teamDetails = teams[params.teamId] || { name: 'Unknown Team', coach: 'N/A' };
  const initialMembers = studentMembers[params.teamId] || [];
  
  const [members, setMembers] = React.useState(initialMembers);
  const [searchTerm, setSearchTerm] = React.useState('');

  const handleRoleChange = (studentId: string, newRole: StudentMember['role']) => {
    setMembers(currentMembers =>
        currentMembers.map(member =>
            member.id === studentId ? { ...member, role: newRole } : member
        )
    );
    // In a real app, you'd save this change via a server action.
  };

  const filteredMembers = members.filter(m => 
    m.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRoleIcon = (role: StudentMember['role']) => {
    switch(role) {
        case 'Captain': return <Star className="h-4 w-4 text-yellow-500" />;
        case 'Vice-Captain': return <Star className="h-4 w-4 text-gray-400" />;
        case 'Treasurer': return <Shield className="h-4 w-4 text-green-600" />;
        default: return null;
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
          <div className="flex justify-between items-center">
            <Button asChild variant="outline" size="sm">
                <Link href="/teacher/sports">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to All Teams
                </Link>
            </Button>
            <div>
              <h1 className="font-headline text-2xl font-bold">{teamDetails.name}</h1>
              <p className="text-muted-foreground">Managed by {teamDetails.coach}</p>
            </div>
          </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
            <Card>
                <CardHeader>
                <CardTitle>Team Members ({members.length})</CardTitle>
                <CardDescription>Manage student roles and participation.</CardDescription>
                 <div className="mt-4 flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="relative w-full md:max-w-sm">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                        type="search"
                        placeholder="Search members..."
                        className="w-full bg-background pl-8"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex w-full flex-col gap-2 md:w-auto md:flex-row md:items-center">
                        <Button disabled>
                            <UserPlus className="mr-2" />
                            Add Student
                        </Button>
                    </div>
                    </div>
                </CardHeader>
                <CardContent>
                <div className="w-full overflow-auto rounded-lg border">
                    <Table>
                        <TableHeader>
                        <TableRow>
                            <TableHead>Student</TableHead>
                            <TableHead>Class</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                        </TableHeader>
                        <TableBody>
                        {filteredMembers.length > 0 ? (
                            filteredMembers.map(member => (
                            <TableRow key={member.id}>
                                <TableCell>
                                <div className="flex items-center gap-3">
                                    <Avatar>
                                    <AvatarImage src={member.avatarUrl} alt={member.name} />
                                    <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <span className="font-medium">{member.name}</span>
                                </div>
                                </TableCell>
                                <TableCell className="text-muted-foreground">{member.class}</TableCell>
                                <TableCell>
                                <Select value={member.role} onValueChange={(value: StudentMember['role']) => handleRoleChange(member.id, value)}>
                                        <SelectTrigger className="w-40">
                                            <div className="flex items-center gap-2">
                                                {getRoleIcon(member.role)}
                                                <SelectValue placeholder="Assign role" />
                                            </div>
                                        </SelectTrigger>
                                        <SelectContent>
                                            {ROLES.map(role => (
                                                <SelectItem key={role} value={role}>
                                                    <div className="flex items-center gap-2">
                                                        {getRoleIcon(role)}
                                                        <span>{role}</span>
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                </Select>
                                </TableCell>
                                <TableCell className="text-right">
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    disabled
                                >
                                    <Trash2 className="h-4 w-4" />
                                    <span className="sr-only">Remove</span>
                                </Button>
                                </TableCell>
                            </TableRow>
                            ))
                        ) : (
                            <TableRow>
                            <TableCell colSpan={4} className="h-24 text-center">
                                No members found.
                            </TableCell>
                            </TableRow>
                        )}
                        </TableBody>
                    </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
        <div className="lg:col-span-1">
             <Card>
                <CardHeader>
                    <CardTitle>Schedule & Events</CardTitle>
                    <CardDescription>View and manage upcoming team events.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {upcomingEvents.map((event, index) => (
                        <div key={event.id}>
                            <div className="flex items-center gap-4">
                                <div className="flex flex-col items-center justify-center w-16 text-center bg-muted/50 rounded-md p-2">
                                    <span className="text-sm font-bold uppercase text-primary">{new Date(event.date).toLocaleDateString('en-US', { month: 'short' })}</span>
                                    <span className="text-xl font-bold">{new Date(event.date).getDate()}</span>
                                </div>
                                <div className="flex-1">
                                    <p className="font-semibold">{event.title}</p>
                                    <p className="text-sm text-muted-foreground">{event.type} @ {event.time}</p>
                                </div>
                            </div>
                            {index < upcomingEvents.length - 1 && <Separator className="my-4"/>}
                        </div>
                    ))}
                     {upcomingEvents.length === 0 && (
                        <div className="text-center text-muted-foreground py-8">
                            <p>No upcoming events.</p>
                        </div>
                     )}
                </CardContent>
                <CardFooter>
                     <Button className="w-full" disabled>
                        <CalendarPlus className="mr-2 h-4 w-4" />
                        Schedule New Event
                    </Button>
                </CardFooter>
             </Card>
        </div>
      </div>
    </div>
  );
}
