
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

    if (!schoolCode) {
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

      let userDocRef;
      let userRoleCollection = 'users';

      if (role === 'parent') {
        userRoleCollection = 'parents';
      }

      userDocRef = doc(firestore, 'schools', schoolCode, userRoleCollection, user.uid);
      
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists() && userDocSnap.data().role?.toLowerCase() === role) {
        router.push(`/${role}?schoolId=${schoolCode}`);
      } else {
        // If not found, a teacher might be in the general 'users' collection
        if (role === 'teacher' && userRoleCollection !== 'users') {
             userDocRef = doc(firestore, 'schools', schoolCode, 'users', user.uid);
             const generalUserDocSnap = await getDoc(userDocRef);
             if (generalUserDocSnap.exists() && generalUserDocSnap.data().role?.toLowerCase() === role) {
                 router.push(`/${role}?schoolId=${schoolCode}`);
                 return;
             }
        }

        await auth.signOut();
        toast({
          title: 'Access Denied',
          description: "Your credentials are correct, but you do not have access to this school with the selected role.",
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      let title = 'Login Failed';
      let description = 'An unexpected error occurred. Please try again.';

      switch (error.code) {
        case 'auth/user-not-found':
        case 'auth/wrong-password':
        case 'auth/invalid-credential':
          title = 'Invalid Credentials';
          description = 'The email or password you entered is incorrect.';
          break;
        default:
          description = 'Please check your credentials and school code.';
          break;
      }

      toast({
        title,
        description,
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
          required
          value={schoolCode}
          onChange={(e) => setSchoolCode(e.target.value)}
          disabled={isLoading}
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
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="teacher">Teacher</SelectItem>
            <SelectItem value="parent">Parent</SelectItem>
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
