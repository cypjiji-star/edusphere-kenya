
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
import { HelpCircle, LifeBuoy, Send, Book, MessageSquare, Lightbulb, Mail, Phone, Ticket, History, Paperclip, AlertOctagon, Filter, Search, User, Star, TrendingUp, Clock, Smile, X, XCircle, CheckCircle } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose, DialogTrigger } from '@/components/ui/dialog';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { firestore } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, query, onSnapshot, orderBy, where, Timestamp } from 'firebase/firestore';
import { useSearchParams } from 'next/navigation';


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
    category: TicketCategory; 
    priority: TicketPriority; 
    status: TicketStatus; 
    lastUpdate: Timestamp; 
    user: { name: string; avatarUrl: string; };
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
    const [allTickets, setAllTickets] = React.useState<Ticket[]>([]);
    
    // State for new ticket form
    const [category, setCategory] = React.useState<TicketCategory | undefined>();
    const [priority, setPriority] = React.useState<TicketPriority | undefined>();
    const [subject, setSubject] = React.useState('');
    const [description, setDescription] = React.useState('');
    const [attachment, setAttachment] = React.useState<File | null>(null);
    const { toast } = useToast();
    
    // State for filtering ticket dashboard
    const [ticketSearchTerm, setTicketSearchTerm] = React.useState('');
    const [statusFilter, setStatusFilter] = React.useState<'all' | TicketStatus>('all');
    const [priorityFilter, setPriorityFilter] = React.useState<'all' | TicketPriority>('all');
    const [categoryFilter, setCategoryFilter] = React.useState<'all' | TicketCategory>('all');

    React.useEffect(() => {
        if (!schoolId) return;

        const q = query(collection(firestore, 'schools', schoolId, 'support-tickets'), orderBy('lastUpdate', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const tickets = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Ticket));
            setAllTickets(tickets);
        });
        return () => unsubscribe();
    }, [schoolId]);

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
    
    const filteredTickets = React.useMemo(() => {
        return allTickets.filter(ticket => {
            const matchesSearch = ticket.subject.toLowerCase().includes(ticketSearchTerm.toLowerCase()) || ticket.id.toLowerCase().includes(ticketSearchTerm.toLowerCase());
            const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter;
            const matchesPriority = priorityFilter === 'all' || ticket.priority === priorityFilter;
            const matchesCategory = categoryFilter === 'all' || ticket.category === categoryFilter;
            return matchesSearch && matchesStatus && matchesPriority && matchesCategory;
        });
    }, [allTickets, ticketSearchTerm, statusFilter, priorityFilter, categoryFilter]);
    
    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
          setAttachment(event.target.files[0]);
        }
    };
    
    const handleRemoveFile = () => {
        setAttachment(null);
    };

    const handleSubmitTicket = async () => {
        if (!schoolId) {
            toast({ variant: 'destructive', title: 'Error', description: 'School ID not found.' });
            return;
        }

        if (!subject || !description || !category || !priority) {
            toast({
                variant: 'destructive',
                title: 'Missing Information',
                description: 'Please fill out all required fields before submitting.',
            });
            return;
        }

        try {
            await addDoc(collection(firestore, 'schools', schoolId, 'support-tickets'), {
                subject,
                description,
                category,
                priority,
                status: 'Open',
                lastUpdate: serverTimestamp(),
                user: {
                    name: 'Admin User',
                    avatarUrl: 'https://picsum.photos/seed/admin-avatar/100',
                },
                // In a real app, you would upload the attachment to Firebase Storage
            });

            toast({
                title: 'Ticket Submitted!',
                description: 'Our support team will get back to you shortly.',
            });
            
            // Reset form
            setSubject('');
            setDescription('');
            setCategory(undefined);
            setPriority(undefined);
            setAttachment(null);

        } catch(e) {
            console.error(e);
            toast({ variant: 'destructive', title: 'Submission failed.'})
        }
    };
    
    const handleFeedbackSubmit = async () => {
        if (!schoolId) {
            toast({ variant: 'destructive', title: 'Error', description: 'School ID not found.' });
            return;
        }

        if (feedbackRating === 0 && !feedbackText) {
            toast({
                variant: 'destructive',
                title: 'Empty Feedback',
                description: 'Please provide a rating or a comment.',
            });
            return;
        }

        try {
             await addDoc(collection(firestore, 'schools', schoolId, 'feedback'), {
                rating: feedbackRating,
                comment: feedbackText,
                isAnonymous,
                submittedBy: isAnonymous ? 'Anonymous' : 'Admin User',
                submittedAt: serverTimestamp(),
            });

            toast({
                title: 'Feedback Submitted!',
                description: 'Thank you for helping us improve.',
            });

            // Reset form
            setFeedbackRating(0);
            setFeedbackText('');
            setIsAnonymous(false);
        } catch(e) {
            console.error(e);
            toast({ variant: 'destructive', title: 'Could not submit feedback.'});
        }
    };

    if (!schoolId) {
        return <div className="p-8">Error: School ID is missing.</div>;
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

        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                    <TrendingUp className="h-5 w-5 text-primary"/>
                    Analytics & Insights
                </CardTitle>
                <CardDescription>Key metrics from your support tickets and feedback.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Top Issue Category</CardTitle>
                            <Ticket className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">Technical</div>
                            <p className="text-xs text-muted-foreground">Most reported issue type this month</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Avg. Resolution Time</CardTitle>
                            <Clock className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">3.2 hours</div>
                            <p className="text-xs text-muted-foreground">Across all resolved tickets</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Satisfaction Score</CardTitle>
                            <Smile className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">4.6 / 5</div>
                            <p className="text-xs text-muted-foreground">Based on user feedback ratings</p>
                        </CardContent>
                    </Card>
                </div>
            </CardContent>
        </Card>

        <div className="grid gap-8 lg:grid-cols-3">
                <div className="lg:col-span-2 space-y-8">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><Send className="h-5 w-5 text-primary"/>Submit a Ticket</CardTitle>
                            <CardDescription>Use this form to report a technical issue, ask a question, or provide feedback.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="ticket-category">Category</Label>
                                    <Select value={category} onValueChange={(v: TicketCategory) => setCategory(v)}>
                                        <SelectTrigger id="ticket-category">
                                            <SelectValue placeholder="Select a category..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Technical Issue">Technical Issue</SelectItem>
                                            <SelectItem value="Billing">Billing Question</SelectItem>
                                            <SelectItem value="Feature Request">Feature Request</SelectItem>
                                            <SelectItem value="Other">Other</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="ticket-priority">Priority</Label>
                                    <Select value={priority} onValueChange={(v: TicketPriority) => setPriority(v)}>
                                        <SelectTrigger id="ticket-priority">
                                            <SelectValue placeholder="Set a priority level..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Low">Low</SelectItem>
                                            <SelectItem value="Medium">Medium</SelectItem>
                                            <SelectItem value="High">High</SelectItem>
                                            <SelectItem value="Urgent">Urgent</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="ticket-subject">Subject</Label>
                                <Input id="ticket-subject" placeholder="e.g., Unable to export student list" value={subject} onChange={(e) => setSubject(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="ticket-description">Description</Label>
                                <Textarea id="ticket-description" placeholder="Please provide as much detail as possible..." className="min-h-[150px]" value={description} onChange={(e) => setDescription(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label>Attach Screenshot/File</Label>
                                {attachment ? (
                                    <div className="w-full p-4 rounded-lg border bg-muted/50 flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-sm font-medium">
                                            <Paperclip className="h-5 w-5 text-primary" />
                                            <span className="truncate">{attachment.name}</span>
                                        </div>
                                        <Button variant="ghost" size="icon" onClick={handleRemoveFile} className="h-6 w-6">
                                            <X className="h-4 w-4 text-destructive" />
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-center w-full">
                                        <Label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted/50 hover:bg-muted">
                                            <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center">
                                                <Paperclip className="w-8 h-8 mb-2 text-muted-foreground" />
                                                <p className="mb-2 text-sm text-muted-foreground">Click to upload or drag and drop</p>
                                            </div>
                                            <Input id="dropzone-file" type="file" className="hidden" onChange={handleFileChange} />
                                        </Label>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button onClick={handleSubmitTicket}>Submit Ticket</Button>
                        </CardFooter>
                    </Card>
                    
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><History className="h-5 w-5 text-primary"/>Ticket Dashboard</CardTitle>
                            <CardDescription>Track the status of all support tickets submitted across the system.</CardDescription>
                            <div className="mt-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                                <div className="relative w-full md:max-w-sm">
                                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        type="search"
                                        placeholder="Search by keyword or ID..."
                                        className="w-full bg-background pl-8"
                                        value={ticketSearchTerm}
                                        onChange={(e) => setTicketSearchTerm(e.target.value)}
                                    />
                                </div>
                                <div className="flex w-full flex-col gap-2 md:w-auto md:flex-row">
                                    <Select value={statusFilter} onValueChange={(v: 'all' | TicketStatus) => setStatusFilter(v)}>
                                        <SelectTrigger className="w-full md:w-[150px]">
                                            <SelectValue placeholder="Filter by status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Statuses</SelectItem>
                                            <SelectItem value="Open">Open</SelectItem>
                                            <SelectItem value="In Progress">In Progress</SelectItem>
                                            <SelectItem value="Resolved">Resolved</SelectItem>
                                            <SelectItem value="Closed">Closed</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <Select value={priorityFilter} onValueChange={(v: 'all' | TicketPriority) => setPriorityFilter(v)}>
                                        <SelectTrigger className="w-full md:w-[150px]">
                                            <SelectValue placeholder="Filter by priority" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Priorities</SelectItem>
                                            <SelectItem value="Urgent">Urgent</SelectItem>
                                            <SelectItem value="High">High</SelectItem>
                                            <SelectItem value="Medium">Medium</SelectItem>
                                            <SelectItem value="Low">Low</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <Select value={categoryFilter} onValueChange={(v: 'all' | TicketCategory) => setCategoryFilter(v)}>
                                        <SelectTrigger className="w-full md:w-[150px]">
                                            <SelectValue placeholder="Filter by category" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Categories</SelectItem>
                                            <SelectItem value="Technical Issue">Technical Issue</SelectItem>
                                            <SelectItem value="Billing">Billing</SelectItem>
                                            <SelectItem value="Feature Request">Feature Request</SelectItem>
                                            <SelectItem value="Other">Other</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="w-full overflow-auto rounded-lg border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Ticket ID</TableHead>
                                            <TableHead>Subject</TableHead>
                                            <TableHead>Category</TableHead>
                                            <TableHead>Priority</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Last Updated</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredTickets.map(ticket => (
                                            <DialogTrigger asChild key={ticket.id}>
                                                <TableRow className="cursor-pointer" onClick={() => setSelectedTicket(ticket)}>
                                                    <TableCell className="font-medium">{ticket.id.substring(0, 8)}...</TableCell>
                                                    <TableCell>{ticket.subject}</TableCell>
                                                    <TableCell><Badge variant="outline">{ticket.category}</Badge></TableCell>
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
                            <a href="tel:+254201234567" className="flex items-center gap-3 p-2 rounded-md hover:bg-muted">
                                <Phone className="h-5 w-5 text-muted-foreground"/>
                                <div className="text-sm">
                                    <p className="font-semibold">+254 20 123 4567</p>
                                    <p className="text-xs text-muted-foreground">Mon-Fri, 8am-5pm</p>
                                </div>
                            </a>
                            <a href="mailto:support@edusphere.co.ke" className="flex items-center gap-3 p-2 rounded-md hover:bg-muted">
                                <Mail className="h-5 w-5 text-muted-foreground"/>
                                <div className="text-sm">
                                    <p className="font-semibold">support@edusphere.co.ke</p>
                                    <p className="text-xs text-muted-foreground">24/7 Email Support</p>
                                </div>
                            </a>
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
                            <DialogTitle className="text-xl">Ticket: {selectedTicket.id.substring(0, 8)}...</DialogTitle>
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
                                        <p className="font-semibold text-sm">{msg.user}</p>
                                        <p className="text-xs text-muted-foreground">{msg.time}</p>
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
                            <Button variant="outline" size="sm">
                                <Paperclip className="mr-2 h-4 w-4"/>
                                Attach File
                            </Button>
                             <Button>
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
