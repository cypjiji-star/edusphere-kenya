
'use client';

import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, collection, getDocs, query, where, limit } from 'firebase/firestore';
import { auth, firestore } from '@/lib/firebase';
import { usePathname, useSearchParams } from 'next/navigation';

export type AllowedRole = 'developer' | 'admin' | 'teacher' | 'parent' | 'unknown';

export interface AuthContextType {
  user: User | null;
  role: AllowedRole;
  loading: boolean;
  clientReady: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = React.useState<User | null>(null);
  const [role, setRole] = React.useState<AllowedRole>('unknown');
  const [loading, setLoading] = React.useState(true);
  const [clientReady, setClientReady] = React.useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  useEffect(() => {
    // This effect runs only once on the client after initial mount.
    setClientReady(true);
  }, []);


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
              const userRole = userData.role?.toLowerCase() as AllowedRole;
              if (userRole === 'parent') {
                // If the 'users' collection correctly identifies a parent, we can stop here.
                setRole('parent');
              } else {
                setRole(userRole || 'unknown');
              }
          } else {
             // Fallback for parents who might not have a separate user doc.
             const parentQuery = query(collection(firestore, `schools/${schoolId}/students`), where('parentId', '==', authUser.uid), limit(1));
             const parentSnap = await getDocs(parentQuery);
             if (!parentSnap.empty) {
                setRole('parent');
             } else {
                setRole('unknown');
             }
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
    <AuthContext.Provider value={{ user, role, loading, clientReady }}>
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
