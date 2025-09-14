
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
import { PlusCircle, Users, ArrowRight, Trophy, Loader2 } from 'lucide-react';
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
import { firestore } from '@/lib/firebase';
import { collection, addDoc, onSnapshot, query, where, getDocs } from 'firebase/firestore';
import { useSearchParams } from 'next/navigation';


type SportsTeam = {
    id: string;
    name: string;
    coach: string;
    members: number;
    icon: string;
};

const mockCoaches = ['Mr. David Otieno', 'Ms. Grace Njeri', 'Mr. Paul Kimani', 'Mr. Ben Carter', 'Ms. Fatuma Ali'];

export default function SportsPage() {
  const [sportsTeams, setSportsTeams] = React.useState<SportsTeam[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [newTeamName, setNewTeamName] = React.useState('');
  const [newTeamCoach, setNewTeamCoach] = React.useState('');
  const [newTeamIcon, setNewTeamIcon] = React.useState('');
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const schoolId = searchParams.get('schoolId');

   React.useEffect(() => {
    if (!schoolId) return;
    setIsLoading(true);
    const teamsQuery = query(collection(firestore, 'schools', schoolId, 'teams'), where('coach', '==', 'Ms. Wanjiku'));
    const unsubscribe = onSnapshot(teamsQuery, (snapshot) => {
        const teamsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SportsTeam));
        setSportsTeams(teamsData);
        setIsLoading(false);
    });
    return () => unsubscribe();
  }, [schoolId]);

  const handleCreateTeam = async () => {
    if (!newTeamName || !newTeamCoach || !newTeamIcon || !schoolId) {
        toast({
            title: 'Missing Information',
            description: 'Please fill out all fields to create a team.',
            variant: 'destructive',
        });
        return;
    }

    try {
        const newTeamData = {
            name: newTeamName,
            coach: newTeamCoach,
            members: 0,
            icon: newTeamIcon,
        };
        await addDoc(collection(firestore, 'schools', schoolId, 'teams'), newTeamData);

        toast({
            title: 'Team Created!',
            description: `${newTeamName} has been successfully created.`,
        });

        setNewTeamName('');
        setNewTeamCoach('');
        setNewTeamIcon('');
    } catch (error) {
        console.error("Error creating team:", error);
        toast({
            title: 'Error',
            description: 'Failed to create the new team. Please try again.',
            variant: 'destructive',
        });
    }
  };

  if (!schoolId) {
    return <div className="p-8">Error: School ID is missing. Please access this page through the developer dashboard.</div>
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between mb-6">
          <div className="text-left">
            <h1 className="font-headline text-3xl font-bold flex items-center gap-2">
              <Trophy className="h-8 w-8 text-primary" />
              My Teams &amp; Clubs
            </h1>
            <p className="text-muted-foreground">Manage the teams and clubs you are responsible for.</p>
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

       {isLoading ? (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
      ) : (
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
                    <Link href={`/teacher/sports/${team.id}?schoolId=${schoolId}`}>
                        Manage Team
                        <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                </Button>
                </CardFooter>
            </Card>
            ))}
        </div>
      )}
    </div>
  );
}
