
'use client';

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
import { HelpCircle, LifeBuoy, Send, Book, MessageSquare, Lightbulb, Mail, Phone, Ticket, History, Paperclip, AlertOctagon } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const faqs = [
  {
    question: "How do I reset a parent's password?",
    answer: "Navigate to User Management, find the user, click 'Edit', and use the 'Send Password Reset' option. An email with a reset link will be sent to them.",
  },
  {
    question: 'Can I undo a bulk invoice generation?',
    answer: 'Bulk actions like invoice generation cannot be undone automatically. You would need to manually adjust each student\'s ledger. Please be careful when performing bulk actions.',
  },
    {
    question: 'How do I update the school logo and branding?',
    answer: 'You can manage all branding options, including the logo, colors, and fonts, under the "Branding" tab in the School Settings section.',
  },
];

type TicketStatus = 'Open' | 'In Progress' | 'Resolved' | 'Closed';
type TicketPriority = 'Low' | 'Medium' | 'High' | 'Urgent';

const mockTickets = [
    { id: 'TKT-001', subject: 'Unable to export student list to PDF', category: 'Technical Issue', priority: 'High' as TicketPriority, status: 'In Progress' as TicketStatus, lastUpdate: '2024-07-28' },
    { id: 'TKT-002', subject: 'Feature Request: Add SMS notifications for library books', category: 'Feature Request', priority: 'Medium' as TicketPriority, status: 'Open' as TicketStatus, lastUpdate: '2024-07-27' },
    { id: 'TKT-003', subject: 'Question about billing for Term 2', category: 'Billing', priority: 'Low' as TicketPriority, status: 'Resolved' as TicketStatus, lastUpdate: '2024-07-26' },
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


export default function SupportPage() {
  return (
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
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="ticket-category">Category</Label>
                                <Select>
                                    <SelectTrigger id="ticket-category">
                                        <SelectValue placeholder="Select a category..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="technical">Technical Issue</SelectItem>
                                        <SelectItem value="billing">Billing Question</SelectItem>
                                        <SelectItem value="feature">Feature Request</SelectItem>
                                        <SelectItem value="other">Other</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="ticket-priority">Priority</Label>
                                <Select>
                                    <SelectTrigger id="ticket-priority">
                                        <SelectValue placeholder="Set a priority level..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="low">Low</SelectItem>
                                        <SelectItem value="medium">Medium</SelectItem>
                                        <SelectItem value="high">High</SelectItem>
                                        <SelectItem value="urgent">Urgent</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="ticket-subject">Subject</Label>
                            <Input id="ticket-subject" placeholder="e.g., Unable to export student list" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="ticket-description">Description</Label>
                            <Textarea id="ticket-description" placeholder="Please provide as much detail as possible..." className="min-h-[150px]" />
                        </div>
                        <div className="space-y-2">
                            <Label>Attach Screenshot/File</Label>
                             <div className="flex items-center justify-center w-full">
                                <Label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted/50 hover:bg-muted">
                                    <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center">
                                        <Paperclip className="w-8 h-8 mb-2 text-muted-foreground" />
                                        <p className="mb-2 text-sm text-muted-foreground">Click to upload or drag and drop</p>
                                        <p className="text-xs text-muted-foreground">(Feature coming soon)</p>
                                    </div>
                                    <Input id="dropzone-file" type="file" className="hidden" disabled />
                                </Label>
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button disabled>Submit Ticket</Button>
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
                                    {mockTickets.map(ticket => (
                                        <TableRow key={ticket.id}>
                                            <TableCell className="font-medium">{ticket.id}</TableCell>
                                            <TableCell>{ticket.subject}</TableCell>
                                            <TableCell>{getPriorityBadge(ticket.priority)}</TableCell>
                                            <TableCell>{getStatusBadge(ticket.status)}</TableCell>
                                            <TableCell>{ticket.lastUpdate}</TableCell>
                                        </TableRow>
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
                            <div className="text-sm">
                                <p className="font-semibold">+254 20 123 4567</p>
                                <p className="text-xs text-muted-foreground">Mon-Fri, 8am-5pm</p>
                            </div>
                        </div>
                         <div className="flex items-center gap-3">
                            <Mail className="h-5 w-5 text-muted-foreground"/>
                            <div className="text-sm">
                                <p className="font-semibold">support@edusphere.co.ke</p>
                                <p className="text-xs text-muted-foreground">24/7 Email Support</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Book className="h-5 w-5 text-primary"/>FAQs</CardTitle>
                        <CardDescription>Frequently Asked Questions</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Accordion type="single" collapsible>
                            {faqs.map((faq, index) => (
                                <AccordionItem key={index} value={`item-${index}`}>
                                    <AccordionTrigger>{faq.question}</AccordionTrigger>
                                    <AccordionContent>
                                        {faq.answer}
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>
                    </CardContent>
                </Card>
            </div>
       </div>
    </div>
  );
}
