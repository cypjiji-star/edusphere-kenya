import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, Users } from 'lucide-react';

export default function StudentsPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <Card>
        <CardHeader className="md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="font-headline text-2xl">Manage Students</CardTitle>
            <CardDescription>View, add, and manage your student roster.</CardDescription>
          </div>
          <Button className="mt-4 md:mt-0">
            <PlusCircle className="mr-2" />
            Add New Student
          </Button>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 rounded-lg border-2 border-dashed border-muted">
            <div className="text-center">
              <Users className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-sm font-medium text-muted-foreground">No students yet</h3>
              <p className="mt-1 text-sm text-muted-foreground">Click "Add New Student" to build your roster.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
