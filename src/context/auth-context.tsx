
      
'use client';

import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, firestore } from '@/lib/firebase';
import { usePathname, useSearchParams } from 'next/navigation';

export type AllowedRole = 'developer' | 'admin' | 'teacher' | 'parent' | 'unknown';

export interface AuthContextType {
  user: User | null;
  role: AllowedRole;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = React.useState<User | null>(null);
  const [role, setRole] = React.useState<AllowedRole>('unknown');
  const [loading, setLoading] = React.useState(true);
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
        const devDoc = await getDoc(doc(firestore, 'developers', authUser.uid));
        if (devDoc.exists()) {
          setRole('developer');
          setLoading(false);
          return;
        }

        const schoolId = searchParams.get('schoolId');
        if (schoolId) {
          const userDocRef = doc(firestore, 'schools', schoolId, 'users', authUser.uid);
          const userDocSnap = await getDoc(userDocRef);

          if (userDocSnap.exists()) {
              const userData = userDocSnap.data();
              setRole(userData.role?.toLowerCase() as AllowedRole || 'unknown');
          } else {
             setRole('unknown');
          }
        } else if (pathname !== '/login' && pathname !== '/') {
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

  return (
    <AuthContext.Provider value={{ user, role, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

    