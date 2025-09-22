
'use client';

import { ReactNode, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth, AuthContextType, AllowedRole } from '@/context/auth-context';
import { getAuth } from 'firebase/auth';

function AuthChecker({ children, requiredRole }: { children: ReactNode; requiredRole: AllowedRole }) {
  const { user, role, loading, clientReady } = useAuth() as AuthContextType;
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && clientReady && !user && pathname !== '/login' && pathname !== '/' && !pathname.startsWith('/developer/create-dev-account')) {
      router.push('/login');
    }
  }, [loading, clientReady, user, pathname, router]);

  if (loading || !clientReady) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
     if (pathname === '/login' || pathname === '/' || pathname.startsWith('/developer/create-dev-account')) {
        return <>{children}</>;
    }
    return null;
  }
  
  if (role === 'developer' && requiredRole === 'admin') {
    return <>{children}</>;
  }

  if (role !== 'unknown' && role !== requiredRole) {
    return (
      <div className="flex h-screen flex-col items-center justify-center p-8 text-center">
        <h1 className="text-2xl font-bold text-destructive">Access Denied</h1>
        <p className="mt-2 text-muted-foreground">
          Your role is "{role}", but this page requires the "{requiredRole}" role.
        </p>
        <Button
          onClick={() => getAuth().signOut().then(() => router.push('/login'))}
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

export function AuthCheck({ children, requiredRole }: { children: ReactNode; requiredRole: AllowedRole }) {
  return (
    <AuthChecker requiredRole={requiredRole}>
      {children}
    </AuthChecker>
  );
}
