
'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, firestore } from '@/lib/firebase';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

type AllowedRole = 'developer' | 'admin' | 'teacher' | 'parent' | 'unknown';

export function AuthCheck({ children, requiredRole }: { children: ReactNode, requiredRole: AllowedRole }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<AllowedRole>('unknown');
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const schoolId = searchParams.get('schoolId');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      if (authUser) {
        setUser(authUser);
        let userRole: AllowedRole = 'unknown';

        try {
          if (requiredRole === 'developer') {
            const devDocRef = doc(firestore, 'developers', authUser.uid);
            const devDoc = await getDoc(devDocRef);
            if (devDoc.exists()) {
              userRole = 'developer';
            }
          } else if (schoolId) {
            const userDocRef = doc(firestore, 'schools', schoolId, 'users', authUser.uid);
            const userDoc = await getDoc(userDocRef);
            if (userDoc.exists()) {
              userRole = userDoc.data().role as AllowedRole;
            }
          }
        } catch (error) {
          console.error("Error fetching user role:", error);
        } finally {
          setRole(userRole);
          setLoading(false);
        }

      } else {
        setUser(null);
        setRole('unknown');
        setLoading(false);
        // Redirect to login if not on a public page
        if (pathname !== '/login' && pathname !== '/') {
            router.push('/login');
        }
      }
    });

    return () => unsubscribe();
  }, [requiredRole, schoolId, router, pathname]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
     if (pathname !== '/login' && pathname !== '/') {
        router.push('/login');
     }
     return <>{children}</>;
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

export function useUserRole() {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<AllowedRole>('unknown');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      setUser(authUser);
      if (!authUser) {
        setRole('unknown');
        setLoading(false);
        return;
      }

      try {
        const devDoc = await getDoc(doc(firestore, 'developers', authUser.uid));
        if (devDoc.exists()) {
          setRole('developer');
          setLoading(false);
          return;
        }

        setRole('unknown');
      } catch (err) {
        console.error('Error fetching user role:', err);
        setRole('unknown');
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  return { user, role, loading };
}
