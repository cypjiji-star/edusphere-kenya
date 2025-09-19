
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
import { ArrowLeft, UserPlus, Shield, Star, Trash2, Search, CalendarPlus, Upload, Save, Trophy, Edit, PlusCircle, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
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
import { firestore } from '@/lib/firebase';
import { collection, doc, onSnapshot, query, where, getDoc, addDoc, updateDoc, deleteDoc, writeBatch, setDoc, getDocs, orderBy, Timestamp } from 'firebase/firestore';
import { useSearchParams } from 'next/navigation';

type TeamDetails = {
  name: string;
  coach: string;
  members?: number;
}

type StudentMember = {
  id: string;
  name: string;
  class: string;
  avatarUrl: string;
  role: 'Member' | 'Captain' | 'Vice-Captain' | 'Treasurer';
};

const ROLES: StudentMember['role'][] = ['Member', 'Captain', 'Vice-Captain', 'Treasurer'];

type TeamEvent = {
    id: string;
    type: string;
    title: string;
    date: Timestamp;
    time: string;
};

type MediaHighlight = {
    id: string;
    type: 'photo' | 'video';
    url: string;
    caption: string;
    date: Timestamp;
};


export default function TeamDetailsClient({ params }: { params: { teamId: string } }) {
  const { teamId } = params;
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const schoolId = searchParams.get('schoolId');

  const [teamDetails, setTeamDetails] = React.useState<TeamDetails | null>(null);
  const [members, setMembers] = React.useState<StudentMember[]>([]);
  const [allStudents, setAllStudents] = React.useState<{id: string; name: string; class: string}[]>([]);
  const [upcomingEvents, setUpcomingEvents] = React.useState<TeamEvent[]>([]);
  const [mediaHighlights, setMediaHighlights] = React.useState<MediaHighlight[]>([]);
  
  const [isLoading, setIsLoading] = React.useState(true);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [newStudentId, setNewStudentId] = React.useState<string>('');

  React.useEffect(() => {
    if (!schoolId) return;

    setIsLoading(true);

    const teamRef = doc(firestore, 'schools', schoolId, 'teams', teamId);
    const unsubTeam = onSnapshot(teamRef, (docSnap) => {
      if (docSnap.exists()) {
        setTeamDetails(docSnap.data() as TeamDetails);
      }
    });

    const membersQuery = query(collection(firestore, 'schools', schoolId, 'teams', teamId, 'members'));
    const unsubMembers = onSnapshot(membersQuery, (snapshot) => {
      const membersData = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      } as StudentMember));
      setMembers(membersData);
      setIsLoading(false);
    });

    const eventsQuery = query(collection(firestore, 'schools', schoolId, 'teams', teamId, 'events'), orderBy('date', 'asc'));
    const unsubEvents = onSnapshot(eventsQuery, snapshot => {
        setUpcomingEvents(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TeamEvent)));
    });

    const mediaQuery = query(collection(firestore, 'schools', schoolId, 'teams', teamId, 'media'), orderBy('date', 'desc'));
    const unsubMedia = onSnapshot(mediaQuery, snapshot => {
        setMediaHighlights(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MediaHighlight)));
    });
    
    const fetchAllStudents = async () => {
        const studentsQuery = query(collection(firestore, 'schools', schoolId, 'students'));
        const studentsSnapshot = await getDocs(studentsQuery);
        const studentsList = studentsSnapshot.docs.map(doc => ({
            id: doc.id,
            name: doc.data().name || 'Unknown Student',
            class: doc.data().class || doc.data().className || 'N/A'
        }));
        setAllStudents(studentsList);
    };
    fetchAllStudents();

    return () => {
        unsubTeam();
        unsubMembers();
        unsubEvents();
        unsubMedia();
    }
  }, [teamId, schoolId]);

  const handleRoleChange = async (studentId: string, newRole: StudentMember['role']) => {
    if (!schoolId) return;
    const memberRef = doc(firestore, 'schools', schoolId, 'teams', teamId, 'members', studentId);
    try {
      await updateDoc(memberRef, { role: newRole });
      toast({
        title: 'Role Updated',
        description: 'The member\'s role has been changed.',
      });
    } catch (e) {
      console.error("Error updating role:", e);
      toast({ variant: 'destructive', title: 'Update Failed'});
    }
  };
  
  const handleRemoveMember = async (studentId: string) => {
    if (!schoolId) return;
     try {
        await deleteDoc(doc(firestore, 'schools', schoolId, 'teams', teamId, 'members', studentId));
        
        const teamRef = doc(firestore, 'schools', schoolId, 'teams', teamId);
        await updateDoc(teamRef, { 
          members: (teamDetails?.members || members.length) - 1 
        });
        
        toast({
            title: 'Member Removed',
            description: 'The student has been removed from the team roster.',
            variant: 'destructive',
        });
     } catch(e) {
        console.error("Error removing member:", e);
        toast({ variant: 'destructive', title: 'Removal Failed'});
     }
  }

  const handleAddStudent = async () => {
    if (!newStudentId || !schoolId) return;
    const student = allStudents.find(s => s.id === newStudentId);
    if (!student) return;

    if (members.some(m => m.id === student.id)) {
        toast({
            title: 'Student Already in Team',
            variant: 'destructive',
        });
        return;
    }

    try {
        const studentDoc = await getDoc(doc(firestore, 'schools', schoolId, 'students', newStudentId));
        if (!studentDoc.exists()) throw new Error("Student document not found");

        const studentData = studentDoc.data();
        const newMemberData = {
            name: studentData.name || student.name,
            class: studentData.class || student.class,
            avatarUrl: studentData.avatarUrl || '',
            role: 'Member',
        };
        
        await setDoc(doc(firestore, 'schools', schoolId, 'teams', teamId, 'members', student.id), newMemberData);
        
        const teamRef = doc(firestore, 'schools', schoolId, 'teams', teamId);
        await updateDoc(teamRef, { 
          members: (teamDetails?.members || members.length) + 1 
        });

        setNewStudentId('');
        toast({
            title: 'Student Added',
            description: `${student.name} has been added to the roster.`,
        });
    } catch(e) {
        console.error("Error adding student:", e);
        toast({ variant: 'destructive', title: 'Failed to add student.' });
    }
  };

  const filteredMembers = members.filter(m => 
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.class.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRoleIcon = (role: StudentMember['role']) => {
    switch(role) {
        case 'Captain': return <Star className="h-4 w-4 text-yellow-500" />;
        case 'Vice-Captain': return <Star className="h-4 w-4 text-gray-400" />;
        case 'Treasurer': return <Shield className="h-4 w-4 text-green-600" />;
        default: return null;
    }
  }

  if (isLoading || !teamDetails) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
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
                    <Link href={`/admin/sports?schoolId=${schoolId}`}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to All Teams
                    </Link>
                </Button>
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
                                    <span className="text-sm font-bold uppercase text-primary">
                                        {event.date.toDate().toLocaleDateString('en-US', { month: 'short' })}
                                    </span>
                                    <span className="text-xl font-bold">
                                        {event.date.toDate().getDate()}
                                    </span>
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
                                    <p className="text-xs text-muted-foreground">
                                        {item.date.toDate().toLocaleDateString()}
                                    </p>
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
        {/* Other Tabs remain unchanged */}
        <TabsContent value="performance">
            <Card>
                <CardHeader>
                    <CardTitle>Performance</CardTitle>
                </CardHeader>
                <CardContent>
                    <p>Performance tracking coming soon.</p>
                </CardContent>
            </Card>
        </TabsContent>
        <TabsContent value="awards">
            <Card>
                <CardHeader>
                    <CardTitle>Awards</CardTitle>
                </CardHeader>
                <CardContent>
                    <p>Awards and recognition coming soon.</p>
                </CardContent>
            </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

