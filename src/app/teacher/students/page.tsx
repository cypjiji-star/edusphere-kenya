import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, Users } from 'lucide-react';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

// Mock data for teacher's classes
const teacherClasses = [
  { id: "f4-chem", name: "Form 4 - Chemistry", studentCount: 31 },
  { id: "f3-math", name: "Form 3 - Mathematics", studentCount: 28 },
  { id: "f2-phys", name: "Form 2 - Physics", studentCount: 35 },
];

export default function StudentsPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <Tabs defaultValue={teacherClasses[0].id} className="w-full">
        <div className="md:flex md:items-center md:justify-between">
            <div className="mb-4 md:mb-0">
                <h1 className="font-headline text-3xl font-bold">Class & Student Management</h1>
                <p className="text-muted-foreground">Switch between your classes to view student rosters.</p>
            </div>
            <TabsList>
                {teacherClasses.map((cls) => (
                    <TabsTrigger key={cls.id} value={cls.id}>{cls.name}</TabsTrigger>
                ))}
            </TabsList>
        </div>

        {teacherClasses.map((cls) => (
            <TabsContent key={cls.id} value={cls.id}>
                <Card className="mt-6">
                    <CardHeader className="md:flex-row md:items-center md:justify-between">
                        <div>
                            <CardTitle className="font-headline text-2xl">{cls.name}</CardTitle>
                            <CardDescription>
                                A total of {cls.studentCount} students are enrolled in this class.
                            </CardDescription>
                        </div>
                        <Button className="mt-4 md:mt-0">
                            <PlusCircle className="mr-2" />
                            Add New Student
                        </Button>
                    </CardHeader>
                    <CardContent>
                        <div className="flex min-h-[400px] items-center justify-center rounded-lg border-2 border-dashed border-muted">
                            <div className="text-center">
                                <Users className="mx-auto h-12 w-12 text-muted-foreground" />
                                <h3 className="mt-2 text-sm font-medium text-muted-foreground">Student List Coming Soon</h3>
                                <p className="mt-1 text-sm text-muted-foreground">This area will display the roster for {cls.name}.</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
