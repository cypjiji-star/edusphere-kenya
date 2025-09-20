
'use client';

import { ReactNode, useEffect, Suspense } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth, AuthContextType, AllowedRole } from '@/context/auth-context';
import { auth } from '@/lib/firebase';

function AuthChecker({ children, requiredRole }: { children: ReactNode; requiredRole: AllowedRole }) {
  const { user, role, loading, clientReady } = useAuth() as AuthContextType;
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Only perform redirects on the client side after initial loading is complete
    if (!loading && clientReady && !user && pathname !== '/login' && pathname !== '/' && !pathname.startsWith('/developer/create-dev-account')) {
      router.push('/login');
    }
  }, [loading, clientReady, user, pathname, router]);

  // While loading auth state or before client has mounted, show a full-page loader
  if (loading || !clientReady) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  // If not logged in, but on a public page, show the content
  if (!user) {
     if (pathname === '/login' || pathname === '/' || pathname.startsWith('/developer/create-dev-account')) {
        return <>{children}</>;
    }
    // For protected routes, this will typically not be reached due to the redirect effect, but serves as a fallback.
    return null;
  }
  
  // If role is determined but does not match, show access denied
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

  // If everything is correct, render the children
  return <>{children}</>;
}


export function AuthCheck({ children, requiredRole }: { children: ReactNode; requiredRole: AllowedRole }) {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>}>
      <AuthChecker requiredRole={requiredRole}>
        {children}
      </AuthChecker>
    </Suspense>
  )
}
