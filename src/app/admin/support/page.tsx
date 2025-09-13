
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
import { HelpCircle, LifeBuoy, Send, Book, MessageSquare, Lightbulb, Mail, Phone } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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

export default function SupportPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="font-headline text-3xl font-bold flex items-center gap-2">
            <HelpCircle className="h-8 w-8 text-primary"/>
            Support & Feedback
        </h1>
        <p className="text-muted-foreground">Get help, report issues, or share your ideas for improving the portal.</p>
      </div>

       <div className="grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2">
                 <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Send className="h-5 w-5 text-primary"/>Submit a Ticket</CardTitle>
                        <CardDescription>Use this form to report a technical issue, ask a question, or provide feedback.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="ticket-category">Category</Label>
                             <Select>
                                <SelectTrigger id="ticket-category">
                                    <SelectValue placeholder="Select a category..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="bug"><Lightbulb className="mr-2"/>Report an Issue</SelectItem>
                                    <SelectItem value="feature"><MessageSquare className="mr-2"/>Suggest a Feature</SelectItem>
                                    <SelectItem value="question"><HelpCircle className="mr-2"/>Ask a Question</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="ticket-subject">Subject</Label>
                            <Input id="ticket-subject" placeholder="e.g., Unable to export student list" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="ticket-description">Description</Label>
                            <Textarea id="ticket-description" placeholder="Please provide as much detail as possible..." className="min-h-[150px]" />
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button disabled>Submit Ticket</Button>
                    </CardFooter>
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
