
'use client';

import { ReactNode, useEffect } from 'react';
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

  useEffect(() => {
    if (!loading && !user && pathname !== '/login' && pathname !== '/' && !pathname.startsWith('/developer/create-dev-account')) {
      router.push('/login');
    }
  }, [loading, user, pathname, router]);

  if (loading || (!user && pathname !== '/login' && pathname !== '/' && !pathname.startsWith('/developer/create-dev-account'))) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    // Allows public pages like /login, /, and /developer/create-dev-account to render
    if (pathname === '/login' || pathname === '/' || pathname.startsWith('/developer/create-dev-account')) {
        return <>{children}</>;
    }
    return null; // Should be redirected by useEffect
  }
  
  if (role !== 'unknown' && role !== requiredRole) {
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
