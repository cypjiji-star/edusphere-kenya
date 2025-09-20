
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { HelpCircle, LifeBuoy, Send, Book, MessageSquare, Lightbulb, Mail, Phone, Ticket, History, Paperclip, AlertOctagon, Filter, Search, User, Star } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose, DialogTrigger } from '@/components/ui/dialog';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { firestore } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, query, onSnapshot, where, Timestamp, orderBy } from 'firebase/firestore';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/auth-context';


const faqs = [
  {
    category: 'User Management',
    questions: [
      {
        question: "How do I reset a parent's or student's password?",
        answer: "Navigate to User Management, find the user, click 'Edit', and use the 'Send Password Reset' option. An email with a reset link will be sent to their registered email address.",
      },
      {
        question: "How do I add a new student or teacher?",
        answer: "From the User Management page, click the 'Create User' button. You can also use the 'Bulk Actions' dropdown to import multiple users from a CSV file.",
      },
    ]
  },
  {
    category: 'Finance',
    questions: [
      {
        question: 'How do I manage the school fee structure?',
        answer: 'Navigate to Fees & Payments > Fee Structure tab. Here you can add, edit, or remove fee categories for different terms and student groups.',
      },
      {
        question: 'Can I undo a bulk invoice generation?',
        answer: 'Bulk actions like invoice generation cannot be undone automatically. You would need to manually adjust each student\'s ledger or contact support for assistance with a bulk reversal. Please be careful when performing bulk actions.',
      },
    ]
  },
  {
    category: 'Academics',
     questions: [
        {
            question: 'How do I update the school timetable?',
            answer: 'You can manage all timetable options, including defining periods and assigning lessons, under the "Timetable" section in the Academics navigation group.',
        },
     ]
  },
  {
    category: 'General',
    questions: [
      {
        question: 'How do I update the school logo and branding?',
        answer: 'You can manage all branding options, including the logo, colors, and fonts, under the "Branding" tab in the School Settings section.',
      },
    ]
  },
];


type TicketStatus = 'Open' | 'In Progress' | 'Resolved' | 'Closed';
type TicketPriority = 'Low' | 'Medium' | 'High' | 'Urgent';
type TicketCategory = 'Technical Issue' | 'Billing' | 'Feature Request' | 'Other';

type Ticket = { 
    id: string; 
    subject: string; 
    priority: TicketPriority; 
    status: TicketStatus; 
    lastUpdate: Timestamp;
};

const mockConversation = [
    { user: 'Admin User', text: 'I am unable to export the student list for Form 4 to PDF. The button is disabled.', time: 'Jul 28, 10:00 AM' },
    { user: 'Support Team', text: 'Thank you for reporting this. We are looking into the issue and will provide an update shortly.', time: 'Jul 28, 10:05 AM' },
];


const getStatusBadge = (status: TicketStatus) => {
    switch (status) {
        case 'Open': return <Badge variant="secondary">Open</Badge>;
        case 'In Progress': return <Badge className="bg-yellow-500 text-white hover:bg-yellow-600">In Progress</Badge>;
        case 'Resolved': return <Badge className="bg-green-600 text-white hover:bg-green-700">Resolved</Badge>;
        case 'Closed': return <Badge variant="outline">Closed</Badge>;
    }
}

const getPriorityBadge = (priority: TicketPriority) => {
    switch (priority) {
        case 'Urgent': return <Badge variant="destructive" className="bg-red-700 hover:bg-red-800"><AlertOctagon className="h-3 w-3 mr-1"/>Urgent</Badge>;
        case 'High': return <Badge variant="destructive">High</Badge>;
        case 'Medium': return <Badge variant="secondary" className="bg-yellow-500 text-white hover:bg-yellow-600">Medium</Badge>;
        case 'Low': return <Badge>Low</Badge>;
    }
}

function StarRating({ rating, setRating }: { rating: number; setRating: (rating: number) => void }) {
    return (
        <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
                <Star
                    key={star}
                    className={cn(
                        'h-6 w-6 cursor-pointer',
                        star <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
                    )}
                    onClick={() => setRating(star)}
                />
            ))}
        </div>
    );
}

