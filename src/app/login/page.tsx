
import Link from 'next/link';
import Image from 'next/image';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import { GraduationCap } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LoginForm } from './login-form';
import { Suspense } from 'react';

const defaultProfile = {
    name: 'EduSphere Kenya',
    motto: 'Empowering Education for All',
    logoUrl: 'https://picsum.photos/seed/default-logo/200',
    coverImageUrl: 'https://picsum.photos/seed/default-cover/1200/1800',
};


function LoginPageContent() {
    const profile = defaultProfile;

    return (
        <div className="w-full min-h-screen lg:grid lg:grid-cols-2">
            <div className="relative hidden lg:flex flex-col items-center justify-between bg-muted p-8 text-white">
                <Image
                    src={profile.coverImageUrl}
                    alt="School campus"
                    fill
                    className="absolute inset-0 h-full w-full object-cover"
                    data-ai-hint="school campus"
                    priority
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
                            <AvatarImage src={profile.logoUrl} alt={profile.name} />
                            <AvatarFallback>{profile.name.substring(0, 2)}</AvatarFallback>
                        </Avatar>
                    </div>
                    <h1 className="text-3xl font-bold font-headline">{profile.name}</h1>
                    <p className="mt-2 text-lg italic">"{profile.motto}"</p>
                    <p className="text-sm mt-8 text-white/70">© {new Date().getFullYear()} EduSphere. All rights reserved.</p>
                </div>
            </div>
            <div className="flex items-center justify-center p-6 bg-background">
                <div className="mx-auto grid w-full max-w-sm items-center gap-6">
                    <div className="text-center">
                        <h1 className="text-3xl font-bold font-headline text-primary">Sign In</h1>
                        <p className="text-muted-foreground">Enter your credentials to access the portal</p>
                    </div>
                    <Card className="shadow-none border-none">
                        <CardContent className="p-0">
                            <LoginForm />
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

export default function Page() {
    return <Suspense><LoginPageContent /></Suspense>;
}
