import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, MessageCircle } from 'lucide-react';

export default function MessagingPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <Card>
        <CardHeader className="md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="font-headline text-2xl">Messaging</CardTitle>
            <CardDescription>Communicate with students, parents, and staff.</CardDescription>
          </div>
          <Button className="mt-4 md:mt-0">
            <PlusCircle className="mr-2" />
            New Message
          </Button>
        </CardHeader>
        <CardContent>
          <div className="flex min-h-[400px] items-center justify-center rounded-lg border-2 border-dashed border-muted">
            <div className="text-center">
              <MessageCircle className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-sm font-medium text-muted-foreground">Select a conversation</h3>
              <p className="mt-1 text-sm text-muted-foreground">Your message history will appear here.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