export default function SupportPage() {
    const searchParams = useSearchParams();
    const schoolId = searchParams.get('schoolId');
    const [selectedTicket, setSelectedTicket] = React.useState<Ticket | null>(null);
    const [faqSearchTerm, setFaqSearchTerm] = React.useState('');
    const [feedbackRating, setFeedbackRating] = React.useState(0);
    const [feedbackText, setFeedbackText] = React.useState('');
    const [isAnonymous, setIsAnonymous] = React.useState(false);
    const [myTickets, setMyTickets] = React.useState<Ticket[]>([]);
    const { user } = useAuth();
    
    const [subject, setSubject] = React.useState('');
    const [description, setDescription] = React.useState('');
    const { toast } = useToast();

    React.useEffect(() => {
        if (!schoolId || !user) return;
        const parentId = user.uid;
        const q = query(collection(firestore, 'schools', schoolId, 'support-tickets'), where('user.id', '==', parentId), orderBy('lastUpdate', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const tickets = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Ticket));
            setMyTickets(tickets);
        });
        return () => unsubscribe();
    }, [schoolId, user]);
    

    const filteredFaqs = React.useMemo(() => {
        if (!faqSearchTerm) return faqs;
        const lowercasedTerm = faqSearchTerm.toLowerCase();
        
        return faqs.map(category => {
            const filteredQuestions = category.questions.filter(
                q => q.question.toLowerCase().includes(lowercasedTerm) || q.answer.toLowerCase().includes(lowercasedTerm)
            );
            return { ...category, questions: filteredQuestions };
        }).filter(category => category.questions.length > 0);
    }, [faqSearchTerm]);
    
    const handleSubmitTicket = async () => {
        if (!subject || !description) {
            toast({
                variant: 'destructive',
                title: 'Missing Information',
                description: 'Please provide a subject and a description.',
            });
            return;
        }

        if (!schoolId || !user) {
            toast({ variant: 'destructive', title: 'Error', description: 'School ID or user is missing.' });
            return;
        }

        try {
            await addDoc(collection(firestore, `schools/${schoolId}/support-tickets`), {
                subject,
                description,
                category: 'Technical Issue',
                priority: 'Medium',
                status: 'Open',
                lastUpdate: serverTimestamp(),
                user: {
                    id: user.uid,
                    name: user.displayName || 'Parent',
                    avatarUrl: user.photoURL || `https://picsum.photos/seed/${user.uid}/100`,
                }
            });

             toast({
                title: 'Ticket Submitted!',
                description: 'Our support team will get back to you shortly.',
            });

            setSubject('');
            setDescription('');

        } catch (e) {
            console.error(e);
            toast({ variant: 'destructive', title: 'Submission Failed' });
        }
    };
    
    const handleFeedbackSubmit = () => {
        if (feedbackRating === 0 && !feedbackText) {
            toast({
                variant: 'destructive',
                title: 'Empty Feedback',
                description: 'Please provide a rating or a comment.',
            });
            return;
        }
        toast({
            title: 'Feedback Submitted!',
            description: 'Thank you for helping us improve.',
        });
        setFeedbackRating(0);
        setFeedbackText('');
    };

    if (!schoolId) {
        return <div className="p-8">Error: School ID is missing.</div>
    }

    return (
    <Dialog onOpenChange={(open) => !open && setSelectedTicket(null)}>
        <div className="p-4 sm:p-6 lg:p-8 space-y-8">
        <div className="mb-0">
            <h1 className="font-headline text-3xl font-bold flex items-center gap-2">
                <HelpCircle className="h-8 w-8 text-primary"/>
                Support & Feedback
            </h1>
            <p className="text-muted-foreground">Get help, report issues, or share your ideas for improving the portal.</p>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
                <div className="lg:col-span-2 space-y-8">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><Send className="h-5 w-5 text-primary"/>Submit a Ticket</CardTitle>
                            <CardDescription>Use this form to report a technical issue, ask a question, or provide feedback.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="ticket-subject">Subject</Label>
                                <Input id="ticket-subject" placeholder="e.g., Unable to view fee statement" value={subject} onChange={(e) => setSubject(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="ticket-description">Description</Label>
                                <Textarea id="ticket-description" placeholder="Please provide as much detail as possible..." className="min-h-[150px]" value={description} onChange={(e) => setDescription(e.target.value)} />
                            </div>
                             <div className="space-y-2">
                                <Label>Attach Screenshot/File</Label>
                                <div className="flex items-center justify-center w-full">
                                    <Label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted/50 hover:bg-muted">
                                        <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center">
                                            <Paperclip className="w-8 h-8 mb-2 text-muted-foreground" />
                                            <p className="mb-2 text-sm text-muted-foreground">Click to upload or drag and drop</p>
                                        </div>
                                        <Input id="dropzone-file" type="file" className="hidden" disabled />
                                    </Label>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button onClick={handleSubmitTicket}>Submit Ticket</Button>
                        </CardFooter>
                    </Card>
                    
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><History className="h-5 w-5 text-primary"/>My Tickets</CardTitle>
                            <CardDescription>Track the status of your submitted support tickets.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="w-full overflow-auto rounded-lg border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Ticket ID</TableHead>
                                            <TableHead>Subject</TableHead>
                                            <TableHead>Priority</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Last Updated</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {myTickets.map(ticket => (
                                            <DialogTrigger asChild key={ticket.id}>
                                                <TableRow className="cursor-pointer" onClick={() => setSelectedTicket(ticket)}>
                                                    <TableCell className="font-mono text-xs">{ticket.id.substring(0,8)}...</TableCell>
                                                    <TableCell>{ticket.subject}</TableCell>
                                                    <TableCell>{getPriorityBadge(ticket.priority)}</TableCell>
                                                    <TableCell>{getStatusBadge(ticket.status)}</TableCell>
                                                    <TableCell>{ticket.lastUpdate.toDate().toLocaleDateString()}</TableCell>
                                                </TableRow>
                                            </DialogTrigger>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </div>
                <div className="lg:col-span-1 space-y-8">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><LifeBuoy className="h-5 w-5 text-primary"/>Direct Support</CardTitle>
                            <CardDescription>For urgent issues, please contact us directly.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center gap-3">
                                <Phone className="h-5 w-5 text-muted-foreground"/>
                                <p className="font-semibold text-sm">+254 20 123 4567</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <Mail className="h-5 w-5 text-muted-foreground"/>
                                <p className="font-semibold text-sm">support@edusphere.co.ke</p>
                            </div>
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><Lightbulb className="h-5 w-5 text-primary"/>Share Your Feedback</CardTitle>
                            <CardDescription>Have an idea or suggestion? Let us know!</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                             <div className="space-y-2">
                                <Label>How would you rate your experience?</Label>
                                <StarRating rating={feedbackRating} setRating={setFeedbackRating} />
                             </div>
                             <div className="space-y-2">
                                <Label htmlFor="feedback-suggestion">Suggestion / Feedback</Label>
                                <Textarea id="feedback-suggestion" placeholder="What can we improve?" value={feedbackText} onChange={e => setFeedbackText(e.target.value)} />
                             </div>
                             <div className="flex items-center space-x-2">
                                <Switch id="anonymous-feedback" checked={isAnonymous} onCheckedChange={setIsAnonymous} />
                                <Label htmlFor="anonymous-feedback">Submit Anonymously</Label>
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button className="w-full" onClick={handleFeedbackSubmit}>Submit Feedback</Button>
                        </CardFooter>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><Book className="h-5 w-5 text-primary"/>Knowledge Base & FAQs</CardTitle>
                            <CardDescription>Find answers to common questions.</CardDescription>
                            <div className="relative mt-4">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search articles..."
                                    className="w-full bg-background pl-8"
                                    value={faqSearchTerm}
                                    onChange={(e) => setFaqSearchTerm(e.target.value)}
                                />
                            </div>
                        </CardHeader>
                        <CardContent>
                            {filteredFaqs.length > 0 ? (
                                <Accordion type="single" collapsible className="w-full">
                                {filteredFaqs.map((category) => (
                                    <div key={category.category} className="mb-4">
                                        <h4 className="text-sm font-semibold text-muted-foreground mb-2">{category.category}</h4>
                                        {category.questions.map((faq, index) => (
                                            <AccordionItem key={index} value={`${category.category}-${index}`}>
                                                <AccordionTrigger>{faq.question}</AccordionTrigger>
                                                <AccordionContent>
                                                    {faq.answer}
                                                </AccordionContent>
                                            </AccordionItem>
                                        ))}
                                    </div>
                                ))}
                                </Accordion>
                            ) : (
                                <div className="text-center text-muted-foreground py-8">
                                    <p>No articles found matching your search.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
        </div>
        {selectedTicket && (
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <div className="flex items-start justify-between">
                        <div>
                            <DialogTitle className="text-xl">Ticket: {selectedTicket.id}</DialogTitle>
                            <DialogDescription>{selectedTicket.subject}</DialogDescription>
                        </div>
                        <div className="flex items-center gap-2">
                             {getPriorityBadge(selectedTicket.priority)}
                             {getStatusBadge(selectedTicket.status)}
                        </div>
                    </div>
                </DialogHeader>
                <div className="py-4 space-y-6 max-h-[60vh] overflow-y-auto">
                    <div className="space-y-4 pr-4">
                        {mockConversation.map((msg, index) => (
                            <div key={index} className="flex items-start gap-3">
                                <Avatar>
                                    <AvatarImage />
                                    <AvatarFallback>
                                        {msg.user === 'Support Team' ? <HelpCircle/> : <User/>}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="w-full rounded-md border bg-muted/50 p-3">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="font-semibold text-sm">{msg.user}</div>
                                        <div className="text-xs text-muted-foreground">{msg.time}</div>
                                    </div>
                                    <p className="text-sm">{msg.text}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                     <Separator />
                     <div className="space-y-4">
                        <Label htmlFor="reply-textarea" className="font-semibold">Your Reply</Label>
                        <Textarea id="reply-textarea" placeholder="Type your response here..." className="min-h-[120px]" />
                        <div className="flex justify-between items-center">
                            <Button variant="outline" size="sm" disabled>
                                <Paperclip className="mr-2 h-4 w-4"/>
                                Attach File
                            </Button>
                             <Button disabled>
                                <Send className="mr-2 h-4 w-4"/>
                                Send Reply
                            </Button>
                        </div>
                     </div>
                </div>
            </DialogContent>
        )}
        </div>
    </Dialog>
  );
}
