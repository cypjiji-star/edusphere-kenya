
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
import { doc, getDoc } from 'firebase/firestore';
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
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            let finalRedirectPath: string | null = null;

            if (role === 'developer') {
                const devDocRef = doc(firestore, 'developers', user.uid);
                const devDocSnap = await getDoc(devDocRef);
                if (devDocSnap.exists()) {
                    finalRedirectPath = '/developer';
                }
            } else {
                const userDocRef = doc(firestore, 'schools', schoolCode, 'users', user.uid);
                const userDocSnap = await getDoc(userDocRef);

                if (userDocSnap.exists()) {
                    const userData = userDocSnap.data();
                    if (userData.role?.toLowerCase() === role) {
                        finalRedirectPath = `/${role}?schoolId=${schoolCode}`;
                    }
                }
            }

            if (finalRedirectPath) {
                router.push(finalRedirectPath);
            } else {
                 await auth.signOut();
                 toast({
                    title: 'Access Denied',
                    description: "Your credentials are correct, but you do not have access to this school with the selected role.",
                    variant: 'destructive',
                });
            }

        } catch (error: any) {
            console.error("Login Error Code:", error.code);
            let title = 'Login Failed';
            let description = 'An unexpected error occurred. Please try again.';
            
            switch (error.code) {
                case 'auth/user-not-found':
                case 'auth/wrong-password':
                case 'auth/invalid-credential':
                    title = 'Invalid Credentials';
                    description = 'The email or password you entered is incorrect. Please check your credentials and try again.';
                    break;
                case 'auth/invalid-email':
                    title = 'Invalid Email';
                    description = 'The email address you entered is not in a valid format. Please correct it and try again.';
                    break;
                case 'auth/user-disabled':
                    title = 'Account Disabled';
                    description = 'This user account has been disabled. Please contact your administrator.';
                    break;
                case 'auth/too-many-requests':
                    title = 'Too Many Attempts';
                    description = 'Access to this account has been temporarily disabled due to many failed login attempts. You can reset your password or try again later.';
                    break;
                 case 'auth/network-request-failed':
                    title = 'Network Error';
                    description = 'Could not connect to the authentication service. Please check your internet connection.';
                    break;
            }

            toast({
                title: title,
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
