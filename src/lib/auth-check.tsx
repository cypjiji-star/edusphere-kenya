
'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, firestore } from '@/lib/firebase';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

type AllowedRole = 'developer' | 'admin' | 'teacher' | 'parent' | 'unknown';

export function useUserRole() {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<AllowedRole>('unknown');
  const [loading, setLoading] = useState(true);
  const searchParams = useSearchParams();
  const schoolId = searchParams.get('schoolId');
  const pathname = usePathname();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      setUser(authUser);
      if (authUser) {
        setLoading(true);
        // 1. Check for developer role first (global)
        const devDocRef = doc(firestore, 'developers', authUser.uid);
        const devDoc = await getDoc(devDocRef);
        if (devDoc.exists()) {
          setRole('developer');
          setLoading(false);
          return;
        }

        // 2. If not a developer, check for other roles within a school context
        if (schoolId) {
          const userDocRef = doc(firestore, 'schools', schoolId, 'users', authUser.uid);
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            setRole(userDoc.data().role as AllowedRole);
          } else {
            setRole('unknown');
          }
        } else {
            // Not a developer and no schoolId in URL (e.g., on /developer page)
            setRole('unknown');
        }
        setLoading(false);

      } else {
        setUser(null);
        setRole('unknown');
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [schoolId, pathname]);

  return { user, role, loading };
}


export function AuthCheck({ children, requiredRole }: { children: ReactNode, requiredRole: AllowedRole }) {
  const { user, role, loading } = useUserRole();
  const router = useRouter();
  const pathname = usePathname();
  
  useEffect(() => {
    if (!loading && !user && pathname !== '/login' && pathname !== '/') {
        router.push('/login');
    }
  }, [loading, user, pathname, router]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    // Show children on public pages, or redirect from protected ones (handled by useEffect)
    if (pathname === '/login' || pathname === '/') {
        return <>{children}</>;
    }
    return null; // or a loading spinner while redirecting
  }
  
  if (role !== requiredRole) {
    return (
      <div className="flex h-screen flex-col items-center justify-center p-8 text-center">
        <h1 className="text-2xl font-bold text-destructive">Access Denied</h1>
        <p className="mt-2 text-muted-foreground">
          Your role is listed as "{role}", but this page requires the "{requiredRole}" role.
        </p>
        <Button onClick={() => auth.signOut().then(() => router.push('/login'))} variant="outline" className="mt-4">
          Logout and Sign In Again
        </Button>
      </div>
    );
  }

  return <>{children}</>;
}
