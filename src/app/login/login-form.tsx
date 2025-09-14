
'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import * as React from 'react';
import Link from 'next/link';
import { auth, firestore } from '@/lib/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

export function LoginForm() {
    const router = useRouter();
    const { toast } = useToast();
    const [role, setRole] = React.useState('admin');
    const [email, setEmail] = React.useState('');
    const [password, setPassword] = React.useState('');
    const [schoolCode, setSchoolCode] = React.useState('');
    const [isLoading, setIsLoading] = React.useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        if (role !== 'developer' && !schoolCode) {
            toast({
                title: 'School Code Required',
                description: 'Please enter your school code to log in.',
                variant: 'destructive',
            });
            setIsLoading(false);
            return;
        }

        try {
            await signInWithEmailAndPassword(auth, email, password);
            
            // On successful sign-in, redirect to the appropriate portal.
            // The AuthCheck component in each portal's layout will handle role verification.
            const portalPath = `/${role}`;
            const queryParams = role === 'developer' ? '' : `?schoolId=${schoolCode}`;
            router.push(portalPath + queryParams);

        } catch (error: any) {
            console.error(error);
            let description = 'Invalid credentials or network error. Please try again.';
            if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
                description = 'The email or password you entered is incorrect.';
            }
            toast({
                title: 'Login Failed',
                description: description,
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form className="grid gap-4" onSubmit={handleLogin}>
            <div className="grid gap-2">
                <Label htmlFor="schoolCode">School Code</Label>
                <Input
                    id="schoolCode"
                    type="text"
                    placeholder="Enter your school's unique code"
                    required={role !== 'developer'}
                    value={schoolCode}
                    onChange={(e) => setSchoolCode(e.target.value)}
                    disabled={role === 'developer' || isLoading}
                />
            </div>
            <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                    id="email"
                    type="email"
                    placeholder="m@example.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
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
                <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} disabled={isLoading} />
            </div>
            <div className="grid gap-4">
                <Select value={role} onValueChange={setRole} disabled={isLoading}>
                    <SelectTrigger>
                        <SelectValue placeholder="Login as..." />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="teacher">Teacher</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="parent">Parent</SelectItem>
                        <SelectItem value="developer">Developer</SelectItem>
                    </SelectContent>
                </Select>
                <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Login
                </Button>
            </div>
        </form>
    );
}
