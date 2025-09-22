

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
import { PlusCircle, Users, ArrowRight, Trophy, Loader2, Wand2 } from 'lucide-react';
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
import { collection, addDoc, onSnapshot, query, where, getDocs, serverTimestamp, doc } from 'firebase/firestore';
import { useSearchParams } from 'next/navigation';
import { generateTeamIcon } from '@/ai/flows/generate-team-icon-flow';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/context/auth-context';


type SportsTeam = {
    id: string;
    name: string;
    coach: string;
    members: number;
    icon: string;
};

type Teacher = {
    id: string;
    name: string;
    email: string;
};

export default function SportsPage() {
  const [allSportsTeams, setAllSportsTeams] = React.useState<SportsTeam[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isCreating, setIsCreating] = React.useState(false);
  const [isGeneratingIcon, setIsGeneratingIcon] = React.useState(false);

  const [newTeamName, setNewTeamName] = React.useState('');
  const [newTeamCoach, setNewTeamCoach] = React.useState('');
  const [newTeamDescription, setNewTeamDescription] = React.useState('');
  const [newTeamIcon, setNewTeamIcon] = React.useState('');
  const [allTeachers, setAllTeachers] = React.useState<Teacher[]>([]);
  
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const schoolId = searchParams.get('schoolId');
  const { user } = useAuth();

   React.useEffect(() => {
    if (!schoolId) {
        setIsLoading(false);
        return;
    };

    setIsLoading(true);

    const teamsQuery = query(collection(firestore, 'schools', schoolId, 'teams'));
    const unsubTeams = onSnapshot(teamsQuery, (snapshot) => {
        const teamsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SportsTeam));
        setAllSportsTeams(teamsData);
        setIsLoading(false);
    }, (error) => {
        console.error("Error fetching teams:", error);
        setIsLoading(false);
    });

    const teachersQuery = query(collection(firestore, `schools/${schoolId}/users`), where('role', '==', 'Teacher'));
    const unsubTeachers = onSnapshot(teachersQuery, (snapshot) => {
        const teachers = snapshot.docs.map(doc => ({ 
            id: doc.id, 
            name: doc.data().name,
            email: doc.data().email 
        } as Teacher));
        setAllTeachers(teachers);
    });

    return () => {
        unsubTeams();
        unsubTeachers();
    };
  }, [schoolId, user]);

  // Filter teams where the current user is the coach
  const sportsTeams = allSportsTeams.filter(team => {
    if (!user) return false;
    
    // Check if the current user is the coach by name or email
    const currentTeacher = allTeachers.find(t => t.id === user.uid);
    return team.coach === (currentTeacher?.name || user.displayName || user.email);
  });

  const handleIconGeneration = async () => {
    if (!newTeamDescription) {
        toast({ title: 'Please enter a description first.', variant: 'destructive' });
        return;
    }
    setIsGeneratingIcon(true);
    try {
        const result = await generateTeamIcon({ description: newTeamDescription });
        if (result.icon) {
            setNewTeamIcon(result.icon);
            toast({ title: 'Icon Generated!', description: `We've selected an icon for your team.` });
        } else {
            throw new Error('AI did not return an icon.');
        }
    } catch (e) {
        toast({ title: 'Icon Generation Failed', variant: 'destructive' });
    } finally {
        setIsGeneratingIcon(false);
    }
  }

  const handleCreateTeam = async () => {
    if (!newTeamName || !newTeamCoach || !schoolId) {
        toast({
            title: 'Missing Information',
            description: 'Please fill out all fields to create a team.',
            variant: 'destructive',
        });
        return;
    }

    setIsCreating(true);
    try {
        // Get the selected teacher's name
        const selectedTeacher = allTeachers.find(teacher => teacher.id === newTeamCoach);
        const coachName = selectedTeacher?.name || newTeamCoach;

        const newTeamData = {
            name: newTeamName,
            coach: coachName,
            members: 0,
            icon: newTeamIcon || '🏆', // Default icon if not generated
        };
        await addDoc(collection(firestore, 'schools', schoolId, 'teams'), newTeamData);

        await addDoc(collection(firestore, `schools/${schoolId}/notifications`), {
            title: 'New Team Created',
            description: `A new team, "${newTeamName}", has been created by ${coachName}.`,
            createdAt: serverTimestamp(),
            category: 'General',
            href: `/admin/sports?schoolId=${schoolId}`,
        });

        toast({
            title: 'Team Created!',
            description: `${newTeamName} has been successfully created.`,
        });

        // Reset form
        setNewTeamName('');
        setNewTeamCoach('');
        setNewTeamDescription('');
        setNewTeamIcon('');
    } catch (error) {
        console.error("Error creating team:", error);
        toast({
            title: 'Error',
            description: 'Failed to create the new team. Please try again.',
            variant: 'destructive',
        });
    } finally {
        setIsCreating(false);
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
                        <Select value={newTeamCoach} onValueChange={setNewTeamCoach}>
                            <SelectTrigger id="team-coach">
                                <SelectValue placeholder="Select a teacher" />
                            </SelectTrigger>
                            <SelectContent>
                                {allTeachers.map(teacher => (
                                    <SelectItem key={teacher.id} value={teacher.id}>
                                        {teacher.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="team-description">Description</Label>
                        <Textarea id="team-description" placeholder="e.g., The official school basketball team for inter-school competitions." value={newTeamDescription} onChange={(e) => setNewTeamDescription(e.target.value)} />
                    </div>
                     <div className="space-y-2">
                        <Label>Team Icon</Label>
                        <div className="flex items-center gap-4">
                            <div className="h-16 w-16 text-4xl flex items-center justify-center rounded-lg border bg-muted">
                                {newTeamIcon || '?'}
                            </div>
                            <Button type="button" variant="outline" className="w-full" onClick={handleIconGeneration} disabled={isGeneratingIcon}>
                                {isGeneratingIcon ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Wand2 className="mr-2 h-4 w-4"/>}
                                AI Generate Icon
                            </Button>
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="outline">Cancel</Button>
                    </DialogClose>
                    <DialogClose asChild>
                        <Button onClick={handleCreateTeam} disabled={isCreating}>
                            {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Create Team
                        </Button>
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
        <>
          {sportsTeams.length === 0 ? (
            <div className="text-center py-16">
              <Trophy className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No Teams Found</h3>
              <p className="text-muted-foreground mb-6">
                You are not currently assigned as a coach for any teams.
              </p>
              <Button asChild>
                <Link href={`/teacher/sports?schoolId=${schoolId}`}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Create Your First Team
                </Link>
              </Button>
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
        </>
      )}
    </div>
  );
}

    
