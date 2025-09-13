
import Link from 'next/link';
import Image from 'next/image';
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function LoginPage() {
  return (
    <div className="w-full min-h-screen lg:grid lg:grid-cols-2">
        <div className="relative hidden lg:flex flex-col items-center justify-between bg-muted p-8 text-white">
            <Image
                src="https://picsum.photos/seed/login-bg/1200/1800"
                alt="School campus"
                fill
                className="absolute inset-0 h-full w-full object-cover"
                data-ai-hint="school campus"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-black/30" />
            
            <Link
                href="/"
                className="relative z-20 flex items-center text-lg font-medium"
            >
                <GraduationCap className="h-6 w-6 mr-2" />
                EduSphere Kenya
            </Link>

            <div className="relative z-20 mt-auto text-center">
                 <div className="flex items-center justify-center mb-4">
                    <Avatar className="h-20 w-20 border-4 border-white/50">
                        <AvatarImage src="https://picsum.photos/seed/school-logo/200" alt="School Logo" />
                        <AvatarFallback>SH</AvatarFallback>
                    </Avatar>
                </div>
                <h1 className="text-3xl font-bold font-headline">Welcome to EduSphere High School</h1>
                <p className="mt-2 text-lg italic">"Excellence and Integrity"</p>
                 <p className="text-sm mt-8 text-white/70">© {new Date().getFullYear()} EduSphere. All rights reserved.</p>
            </div>
        </div>
        <div className="flex items-center justify-center p-6 bg-background">
            <div className="mx-auto grid w-full max-w-sm items-center gap-6">
                <div className="text-center">
                    <h1 className="text-3xl font-bold font-headline text-primary">Sign In</h1>
                    <p className="text-muted-foreground">Enter your credentials to access your portal</p>
                </div>
                <Card className="shadow-none border-none">
                    <CardContent className="p-0">
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
                                <Button type="submit" asChild>
                                    <Link href="/admin">Login as Admin</Link>
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
                <div className="mt-4 text-center text-sm">
                    Having trouble logging in?{' '}
                    <Link href="#" className="underline text-muted-foreground hover:text-primary">
                    Contact Support
                    </Link>
                </div>
            </div>
        </div>
    </div>
  );
}
