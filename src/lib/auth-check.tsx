
'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, firestore } from '@/lib/firebase';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

type AllowedRole = 'developer' | 'admin' | 'teacher' | 'parent' | 'unknown';

// ✅ Hook: Fetches role from Firestore
export function useUserRole() {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<AllowedRole>('unknown');
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      setUser(authUser);
      if (!authUser) {
        setRole('unknown');
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        // Option 1: Check if user is a global developer
        const devDoc = await getDoc(doc(firestore, 'developers', authUser.uid));
        if (devDoc.exists()) {
          setRole('developer');
          return;
        }

        // Option 2: Check for roles within a specific school, if schoolId is available
        const schoolId = searchParams.get('schoolId');
        if (schoolId) {
          const userDoc = await getDoc(doc(firestore, 'schools', schoolId, 'users', authUser.uid));
          if (userDoc.exists()) {
            setRole(userDoc.data().role?.toLowerCase() as AllowedRole || 'unknown');
          } else {
            setRole('unknown');
          }
        } else if (pathname !== '/login' && pathname !== '/') {
            // If there's no schoolId and we are not on a public page, role is unknown.
            setRole('unknown');
        }

      } catch (err) {
        console.error('Error fetching user role:', err);
        setRole('unknown');
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [pathname, searchParams]);

  return { user, role, loading };
}

// ✅ AuthCheck: Uses the hook above
export function AuthCheck({ children, requiredRole }: { children: ReactNode; requiredRole: AllowedRole }) {
  const { user, role, loading } = useUserRole();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Wait until loading is false before making any decisions
    if (!loading && !user && pathname !== '/login' && pathname !== '/') {
      router.push('/login');
    }
  }, [user, loading, pathname, router]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (user && role !== requiredRole) {
    return (
      <div className="flex h-screen flex-col items-center justify-center p-8 text-center">
        <h1 className="text-2xl font-bold text-destructive">Access Denied</h1>
        <p className="mt-2 text-muted-foreground">
          Your role is "{role}", but this page requires the "{requiredRole}" role.
        </p>
        <Button
          onClick={() => auth.signOut().then(() => router.push('/login'))}
          variant="outline"
          className="mt-4"
        >
          Logout and Sign In Again
        </Button>
      </div>
    );
  }

  // If user is authenticated and has the correct role, or if still loading, render children
  if(user && role === requiredRole) {
    return <>{children}</>;
  }

  // Fallback for when no user is found and we are on a protected route already
  // The useEffect above will handle the redirect.
  return null;
}
