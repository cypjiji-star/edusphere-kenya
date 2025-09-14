
'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import * as React from 'react';
import Link from 'next/link';

export function LoginForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [role, setRole] = React.useState('admin');
    const [email, setEmail] = React.useState('');
    const [password, setPassword] = React.useState('');
    
    // The schoolId is now primarily read from the URL
    const schoolId = searchParams.get('schoolId');

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        const portalPath = `/${role}`;
        
        // In a real app, you would get a token from your auth provider
        // and would not pass the role in the URL.
        // For this demo, we pass the role and schoolId to simulate an authenticated session.
        if (role === 'developer') {
             router.push(`${portalPath}?role=developer`);
        } else if (schoolId) {
            router.push(`${portalPath}?schoolId=${schoolId}&role=${role}`);
        } else {
            // Handle case where schoolId is required but not provided
            alert('A School ID is required. Please access the login page via your school-specific URL (e.g., /login?schoolId=your-school-id).');
        }
    };

    return (
        <form className="grid gap-4" onSubmit={handleLogin}>
            <div className="grid gap-2">
            <Label htmlFor="email">Email or Login ID</Label>
            <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
            <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
                <div className="grid gap-4">
                <Select value={role} onValueChange={setRole}>
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
                <Button type="submit" className="w-full">
                    Login
                </Button>
            </div>
        </form>
    );
}
