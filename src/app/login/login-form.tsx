
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
import { doc, getDoc, collection, query, where, getDocs, DocumentData, updateDoc, serverTimestamp, addDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { logAuditEvent } from '@/lib/audit-log.service';

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

      let userIsAssociatedWithSchool = false;
      let userRole: string | null = null;
      let userName: string = user.displayName || user.email || 'Unknown';

      if (role === 'parent') {
        const studentsQuery = query(collection(firestore, `schools/${schoolCode}/students`), where('parentId', '==', user.uid));
        const studentsSnapshot = await getDocs(studentsQuery);
        if (!studentsSnapshot.empty) {
            userIsAssociatedWithSchool = true;
            userRole = 'parent';
            // Use the parentName from the first child record
            userName = studentsSnapshot.docs[0].data().parentName || userName;
        }
      } else {
        // Logic for Admin and Teacher
        const userDocRef = doc(firestore, 'schools', schoolCode, 'users', user.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            userIsAssociatedWithSchool = true;
            userRole = userData.role?.toLowerCase();
            userName = userData.name || userName;
        }
      }

      if (userIsAssociatedWithSchool && userRole === role) {
        // Update lastLogin timestamp
        const userDocRef = doc(firestore, 'schools', schoolCode, 'users', user.uid);
        if((await getDoc(userDocRef)).exists()) {
          await updateDoc(userDocRef, { lastLogin: serverTimestamp() });
        }

        await logAuditEvent({
            schoolId: schoolCode,
            action: 'USER_LOGIN_SUCCESS',
            actionType: 'Security',
            description: `User ${user.email} successfully logged in as ${role}.`,
            user: { id: user.uid, name: userName, role: role },
        });
        router.push(`/${role}?schoolId=${schoolCode}`);
      } else {
        await auth.signOut();
        toast({
          title: 'Access Denied',
          description: userIsAssociatedWithSchool 
            ? "Your credentials are correct, but you do not have access with the selected role."
            : "This user account is not associated with the provided school code.",
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
      
      await addDoc(collection(firestore, `schools/${schoolCode || 'unknown'}/notifications`), {
        title: 'Failed Login Attempt',
        description: `An unsuccessful login attempt was made for the email: ${email}.`,
        createdAt: serverTimestamp(),
        category: 'Security',
        href: `/admin/logs?schoolId=${schoolCode || 'unknown'}`,
        audience: 'admin'
      });

      await logAuditEvent({
          schoolId: schoolCode || 'unknown',
          action: 'USER_LOGIN_FAILURE',
          actionType: 'Security',
          description: `Failed login attempt for ${email}.`,
          user: { id: 'unknown', name: email, role: 'unknown' },
          details: `Reason: ${description}`,
      });

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
