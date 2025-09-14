
'use client';

import { useSearchParams, usePathname } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState, type ReactNode } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, firestore } from './firebase';

type AllowedRole = 'admin' | 'teacher' | 'parent' | 'developer';

export function AuthCheck({
  children,
  requiredRole,
}: {
  children: ReactNode;
  requiredRole: AllowedRole;
}) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      if (authUser) {
        setUser(authUser);
        let fetchedRole: string | null = null;
        
        try {
            // Check for a role in the top-level 'roles' collection first
            const roleDocRef = doc(firestore, 'roles', authUser.uid);
            const roleDocSnap = await getDoc(roleDocRef);
            if (roleDocSnap.exists()) {
                fetchedRole = roleDocSnap.data().role;
            }

            // If not a global role, check for a school-specific role
            if (!fetchedRole) {
                const schoolId = searchParams.get('schoolId');
                if (schoolId) {
                    const userDocRef = doc(firestore, 'schools', schoolId, 'users', authUser.uid);
                    const userDocSnap = await getDoc(userDocRef);
                    if (userDocSnap.exists()) {
                        fetchedRole = userDocSnap.data().role;
                    }
                }
            }
        } catch (error) {
            console.error('Error fetching user role:', error);
        }

        setUserRole(fetchedRole);
      } else {
        setUser(null);
        setUserRole(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [searchParams, pathname]);

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  // Allow access to developer create page without auth
  if (pathname === '/developer/create-dev-account') {
      return <>{children}</>;
  }


  if (user && userRole === requiredRole) {
    return <>{children}</>;
  }

  if (user) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-muted/40 p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle className="flex items-center justify-center gap-2">
              <AlertTriangle className="h-6 w-6 text-destructive" />
              Access Denied
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Your role is listed as "{userRole || 'Unknown'}", but this page requires the "
              {requiredRole}" role.
            </p>
            <Button asChild className="mt-6">
              <Link href="/login">Return to Login</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <CardTitle className="flex items-center justify-center gap-2">
            <AlertTriangle className="h-6 w-6 text-destructive" />
            Authentication Required
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            You must be logged in to access this page.
          </p>
          <Button asChild className="mt-6">
            <Link href="/login">Return to Login</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

    