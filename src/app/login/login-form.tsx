
'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import * as React from 'react';
import Link from 'next/link';

export function LoginForm() {
    const router = useRouter();
    const [role, setRole] = React.useState('/admin');
    const [schoolId, setSchoolId] = React.useState('');

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (schoolId) {
            router.push(`${role}?schoolId=${schoolId}`);
        } else {
            router.push(role);
        }
    };

    return (
        <form className="grid gap-4" onSubmit={handleLogin}>
            <div className="grid gap-2">
                <Label htmlFor="schoolId">School ID</Label>
                <Input
                    id="schoolId"
                    type="text"
                    placeholder="e.g., edusphere-high"
                    required
                    value={schoolId}
                    onChange={(e) => setSchoolId(e.target.value)}
                />
            </div>
            <div className="grid gap-2">
            <Label htmlFor="email">Email or Login ID</Label>
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
                <div className="grid gap-4">
                <Select value={role} onValueChange={setRole}>
                    <SelectTrigger>
                        <SelectValue placeholder="Login as..." />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="/teacher">Teacher</SelectItem>
                        <SelectItem value="/admin">Admin</SelectItem>
                        <SelectItem value="/parent">Parent</SelectItem>
                        <SelectItem value="/developer">Developer</SelectItem>
                    </SelectContent>
                </Select>
                <Button type="submit" className="w-full">
                    Login
                </Button>
            </div>
        </form>
    );
}
