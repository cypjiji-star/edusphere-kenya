
'use client';

import { ReactNode, useContext } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth, AuthContextType } from '@/context/auth-context';
import { auth } from '@/lib/firebase';

type AllowedRole = 'developer' | 'admin' | 'teacher' | 'parent' | 'unknown';

export function AuthCheck({ children, requiredRole }: { children: ReactNode; requiredRole: AllowedRole }) {
  const { user, role, loading } = useAuth() as AuthContextType;
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
    // Redirect to login if user is not authenticated and not on a public page
    if (pathname !== '/login' && pathname !== '/') {
        router.push('/login');
    }
    return null; // Return null while redirecting
  }
  
  if (role !== requiredRole) {
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

  // If user is authenticated and has the correct role, render children
  return <>{children}</>;
}
