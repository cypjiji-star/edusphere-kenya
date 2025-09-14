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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      setUser(authUser);
      if (!authUser) {
        setRole('unknown');
        setLoading(false);
        return;
      }

      try {
        // Check if user exists in developers collection
        const devDoc = await getDoc(doc(firestore, 'developers', authUser.uid));
        if (devDoc.exists()) {
          setRole('developer');
          setLoading(false);
          return;
        }

        // You can add additional checks here (e.g. school role) if needed
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

// ✅ AuthCheck: Uses the hook above
export function AuthCheck({ children, requiredRole }: { children: ReactNode; requiredRole: AllowedRole }) {
  const { user, role, loading } = useUserRole();
  const router = useRouter();
  const pathname = usePathname();

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
    return null;
  }

  if (role !== requiredRole) {
    return (
      <div className="flex h-screen flex-col items-center justify-center p-8 text-center">
        <h1 className="text-2xl font-bold text-destructive">Access Denied</h1>
        <p className="mt-2 text-muted-foreground">
          Your role is listed as "{role}", but this page requires the "{requiredRole}" role.
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

  return <>{children}</>;
}
