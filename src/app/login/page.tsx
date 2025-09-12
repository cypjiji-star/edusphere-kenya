import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { GraduationCap } from 'lucide-react';

export default function LoginPage() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-secondary/30 p-4">
       <div className="absolute top-6 left-6">
          <Button asChild variant="outline">
            <Link href="/">
              &larr; Back to Home
            </Link>
          </Button>
        </div>
      <Card className="mx-auto w-full max-w-sm shadow-2xl">
        <CardHeader className="text-center">
          <Link href="/" className="inline-block mx-auto mb-4">
            <GraduationCap className="h-10 w-10 text-primary" />
          </Link>
          <CardTitle className="text-2xl font-headline">Access Your Portal</CardTitle>
          <CardDescription>
            Select your role to log in to the school dashboard.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                required
              />
            </div>
            <div className="grid gap-2">
              <div className="flex items-center">
                <Label htmlFor="password">Password</Label>
                <Link
                  href="#"
                  className="ml-auto inline-block text-sm underline text-muted-foreground hover:text-primary"
                >
                  Forgot your password?
                </Link>
              </div>
              <Input id="password" type="password" required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Button type="submit" asChild>
                <Link href="/teacher">Login as Teacher</Link>
              </Button>
              <Button type="submit" variant="secondary" asChild>
                <Link href="/admin">Login as Admin</Link>
              </Button>
            </div>
          </form>
          <div className="mt-4 text-center text-sm">
            Don't have an account?{' '}
            <Link href="#" className="underline text-muted-foreground hover:text-primary">
              Contact support
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
