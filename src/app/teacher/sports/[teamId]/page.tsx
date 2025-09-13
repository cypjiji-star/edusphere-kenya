
'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
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
import { ArrowLeft, UserPlus, Shield, Star, Trash2, Search, CalendarPlus, Upload, Save, Trophy, Edit as EditIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { ClassAnalytics } from '../../students/class-analytics';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';


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
    'athletics-club': [],
    'basketball-team': [],
    'chess-club': [],
};

const allStudents = [
    { id: 'f4-s1', name: 'New Student A', class: 'Form 4' },
    { id: 'f3-s2', name: 'New Student B', class: 'Form 3' },
]

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

const mediaHighlights = [
    { id: 'media-1', type: 'photo', url: 'https://picsum.photos/seed/match-highlight-1/800/600', caption: 'Goal against Nairobi School!', date: '2024-07-18' },
    { id: 'media-2', type: 'photo', url: 'https://picsum.photos/seed/match-highlight-2/800/600', caption: 'Team celebration after winning the derby.', date: '2024-07-18' },
    { id: 'media-3', type: 'video', url: 'https://picsum.photos/seed/match-highlight-3/800/600', caption: 'Match highlights video vs. Starehe.', date: '2024-07-12' },
]

export default function TeamDetailsPage({ params }: { params: { teamId: string } }) {
  const { teamId } = React.use(params);
  const { toast } = useToast();
  const [teamDetails, setTeamDetails] = React.useState(teams[teamId] || { name: 'Unknown Team', coach: 'N/A' });
  const initialMembers = studentMembers[teamId] || [];
  
  const [members, setMembers] = React.useState(initialMembers);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [clientReady, setClientReady] = React.useState(false);
  const [newStudentId, setNewStudentId] = React.useState<string | undefined>();


  React.useEffect(() => {
    setClientReady(true);
  }, []);

  const handleRoleChange = (studentId: string, newRole: StudentMember['role']) => {
    setMembers(currentMembers =>
        currentMembers.map(member =>
            member.id === studentId ? { ...member, role: newRole } : member
        )
    );
    toast({
        title: 'Role Updated',
        description: 'The member\'s role has been changed.',
    })
  };
  
  const handleRemoveMember = (studentId: string) => {
    setMembers(currentMembers => currentMembers.filter(member => member.id !== studentId));
    toast({
        title: 'Member Removed',
        description: 'The student has been removed from the team roster.',
        variant: 'destructive',
    })
  }

  const handleAddStudent = () => {
    if (!newStudentId) return;
    const student = allStudents.find(s => s.id === newStudentId);
    if (!student) return;

    if (members.some(m => m.id === student.id)) {
        toast({
            title: 'Student Already in Team',
            variant: 'destructive',
        });
        return;
    }

    const newMember: StudentMember = {
        ...student,
        avatarUrl: `https://picsum.photos/seed/${student.id}/100`,
        role: 'Member',
    };

    setMembers(prev => [...prev, newMember]);
    setNewStudentId(undefined);
    toast({
        title: 'Student Added',
        description: `${student.name} has been added to the roster.`,
    });
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
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex-1">
              <h1 className="font-headline text-2xl font-bold">{teamDetails.name}</h1>
              <p className="text-muted-foreground">Managed by {teamDetails.coach}</p>
            </div>
            <div className="flex w-full md:w-auto items-center gap-2">
                <Button asChild variant="outline" size="sm">
                    <Link href="/teacher/sports">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to All Teams
                    </Link>
                </Button>
                <Dialog>
                    <DialogTrigger asChild>
                        <Button><EditIcon className="mr-2"/>Edit Team</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Edit Team Details</DialogTitle>
                        </DialogHeader>
                        <div className="py-4 space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="team-name-edit">Team Name</Label>
                                <Input id="team-name-edit" value={teamDetails.name} onChange={(e) => setTeamDetails(prev => ({...prev, name: e.target.value}))}/>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="team-coach-edit">Coach/Patron</Label>
                                <Input id="team-coach-edit" value={teamDetails.coach} onChange={(e) => setTeamDetails(prev => ({...prev, coach: e.target.value}))}/>
                            </div>
                        </div>
                        <DialogFooter>
                            <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                            <DialogClose asChild><Button>Save Changes</Button></DialogClose>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
          </div>
      </div>
      
      <Tabs defaultValue="roster">
        <TabsList className="mb-4 grid w-full grid-cols-5 md:w-auto md:inline-flex">
            <TabsTrigger value="roster">Roster</TabsTrigger>
            <TabsTrigger value="schedule">Schedule</TabsTrigger>
            <TabsTrigger value="media">Media</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="awards">Awards</TabsTrigger>
        </TabsList>

        <TabsContent value="roster">
            <Card>
                <CardHeader>
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                            <CardTitle>Team Members ({members.length})</CardTitle>
                            <CardDescription>Manage student roles and participation.</CardDescription>
                        </div>
                         <Dialog>
                            <DialogTrigger asChild>
                                <Button>
                                    <UserPlus className="mr-2" />
                                    Add Student
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Add Student to Roster</DialogTitle>
                                    <DialogDescription>Select a student to add to the team.</DialogDescription>
                                </DialogHeader>
                                <div className="py-4">
                                     <Select value={newStudentId} onValueChange={setNewStudentId}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select a student..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {allStudents.map(student => (
                                                <SelectItem key={student.id} value={student.id}>{student.name} ({student.class})</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <DialogFooter>
                                    <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                                    <DialogClose asChild>
                                        <Button onClick={handleAddStudent} disabled={!newStudentId}>Add to Team</Button>
                                    </DialogClose>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
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
                                    onClick={() => handleRemoveMember(member.id)}
                                >
                                    <Trash2 className="h-4 w-4 text-destructive" />
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
        </TabsContent>

        <TabsContent value="schedule">
            <Card>
                <CardHeader>
                    <CardTitle>Schedule &amp; Events</CardTitle>
                    <CardDescription>View and manage upcoming team events.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {upcomingEvents.map((event, index) => (
                        <div key={event.id}>
                            <div className="flex items-center gap-4">
                                <div className="flex flex-col items-center justify-center w-16 text-center bg-muted/50 rounded-md p-2">
                                    {clientReady && <span className="text-sm font-bold uppercase text-primary">{new Date(event.date).toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' })}</span>}
                                    {clientReady && <span className="text-xl font-bold">{new Date(event.date).getUTCDate()}</span>}
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
                     <Button className="w-full">
                        <CalendarPlus className="mr-2 h-4 w-4" />
                        Schedule New Event
                    </Button>
                </CardFooter>
             </Card>
        </TabsContent>

        <TabsContent value="media">
             <Card>
                <CardHeader>
                    <CardTitle>Media &amp; Highlights</CardTitle>
                    <CardDescription>Celebrate wins and showcase student achievements.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {mediaHighlights.map(item => (
                            <Card key={item.id} className="overflow-hidden group">
                                <CardContent className="p-0">
                                    <div className="relative aspect-video">
                                        <Image src={item.url} alt={item.caption} fill className="object-cover transition-transform group-hover:scale-105"/>
                                        {item.type === 'video' && (
                                            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                                <CardFooter className="p-4 flex-col items-start">
                                    <p className="text-sm font-medium">{item.caption}</p>
                                    {clientReady && <p className="text-xs text-muted-foreground">{new Date(item.date).toLocaleDateString()}</p>}
                                </CardFooter>
                            </Card>
                        ))}
                         <div className="flex items-center justify-center w-full">
                            <Label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-full min-h-[200px] border-2 border-dashed rounded-lg cursor-pointer bg-muted/50 hover:bg-muted">
                                <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center">
                                    <Upload className="w-8 h-8 mb-2 text-muted-foreground" />
                                    <p className="mb-2 text-sm text-muted-foreground">Upload Media</p>
                                    <p className="text-xs text-muted-foreground">(Photos, Videos)</p>
                                </div>
                                <Input id="dropzone-file" type="file" className="hidden" />
                            </Label>
                        </div>
                    </div>
                </CardContent>
             </Card>
        </TabsContent>

        <TabsContent value="performance">
            <Card>
                <CardHeader>
                    <CardTitle>Attendance &amp; Performance</CardTitle>
                    <CardDescription>Record attendance and log stats for practices and matches.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col gap-4 mb-6 md:flex-row md:items-center">
                        <Label htmlFor="event-select" className="shrink-0">Select Event:</Label>
                        <Select defaultValue={upcomingEvents.length > 0 ? upcomingEvents[0].id : undefined}>
                            <SelectTrigger id="event-select" className="w-full md:w-auto md:min-w-[300px]">
                                <SelectValue placeholder="Select an event to record stats for" />
                            </SelectTrigger>
                            <SelectContent>
                                {upcomingEvents.map(event => (
                                    <SelectItem key={event.id} value={event.id}>
                                        {event.title} {clientReady && `(${new Date(event.date).toLocaleDateString('en-US', {month: 'short', day: 'numeric', timeZone: 'UTC'})})`}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                     <div className="w-full overflow-auto rounded-lg border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Student</TableHead>
                                    <TableHead>Attendance</TableHead>
                                    <TableHead className="text-center">Goals</TableHead>
                                    <TableHead className="text-center">Assists</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {members.map(member => (
                                    <TableRow key={member.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-8 w-8">
                                                    <AvatarImage src={member.avatarUrl} alt={member.name} />
                                                    <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                                                </Avatar>
                                                <span className="font-medium text-sm">{member.name}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Select defaultValue="present">
                                                <SelectTrigger className="w-32">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="present">Present</SelectItem>
                                                    <SelectItem value="absent">Absent</SelectItem>
                                                    <SelectItem value="excused">Excused</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </TableCell>
                                        <TableCell>
                                            <Input type="number" min="0" className="w-20 mx-auto text-center" placeholder="0" />
                                        </TableCell>
                                        <TableCell>
                                            <Input type="number" min="0" className="w-20 mx-auto text-center" placeholder="0" />
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
                <CardFooter>
                    <Button>
                        <Save className="mr-2 h-4 w-4" />
                        Save Records
                    </Button>
                </CardFooter>
            </Card>
        </TabsContent>

        <TabsContent value="awards">
            <Card>
                <CardHeader>
                    <CardTitle>Awards &amp; Recognition</CardTitle>
                    <CardDescription>Highlight top performers and sportsmanship awards for the season.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Most Valuable Player (MVP)</CardTitle>
                            <Trophy className="h-5 w-5 text-yellow-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-3">
                                <Avatar>
                                    <AvatarImage src="https://picsum.photos/seed/bf-player1/100" alt="MVP" />
                                    <AvatarFallback>P1</AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="font-bold">Player 1</p>
                                    <p className="text-xs text-muted-foreground">Season Top Performer</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Top Scorer</CardTitle>
                            <Trophy className="h-5 w-5 text-gray-400" />
                        </CardHeader>
                        <CardContent>
                             <div className="flex items-center gap-3">
                                <Avatar>
                                    <AvatarImage src="https://picsum.photos/seed/bf-player7/100" alt="Top Scorer" />
                                    <AvatarFallback>P7</AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="font-bold">Player 7</p>
                                    <p className="text-xs text-muted-foreground">12 Goals this Season</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Sportsmanship Award</CardTitle>
                            <Trophy className="h-5 w-5 text-green-600" />
                        </CardHeader>
                        <CardContent>
                             <div className="flex items-center gap-3">
                                <Avatar>
                                    <AvatarImage src="https://picsum.photos/seed/bf-player15/100" alt="Sportsmanship" />
                                    <AvatarFallback>P15</AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="font-bold">Player 15</p>
                                    <p className="text-xs text-muted-foreground">Exemplary Conduct</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </CardContent>
                <CardFooter>
                    <Button>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Add New Award
                    </Button>
                </CardFooter>
            </Card>
        </TabsContent>

      </Tabs>
    </div>
  );
}
